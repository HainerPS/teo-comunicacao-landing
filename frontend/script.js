const form = document.getElementById("leadForm");
const successMsg = document.getElementById("successMsg");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  successMsg.style.display = "none";
  errorMsg.style.display = "none";

  const data = {
    nome: document.getElementById("nome").value,
    email: document.getElementById("email").value,
    telefone: document.getElementById("telefone").value,
    empresa: document.getElementById("empresa").value,
    mensagem: document.getElementById("mensagem").value,
  };

  try {
    const response = await fetch("http://localhost:3000/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error();

    successMsg.style.display = "block";
    form.reset();

  } catch (error) {
    errorMsg.style.display = "block";
  }
});