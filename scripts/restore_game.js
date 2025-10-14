import { showConfirmationModal } from "./modalhandler";
document.addEventListener('DOMContentLoaded', () => {
  let currentGameId = null;
  let currentUsername = null;

  function getLoggedInUsername() {
    const topWelcomeMessage = document.getElementById('topWelcomeMessage');
    if (!topWelcomeMessage) return null;
    const text = topWelcomeMessage.textContent || '';
    const parts = text.split(',');
    return parts.length > 1 ? parts[1].trim() : null;
  }

  // Loading overlay
  function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  async function simulateInputTyping(input, value) {
    if (!input) return;
    input.value = '';
    for (let ch of value.toString()) {
      const keyDownEvent = new KeyboardEvent('keydown', { key: ch });
      input.dispatchEvent(keyDownEvent);
      input.value += ch;
      const inputEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(inputEvent);
      const keyUpEvent = new KeyboardEvent('keyup', { key: ch });
      input.dispatchEvent(keyUpEvent);
      await new Promise((r) => setTimeout(r, 20));
    }
  }

  async function restoreBids(roundIndex, roundData) {
    for (let i = 0; i < roundData.length; i++) {
      const bidInput = document.getElementById(`r${roundIndex}-p${i}-bid`);
      const bidValue = roundData[i].bid || '0';
      await simulateInputTyping(bidInput, bidValue);
    }
  }

  async function restoreScores(roundIndex, roundData) {
    for (let i = 0; i < roundData.length; i++) {
      const scoreInput = document.getElementById(`r${roundIndex}-p${i}-score`);
      const scoreValue = roundData[i].score || '0';
      if (scoreInput && !scoreInput.disabled) {
        await simulateInputTyping(scoreInput, scoreValue);
      }
    }
  }

  async function restoreRoundsSequentially(gameId, gameData, username) {
    if (!gameData || !gameData.length) return;

    const playerNames = gameData[0].map((p) => p.playername);

    if (typeof window.startGameSession !== 'function') {
      console.error('startGameSession not defined');
      return;
    }

    window.startGameSession(playerNames, gameId, username);

    for (let roundIdx = 0; roundIdx < gameData.length; roundIdx++) {
      await restoreBids(roundIdx, gameData[roundIdx]);
      await new Promise((r) => setTimeout(r, 100));
      await restoreScores(roundIdx, gameData[roundIdx]);
      if (roundIdx < gameData.length - 1) {
        const addRowBtn = document.getElementById('addRowBtn');
        if (addRowBtn) {
          addRowBtn.click();
          await new Promise((r) => setTimeout(r, 300));
        } else if (typeof window.addRound === 'function') {
          window.addRound();
          await new Promise((r) => setTimeout(r, 300));
        } else {
          console.error('No way to add round');
          break;
        }
      }
    }

    if (typeof window.updateTotals === 'function') window.updateTotals();
  }

  function showRestoreBanner(gameId, gameData, username) {
    currentGameId = gameId;
    currentUsername = username;

    const banner = document.getElementById('activeGameBanner');
    if (!banner) return;

    banner.classList.remove('hidden');

    document.getElementById('continueGameBtn').onclick = async () => {
      showLoading();
      banner.classList.add('hidden');
      document.getElementById('welcome-page').classList.add('hidden');
      document.getElementById('game-page').classList.remove('hidden');

      try {
        await restoreRoundsSequentially(gameId, gameData, username);
      } catch (e) {
        console.error('Restore failed:', e);
      } finally {
        hideLoading();
      }
    };

    document.getElementById('ignoreGameBtn').onclick = () => {
      const message = `
        ⚠ You are about to cancel this game; all the progress will be lost and can't be viewed in history.<br>
        <b>Are you sure you want to proceed?</b>
      `;

      showConfirmationModal('Cancel Game', message, async () => {
        try {
          await deleteInProgressGame(currentGameId, currentUsername);
          hideModal();
          banner.classList.add('hidden');
          alert('In-progress game deleted successfully.');
          // Optionally refresh page or redirect user here
        } catch (err) {
          alert('Failed to delete game: ' + (err.message || err));
          console.error(err);
        }
      });
    };
  }

  async function deleteInProgressGame(gameId, username) {
    if (!gameId || !username) throw new Error('Missing gameId or username to delete game');

    const response = await fetch('server/delete_game.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: gameId, username }),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }
  }

  function restoreGameFlow() {
    const username = getLoggedInUsername();

    if (!username) {
      console.warn('Username not found');
      return;
    }

    fetch('server/restore_game.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.activeGameId && data.gameData) {
          showRestoreBanner(data.activeGameId, data.gameData, username);
        } else {
          const banner = document.getElementById('activeGameBanner');
          if (banner) banner.classList.add('hidden');
        }
      })
      .catch(console.error);
  }

  setTimeout(restoreGameFlow, 500);
});
