const { Pool } = require('pg');

// Configuração MÍNIMA do PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Interface simples
const db = {
  run: (sql, params = [], callback) => {
    const convertedSql = sql.replace(/\?/g, (_, i) => `$${i + 1}`);
    return pool.query(convertedSql, params)
      .then(result => {
        const response = { 
          lastID: result.rows[0]?.id, 
          changes: result.rowCount 
        };
        if (callback) callback(null, response);
        return response;
      })
      .catch(err => {
        if (callback) callback(err);
        throw err;
      });
  },
  
  get: (sql, params = [], callback) => {
    const convertedSql = sql.replace(/\?/g, (_, i) => `$${i + 1}`);
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
    const convertedSql = sql.replace(/\?/g, (_, i) => `$${i + 1}`);
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
  
  serialize: (callback) => callback()
};

// ✅ SEM inicialização automática - as rotas vão criar as tabelas quando necessário
console.log('✅ Database configurado (conexão lazy)');

module.exports = db;
