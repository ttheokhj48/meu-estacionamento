const sqlite3 = require('sqlite3').verbose();
const path = require('path');  // ← ADICIONEI ISSO

const DB_PATH = path.join(__dirname, 'estacionamento.db');  // ← CORRIGI AQUI

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir o banco de dados:', err.message);
    throw err;
  } else {
    console.log('✅ Conectado ao banco de dados SQLite.');
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Criar as tabelas 
db.serialize(() => {
  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de veículos
  db.run(`
    CREATE TABLE IF NOT EXISTS veiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placa TEXT UNIQUE NOT NULL,
      modelo TEXT,
      cor TEXT,
      usuario_id INTEGER,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `);

  // Tabela de movimentos
  db.run(`
    CREATE TABLE IF NOT EXISTS movimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placa TEXT NOT NULL,
      hora_entrada DATETIME NOT NULL,
      hora_saida DATETIME,
      valor REAL DEFAULT 0
    )
  `);

  // Criar índices
  db.run(`CREATE INDEX IF NOT EXISTS idx_placa_movimentos ON movimentos(placa)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_email_usuarios ON usuarios(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_placa_veiculos ON veiculos(placa)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_hora_entrada ON movimentos(hora_entrada)`);
});

module.exports = db;
