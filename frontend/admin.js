const API_URL = "https://teo-backend-az8f.onrender.com";

let currentPage = 1;

window.onload = () => {
  const token = localStorage.getItem("token");

  if (token) {
    showDashboard();
    loadLeads(currentPage);
  }
};

async function login() {
  const password = document.getElementById("password").value;

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ password })
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem("token", data.token);
    showDashboard();
    loadLeads(currentPage);
  } else {
    alert("Senha incorreta");
  }
}

function showDashboard() {
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
}

async function loadLeads(page = 1) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/leads?page=${page}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
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

    div.innerHTML = `
      <strong>Nome:</strong> ${lead.nome}<br>
      <strong>Email:</strong> ${lead.email}<br>
      <strong>Telefone:</strong> ${lead.telefone || "-"}<br>
      <strong>Empresa:</strong> ${lead.empresa || "-"}<br>
      <strong>Mensagem:</strong> ${lead.mensagem || "-"}<br>
      <small>Criado em: ${new Date(lead.created_at).toLocaleString("pt-BR")}</small>
      
      <br><br>
      <button onclick="editLead(${lead.id})">Editar</button>
      <button onclick="deleteLead(${lead.id})">Excluir</button>
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
      Authorization: `Bearer ${token}`
    }
  });

  loadLeads(currentPage);
}

async function editLead(id) {
  const nome = prompt("Novo nome:");
  const email = prompt("Novo email:");
  const telefone = prompt("Novo telefone:");
  const empresa = prompt("Nova empresa:");
  const mensagem = prompt("Nova mensagem:");

  if (!nome || !email) {
    alert("Nome e email são obrigatórios");
    return;
  }

  const token = localStorage.getItem("token");

  await fetch(`${API_URL}/leads/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      nome,
      email,
      telefone,
      empresa,
      mensagem
    })
  });

  loadLeads(currentPage);
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