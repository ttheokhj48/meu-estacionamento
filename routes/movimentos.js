const express = require('express');
const db = require('../database');

const router = express.Router();

// função auxiliar para calcular valor
function calcularValor(horaEntrada, horaSaida) {
  const entrada = new Date(horaEntrada);
  const saida = new Date(horaSaida);

  const diffMs = saida - entrada; // diferença em milissegundos
  const diffHoras = diffMs / (1000 * 60 * 60); // converte pra horas

  const valorHora = 5; // valor fixo por hora
  const total = Math.ceil(diffHoras) * valorHora;

  return total > 0 ? total : valorHora; // mínimo 1 hora
}

// listar movimentos 
router.get('/', (req, res) => {
  const query = 'SELECT * FROM movimentos ORDER BY hora_entrada DESC';
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Erro ao listar movimentos:', err.message);
      return res.status(500).json({ error: 'Erro ao listar movimentos.' });
    }
    res.json(rows);
  });
});

// listar veículos atualmente estacionados
router.get('/estacionados', (req, res) => {
  const query = 'SELECT * FROM movimentos WHERE hora_saida IS NULL ORDER BY hora_entrada DESC';
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Erro ao listar veículos estacionados:', err.message);
      return res.status(500).json({ error: 'Erro ao listar veículos estacionados.' });
    }
    res.json(rows);
  });
});

// registrar entrada 
router.post('/entrada', (req, res) => {
  const { placa } = req.body;

  if (!placa) {
    return res.status(400).json({ error: 'Informe a placa do veículo!' });
  }

  // Validação básica de placa (formato Mercosul e antigo)
  const placaRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i;
  if (!placaRegex.test(placa)) {
    return res.status(400).json({ error: 'Placa inválida! Use o formato: ABC1D23 ou ABC1234' });
  }

  // Verificar se o veículo já está estacionado
  const checkEstacionadoQuery = `
    SELECT * FROM movimentos 
    WHERE placa = ? AND hora_saida IS NULL
  `;
  db.get(checkEstacionadoQuery, [placa.toUpperCase()], (err, movimentoAtivo) => {
    if (err) {
      console.error('Erro ao verificar movimento ativo:', err.message);
      return res.status(500).json({ error: 'Erro ao verificar movimento ativo.' });
    }

    if (movimentoAtivo) {
      return res.status(400).json({ error: 'Este veículo já está estacionado!' });
    }

    const horaEntrada = new Date().toISOString();

    const query = 'INSERT INTO movimentos (placa, hora_entrada) VALUES (?, ?)';
    db.run(query, [placa.toUpperCase(), horaEntrada], function (err) {
      if (err) {
        console.error('Erro ao registrar entrada:', err.message);
        return res.status(500).json({ error: 'Erro ao registrar entrada.' });
      }
      console.log(`✅ Entrada registrada para ${placa.toUpperCase()} às ${horaEntrada} - ID: ${this.lastID}`);
      res.json({ 
        message: 'Entrada registrada com sucesso!', 
        id: this.lastID,
        placa: placa.toUpperCase(),
        hora_entrada: horaEntrada
      });
    });
  });
});

// registrar saída 
router.put('/saida/:id', (req, res) => {
  const { id } = req.params;
  const horaSaida = new Date().toISOString();

  // busca o movimento original para calcular o valor 
  const buscarQuery = 'SELECT * FROM movimentos WHERE id = ?';
  db.get(buscarQuery, [id], (err, movimento) => {
    if (err) {
      console.error('Erro ao buscar movimento:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar movimento.' });
    }

    if (!movimento) {
      return res.status(404).json({ error: 'Movimento não encontrado.' });
    }

    if (movimento.hora_saida) {
      return res.status(400).json({ error: 'Este veículo já saiu!' });
    }

    const valor = calcularValor(movimento.hora_entrada, horaSaida);

    // SEM STATUS - apenas hora_saida e valor
    const updateQuery = 'UPDATE movimentos SET hora_saida = ?, valor = ? WHERE id = ?';
    db.run(updateQuery, [horaSaida, valor, id], function (err) {
      if (err) {
        console.error('Erro ao registrar saída:', err.message);
        return res.status(500).json({ error: 'Erro ao registrar saída.' });
      }

      console.log(`✅ Saída registrada para ${movimento.placa} às ${horaSaida}. Valor: R$${valor}`);
      res.json({
        message: 'Saída registrada com sucesso!',
        placa: movimento.placa,
        hora_entrada: movimento.hora_entrada,
        hora_saida: horaSaida,
        valor: valor,
        tempo_total: `${((new Date(horaSaida) - new Date(movimento.hora_entrada)) / (1000 * 60 * 60)).toFixed(2)} horas`
      });
    });
  });
});

// buscar movimento por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = 'SELECT * FROM movimentos WHERE id = ?';
  db.get(query, [id], (err, movimento) => {
    if (err) {
      console.error('Erro ao buscar movimento:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar movimento.' });
    }
    
    if (!movimento) {
      return res.status(404).json({ error: 'Movimento não encontrado.' });
    }
    
    res.json(movimento);
  });
});

// excluir um movimento 
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Verificar se movimento existe
  const checkQuery = 'SELECT id FROM movimentos WHERE id = ?';
  db.get(checkQuery, [id], (err, movimento) => {
    if (err) {
      console.error('Erro ao verificar movimento:', err.message);
      return res.status(500).json({ error: 'Erro ao verificar movimento.' });
    }

    if (!movimento) {
      return res.status(404).json({ error: 'Movimento não encontrado.' });
    }

    const query = 'DELETE FROM movimentos WHERE id = ?';
    db.run(query, [id], function (err) {
      if (err) {
        console.error('Erro ao excluir movimento:', err.message);
        return res.status(500).json({ error: 'Erro ao excluir movimento.' });
      }

      console.log(`🗑️ Movimento ID ${id} excluído com sucesso!`);
      res.json({ message: 'Movimento excluído com sucesso!' });
    });
  });
});

module.exports = router;