const express = require('express');
const bcrypt = require('bcrypt'); // criptografar senhas 
const db = require('../database'); // conecta com o banco de dados 

const router = express.Router(); // cria um mini "subservidor" dentro do principal 

router.post('/register', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Preencha todos os campos!' });
  }

  // Validação simples de email
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Email inválido!' });
  }

  // Validação de tamanho da senha
  if (senha.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres!' });
  }

  const senhaCriptografada = bcrypt.hashSync(senha, 10); // criptografa a senha antes de salvar 

  // insere no banco de dados 
  const query = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
  db.run(query, [nome, email, senhaCriptografada], function (err) {
    if (err) {
      console.error('Erro ao cadastrar usuário:', err.message);
      
      // Erro específico para email duplicado
      if (err.message.includes('UNIQUE constraint failed') || err.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
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

  const query = 'SELECT * FROM usuarios WHERE email = ?';
  db.get(query, [email], (err, usuario) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // compara a senha informada com a senha salva (criptografada)
    const senhaCorreta = bcrypt.compareSync(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    // salva as informações na sessão
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
    
    // Limpar cookie no cliente também
    res.clearCookie('connect.sid');
    console.log(`Usuário ${usuarioNome} deslogado com sucesso!`);
    res.json({ message: 'Logout realizado com sucesso!' });
  });
});

// verificar se o usuário está logado 
router.get('/check', (req, res) => {
  if (req.session.usuario) {
    res.json({ logado: true, usuario: req.session.usuario });
  } else {
    res.json({ logado: false });
  }
});

module.exports = router; 