const API_URL = "https://teo-backend-az8f.onrender.com";

let currentPage = 1;
let currentFilter = "";

window.onload = () => {
  const token = localStorage.getItem("token");

  if (token) {
    showDashboard();
    loadLeads(currentPage);
    loadLeadStats();
  }
};

async function login() {
  const password = document.getElementById("password").value;

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem("token", data.token);
    showDashboard();
    loadLeads(currentPage);
    loadLeadStats();
  } else {
    alert("Senha incorreta");
  }
}

function showDashboard() {
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
}

function setFilter(origem) {
  currentFilter = origem;
  currentPage = 1;
  loadLeads(currentPage);
}

function buildLeadsUrl(page = 1, limit = 15, origem = currentFilter) {
  const params = new URLSearchParams({
    page,
    limit,
  });

  if (origem) {
    params.append("origem", origem);
  }

  return `${API_URL}/leads?${params.toString()}`;
}

async function loadLeads(page = 1) {
  const token = localStorage.getItem("token");

  const res = await fetch(buildLeadsUrl(page), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    alert("Sessão expirada. Faça login novamente.");
    logout();
    return;
  }

  const data = await res.json();

  renderLeads(data.leads);
  renderPagination(data.pagination);
}

async function loadLeadStats() {
  const token = localStorage.getItem("token");

  try {
    const [totalRes, siteRes, landingRes] = await Promise.all([
      fetch(buildLeadsUrl(1, 1, ""), {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(buildLeadsUrl(1, 1, "Site Institucional"), {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(buildLeadsUrl(1, 1, "Landing Page"), {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (totalRes.status === 401 || siteRes.status === 401 || landingRes.status === 401) {
      alert("Sessão expirada. Faça login novamente.");
      logout();
      return;
    }

    const totalData = await totalRes.json();
    const siteData = await siteRes.json();
    const landingData = await landingRes.json();

    const totalLeads = document.getElementById("totalLeads");
    const siteLeads = document.getElementById("siteLeads");
    const landingLeads = document.getElementById("landingLeads");

    if (totalLeads) totalLeads.textContent = totalData.pagination.totalLeads;
    if (siteLeads) siteLeads.textContent = siteData.pagination.totalLeads;
    if (landingLeads) landingLeads.textContent = landingData.pagination.totalLeads;
  } catch (error) {
    console.error(error);
  }
}

function renderLeads(leads) {
  const container = document.getElementById("leadsList");
  container.innerHTML = "";

  if (!leads || leads.length === 0) {
    container.innerHTML = "<p>Nenhum lead encontrado.</p>";
    return;
  }

  leads.forEach((lead) => {
    const div = document.createElement("div");
    div.classList.add("lead");

    const origem = lead.origem || "Landing Page";

    div.innerHTML = `
      <div class="lead-info" id="lead-info-${lead.id}">
        <div>
          <h3>${lead.nome}</h3>
          <p><strong>E-mail:</strong> ${lead.email}</p>
          <p><strong>Empresa:</strong> ${lead.empresa || "-"}</p>
          <p><strong>Mensagem:</strong> ${lead.mensagem || "-"}</p>
          <p><strong>Origem:</strong> ${origem}</p>
          <p><strong>Recebido em:</strong> ${new Date(lead.created_at).toLocaleString("pt-BR")}</p>
        </div>

        <div>
          <p><strong>Telefone:</strong> ${lead.telefone || "-"}</p>
          <p><strong>ID:</strong> ${lead.id}</p>
        </div>
      </div>

      <div class="lead-actions">
        <button onclick="showEditForm(${lead.id})">Editar</button>
        <button class="delete-btn" onclick="deleteLead(${lead.id})">Excluir</button>
      </div>

      <div class="edit-form" id="edit-form-${lead.id}" style="display: none;">
        <input type="text" id="edit-nome-${lead.id}" value="${lead.nome}">
        <input type="email" id="edit-email-${lead.id}" value="${lead.email}">
        <input type="text" id="edit-telefone-${lead.id}" value="${lead.telefone || ""}">
        <input type="text" id="edit-empresa-${lead.id}" value="${lead.empresa || ""}">
        <textarea id="edit-mensagem-${lead.id}">${lead.mensagem || ""}</textarea>
        <input type="hidden" id="edit-origem-${lead.id}" value="${origem}">

        <button onclick="saveLead(${lead.id})">Salvar</button>
        <button onclick="cancelEdit(${lead.id})">Cancelar</button>
      </div>
    `;

    container.appendChild(div);
  });
}

function renderPagination(pagination) {
  let paginationDiv = document.getElementById("pagination");

  if (!paginationDiv) {
    paginationDiv = document.createElement("div");
    paginationDiv.id = "pagination";
    document.getElementById("dashboard").appendChild(paginationDiv);
  }

  paginationDiv.innerHTML = `
    <button onclick="previousPage()" ${pagination.page <= 1 ? "disabled" : ""}>
      Anterior
    </button>

    <span>Página ${pagination.page} de ${pagination.totalPages}</span>

    <button onclick="nextPage()" ${pagination.page >= pagination.totalPages ? "disabled" : ""}>
      Próxima
    </button>
  `;
}

async function deleteLead(id) {
  const confirmDelete = confirm("Deseja excluir este lead?");
  if (!confirmDelete) return;

  const token = localStorage.getItem("token");

  await fetch(`${API_URL}/leads/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  loadLeads(currentPage);
  loadLeadStats();
}

function showEditForm(id) {
  document.getElementById(`edit-form-${id}`).style.display = "grid";
}

function cancelEdit(id) {
  document.getElementById(`edit-form-${id}`).style.display = "none";
}

async function saveLead(id) {
  const token = localStorage.getItem("token");

  const data = {
    nome: document.getElementById(`edit-nome-${id}`).value.trim(),
    email: document.getElementById(`edit-email-${id}`).value.trim(),
    telefone: document.getElementById(`edit-telefone-${id}`).value.trim(),
    empresa: document.getElementById(`edit-empresa-${id}`).value.trim(),
    mensagem: document.getElementById(`edit-mensagem-${id}`).value.trim(),
    origem: document.getElementById(`edit-origem-${id}`).value.trim(),
  };

  if (!data.nome || !data.email) {
    alert("Nome e email são obrigatórios.");
    return;
  }

  await fetch(`${API_URL}/leads/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  loadLeads(currentPage);
  loadLeadStats();
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    loadLeads(currentPage);
  }
}

function nextPage() {
  currentPage++;
  loadLeads(currentPage);
}

function logout() {
  localStorage.removeItem("token");
  location.reload();
}

async function exportCSV() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(buildLeadsUrl(1, 1000, currentFilter), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    const leads = data.leads;

    if (!leads || leads.length === 0) {
      alert("Nenhum lead para exportar.");
      return;
    }

    let csv = "ID,Nome,Email,Telefone,Empresa,Mensagem,Origem,Data\n";

    leads.forEach((lead) => {
      csv += `${lead.id},"${lead.nome}","${lead.email}","${lead.telefone || ""}","${lead.empresa || ""}","${lead.mensagem || ""}","${lead.origem || "Landing Page"}","${new Date(lead.created_at).toLocaleString("pt-BR")}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    alert("Erro ao exportar CSV.");
  }
}