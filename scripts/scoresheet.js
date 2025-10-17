import { saveGameProgress } from './gameinprogress.js';
import { showWinnerModal } from './gameaction.js';
import { getPlayersRank } from './rank_calculator.js';
import { resetGameAction } from './resetGameAction.js';
import { showConfirmationModal } from './modalhandler.js';

let gameId = null;
let scores = [];
let playerNames = [];
let roundNumber = 0;
let loggedInUsername = null;
let numPlayers = 0;

const welcomePage = document.getElementById('welcome-page');
const gamePage = document.getElementById('game-page');
const persistentHeader = document.getElementById('persistentHeader');

const tableHeader = document.getElementById('tableHeader');
const scoreTableBody = document.getElementById('scoreTableBody');
const totalRow = document.getElementById('totalRow');
const errorDisplayArea = document.getElementById('statusMessage');


const addRowBtn = document.getElementById('addRowBtn'); 
const completeBtn = document.getElementById('completeBtn');



const MAX_ROUNDS = 13;
document.addEventListener('DOMContentLoaded', async () => {
    
    addRowBtn.addEventListener('click', async () => {
        if (roundNumber < MAX_ROUNDS) {
            addRound();
        } else if (roundNumber >= MAX_ROUNDS) {
            await addRound(undefined,true);
            const totals = [];
            totalRow.querySelectorAll('.total-row td').forEach(td => totals.push(parseInt(td.textContent) || 0));

            const rankMessage = getPlayersRank(playerNames, totals);
            showWinnerModal(
                "Game Finished",
                rankMessage,
                () => {
                    resetGameAction();
                    welcomePage.classList.remove('hidden');
                    gamePage.classList.add('hidden');
                },         
                async () => {
                    try {  
                        const startResp = await fetch('server/start_game.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: loggedInUsername, players: playerNames }),
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

                        startGameSession(playerNames, newGameId, loggedInUsername);

                        await saveGameProgress();
                        resetGameAction();
                        welcomePage.classList.add('hidden');
                        gamePage.classList.remove('hidden');
                    } catch (err) {
                        console.error("Error during replay flow:", err);
                    }
                }
            );
            
            try {
                const completeResp = await fetch('server/complete_game.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: loggedInUsername, game_id: gameId }),
                });
                const completeResult = await completeResp.json();
                if (completeResult.error) {
                    console.error("Error completing game:", completeResult.error);
                } else {
                    console.log("Game marked as completed and cleaned up");
                }
            } catch (err) {
                console.error("Network error completing game:", err);
            }
        }
    });


});

export function getCurrentGameState() {

    if (!Array.isArray(scores) || !Array.isArray(playerNames)) {
        return [];
    }
    const result = scores.map((roundArr, roundIdx) =>
        roundArr.map((playerObj, playerIdx) => ({
            playername: playerNames[playerIdx],
            bid: playerObj.bid || 0,
            score: playerObj.score || 0,
            final: playerObj.finalScore || 0
        }))
    );
    return result;
}
export function getGameId() {
    console.log("SCORESHEET id = ", gameId);
    return gameId;
}

export function getLoggedInUserName() {
    return loggedInUsername;
}

export function getRoundNumber() {
    return roundNumber;
}
export function getPlayerNames() {
    return playerNames;
}

function enforceIntegerInput(inputElement) {
    if (!inputElement) return;

    inputElement.addEventListener('input', function () {   
        this.value = this.value.replace(/[^0-9]/g, ''); 
        if (this.value.length > 1 && this.value.startsWith('0')) {
            this.value = parseInt(this.value, 10).toString();
        }
    });
}

function getRoundIndexFromInput(inputElement) {
    const id = inputElement.id;
    const match = id.match(/r(\d+)-/);
    return match ? parseInt(match[1], 10) : -1;
}

const isAnyInputErrorActive = () => { 
    return document.querySelectorAll('.input-has-range-error').length > 0;
};
function calculatePlayerRoundScore(bid, tricksTaken, playerCount) {
    if (bid < 0 || tricksTaken < 0) return 0;
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

    return 0; 
}
function highlightInputError(inputElement) {
    if (inputElement) {
        
        inputElement.style.border = '2px solid #fa0000ff';
        inputElement.style.backgroundColor = '#f7a6a6ff';
        inputElement.classList.add('input-has-range-error'); 
    }
}

function clearInputError(inputElement) {
    if (inputElement) {
        inputElement.style.border = '1px solid #d1d5db'; 
        inputElement.style.backgroundColor = 'white';
        inputElement.classList.remove('input-has-range-error'); 
    }
}


const handleInputAndUpdateScore = (roundIndex, playerIndex, type, value, inputElement) => {
    const playerState = scores[roundIndex][playerIndex];
    const currentRoundRow = scoreTableBody.querySelector(`#round-${roundIndex}`);
    const scoreDisplay = currentRoundRow.querySelector(`#r${roundIndex}-p${playerIndex}-final`);

    
    playerState[type] = value;

    
    clearInputError(inputElement);

    
    if (playerState.bid > 0 && playerState.score !== null && playerState.score !== undefined) {

        const finalScore = calculatePlayerRoundScore(playerState.bid, playerState.score, numPlayers);
        playerState.finalScore = finalScore;

        
        scoreDisplay.textContent = finalScore;
        scoreDisplay.classList.toggle('positive-score', finalScore > 0);
        scoreDisplay.classList.toggle('negative-score', finalScore <= 0);

    } else {
        
        playerState.finalScore = 0;
        scoreDisplay.textContent = 0;
        scoreDisplay.classList.remove('positive-score');
        scoreDisplay.classList.add('negative-score');
    }

    
    if (type === 'bid') {
        
        toggleScoreInputs(roundIndex);
    }

    updateTotals();
};


const areAllBidsEntered = (roundIndex) => {
    const round = scores[roundIndex];
    if (!round) return false;
    
    return round.every(player => player.bid > 0);
};


const toggleScoreInputs = (roundIndex) => {
    const currentRoundRow = scoreTableBody.querySelector(`#round-${roundIndex}`);
    if (!currentRoundRow) return;

    const scoreInputs = currentRoundRow.querySelectorAll('.score-input');

    
    const enableScores = areAllBidsEntered(roundIndex);

    scoreInputs.forEach(input => {
        input.disabled = !enableScores;

        if (!input.classList.contains('input-has-range-error')) {
            
            input.style.backgroundColor = enableScores ? 'white' : 'rgba(255, 255, 255, 0.5)';
        }
    });
};


function validateInputRange(inputElement) {
    const value = parseInt(inputElement.value) || 0;
    const min = parseInt(inputElement.min) || 0;
    const max = parseInt(inputElement.max) || Infinity;
    const type = inputElement.classList.contains('bid-input') ? 'Bid' : 'Score';
    const currentRoundIndex = getRoundIndexFromInput(inputElement);

    
    clearInputError(inputElement);

    if (value < min || value > max) {
        highlightInputError(inputElement);
        
        showGameError(`⚠ ${type} must be between ${min} and ${max}. Please correct the value.`);
        return false;
    }

    
    setTimeout(() => {
        if (!isAnyInputErrorActive()) {
            clearGameError();
        }
        
        toggleScoreInputs(currentRoundIndex);
    }, 50);

    return true;
}


function showGameError(message) {
    if (errorDisplayArea) {
        
        errorDisplayArea.innerHTML = `${message}`;
        errorDisplayArea.style.display = 'block';
    }
}


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

function updateTableHeader() {
    tableHeader.innerHTML = '<th class="round-number-cell" style="width: 120px;">Round</th>';
    playerNames.forEach(name => {
        tableHeader.innerHTML += `<th>${name}</th>`;
    });
}

function updateTotals() {
    let totalHTML = `<td colspan="1">Total</td>`;

    playerNames.forEach((_, playerIdx) => {
        let sum = 0;

        scores.forEach(round => {
            if (round && round[playerIdx]) {
                sum += round[playerIdx].finalScore;
            }
        });
        
        totalHTML += `<td class="total-score">${sum}</td>`;
    });
    totalRow.innerHTML = totalHTML;
}

function clearGameError() {
    if (errorDisplayArea) {
        errorDisplayArea.innerHTML = '';
        errorDisplayArea.style.display = 'none';
    }
}

export function startGameSession(names, gId, username) {
    playerNames = names;
    numPlayers = names.length;
    scores = [];
    roundNumber = 0;
    scoreTableBody.innerHTML = '';

    gameId = gId || null;                 
    console.log("Session check = ", gameId);
    loggedInUsername = username || null;  

    updateTableHeader();
    updateTotals();
    clearGameError();

    addRowBtn.disabled = false;
    addRound(true);
    document.querySelectorAll('.score-input-box').forEach(enforceIntegerInput);
};

async function addRound(isInitial = false, isFinalRound = false) {
  const currentRoundIndex = roundNumber;
  const previousRoundIndex = roundNumber - 1;

  // Set limits dynamically based on player count
  const bidLimits = getBidLimits(numPlayers);
  const scoreLimits = getScoreLimits(numPlayers);
  const TOTAL_TRICKS = getExpectedScoreSum(numPlayers);

  // Validation and locking of previous round
  if (roundNumber > 0 && !isInitial) {
    let roundTricksTotal = 0;
    let isRoundComplete = true;

    scores[previousRoundIndex].forEach(player => {
      if (
        player.bid <= 0 ||
        player.bid === null ||
        player.bid === undefined ||
        player.score === null ||
        player.score === undefined
      ) {
        isRoundComplete = false;
      }
      roundTricksTotal += player.score;
    });

    const prevRow = scoreTableBody.querySelector(`#round-${previousRoundIndex}`);
    const prevScoreInputs = prevRow ? prevRow.querySelectorAll('.score-input') : [];

    if (roundTricksTotal === TOTAL_TRICKS) {
      prevScoreInputs.forEach(input => clearInputError(input));
    }

    if (isAnyInputErrorActive()) {
      showGameError("⚠ Please resolve all highlighted range errors before advancing to the next round.");
      return;
    }

    if (!isRoundComplete) {
      showGameError("⚠ Please ensure all Bid and Score fields are entered (Bid > 0, Score ≥ 0) for the previous round before starting a new one.");
      return;
    }

    if (roundTricksTotal !== TOTAL_TRICKS) {
      showGameError(
        `⚠ Trick Total Mismatch: The total tricks taken (${roundTricksTotal}) must equal the total tricks available (${TOTAL_TRICKS}).`
      );
      if (prevRow) {
        prevScoreInputs.forEach(input => highlightInputError(input));
      }
      return;
    }

    if (prevRow && !isFinalRound) {
      prevRow.querySelectorAll('input').forEach(input => {
        input.setAttribute('readonly', 'readonly');
        input.disabled = true;
        input.style.backgroundColor = '#212121';
        clearInputError(input);
      });
    }

    clearGameError();

    await sendRoundScoresToServer(previousRoundIndex);
  }

  // Skip new round row creation if it's the final round
  if (isFinalRound) {
    return;
  }

  // Initialize new round UI
  roundNumber++;
  const roundId = `round-${currentRoundIndex}`;
  const row = document.createElement('tr');
  row.id = roundId;

  const newRoundScores = [];
  scores[currentRoundIndex] = newRoundScores;

  const roundNumCell = document.createElement('td');
  roundNumCell.classList.add('round-number-cell');
  roundNumCell.textContent = `${roundNumber} / ${MAX_ROUNDS}`;
  row.appendChild(roundNumCell);

  for (let i = 0; i < numPlayers; i++) {
    const td = document.createElement('td');
    td.classList.add('score-cell');

    const playerState = { bid: 0, score: 0, finalScore: 0 };
    newRoundScores.push(playerState);

    // Bid input setup
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
    bidInput.min = bidLimits.min;
    bidInput.max = bidLimits.max;
    bidInput.classList.add('bid-input', 'score-input-box');
    bidInput.addEventListener('blur', (e) => validateInputRange(e.target));
    bidInput.addEventListener('input', async (e) => {
      const val = parseInt(e.target.value) || 0;
      handleInputAndUpdateScore(currentRoundIndex, i, 'bid', val, e.target);
      try {
        await saveGameProgress();
      } catch (err) {
        console.error('Auto-save error:', err);
      }
    });
    enforceIntegerInput(bidInput);

    bidSection.appendChild(bidLabel);
    bidSection.appendChild(bidInput);
    td.appendChild(bidSection);

    // Score input setup
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
    scoreInput.min = scoreLimits.min;
    scoreInput.max = scoreLimits.max;
    scoreInput.classList.add('score-input', 'score-input-box');
    scoreInput.disabled = true;
    scoreInput.addEventListener('blur', (e) => validateInputRange(e.target));
    scoreInput.addEventListener('input', async (e) => {
      const val = parseInt(e.target.value) || 0;
      handleInputAndUpdateScore(currentRoundIndex, i, 'score', val, e.target);
      try {
        await saveGameProgress();
      } catch (err) {
        console.error('Auto-save error:', err);
      }
    });
    enforceIntegerInput(scoreInput);

    scoreSection.appendChild(scoreLabel);
    scoreSection.appendChild(scoreInput);
    td.appendChild(scoreSection);

    // Final score display
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

  scoreTableBody.appendChild(row);

  // Update button and round-end UI
  if (roundNumber >= MAX_ROUNDS) {
    addRowBtn.textContent = 'Finish Game';
    addRowBtn.style.backgroundColor = '#3dfe00';
    addRowBtn.style.color = '#000000';
    const message = `<p class="finishNotification">This is the last round. To complete the game, please click the Finish Game button.</p>`;
    showGameError(message);
    addRowBtn.disabled = false;
  } else {
    addRowBtn.textContent = 'Next Round';
    addRowBtn.disabled = false;
  }

  const firstBidInput = row.querySelector('.bid-input');
  if (firstBidInput) {
    firstBidInput.focus();
  }
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
            headers: { 'Content-Type': 'application/json' },
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

function getBidLimits(playerCount) {
  return playerCount === 3 ? { min: 3, max: 17 } : { min: 2, max: 13 };
}

function getScoreLimits(playerCount) {
  return playerCount === 3 ? { min: 0, max: 17 } : { min: 0, max: 13 };
}

function getExpectedScoreSum(playerCount) {
  return playerCount === 3 ? 17 : 13;
}
