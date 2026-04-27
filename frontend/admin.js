const API_URL = "http://localhost:3000";

// verifica se já tem token
window.onload = () => {
  const token = localStorage.getItem("token");

  if (token) {
    showDashboard();
    loadLeads();
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
    loadLeads();
  } else {
    alert("Senha incorreta");
  }
}

function showDashboard() {
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
}

async function loadLeads() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/leads`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const leads = await res.json();

  const container = document.getElementById("leadsList");
  container.innerHTML = "";

  leads.forEach(lead => {
    const div = document.createElement("div");
    div.classList.add("lead");

    div.innerHTML = `
      <strong>Nome:</strong> ${lead.nome}<br>
      <strong>Email:</strong> ${lead.email}<br>
      <strong>Telefone:</strong> ${lead.telefone}<br>
      <strong>Empresa:</strong> ${lead.empresa}<br>
      <strong>Mensagem:</strong> ${lead.mensagem}<br>
    `;

    container.appendChild(div);
  });
}

function logout() {
  localStorage.removeItem("token");
  location.reload();
}