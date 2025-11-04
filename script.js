const API_URL = 'http://localhost:3000/api/movimentos';

// registrar entrada 
document.getElementById('formEntrada').addEventListener('submit', async (e) => {
  e.preventDefault();
  const placa = document.getElementById('placaEntrada').value;

  if (!placa) {
    alert('Por favor, digite a placa do veículo!');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/entrada`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placa: placa.toUpperCase() })
    });

    const data = await res.json();
    alert(data.message || data.error);
    
    if (res.ok) {
      listarMovimentos();
      e.target.reset();
    }
  } catch (error) {
    alert('Erro ao registrar entrada. Tente novamente.');
    console.error('Erro:', error);
  }
});

// registrar saída 
document.getElementById('formSaida').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('idSaida').value;

  if (!id) {
    alert('Por favor, digite o ID do movimento!');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/saida/${id}`, { 
      method: 'PUT' 
    });
    
    const data = await res.json();
    alert(data.message || data.error);
    
    if (res.ok) {
      listarMovimentos();
      e.target.reset();
    }
  } catch (error) {
    alert('Erro ao registrar saída. Tente novamente.');
    console.error('Erro:', error);
  }
});

// listar movimentos 
document.getElementById('btnListar').addEventListener('click', listarMovimentos);

async function listarMovimentos() {
  try {
    const res = await fetch(API_URL);
    const movimentos = await res.json();

    const tbody = document.getElementById('tabelaBody');
    const totalCarros = document.getElementById('totalCarros');
    const totalValor = document.getElementById('totalValor');
    const totalMovimentos = document.getElementById('totalMovimentos');

    tbody.innerHTML = '';

    let carrosEstacionados = 0;
    let valorTotal = 0;

    movimentos.forEach(m => {
      const tr = document.createElement('tr');
      
      // SEM COLUNA STATUS
      tr.innerHTML = `
        <td><strong>${m.id}</strong></td>
        <td><code>${m.placa}</code></td>
        <td>${m.hora_entrada ? new Date(m.hora_entrada).toLocaleString('pt-BR') : '-'}</td>
        <td>${m.hora_saida ? new Date(m.hora_saida).toLocaleString('pt-BR') : '-'}</td>
        <td><strong>${m.valor ? 'R$ ' + m.valor.toFixed(2) : '-'}</strong></td>
      `;
      tbody.appendChild(tr);

      if (!m.hora_saida) carrosEstacionados++;
      if (m.valor) valorTotal += m.valor;
    });

    // Atualizar estatísticas
    totalCarros.textContent = carrosEstacionados;
    totalValor.textContent = 'R$ ' + valorTotal.toFixed(2);
    totalMovimentos.textContent = movimentos.length;

  } catch (error) {
    console.error('Erro ao carregar movimentos:', error);
    alert('Erro ao carregar dados. Verifique a conexão.');
  }
}

// logout
async function logout() {
  try {
    await fetch('http://localhost:3000/api/auth/logout');
    window.location.href = '/login.html';
  } catch (error) {
    window.location.href = '/login.html';
  }
}

// atualiza a lista automaticamente ao abrir a página
document.addEventListener('DOMContentLoaded', function() {
  listarMovimentos();
  
  // Auto-focus no campo de placa
  document.getElementById('placaEntrada')?.focus();
});