const geoExpanded = document.getElementById("geoExpanded");
const geoCompact = document.getElementById("geoCompact");
const geoSummaryText = document.getElementById("geoSummaryText");
const geoBtn = document.getElementById("geoBtn");
const skipGeoBtn = document.getElementById("skipGeoBtn");
const changeGeoBtn = document.getElementById("changeGeoBtn");
const cepInput = document.getElementById("cepInput");
const cepBtn = document.getElementById("cepBtn");
const geoStatus = document.getElementById("geoStatus");

const modeMunicipalBtn = document.getElementById("modeMunicipalBtn");
const modeStateBtn = document.getElementById("modeStateBtn");
const cityField = document.getElementById("cityField");
const neighborhoodField = document.getElementById("neighborhoodField");
const citySelect = document.getElementById("citySelect");
const neighborhoodSelect = document.getElementById("neighborhoodSelect");
const searchLabel = document.getElementById("searchLabel");
const searchInput = document.getElementById("searchInput");
const vaccineSelect = document.getElementById("vaccineSelect");
const sortSelect = document.getElementById("sortSelect");
const quickCitiesEl = document.getElementById("quickCities");
const favOnlyCheck = document.getElementById("favOnlyCheck");
const favCountEl = document.getElementById("favCount");
const confirmSearchBtn = document.getElementById("confirmSearchBtn");

const resultsSection = document.getElementById("resultsSection");
const nearestSection = document.getElementById("nearestSection");
const nearestTitle = document.getElementById("nearestTitle");
const nearestBody = document.getElementById("nearestBody");
const focusPointBtn = document.getElementById("focusPointBtn");
const cityBanner = document.getElementById("cityBanner");
const cityTitle = document.getElementById("cityTitle");
const cityMeta = document.getElementById("cityMeta");
const resultsCount = document.getElementById("resultsCount");
const pointsContainer = document.getElementById("pointsContainer");

const routePointName = document.getElementById("routePointName");
const routePointAddress = document.getElementById("routePointAddress");
const modalTimesGrid = document.getElementById("modalTimesGrid");
const timeWalk = document.getElementById("timeWalk");
const timeCar = document.getElementById("timeCar");
const timeBike = document.getElementById("timeBike");
const timeTransit = document.getElementById("timeTransit");
const googleMapsLink = document.getElementById("googleMapsLink");
const portalToast = document.getElementById("portalToast");

const FEATURED_CITIES = ["Maceió", "Arapiraca", "Rio Largo", "Palmeira dos Índios", "Penedo"];
const VISIBLE_VACCINES_LIMIT = 4;
const FAVORITES_KEY = "alagoas_vacina_favorites";
const GEO_DONE_KEY = "alagoas_geo_done";

let allCities = [];
let searchScope = "municipal"; // "municipal" | "state"
let currentCityDetail = null;
let currentPoints = [];
let userLocation = null; // { lat, lng, label }
let selectedPointId = null;

let map = null;
let markersLayer = null;

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function showToast(msg, isError = false) {
  portalToast.textContent = msg;
  portalToast.className = `toast show${isError ? " error" : ""}`;
  setTimeout(() => {
    portalToast.className = "toast";
  }, 3000);
}

function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveFavorites(favSet) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favSet)));
  } catch {}
  favCountEl.textContent = String(favSet.size);
}

function collapseGeoStep(summary) {
  geoExpanded.style.display = "none";
  geoCompact.style.display = "flex";
  geoSummaryText.textContent = summary;
}

function expandGeoStep() {
  geoExpanded.style.display = "block";
  geoCompact.style.display = "none";
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

function formatDurationMinutes(km, speedKmh) {
  const mins = Math.max(1, Math.round((km / speedKmh) * 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function initMap() {
  if (typeof window.L === "undefined") {
    document.getElementById("map").innerHTML =
      `<div class="empty-state" style="height:100%; display:flex; align-items:center; justify-content:center;">Mapa indisponível offline. Use a lista abaixo e o botão "Abrir rota no Google Maps".</div>`;
    return;
  }
  map = window.L.map("map").setView([-9.6658, -35.7353], 12);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
    maxZoom: 19,
  }).addTo(map);
  markersLayer = window.L.layerGroup().addTo(map);
}

function updateMapMarkers(points, shouldFitBounds = true) {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();

  const bounds = [];
  points.forEach((p) => {
    if (p.latitude == null || p.longitude == null) return;
    const isSelected = p.id === selectedPointId;
    const marker = window.L.circleMarker([p.latitude, p.longitude], {
      radius: isSelected ? 11 : 6,
      color: isSelected ? "#FFFFFF" : "#003875",
      weight: isSelected ? 3 : 1.5,
      fillColor: isSelected ? "#004A99" : "#38BDF8",
      fillOpacity: isSelected ? 1 : 0.85,
    }).addTo(markersLayer);

    const labelPrefix = isSelected ? "Posto selecionado: " : "";
    marker.bindPopup(
      `<strong>${labelPrefix}${escapeHtml(p.name)}</strong><br>${escapeHtml(p.address || "")}`,
      { autoPan: false }
    );
    if (isSelected) {
      marker.openPopup();
    }
    marker.on("click", () => selectPoint(p.id, false));
    if (p.longitude < -35.0) {
      bounds.push([p.latitude, p.longitude]);
    }
  });

  if (shouldFitBounds && bounds.length > 0 && !selectedPointId) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }
}

function selectPoint(pointId, scrollToMap = true) {
  const point = currentPoints.find((p) => p.id === pointId);
  if (!point) return;

  selectedPointId = pointId;
  if (focusPointBtn) {
    focusPointBtn.style.display = "inline-flex";
  }
  routePointName.textContent = point.name;
  routePointAddress.textContent =
    [point.address, point.neighborhood, point.city_name].filter(Boolean).join(" — ") ||
    "Endereço não informado";

  const hasCoords = point.latitude != null && point.longitude != null;
  if (hasCoords) {
    const dest = `${point.latitude},${point.longitude}`;
    // Só fixa origin no Google Maps quando o usuário informou um CEP/endereço manualmente;
    // caso contrário, deixa o próprio Google Maps usar "Seu local" em tempo real.
    const originParam =
      userLocation && userLocation.fromAddress
        ? `&origin=${userLocation.lat},${userLocation.lng}`
        : "";
    googleMapsLink.href = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${dest}`;
    googleMapsLink.style.display = "inline-flex";
  } else {
    googleMapsLink.style.display = "none";
  }

  if (userLocation && hasCoords) {
    const km = haversineKm(
      userLocation.lat,
      userLocation.lng,
      point.latitude,
      point.longitude
    );
    timeWalk.textContent = formatDurationMinutes(km, 5);
    timeCar.textContent = formatDurationMinutes(km, 35);
    timeBike.textContent = formatDurationMinutes(km, 15);
    timeTransit.textContent = formatDurationMinutes(km, 22);
    modalTimesGrid.style.display = "grid";
  } else {
    modalTimesGrid.style.display = "none";
  }

  renderPoints(false);
  if (map && hasCoords) {
    setTimeout(() => {
      map.invalidateSize();
      map.setView([point.latitude, point.longitude], 17, { animate: false });
    }, 80);
  }
  if (scrollToMap) {
    document.querySelector(".map-section").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
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

function populateNeighborhoodFilter(points) {
  const previous = neighborhoodSelect.value;
  const neighborhoods = new Set();
  points.forEach((p) => {
    const n = (p.neighborhood || "").trim();
    if (n) neighborhoods.add(n);
  });
  const sorted = Array.from(neighborhoods).sort((a, b) => a.localeCompare(b, "pt-BR"));
  neighborhoodSelect.innerHTML =
    `<option value="">Todos os bairros (${sorted.length})</option>` +
    sorted.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
  if (sorted.includes(previous)) {
    neighborhoodSelect.value = previous;
  }
}

async function prepareCityFilters(cityId) {
  const [detailRes, pointsRes] = await Promise.all([
    fetch(`/cities/${cityId}`),
    fetch(`/vaccination-points/${cityId}`),
  ]);
  currentCityDetail = await detailRes.json();
  currentPoints = await pointsRes.json();
  populateVaccineFilter(currentPoints);
  populateNeighborhoodFilter(currentPoints);
}

async function prepareStatewideFilters() {
  const res = await fetch("/api/portal/vaccination-points");
  currentPoints = await res.json();
  currentCityDetail = {
    name: "Todo o Estado",
    state: "AL",
    ibge_code: "UF 27",
    vaccination_points_count: currentPoints.length,
  };
  populateVaccineFilter(currentPoints);
}

async function setScope(scope) {
  searchScope = scope;
  modeMunicipalBtn.setAttribute("aria-pressed", scope === "municipal" ? "true" : "false");
  modeStateBtn.setAttribute("aria-pressed", scope === "state" ? "true" : "false");

  const groupOption = sortSelect.querySelector('option[value="group"]');
  if (scope === "municipal") {
    cityField.style.display = "block";
    neighborhoodField.style.display = "block";
    quickCitiesEl.style.display = "flex";
    searchLabel.textContent = "Buscar UBS ou endereço";
    searchInput.placeholder = "Ex.: UBS, PSF, rua...";
    groupOption.textContent = "Agrupar por Bairro (A–Z)";
    if (citySelect.value) {
      await prepareCityFilters(Number(citySelect.value));
    }
  } else {
    cityField.style.display = "none";
    neighborhoodField.style.display = "none";
    quickCitiesEl.style.display = "none";
    searchLabel.textContent = "Buscar UBS, cidade ou endereço";
    searchInput.placeholder = "Ex.: Arapiraca, Penedo, UBS...";
    groupOption.textContent = "Agrupar por Município (A–Z)";
    await prepareStatewideFilters();
  }
}

function applyDistancesAndNearest(autoSelectNearest = false) {
  if (userLocation) {
    currentPoints = currentPoints.map((p) => ({
      ...p,
      _distanceKm:
        p.latitude != null && p.longitude != null
          ? haversineKm(userLocation.lat, userLocation.lng, p.latitude, p.longitude)
          : null,
    }));
  } else {
    currentPoints = currentPoints.map((p) => ({ ...p, _distanceKm: null }));
  }

  const filtered = getFilteredPoints();
  if (userLocation && filtered.length > 0) {
    const withDist = filtered
      .filter((p) => p._distanceKm != null)
      .sort((a, b) => a._distanceKm - b._distanceKm);
    const nearest = withDist[0];
    if (nearest) {
      nearestSection.style.display = "block";
      nearestTitle.textContent = `Posto mais próximo: ${nearest.name}${nearest.city_name ? ` (${nearest.city_name})` : ""}`;
      nearestBody.textContent = `${formatDistance(nearest._distanceKm)} de distância • A pé: ${formatDurationMinutes(nearest._distanceKm, 5)} • Carro: ${formatDurationMinutes(nearest._distanceKm, 35)} • Bicicleta: ${formatDurationMinutes(nearest._distanceKm, 15)}.`;
      if (autoSelectNearest && !selectedPointId) {
        selectPoint(nearest.id, false);
        return;
      }
    } else {
      nearestSection.style.display = "none";
    }
  } else {
    nearestSection.style.display = "none";
  }

  renderPoints(true);
}

async function showResults(autoSelectNearest = true) {
  resultsSection.style.display = "block";
  if (map) {
    map.invalidateSize();
  }

  cityBanner.style.display = "flex";
  if (searchScope === "municipal" && currentCityDetail) {
    cityTitle.textContent = `${currentCityDetail.name} — ${currentCityDetail.state}`;
    cityMeta.textContent = `Código IBGE: ${currentCityDetail.ibge_code} • ${currentCityDetail.vaccination_points_count} ponto(s) cadastrado(s)`;
  } else {
    cityTitle.textContent = "Alagoas — Busca Estadual";
    cityMeta.textContent = `102 municípios • ${currentPoints.length} UBSs ativas no SUS`;
  }

  selectedPointId = null;
  applyDistancesAndNearest(autoSelectNearest);
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getFilteredPoints() {
  const query = searchInput.value.trim().toLowerCase();
  const vaccineFilter = vaccineSelect.value;
  const neighborhoodFilter =
    searchScope === "municipal" ? neighborhoodSelect.value : "";
  const onlyFavs = favOnlyCheck.checked;
  const favs = getFavorites();

  const filtered = currentPoints.filter((point) => {
    const matchesText =
      !query ||
      (point.name || "").toLowerCase().includes(query) ||
      (point.neighborhood || "").toLowerCase().includes(query) ||
      (point.city_name || "").toLowerCase().includes(query) ||
      (point.address || "").toLowerCase().includes(query);
    const matchesVaccine =
      !vaccineFilter || (point.vaccines || []).includes(vaccineFilter);
    const matchesNeighborhood =
      !neighborhoodFilter || (point.neighborhood || "").trim() === neighborhoodFilter;
    const matchesFav = !onlyFavs || favs.has(point.id);
    return matchesText && matchesVaccine && matchesNeighborhood && matchesFav;
  });

  const sortMode = sortSelect.value;
  filtered.sort((a, b) => {
    if (sortMode === "distance" && userLocation) {
      if (a._distanceKm == null && b._distanceKm == null) return a.name.localeCompare(b.name, "pt-BR");
      if (a._distanceKm == null) return 1;
      if (b._distanceKm == null) return -1;
      return a._distanceKm - b._distanceKm;
    }
    if (sortMode === "group") {
      if (searchScope === "state") {
        const ca = (a.city_name || "Alagoas").trim();
        const cb = (b.city_name || "Alagoas").trim();
        const cmpCity = ca.localeCompare(cb, "pt-BR");
        if (cmpCity !== 0) return cmpCity;
      }
      const na = (a.neighborhood || "Sem bairro informado").trim();
      const nb = (b.neighborhood || "Sem bairro informado").trim();
      const cmpNeigh = na.localeCompare(nb, "pt-BR");
      if (cmpNeigh !== 0) return cmpNeigh;
      if (userLocation && a._distanceKm != null && b._distanceKm != null) {
        return a._distanceKm - b._distanceKm;
      }
      return a.name.localeCompare(b.name, "pt-BR");
    }
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return filtered;
}

function renderVaccinesBlock(vaccines) {
  if (!vaccines || vaccines.length === 0) {
    return `<div class="vaccines-list"><span class="vaccine-tag">Vacinas não informadas</span></div>`;
  }
  const primary = vaccines.slice(0, VISIBLE_VACCINES_LIMIT);
  const extra = vaccines.slice(VISIBLE_VACCINES_LIMIT);
  const primaryHtml = primary
    .map((v) => `<span class="vaccine-tag">${escapeHtml(v)}</span>`)
    .join("");

  if (extra.length === 0) {
    return `<div class="vaccines-list">${primaryHtml}</div>`;
  }

  const extraHtml = extra
    .map((v) => `<span class="vaccine-tag">${escapeHtml(v)}</span>`)
    .join("");
  return `
    <div class="vaccines-list">${primaryHtml}</div>
    <details class="vaccines-details">
      <summary>Ver mais ${extra.length} vacina(s) disponíveis</summary>
      <div class="vaccines-list" style="margin-top: 8px;">${extraHtml}</div>
    </details>
  `;
}

function renderCardHtml(p, favs) {
  const isFav = favs.has(p.id);
  const isSelected = p.id === selectedPointId;
  const distBadge =
    p._distanceKm != null
      ? `<span class="card-distance">${formatDistance(p._distanceKm)} • A pé ${formatDurationMinutes(p._distanceKm, 5)} • Carro ${formatDurationMinutes(p._distanceKm, 35)}</span>`
      : "";

  const pillText =
    searchScope === "state"
      ? [p.city_name, p.neighborhood].filter(Boolean).join(" • ")
      : p.neighborhood;

  return `
    <article class="card${isSelected ? " card-selected" : ""}">
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(p.name)}</h3>
        ${pillText ? `<span class="pill">${escapeHtml(pillText)}</span>` : ""}
      </div>
      ${distBadge}
      <p class="info-line"><strong>Endereço:</strong> ${escapeHtml(p.address || "Não informado")}</p>
      <p class="info-line"><strong>Telefone:</strong> ${escapeHtml(p.phone || "Não informado")}</p>
      <p class="info-line"><strong>Horário:</strong> ${escapeHtml(p.opening_hours || "Não informado")}</p>
      ${renderVaccinesBlock(p.vaccines)}
      <div class="card-actions">
        <button type="button" class="btn btn-primary btn-sm" data-action="map" data-id="${p.id}">
          Ver no mapa / Rota
        </button>
        <button
          type="button"
          class="btn btn-outline btn-sm btn-fav"
          data-action="fav"
          data-id="${p.id}"
          aria-pressed="${isFav ? "true" : "false"}"
        >
          ${isFav ? "Favoritado" : "Favoritar"}
        </button>
        <button type="button" class="btn btn-outline btn-sm" data-action="share" data-id="${p.id}">
          Compartilhar
        </button>
      </div>
    </article>
  `;
}

function renderPoints(shouldFitBounds = true) {
  const filtered = getFilteredPoints();
  const favs = getFavorites();

  resultsCount.textContent = `Exibindo ${filtered.length} de ${currentPoints.length} ponto(s)`;
  updateMapMarkers(filtered, shouldFitBounds);

  if (filtered.length === 0) {
    pointsContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        Nenhum ponto de vacinação encontrado para os filtros selecionados.
      </div>
    `;
    return;
  }

  if (sortSelect.value !== "group") {
    pointsContainer.innerHTML = filtered.map((p) => renderCardHtml(p, favs)).join("");
    return;
  }

  let html = "";
  if (searchScope === "state") {
    const byCity = new Map();
    filtered.forEach((p) => {
      const cityKey = (p.city_name || "Alagoas").trim();
      if (!byCity.has(cityKey)) byCity.set(cityKey, new Map());
      const neighKey = (p.neighborhood || "Sem bairro informado").trim();
      const cityMap = byCity.get(cityKey);
      if (!cityMap.has(neighKey)) cityMap.set(neighKey, []);
      cityMap.get(neighKey).push(p);
    });

    byCity.forEach((neighMap, cityName) => {
      let cityTotal = 0;
      neighMap.forEach((arr) => {
        cityTotal += arr.length;
      });
      html += `
        <div class="municipality-group">
          <span>Município: ${escapeHtml(cityName)}</span>
          <span>${cityTotal} unidade(s)</span>
        </div>
      `;
      neighMap.forEach((items, neighborhood) => {
        html += `
          <div class="neighborhood-group">
            <span>Bairro: ${escapeHtml(neighborhood)}</span>
            <span>${items.length} unidade(s)</span>
          </div>
        `;
        html += items.map((p) => renderCardHtml(p, favs)).join("");
      });
    });
    pointsContainer.innerHTML = html;
    return;
  }

  const groups = new Map();
  filtered.forEach((p) => {
    const key = (p.neighborhood || "Sem bairro informado").trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  });

  groups.forEach((items, neighborhood) => {
    html += `
      <div class="neighborhood-group">
        <span>Bairro: ${escapeHtml(neighborhood)}</span>
        <span>${items.length} unidade(s)</span>
      </div>
    `;
    html += items.map((p) => renderCardHtml(p, favs)).join("");
  });
  pointsContainer.innerHTML = html;
}

async function loadInitialData() {
  saveFavorites(getFavorites());
  try {
    const savedGeo = localStorage.getItem(GEO_DONE_KEY);
    if (savedGeo && savedGeo.startsWith("{")) {
      const parsed = JSON.parse(savedGeo);
      if (parsed.lat && parsed.lng) {
        userLocation = parsed;
        collapseGeoStep(`Localização salva: ${parsed.label || "CEP/Endereço"}`);
      }
    }
  } catch {}

  const res = await fetch("/cities");
  allCities = await res.json();

  citySelect.innerHTML = allCities
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join("");

  FEATURED_CITIES.forEach((name) => {
    const city = allCities.find((c) => c.name === name);
    if (!city) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.dataset.cityId = String(city.id);
    btn.textContent = city.name;
    btn.addEventListener("click", async () => {
      citySelect.value = String(city.id);
      document.querySelectorAll(".chip").forEach((ch) => {
        ch.classList.toggle("active", ch.dataset.cityId === String(city.id));
      });
      await prepareCityFilters(city.id);
    });
    quickCitiesEl.appendChild(btn);
  });

  const params = new URLSearchParams(window.location.search);
  const paramCity = Number(params.get("city"));
  const paramPoint = Number(params.get("point"));

  const initialCity =
    allCities.find((c) => c.id === paramCity) ||
    allCities.find((c) => c.name === "Maceió") ||
    allCities[0];

  if (initialCity) {
    citySelect.value = String(initialCity.id);
    document.querySelectorAll(".chip").forEach((ch) => {
      ch.classList.toggle("active", ch.dataset.cityId === String(initialCity.id));
    });
    await prepareCityFilters(initialCity.id);

    if (paramPoint) {
      await showResults(false);
      selectPoint(paramPoint, false);
    }
  }
}

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    geoStatus.textContent = "Seu navegador não suporta geolocalização. Use o campo de CEP/rua.";
    return;
  }
  geoStatus.textContent = "Obtendo localização...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const accKm = pos.coords.accuracy ? Math.round(pos.coords.accuracy / 1000) : null;
      const msg =
        accKm && accKm > 2
          ? `Localização por IP (~${accKm} km de margem). Para rua exata no PC, informe seu CEP.`
          : "Localização do dispositivo definida!";
      geoStatus.textContent = msg;
      collapseGeoStep(msg);
      showToast("Localização definida! Agora escolha Municipal ou Estadual e clique em Mostrar Postos.");
    },
    () => {
      geoStatus.textContent = "Permissão negada. Digite seu CEP/rua ou clique em Pular.";
      showToast("Não foi possível acessar o GPS.", true);
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
  );
});

async function locateByQuery() {
  const raw = (cepInput.value || "").trim();
  if (!raw) {
    showToast("Digite um CEP ou nome de rua/bairro.", true);
    return;
  }
  geoStatus.textContent = "Buscando endereço em Alagoas...";
  const digits = raw.replace(/\D/g, "");
  const candidates = [];

  if (digits.length === 8) {
    try {
      const viaRes = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const viaData = await viaRes.json();
      if (!viaData.erro) {
        if (viaData.uf && viaData.uf !== "AL") {
          geoStatus.textContent = `O CEP pertence a ${viaData.localidade}/${viaData.uf} (fora de Alagoas).`;
          showToast("Informe um CEP de Alagoas.", true);
          return;
        }
        const matchedCity = allCities.find(
          (c) => c.name.toLowerCase() === (viaData.localidade || "").toLowerCase()
        );
        if (matchedCity) {
          citySelect.value = String(matchedCity.id);
          await prepareCityFilters(matchedCity.id);
        }
        if (viaData.logradouro) {
          candidates.push(
            [viaData.logradouro, viaData.bairro, viaData.localidade, "Alagoas, Brasil"]
              .filter(Boolean)
              .join(", ")
          );
        }
        if (viaData.bairro) {
          candidates.push(`${viaData.bairro}, ${viaData.localidade}, Alagoas, Brasil`);
        }
        candidates.push(`${viaData.localidade}, Alagoas, Brasil`);
      }
    } catch {}
  }
  if (candidates.length === 0) {
    candidates.push(`${raw}, Alagoas, Brasil`);
  }

  try {
    let found = null;
    for (const q of candidates) {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`
      );
      const nomData = await nomRes.json();
      if (nomData && nomData.length > 0) {
        found = nomData[0];
        break;
      }
    }
    if (!found) {
      geoStatus.textContent = "Endereço não encontrado. Tente bairro + cidade.";
      showToast("Endereço não encontrado.", true);
      return;
    }
    userLocation = { lat: Number(found.lat), lng: Number(found.lon), fromAddress: true };
    const shortLabel = found.display_name.split(",").slice(0, 2).join(",");
    try {
      localStorage.setItem(
        GEO_DONE_KEY,
        JSON.stringify({ ...userLocation, label: shortLabel })
      );
    } catch {}
    collapseGeoStep(`Localização definida: ${shortLabel}`);
    showToast("Endereço localizado! Clique em Mostrar Postos para ver os mais próximos.");
  } catch {
    geoStatus.textContent = "Erro ao consultar serviço de localização.";
  }
}

cepBtn.addEventListener("click", locateByQuery);
cepInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    locateByQuery();
  }
});
skipGeoBtn.addEventListener("click", () => {
  userLocation = null;
  try {
    localStorage.removeItem(GEO_DONE_KEY);
  } catch {}
  collapseGeoStep("Busca manual (sem localização definida)");
});
changeGeoBtn.addEventListener("click", () => {
  try {
    localStorage.removeItem(GEO_DONE_KEY);
  } catch {}
  expandGeoStep();
});

modeMunicipalBtn.addEventListener("click", () => setScope("municipal"));
modeStateBtn.addEventListener("click", () => setScope("state"));
citySelect.addEventListener("change", async (e) => {
  const id = Number(e.target.value);
  document.querySelectorAll(".chip").forEach((ch) => {
    ch.classList.toggle("active", ch.dataset.cityId === String(id));
  });
  if (id) await prepareCityFilters(id);
});
confirmSearchBtn.addEventListener("click", () => showResults(true));
focusPointBtn.addEventListener("click", () => {
  if (selectedPointId) selectPoint(selectedPointId, true);
});

pointsContainer.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === "map") {
    selectPoint(id, true);
    return;
  }
  if (action === "fav") {
    const favs = getFavorites();
    if (favs.has(id)) {
      favs.delete(id);
      showToast("Ponto removido dos favoritos.");
    } else {
      favs.add(id);
      showToast("Ponto salvo nos favoritos!");
    }
    saveFavorites(favs);
    renderPoints(false);
    return;
  }
  if (action === "share") {
    const point = currentPoints.find((p) => p.id === id);
    if (!point) return;
    const shareUrl = `${window.location.origin}/?city=${point.city_id}&point=${point.id}`;
    const shareText = `Ponto de vacinação: ${point.name} (${point.city_name || currentCityDetail?.name || "Alagoas"}) — ${point.address || "Endereço não informado"}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: point.name, text: shareText, url: shareUrl });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      showToast("Link e endereço copiados para compartilhar!");
    } catch {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }
});

// Barra de acessibilidade (Alto Contraste + Zoom de Texto)
const contrastBtn = document.getElementById("contrastBtn");
const fontDecBtn = document.getElementById("fontDecBtn");
const fontResetBtn = document.getElementById("fontResetBtn");
const fontIncBtn = document.getElementById("fontIncBtn");

let fontScale = Number(localStorage.getItem("alagoas_font_scale") || 100);
function applyFontScale() {
  fontScale = Math.min(130, Math.max(85, fontScale));
  document.documentElement.style.fontSize = `${fontScale}%`;
  try {
    localStorage.setItem("alagoas_font_scale", String(fontScale));
  } catch {}
}
applyFontScale();

if (localStorage.getItem("alagoas_high_contrast") === "1") {
  document.body.classList.add("high-contrast");
  contrastBtn?.setAttribute("aria-pressed", "true");
}

contrastBtn?.addEventListener("click", () => {
  const active = document.body.classList.toggle("high-contrast");
  contrastBtn.setAttribute("aria-pressed", active ? "true" : "false");
  try {
    localStorage.setItem("alagoas_high_contrast", active ? "1" : "0");
  } catch {}
});

fontDecBtn?.addEventListener("click", () => {
  fontScale -= 10;
  applyFontScale();
});
fontResetBtn?.addEventListener("click", () => {
  fontScale = 100;
  applyFontScale();
});
fontIncBtn?.addEventListener("click", () => {
  fontScale += 10;
  applyFontScale();
});

initMap();
loadInitialData().catch(() => {
  showToast("Erro ao carregar dados iniciais da API.", true);
});
