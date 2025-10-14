// rank_calculator.js
export function getPlayersRank(playerNames, totals) {
    // Create player objects with name and score
    const playerRanks = playerNames
        .map((name, idx) => ({ name, score: totals[idx] || 0 }))
        .sort((a, b) => b.score - a.score);

    // Get the winner (first in sorted array)
    const winner = playerRanks[0];
    
    // Build the winner message with celebratory emojis
    let message = `<b>The winner is <i>${winner.name}</i> with score <i>${winner.score}</i> 🎊🎉</b><br><br>`;
    
    // Add player ranks section
    message += '<strong>Player Ranks</strong><br>';
    message += '<ol>';
    
    // Generate the ranked list
    playerRanks.forEach((player) => {
        message += `<li><b>${player.name}:</b> ${player.score}</li>`;
    });
    
    message += '</ol>';
    
    return message;
}
