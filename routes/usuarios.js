const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database');

const router = express.Router();

// listar os usuários 
router.get('/', (req, res) => {
  const query = 'SELECT id, nome, email, data_cadastro FROM usuarios';
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Erro ao listar usuários:', err.message);
      return res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
    res.json(rows);
  });
});

// cadastrar novo usuário 
router.post('/', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Preencha todos os campos!' });
  }

  // Validação de email
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Email inválido!' });
  }

  // Validação de senha
  if (senha.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres!' });
  }

  const senhaCriptografada = bcrypt.hashSync(senha, 10);

  const query = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
  db.run(query, [nome, email, senhaCriptografada], function (err) {
    if (err) {
      console.error('Erro ao cadastrar usuário:', err.message);
      
      // Tratar email duplicado
      if (err.message.includes('UNIQUE constraint failed') || err.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
        return res.status(400).json({ error: 'Este email já está cadastrado!' });
      }
      
      return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }
    console.log(`Usuário ${nome} cadastrado com sucesso! ID: ${this.lastID}`);
    res.json({ 
      message: 'Usuário cadastrado com sucesso!', 
      id: this.lastID,
      usuario: { id: this.lastID, nome, email }
    });
  });
});

// obter um usuário específico
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = 'SELECT id, nome, email, data_cadastro FROM usuarios WHERE id = ?';
  db.get(query, [id], (err, usuario) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    res.json(usuario);
  });
});

// editar um usuário 
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nome, email, senha } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ error: 'Preencha nome e email!' });
  }

  // Validação de email
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Email inválido!' });
  }

  // Validação de senha (se for alterar)
  if (senha && senha.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres!' });
  }

  // Verificar se usuário existe primeiro
  const checkQuery = 'SELECT id FROM usuarios WHERE id = ?';
  db.get(checkQuery, [id], (err, usuario) => {
    if (err) {
      console.error('Erro ao verificar usuário:', err.message);
      return res.status(500).json({ error: 'Erro ao verificar usuário.' });
    }

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // atualiza com ou sem senha 
    let query, params;
    if (senha) {
      const senhaCriptografada = bcrypt.hashSync(senha, 10);
      query = 'UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?';
      params = [nome, email, senhaCriptografada, id];
    } else {
      query = 'UPDATE usuarios SET nome = ?, email = ? WHERE id = ?';
      params = [nome, email, id];
    }

    db.run(query, params, function (err) {
      if (err) {
        console.error('Erro ao editar usuário:', err.message);
        
        // Tratar email duplicado na edição
        if (err.message.includes('UNIQUE constraint failed') || err.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
          return res.status(400).json({ error: 'Este email já está em uso por outro usuário!' });
        }
        
        return res.status(500).json({ error: 'Erro ao editar usuário.' });
      }

      res.json({ message: 'Usuário atualizado com sucesso!' });
    });
  });
});

// excluir um usuário 
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Verificar se usuário existe primeiro
  const checkQuery = 'SELECT id FROM usuarios WHERE id = ?';
  db.get(checkQuery, [id], (err, usuario) => {
    if (err) {
      console.error('Erro ao verificar usuário:', err.message);
      return res.status(500).json({ error: 'Erro ao verificar usuário.' });
    }

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const query = 'DELETE FROM usuarios WHERE id = ?';
    db.run(query, [id], function (err) {
      if (err) {
        console.error('Erro ao excluir usuário:', err.message);
        return res.status(500).json({ error: 'Erro ao excluir usuário.' });
      }

      console.log(`Usuário ID ${id} excluído com sucesso!`);
      res.json({ message: 'Usuário excluído com sucesso!' });
    });
  });
});

module.exports = router; 