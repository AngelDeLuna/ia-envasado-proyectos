const STAGES = ["Ideas", "En progreso", "Terminado"];

const STAGE_COLOR = {
  "Ideas": "var(--stage-ideas)",
  "En progreso": "var(--stage-progreso)",
  "Terminado": "var(--stage-terminado)",
};

const STAGE_BG = {
  "Ideas": "var(--stage-ideas-bg)",
  "En progreso": "var(--stage-progreso-bg)",
  "Terminado": "var(--stage-terminado-bg)",
};

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new Error(body?.error || body || `Error HTTP ${res.status}`);
  return body;
}

function loadProyectos() {
  return apiFetch("/api/projects", { cache: "no-store" });
}

function loadProyecto(id) {
  return apiFetch(`/api/projects/${encodeURIComponent(id)}`, { cache: "no-store" });
}
