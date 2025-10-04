document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn?.addEventListener('click', async () => {
    try {
      const response = await fetch('server/logout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const result = await response.json();
      
      if (result.success) {
        // Clear local session storage key
        localStorage.removeItem('username');

        // Hide game UI containers here (adapt selectors as needed)
        document.getElementById('welcome-page')?.classList.add('hidden');
        document.getElementById('scoresheet-container')?.classList.add('hidden');
        document.getElementById('persistentHeader')?.classList.add('hidden');

        // Show authentication modal
        const authModal = document.getElementById('authModal');
        if (authModal) {
          authModal.classList.remove('hidden');
          authModal.style.display = 'flex';
        }
      } else {
        console.error('Logout failed:', result.message || result.error);
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    }
  });
});
