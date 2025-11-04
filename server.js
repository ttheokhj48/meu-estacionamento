const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'njhs_haghgh_48762387_hsdkjshkjh_634865862',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 4,
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use(express.static(path.join(__dirname)));

app.get('/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ✅ CORREÇÃO AQUI: Redireciona direto para login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

function tryMountRoute(routePath, mountPoint) {
  try {
    const router = require(routePath);
    app.use(mountPoint, router);
    console.log(`Rota montada: ${mountPoint} -> ${routePath}`);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log(`Arquivo de rota não encontrado (ok por enquanto): ${routePath}`);
    } else {
      console.error(`Erro ao montar rota ${routePath}:`, err);
    }
  }
}

// ✅ LINHAS CORRIGIDAS - procurando na RAIZ
tryMountRoute('./auth', '/api/auth');
tryMountRoute('./usuarios', '/api/usuarios');
tryMountRoute('./veiculos', '/api/veiculos');
tryMountRoute('./movimentos', '/api/movimentos');

app.use((err, req, res, next) => {
  console.error('Erro interno:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} — abra http://localhost:${PORT}`);
});
