require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pool = require("./database");

const app = express();

// middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());

// rota teste
app.get("/", (req, res) => {
  res.send("API Téo Comunicação rodando 🚀");
});

app.get("/db-test", async (req, res) => {
    try {
      const result = await pool.query("SELECT NOW()");
      res.json({
        message: "Banco conectado com sucesso",
        time: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao conectar no banco" });
    }
  });

// porta
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});