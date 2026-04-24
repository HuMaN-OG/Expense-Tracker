// theme.js - Handles Dark/Light Mode Toggling

// Execute immediately to prevent flash of wrong theme
(function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  // Default to dark mode if nothing is saved
  const activeTheme = savedTheme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', activeTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  const themeToggleParam = document.getElementById('theme-toggle');
  
  if (themeToggleParam) {
    // Update button text/icon initially
    updateToggleButton(themeToggleParam);

    themeToggleParam.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateToggleButton(themeToggleParam);
      
      // Optional: Dispatch a custom event if charts need to be forcefully redrawn
      document.dispatchEvent(new Event('themeChanged'));
    });
  }

  function updateToggleButton(btn) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = isDark ? '<span>☀️ Light</span>' : '<span>🌙 Dark</span>';
  }
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {})
      .catch(err => {});
  });
}
