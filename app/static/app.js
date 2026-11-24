const citySelect = document.getElementById("citySelect");
const searchInput = document.getElementById("searchInput");
const vaccineSelect = document.getElementById("vaccineSelect");
const quickCitiesEl = document.getElementById("quickCities");
const cityBanner = document.getElementById("cityBanner");
const cityTitle = document.getElementById("cityTitle");
const cityMeta = document.getElementById("cityMeta");
const resultsCount = document.getElementById("resultsCount");
const pointsContainer = document.getElementById("pointsContainer");

const geoBtn = document.getElementById("geoBtn");
const geoStatus = document.getElementById("geoStatus");
const favFilterBtn = document.getElementById("favFilterBtn");
const favCountEl = document.getElementById("favCount");
const nearestSection = document.getElementById("nearestSection");
const nearestTitle = document.getElementById("nearestTitle");
const nearestBody = document.getElementById("nearestBody");

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

let allCities = [];
let currentCityDetail = null;
let currentPoints = [];
let userLocation = null; // { lat, lng }
let selectedPointId = null;
let onlyFavorites = false;

let map = null;
let markersLayer = null;
let userMarker = null;
let routeLine = null;

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
  } catch {
    // Ignore storage quota errors
  }
  favCountEl.textContent = String(favSet.size);
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

  map.on("click", (e) => {
    userLocation = {
      lat: e.latlng.lat,
      lng: e.latlng.lng,
    };
    selectedPointId = null;
    geoStatus.textContent = "Localização marcada manualmente no mapa — postos ordenados do mais próximo.";
    updateNearestAndRender();
    showToast("Posição marcada no mapa! Posto mais próximo atualizado.");
  });
}

function updateMapMarkers(points, shouldFitBounds = true) {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();

  const bounds = [];
  if (userLocation) {
    if (userMarker) map.removeLayer(userMarker);
    userMarker = window.L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 9,
      color: "#FFFFFF",
      weight: 3,
      fillColor: "#B91C1C",
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup("<strong>Sua localização</strong>");
    bounds.push([userLocation.lat, userLocation.lng]);
  }

  points.forEach((p) => {
    if (p.latitude == null || p.longitude == null) return;
    const marker = window.L.marker([p.latitude, p.longitude]).addTo(markersLayer);
    marker.bindPopup(
      `<strong>${escapeHtml(p.name)}</strong><br>${escapeHtml(p.address || "")}`
    );
    marker.on("click", () => selectPoint(p.id, false));
    bounds.push([p.latitude, p.longitude]);
  });

  if (shouldFitBounds && bounds.length > 0 && !selectedPointId) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }
}

function selectPoint(pointId, scrollToMap = true) {
  const point = currentPoints.find((p) => p.id === pointId);
  if (!point) return;

  selectedPointId = pointId;
  routePointName.textContent = point.name;
  routePointAddress.textContent = [point.address, point.neighborhood]
    .filter(Boolean)
    .join(" — ") || "Endereço não informado";

  const hasCoords = point.latitude != null && point.longitude != null;
  if (hasCoords) {
    const dest = `${point.latitude},${point.longitude}`;
    const originParam = userLocation
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

    if (map) {
      if (routeLine) map.removeLayer(routeLine);
      routeLine = window.L.polyline(
        [
          [userLocation.lat, userLocation.lng],
          [point.latitude, point.longitude],
        ],
        { color: "#B91C1C", weight: 4, dashArray: "6 6" }
      ).addTo(map);
      map.fitBounds(routeLine.getBounds(), { padding: [50, 50], maxZoom: 17 });
    }
  } else {
    modalTimesGrid.style.display = "none";
    if (map && hasCoords) {
      map.setView([point.latitude, point.longitude], 16);
    }
  }

  renderPoints(false);
  if (scrollToMap) {
    document.querySelector(".map-section").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

async function loadCities() {
  saveFavorites(getFavorites());
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
    btn.addEventListener("click", () => selectCity(city.id));
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
    await selectCity(initialCity.id);
    if (paramPoint) {
      selectPoint(paramPoint, false);
    }
  }
}

async function selectCity(cityId) {
  citySelect.value = String(cityId);
  selectedPointId = null;
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.cityId === String(cityId));
  });

  pointsContainer.innerHTML = `<div class="empty-state">Carregando pontos de vacinação...</div>`;

  const [detailRes, pointsRes] = await Promise.all([
    fetch(`/cities/${cityId}`),
    fetch(`/vaccination-points/${cityId}`),
  ]);

  currentCityDetail = await detailRes.json();
  currentPoints = await pointsRes.json();

  cityBanner.style.display = "flex";
  cityTitle.textContent = `${currentCityDetail.name} — ${currentCityDetail.state}`;
  cityMeta.textContent = `Código IBGE: ${currentCityDetail.ibge_code} • ${currentCityDetail.vaccination_points_count} ponto(s) cadastrado(s)`;

  populateVaccineFilter(currentPoints);
  updateNearestAndRender();
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

function updateNearestAndRender() {
  if (userLocation) {
    currentPoints = currentPoints.map((p) => ({
      ...p,
      _distanceKm:
        p.latitude != null && p.longitude != null
          ? haversineKm(userLocation.lat, userLocation.lng, p.latitude, p.longitude)
          : null,
    }));
    currentPoints.sort((a, b) => {
      if (a._distanceKm == null && b._distanceKm == null) return a.id - b.id;
      if (a._distanceKm == null) return 1;
      if (b._distanceKm == null) return -1;
      return a._distanceKm - b._distanceKm;
    });

    const nearest = currentPoints.find((p) => p._distanceKm != null);
    if (nearest) {
      nearestSection.style.display = "block";
      nearestTitle.textContent = `Posto mais próximo em ${currentCityDetail?.name || "Alagoas"}: ${nearest.name}`;
      nearestBody.textContent = `${formatDistance(nearest._distanceKm)} de distância • A pé: ${formatDurationMinutes(nearest._distanceKm, 5)} • Carro: ${formatDurationMinutes(nearest._distanceKm, 35)} • Bicicleta: ${formatDurationMinutes(nearest._distanceKm, 15)}.`;
      if (!selectedPointId) {
        selectPoint(nearest.id, false);
        return;
      }
    } else {
      nearestSection.style.display = "none";
    }
  } else {
    nearestSection.style.display = "none";
  }

  renderPoints();
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

function getFilteredPoints() {
  const query = searchInput.value.trim().toLowerCase();
  const vaccineFilter = vaccineSelect.value;
  const favs = getFavorites();

  return currentPoints.filter((point) => {
    const matchesText =
      !query ||
      (point.name || "").toLowerCase().includes(query) ||
      (point.neighborhood || "").toLowerCase().includes(query) ||
      (point.address || "").toLowerCase().includes(query);
    const matchesVaccine =
      !vaccineFilter || (point.vaccines || []).includes(vaccineFilter);
    const matchesFav = !onlyFavorites || favs.has(point.id);
    return matchesText && matchesVaccine && matchesFav;
  });
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

  pointsContainer.innerHTML = filtered
    .map((p) => {
      const isFav = favs.has(p.id);
      const isSelected = p.id === selectedPointId;
      const distBadge =
        p._distanceKm != null
          ? `<span class="card-distance">${formatDistance(p._distanceKm)} • A pé ${formatDurationMinutes(p._distanceKm, 5)} • Carro ${formatDurationMinutes(p._distanceKm, 35)}</span>`
          : "";

      return `
        <article class="card${isSelected ? " card-selected" : ""}">
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(p.name)}</h3>
            ${p.neighborhood ? `<span class="pill">${escapeHtml(p.neighborhood)}</span>` : ""}
          </div>
          ${distBadge}
          <p class="info-line"><strong>Endereço:</strong> ${escapeHtml(p.address || "Não informado")}</p>
          <p class="info-line"><strong>Telefone:</strong> ${escapeHtml(p.phone || "Não informado")}</p>
          <p class="info-line"><strong>Horário:</strong> ${escapeHtml(p.opening_hours || "Não informado")}</p>
          ${renderVaccinesBlock(p.vaccines)}
          <div class="card-actions">
            <button
              type="button"
              class="btn btn-primary btn-sm"
              data-action="map"
              data-id="${p.id}"
            >
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
            <button
              type="button"
              class="btn btn-outline btn-sm"
              data-action="share"
              data-id="${p.id}"
            >
              Compartilhar
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

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
    renderPoints();
    return;
  }

  if (action === "share") {
    const point = currentPoints.find((p) => p.id === id);
    if (!point) return;
    const shareUrl = `${window.location.origin}/?city=${point.city_id}&point=${point.id}`;
    const shareText = `Ponto de vacinação: ${point.name} (${currentCityDetail?.name || "Alagoas"}) — ${point.address || "Endereço não informado"}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: point.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Usuário cancelou ou fallback para clipboard
      }
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

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    geoStatus.textContent = "Seu navegador não suporta geolocalização. Use o campo de CEP/rua ao lado.";
    showToast("Geolocalização não suportada neste navegador.", true);
    return;
  }

  geoStatus.textContent = "Obtendo sua localização precisa...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      const accMeters = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null;
      if (accMeters && accMeters > 2000) {
        geoStatus.textContent = `Atenção: seu navegador estimou sua posição pelo IP da internet (margem de erro de ~${Math.round(accMeters / 1000)} km). Para achar o posto exato da sua rua, digite seu CEP ou endereço ao lado.`;
      } else {
        const acc = accMeters ? ` (±${accMeters} m)` : "";
        geoStatus.textContent = `Localização precisa ativa${acc} — postos ordenados do mais próximo.`;
      }
      selectedPointId = null;
      updateNearestAndRender();
      showToast("Localização obtida! Posto mais próximo destacado.");
    },
    () => {
      geoStatus.textContent = "Permissão negada ou indisponível. Informe seu CEP ou rua ao lado.";
      showToast("Use o campo de CEP ou rua para localizar sua posição exata.", true);
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
  );
});

const cepInput = document.getElementById("cepInput");
const cepBtn = document.getElementById("cepBtn");

async function locateByQuery() {
  const raw = (cepInput?.value || "").trim();
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
          geoStatus.textContent = `O CEP informado pertence a ${viaData.localidade}/${viaData.uf} (fora de Alagoas).`;
          showToast("Informe um CEP de Alagoas.", true);
          return;
        }
        const matchedCity = allCities.find(
          (c) => c.name.toLowerCase() === (viaData.localidade || "").toLowerCase()
        );
        if (matchedCity && matchedCity.id !== Number(citySelect.value)) {
          await selectCity(matchedCity.id);
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
    } catch {
      // Fallback para busca direta no Nominatim
    }
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
      geoStatus.textContent = "Endereço não encontrado. Tente clicar direto no mapa ou informar bairro + cidade.";
      showToast("Endereço não encontrado.", true);
      return;
    }

    userLocation = {
      lat: Number(found.lat),
      lng: Number(found.lon),
    };
    selectedPointId = null;
    geoStatus.textContent = `Localização definida (${found.display_name.split(",").slice(0, 2).join(",")}).`;
    updateNearestAndRender();
    showToast("Endereço localizado! Posto mais próximo destacado.");
  } catch {
    geoStatus.textContent = "Erro ao consultar serviço de localização.";
    showToast("Erro ao buscar endereço.", true);
  }
}

cepBtn?.addEventListener("click", locateByQuery);
cepInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    locateByQuery();
  }
});

favFilterBtn.addEventListener("click", () => {
  onlyFavorites = !onlyFavorites;
  favFilterBtn.setAttribute("aria-pressed", onlyFavorites ? "true" : "false");
  favFilterBtn.classList.toggle("btn-primary", onlyFavorites);
  favFilterBtn.classList.toggle("btn-outline", !onlyFavorites);
  renderPoints();
});

const modeAutoBtn = document.getElementById("modeAutoBtn");
const modeMunicipalBtn = document.getElementById("modeMunicipalBtn");
const modeStateBtn = document.getElementById("modeStateBtn");
const autoBox = document.getElementById("autoBox");
const manualBox = document.getElementById("manualBox");
const cityField = document.getElementById("cityField");
const scopeHint = document.getElementById("scopeHint");

let searchMode = "auto"; // "auto" | "municipal" | "state"

async function setSearchMode(mode) {
  searchMode = mode;
  modeAutoBtn?.setAttribute("aria-pressed", mode === "auto" ? "true" : "false");
  modeMunicipalBtn?.setAttribute("aria-pressed", mode === "municipal" ? "true" : "false");
  modeStateBtn?.setAttribute("aria-pressed", mode === "state" ? "true" : "false");

  if (mode === "auto") {
    autoBox.style.display = "flex";
    manualBox.style.display = "none";
    scopeHint.textContent = "Modo ativo: Localização / CEP";
    return;
  }

  autoBox.style.display = "none";
  manualBox.style.display = "block";

  if (mode === "municipal") {
    cityField.style.display = "block";
    quickCitiesEl.style.display = "flex";
    scopeHint.textContent = "Modo ativo: Busca Manual Municipal";
    if (citySelect.value) {
      await selectCity(Number(citySelect.value));
    }
    return;
  }

  // Modo Estadual (todo o Alagoas)
  cityField.style.display = "none";
  quickCitiesEl.style.display = "none";
  scopeHint.textContent = "Modo ativo: Busca Manual Estadual (102 municípios de Alagoas)";
  await loadStatewidePoints();
}

async function loadStatewidePoints() {
  selectedPointId = null;
  pointsContainer.innerHTML = `<div class="empty-state">Carregando UBSs de todo o estado de Alagoas...</div>`;
  const allResponses = await Promise.all(
    allCities.map((c) => fetch(`/vaccination-points/${c.id}`).then((r) => r.json()))
  );
  const cityNameById = new Map(allCities.map((c) => [c.id, c.name]));
  currentCityDetail = {
    name: "Todo o Estado",
    state: "AL",
    ibge_code: "UF 27",
    vaccination_points_count: 0,
  };
  currentPoints = allResponses.flat().map((p) => ({
    ...p,
    neighborhood: p.neighborhood
      ? `${p.neighborhood} (${cityNameById.get(p.city_id) || ""})`
      : cityNameById.get(p.city_id) || "",
  }));
  currentCityDetail.vaccination_points_count = currentPoints.length;

  cityBanner.style.display = "flex";
  cityTitle.textContent = "Alagoas — Busca Estadual";
  cityMeta.textContent = `102 municípios • ${currentPoints.length} UBSs ativas no SUS`;

  populateVaccineFilter(currentPoints);
  updateNearestAndRender();
}

modeAutoBtn?.addEventListener("click", () => setSearchMode("auto"));
modeMunicipalBtn?.addEventListener("click", () => setSearchMode("municipal"));
modeStateBtn?.addEventListener("click", () => setSearchMode("state"));

citySelect.addEventListener("change", (e) => {
  if (e.target.value) selectCity(Number(e.target.value));
});
searchInput.addEventListener("input", () => renderPoints(true));
vaccineSelect.addEventListener("change", () => renderPoints(true));

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
loadCities().catch(() => {
  pointsContainer.innerHTML = `<div class="empty-state">Erro ao carregar dados da API.</div>`;
});
