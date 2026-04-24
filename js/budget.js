const BASE_URL = CONFIG.API_URL;

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

  // Set default month
  const monthSelector = document.getElementById('month-selector');
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}`;
  monthSelector.value = currentMonthStr;

  // Initial Fetch
  fetchBudgetOverview();

  // Change Month
  monthSelector.addEventListener('change', fetchBudgetOverview);

  // Set Budget Handle
  document.getElementById('form-budget').addEventListener('submit', async (e) => {
    e.preventDefault();
    const category = document.getElementById('budget-category').value;
    const limit = document.getElementById('budget-limit').value;
    const month = document.getElementById('month-selector').value;
    const errorEl = document.getElementById('budget-error');

    if (limit < 0) {
      errorEl.textContent = 'Limit cannot be negative';
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ category, limit: Number(limit), month })
      });
      const data = await res.json();

      if (data.success) {
        document.getElementById('budget-limit').value = '';
        errorEl.textContent = '';
        utils.showToast('Budget updated successfully', 'success');
        fetchBudgetOverview();
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

async function fetchBudgetOverview() {
  const token = localStorage.getItem('token');
  const month = document.getElementById('month-selector').value;
  const headers = { 'Authorization': `Bearer ${token}` };

  try {
    const [budgetsRes, categoriesRes] = await Promise.all([
      fetch(`${BASE_URL}/budgets?month=${month}`, { headers }),
      fetch(`${BASE_URL}/analytics/categories?month=${month}`, { headers })
    ]);

    if (budgetsRes.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    const budgetsData = await budgetsRes.json();
    const categoriesData = await categoriesRes.json();

    if (budgetsData.success && categoriesData.success) {
      renderBudgets(budgetsData.data, categoriesData.data);
    }
  } catch (error) {
    // Silent fail, data handled by update summary
  }
}

function renderBudgets(budgets, categories) {
  const listEl = document.getElementById('budget-list');
  listEl.innerHTML = '';

  if (budgets.length === 0) {
    listEl.innerHTML = '<p class="text-muted">No budgets set for this month.</p>';
    return;
  }

  // Create lookup for spending by category
  const spendingMap = {};
  categories.forEach(c => { spendingMap[c.category] = c.total; });

  budgets.forEach(b => {
    const spent = spendingMap[b.category] || 0;
    const percentage = Math.min((spent / b.limit) * 100, 100);
    const isExceeded = spent > b.limit;
    
    // Note: Progress bar width has a nice transition defined in CSS
    const html = `
      <div class="budget-item card" style="padding: 1rem; margin-bottom: 1rem;">
        <div class="budget-item-header">
          <span>${b.category}</span>
          <span>₹${spent.toFixed(2)} / ₹${b.limit.toFixed(2)}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill ${isExceeded ? 'danger' : ''}" style="width: ${percentage}%"></div>
        </div>
        <div class="budget-item-stats">
          <span>${percentage.toFixed(1)}% Used</span>
          ${isExceeded ? `<span class="text-expense">Exceeded by ₹${(spent - b.limit).toFixed(2)}</span>` 
                       : `<span class="text-income">₹${(b.limit - spent).toFixed(2)} Left</span>`}
        </div>
      </div>
    `;
    listEl.innerHTML += html;
  });
}
