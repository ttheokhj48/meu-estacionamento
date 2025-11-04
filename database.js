const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ Criar tabelas na PRIMEIRA conexão
let tablesCreated = false;

async function ensureTables() {
  if (tablesCreated) return;
  
  try {
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS veiculos (
        id SERIAL PRIMARY KEY,
        placa TEXT UNIQUE NOT NULL,
        modelo TEXT,
        cor TEXT,
        usuario_id INTEGER,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS movimentos (
        id SERIAL PRIMARY KEY,
        placa TEXT NOT NULL,
        hora_entrada TIMESTAMP NOT NULL,
        hora_saida TIMESTAMP,
        valor REAL DEFAULT 0
      )
    `);

    client.release();
    tablesCreated = true;
    console.log('✅ Tabelas verificadas/criadas!');
    
  } catch (err) {
    console.error('❌ Erro ao criar tabelas:', err.message);
  }
}

// Converter ? para $1, $2, $3
function convertQuery(sql) {
  let paramCount = 0;
  return sql.replace(/\?/g, () => `$${++paramCount}`);
}

const db = {
  run: async (sql, params = [], callback) => {
    await ensureTables();
    const convertedSql = convertQuery(sql);
    // ... resto do código igual
