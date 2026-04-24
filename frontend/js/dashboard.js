const BASE_URL = 'http://localhost:5000/api';
let barChartInstance = null;
let doughnutChartInstance = null;

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
  const fab = document.getElementById('fab-add');
  const closeModal = document.querySelector('.close-modal');

  fab.addEventListener('click', () => {
    document.getElementById('form-expense').reset();
    document.getElementById('exp-id').value = '';
    document.getElementById('modal-title').textContent = 'Add Transaction';
    document.getElementById('exp-error').textContent = '';
    // Set date to today
    document.getElementById('exp-date').valueAsDate = new Date();
    document.getElementById('exp-note').value = '';
    modal.classList.remove('hidden');
  });

  closeModal.addEventListener('click', () => modal.classList.add('hidden'));
  window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

  // Fetch Data
  fetchDashboardData();

  // Form Submit
  document.getElementById('form-expense').addEventListener('submit', async (e) => {
    e.preventDefault();
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

    try {
      const res = await fetch(`${BASE_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type, title, amount: Number(amount), category, date, note })
      });
      const data = await res.json();
      
      if (data.success) {
        modal.classList.add('hidden');
        utils.showToast('Transaction added successfully', 'success');
        fetchDashboardData();
      } else {
        utils.showToast(data.message, 'error');
        errorEl.textContent = data.message;
        if(res.status === 401) window.location.href = 'index.html';
      }
    } catch (err) {
      errorEl.textContent = 'Server error.';
    }
  });
});

async function fetchDashboardData() {
  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  try {
    const [summaryRes, monthlyRes, categoryRes, recentRes] = await Promise.all([
      fetch(`${BASE_URL}/analytics/summary`, { headers }),
      fetch(`${BASE_URL}/analytics/monthly`, { headers }),
      fetch(`${BASE_URL}/analytics/categories?month=${currentMonth}`, { headers }),
      fetch(`${BASE_URL}/expenses`, { headers })
    ]);

    if (summaryRes.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    const summary = await summaryRes.json();
    const monthly = await monthlyRes.json();
    const categories = await categoryRes.json();
    const recent = await recentRes.json();

    if (summary.success) updateSummary(summary.data);
    if (monthly.success) renderBarChart(monthly.data);
    if (categories.success) renderDoughnutChart(categories.data);
    if (recent.success) updateRecentTransactions(recent.data.slice(0, 5));

  } catch (error) {
    // Error handled by UI summary updates
  }
}

function updateSummary(data) {
  document.getElementById('total-income').textContent = `₹${data.totalIncome.toFixed(2)}`;
  document.getElementById('total-expense').textContent = `₹${data.totalExpense.toFixed(2)}`;
  document.getElementById('total-balance').textContent = `₹${data.balance.toFixed(2)}`;
}

function renderBarChart(data) {
  const ctx = document.getElementById('barChart').getContext('2d');
  const labels = data.map(d => d.month).slice(-6);
  const incomes = data.map(d => d.totalIncome).slice(-6);
  const expenses = data.map(d => d.totalExpense).slice(-6);

  if (barChartInstance) barChartInstance.destroy();

  barChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Income', data: incomes, backgroundColor: '#10b981', borderRadius: 4 },
        { label: 'Expense', data: expenses, backgroundColor: '#ef4444', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ₹${context.raw.toFixed(2)}` } }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderDoughnutChart(data) {
  const ctx = document.getElementById('doughnutChart').getContext('2d');
  const labels = data.map(d => d.category);
  const totals = data.map(d => d.total);
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  if (doughnutChartInstance) doughnutChartInstance.destroy();

  doughnutChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: totals,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 0, hoverOffset: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      plugins: {
        legend: { position: 'right' },
        tooltip: { callbacks: { label: (context) => `${context.label}: ₹${context.raw.toFixed(2)}` } }
      }
    }
  });
}

function updateRecentTransactions(transactions) {
  const tbody = document.getElementById('recent-transactions-list');
  tbody.innerHTML = '';
  
  if (transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-muted" style="text-align: center;">No transactions found</td></tr>';
    return;
  }

  transactions.forEach(t => {
    const date = new Date(t.date).toLocaleDateString();
    const amountClass = t.type === 'income' ? 'text-income' : 'text-expense';
    const amountPrefix = t.type === 'income' ? '+' : '-';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${date}</td>
      <td>${t.title}</td>
      <td><span class="text-muted">${t.category}</span></td>
      <td class="${amountClass}" style="font-weight: 600;">${amountPrefix}₹${t.amount.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}
