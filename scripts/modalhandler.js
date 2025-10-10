let confirmAction = null;

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('confirmationModal');
  const confirmBtn = document.getElementById('confirmActionBtn');
  const cancelBtn = document.getElementById('cancelActionBtn');

  confirmBtn.addEventListener('click', () => {
    if (typeof confirmAction === 'function') {
      confirmAction(); // Call confirm callback without relying on external getters
    }
    hideModal();
  });

  cancelBtn.addEventListener('click', () => {
    hideModal();
  });

  function hideModal() {
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      confirmAction = null;
    }
  }

  window.hideModal = hideModal; // Optional global exposure if needed
});

export function showConfirmationModal(header, message, onConfirm, options={}) {
  const modal = document.getElementById('confirmationModal');
  const modalMessage = document.getElementById('modalMessage');
  const confirmBtn = document.getElementById('confirmActionBtn');
  const cancelBtn = document.getElementById('cancelActionBtn');

  if (!modal || !modalMessage) return;

  modalMessage.innerHTML = `<h2>${header}</h2>${message}`;

  if (options.hideConfirmCancel) {
    confirmBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
  } else {
    confirmBtn.style.display = '';
    cancelBtn.style.display = '';
  }

  if (typeof onConfirm === 'function' && !options.hideConfirmCancel) {
    confirmAction = onConfirm;
  } else {
    confirmAction = null;
  }

  modal.classList.remove('hidden');
  modal.style.display = 'flex';

}
