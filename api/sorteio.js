import { pool } from "./_db.js";

function shuffle(array) {
  return array.map(e => ({v: e, o: Math.random()}))
              .sort((a,b) => a.o - b.o)
              .map(e => e.v);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { nome, telefone, codigo } = body;

  try {
    const { rows: participantes } = await pool.query("SELECT * FROM participantes");

    const solicitante = participantes.find(p => 
      p.nome === nome && 
      p.telefone === telefone && 
      (p.codigo === codigo || p.codigo_hash === codigo) 
    );

    if (!solicitante) {
      return res.status(403).json({ error: "Dados incorretos ou participante não encontrado." });
    }

    if (solicitante.amigo) {
      return res.json({ ok: true, nome: solicitante.amigo });
    }

    const sorteioJaOcorreu = participantes.some(p => p.amigo !== null);
    
    if (sorteioJaOcorreu) {
      return res.status(400).json({ error: "O sorteio já ocorreu, mas você não estava incluído. Contate o admin." });
    }

    if (participantes.length < 2) {
      return res.status(400).json({ error: "Poucos participantes para realizar o sorteio." });
    }

    let listaSorteada;
    let valido = false;
    
    for(let i=0; i<100; i++) {
        listaSorteada = shuffle(participantes);
        const alguemTirouSiMesmo = listaSorteada.some((p, idx) => p.id === participantes[idx].id);
        if (!alguemTirouSiMesmo) {
            valido = true;
            break;
        }
    }

    if (!valido) throw new Error("Falha ao gerar combinação válida. Tente novamente.");

    for (let i = 0; i < participantes.length; i++) {
      const pOriginal = participantes[i];
      const pAmigo = listaSorteada[i];

      await pool.query(
        "UPDATE participantes SET amigo=$1 WHERE id=$2",
        [pAmigo.nome, pOriginal.id]
      );
    }

    const indiceSolicitante = participantes.indexOf(solicitante);
    const meuAmigoSecreto = listaSorteada[indiceSolicitante];

    res.json({ ok: true, nome: meuAmigoSecreto.nome });

  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
}