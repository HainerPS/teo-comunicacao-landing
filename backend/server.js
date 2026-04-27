require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());

// rota teste
app.get("/", (req, res) => {
  res.send("API Téo Comunicação rodando 🚀");
});

// porta
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});