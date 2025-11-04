const { Pool } = require('pg');
require('dotenv').config();

// Configuração do PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Converter ? para $1, $2, $3 (SQLite → PostgreSQL)
function convertQuery(sql) {
  let paramCount = 0;
  return sql.replace(/\?/g, () => {
    paramCount++;
    return `$${paramCount}`;
  });
}

// Testar conexão
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro ao conectar com PostgreSQL:', err.stack);
  } else {
    console.log('✅ Conectado ao PostgreSQL com sucesso!');
    
    // Criar tabelas
    createTables(client)
      .then(() => release())
      .catch(err => {
        console.error('Erro ao criar tabelas:', err);
        release();
      });
  }
});

// Função para criar tabelas
async function createTables(client) {
  try {
    // Tabela de usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de veículos
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

    // Tabela de movimentos (entradas/saídas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS movimentos (
        id SERIAL PRIMARY KEY,
        placa TEXT NOT NULL,
        hora_entrada TIMESTAMP NOT NULL,
        hora_saida TIMESTAMP,
        valor REAL DEFAULT 0
      )
    `);

    // Criar índices para melhor performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_placa_movimentos ON movimentos(placa)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_email_usuarios ON usuarios(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_placa_veiculos ON veiculos(placa)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hora_entrada ON movimentos(hora_entrada)`);

    console.log('✅ Tabelas criadas/verificadas com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao criar tabelas:', err);
    throw err;
  }
}

// Manter a mesma interface do SQLite para compatibilidade
const db = {
  run: (sql, params = [], callback) => {
    const convertedSql = convertQuery(sql);
    return pool.query(convertedSql, params)
      .then(result => {
        const lastID = result.rows[0]?.id || result.insertId;
        if (callback) callback(null, { lastID: lastID, changes: result.rowCount });
        return { lastID: lastID, changes: result.rowCount };
      })
      .catch(err => {
        if (callback) callback(err);
        throw err;
      });
  },
  
  get: (sql, params = [], callback) => {
    const convertedSql = convertQuery(sql);
    return pool.query(convertedSql, params)
      .then(result => {
        const row = result.rows[0] || null;
        if (callback) callback(null, row);
        return row;
      })
      .catch(err => {
        if (callback) callback(err);
        throw err;
      });
  },
  
  all: (sql, params = [], callback) => {
    const convertedSql = convertQuery(sql);
    return pool.query(convertedSql, params)
      .then(result => {
        const rows = result.rows;
        if (callback) callback(null, rows);
        return rows;
      })
      .catch(err => {
        if (callback) callback(err);
        throw err;
      });
  },
  
  // Para compatibilidade com db.serialize()
  serialize: (callback) => {
    callback();
  }
};

module.exports = db; 