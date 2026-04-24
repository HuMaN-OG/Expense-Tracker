/**
 * utils.js - Premium UI Utilities
 * Includes Toast Notifications and Custom Confirmation Modals
 */

const utils = {
  /**
   * Show a professional toast notification
   * @param {string} message 
   * @param {string} type - 'success', 'error', 'info', 'warning'
   */
  showToast: (message, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon mapping
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    const timer = setTimeout(() => {
      toast.classList.add('toast-fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 4000);

    // Manual close
    toast.querySelector('.toast-close').onclick = () => {
      clearTimeout(timer);
      toast.remove();
    };
  },

  /**
   * Custom modern confirmation modal
   * @param {string} message 
   * @param {function} onConfirm 
   * @param {string} title 
   */
  confirm: (message, onConfirm, title = 'Are you sure?') => {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'confirm-overlay';

    modalOverlay.innerHTML = `
      <div class="confirm-modal card">
        <div class="confirm-header">
          <h3>${title}</h3>
        </div>
        <div class="confirm-body">
          <p>${message}</p>
        </div>
        <div class="confirm-footer">
          <button id="confirm-cancel" class="btn btn-outline btn-sm">Cancel</button>
          <button id="confirm-ok" class="btn btn-primary btn-sm">Confirm</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    const close = () => {
      modalOverlay.classList.add('fade-out');
      modalOverlay.addEventListener('animationend', () => modalOverlay.remove());
    };

    modalOverlay.querySelector('#confirm-cancel').onclick = close;
    modalOverlay.querySelector('#confirm-ok').onclick = () => {
      onConfirm();
      close();
    };

    // Close on escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        close();
        window.removeEventListener('keydown', escHandler);
      }
    };
    window.addEventListener('keydown', escHandler);
  },

  /**
   * Professional Logout with confirmation and toast
   */
  logout: () => {
    utils.confirm('You will be returned to the login screen.', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      utils.showToast('Logged out successfully', 'success');
      
      // Delay redirect to show toast
      setTimeout(() => {
        window.location.href = '/';
      }, 800); // 800ms is enough to see the toast
    }, 'Sign Out?');
  }
};

window.utils = utils;
