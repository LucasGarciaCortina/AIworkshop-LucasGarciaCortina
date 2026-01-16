const root = document.getElementById("app");
const incidentEl = document.getElementById("incident");
const tempEl = document.getElementById("temperature");
const maxEl = document.getElementById("maxTokens");
const rawEl = document.getElementById("raw");
const parsedEl = document.getElementById("parsed");
const usageEl = document.getElementById("usage");

const EXAMPLES = [
  "no me deja entrar. pongo la contraseña y se queda cargando. en el movil sí. en el pc no. pantalla blanca. urgent",
  "al crear tarea nueva, a veces se borra el texto si pongo fecha y luego cambio el proyecto",
  "la página de perfil tarda 10 segundos en cargar. ayer iba bien, hoy imposible"
];


document.getElementById("exampleBtn").addEventListener("click", () => {
  incidentEl.value = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
});

document.getElementById("runBtn").addEventListener("click", async () => {
  rawEl.textContent = "";
  parsedEl.textContent = "";
  usageEl.textContent = "";
  const payload = {
    incidentText: incidentEl.value,
    temperature: Number(tempEl.value),
    maxTokens: Number(maxEl.value)
  };

  try {
    const r = await fetch("/api/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    if (!r.ok) throw new Error(`API error:\n${JSON.stringify(data, null, 2)}`);

    rawEl.textContent = data.content || "";

    if (data.usage) {
      usageEl.textContent = `usage: prompt=${data.usage.prompt_tokens}, completion=${data.usage.completion_tokens}, total=${data.usage.total_tokens}`;
    }

    try {
      const obj = JSON.parse(data.content);
      parsedEl.textContent = "✅ JSON.parse OK\n\n" + JSON.stringify(obj, null, 2);
    } catch (e) {
      parsedEl.textContent = "❌ JSON.parse falló\n" + e.message;
    }
  } catch (e) {
    rawEl.textContent = "ERROR:\n" + String(e.message || e);
  }
});

document.getElementById("modelsBtn").addEventListener("click", async () => {
  rawEl.textContent = "";
  parsedEl.textContent = "";
  usageEl.textContent = "";

  try {
    const r = await fetch("/api/models");
    const data = await r.json();
    if (!r.ok) throw new Error(`API error:\n${JSON.stringify(data, null, 2)}`);
    rawEl.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    rawEl.textContent = "ERROR:\n" + String(e.message || e);
  }
});
