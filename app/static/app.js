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
}

function updateMapMarkers(points) {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  const bounds = [];
  if (userLocation) {
    if (userMarker) map.removeLayer(userMarker);
    userMarker = window.L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 8,
      color: "#FFFFFF",
      weight: 2,
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

  if (bounds.length > 0) {
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
      map.fitBounds(routeLine.getBounds(), { padding: [40, 40], maxZoom: 15 });
    }
  } else {
    modalTimesGrid.style.display = "none";
    if (map && hasCoords) {
      map.setView([point.latitude, point.longitude], 15);
    }
  }

  renderPoints();
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

function renderPoints() {
  const filtered = getFilteredPoints();
  const favs = getFavorites();

  resultsCount.textContent = `Exibindo ${filtered.length} de ${currentPoints.length} ponto(s)`;
  updateMapMarkers(filtered);

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
    geoStatus.textContent = "Seu navegador não suporta geolocalização.";
    showToast("Geolocalização não suportada neste navegador.", true);
    return;
  }

  geoStatus.textContent = "Obtendo sua localização...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      geoStatus.textContent = "Localização ativa — postos ordenados do mais próximo ao mais distante.";
      selectedPointId = null;
      updateNearestAndRender();
      showToast("Localização obtida! Posto mais próximo destacado.");
    },
    () => {
      geoStatus.textContent = "Não foi possível obter a localização (permissão negada ou indisponível).";
      showToast("Permita o acesso à localização no navegador para calcular distâncias.", true);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

favFilterBtn.addEventListener("click", () => {
  onlyFavorites = !onlyFavorites;
  favFilterBtn.setAttribute("aria-pressed", onlyFavorites ? "true" : "false");
  favFilterBtn.classList.toggle("btn-primary", onlyFavorites);
  favFilterBtn.classList.toggle("btn-outline", !onlyFavorites);
  renderPoints();
});

citySelect.addEventListener("change", (e) => {
  if (e.target.value) selectCity(Number(e.target.value));
});
searchInput.addEventListener("input", renderPoints);
vaccineSelect.addEventListener("change", renderPoints);

initMap();
loadCities().catch(() => {
  pointsContainer.innerHTML = `<div class="empty-state">Erro ao carregar dados da API.</div>`;
});
