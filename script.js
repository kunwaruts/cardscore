document.addEventListener('DOMContentLoaded', () => {
    const welcomePage = document.getElementById('welcome-page');
    const gamePage = document.getElementById('game-page');
    const numPlayersSelect = document.getElementById('numPlayers');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    const playBtn = document.getElementById('playBtn');
    const resetBtn = document.getElementById('resetBtn');
    const welcomeStatusMessage = document.getElementById('welcomeStatusMessage');

    const tableHeader = document.getElementById('tableHeader');
    const scoreTableBody = document.getElementById('scoreTableBody');
    const totalRow = document.getElementById('totalRow');
    const addRowBtn = document.getElementById('addRowBtn');
    const backBtn = document.getElementById('backBtn');
    const statusMessage = document.getElementById('statusMessage');

    const confirmationModal = document.getElementById('confirmationModal');
    const confirmYesBtn = document.getElementById('confirmYes');
    const confirmNoBtn = document.getElementById('confirmNo');

    let numPlayers = 0;
    let playerNames = [];
    let scores = []; // Stores round scores as an array of arrays/objects
    let roundNumber = 0;

    // Helper function to clear and set error messages and styles
    function handleInputError(inputElement, isValid, errorMessage) {
        if (isValid) {
            inputElement.classList.remove('input-error');
            statusMessage.textContent = '';
        } else {
            inputElement.classList.add('input-error');
            statusMessage.textContent = `⚠ ${errorMessage}`;
        }
    }

    // --- Welcome Page Logic ---

    numPlayersSelect.addEventListener('change', (e) => {
        numPlayers = parseInt(e.target.value);
        playerNamesContainer.innerHTML = '';
        if (numPlayers) {
            for (let i = 0; i < numPlayers; i++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = `Player ${i + 1} Name`;
                input.classList.add('form-input');
                input.addEventListener('input', (e) => {
                    const value = e.target.value;
                    if (/^[a-zA-Z\s]*$/.test(value)) {
                        welcomeStatusMessage.textContent = '';
                        e.target.classList.remove('input-error');
                    }
                });
                playerNamesContainer.appendChild(input);
            }
            playBtn.disabled = false;
        }
    });

    playBtn.addEventListener('click', () => {
        const nameInputs = playerNamesContainer.querySelectorAll('input[type="text"]');
        playerNames = Array.from(nameInputs).map(input => input.value.trim());

        // Clear previous errors
        welcomeStatusMessage.textContent = '';
        nameInputs.forEach(input => input.classList.remove('input-error'));

        // Check for duplicate names (case-insensitive)
        const lowercaseNames = playerNames.map(name => name.toLowerCase());
        const uniqueNames = new Set(lowercaseNames);
        if (uniqueNames.size !== playerNames.length) {
            welcomeStatusMessage.textContent = '⚠ Player names must be unique (case-insensitive).';
            return;
        }

        for (let i = 0; i < playerNames.length; i++) {
            if (playerNames[i] === '') {
                welcomeStatusMessage.textContent = '⚠ Please enter all player names.';
                nameInputs[i].classList.add('input-error');
                return;
            }
                if (!/^[a-zA-Z\s]*$/.test(playerNames[i])) {
                welcomeStatusMessage.textContent = '⚠ Names can only contain alphabets and spaces.';
                nameInputs[i].classList.add('input-error');
                return;
            }
        }
        
        // Clear and reset game state
        scores = [];
        roundNumber = 0;
        scoreTableBody.innerHTML = '';
        statusMessage.textContent = '';
        
        updateTableHeader();
        updateTotals();
        
        welcomePage.classList.add('hidden');
        gamePage.classList.remove('hidden');
        
        // Automatically add the first round
        addRound();
    });
    
    resetBtn.addEventListener('click', () => {
        numPlayersSelect.value = '';
        playerNamesContainer.innerHTML = '';
        playBtn.disabled = true;
        welcomeStatusMessage.textContent = '';
        scores = [];
        roundNumber = 0;
    });

    // --- Game Page Logic ---

    window.addEventListener('beforeunload', (e) => {
        if (!gamePage.classList.contains('hidden')) {
            e.preventDefault();
            e.returnValue = ''; // Retain for safety, though standard behavior is limited in modern browsers
        }
    });

    function updateTableHeader() {
        tableHeader.innerHTML = '';
        const roundHeader = document.createElement('th');
        roundHeader.textContent = 'Round';
        tableHeader.appendChild(roundHeader);
        playerNames.forEach(name => {
            const th = document.createElement('th');
            // Shortened header text for mobile responsiveness
            th.textContent = name; 
            tableHeader.appendChild(th);
        });
    }

    function calculateScore(bid, score) {
        // Ensure inputs are numeric before calculating
        bid = parseInt(bid);
        score = parseInt(score);
        
        if (isNaN(bid) || isNaN(score)) return 0;
        
        const minBid = numPlayers === 3 ? 3 : 2;

        if (bid < minBid || bid > 13 || score > 13) {
            return null; // Invalid bid/score outside rules
        }
        
        // Rule 1: Double the bid or more penalty (2x penalty takes precedence)
        if (score >= 2 * bid && bid > 0) {
            return -10 * bid;
        }

        // Rule 2: High bid bonus
        if ((numPlayers === 3 && bid >= 7) || (numPlayers === 4 && bid >= 6)) {
            if (score >= bid) {
                return bid * 20; // Made high bid
            } else {
                return -10 * bid; // Missed high bid
            }
        }

        // Rule 3: Normal bid rules (missed, made, or over)
        if (score < bid) {
            return -10 * bid; // Missed bid
        } else if (score === bid) {
            return bid * 10; // Made bid exactly
        } else { // score > bid (Overtricks)
            const bonusPoints = score - bid;
            return (bid * 10) + bonusPoints;
        }
    }

    function updateTotals() {
        totalRow.innerHTML = '';
        const totalTextCell = document.createElement('td');
        totalTextCell.textContent = 'Total';
        totalRow.appendChild(totalTextCell);
        
        const playerTotals = Array(numPlayers).fill(0);

        scores.forEach(round => {
            // Iterate through the round's score objects
            round.forEach((playerScoreObject, index) => {
                    if (playerScoreObject && typeof playerScoreObject.finalScore === 'number' && !isNaN(playerScoreObject.finalScore)) {
                        playerTotals[index] += playerScoreObject.finalScore;
                }
            });
        });
        
        playerTotals.forEach(total => {
            const totalCell = document.createElement('td');
            totalCell.textContent = total;
            totalRow.appendChild(totalCell);
        });
    }

    function validateRound(row) {
        const bidInputs = Array.from(row.querySelectorAll('input[placeholder="Bid"]'));
        const scoreInputs = Array.from(row.querySelectorAll('input[placeholder="Score"]'));
        let totalScore = 0;
        let isValid = true;
        const minBid = numPlayers === 3 ? 3 : 2;

        // 1. Check all fields are filled and valid
        for (let i = 0; i < numPlayers; i++) {
            const bidValue = parseInt(bidInputs[i].value);
            const scoreValue = parseInt(scoreInputs[i].value);

            bidInputs[i].classList.remove('input-error');
            scoreInputs[i].classList.remove('input-error');

            if (bidInputs[i].value.trim() === '') {
                handleInputError(bidInputs[i], false, `Round ${roundNumber} has empty bid fields.`);
                isValid = false;
            } else if (isNaN(bidValue) || bidValue < minBid || bidValue > 13) {
                handleInputError(bidInputs[i], false, `A bid must be between ${minBid} and 13.`);
                isValid = false;
            }

            if (scoreInputs[i].value.trim() === '') {
                handleInputError(scoreInputs[i], false, `Round ${roundNumber} has empty score fields.`);
                isValid = false;
            } else if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 13) {
                handleInputError(scoreInputs[i], false, `A score must be between 0 and 13.`);
                isValid = false;
            }
            
            if (isValid && bidInputs[i].value.trim() !== '' && scoreInputs[i].value.trim() !== '') {
                    totalScore += scoreValue;
            }
        }
        
        if (!isValid) return false;

        // 2. Check the total score
        if (totalScore !== 13) {
            statusMessage.textContent = `⚠ The total tricks won in Round ${roundNumber} is ${totalScore}. It must equal 13.`;
            scoreInputs.forEach(input => input.classList.add('input-error'));
            return false;
        }
        
        statusMessage.textContent = ''; 
        return true;
    }

    function updateScore(e) {
        const playerCell = e.target.closest('td');
        const row = e.target.closest('tr');
        
        const bidInput = playerCell.querySelector('input[placeholder="Bid"]');
        const scoreInput = playerCell.querySelector('input[placeholder="Score"]');
        
        const bid = parseInt(bidInput.value);
        const score = parseInt(scoreInput.value);
        
        const finalScoreSpan = playerCell.querySelector('span');
        const minBid = numPlayers === 3 ? 3 : 2;

        // Detailed validation to show temporary errors
        let isBidValid = !isNaN(bid) && bid >= minBid && bid <= 13;
        let isScoreValid = !isNaN(score) && score >= 0 && score <= 13;
        
        if (e.target.placeholder === 'Bid' && !isBidValid && bidInput.value.trim() !== '') {
            handleInputError(e.target, false, `A bid must be between ${minBid} and 13.`);
        } else if (e.target.placeholder === 'Score' && !isScoreValid && scoreInput.value.trim() !== '') {
            handleInputError(e.target, false, `A score must be between 0 and 13.`);
        } else {
            handleInputError(e.target, true);
        }

        // Calculate and display score
        const calculatedScore = calculateScore(bidInput.value, scoreInput.value);
        finalScoreSpan.textContent = `Score: ${calculatedScore}`;

        // Update the state array
        let roundScores = scores[row.rowIndex - 1];
        const playerIndex = Array.from(row.querySelectorAll('td')).slice(1).indexOf(e.target.closest('td'));

        // Use the input values to save the final object to scores array
        roundScores[playerIndex] = {
            bid: isBidValid ? bid : null,
            score: isScoreValid ? score : null,
            finalScore: calculatedScore
        };
        
        updateTotals();

        // Check if all fields in the current row are filled to enable 'Add Round' button
        const inputs = Array.from(row.querySelectorAll('input'));
        const allFilled = inputs.every(input => input.value !== '');
        addRowBtn.disabled = !allFilled;
    }

    function addRound() {
        const lastRow = scoreTableBody.lastElementChild;

        // 1. Validate the previous round before adding a new one
        if (lastRow) {
            const inputs = Array.from(lastRow.querySelectorAll('input'));
            const isRoundIncomplete = inputs.some(input => input.value.trim() === '');
            
            if (isRoundIncomplete) {
                statusMessage.textContent = `⚠ Round ${roundNumber} is incomplete. Fill all bid/score fields.`;
                return;
            }
            if (!validateRound(lastRow)) {
                return;
            }
            
            // If validation passes, complete the round and disable inputs
            lastRow.classList.add('round-completed');
            Array.from(lastRow.querySelectorAll('input')).forEach(input => input.disabled = true);
        }

        // 2. Check max rounds
        if (roundNumber >= 13) {
            statusMessage.textContent = '⚠ Maximum of 13 rounds reached. Game finished.';
            addRowBtn.disabled = true;
            return;
        }
        
        // 3. Add new round
        roundNumber++;
        const newRow = document.createElement('tr');
        
        const roundCell = document.createElement('td');
        roundCell.textContent = roundNumber;
        newRow.appendChild(roundCell);
        
        for (let i = 0; i < numPlayers; i++) {
            const playerCell = document.createElement('td');
            const cellWrapper = document.createElement('div');
            cellWrapper.classList.add('flex', 'flex-col', 'items-center', 'justify-center', 'gap-2', 'px-1');
            
            const bidInput = document.createElement('input');
            bidInput.type = 'text';
            bidInput.placeholder = 'Bid';
            bidInput.classList.add('input-score');
            bidInput.addEventListener('input', updateScore);
            bidInput.addEventListener('blur', updateScore);
            bidInput.addEventListener('keypress', (e) => {
                // Allow only numbers
                if (isNaN(e.key) || e.key === ' ' || e.key === '.') e.preventDefault();
            });
            
            const scoreInput = document.createElement('input');
            scoreInput.type = 'text';
            scoreInput.placeholder = 'Score';
            scoreInput.classList.add('input-score');
            scoreInput.addEventListener('input', updateScore);
            scoreInput.addEventListener('blur', updateScore);
            scoreInput.addEventListener('keypress', (e) => {
                // Allow only numbers
                if (isNaN(e.key) || e.key === ' ' || e.key === '.') e.preventDefault();
            });
            
            const finalScoreSpan = document.createElement('span');
            finalScoreSpan.classList.add('font-bold', 'text-xs');
            finalScoreSpan.textContent = 'Score: 0';
            
            cellWrapper.appendChild(bidInput);
            cellWrapper.appendChild(scoreInput);
            cellWrapper.appendChild(finalScoreSpan);
            playerCell.appendChild(cellWrapper);
            newRow.appendChild(playerCell);
        }
        
        scoreTableBody.appendChild(newRow);
        addRowBtn.disabled = true;

        // Initialize a new array for the new round score objects
        scores[roundNumber - 1] = Array(numPlayers).fill(null); 
    }

    // --- Modal and Page Navigation Logic ---
    backBtn.addEventListener('click', () => {
        confirmationModal.classList.remove('hidden');
    });
    
    confirmYesBtn.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
        welcomePage.classList.remove('hidden');
        gamePage.classList.add('hidden');
        resetBtn.click(); // Reset all game state
        addRowBtn.disabled = true;
    });

    confirmNoBtn.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
    });

    addRowBtn.addEventListener('click', addRound);

    // Initial state
    addRowBtn.disabled = true;
});