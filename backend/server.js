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

  async function createLeadsTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
          nome TEXT NOT NULL,
          email TEXT NOT NULL,
          telefone TEXT,
          empresa TEXT,
          mensagem TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
  
      console.log("Tabela leads pronta");
    } catch (error) {
      console.error("Erro ao criar tabela leads:", error);
    }
  }
  
  createLeadsTable();

// porta
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});