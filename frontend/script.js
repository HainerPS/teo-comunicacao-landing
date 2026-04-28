const API_URL = "https://teo-backend-az8f.onrender.com";

const form = document.getElementById("leadForm");
const successMsg = document.getElementById("successMsg");
const errorMsg = document.getElementById("errorMsg");
const submitButton = form.querySelector("button");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  successMsg.style.display = "none";
  errorMsg.style.display = "none";

  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";

  const data = {
    nome: document.getElementById("nome").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    empresa: document.getElementById("empresa").value.trim(),
    mensagem: document.getElementById("mensagem").value.trim(),
  };

  try {
    const response = await fetch(`${API_URL}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Erro na requisição");
    }

    successMsg.style.display = "block";
    form.reset();

  } catch (error) {
    console.error(error);
    errorMsg.style.display = "block";

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Quero mais resultados";
  }
});