import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json({ limit: "1mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

const PORT = Number(process.env.PORT || 3000);
const CEREBRAS_BASE_URL = process.env.CEREBRAS_BASE_URL || "https://api.cerebras.ai/v1";
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || "llama-3.3-70b";
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;

// Endpoint principal: ticketify (devuelve JSON en texto, y el front lo parsea)
app.post("/api/ticket", async (req, res) => {
  try {
    if (!CEREBRAS_API_KEY) {
      return res.status(500).json({ error: "Missing CEREBRAS_API_KEY" });
    }

    const { incidentText = "", temperature = 0.2, maxTokens = 350 } = req.body ?? {};
    if (!incidentText.trim()) {
      return res.status(400).json({ error: "incidentText is required" });
    }

    
    
    const system = `
Devuelve SOLO JSON válido (sin markdown, sin texto extra).
Idioma: español.
NO inventes datos.
Tarea
Esquema JSON obligatorio de salida:
{
    "id": "string",
    "summary": "string"

}
`.trim();

    const user = `Texto a analizar:\n${incidentText}`;

    const payload = {
      model: CEREBRAS_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      response_format: { type: "json_object" }
    };

    const r = await fetch(`${CEREBRAS_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CEREBRAS_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    const content = data?.choices?.[0]?.message?.content ?? "";
    res.json({
      model: data?.model ?? CEREBRAS_MODEL,
      content,
      usage: data?.usage ?? null // prompt_tokens / completion_tokens / total_tokens
    });
  } catch (err) {
    res.status(500).json({ error: "Ticket generation failed", details: err?.message ?? String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
