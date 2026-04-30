require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pool = require("./database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

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
    let { nome, email, telefone, empresa, mensagem, origem } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        error: "Nome e email são obrigatórios",
      });
    }

    nome = nome.trim();
    email = email.trim();
    telefone = telefone ? telefone.trim() : null;
    empresa = empresa ? empresa.trim() : null;
    mensagem = mensagem ? mensagem.trim() : null;
    origem = origem ? origem.trim() : "Landing Page";

    const result = await pool.query(
      `INSERT INTO leads (nome, email, telefone, empresa, mensagem, origem)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nome, email, telefone, empresa, mensagem, origem]
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

app.get("/leads", authMiddleware, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const origem = req.query.origem;

    let leadsResult;
    let countResult;

    if (origem) {
      leadsResult = await pool.query(
        `SELECT * FROM leads 
         WHERE origem = $1
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [origem, limit, offset]
      );

      countResult = await pool.query(
        "SELECT COUNT(*) FROM leads WHERE origem = $1",
        [origem]
      );
    } else {
      leadsResult = await pool.query(
        `SELECT * FROM leads 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      countResult = await pool.query("SELECT COUNT(*) FROM leads");
    }

    const totalLeads = Number(countResult.rows[0].count);
    const totalPages = Math.ceil(totalLeads / limit);

    res.json({
      leads: leadsResult.rows,
      pagination: {
        page,
        limit,
        totalLeads,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar leads" });
  }
});

app.put("/leads/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    let { nome, email, telefone, empresa, mensagem, origem } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        error: "Nome e email são obrigatórios",
      });
    }

    nome = nome.trim();
    email = email.trim();
    telefone = telefone ? telefone.trim() : null;
    empresa = empresa ? empresa.trim() : null;
    mensagem = mensagem ? mensagem.trim() : null;
    origem = origem ? origem.trim() : "Landing Page";

    const result = await pool.query(
      `UPDATE leads
       SET nome = $1,
           email = $2,
           telefone = $3,
           empresa = $4,
           mensagem = $5,
           origem = $6
       WHERE id = $7
       RETURNING *`,
      [nome, email, telefone, empresa, mensagem, origem, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead não encontrado" });
    }

    res.json({
      message: "Lead atualizado com sucesso",
      lead: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar lead" });
  }
});

app.delete("/leads/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM leads WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead não encontrado" });
    }

    res.json({
      message: "Lead excluído com sucesso",
      lead: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir lead" });
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
        origem TEXT DEFAULT 'Landing Page',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'Landing Page';
    `);

    await pool.query(`
      UPDATE leads 
      SET origem = 'Landing Page' 
      WHERE origem IS NULL;
    `);

    console.log("Tabela leads pronta");
  } catch (error) {
    console.error("Erro ao criar/atualizar tabela leads:", error);
  }
}

createLeadsTable();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});