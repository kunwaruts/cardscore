// game.js

document.addEventListener('DOMContentLoaded', () => {
    const welcomePage = document.getElementById('welcome-page');
    const gamePage = document.getElementById('game-page');
    const numPlayersSelect = document.getElementById('numPlayers');
    const playerNamesContainer = document.getElementById('playerNamesContainer');
    const playBtn = document.getElementById('playBtn');
    const resetBtn = document.getElementById('resetBtn');

    const tableHeader = document.getElementById('tableHeader');
    const scoreTableBody = document.getElementById('scoreTableBody');
    const totalRow = document.getElementById('totalRow');
    const addRowBtn = document.getElementById('addRowBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const historyBtn = document.getElementById('historyBtn');
    const statusMessage = document.getElementById('statusMessage');

    let numPlayers = 0;
    let playerNames = [];
    let scores = [];
    let roundNumber = 0;

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

        // Validate unique & non-empty
        const lowercaseNames = playerNames.map(name => name.toLowerCase());
        const uniqueNames = new Set(lowercaseNames);
        if (uniqueNames.size !== playerNames.length) {
            alert('⚠ Player names must be unique.');
            return;
        }
        if (playerNames.some(n => n === '')) {
            alert('⚠ Enter all player names.');
            return;
        }

        scores = [];
        roundNumber = 0;
        scoreTableBody.innerHTML = '';
        updateTableHeader();
        updateTotals();

        welcomePage.classList.add('hidden');
        gamePage.classList.remove('hidden');

        addRound();
    });

    resetBtn.addEventListener('click', () => {
        numPlayersSelect.value = '';
        playerNamesContainer.innerHTML = '';
        playBtn.disabled = true;
        scores = [];
        roundNumber = 0;
        scoreTableBody.innerHTML = '';
    });

    logoutBtn.addEventListener('click', () => {
        gamePage.classList.add('hidden');
        document.getElementById('authModal').style.display = 'flex';
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
            let sum = scores.reduce((acc, round) => acc + round[idx], 0);
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
                scores[roundNumber - 1] = roundScores;
                updateTotals();
            });
            td.appendChild(input);
            row.appendChild(td);
            roundScores.push(0);
        }
        scores.push(roundScores);
        scoreTableBody.appendChild(row);
        addRowBtn.disabled = false;
    }

    addRowBtn.addEventListener('click', addRound);

    function signInPageReset() {
        const signInForm = document.getElementById('signInForm');
        signInForm.reset();
        const inputs = signInForm.querySelectorAll('.form-input');
        inputs.forEach(input => input.classList.remove('input-error'));
        const errors = signInForm.querySelectorAll('.inline-error');
        errors.forEach(err => err.remove());
    }
});
