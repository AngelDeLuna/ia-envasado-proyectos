const detailEl = document.getElementById("detail");
let currentProject = null;
let progressEditing = false;

function paramId() {
  return new URLSearchParams(window.location.search).get("id");
}

function detailImageHtml(p) {
  if (p.imagen) {
    return `<img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.nombre)}" onerror="this.closest('.detail__image').innerHTML='<span class=\'card__image--empty\'>Sin imagen</span>'">`;
  }
  return `<span class="card__image--empty">Sin imagen</span>`;
}

function activityHtml(activity) {
  const done = Boolean(activity.isCompleted);
  return `
    <article class="activity ${done ? "activity--done" : "activity--pending"}" data-activity-id="${activity.id}">
      <div class="activity__top">
        <label class="activity__check-label">
          <input type="checkbox" class="activity__checkbox" ${done ? "checked" : ""}>
          <span class="activity__status-text">${done ? "Realizada" : "No realizada"}</span>
        </label>
      </div>

      <p class="activity__description">${escapeHtml(activity.description)}</p>

      <label class="activity__reason ${done ? "is-hidden" : ""}">
        <span class="activity__reason-label">Motivo / explicación si no se realizó</span>
        <textarea class="activity__reason-input" rows="3" maxlength="3000" placeholder="Explica por qué no se realizó o qué bloqueo hubo...">${escapeHtml(activity.notCompletedReason || "")}</textarea>
      </label>
    </article>`;
}

function weekContentHtml(week) {
  const activities = week?.actividades || [];
  const activitiesHtml = activities.length
    ? `<div class="activity-list">${activities.map(activityHtml).join("")}</div>`
    : `<p class="detail__field-value">No hay actividades registradas esta semana.</p>`;

  return `
    ${activitiesHtml}
    <div class="week-save-row">
      <button class="primary-btn week-save-btn" type="button" data-week-id="${week.id}">Actualizar actividades de la semana</button>
      <span class="week-save-status" aria-live="polite"></span>
    </div>`;
}

function addWeekPanelHtml() {
  return `
    <section class="add-week-panel" id="addWeekPanel">
      <h3>Agregar otra semana</h3>
      <label class="form-field">
        <span>Nombre de la semana</span>
        <input id="newWeekLabel" type="text" maxlength="160" placeholder="Ej. Semana 3 (15-19 sept)">
      </label>
      <div class="form-grid">
        <label class="form-field">
          <span>Fecha inicial</span>
          <input id="newWeekStart" type="date">
        </label>
        <label class="form-field">
          <span>Fecha final</span>
          <input id="newWeekEnd" type="date">
        </label>
      </div>
      <label class="form-field">
        <span>Actividades planeadas</span>
        <textarea id="newWeekActivities" rows="5" placeholder="Escribe una actividad por línea"></textarea>
        <small>Una actividad por línea.</small>
      </label>
      <div class="form-actions">
        <button id="saveNewWeekBtn" class="primary-btn" type="button">Agregar semana</button>
        <button id="cancelNewWeekBtn" class="secondary-btn" type="button">Cancelar</button>
        <span id="newWeekStatus" class="form-status" aria-live="polite"></span>
      </div>
    </section>`;
}

function weeklySectionHtml(p) {
  const weeks = p.semanas || [];
  const lastIdx = Math.max(weeks.length - 1, 0);
  const options = weeks.map((w, i) => `<option value="${i}" ${i === lastIdx ? "selected" : ""}>${escapeHtml(w.label)}</option>`).join("");
  return `
    <div class="weekly-toolbar">
      <select id="weekSelect" class="detail__week-select">
        ${options}
        <option value="__add__">＋ Agregar otra semana</option>
      </select>
    </div>
    <div id="weekContent" class="detail__weekly-content">
      ${weeks.length ? weekContentHtml(weeks[lastIdx]) : `<p class="detail__field-value">Aún no hay semanas registradas.</p>`}
    </div>
    <div id="addWeekHost"></div>`;
}

function stageColorFor(project) {
  return project.avance === 100 ? STAGE_COLOR["Terminado"] : STAGE_COLOR[project.etapa];
}

function stageBgFor(project) {
  return project.avance === 100 ? STAGE_BG["Terminado"] : STAGE_BG[project.etapa];
}

function renderDetail(p) {
  currentProject = p;
  if (Number(p.avance) === 100) p.etapa = "Terminado";
  document.title = `${p.nombre} — IA Envasado Proyectos`;
  const progressColor = Number(p.avance) === 100 ? STAGE_COLOR["Terminado"] : STAGE_COLOR[p.etapa];

  detailEl.innerHTML = `
    <a class="back-link" href="index.html">&larr; Volver a proyectos</a>
    <div id="detailStripe" class="detail__stripe" style="background:${stageColorFor(p)}"></div>
    <h1 class="detail__name">${escapeHtml(p.nombre)}</h1>
    <span id="detailStageBadge" class="detail__stage-badge" style="background:${stageBgFor(p)}; color:${stageColorFor(p)}">${escapeHtml(p.etapa)}</span>

    <div class="detail__image">${detailImageHtml(p)}</div>

    <div class="detail__progress-row">
      <div class="progress-edit-line">
        <div id="detailProgress" class="progress">
          <div id="detailProgressFill" class="progress__fill" style="width:${p.avance}%; background:${progressColor}"></div>
          <div id="detailProgressLabel" class="progress__label">${p.avance}% completado</div>
          <input id="detailProgressInput" class="progress__range progress__range--disabled" type="range" min="0" max="100" step="1" value="${p.avance}" aria-label="Avance del proyecto" disabled>
        </div>
        <button id="progressEditBtn" class="progress-edit-btn" type="button" aria-label="Editar progreso" title="Editar progreso">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-1.79Z"/></svg>
        </button>
      </div>
      <span id="progressSaveStatus" class="progress-edit__status" aria-live="polite"></span>
    </div>

    <div class="detail__grid">
      <div>
        <p class="detail__field-label">Desarrollado por</p>
        <p class="detail__field-value">${escapeHtml(p.desarrolladoPor) || "—"}</p>
      </div>
      <div>
        <p class="detail__field-label">Actividades de la semana</p>
        ${weeklySectionHtml(p)}
      </div>
      <div class="requirements-section">
        <p class="detail__field-label">Requerimientos adicionales</p>
        <p class="detail__field-value">${escapeHtml(p.requerimientos) || "—"}</p>
      </div>
    </div>`;

  const select = document.getElementById("weekSelect");
  if (select) {
    select.addEventListener("change", handleWeekSelect);
  }
}

function handleWeekSelect(e) {
  const value = e.target.value;
  const host = document.getElementById("addWeekHost");

  if (value === "__add__") {
    host.innerHTML = addWeekPanelHtml();
    document.getElementById("saveNewWeekBtn").addEventListener("click", saveNewWeek);
    document.getElementById("cancelNewWeekBtn").addEventListener("click", () => {
      host.innerHTML = "";
      e.target.value = String(Math.max((currentProject.semanas || []).length - 1, 0));
    });
    return;
  }

  host.innerHTML = "";
  const idx = Number(value);
  const week = currentProject.semanas[idx];
  document.getElementById("weekContent").innerHTML = weekContentHtml(week);
}

function syncActivityVisual(card) {
  const checkbox = card.querySelector(".activity__checkbox");
  const statusText = card.querySelector(".activity__status-text");
  const reason = card.querySelector(".activity__reason");
  const done = checkbox.checked;

  statusText.textContent = done ? "Realizada" : "No realizada";
  reason.classList.toggle("is-hidden", done);
  card.classList.toggle("activity--done", done);
  card.classList.toggle("activity--pending", !done);
}

async function saveWeekActivities(button) {
  const weekContent = button.closest("#weekContent");
  const cards = [...weekContent.querySelectorAll(".activity")];
  const status = weekContent.querySelector(".week-save-status");

  for (const card of cards) {
    const checkbox = card.querySelector(".activity__checkbox");
    const reasonInput = card.querySelector(".activity__reason-input");
    if (!checkbox.checked && !reasonInput.value.trim()) {
      status.textContent = "Todas las actividades no realizadas deben tener una explicación.";
      status.className = "week-save-status week-save-status--error";
      reasonInput.focus();
      return;
    }
  }

  button.disabled = true;
  status.textContent = "Guardando…";
  status.className = "week-save-status";

  try {
    await Promise.all(cards.map(async (card) => {
      const id = Number(card.dataset.activityId);
      const checkbox = card.querySelector(".activity__checkbox");
      const reasonInput = card.querySelector(".activity__reason-input");
      const done = checkbox.checked;
      const reason = reasonInput.value.trim();

      await apiFetch(`/api/activities/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          isCompleted: done,
          notCompletedReason: done ? "" : reason,
        }),
      });

      const activity = currentProject?.semanas
        ?.flatMap((week) => week.actividades || [])
        .find((item) => Number(item.id) === id);
      if (activity) {
        activity.isCompleted = done;
        activity.notCompletedReason = done ? null : reason;
      }
    }));

    status.textContent = "Actividades actualizadas en MySQL ✓";
    status.className = "week-save-status week-save-status--ok";
  } catch (err) {
    status.textContent = err.message;
    status.className = "week-save-status week-save-status--error";
  } finally {
    button.disabled = false;
  }
}

function setStageVisual(stage) {
  currentProject.etapa = stage;
  const badge = document.getElementById("detailStageBadge");
  const stripe = document.getElementById("detailStripe");
  const color = STAGE_COLOR[stage];
  const bg = STAGE_BG[stage];
  if (badge) {
    badge.textContent = stage;
    badge.style.color = color;
    badge.style.background = bg;
  }
  if (stripe) stripe.style.background = color;
}

function updateProgressVisual(value) {
  const progress = Math.max(0, Math.min(100, Number(value) || 0));
  const fill = document.getElementById("detailProgressFill");
  const label = document.getElementById("detailProgressLabel");
  const color = progress === 100 ? STAGE_COLOR["Terminado"] : STAGE_COLOR["En progreso"];
  if (fill) {
    fill.style.width = `${progress}%`;
    fill.style.background = color;
  }
  if (label) label.textContent = `${progress}% completado`;
}

function toggleProgressEditor(force) {
  const input = document.getElementById("detailProgressInput");
  const button = document.getElementById("progressEditBtn");
  progressEditing = typeof force === "boolean" ? force : !progressEditing;
  input.disabled = !progressEditing;
  input.classList.toggle("progress__range--disabled", !progressEditing);
  button.classList.toggle("is-active", progressEditing);
  button.setAttribute("aria-pressed", progressEditing ? "true" : "false");
  if (progressEditing) input.focus();
}

async function saveProgress(value) {
  const id = Number(currentProject?.id);
  const progress = Math.max(0, Math.min(100, Number(value) || 0));
  const status = document.getElementById("progressSaveStatus");
  if (!id) return;

  status.textContent = "Guardando…";
  status.className = "progress-edit__status";

  try {
    const result = await apiFetch(`/api/projects/${id}/progress`, {
      method: "PATCH",
      body: JSON.stringify({ progressPercent: progress }),
    });
    currentProject.avance = progress;
    setStageVisual(result.stage || (progress === 100 ? "Terminado" : "En progreso"));
    updateProgressVisual(progress);
    status.textContent = "Guardado en MySQL ✓";
    status.className = "progress-edit__status progress-edit__status--ok";
    toggleProgressEditor(false);
  } catch (err) {
    status.textContent = err.message;
    status.className = "progress-edit__status progress-edit__status--error";
  }
}

async function saveNewWeek() {
  const label = document.getElementById("newWeekLabel").value.trim();
  const startDate = document.getElementById("newWeekStart").value || null;
  const endDate = document.getElementById("newWeekEnd").value || null;
  const activities = document.getElementById("newWeekActivities").value
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  const button = document.getElementById("saveNewWeekBtn");
  const status = document.getElementById("newWeekStatus");

  if (!label) {
    status.textContent = "Escribe el nombre de la semana.";
    status.className = "form-status form-status--error";
    return;
  }
  if (!activities.length) {
    status.textContent = "Agrega al menos una actividad.";
    status.className = "form-status form-status--error";
    return;
  }

  button.disabled = true;
  status.textContent = "Guardando…";
  status.className = "form-status";

  try {
    await apiFetch(`/api/projects/${currentProject.id}/weeks`, {
      method: "POST",
      body: JSON.stringify({ label, startDate, endDate, activities }),
    });
    const project = await loadProyecto(currentProject.id);
    renderDetail(project);
    const select = document.getElementById("weekSelect");
    if (select && project.semanas?.length) {
      select.value = String(project.semanas.length - 1);
      document.getElementById("weekContent").innerHTML = weekContentHtml(project.semanas[project.semanas.length - 1]);
    }
  } catch (err) {
    status.textContent = err.message;
    status.className = "form-status form-status--error";
    button.disabled = false;
  }
}

detailEl.addEventListener("input", (e) => {
  if (e.target.matches("#detailProgressInput")) {
    updateProgressVisual(e.target.value);
    const status = document.getElementById("progressSaveStatus");
    status.textContent = "Cambio pendiente…";
    status.className = "progress-edit__status";
    return;
  }

  if (e.target.matches(".activity__reason-input")) {
    const weekContent = e.target.closest("#weekContent");
    const status = weekContent?.querySelector(".week-save-status");
    if (status) {
      status.textContent = "Cambios pendientes";
      status.className = "week-save-status";
    }
  }
});

detailEl.addEventListener("change", (e) => {
  if (e.target.matches("#detailProgressInput")) {
    saveProgress(e.target.value);
    return;
  }

  if (e.target.matches(".activity__checkbox")) {
    const card = e.target.closest(".activity");
    syncActivityVisual(card);
    const status = card.closest("#weekContent")?.querySelector(".week-save-status");
    if (status) {
      status.textContent = "Cambios pendientes";
      status.className = "week-save-status";
    }
  }
});

detailEl.addEventListener("click", (e) => {
  const progressButton = e.target.closest("#progressEditBtn");
  if (progressButton) {
    toggleProgressEditor();
    return;
  }

  const weekSaveButton = e.target.closest(".week-save-btn");
  if (weekSaveButton) {
    saveWeekActivities(weekSaveButton);
  }
});

async function init() {
  const id = paramId();
  if (!id) {
    detailEl.innerHTML = `<p class="state-msg">Falta el ID del proyecto.</p>`;
    return;
  }
  try {
    const project = await loadProyecto(id);
    renderDetail(project);
  } catch (err) {
    console.error(err);
    detailEl.innerHTML = `<a class="back-link" href="index.html">&larr; Volver a proyectos</a><p class="state-msg">${escapeHtml(err.message)}</p>`;
  }
}

init();
