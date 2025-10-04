import { getGameId, getCurrentGameState } from './scoresheet.js'; // import getter and state function

// Save game JSON file named after gameId, with playername, bid, score

export async function saveGameProgress() {
  const gameId = getGameId();
  
  if (!gameId) {
    console.error("Game ID is not set. Cannot save game progress.");
    return;
  }
  
  const gameData = getCurrentGameState();

  if (!Array.isArray(gameData) || gameData.length === 0) {
    console.error("Game data is empty or invalid. Nothing to save.");
    return;
  }

  // Filter out `final` from each player object
  const filteredData = gameData.map(round =>
    round.map(({ playername, bid, score }) => ({ playername, bid, score }))
  );

  const payload = {
    game_id: gameId,
    scores: filteredData
  };

  try {
    const response = await fetch('server/save_game_json.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.error) {
      console.error("Error saving game:", result.error);
    } else {
      console.log("Game progress saved successfully:", result.message);
    }
  } catch (error) {
    console.error("Network or server error during save:", error);
  }
}
