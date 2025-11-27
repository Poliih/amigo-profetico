import { Pool } from "pg";
import crypto from "crypto";
import 'dotenv/config';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const SECRET_PASSPHRASE = "SUA_SENHA_ULTRA_SECRETA_VAI_AQUI"; 

const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(SECRET_PASSPHRASE)).digest('base64').substr(0, 32);

function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false },
});

async function auditar() {
  console.log("🕵️  INICIANDO AUDITORIA DO SORTEIO...\n");

  try {
    const { rows: participantes } = await pool.query("SELECT * FROM participantes");
    const { rows: sorteios } = await pool.query("SELECT * FROM sorteios");

    console.log(`📊 Total de Participantes: ${participantes.length}`);
    console.log(`🎟️  Total de Sorteios Feitos: ${sorteios.length}`);

    if (participantes.length !== sorteios.length) {
      console.error("❌ ERRO GRAVE: O número de sorteios não bate com o de participantes!");
    }

    const quemTirou = new Set();
    const quemFoiTirado = new Set();
    let erros = 0;

    for (const s of sorteios) {
      const idQuemTirou = s.participante_id;
      
      let idAmigo;
      try {
          idAmigo = parseInt(decrypt(s.amigo_encriptado));
      } catch (e) {
          console.error(`❌ ERRO: Não foi possível descriptografar o sorteio do ID ${idQuemTirou}. A senha mudou?`);
          erros++;
          continue;
      }

      if (idQuemTirou === idAmigo) {
        console.error(`❌ ERRO: O ID ${idQuemTirou} tirou a si mesmo!`);
        erros++;
      }

      if (quemTirou.has(idQuemTirou)) {
        console.error(`❌ ERRO: O ID ${idQuemTirou} sorteou mais de uma vez!`);
        erros++;
      }
      if (quemFoiTirado.has(idAmigo)) {
        console.error(`❌ ERRO: O ID ${idAmigo} foi tirado por mais de uma pessoa!`);
        erros++;
      }

      quemTirou.add(idQuemTirou);
      quemFoiTirado.add(idAmigo);
    }

    console.log("\n--- RESULTADO FINAL ---");

    if (erros === 0 && participantes.length === sorteios.length) {
      console.log("✅ SUCESSO TOTAL! O sorteio está matematicamente perfeito.");
      console.log("1. Todos participaram.");
      console.log("2. Ninguém tirou a si mesmo.");
      console.log("3. Ninguém foi repetido.");
      console.log("4. O círculo está fechado.");
    } else {
      console.log(`❌ FRACASSO: Encontrados erros no sorteio.`);
    }

  } catch (err) {
    console.error("Erro na auditoria:", err);
  } finally {
    pool.end();
  }
}

auditar();