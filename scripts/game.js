import { displayError, clearError } from './validation.js';

let startGameSession;
let loggedInUsername = null; // Store logged-in username
let currentGameId = null;    // Store current game session/game_id

document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.startGameSession !== 'function') {
        console.error("Initialization error: scoresheet.js failed to load or define startGameSession.");
    }
    startGameSession = window.startGameSession;

    const welcomePage = document.getElementById('welcome-page');
    const gamePage = document.getElementById('game-page');
    const numPlayersSelect = document.getElementById('numPlayers');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    const playBtn = document.getElementById('playBtn');
    const resetBtn = document.getElementById('resetBtn');

    let setupErrorStatus = null;
    const MIN_LENGTH = 3;
    const MAX_LENGTH = 15;
    const NAME_REGEX = /^[a-zA-Z\s\.]*$/;

    // Extract logged-in username from header text like "Hey, username"
    function getLoggedInUsername() {
        const topWelcomeMessage = document.getElementById('topWelcomeMessage');
        if (!topWelcomeMessage) return null;
        const text = topWelcomeMessage.textContent || '';
        const match = text.match(/Hey,\s*(\S+)/i);
        return match ? match[1] : null;
    }

    // Validates all player input fields
    const checkPlayerInputsValidity = () => {
        const nameInputs = playerNamesContainer.querySelectorAll('input[type="text"]');
        let allIndividualFieldsValid = true;
        let names = [];

        if (setupErrorStatus) {
            setupErrorStatus.classList.add('hidden');
            setupErrorStatus.textContent = '';
        }
        nameInputs.forEach(input => clearError(input));

        nameInputs.forEach(input => {
            const name = input.value.trim();
            let fieldError = false;

            if (name === '') {
                displayError(input, 'Player name is required.');
                fieldError = true;
            } else if (!NAME_REGEX.test(name)) {
                displayError(input, 'Only letters, spaces, and periods are allowed.');
                fieldError = true;
            } else if (name.length < MIN_LENGTH) {
                displayError(input, `Name must be at least ${MIN_LENGTH} characters.`);
                fieldError = true;
            } else if (name.length > MAX_LENGTH) {
                displayError(input, `Name cannot exceed ${MAX_LENGTH} characters.`);
                fieldError = true;
            }

            if (fieldError) {
                allIndividualFieldsValid = false;
            } else {
                names.push(name.toLowerCase());
            }
        });

        if (!allIndividualFieldsValid) {
            return false;
        }

        const uniqueNames = new Set(names);
        if (uniqueNames.size !== names.length) {
            if (setupErrorStatus) {
                setupErrorStatus.textContent = '⚠ Player names must be unique (case-insensitive).';
                setupErrorStatus.classList.remove('hidden');
            }
            return false;
        }

        if (setupErrorStatus) setupErrorStatus.classList.add('hidden');
        return true;
    };

    numPlayersSelect.addEventListener('change', (e) => {
        const numPlayers = parseInt(e.target.value);
        playerNamesContainer.innerHTML = '';

        const existingStatus = document.getElementById('setupErrorStatus');
        if (existingStatus) existingStatus.remove();

        setupErrorStatus = document.createElement('div');
        setupErrorStatus.id = 'setupErrorStatus';
        setupErrorStatus.classList.add('input-error-message', 'hidden');
        setupErrorStatus.style.marginTop = '10px';
        setupErrorStatus.style.marginBottom = '10px';

        if (playerNamesContainer.parentNode) {
            playerNamesContainer.insertAdjacentElement('afterend', setupErrorStatus);
        }

        if (numPlayers) {
            for (let i = 0; i < numPlayers; i++) {
                const container = document.createElement('div');
                container.classList.add('input-group');

                const label = document.createElement('label');
                label.textContent = `Player ${i + 1} Name:`;
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `player-name-${i}`;
                input.placeholder = `Player ${i + 1} Name`;
                input.classList.add('form-input');

                const errorDiv = document.createElement('div');
                errorDiv.classList.add('input-error-message', 'hidden');

                input.addEventListener('input', (e) => {
                    clearError(input);
                    const value = e.target.value;
                    if (!NAME_REGEX.test(value)) {
                        displayError(input, 'Only letters, spaces, and periods are allowed.');
                        e.target.value = value.replace(/[^a-zA-Z\s\.]/g, '');
                    }
                });

                input.addEventListener('blur', () => {
                    const trimmedValue = input.value.trim();
                    clearError(input);
                    if (trimmedValue === '') {
                        displayError(input, 'Player name is required.');
                    } else if (trimmedValue.length < MIN_LENGTH) {
                        displayError(input, `Name must be at least ${MIN_LENGTH} characters.`);
                    }
                });

                container.appendChild(label);
                container.appendChild(input);
                container.appendChild(errorDiv);
                playerNamesContainer.appendChild(container);
            }

            playBtn.disabled = false;
        } else {
            playBtn.disabled = true;
        }
    });

    playBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        if (!checkPlayerInputsValidity()) {
            return;
        }

        loggedInUsername = getLoggedInUsername();
        if (!loggedInUsername) {
            console.error('Logged in username not found.');
            if (setupErrorStatus) {
                setupErrorStatus.textContent = 'Error: Logged-in username not found.';
                setupErrorStatus.classList.remove('hidden');
            }
            return;
        }

        const nameInputs = playerNamesContainer.querySelectorAll('input[type="text"]');
        const playerNames = Array.from(nameInputs).map(input => input.value.trim());

        const payload = {
            username: loggedInUsername,
            players: playerNames
        };

        try {
            const response = await fetch('server/start_game.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.error) {
                console.error('Error starting game:', result.error);
                if (setupErrorStatus) {
                    setupErrorStatus.textContent = result.error;
                    setupErrorStatus.classList.remove('hidden');
                }
                return;
            }

            currentGameId = result.game_id;

            welcomePage.classList.add('hidden');
            gamePage.classList.remove('hidden');
            document.getElementById('persistentHeader').classList.remove('hidden');

            startGameSession(playerNames, currentGameId, loggedInUsername);

            if (setupErrorStatus) {
                setupErrorStatus.classList.add('hidden');
                setupErrorStatus.textContent = '';
            }

        } catch (err) {
            console.error('Failed to start game:', err);
            if (setupErrorStatus) {
                setupErrorStatus.textContent = 'Failed to start game. Please try again.';
                setupErrorStatus.classList.remove('hidden');
            }
        }
    });

    resetBtn.addEventListener('click', () => {
        numPlayersSelect.value = '';
        playerNamesContainer.innerHTML = '';
        playBtn.disabled = true;

        if (setupErrorStatus) {
            setupErrorStatus.remove();
            setupErrorStatus = null;
        }
    });
});