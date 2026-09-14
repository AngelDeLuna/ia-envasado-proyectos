const form = document.getElementById("activityForm");
const projectSelect = document.getElementById("projectSelect");
const weekSelect = document.getElementById("weekSelect");
const completedEl = document.getElementById("isCompleted");
const reasonField = document.getElementById("reasonField");
const reasonEl = document.getElementById("notCompletedReason");
const statusEl = document.getElementById("formStatus");
let options = [];

function params() {
  const p = new URLSearchParams(location.search);
  return { project: p.get("project"), week: p.get("week") };
}

function updateReasonState() {
  const done = completedEl.checked;
  reasonField.classList.toggle("is-hidden", done);
  reasonEl.required = !done;
  if (done) reasonEl.value = "";
}

function fillWeeks(projectId, selectedWeek = "") {
  const rows = options.filter((x) => String(x.projectId) === String(projectId));
  weekSelect.innerHTML = rows.length
    ? rows.map((x) => `<option value="${x.weekId}" ${String(x.weekId) === String(selectedWeek) ? "selected" : ""}>${escapeHtml(x.weekLabel)}</option>`).join("")
    : `<option value="">Sin semanas registradas</option>`;
}

async function initOptions() {
  try {
    options = await apiFetch("/api/form-options", { cache: "no-store" });
    const unique = [];
    const seen = new Set();
    for (const row of options) {
      if (!seen.has(row.projectId)) {
        seen.add(row.projectId);
        unique.push(row);
      }
    }
    const pre = params();
    projectSelect.innerHTML = `<option value="">Selecciona un proyecto</option>` + unique.map((x) =>
      `<option value="${x.projectId}" ${String(x.projectId) === String(pre.project) ? "selected" : ""}>${escapeHtml(x.projectName)}</option>`
    ).join("");
    if (pre.project) fillWeeks(pre.project, pre.week);
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.className = "form-status form-status--error";
  }
}

projectSelect.addEventListener("change", () => fillWeeks(projectSelect.value));
completedEl.addEventListener("change", updateReasonState);
updateReasonState();
initOptions();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "Guardando…";
  statusEl.className = "form-status";

  const body = {
    weekId: Number(weekSelect.value),
    description: document.getElementById("description").value,
    createdBy: document.getElementById("createdBy").value,
    isCompleted: completedEl.checked,
    notCompletedReason: reasonEl.value,
  };

  try {
    await apiFetch("/api/activities", {
      method: "POST",
      body: JSON.stringify(body),
    });
    statusEl.textContent = "Actividad guardada correctamente.";
    statusEl.className = "form-status form-status--ok";
    const projectId = projectSelect.value;
    const weekId = weekSelect.value;
    form.reset();
    projectSelect.value = projectId;
    fillWeeks(projectId, weekId);
    updateReasonState();
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.className = "form-status form-status--error";
  }
});
