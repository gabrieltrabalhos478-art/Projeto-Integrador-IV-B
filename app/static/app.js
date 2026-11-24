const citySelect = document.getElementById("citySelect");
const searchInput = document.getElementById("searchInput");
const vaccineSelect = document.getElementById("vaccineSelect");
const quickCitiesEl = document.getElementById("quickCities");
const cityBanner = document.getElementById("cityBanner");
const cityTitle = document.getElementById("cityTitle");
const cityMeta = document.getElementById("cityMeta");
const resultsCount = document.getElementById("resultsCount");
const pointsContainer = document.getElementById("pointsContainer");

const FEATURED_CITIES = ["Maceió", "Arapiraca", "Rio Largo", "Palmeira dos Índios", "Penedo"];

let allCities = [];
let currentPoints = [];

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

async function loadCities() {
  const res = await fetch("/cities");
  allCities = await res.json();

  citySelect.innerHTML = allCities
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join("");

  const maceio = allCities.find((c) => c.name === "Maceió") || allCities[0];

  FEATURED_CITIES.forEach((name) => {
    const city = allCities.find((c) => c.name === name);
    if (!city) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.dataset.cityId = String(city.id);
    btn.textContent = city.name;
    btn.addEventListener("click", () => selectCity(city.id));
    quickCitiesEl.appendChild(btn);
  });

  if (maceio) {
    await selectCity(maceio.id);
  }
}

async function selectCity(cityId) {
  citySelect.value = String(cityId);
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.cityId === String(cityId));
  });

  pointsContainer.innerHTML = `<div class="empty-state">Carregando pontos de vacinação...</div>`;

  const [detailRes, pointsRes] = await Promise.all([
    fetch(`/cities/${cityId}`),
    fetch(`/vaccination-points/${cityId}`),
  ]);

  const detail = await detailRes.json();
  currentPoints = await pointsRes.json();

  cityBanner.style.display = "flex";
  cityTitle.textContent = `${detail.name} — ${detail.state}`;
  cityMeta.textContent = `Código IBGE: ${detail.ibge_code} • ${detail.vaccination_points_count} ponto(s) cadastrado(s)`;

  populateVaccineFilter(currentPoints);
  renderPoints();
}

function populateVaccineFilter(points) {
  const previous = vaccineSelect.value;
  const vaccines = new Set();
  points.forEach((p) => (p.vaccines || []).forEach((v) => vaccines.add(v)));

  const sorted = Array.from(vaccines).sort((a, b) => a.localeCompare(b, "pt-BR"));
  vaccineSelect.innerHTML =
    `<option value="">Todas as vacinas</option>` +
    sorted.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");

  if (sorted.includes(previous)) {
    vaccineSelect.value = previous;
  }
}

function renderPoints() {
  const query = searchInput.value.trim().toLowerCase();
  const vaccineFilter = vaccineSelect.value;

  const filtered = currentPoints.filter((point) => {
    const matchesText =
      !query ||
      (point.name || "").toLowerCase().includes(query) ||
      (point.neighborhood || "").toLowerCase().includes(query) ||
      (point.address || "").toLowerCase().includes(query);
    const matchesVaccine =
      !vaccineFilter || (point.vaccines || []).includes(vaccineFilter);
    return matchesText && matchesVaccine;
  });

  resultsCount.textContent = `Exibindo ${filtered.length} de ${currentPoints.length} ponto(s)`;

  if (filtered.length === 0) {
    pointsContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        Nenhum ponto de vacinação encontrado para os filtros selecionados.
      </div>
    `;
    return;
  }

  pointsContainer.innerHTML = filtered
    .map((p) => {
      const vaccinesHtml =
        p.vaccines && p.vaccines.length > 0
          ? p.vaccines
              .map((v) => `<span class="vaccine-tag">${escapeHtml(v)}</span>`)
              .join("")
          : `<span class="vaccine-tag">Vacinas não informadas</span>`;

      return `
        <article class="card">
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(p.name)}</h3>
            ${p.neighborhood ? `<span class="pill">${escapeHtml(p.neighborhood)}</span>` : ""}
          </div>
          <p class="info-line"><strong>Endereço:</strong> ${escapeHtml(p.address || "Não informado")}</p>
          <p class="info-line"><strong>Telefone:</strong> ${escapeHtml(p.phone || "Não informado")}</p>
          <p class="info-line"><strong>Horário:</strong> ${escapeHtml(p.opening_hours || "Não informado")}</p>
          <div class="vaccines-list">${vaccinesHtml}</div>
        </article>
      `;
    })
    .join("");
}

citySelect.addEventListener("change", (e) => {
  if (e.target.value) selectCity(Number(e.target.value));
});
searchInput.addEventListener("input", renderPoints);
vaccineSelect.addEventListener("change", renderPoints);

loadCities().catch(() => {
  pointsContainer.innerHTML = `<div class="empty-state">Erro ao carregar dados da API.</div>`;
});
