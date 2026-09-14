const form = document.getElementById("projectForm");
const weeksBuilder = document.getElementById("weeksBuilder");
const addWeekBtn = document.getElementById("addWeekBtn");
const statusEl = document.getElementById("formStatus");
const saveBtn = document.getElementById("saveProjectBtn");
let weekCounter = 0;

function weekBlockHtml(number) {
  const id = ++weekCounter;
  return `
    <section class="week-builder" data-week-builder="${id}">
      <div class="week-builder__top">
        <h3>Semana ${number}</h3>
        <button class="icon-text-btn remove-week-btn" type="button">Eliminar semana</button>
      </div>

      <div class="form-grid form-grid--three">
        <label class="form-field">
          <span>Nombre / etiqueta</span>
          <input class="week-label" type="text" maxlength="160" value="Semana ${number}" placeholder="Ej. Semana 1 (15-20 sept)" required>
        </label>
        <label class="form-field">
          <span>Fecha inicial (opcional)</span>
          <input class="week-start" type="date">
        </label>
        <label class="form-field">
          <span>Fecha final (opcional)</span>
          <input class="week-end" type="date">
        </label>
      </div>

      <div class="activities-builder">
        <div class="activities-builder__header">
          <strong>Actividades planeadas</strong>
          <button class="secondary-btn add-activity-btn" type="button">+ Actividad</button>
        </div>
        <div class="activity-builder-list"></div>
      </div>
    </section>`;
}

function activityRowHtml() {
  return `
    <div class="activity-builder-row">
      <textarea class="activity-description" rows="2" maxlength="3000" placeholder="Describe la actividad de esta semana" required></textarea>
      <button class="icon-text-btn remove-activity-btn" type="button">Quitar</button>
    </div>`;
}

function addActivity(weekEl) {
  const list = weekEl.querySelector(".activity-builder-list");
  list.insertAdjacentHTML("beforeend", activityRowHtml());
}

function renumberWeeks() {
  [...weeksBuilder.querySelectorAll(".week-builder")].forEach((week, index) => {
    week.querySelector("h3").textContent = `Semana ${index + 1}`;
    const label = week.querySelector(".week-label");
    if (!label.value.trim() || /^Semana \d+$/.test(label.value.trim())) {
      label.value = `Semana ${index + 1}`;
    }
  });
}

function addWeek() {
  const number = weeksBuilder.querySelectorAll(".week-builder").length + 1;
  weeksBuilder.insertAdjacentHTML("beforeend", weekBlockHtml(number));
  const week = weeksBuilder.lastElementChild;
  addActivity(week);
}

addWeekBtn.addEventListener("click", addWeek);

weeksBuilder.addEventListener("click", (e) => {
  const addActivityBtn = e.target.closest(".add-activity-btn");
  if (addActivityBtn) {
    addActivity(addActivityBtn.closest(".week-builder"));
    return;
  }

  const removeActivityBtn = e.target.closest(".remove-activity-btn");
  if (removeActivityBtn) {
    const week = removeActivityBtn.closest(".week-builder");
    const rows = week.querySelectorAll(".activity-builder-row");
    if (rows.length === 1) {
      rows[0].querySelector(".activity-description").value = "";
    } else {
      removeActivityBtn.closest(".activity-builder-row").remove();
    }
    return;
  }

  const removeWeekBtn = e.target.closest(".remove-week-btn");
  if (removeWeekBtn) {
    const weeks = weeksBuilder.querySelectorAll(".week-builder");
    if (weeks.length === 1) {
      statusEl.textContent = "El proyecto debe conservar al menos una semana.";
      statusEl.className = "form-status form-status--error";
      return;
    }
    removeWeekBtn.closest(".week-builder").remove();
    renumberWeeks();
  }
});

function collectWeeks() {
  return [...weeksBuilder.querySelectorAll(".week-builder")].map((week, index) => ({
    label: week.querySelector(".week-label").value.trim(),
    startDate: week.querySelector(".week-start").value || null,
    endDate: week.querySelector(".week-end").value || null,
    sortOrder: index,
    activities: [...week.querySelectorAll(".activity-description")]
      .map((input) => input.value.trim())
      .filter(Boolean)
      .map((description) => ({ description })),
  }));
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "Creando proyecto…";
  statusEl.className = "form-status";

  const weeks = collectWeeks();
  if (!weeks.length || weeks.some((week) => !week.label || !week.activities.length)) {
    statusEl.textContent = "Cada semana debe tener nombre y al menos una actividad.";
    statusEl.className = "form-status form-status--error";
    return;
  }

  const body = {
    name: document.getElementById("projectName").value,
    creator: document.getElementById("projectCreator").value,
    stage: document.getElementById("projectStage").value,
    progressPercent: Number(document.getElementById("projectProgress").value),
    requirements: document.getElementById("projectRequirements").value,
    imageUrl: document.getElementById("projectImage").value,
    weeks,
  };

  saveBtn.disabled = true;
  try {
    const result = await apiFetch("/api/projects", {
      method: "POST",
      body: JSON.stringify(body),
    });
    statusEl.textContent = "Proyecto creado correctamente. Abriendo plantilla…";
    statusEl.className = "form-status form-status--ok";
    setTimeout(() => {
      window.location.href = `proyecto.html?id=${result.id}`;
    }, 550);
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.className = "form-status form-status--error";
  } finally {
    saveBtn.disabled = false;
  }
});

addWeek();
