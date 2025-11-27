import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { nome, telefone } = body;

    if (!nome || !telefone) {
        return res.status(400).json({ error: "Nome e telefone são obrigatórios." });
    }

    const codigo_hash = crypto.createHash("sha256").update(nome).digest("hex").substring(0, 7);

    const { data, error } = await supabase
      .from("participantes")
      .insert([
        { nome, telefone, codigo_hash } 
      ])
      .select()
      .single();

    if (error) {
        console.error("Erro Supabase:", error);

        if (error.code === '23505') {
            
            if (error.message.includes('nome') || error.details?.includes('nome')) {
                return res.status(409).json({ 
                    error: "⚠️ Já existe alguém com esse nome! Por favor, adicione o sobrenome." 
                });
            }

            if (error.message.includes('telefone') || error.details?.includes('telefone')) {
                return res.status(409).json({ 
                    error: "⚠️ Este telefone já está cadastrado." 
                });
            }
        }

        throw error;
    }

    res.status(200).json({ ok: true, codigo: codigo_hash, data });

  } catch (err) {
    console.error("Erro interno:", err);
    res.status(500).json({ error: err.message || "Erro interno no servidor." });
  }
}