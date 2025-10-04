// --- Score Table UI Management and Event Handling ---
import * as ScoreLogic from './score.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- DOM Element Definitions ---
    const welcomePage = document.getElementById('welcome-page');
    const gamePage = document.getElementById('game-page');
    const persistentHeader = document.getElementById('persistentHeader');
    
    // Game page elements
    const tableHeader = document.getElementById('tableHeader');
    const scoreTableBody = document.getElementById('scoreTableBody');
    const totalRow = document.getElementById('totalRow');
    const errorDisplayArea = document.getElementById('statusMessage'); 

    // Game Control Buttons 
    const addRowBtn = document.getElementById('addRowBtn'); // Next Round
    const completeBtn = document.getElementById('completeBtn');
    const gameResetBtn = document.getElementById('gameResetBtn'); // Reset Session
    const logoutBtn = document.getElementById('logoutBtn');

    // Modals 
    const confirmationModal = document.getElementById('confirmationModal');
    const modalMessage = document.getElementById('modalMessage');
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    const cancelActionBtn = document.getElementById('cancelActionBtn');

    // State for Modal
    let actionToConfirm = null; 

    // ==========================================================
    // 1. MODAL HANDLING
    // ==========================================================
    
    const showConfirmationModal = (message, action) => {
        modalMessage.innerHTML = message;
        actionToConfirm = action;
        confirmationModal.classList.remove('hidden');
        confirmationModal.style.display = 'flex'; 
    };

    const hideConfirmationModal = () => {
        confirmationModal.classList.add('hidden');
        confirmationModal.style.display = 'none';
        actionToConfirm = null;
    };

    confirmActionBtn.addEventListener('click', () => {
        if (actionToConfirm) {
            actionToConfirm();
        }
        hideConfirmationModal();
    });

    cancelActionBtn.addEventListener('click', hideConfirmationModal);

    // ==========================================================
    // 2. ERROR & UI UTILITIES
    // ==========================================================

    /** Shows an error message at the bottom of the table. */
    function showGameError(message) {
        if (errorDisplayArea) {
            errorDisplayArea.innerHTML = `<p style="color: #ff0000; font-weight: 700;">${message}</p>`;
            errorDisplayArea.style.display = 'block';
        }
    }

    /** Clears the error message area. */
    function clearGameError() {
        if (errorDisplayArea) {
            errorDisplayArea.innerHTML = '';
            errorDisplayArea.style.display = 'none';
        }
    }
    
    /** Highlights an input field in light red. */
    function highlightInputError(inputElement) {
        if (inputElement) {
            inputElement.style.border = '2px solid #fa0000ff'; 
            inputElement.style.backgroundColor = '#f7a6a6ff'; 
            inputElement.classList.add('input-has-range-error'); 
        }
    }

    /** Clears the highlight from an input field. */
    function clearInputError(inputElement) {
        if (inputElement) {
            inputElement.style.border = '1px solid #4a5568'; // Reset border color
            inputElement.style.backgroundColor = '#1a202c'; // Reset background color
            inputElement.classList.remove('input-has-range-error'); 
        }
    }
    
    /** * Extracts the round and player index from an input element's ID (e.g., 'r0-p0-bid' -> 0, 0).
     * @returns {{roundIndex: number, playerIndex: number, type: 'bid'|'score'}}
     */
    function parseInputId(id) {
        const match = id.match(/r(\d+)-p(\d+)-(bid|score)/);
        if (match) {
            return {
                roundIndex: parseInt(match[1], 10),
                playerIndex: parseInt(match[2], 10),
                type: match[3]
            };
        }
        return null;
    }
    
    /** Checks if any input field currently has a range/sum validation error. */
    const isAnyInputErrorActive = () => {
        return document.querySelectorAll('.input-has-range-error').length > 0;
    };


    // ==========================================================
    // 3. INPUT HANDLING & VALIDATION
    // ==========================================================
    
    /** Enforces only non-negative integer digits are entered. */
    function enforceIntegerInput(inputElement) {
        if (!inputElement) return;
        inputElement.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, ''); 
            if (this.value.length > 1 && this.value.startsWith('0')) {
                this.value = parseInt(this.value, 10).toString();
            }
        });
    }

    /** Validates input range and updates state. */
    function validateInputRange(inputElement) {
        const value = parseInt(inputElement.value) || 0;
        const min = parseInt(inputElement.min) || 0;
        const max = parseInt(inputElement.max) || Infinity;
        const info = parseInputId(inputElement.id);
        
        clearInputError(inputElement); 

        if (value < min || value > max) {
            highlightInputError(inputElement);
            showGameError(`⚠️ ${info.type === 'bid' ? 'Bid' : 'Score'} must be between ${min} and ${max}. Please correct the value.`);
            return false;
        }
        
        // If validated, check if any other errors exist, and update score enabling
        setTimeout(() => {
            if (!isAnyInputErrorActive()) {
                clearGameError();
            }
            toggleScoreInputs(info.roundIndex); 
        }, 50); 
        
        return true;
    }

    /** The central handler for input changes. Updates state and UI simultaneously. */
    const handleInputAndUpdate = (inputElement) => {
        const info = parseInputId(inputElement.id);
        if (!info) return;

        const val = parseInt(inputElement.value) || 0;

        // 1. Update State and get results
        const { finalScore, bidComplete } = ScoreLogic.updatePlayerScoreState(
            info.roundIndex, 
            info.playerIndex, 
            info.type, 
            val
        );

        // 2. Update UI (Final Score and Totals)
        const scoreDisplay = document.getElementById(`r${info.roundIndex}-p${info.playerIndex}-final`);
        
        scoreDisplay.textContent = finalScore;
        scoreDisplay.classList.toggle('positive-score', finalScore > 0);
        scoreDisplay.classList.toggle('negative-score', finalScore <= 0);

        updateTotals();
        
        // 3. Update UI (Input enabling)
        if (info.type === 'bid') {
            toggleScoreInputs(info.roundIndex, bidComplete);
        }
    };
    
    /** Toggles the disabled state of the Score inputs for the specified round. */
    const toggleScoreInputs = (roundIndex) => {
        const currentRoundRow = scoreTableBody.querySelector(`#round-${roundIndex}`);
        if (!currentRoundRow) return;

        const scoreInputs = currentRoundRow.querySelectorAll('.score-input');
        const enableScores = ScoreLogic.areAllBidsEntered(roundIndex); 

        scoreInputs.forEach(input => {
            const hasError = input.classList.contains('input-has-range-error');
            
            // Score inputs are disabled if bids are incomplete
            input.disabled = !enableScores;
            
            if (!hasError) {
                // Style based on disabled state, but preserve error style if active
                input.style.backgroundColor = enableScores ? '#1a202c' : 'rgba(26, 32, 44, 0.5)';
            }
        });
    };


    // ==========================================================
    // 4. TABLE RENDERING
    // ==========================================================

    /** Updates the table header with player names */
    function updateTableHeader() {
        const { names } = ScoreLogic.getAllTotals(); // Use names from score logic
        tableHeader.innerHTML = '<th class="round-number-cell" style="width: 120px;">Round</th>';
        names.forEach(name => {
            tableHeader.innerHTML += `<th>${name}</th>`;
        });
    }
    
    /** Recalculates and updates the running total row. */
    function updateTotals() {
        const { names, totals } = ScoreLogic.getAllTotals();
        let totalHTML = `<td colspan="1">Total</td>`; 
        
        totals.forEach(sum => {
            const isNegative = sum < 0;
            const scoreClass = isNegative ? 'negative-score' : 'positive-score';
            totalHTML += `<td class="total-score ${scoreClass}">${sum}</td>`;
        });
        totalRow.innerHTML = totalHTML;
    }

    /** * Creates and appends a new round row DOM element.
     * NOTE: State for the round must be created BEFORE calling this function.
     * @param {number} currentRoundIndex - The index (0-based) of the round being rendered.
     */
    function createRoundRowDOM(currentRoundIndex) {
        const roundNum = currentRoundIndex + 1;
        const numPlayers = ScoreLogic.getNumPlayers();
        const roundId = `round-${currentRoundIndex}`;
        const row = document.createElement('tr');
        row.id = roundId;
        
        // --- 1. Round Number Column ---
        const roundNumCell = document.createElement('td');
        roundNumCell.classList.add('round-number-cell');
        roundNumCell.textContent = `${roundNum} / ${ScoreLogic.MAX_ROUNDS}`;
        row.appendChild(roundNumCell);

        // --- 2. Create cells for each player (Bid, Score, Final Score) ---
        for (let i = 0; i < numPlayers; i++) {
            const td = document.createElement('td');
            td.classList.add('score-cell');
            
            const bidMin = (numPlayers === 3) ? 3 : 2; 

            // Input Group Container
            const inputGroup = document.createElement('div');
            inputGroup.classList.add('input-group-full'); 

            // --- Bid Section ---
            const bidId = `r${currentRoundIndex}-p${i}-bid`;
            const bidInput = document.createElement('input');
            bidInput.type = 'number'; 
            bidInput.id = bidId; 
            bidInput.value = 0;
            bidInput.min = bidMin; 
            bidInput.max = ScoreLogic.TOTAL_TRICKS; 
            bidInput.classList.add('bid-input', 'score-input-box'); 
            
            bidInput.addEventListener('blur', (e) => validateInputRange(e.target));
            bidInput.addEventListener('input', (e) => handleInputAndUpdate(e.target));
            enforceIntegerInput(bidInput); 
            inputGroup.innerHTML += `<div class="input-group-micro"><label for="${bidId}" class="micro-label">BID</label></div>`;
            inputGroup.querySelector('.input-group-micro').appendChild(bidInput);

            // --- Score Section (Tricks Taken) ---
            const scoreId = `r${currentRoundIndex}-p${i}-score`;
            const scoreInput = document.createElement('input');
            scoreInput.type = 'number'; 
            scoreInput.id = scoreId; 
            scoreInput.value = 0;
            scoreInput.min = 0; 
            scoreInput.max = ScoreLogic.TOTAL_TRICKS; 
            scoreInput.classList.add('score-input', 'score-input-box'); 
            scoreInput.disabled = true; // Disabled by default
            
            scoreInput.addEventListener('blur', (e) => validateInputRange(e.target));
            scoreInput.addEventListener('input', (e) => handleInputAndUpdate(e.target));
            enforceIntegerInput(scoreInput); 
            inputGroup.innerHTML += `<div class="input-group-micro mt-2"><label for="${scoreId}" class="micro-label">SCORE</label></div>`;
            inputGroup.querySelectorAll('.input-group-micro')[1].appendChild(scoreInput);
            
            // --- Final Score Section (Read-only text) ---
            const finalScoreSection = document.createElement('div');
            finalScoreSection.classList.add('final-score-section', 'mt-1');
            finalScoreSection.innerHTML = '<span class="micro-label">FINAL: </span>';
            
            const finalScoreTextValue = document.createElement('span'); 
            finalScoreTextValue.id = `r${currentRoundIndex}-p${i}-final`; 
            finalScoreTextValue.classList.add('final-score-value', 'negative-score');
            finalScoreTextValue.textContent = 0; 

            finalScoreSection.appendChild(finalScoreTextValue);
            inputGroup.appendChild(finalScoreSection);
            
            td.appendChild(inputGroup);
            row.appendChild(td);
        } 
        
        scoreTableBody.appendChild(row);

        // Focus on the first bid input of the new row for quick entry
        row.querySelector('.bid-input').focus();
    }
    
    /** * Main function to advance to the next round. Performs validation and UI updates.
     * @param {boolean} isInitial - True if creating the very first row.
     */
    function addRound(isInitial = false) {
        
        const previousRoundIndex = ScoreLogic.getCurrentRoundNumber() - 1;
        
        // 1. Lock down previous round inputs (with validation)
        if (previousRoundIndex >= 0 && !isInitial) {
            
            const validation = ScoreLogic.getRoundValidationStatus(previousRoundIndex);
            const prevRow = scoreTableBody.querySelector(`#round-${previousRoundIndex}`);
            const prevInputs = prevRow ? prevRow.querySelectorAll('input') : [];
            const prevScoreInputs = prevRow ? prevRow.querySelectorAll('.score-input') : [];
            
            // Check 1: Check for any individual input range errors across the table.
            if (isAnyInputErrorActive()) {
                showGameError("⚠️ Please resolve all highlighted range errors before advancing.");
                return; 
            }

            // Check 2: All inputs entered
            if (!validation.isComplete) {
                showGameError("⚠️ Please ensure **all Bid and Score fields** are entered (Bid $\\ge 1$, Score $\\ge 0$) for the previous round before starting a new one.");
                return; 
            }

            // Check 3: Score Sum Validation (Tricks Taken must equal 13)
            if (validation.total !== ScoreLogic.TOTAL_TRICKS) {
                showGameError(`⚠️ **Trick Total Mismatch:** The total tricks taken (${validation.total}) must equal the total tricks available (${ScoreLogic.TOTAL_TRICKS}). Please correct the scores.`);
                prevScoreInputs.forEach(input => highlightInputError(input));
                return; 
            }
            
            // If valid, lock the inputs and clear error
            if (prevRow) {
                prevInputs.forEach(input => {
                    input.setAttribute('readonly', 'readonly');
                    input.disabled = true;
                    input.style.backgroundColor = '#4a5568'; // Locked state background
                    input.style.color = '#ffffff';
                    clearInputError(input); // Ensure no red highlight remains
                });
            }
            clearGameError();
        }
        
        // 2. Add round to state (and increment state counter)
        const newRoundIndex = ScoreLogic.addRoundToState();
        
        if (newRoundIndex === -1) {
            addRowBtn.disabled = true;
            addRowBtn.textContent = 'Max Rounds Reached';
            return;
        }

        // 3. Create DOM row
        createRoundRowDOM(newRoundIndex);
        
        // 4. Update Next Round button status
        if (ScoreLogic.getCurrentRoundNumber() >= ScoreLogic.MAX_ROUNDS) {
            addRowBtn.disabled = true;
            addRowBtn.textContent = 'Max Rounds Reached';
        } else {
            addRowBtn.textContent = 'Next Round';
            addRowBtn.disabled = false;
        }
    }


    // ==========================================================
    // 5. CORE GAME INITIALIZATION (Exposed Function for game.js)
    // ==========================================================

    /**
     * Initializes the scoresheet state and table. Called exclusively by game.js.
     * @param {string[]} names - Array of player names.
     */
    window.startGameSession = function(names) {
        // 1. Reset logic state
        ScoreLogic.initializeGameState(names);
        
        // 2. Reset table DOM
        scoreTableBody.innerHTML = '';
        
        // 3. Update headers and totals
        updateTableHeader();
        updateTotals(); 
        clearGameError();
        
        // 4. Start the first round (Crucial to draw the first row)
        addRound(true); 

        console.log("Scoretable UI ready and first round drawn.");
    };

    /** Handles returning to the setup page (Game Reset/Logout) */
    function gamePageReset() {
        // Clear UI first
        scoreTableBody.innerHTML = '';
        updateTotals(); 
        clearGameError();
        
        // Transition UI
        gamePage.classList.add('hidden');
        persistentHeader.classList.add('hidden'); 
        welcomePage.classList.remove('hidden');
    }

    // ==========================================================
    // 6. CONTROL BUTTON LISTENERS 
    // ==========================================================
    
    addRowBtn.addEventListener('click', addRound);

    completeBtn.addEventListener('click', () => {
        const lastRoundIndex = ScoreLogic.getCurrentRoundNumber() - 1;
        if (lastRoundIndex < 0) {
             showGameError("⚠️ Start a round before completing the game.");
             return;
        }
        
        const validation = ScoreLogic.getRoundValidationStatus(lastRoundIndex);
        if (!validation.isValid) {
             showGameError("⚠️ Please correct all score errors and complete the final round before ending the game.");
             return;
        }

        showConfirmationModal(
            '**Game Completion:** Are you sure you want to complete the game? The winner will be declared and the session will be reset.',
            () => {
                const { names, totals } = ScoreLogic.getAllTotals();
                let maxScore = -Infinity;
                let winnerIndex = -1;
                
                totals.forEach((score, index) => {
                    if (score > maxScore) {
                        maxScore = score;
                        winnerIndex = index;
                    }
                });

                if(winnerIndex !== -1 && names[winnerIndex]) {
                    showConfirmationModal(
                        `🏆 **Game Over!** The winner is **${names[winnerIndex]}** with a total score of **${maxScore}**!`,
                        gamePageReset 
                    );
                } else {
                    showConfirmationModal(
                        "Game Over! Scores were inconclusive.",
                        gamePageReset
                    );
                }
            }
        );
    });

    gameResetBtn.addEventListener('click', () => {
          showConfirmationModal(
            '⚠️ **Reset Session:** Are you sure you want to reset the scoring session? All current progress will be lost and cannot be restored.',
            gamePageReset
        );
    });

    logoutBtn.addEventListener('click', () => {
        gamePageReset();
        // Show auth modal (handled by game.js logic, but visually we prepare the modal)
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.remove('hidden'); 
            authModal.style.display = 'flex'; 
        }
    });
});
