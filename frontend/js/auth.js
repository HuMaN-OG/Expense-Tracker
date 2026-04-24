const BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLoginContainer = document.getElementById('form-login-container');
  const formRegisterContainer = document.getElementById('form-register-container');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const loginError = document.getElementById('login-error');
  const regError = document.getElementById('reg-error');

  // Check if already logged in
  if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
  }

  // Tab switching
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLoginContainer.classList.remove('hidden');
    formRegisterContainer.classList.add('hidden');
    loginError.textContent = '';
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegisterContainer.classList.remove('hidden');
    formLoginContainer.classList.add('hidden');
    regError.textContent = '';
  });

  // Login Handle
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('userName', data.data.name);
        utils.showToast(`Welcome back, ${data.data.name}!`, 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
      } else {
        loginError.textContent = data.message;
      }
    } catch (err) {
      loginError.textContent = 'Server error. Please try again.';
    }
  });

  // Register Handle
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    regError.textContent = ''; // Clear previous errors

    if (password !== confirm) {
      regError.textContent = 'Passwords do not match';
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('userName', data.data.name);
        utils.showToast('Account created successfully!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
      } else {
        regError.textContent = data.message;
      }
    } catch (err) {
      regError.textContent = 'Server error. Please try again.';
    }
  });
});
