import express from "express";
import { Pool } from "pg";
import crypto from "crypto";
import cors from "cors";
import 'dotenv/config';
import multer from "multer";
import path from "path";
import fs from "fs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_PASSPHRASE = "SUA_SENHA_ULTRA_SECRETA_VAI_AQUI"; 
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(SECRET_PASSPHRASE)).digest('base64').substr(0, 32);
const IV_LENGTH = 16; 

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(String(text));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const uploadDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const hash = req.hashCodigo || Date.now(); 
    cb(null, `foto-${hash}${ext}`);
  }
});
const upload = multer({ storage });

export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false },
});

function shuffle(array) {
  return array.map(e => ({v: e, o: Math.random()}))
              .sort((a,b) => a.o - b.o)
              .map(e => e.v);
}

app.post("/api/registrar", upload.single("foto"), async (req, res) => {
  try {
    const { nome, telefone } = req.body;

    if (!nome || !telefone) {
      return res.status(400).json({ error: "⚠️ Nome e telefone são obrigatórios." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "⚠️ A foto é obrigatória para o sorteio!" });
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");
    const codigo_hash = crypto.createHash("sha256").update(nome).digest("hex").substring(0,7);

    const ext = path.extname(req.file.originalname);
    const newFilename = `foto-${codigo_hash}${ext}`;
    const oldPath = path.join(uploadDir, req.file.filename);
    const newPath = path.join(uploadDir, newFilename);
    
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
    }
    const fotoPath = `/uploads/${newFilename}`;

    const result = await pool.query(
      `INSERT INTO participantes (nome, telefone, codigo_hash, foto)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nome, telefoneLimpo, codigo_hash, fotoPath]
    );

    res.json({ ok: true, codigo: codigo_hash, data: result.rows[0] });

  } catch (err) {
    console.error("Erro no cadastro:", err);

    
    if (err.code === '23505') {
      if (err.constraint === 'unique_nome') {
        return res.status(409).json({ error: "⚠️ Já existe alguém com esse nome! Adicione o sobrenome." });
      }
      if (err.constraint && err.constraint.includes('telefone')) {
        return res.status(409).json({ error: "⚠️ Este telefone já está cadastrado." });
      }
      return res.status(409).json({ error: "⚠️ Usuário já cadastrado." });
    }

    if (err.code === '23502') {
       return res.status(400).json({ error: "⚠️ Dados obrigatórios faltando (foto ou nome)." });
    }

    res.status(500).json({ error: "Erro interno no servidor. Tente novamente." });
  }
});

app.get("/api/participantes", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, nome, telefone, codigo_hash, foto FROM participantes");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/sortear", async (req, res) => {
  const { nome, telefone, codigo } = req.body;

  try {
    const { rows: participantes } = await pool.query("SELECT * FROM participantes");
    const telefoneLimpo = telefone.replace(/\D/g, "");

    const solicitante = participantes.find(p => 
      p.nome.trim().toLowerCase() === nome.trim().toLowerCase() && 
      p.telefone === telefoneLimpo && 
      p.codigo_hash === codigo
    );

    if (!solicitante) return res.status(403).json({ error: "Dados incorretos ou código inválido." });

    const checkSorteio = await pool.query(
      `SELECT * FROM sorteios WHERE participante_id = $1`,
      [solicitante.id]
    );

    if (checkSorteio.rows.length > 0) {
      const registro = checkSorteio.rows[0];
      
      const amigoId = decrypt(registro.amigo_encriptado);
      const amigo = participantes.find(p => p.id.toString() === amigoId);

      return res.json({ 
        ok: true, 
        nome: amigo ? amigo.nome : "Desconhecido",
        foto: amigo ? amigo.foto : null,
        hash: registro.hash_transacao 
      });
    }

    const sorteioGeral = await pool.query("SELECT count(*) FROM sorteios");
    if (parseInt(sorteioGeral.rows[0].count) > 0) {
      return res.status(400).json({ error: "O sorteio já foi realizado e você não estava na lista." });
    }

    if (participantes.length < 2) return res.status(400).json({ error: "Poucos participantes." });

    let listaSorteada;
    let valido = false;
    for(let i=0; i<200; i++) {
        listaSorteada = shuffle(participantes);
        const falha = listaSorteada.some((p, idx) => p.id === participantes[idx].id);
        if (!falha) { valido = true; break; }
    }

    if (!valido) throw new Error("Erro ao gerar combinações válidas.");

    for (let i = 0; i < participantes.length; i++) {
      const pQuemTira = participantes[i];
      const pQuemFoiTirado = listaSorteada[i];

      const idCriptografado = encrypt(pQuemFoiTirado.id);

      const hashTransacao = crypto.createHash("sha256")
        .update(`${pQuemTira.id}-${pQuemFoiTirado.id}-${Date.now()}`)
        .digest("hex");

      await pool.query(
        `INSERT INTO sorteios (participante_id, amigo_encriptado, hash_transacao)
         VALUES ($1, $2, $3)`,
        [pQuemTira.id, idCriptografado, hashTransacao]
      );
    }

    const indiceSolicitante = participantes.findIndex(p => p.id === solicitante.id);
    const meuAmigo = listaSorteada[indiceSolicitante];

    const meuSorteioHash = await pool.query(
        "SELECT hash_transacao FROM sorteios WHERE participante_id = $1", 
        [solicitante.id]
    );

    res.json({ 
        ok: true, 
        nome: meuAmigo.nome,
        foto: meuAmigo.foto, 
        hash: meuSorteioHash.rows[0].hash_transacao
    });

  } catch (err) {
    console.error("Erro no sorteio:", err);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

app.post("/api/resetar", async (req, res) => {
    try {
      await pool.query("TRUNCATE TABLE sorteios");
      res.json({ ok: true, message: "Sorteio resetado!" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));
app.listen(3000, () => console.log("🔥 Backend Blindado rodando na 3000"));