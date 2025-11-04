const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database');

const router = express.Router();

router.post('/register', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Preencha todos os campos!' });
  }

  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Email inválido!' });
  }

  if (senha.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres!' });
  }

  const senhaCriptografada = bcrypt.hashSync(senha, 10);

  // ✅ CORRIGIDO: usa parâmetros PostgreSQL ($1, $2, $3)
  const query = 'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3)';
  db.run(query, [nome, email, senhaCriptografada], function (err) {
    if (err) {
      console.error('Erro ao cadastrar usuário:', err.message);
      
      if (err.message.includes('UNIQUE constraint failed') || err.message.includes('duplicate key')) {
        return res.status(400).json({ error: 'Este email já está cadastrado!' });
      }
      
      return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }
    console.log(`Usuário ${nome} cadastrado com sucesso!`);
    res.json({ message: 'Usuário cadastrado com sucesso!' });
  });
});

router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Preencha todos os campos!' });
  }

  // ✅ CORRIGIDO: usa parâmetros PostgreSQL
  const query = 'SELECT * FROM usuarios WHERE email = $1';
  db.get(query, [email], (err, usuario) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const senhaCorreta = bcrypt.compareSync(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email
    };

    console.log(`Usuário ${usuario.nome} logado com sucesso!`);
    res.json({ message: 'Login realizado com sucesso!', usuario: req.session.usuario });
  });
});

router.get('/logout', (req, res) => {
  const usuarioNome = req.session.usuario?.nome || 'Usuário';
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err.message);
      return res.status(500).json({ error: 'Erro ao sair da conta.' });
    }
    
    res.clearCookie('connect.sid');
    console.log(`Usuário ${usuarioNome} deslogado com sucesso!`);
    res.json({ message: 'Logout realizado com sucesso!' });
  });
});

router.get('/check', (req, res) => {
  if (req.session.usuario) {
    res.json({ logado: true, usuario: req.session.usuario });
  } else {
    res.json({ logado: false });
  }
});

module.exports = router;