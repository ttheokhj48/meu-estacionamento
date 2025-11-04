const express = require('express');
const db = require('../database');

const router = express.Router();

// listar todos os veículos 
router.get('/', (req, res) => {
  const query = `
    SELECT v.*, u.nome as usuario_nome 
    FROM veiculos v 
    LEFT JOIN usuarios u ON v.usuario_id = u.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Erro ao listar veículos:', err.message);
      return res.status(500).json({ error: 'Erro ao listar veículos.' });
    }
    res.json(rows);
  });
});

// listar veículos de um usuário específico
router.get('/usuario/:usuario_id', (req, res) => {
  const { usuario_id } = req.params;
  
  const query = 'SELECT * FROM veiculos WHERE usuario_id = ?';
  db.all(query, [usuario_id], (err, rows) => {
    if (err) {
      console.error('Erro ao listar veículos do usuário:', err.message);
      return res.status(500).json({ error: 'Erro ao listar veículos.' });
    }
    res.json(rows);
  });
});

// cadastrar novo veículo 
router.post('/', (req, res) => {
  const { placa, modelo, cor, usuario_id } = req.body;

  if (!placa || !modelo || !cor || !usuario_id) {
    return res.status(400).json({ error: 'Preencha todos os campos!' });
  }

  const placaRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
  if (!placaRegex.test(placa.toUpperCase())) {
    return res.status(400).json({ error: 'Placa inválida! Formato esperado: ABC1D23' });
  }

  const checkUserQuery = 'SELECT id FROM usuarios WHERE id = ?';
  db.get(checkUserQuery, [usuario_id], (err, usuario) => {
    if (err) {
      console.error('Erro ao verificar usuário:', err.message);
      return res.status(500).json({ error: 'Erro ao verificar usuário.' });
    }

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const query = 'INSERT INTO veiculos (placa, modelo, cor, usuario_id) VALUES (?, ?, ?, ?)';
    db.run(query, [placa.toUpperCase(), modelo, cor, usuario_id], function (err) {
      if (err) {
        console.error('Erro ao cadastrar veículo:', err.message);
        
        if (err.message.includes('UNIQUE constraint failed') || err.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
          return res.status(400).json({ error: 'Esta placa já está cadastrada!' });
        }
        
        return res.status(500).json({ error: 'Erro ao cadastrar veículo.' });
      }
      console.log(`Veículo ${placa} cadastrado com sucesso!`);
      res.json({ 
        message: 'Veículo cadastrado com sucesso!', 
        id: this.lastID,
        veiculo: { id: this.lastID, placa: placa.toUpperCase(), modelo, cor, usuario_id }
      });
    });
  });
});

// obter um veículo específico
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT v.*, u.nome as usuario_nome 
    FROM veiculos v 
    LEFT JOIN usuarios u ON v.usuario_id = u.id 
    WHERE v.id = ?
  `;
  db.get(query, [id], (err, veiculo) => {
    if (err) {
      console.error('Erro ao buscar veículo:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar veículo.' });
    }
    
    if (!veiculo) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }
    
    res.json(veiculo);
  });
});

// editar um veículo 
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { placa, modelo, cor, usuario_id } = req.body;

  if (!placa || !modelo || !cor || !usuario_id) {
    return res.status(400).json({ error: 'Preencha todos os campos!' });
  }

  const placaRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
  if (!placaRegex.test(placa.toUpperCase())) {
    return res.status(400).json({ error: 'Placa inválida! Formato esperado: ABC1D23' });
  }

  const checkQuery = 'SELECT id FROM veiculos WHERE id = ?';
  db.get(checkQuery, [id], (err, veiculo) => {
    if (err) {
      console.error('Erro ao verificar veículo:', err.message);
      return res.status(500).json({ error: 'Erro ao verificar veículo.' });
    }

    if (!veiculo) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }

    const checkUserQuery = 'SELECT id FROM usuarios WHERE id = ?';
    db.get(checkUserQuery, [usuario_id], (err, usuario) => {
      if (err) {
        console.error('Erro ao verificar usuário:', err.message);
        return res.status(500).json({ error: 'Erro ao verificar usuário.' });
      }

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const query = 'UPDATE veiculos SET placa = ?, modelo = ?, cor = ?, usuario_id = ? WHERE id = ?';
      db.run(query, [placa.toUpperCase(), modelo, cor, usuario_id, id], function (err) {
        if (err) {
          console.error('Erro ao editar veículo:', err.message);
          
          if (err.message.includes('UNIQUE constraint failed') || err.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
            return res.status(400).json({ error: 'Esta placa já está em uso por outro veículo!' });
          }
          
          return res.status(500).json({ error: 'Erro ao editar veículo.' });
        }

        res.json({ message: 'Veículo atualizado com sucesso!' });
      });
    });
  });
});

// excluir um veículo 
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const checkQuery = 'SELECT id FROM veiculos WHERE id = ?';
  db.get(checkQuery, [id], (err, veiculo) => {
    if (err) {
      console.error('Erro ao verificar veículo:', err.message);
      return res.status(500).json({ error: 'Erro ao verificar veículo.' });
    }

    if (!veiculo) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }

    const query = 'DELETE FROM veiculos WHERE id = ?';
    db.run(query, [id], function (err) {
      if (err) {
        console.error('Erro ao excluir veículo:', err.message);
        return res.status(500).json({ error: 'Erro ao excluir veículo.' });
      }

      console.log(`Veículo ID ${id} excluído com sucesso!`);
      res.json({ message: 'Veículo excluído com sucesso!' });
    });
  });
});

module.exports = router;
