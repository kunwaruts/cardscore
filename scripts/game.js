import { displayError, clearError, clearAllFormErrors } from './validation.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Definitions ---
    const welcomePage = document.getElementById('welcome-page');
    const gamePage = document.getElementById('game-page');
    const numPlayersSelect = document.getElementById('numPlayers');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    const playBtn = document.getElementById('playBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Header elements
    const persistentHeader = document.getElementById('persistentHeader');
    const logoutBtn = document.getElementById('logoutBtn');

    // Elements for status/errors
    const setupErrorStatus = document.getElementById('setupErrorStatus');
    
    // Game page elements
    const tableHeader = document.getElementById('tableHeader');
    const scoreTableBody = document.getElementById('scoreTableBody');
    const totalRow = document.getElementById('totalRow');
    const addRowBtn = document.getElementById('addRowBtn');
    
    // --- State Variables ---
    let numPlayers = 0;
    let playerNames = [];
    let scores = [];
    let roundNumber = 0;

    // ==========================================================
    // 1. CRITICAL HELPER FUNCTION: Check Player Inputs Validity
    // (This now handles the final required/uniqueness check on click)
    // ==========================================================
    const checkPlayerInputsValidity = (isFinalCheck = false) => {
        const nameInputs = playerNamesContainer.querySelectorAll('input[type="text"]');
        let allValid = true; // Tracks required fields and valid characters
        let names = []; // Stores trimmed, lowercase, valid names
        let hasInlineError = false; // Tracks if any field is actively showing an inline error

        if (setupErrorStatus) {
             setupErrorStatus.classList.add('hidden');
             setupErrorStatus.textContent = '';
        }

        // --- 1. Per-Field Status Check and Name Collection ---
        nameInputs.forEach(input => {
            const name = input.value.trim();
            
            // Check for existing inline character errors
            const errorElement = input.closest('.input-group')?.querySelector('.input-error-message');
            if (errorElement && !errorElement.classList.contains('hidden') && errorElement.textContent.length > 0) {
                 hasInlineError = true;
            }

            // FIX 1 & 2: If this is the final check (on button click) OR if the field is currently invalid...
            if (isFinalCheck || hasInlineError || name === '') {
                
                // Final Required Check (Blank fields)
                if (name === '') {
                    allValid = false;
                    // FIX 2: Explicitly call displayError for ALL blank fields on the final check
                    if (isFinalCheck) {
                        displayError(input, 'Player name is required.');
                    }
                } 
                
                // Character Check (If not blank, but characters are wrong)
                else if (!/^[a-zA-Z\s]+$/.test(name)) {
                     allValid = false;
                     // Error should already be displayed by the 'input' listener, but confirm logic here
                }
            }
            
            if (name !== '' && !hasInlineError) {
                names.push(name.toLowerCase());
            }
        });
        
        // Disable button if any field has a live inline character error or fails final validity
        if (!allValid || hasInlineError) {
            playBtn.disabled = true;
            return false;
        }

        // --- 2. Global Validation (Uniqueness Check) ---
        // FIX 3: Uniqueness check MUST be done here, and only if all names are present and valid
        const uniqueNames = new Set(names);
        
        if (uniqueNames.size !== names.length) {
             playBtn.disabled = true;

             if (setupErrorStatus) {
                 setupErrorStatus.textContent = '⚠ Player names must be unique (case-insensitive).';
                 setupErrorStatus.classList.remove('hidden');
             }
             return false;
        }
        
        // --- 3. Final State ---
        if (setupErrorStatus) setupErrorStatus.classList.add('hidden');
        playBtn.disabled = false;
        return true;
    };

    // ==========================================================
    // 2. Player Count Selection Listener (Input Generation)
    // ==========================================================
    numPlayersSelect.addEventListener('change', (e) => {
        numPlayers = parseInt(e.target.value);
        playerNamesContainer.innerHTML = '';
        
        if (setupErrorStatus) {
             setupErrorStatus.classList.add('hidden');
        }

        if (numPlayers) {
            for (let i = 0; i < numPlayers; i++) {
                const container = document.createElement('div');
                container.classList.add('input-group'); 
                
                const label = document.createElement('label');
                label.textContent = `Player ${i + 1} Name:`;
                label.setAttribute('for', `player-name-${i}`);
                
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `player-name-${i}`; 
                input.placeholder = `Player ${i + 1} Name`;
                input.classList.add('form-input');
                
                // Add the static error element
                const errorDiv = document.createElement('div');
                errorDiv.classList.add('input-error-message');
                errorDiv.classList.add('hidden');
                
                // --- Inline Validation Listeners ---
                
                // Listener for Character/Empty and Post-Action Error Clearing
                input.addEventListener('input', (e) => {
                    const value = e.target.value;
                    
                    // 1. Post-Action: Clear any previous error
                    clearError(input);

                    // 2. Character Validation (Live feedback)
                    if (value !== '' && !/^[a-zA-Z\s]*$/.test(value)) {
                        displayError(input, 'Only letters and spaces are allowed.');
                        e.target.value = value.replace(/[^a-zA-Z\s]/g, '');
                    }
                    
                    // 3. Run the main validity check to update button status
                    checkPlayerInputsValidity();
                });
                
                // Listener for Blur/Focus Out
                input.addEventListener('blur', () => {
                    // Clear error on blur to allow the final click check to re-validate cleanly
                    clearError(input);
                    
                    // Update button status
                    checkPlayerInputsValidity();
                });
                
                // --- DOM Appending ---
                container.appendChild(label);
                container.appendChild(input);
                container.appendChild(errorDiv); // Append the static error container
                playerNamesContainer.appendChild(container);
            }
            
            checkPlayerInputsValidity();
        } else {
            playBtn.disabled = true;
        }
    });

    // ==========================================================
    // 3. Play Button Click Logic
    // ==========================================================
    playBtn.addEventListener('click', () => {
        // FIX 1: Run final check (required for uniqueness and required fields)
        if (!checkPlayerInputsValidity(true)) {
            return;
        }
        
        const nameInputs = playerNamesContainer.querySelectorAll('input[type="text"]');
        playerNames = Array.from(nameInputs).map(input => input.value.trim());

        scores = [];
        roundNumber = 0;
        scoreTableBody.innerHTML = '';
        updateTableHeader();
        updateTotals();

        welcomePage.classList.add('hidden');
        gamePage.classList.remove('hidden');

        addRound();
    });

    // ... (rest of the functions: resetBtn, logoutBtn, updateTableHeader, updateTotals, addRound, signInPageReset)
    
    resetBtn.addEventListener('click', () => {
        numPlayersSelect.value = '';
        playerNamesContainer.innerHTML = '';
        playBtn.disabled = true;
        
        if (setupErrorStatus) {
             setupErrorStatus.classList.add('hidden');
             setupErrorStatus.textContent = '';
        }
        scores = [];
        roundNumber = 0;
    });

    logoutBtn.addEventListener('click', () => {
        gamePage.classList.add('hidden');
        welcomePage.classList.add('hidden');
        
        if (persistentHeader) persistentHeader.classList.add('hidden');
        
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.remove('hidden'); 
            authModal.style.display = 'flex'; 
        }

        const signInPage = document.getElementById('signInPage');
        const signUpPage = document.getElementById('signUpPage');
        if (signInPage) signInPage.classList.remove('hidden');
        if (signUpPage) signUpPage.classList.add('hidden');

        signInPageReset();
    });

    function updateTableHeader() {
        tableHeader.innerHTML = '<th>Round</th>';
        playerNames.forEach(name => {
            tableHeader.innerHTML += `<th>${name}</th>`;
        });
    }

    function updateTotals() {
        totalRow.innerHTML = '<td>Total</td>';
        playerNames.forEach((_, idx) => {
            let sum = scores.reduce((acc, round) => acc + (round[idx] || 0), 0);
            totalRow.innerHTML += `<td>${sum}</td>`;
        });
    }

    function addRound() {
        roundNumber++;
        const row = document.createElement('tr');
        row.innerHTML = `<td>${roundNumber}</td>`;
        const roundScores = [];
        for (let i = 0; i < numPlayers; i++) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.value = 0;
            input.classList.add('form-input');
            input.addEventListener('input', (e) => {
                const val = parseInt(e.target.value) || 0;
                roundScores[i] = val;
                scores[roundNumber - 1] = [...roundScores];
                updateTotals();
            });
            td.appendChild(input);
            row.appendChild(td);
            roundScores.push(0);
        }
        scores.push(roundScores);
        scoreTableBody.appendChild(row);
        addRowBtn.disabled = false;
        row.querySelector('input[type="number"]').focus();
    }
    
    addRowBtn.addEventListener('click', addRound);

    function signInPageReset() {
        const signInForm = document.getElementById('signInForm');
        if (!signInForm) return; 

        signInForm.reset();
        
        const inputs = signInForm.querySelectorAll('.form-input');
        inputs.forEach(input => {
             input.classList.remove('error'); 
        });
        
        const errorContainers = document.querySelectorAll('.input-error-message');
        errorContainers.forEach(err => {
             err.textContent = '';
             err.classList.add('hidden');
        });
    }
});