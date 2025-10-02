// This file manages all game state, score calculations, and score sheet DOM manipulation.
// It exposes the 'startGameSession' function for game.js to initiate the session.

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Definitions ---
    const welcomePage = document.getElementById('welcome-page');
    const gamePage = document.getElementById('game-page');
    const persistentHeader = document.getElementById('persistentHeader');
    
    // Game page elements
    const tableHeader = document.getElementById('tableHeader');
    const scoreTableBody = document.getElementById('scoreTableBody');
    const totalRow = document.getElementById('totalRow');
    // Error Display Area (using the correct ID 'statusMessage')
    const errorDisplayArea = document.getElementById('statusMessage'); 

    // Game Control Buttons (from updated HTML)
    const addRowBtn = document.getElementById('addRowBtn'); // Next Round
    const pauseBtn = document.getElementById('pauseBtn');
    const completeBtn = document.getElementById('completeBtn');
    const gameResetBtn = document.getElementById('gameResetBtn'); // Reset Session
    const logoutBtn = document.getElementById('logoutBtn');

    // Modals (from updated HTML)
    const confirmationModal = document.getElementById('confirmationModal');
    const modalMessage = document.getElementById('modalMessage');
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    const cancelActionBtn = document.getElementById('cancelActionBtn');

    // --- State Variables ---
    let numPlayers = 0;
    let playerNames = [];
    // scores array structure: [[{bid: 0, score: 0, finalScore: 0}, ...], [Round 2], ...]
    let scores = []; 
    let roundNumber = 0;
    const MAX_ROUNDS = 13;
    const TOTAL_TRICKS = 13; // Max tricks available in the deck
    let actionToConfirm = null; // Stores the function to execute after modal confirmation

    //FOR DB ACTION
    let gameId = null;
    let loggedInUsername = null;


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
    // 2. CORE GAME INITIALIZATION
    // ==========================================================

    /**
     * Initializes the scoresheet state and table. Called exclusively by game.js.
     * @param {string[]} names - Array of player names.
     */
    window.startGameSession = function(names,gId, username) {
        playerNames = names;
        numPlayers = names.length;
        scores = [];
        roundNumber = 0;
        scoreTableBody.innerHTML = '';
        
        gameId = gId || null;                 // Store current game ID
        loggedInUsername = username || null;  // Store logged-in username
        
        updateTableHeader();
        updateTotals(); 
        clearGameError();
        
        addRowBtn.disabled = false;
        addRound(true);
        document.querySelectorAll('.score-input-box').forEach(enforceIntegerInput);
    };

    // ==========================================================
    // 3. SCORE CALCULATION & VALIDATION UTILITIES
    // ==========================================================

    /**
     * Extracts the round index from an input element's ID (e.g., 'r0-p0-bid' -> 0).
     */
    function getRoundIndexFromInput(inputElement) {
        const id = inputElement.id;
        const match = id.match(/r(\d+)-/);
        return match ? parseInt(match[1], 10) : -1;
    }

    /**
     * Checks if any input field currently has a range/sum validation error.
     */
    const isAnyInputErrorActive = () => {
        // Checks for the class applied by highlightInputError
        return document.querySelectorAll('.input-has-range-error').length > 0;
    };

    /**
     * Enforces only non-negative integer digits are entered into an input field.
     */
    function enforceIntegerInput(inputElement) {
        if (!inputElement) return;
        
        inputElement.addEventListener('input', function() {
            // Remove non-digit characters (negative signs, decimals)
            this.value = this.value.replace(/[^0-9]/g, ''); 
            
            // Remove leading zeros, unless the value is just "0"
            if (this.value.length > 1 && this.value.startsWith('0')) {
                this.value = parseInt(this.value, 10).toString();
            }
        });
    }

    /**
     * Calculates the final score for a player based on bid, tricks taken, and player count.
     */
    function calculatePlayerRoundScore(bid, tricksTaken, playerCount) {
        if (bid < 0 || tricksTaken < 0) return 0; 

        // --- LOGIC FOR 3 PLAYERS ---
        if (playerCount === 3) {
            if (tricksTaken < bid) {
                return -10 * bid;
            } 
            if (bid <= 4 && tricksTaken >= (bid * 2)) {
                return -10 * bid;
            } 
            if (bid >= 5 && tricksTaken >= (bid + 4)) {
                return -10 * bid;
            } 
            if (bid >= 7) {
                return 20 * bid; 
            } 
            if (bid >= 3 && bid < 7) {
                if (tricksTaken === bid) {
                    return 10 * bid;
                } else if (tricksTaken > bid) {
                    return (10 * bid) + (tricksTaken - bid);
                }
            }
            return 0; 
        } 
        
        // --- LOGIC FOR 4 PLAYERS ---
        else if (playerCount === 4) {
            if (tricksTaken < bid) {
                return -10 * bid;
            } 
            if (bid >= 2 && bid <= 3 && tricksTaken >= (bid * 2)) {
                return -10 * bid;
            } 
            if (bid >= 4 && tricksTaken >= (bid + 3)) {
                return -10 * bid;
            }
            if (bid >= 6) {
                return 20 * bid;
            } 
            if (bid >= 2 && bid < 6) {
                if (tricksTaken === bid) {
                    return 10 * bid;
                } else if (tricksTaken > bid) {
                    return (10 * bid) + (tricksTaken - bid);
                }
            }
            return 0;
        }
        
        return 0; // Default for unsupported player counts
    }

    /** Highlights an input field in light red, using the user-specified colors. */
    function highlightInputError(inputElement) {
        if (inputElement) {
            // Consistent red border and background for visual error state
            inputElement.style.border = '2px solid #fa0000ff'; 
            inputElement.style.backgroundColor = '#f7a6a6ff'; 
            inputElement.classList.add('input-has-range-error'); // Add tracking class
        }
    }

    /** Clears the highlight from an input field. */
    function clearInputError(inputElement) {
        if (inputElement) {
            inputElement.style.border = '1px solid #d1d5db'; // Tailwind gray-300 default
            inputElement.style.backgroundColor = 'white'; 
            inputElement.classList.remove('input-has-range-error'); // Remove tracking class
        }
    }

    /** * Validates the input value against its min/max attributes and highlights errors.
     * Triggers on blur event.
     * @param {HTMLInputElement} inputElement - The input field to validate.
     * @returns {boolean} True if validation passed, false otherwise.
     */
    function validateInputRange(inputElement) {
        const value = parseInt(inputElement.value) || 0;
        const min = parseInt(inputElement.min) || 0;
        const max = parseInt(inputElement.max) || Infinity;
        const type = inputElement.classList.contains('bid-input') ? 'Bid' : 'Score';
        const currentRoundIndex = getRoundIndexFromInput(inputElement);

        // Important: Clear the individual input error state first
        clearInputError(inputElement); 

        if (value < min || value > max) {
            highlightInputError(inputElement);
            // Error is shown here with a red icon and text
            showGameError(`⚠️ ${type} must be between ${min} and ${max}. Please correct the value.`);
            return false;
        }
        
        // If validation passes for this specific input, check if any other input errors exist
        setTimeout(() => {
            if (!isAnyInputErrorActive()) {
                clearGameError();
            }
            // Re-evaluate score enabling (it only relies on bid completeness now)
            toggleScoreInputs(currentRoundIndex); 
        }, 50); 
        
        return true;
    }

    /**
     * The new central handler for input changes (both bid and score).
     */
    const handleInputAndUpdateScore = (roundIndex, playerIndex, type, value, inputElement) => {
        const playerState = scores[roundIndex][playerIndex];
        const currentRoundRow = scoreTableBody.querySelector(`#round-${roundIndex}`);
        const scoreDisplay = currentRoundRow.querySelector(`#r${roundIndex}-p${playerIndex}-final`);

        // Update player state
        playerState[type] = value;
        
        // Clear visual error when input is changed, before re-validation on blur
        clearInputError(inputElement);
        
        // 2. Calculate if inputs are complete
        if (playerState.bid > 0 && playerState.score !== null && playerState.score !== undefined) {
            
            const finalScore = calculatePlayerRoundScore(playerState.bid, playerState.score, numPlayers);
            playerState.finalScore = finalScore;
            
            // Update UI
            scoreDisplay.textContent = finalScore;
            scoreDisplay.classList.toggle('positive-score', finalScore > 0);
            scoreDisplay.classList.toggle('negative-score', finalScore <= 0);

        } else {
            // Reset score display if inputs are incomplete/zero (and not calculated)
            playerState.finalScore = 0;
            scoreDisplay.textContent = 0;
            scoreDisplay.classList.remove('positive-score');
            scoreDisplay.classList.add('negative-score');
        }
        
        // 1. Check if all bids are entered (to toggle score inputs)
        if (type === 'bid') {
            // Immediately re-evaluate score inputs based on bid completeness and error state
            toggleScoreInputs(roundIndex); 
        }

        updateTotals();
    };


    /**
     * Checks if all players have entered a non-zero bid for the given round index.
     */
    const areAllBidsEntered = (roundIndex) => {
        const round = scores[roundIndex];
        if (!round) return false;
        // Check if bid > 0
        return round.every(player => player.bid > 0); 
    };

    /**
     * Toggles the disabled state of the Score inputs for the specified round index. 
     * Score fields are now only disabled if bids are incomplete. Range errors are visual.
     */
    const toggleScoreInputs = (roundIndex) => {
        const currentRoundRow = scoreTableBody.querySelector(`#round-${roundIndex}`);
        if (!currentRoundRow) return;

        const scoreInputs = currentRoundRow.querySelectorAll('.score-input');
        
        // Scores are enabled only if all bids are entered. 
        const enableScores = areAllBidsEntered(roundIndex); 

        scoreInputs.forEach(input => {
            input.disabled = !enableScores;
            
            // FIX: Only apply the standard enabled/disabled background color 
            // if the input does NOT currently have an error highlight class.
            if (!input.classList.contains('input-has-range-error')) {
                // Visually distinguish enabled/disabled
                input.style.backgroundColor = enableScores ? 'white' : 'rgba(255, 255, 255, 0.5)';
            }
        });
    };

    /**
     * Recalculates and updates the running total for all players.
     */
    function updateTotals() {
        let totalHTML = `<td colspan="1">Total</td>`; 
        
        playerNames.forEach((_, playerIdx) => {
            let sum = 0;
            
            scores.forEach(round => {
                if (round && round[playerIdx]) {
                    sum += round[playerIdx].finalScore; 
                }
            });
            // Total score cell
            totalHTML += `<td class="total-score">${sum}</td>`;
        });
        totalRow.innerHTML = totalHTML;
    }


    // ==========================================================
    // 4. ROUND MANAGEMENT
    // ==========================================================

    /**
     * Creates and appends a new round row to the score table, ensuring previous rounds are locked.
     * @param {boolean} isInitial - True if creating the very first row.
     */
    function addRound(isInitial = false) {
        if (roundNumber >= MAX_ROUNDS) {
            addRowBtn.disabled = true;
            return;
        }

        const currentRoundIndex = roundNumber;
        const previousRoundIndex = roundNumber - 1;
        
        // 1. Lock down previous round inputs (with validation)
        if (roundNumber > 0 && !isInitial) {
            
            let roundTricksTotal = 0;
            let isRoundComplete = true;

            scores[previousRoundIndex].forEach(player => {
                // Check if bid > 0 and score >= 0 (score 0 is allowed, but must be entered)
                if (player.bid <= 0 || player.score === null || player.score === undefined) { 
                    isRoundComplete = false;
                }
                roundTricksTotal += player.score;
            });

            const prevRow = scoreTableBody.querySelector(`#round-${previousRoundIndex}`);
            const prevScoreInputs = prevRow ? prevRow.querySelectorAll('.score-input') : [];
            
            // =================================================================
            // FIX: Re-validate Trick Sum and remove Sum-Related Highlights
            // If the total is now correct (13), we remove the error highlight 
            // that was applied due to the *previous* sum mismatch.
            // =================================================================
            if (roundTricksTotal === TOTAL_TRICKS) {
                prevScoreInputs.forEach(input => {
                    // This removes the .input-has-range-error class applied due to the sum error
                    clearInputError(input); 
                });
            }
            
            // Check 1: Check for any individual input range errors across the table. 
            // If the sum was wrong and is now fixed, the highlight was cleared above.
            if (isAnyInputErrorActive()) {
                showGameError("⚠️ Please resolve all highlighted range errors (individual field errors) before advancing to the next round.");
                return; // Stop adding new round
            }


            // Check 2: All inputs entered
            if (!isRoundComplete) {
                showGameError("⚠️ Please ensure **all Bid and Score fields** are entered (Bid > 0, Score $\\ge$ 0) for the previous round before starting a new one.");
                return; // Stop adding new round
            }

            // Check 3: Score Sum Validation (Tricks Taken must equal 13)
            if (roundTricksTotal !== TOTAL_TRICKS) {
                showGameError(`⚠️ **Trick Total Mismatch:** The total tricks taken (${roundTricksTotal}) must equal the total tricks available (${TOTAL_TRICKS}). Please correct the scores.`);
                
                // --- Highlight the score fields of the previous round ---
                if (prevRow) {
                    prevScoreInputs.forEach(input => {
                        highlightInputError(input);
                    });
                }
                // -----------------------------------------------------------
                
                return; // Stop adding new round
            }
            
            // If valid, lock the inputs
            if (prevRow) {
                prevRow.querySelectorAll('input').forEach(input => {
                    input.setAttribute('readonly', 'readonly');
                    input.disabled = true;
                    input.style.backgroundColor = '#212121'; // Darker background for locked state
                    clearInputError(input); // Clear any lingering red highlight just in case
                });
            }
            // Clear any lingering global error now that the round is successfully locked
            clearGameError();
            sendRoundScoresToServer(previousRoundIndex);
        }

        async function sendRoundScoresToServer(roundIdx) {
            if (!gameId || !loggedInUsername) {
                console.warn('Missing gameId or loggedInUsername, cannot send round scores');
                return;
            }
            
            const roundData = {};
            const roundScores = scores[roundIdx];
            if (!roundScores) return;

            playerNames.forEach((player, i) => {
                roundData[player] = roundScores[i].finalScore || 0;
            });

            const payload = {
                username: loggedInUsername,
                game_id: gameId,
                round: roundIdx + 1,
                scores: roundData
            };

            try {
                const response = await fetch('server/update_round_score.php', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (result.error) {
                    showGameError('Error saving round scores: ' + result.error);
                }
            } catch (error) {
                showGameError('Network error when saving round scores.');
                console.error(error);
            }
        }

        
        // --- STATE PREPARATION ---
        roundNumber++;
        const roundId = `round-${currentRoundIndex}`;
        const row = document.createElement('tr');
        row.id = roundId;
        
        // Initialize state for the new round
        const newRoundScores = [];
        scores[currentRoundIndex] = newRoundScores;

        // --- 1. Round Number Column ---
        const roundNumCell = document.createElement('td');
        roundNumCell.classList.add('round-number-cell');
        roundNumCell.textContent = `${roundNumber} / ${MAX_ROUNDS}`;
        row.appendChild(roundNumCell);

        // --- 2. Create cells for each player (Bid, Score, Final Score) ---
        for (let i = 0; i < numPlayers; i++) {
            const td = document.createElement('td');
            td.classList.add('score-cell');
            
            const playerState = { bid: 0, score: 0, finalScore: 0 };
            newRoundScores.push(playerState); 
            
            // --- Bid Section ---
            const bidSection = document.createElement('div');
            bidSection.classList.add('input-group-micro');
            
            const bidId = `r${currentRoundIndex}-p${i}-bid`;
            const bidLabel = document.createElement('label');
            bidLabel.setAttribute('for', bidId);
            bidLabel.classList.add('micro-label');
            bidLabel.textContent = 'BID'; 

            const bidInput = document.createElement('input');
            bidInput.type = 'number'; 
            bidInput.id = bidId; 
            bidInput.value = playerState.bid;
            // Set dynamic min/max for validation
            bidInput.min = (numPlayers === 3) ? 3 : 2; 
            bidInput.max = 13; 
            bidInput.classList.add('bid-input', 'score-input-box'); 
            
            // **Add 'blur' listener for immediate min/max validation**
            bidInput.addEventListener('blur', (e) => {
                validateInputRange(e.target);
            });

            bidInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value) || 0;
                handleInputAndUpdateScore(currentRoundIndex, i, 'bid', val, e.target);
            });
            enforceIntegerInput(bidInput); // Re-apply enforcement

            bidSection.appendChild(bidLabel);
            bidSection.appendChild(bidInput);
            td.appendChild(bidSection);
            
            // --- Score Section ---
            const scoreSection = document.createElement('div');
            scoreSection.classList.add('input-group-micro');
            
            const scoreId = `r${currentRoundIndex}-p${i}-score`;
            const scoreLabel = document.createElement('label');
            scoreLabel.setAttribute('for', scoreId);
            scoreLabel.classList.add('micro-label');
            scoreLabel.textContent = 'SCORE'; 

            const scoreInput = document.createElement('input');
            scoreInput.type = 'number'; 
            scoreInput.id = scoreId; 
            scoreInput.value = playerState.score;
            // Set min/max for validation
            scoreInput.min = 0; 
            scoreInput.max = TOTAL_TRICKS; 
            scoreInput.classList.add('score-input', 'score-input-box'); 
            scoreInput.disabled = true; // Disabled by default, enabled only after all bids/no errors
            
            // **Add 'blur' listener for immediate min/max validation**
            scoreInput.addEventListener('blur', (e) => {
                validateInputRange(e.target);
            });

            scoreInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value) || 0;
                handleInputAndUpdateScore(currentRoundIndex, i, 'score', val, e.target); 
            });
            enforceIntegerInput(scoreInput); // Re-apply enforcement
            
            scoreSection.appendChild(scoreLabel);
            scoreSection.appendChild(scoreInput);
            td.appendChild(scoreSection);
            
            // --- Final Score Section (Read-only text) ---
            const finalScoreSection = document.createElement('div');
            finalScoreSection.classList.add('final-score-section');
            finalScoreSection.innerHTML = '<span class="micro-label">FINAL: </span>';
            
            const finalScoreTextValue = document.createElement('span'); 
            finalScoreTextValue.id = `r${currentRoundIndex}-p${i}-final`; 
            finalScoreTextValue.classList.add('final-score-value');
            finalScoreTextValue.textContent = playerState.finalScore; 
            finalScoreTextValue.classList.add('negative-score'); 

            finalScoreSection.appendChild(finalScoreTextValue);
            td.appendChild(finalScoreSection);
            
            row.appendChild(td);
        } 
        
        // 3. Append row and update UI state
        scoreTableBody.appendChild(row);
        
        if (roundNumber >= MAX_ROUNDS) {
            addRowBtn.disabled = true;
        } else {
            addRowBtn.textContent = 'Next Round';
            addRowBtn.disabled = false;
        }

        // Focus on the first bid input of the new row
        row.querySelector('.bid-input').focus();
    }


    // ==========================================================
    // 5. ERROR DISPLAY UTILITIES 
    // ==========================================================

    /** Shows an error message at the bottom of the table. (Updated with icon and color) */
    function showGameError(message) {
        if (errorDisplayArea) {
            // Include a warning icon and ensure the text color is #ff0000 (red)
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

    // ==========================================================
    // 6. UI UTILITIES & CONTROL LISTENERS 
    // ==========================================================
    
    // Updates the table header with player names
    function updateTableHeader() {
        tableHeader.innerHTML = '<th class="round-number-cell" style="width: 120px;">Round</th>';
        playerNames.forEach(name => {
            tableHeader.innerHTML += `<th>${name}</th>`;
        });
    }

    // Handles returning to the setup page (Game Reset/Logout)
    function gamePageReset() {
        scores = [];
        roundNumber = 0;
        playerNames = [];
        numPlayers = 0;
        scoreTableBody.innerHTML = '';
        updateTotals(); 
        clearGameError();
        
        gamePage.classList.add('hidden');
        persistentHeader.classList.add('hidden'); 
        welcomePage.classList.remove('hidden');
        
        const welcomeResetBtn = document.getElementById('resetBtn');
        if (welcomeResetBtn) welcomeResetBtn.click();
    }
    
    // --- Control Button Listeners ---

    // NEXT ROUND button
    addRowBtn.addEventListener('click', () => {
        // Validation for locking the previous round happens inside addRound()
        addRound();
    });

    // PAUSE button (Placeholder)
    pauseBtn.addEventListener('click', () => {
        showConfirmationModal(
            "Game Paused. This feature is a placeholder for game state saving.",
            hideConfirmationModal
        );
    });

    // COMPLETE button - Declares Winner and Resets
    completeBtn.addEventListener('click', async () => {
        showConfirmationModal(
            '**Game Completion:** Are you sure you want to complete the game? The winner will be declared and the session will be reset.',
            async () => {
                try {
                    if (gameId && loggedInUsername) {
                        const response = await fetch('server/complete_game.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: loggedInUsername, game_id: gameId })
                        });
                        const result = await response.json();
                        if (result.error) {
                            showGameError('Error completing game: ' + result.error);
                            return;
                        }
                    }
                } catch (err) {
                    showGameError('Network error finishing game.');
                    console.error(err);
                    return;
                }
                // After the async backend call, calculate and display winner
                const totals = [];
                totalRow.querySelectorAll('.total-score').forEach(td => totals.push(parseInt(td.textContent) || 0));

                let maxScore = -Infinity;
                let winnerIndex = -1;

                totals.forEach((score, index) => {
                    if (score > maxScore) {
                        maxScore = score;
                        winnerIndex = index;
                    }
                });

                if (winnerIndex !== -1 && playerNames[winnerIndex]) {
                    showConfirmationModal(
                        `🏆 **Game Over!** The winner is **${playerNames[winnerIndex]}** with a total score of **${maxScore}**!`,
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


    // RESET SESSION button
    gameResetBtn.addEventListener('click', () => {
          showConfirmationModal(
            '⚠️ **Reset Session:** Are you sure you want to reset the scoring session? All current progress will be lost and cannot be restored.',
            gamePageReset
        );
    });

    // LOGOUT button (Returns to initial auth/welcome screen)
    logoutBtn.addEventListener('click', () => {
        gamePageReset();
        
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.remove('hidden'); 
            authModal.style.display = 'flex'; 
        }
    });
});

