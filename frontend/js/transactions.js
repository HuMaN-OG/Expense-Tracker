const BASE_URL = 'http://localhost:5000/api';
let currentTransactions = [];

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  // Setup UI
  const userName = localStorage.getItem('userName');
  if (userName) document.getElementById('user-greeting').textContent = `Welcome, ${userName}!`;
  
  document.getElementById('btn-logout').addEventListener('click', () => {
    utils.logout();
  });

  // Modal logic
  const modal = document.getElementById('expense-modal');
  const fab = document.getElementById('btn-add-new');
  const closeModal = document.querySelector('.close-modal');

  fab.addEventListener('click', () => {
    document.getElementById('form-expense').reset();
    document.getElementById('exp-id').value = '';
    document.getElementById('modal-title').textContent = 'Add Transaction';
    document.getElementById('exp-error').textContent = '';
    document.getElementById('exp-date').valueAsDate = new Date();
    document.getElementById('exp-note').value = '';
    modal.classList.remove('hidden');
  });

  closeModal.addEventListener('click', () => modal.classList.add('hidden'));
  window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

  // Filters setup
  const btnSearch = document.getElementById('btn-search');
  btnSearch.addEventListener('click', fetchTransactions);

  // CSV Export logic
  const btnExport = document.getElementById('btn-export');
  if (btnExport) {
    btnExport.addEventListener('click', exportToCSV);
  }

  // Initial fetch
  fetchTransactions();

  // Form Submit (Create / Update)
  document.getElementById('form-expense').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('exp-id').value;
    const type = document.getElementById('exp-type').value;
    const title = document.getElementById('exp-title').value;
    const amount = document.getElementById('exp-amount').value;
    const category = document.getElementById('exp-category').value;
    const date = document.getElementById('exp-date').value;
    const note = document.getElementById('exp-note').value;
    const errorEl = document.getElementById('exp-error');

    if (amount < 0) {
      errorEl.textContent = 'Amount cannot be negative';
      return;
    }

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${BASE_URL}/expenses/${id}` : `${BASE_URL}/expenses`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type, title, amount: Number(amount), category, date, note })
      });
      const data = await res.json();
      
      if (data.success) {
        modal.classList.add('hidden');
        utils.showToast(id ? 'Transaction updated' : 'Transaction added', 'success');
        fetchTransactions();
      } else {
        errorEl.textContent = data.message;
        if(res.status === 401) window.location.href = 'index.html';
      }
    } catch (err) {
      errorEl.textContent = 'Server error.';
    }
  });
});

async function fetchTransactions() {
  const token = localStorage.getItem('token');
  const type = document.getElementById('filter-type').value;
  const category = document.getElementById('filter-category').value;
  const startDate = document.getElementById('filter-start').value;
  const endDate = document.getElementById('filter-end').value;
  const search = document.getElementById('filter-search').value;

  let query = '?';
  if (type !== 'All') query += `type=${type}&`;
  if (category !== 'All') query += `category=${category}&`;
  if (startDate) query += `startDate=${startDate}&`;
  if (endDate) query += `endDate=${endDate}&`;
  if (search) query += `search=${encodeURIComponent(search)}&`;

  try {
    const res = await fetch(`${BASE_URL}/expenses${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    const data = await res.json();
    if (data.success) {
      currentTransactions = data.data;
      renderTransactions(data.data);
    }
  } catch (error) {

  }
}

function renderTransactions(transactions) {
  const tbody = document.getElementById('transactions-list');
  tbody.innerHTML = '';

  if (transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align: center;">No transactions found</td></tr>';
    return;
  }

  transactions.forEach(t => {
    const dateStr = new Date(t.date).toISOString().split('T')[0];
    const displayDate = new Date(t.date).toLocaleDateString();
    const amountClass = t.type === 'income' ? 'text-income' : 'text-expense';
    const amountPrefix = t.type === 'income' ? '+' : '-';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${displayDate}</td>
      <td>${t.title}</td>
      <td><span class="text-muted">${t.category}</span></td>
      <td style="text-transform: capitalize;">${t.type}</td>
      <td class="${amountClass}" style="font-weight: 600;">${amountPrefix}₹${t.amount.toFixed(2)}</td>
      <td>
        <button class="action-btn action-edit" onclick="editExpense('${t._id}', '${t.type}', '${t.title}', ${t.amount}, '${t.category}', '${dateStr}', '${(t.note || '').replace(/'/g, "\\'")}')">✎</button>
        <button class="action-btn action-delete" onclick="deleteExpense('${t._id}')">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function exportToCSV() {
  if (currentTransactions.length === 0) {
    utils.showToast('No transactions to export', 'warning');
    return;
  }

  const headers = ['Date', 'Title', 'Category', 'Type', 'Amount', 'Note'];
  const rows = currentTransactions.map(t => {
    return [
      new Date(t.date).toLocaleDateString(),
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.type,
      t.amount.toFixed(2),
      `"${(t.note || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'expense_tracker_export.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  utils.showToast('Export successful', 'success');
}

// Make functions globally available for inline onclick
window.editExpense = function(id, type, title, amount, category, date, note) {
  const modal = document.getElementById('expense-modal');
  document.getElementById('exp-id').value = id;
  document.getElementById('exp-type').value = type;
  document.getElementById('exp-title').value = title;
  document.getElementById('exp-amount').value = amount;
  document.getElementById('exp-category').value = category;
  document.getElementById('exp-date').value = date;
  document.getElementById('exp-note').value = note || '';
  document.getElementById('modal-title').textContent = 'Edit Transaction';
  document.getElementById('exp-error').textContent = '';
  modal.classList.remove('hidden');
};

window.deleteExpense = function(id) {
  utils.confirm('Are you sure you want to delete this transaction?', async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BASE_URL}/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
        return;
      }

      const data = await res.json();
      if (data.success) {
        utils.showToast('Transaction removed', 'success');
        fetchTransactions();
      } else {
        utils.showToast(data.message, 'error');
      }
    } catch (err) {
      utils.showToast('Failed to delete transaction', 'error');
    }
  }, 'Remove Transaction');
};
