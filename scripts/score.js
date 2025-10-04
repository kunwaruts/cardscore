// --- State Management and Core Calculation Logic ---

// Global State (Private to this module)
let scores = [];
let roundNumber = 0;
let playerNames = [];
let numPlayers = 0;

// Exported Constants
export const MAX_ROUNDS = 13;
export const TOTAL_TRICKS = 13; // Total tricks available in a round

/**
 * Resets and initializes the game state with new player names.
 * @param {string[]} names - Array of player names.
 */
export function initializeGameState(names) {
    playerNames = names;
    numPlayers = names.length;
    scores = [];
    roundNumber = 0;
    console.log("Score logic state initialized.");
}

/**
 * Adds a new, empty round structure to the game state.
 * @returns {number} The index of the new round.
 */
export function addRoundToState() {
    const roundIndex = roundNumber;
    
    // Check if max rounds reached before creation
    if (roundIndex >= MAX_ROUNDS) {
        return -1;
    }
    
    const newRoundScores = [];
    for (let i = 0; i < numPlayers; i++) {
        // Player state structure: bid, tricks taken (score), final score
        // Initialize score to 0 explicitly to prevent 'null' or 'undefined' issues
        newRoundScores.push({ bid: 0, score: 0, finalScore: 0 }); 
    }
    
    scores[roundIndex] = newRoundScores;
    roundNumber++;
    return roundIndex;
}

/**
 * Calculates the final score for a player based on bid and tricks taken.
 * NOTE: This implements the specific scoring rules provided previously.
 * @param {number} bid - The bid amount.
 * @param {number} tricksTaken - The number of tricks taken.
 * @param {number} playerCount - The number of players (3 or 4).
 * @returns {number} The calculated round score.
 */
export function calculatePlayerRoundScore(bid, tricksTaken, playerCount) {
    if (bid <= 0 || tricksTaken < 0) return 0; 

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
    
    return 0; // Default case
}

/**
 * Updates a player's bid or score in the state and recalculates the final score.
 * @param {number} roundIndex - The index of the round.
 * @param {number} playerIndex - The index of the player.
 * @param {'bid'|'score'} type - The field to update.
 * @param {number} value - The new value.
 * @returns {{finalScore: number, bidComplete: boolean}} The new final score and bid completeness status.
 */
export function updatePlayerScoreState(roundIndex, playerIndex, type, value) {
    if (!scores[roundIndex] || !scores[roundIndex][playerIndex]) {
        console.error('Invalid state access:', roundIndex, playerIndex);
        return { finalScore: 0, bidComplete: false };
    }

    const playerState = scores[roundIndex][playerIndex];
    playerState[type] = value;
    
    // Recalculate final score only if both bid and score are available (bid > 0, score >= 0)
    if (playerState.bid > 0 && typeof playerState.score === 'number') {
        playerState.finalScore = calculatePlayerRoundScore(
            playerState.bid, 
            playerState.score, 
            numPlayers
        );
    } else {
        playerState.finalScore = 0;
    }

    // Check if all bids are entered for this round
    const bidComplete = areAllBidsEntered(roundIndex);

    return { 
        finalScore: playerState.finalScore, 
        bidComplete: bidComplete 
    };
}

/**
 * Checks if all players have entered a bid greater than zero for the specified round.
 * @param {number} roundIndex - The round index.
 * @returns {boolean} True if all bids are entered (> 0).
 */
export function areAllBidsEntered(roundIndex) {
    const round = scores[roundIndex];
    if (!round) return false;
    return round.every(player => player.bid > 0); 
}

/**
 * Calculates the sum of tricks taken for a round and checks if it equals TOTAL_TRICKS.
 * Also checks if all score fields have been entered (score >= 0).
 * @param {number} roundIndex - The round index.
 * @returns {{isValid: boolean, total: number, isComplete: boolean}} Validation results.
 */
export function getRoundValidationStatus(roundIndex) {
    const round = scores[roundIndex];
    if (!round) return { isValid: false, total: 0, isComplete: false };

    let roundTricksTotal = 0;
    let isComplete = true;

    round.forEach(player => {
        // Check for bid completeness (handled by areAllBidsEntered elsewhere) and score entry
        if (player.bid <= 0 || typeof player.score !== 'number') { 
            isComplete = false;
        }
        roundTricksTotal += player.score;
    });

    const isValid = isComplete && (roundTricksTotal === TOTAL_TRICKS);

    return { 
        isValid: isValid, 
        total: roundTricksTotal, 
        isComplete: isComplete // All inputs entered and valid non-zero bid
    };
}

/**
 * Gets the current running totals for all players.
 * @returns {{names: string[], totals: number[]}} Player names and their total scores.
 */
export function getAllTotals() {
    const totals = new Array(numPlayers).fill(0);
    
    scores.forEach(round => {
        if (!round) return;
        
        round.forEach((player, playerIdx) => {
            if (player && typeof player.finalScore === 'number') {
                totals[playerIdx] += player.finalScore; 
            }
        });
    });

    return { 
        names: playerNames, 
        totals: totals 
    };
}

/**
 * Getter for current round number (1-based index).
 * @returns {number}
 */
export function getCurrentRoundNumber() {
    return roundNumber;
}

/**
 * Getter for number of players.
 * @returns {number}
 */
export function getNumPlayers() {
    return numPlayers;
}
