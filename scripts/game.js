import { displayError, clearError } from './validation.js';

// Global function defined in scoresheet.js to start the game session
let startGameSession;

document.addEventListener('DOMContentLoaded', () => {
    // Attempt to hook the external function
    if (typeof window.startGameSession !== 'function') {
        console.error("Initialization error: scoresheet.js failed to load or define startGameSession.");
        // Non-fatal error, but game won't start
    }
    startGameSession = window.startGameSession;

    // --- DOM Element Definitions (Setup Page Only) ---
    const welcomePage = document.getElementById('welcome-page');
    const gamePage = document.getElementById('game-page');
    const numPlayersSelect = document.getElementById('numPlayers');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    const playBtn = document.getElementById('playBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Global Error Status (dynamically created and placed by the change listener)
    let setupErrorStatus = null; 
    
    // --- Validation Constants ---
    const MIN_LENGTH = 3;
    const MAX_LENGTH = 15;
    const NAME_REGEX = /^[a-zA-Z\s\.]*$/; 

    // ==========================================================
    // 1. Player Input Validation 
    // ==========================================================
    const checkPlayerInputsValidity = () => {
        const nameInputs = playerNamesContainer.querySelectorAll('input[type="text"]');
        let allIndividualFieldsValid = true;
        let names = [];
        
        // --- Phase 0: Initial Cleanup ---
        if (setupErrorStatus) { 
             setupErrorStatus.classList.add('hidden');
             setupErrorStatus.textContent = '';
        }
        nameInputs.forEach(input => clearError(input)); 

        // --- Phase 1: Per-Field Validation ---
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

        // --- Phase 2: Global Uniqueness Check ---
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

    // ==========================================================
    // 2. Setup Page Listeners 
    // ==========================================================

    numPlayersSelect.addEventListener('change', (e) => {
        const numPlayers = parseInt(e.target.value);
        playerNamesContainer.innerHTML = '';
        
        // Dynamic error status creation (for placement right after container)
        const existingStatus = document.getElementById('setupErrorStatus');
        if (existingStatus) existingStatus.remove(); 
        
        setupErrorStatus = document.createElement('div');
        setupErrorStatus.id = 'setupErrorStatus';
        setupErrorStatus.classList.add('input-error-message', 'hidden'); 
        setupErrorStatus.style.marginTop = '10px';
        setupErrorStatus.style.marginBottom = '10px';
        
        if (playerNamesContainer.parentNode) {
            // Place it after the container, before the button group
            playerNamesContainer.insertAdjacentElement('afterend', setupErrorStatus);
        }
        setupErrorStatus.classList.add('hidden');
        
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
                errorDiv.classList.add('input-error-message');
                errorDiv.classList.add('hidden');
                
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

    // START GAME - Transition point to scoresheet.js
    playBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        
        if (!checkPlayerInputsValidity()) {
            return;
        }
        
        if (!startGameSession) {
            console.error("Game session initializer not available. Check scoresheet.js load order.");
            return;
        }

        const nameInputs = playerNamesContainer.querySelectorAll('input[type="text"]');
        const playerNames = Array.from(nameInputs).map(input => input.value.trim());

        // --- Transition UI ---
        welcomePage.classList.add('hidden');
        gamePage.classList.remove('hidden');
        document.getElementById('persistentHeader').classList.remove('hidden');

        // CALL THE EXTERNAL FUNCTION to initialize the scoresheet
        startGameSession(playerNames);
    });
    
    // WELCOME PAGE RESET
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