const express = require('express');
// importa o Express (framework web para Node) 
const session = require('express-session');
// gerencia sessões (usuário logado) 
const bodyParser = require('body-parser');
// converte corpo de requisições (formulários e JSON) para req.body 
const cors = require('cors');
// permite requisições de diferentes origens (front-end)
const path = require('path');
const fs = require('fs');
// módulos nativos para manipular caminho 

const db = require('./database');
// traz a conexão com o banco (database.js)

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: permite que front-end em outras origens/portas acesse a API
app.use(cors());

// body-parser: transforma JSON e dados de formulário em req.body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// sessão: guarda informação do usuário logado entre requisições
app.use(session({
  secret: process.env.SESSION_SECRET || 'njhs_haghgh_48762387_hsdkjshkjh_634865862',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 4,
    secure: process.env.NODE_ENV === 'production' // HTTPS em produção
  }
}));

// 🔥 CORREÇÃO: Serve arquivos da pasta RAIZ (como estava funcionando)
app.use(express.static(path.join(__dirname)));

// rota simples para checar servidor
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// rota raiz: se existir index.html na RAIZ, envia-o
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Servidor rodando. Arquivos na pasta raiz.');
  }
});

// montagem condicional das rotas (se existirem em /routes) 
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

// montar rotas que criar nas próximas etapas
tryMountRoute('./routes/auth', '/api/auth');
tryMountRoute('./routes/usuarios', '/api/usuarios');
tryMountRoute('./routes/veiculos', '/api/veiculos');
tryMountRoute('./routes/movimentos', '/api/movimentos');

// tratamento de erros simples 
app.use((err, req, res, next) => {
  console.error('Erro interno:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// iniciar servidor 
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} — abra http://localhost:${PORT}`);
}); 