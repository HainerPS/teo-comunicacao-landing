require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pool = require("./database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

  app.post("/leads", async (req, res) => {
    try {
      let { nome, email, telefone, empresa, mensagem } = req.body;
  
      // validação básica
      if (!nome || !email) {
        return res.status(400).json({
          error: "Nome e email são obrigatórios",
        });
      }
  
      // limpeza dos dados
      nome = nome.trim();
      email = email.trim();
      telefone = telefone ? telefone.trim() : null;
      empresa = empresa ? empresa.trim() : null;
      mensagem = mensagem ? mensagem.trim() : null;
  
      const result = await pool.query(
        `INSERT INTO leads (nome, email, telefone, empresa, mensagem)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [nome, email, telefone, empresa, mensagem]
      );
  
      res.status(201).json({
        message: "Lead salvo com sucesso",
        lead: result.rows[0],
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao salvar lead" });
    }
  });

  app.post("/login", async (req, res) => {
    try {
      const { password } = req.body;
  
      if (!password) {
        return res.status(400).json({ error: "Senha é obrigatória" });
      }
  
      const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  
      if (!adminPasswordHash) {
        return res.status(500).json({ error: "Senha admin não configurada" });
      }
  
      const passwordMatch = await bcrypt.compare(password, adminPasswordHash);
  
      if (!passwordMatch) {
        return res.status(401).json({ error: "Senha inválida" });
      }
  
      const token = jwt.sign(
        { role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );
  
      res.json({
        message: "Login realizado com sucesso",
        token,
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  app.get("/leads", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM leads ORDER BY created_at DESC"
      );
  
      res.json(result.rows);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar leads" });
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