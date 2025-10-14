import { getGameId, getLoggedInUserName, getRoundNumber, getPlayerNames, getCurrentGameState } from './scoresheet.js';
import { startGameSession } from './scoresheet.js';
import { saveGameProgress } from './gameinprogress.js';
import { showConfirmationModal } from './modalhandler.js';
import { resetGameAction } from './resetGameAction.js';
import { getPlayersRank } from './rank_calculator.js';

document.addEventListener('DOMContentLoaded', () => {
  const completeBtn = document.getElementById('completeBtn');
  const gamePage = document.getElementById('game-page');
  const welcomePage = document.getElementById('welcome-page');
  const totalRow = document.getElementById('totalRow');
  const cancelBtn = document.getElementById('gameResetBtn');

  completeBtn.addEventListener('click', () => {
    const pendingRounds = 13 - getRoundNumber();
    const header = "Game Completion";
    const message = `Are you sure you want to mark this game as completed midway? ${pendingRounds} rounds are pending.`;

    const gameId = getGameId();
    const username = getLoggedInUserName();
    const playerNames = getPlayerNames();

    if (!gameId || !username) {
      console.error("Game ID or Username not available");
      return;
    }

    showConfirmationModal(header, message, async () => {
      try {
        const response = await fetch('server/complete_game.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, game_id: gameId }),
        });
        const result = await response.json();
        if (result.error) {
          console.error("Error completing game:", result.error);
          return;
        }

        // Compute winner and last player info
        const totals = [];
        totalRow.querySelectorAll('.total-row td').forEach(td => totals.push(parseInt(td.textContent) || 0));

        const winnerMessage = getPlayersRank(playerNames,totals);

        showWinnerModal(
          "Game Over", winnerMessage,
          // New Game callback
          () => {
            resetGameAction();
            gamePage.classList.add('hidden');
            welcomePage.classList.remove('hidden');
          },
          // Replay callback
          async () => {
            try {
              const startResp = await fetch('server/start_game.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, players: playerNames }),
              });
              const startResult = await startResp.json();
              if (startResult.error) {
                console.error("Error starting new game:", startResult.error);
                return;
              }
              const newGameId = startResult.game_id;

              const currentScores = typeof getCurrentGameState === 'function' ? getCurrentGameState() : [];
              const saveResp = await fetch('server/save_game_json.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_id: newGameId, scores: currentScores }),
              });
              const saveResult = await saveResp.json();
              if (saveResult.error) {
                console.error("Error saving new game scores:", saveResult.error);
                return;
              }

              startGameSession(playerNames, newGameId, username);

              await saveGameProgress();
              resetGameAction();
              welcomePage.classList.add('hidden');
              gamePage.classList.remove('hidden');
            } catch (err) {
              console.error("Error during replay flow:", err);
            }
          }
        );
      } catch (err) {
        console.error("Error finishing game", err);
      }
    });
  });

  cancelBtn.addEventListener('click', () => {
    const gameId = getGameId();
    const username = getLoggedInUserName();

    const message = `
      ⚠ Canceling will remove all saved progress. Mark the game as <b>Complete</b> to preserve data.
        .<br><br>
      <b>Proceed with cancellation?</b>
    `;

    showConfirmationModal(
      "Cancel Game",
      message,
      async () => {
        try {
          // Backend delete action assumed at 'server/delete_game.php'
          const resp = await fetch('server/delete_game.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, game_id: gameId })
          });
          const result = await resp.json();
          if (result.error) {
            console.error("Error deleting game:", result.error);
            return;
          }
          //Reset UI
          resetGameAction();
          
          // UI: Go back to setup/welcome
          gamePage.classList.add('hidden');
          welcomePage.classList.remove('hidden');
        } catch (err) {
          console.error("Error in cancel flow:", err);
        }
      }
    );
  });


// CODE ENDS HERE
});

export function showWinnerModal(header, message, onNewGame, onReplay) {
    const modalContent = `
      <p>${message}</p>
      <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
        <button id="newGameBtn" class="btn complete-btn-style" style="flex:1">New Game</button>
        <button id="replayGameBtn" class="btn complete-btn-style" style="flex:1">Replay</button>
      </div>
    `;
    // Pass hideConfirmCancel option to hide default modal confirm/cancel buttons
    showConfirmationModal(header, modalContent, null, { hideConfirmCancel: true });

    setTimeout(() => {
      document.getElementById('newGameBtn')?.addEventListener('click', () => {
        window.hideModal();
        onNewGame?.();
      });
      document.getElementById('replayGameBtn')?.addEventListener('click', () => {
        window.hideModal();
        onReplay?.();
      });
    }, 0);
  }

