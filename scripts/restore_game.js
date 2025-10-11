document.addEventListener('DOMContentLoaded', () => {
    function getLoggedInUsername() {
        const topWelcomeMessage = document.getElementById('topWelcomeMessage');
        if (!topWelcomeMessage) return null;
        const text = topWelcomeMessage.textContent || '';
        const parts = text.split(',');
        return parts.length > 1 ? parts[1].trim() : null;
    }

    //   DISPLAY OR HIDE THE LOADING INFO
    function showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'flex';
    }

    function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }


    // Simulate typing characters one by one with keydown/input/keyup events
    async function simulateInputTyping(input, value) {
        if (!input) return;
        input.value = ''; // Clear first
        for (let ch of value.toString()) {
            const keyDownEvent = new KeyboardEvent('keydown', { key: ch });
            input.dispatchEvent(keyDownEvent);

            input.value += ch;

            const inputEvent = new Event('input', { bubbles: true });
            input.dispatchEvent(inputEvent);

            const keyUpEvent = new KeyboardEvent('keyup', { key: ch });
            input.dispatchEvent(keyUpEvent);

            await new Promise((r) => setTimeout(r, 20)); // slight delay per char
        }
    }

    // Restore bids for round, simulating user typing
    async function restoreBids(roundIndex, roundData) {
        for (let i = 0; i < roundData.length; i++) {
            const bidInput = document.getElementById(`r${roundIndex}-p${i}-bid`);
            const bidValue = roundData[i].bid || '0';
            await simulateInputTyping(bidInput, bidValue);
        }
    }

    // Restore scores for round after bids enabled
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

        const playerNames = gameData[0].map(p => p.playername);

        if (typeof window.startGameSession !== 'function') {
            console.error('startGameSession not defined');
            return;
        }

        window.startGameSession(playerNames, gameId, username);

        // Restore each round bids then scores sequentially
        for (let roundIdx = 0; roundIdx < gameData.length; roundIdx++) {
            await restoreBids(roundIdx, gameData[roundIdx]);

            // Wait some time to let score inputs enable by logic
            await new Promise(r => setTimeout(r, 100));

            await restoreScores(roundIdx, gameData[roundIdx]);

            if (roundIdx < gameData.length - 1) {
                const addRowBtn = document.getElementById('addRowBtn');
                if (addRowBtn) {
                    addRowBtn.click();
                    await new Promise(r => setTimeout(r, 300)); // wait for UI updates on adding new round
                } else if (typeof window.addRound === 'function') {
                    window.addRound();
                    await new Promise(r => setTimeout(r, 300));
                } else {
                    console.error('No way to add round');
                    break;
                }
            }
        }

        if (typeof window.updateTotals === 'function') {
            window.updateTotals();
        }
    }

    function showRestoreBanner(gameId, gameData, username) {
        const banner = document.getElementById('activeGameBanner');
        if (!banner) return;

        banner.classList.remove('hidden');

        document.getElementById('continueGameBtn').onclick = async () => {
            showLoading();

            const banner = document.getElementById('activeGameBanner');
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
            banner.classList.add('hidden');
        };
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
            .then(res => res.json())
            .then(data => {
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
