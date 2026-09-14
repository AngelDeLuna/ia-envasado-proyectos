let proyectosCache = [];
let stageMode = 0; // 0 plano, 1 Ideas→Terminado, 2 Terminado→Ideas
let creatorDirection = 0; // 0 sin ordenar, 1 A-Z, 2 Z-A

const boardEl = document.getElementById("board");
const sortBtn = document.getElementById("sortBtn");
const creatorSortBtn = document.getElementById("creatorSortBtn");
const diagEl = document.getElementById("diag");

function cardImageHtml(p) {
  if (p.imagen) {
    return `<img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.nombre)}" onerror="this.closest('.card__image').classList.add('card__image--empty'); this.closest('.card__image').innerHTML='Sin imagen';">`;
  }
  return `<span class="card__image--empty">Sin imagen</span>`;
}

function cardHtml(p) {
  return `
    <div class="card" data-id="${p.id}">
      <div class="card__stripe" style="background:${STAGE_COLOR[p.etapa]}"></div>
      <div class="card__body">
        <h3 class="card__name">${escapeHtml(p.nombre)}</h3>
        <p class="card__dev">${escapeHtml(p.desarrolladoPor) || "Sin asignar"}</p>
        <div class="card__image">${cardImageHtml(p)}</div>
        <div class="card__footer">
          <div class="progress">
            <div class="progress__fill" style="width:${p.avance}%; background:${STAGE_COLOR[p.etapa]}"></div>
            <div class="progress__label">${p.avance}%</div>
          </div>
        </div>
      </div>
    </div>`;
}

function getDisplayList() {
  const list = [...proyectosCache];
  if (creatorDirection) {
    list.sort((a, b) => {
      const aa = (a.desarrolladoPor || "Sin asignar").toLocaleLowerCase("es");
      const bb = (b.desarrolladoPor || "Sin asignar").toLocaleLowerCase("es");
      const result = aa.localeCompare(bb, "es", { sensitivity: "base" });
      return creatorDirection === 1 ? result : -result;
    });
  }
  return list;
}

function renderFlat(list) {
  boardEl.innerHTML = `<div class="grid">${list.map(cardHtml).join("")}</div>`;
}

function renderByStage(list) {
  const order = stageMode === 2 ? [...STAGES].reverse() : STAGES;
  boardEl.innerHTML = order.map(stage => {
    const items = list.filter(p => p.etapa === stage);
    if (!items.length) return "";
    return `
      <div class="stage-heading">
        <span class="stage-heading__bar" style="background:${STAGE_COLOR[stage]}"></span>
        ${stage}<span class="stage-heading__count">(${items.length})</span>
      </div>
      <div class="grid">${items.map(cardHtml).join("")}</div>`;
  }).join("");
}

function render() {
  if (!proyectosCache.length) {
    boardEl.innerHTML = `<p class="state-msg">No hay proyectos registrados en MySQL todavía.</p>`;
    return;
  }
  const list = getDisplayList();
  stageMode ? renderByStage(list) : renderFlat(list);
}

sortBtn.addEventListener("click", () => {
  stageMode = (stageMode + 1) % 3;
  sortBtn.classList.toggle("reversed", stageMode === 2);
  sortBtn.querySelector(".sort-btn__text").textContent =
    stageMode === 0 ? "Ordenar por progreso" : stageMode === 1 ? "Ideas → Terminado" : "Terminado → Ideas";
  render();
});

creatorSortBtn.addEventListener("click", () => {
  creatorDirection = (creatorDirection + 1) % 3;
  creatorSortBtn.classList.toggle("reversed", creatorDirection === 2);
  creatorSortBtn.querySelector(".creator-sort-btn__text").textContent =
    creatorDirection === 0 ? "Ordenar por creador" : creatorDirection === 1 ? "Creador A → Z" : "Creador Z → A";
  render();
});

boardEl.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) window.location.href = `proyecto.html?id=${card.dataset.id}`;
});

async function reloadAndRender() {
  try {
    boardEl.innerHTML = `<p class="state-msg">Cargando proyectos desde MySQL…</p>`;
    proyectosCache = await loadProyectos();
    render();
    if (diagEl) diagEl.textContent = `${proyectosCache.length} proyecto(s) cargados desde MySQL`;
  } catch (err) {
    console.error(err);
    boardEl.innerHTML = `<p class="state-msg">No se pudo conectar con el servidor/MySQL. Revisa que Node.js esté ejecutándose y que el archivo .env tenga los datos correctos.</p>`;
    if (diagEl) diagEl.textContent = err.message;
  }
}

document.getElementById("reloadBtn")?.addEventListener("click", reloadAndRender);
reloadAndRender();
