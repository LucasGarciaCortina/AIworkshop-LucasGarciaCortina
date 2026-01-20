const root = document.getElementById("app");
const incidentEl = document.getElementById("incident");
const reportIdEl = document.getElementById("reportId");
const reportDateEl = document.getElementById("reportDate");
const reportLocationEl = document.getElementById("reportLocation");
const rawEl = document.getElementById("raw");
const parsedEl = document.getElementById("parsed");
const usageEl = document.getElementById("usage");
const anomaliesContainerEl = document.getElementById("anomalies-container");
const anomaliesCardEl = document.getElementById("anomalies-card");
const resultsCardEl = document.querySelector(".results-card");

const EXAMPLES = [
  "Oficial respondió a llamada de disturbio doméstico en calle Principal 456. Víctima reporta empujones y gritos. Oficial no documentó lesiones visibles. Arrestado sin lectura de derechos. Testigo menciona arma de fuego pero no aparece en reporte.",
  "Robo en tienda de conveniencia, 23:45 horas. Empleado reporta pérdida de $150 en efectivo. Cámaras de seguridad no funcionaban 'desde hace una semana'. No se tomaron fotos de la escena. Oficial llegó 2 horas después de la llamada.",
  "Accidente vehicular con 2 autos, sin heridos reportados. Conductor A olía a alcohol según oficial, pero no se realizó prueba de alcoholemia. Policía escribió fecha incorrecta del incidente. Ambos vehículos abandonados en el lugar sin remolque solicitado."
];

// Manejador de tabs
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const tab = e.target.dataset.tab;
    
    // Desactivar todos los tabs y panes
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    
    // Activar el tab seleccionado
    e.target.classList.add("active");
    document.getElementById(tab).classList.add("active");
  });
});

document.getElementById("exampleBtn").addEventListener("click", () => {
  incidentEl.value = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
});

document.getElementById("runBtn").addEventListener("click", async () => {
  rawEl.textContent = "";
  parsedEl.textContent = "";
  usageEl.textContent = "";
  anomaliesContainerEl.innerHTML = "";
  
  const payload = {
    reportId: reportIdEl.value,
    reportDate: reportDateEl.value,
    reportLocation: reportLocationEl.value,
    incidentText: incidentEl.value
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
    
    // Mostrar resultados
    resultsCardEl.classList.add("show");
    document.querySelector(".tab-btn[data-tab='raw']").classList.add("active");
    document.getElementById("raw").classList.add("active");

    if (data.usage) {
      const totalTokens = data.usage.total_tokens || 0;
      const costEstimate = (totalTokens / 1000000 * 0.13).toFixed(4); // Aproximado para Cerebras
      usageEl.innerHTML = `
        <strong>📊 Tokens utilizados:</strong> Prompt: ${data.usage.prompt_tokens} | Completion: ${data.usage.completion_tokens} | Total: ${data.usage.total_tokens}
      `;
    }

    try {
      const obj = JSON.parse(data.content);
      parsedEl.textContent = JSON.stringify(obj, null, 2);
      
      // Renderizar incidencias como cards
      renderAnomalies(obj);
    } catch (e) {
      parsedEl.textContent = "❌ JSON.parse falló\n" + e.message;
    }
  } catch (e) {
    rawEl.textContent = "ERROR:\n" + String(e.message || e);
    resultsCardEl.classList.add("show");
  }
});

function renderAnomalies(obj) {
  anomaliesContainerEl.innerHTML = "";
  
  if (!obj.anomalies || !Array.isArray(obj.anomalies) || obj.anomalies.length === 0) {
    anomaliesContainerEl.innerHTML = '<p style="color: #666; font-style: italic; padding: 20px; text-align: center;">✓ No se detectaron anomalías</p>';
    anomaliesCardEl.classList.add("show");
    return;
  }
  
  obj.anomalies.forEach((anomaly, index) => {
    const severity = anomaly.severity?.toLowerCase() || "low";
    const severityLabel = { "high": "Alto", "medium": "Medio", "low": "Bajo" }[severity] || "Bajo";
    const severityClass = `severity-${severity}`;
    
    const card = document.createElement("div");
    card.className = `anomaly-card ${severityClass}`;
    card.innerHTML = `
      <div class="anomaly-header">
        <span class="anomaly-number">Anomalía #${index + 1}</span>
        <span class="anomaly-severity">${severityLabel}</span>
      </div>
      <div class="anomaly-detail"><strong>Descripción:</strong> ${anomaly.detail || "(sin descripción)"}</div>
    `;
    anomaliesContainerEl.appendChild(card);
  });
  
  anomaliesCardEl.classList.add("show");
}
