const DEFAULT_VACCINES = [
  "BCG",
  "Hepatite B",
  "Penta (DTP+Hib+HB)",
  "Poliomielite (VIP)",
  "Rotavírus (VORH)",
  "Pneumocócica 10-valente",
  "Meningocócica C",
  "Febre Amarela",
  "Tríplice Viral",
  "DTP",
  "Hepatite A",
  "Varicela",
  "Influenza",
  "Covid-19",
];

const TOKEN_KEY = "pi_iv_b_admin_token";

const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");
const logoutBtn = document.getElementById("logoutBtn");
const loginForm = document.getElementById("loginForm");
const adminCitySelect = document.getElementById("adminCitySelect");
const adminSearch = document.getElementById("adminSearch");
const pointsTableBody = document.getElementById("pointsTableBody");
const newPointBtn = document.getElementById("newPointBtn");

const pointModal = document.getElementById("pointModal");
const modalTitle = document.getElementById("modalTitle");
const pointForm = document.getElementById("pointForm");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const vaccinesCheckboxes = document.getElementById("vaccinesCheckboxes");
const toastEl = document.getElementById("toast");

let cities = [];
let currentPoints = [];

function showToast(msg, isError = false) {
  toastEl.textContent = msg;
  toastEl.className = `toast show${isError ? " error" : ""}`;
  setTimeout(() => {
    toastEl.className = "toast";
  }, 3200);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setLoggedInState(loggedIn) {
  loginSection.style.display = loggedIn ? "none" : "block";
  adminSection.style.display = loggedIn ? "block" : "none";
  logoutBtn.style.display = loggedIn ? "inline-flex" : "none";
}

function renderVaccineCheckboxes(selected = []) {
  const selectedSet = new Set(selected);
  const custom = selected.filter((v) => !DEFAULT_VACCINES.includes(v));
  document.getElementById("formCustomVaccines").value = custom.join("; ");

  vaccinesCheckboxes.innerHTML = DEFAULT_VACCINES.map(
    (v) => `
      <label>
        <input type="checkbox" value="${escapeHtml(v)}" ${selectedSet.has(v) ? "checked" : ""} />
        <span>${escapeHtml(v)}</span>
      </label>
    `
  ).join("");
}

async function initAdmin() {
  const res = await fetch("/cities");
  cities = await res.json();

  const optionsHtml = cities
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join("");
  adminCitySelect.innerHTML = optionsHtml;
  document.getElementById("formCityId").innerHTML = optionsHtml;

  const maceio = cities.find((c) => c.name === "Maceió") || cities[0];
  if (maceio) {
    adminCitySelect.value = String(maceio.id);
    await loadCityPoints(maceio.id);
  }
}

async function loadCityPoints(cityId) {
  const res = await fetch(`/vaccination-points/${cityId}`);
  currentPoints = await res.json();
  renderTable();
}

function renderTable() {
  const q = adminSearch.value.trim().toLowerCase();
  const filtered = currentPoints.filter(
    (p) =>
      !q ||
      (p.name || "").toLowerCase().includes(q) ||
      (p.neighborhood || "").toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    pointsTableBody.innerHTML = `
      <tr><td colspan="4" style="text-align:center; color:#64748b;">Nenhum ponto encontrado nesta cidade.</td></tr>
    `;
    return;
  }

  pointsTableBody.innerHTML = filtered
    .map(
      (p) => `
      <tr>
        <td><strong>${escapeHtml(p.name)}</strong><br><small style="color:#64748b;">ID: ${p.id}</small></td>
        <td>${escapeHtml(p.neighborhood || "—")}<br><small style="color:#64748b;">${escapeHtml(p.address || "Endereço não informado")}</small></td>
        <td><small>${p.vaccines.length} vacina(s)</small></td>
        <td class="actions-cell">
          <button class="btn btn-outline btn-sm" type="button" onclick="openEditModal(${p.id})">Editar</button>
          <button class="btn btn-danger btn-sm" type="button" onclick="deletePoint(${p.id})">Excluir</button>
        </td>
      </tr>
    `
    )
    .join("");
}

function openModal(point = null) {
  document.getElementById("pointId").value = point ? String(point.id) : "";
  document.getElementById("formCityId").value = String(
    point ? point.city_id : adminCitySelect.value
  );
  document.getElementById("formName").value = point ? point.name : "";
  document.getElementById("formAddress").value = point?.address || "";
  document.getElementById("formNeighborhood").value = point?.neighborhood || "";
  document.getElementById("formPhone").value = point?.phone || "";
  document.getElementById("formHours").value = point?.opening_hours || "";
  renderVaccineCheckboxes(point ? point.vaccines : DEFAULT_VACCINES);
  modalTitle.textContent = point ? "Editar Ponto de Vacinação" : "Novo Ponto de Vacinação";
  pointModal.classList.add("open");
}

function closeModal() {
  pointModal.classList.remove("open");
}

window.openEditModal = (id) => {
  const point = currentPoints.find((p) => p.id === id);
  if (point) openModal(point);
};

window.deletePoint = async (id) => {
  if (!confirm("Deseja realmente excluir este ponto de vacinação?")) return;
  const res = await fetch(`/api/admin/vaccination-points/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (res.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY);
    setLoggedInState(false);
    showToast("Sessão expirada. Faça login novamente.", true);
    return;
  }
  if (!res.ok) {
    showToast("Erro ao excluir ponto.", true);
    return;
  }
  showToast("Ponto removido com sucesso!");
  await loadCityPoints(Number(adminCitySelect.value));
};

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("adminPassword").value;
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    showToast("Senha incorreta.", true);
    return;
  }
  const data = await res.json();
  sessionStorage.setItem(TOKEN_KEY, data.token);
  setLoggedInState(true);
  await initAdmin();
  showToast("Login realizado!");
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(TOKEN_KEY);
  setLoggedInState(false);
});

adminCitySelect.addEventListener("change", (e) => loadCityPoints(Number(e.target.value)));
adminSearch.addEventListener("input", renderTable);
newPointBtn.addEventListener("click", () => openModal(null));
closeModalBtn.addEventListener("click", closeModal);
cancelModalBtn.addEventListener("click", closeModal);

pointForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("pointId").value;
  const checkedVaccines = Array.from(
    vaccinesCheckboxes.querySelectorAll("input:checked")
  ).map((el) => el.value);
  const customVaccines = document
    .getElementById("formCustomVaccines")
    .value.split(";")
    .map((v) => v.trim())
    .filter(Boolean);

  const payload = {
    city_id: Number(document.getElementById("formCityId").value),
    name: document.getElementById("formName").value.trim(),
    address: document.getElementById("formAddress").value.trim() || null,
    neighborhood: document.getElementById("formNeighborhood").value.trim() || null,
    phone: document.getElementById("formPhone").value.trim() || null,
    opening_hours: document.getElementById("formHours").value.trim() || null,
    vaccines: Array.from(new Set([...checkedVaccines, ...customVaccines])),
  };

  const url = id ? `/api/admin/vaccination-points/${id}` : "/api/admin/vaccination-points";
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    closeModal();
    sessionStorage.removeItem(TOKEN_KEY);
    setLoggedInState(false);
    showToast("Sessão expirada. Faça login novamente.", true);
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    showToast(err?.error?.message || "Erro ao salvar ponto.", true);
    return;
  }

  closeModal();
  showToast(id ? "Ponto atualizado!" : "Ponto cadastrado!");
  adminCitySelect.value = String(payload.city_id);
  await loadCityPoints(payload.city_id);
});

if (getToken()) {
  setLoggedInState(true);
  initAdmin();
}
