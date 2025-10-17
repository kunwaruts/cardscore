<?php
header('Content-Type: application/json');

$servername = "sql109.infinityfree.com";
$dbUser = "if0_40166914";
$dbPassword = "Cardgame0112";
$centralDB = "if0_40166914_users";
$scoresDB = "if0_40166914_scores";

$data = json_decode(file_get_contents('php://input'), true);

if (
    $_SERVER['REQUEST_METHOD'] !== 'POST' ||
    !$data ||
    empty($data['username']) ||
    empty($data['game_id'])
) {
    echo json_encode(['error' => 'Invalid request or parameters']);
    exit;
}

$username = strtolower($data['username']);
$gameId = preg_replace('/[^a-zA-Z0-9_]/', '_', $data['game_id']); // sanitize for table name

try {
    $pdo = new PDO("mysql:host=$servername", $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // 1. Remove from game_status
    $pdo->exec("USE `$centralDB`");
    $delStatus = $pdo->prepare("DELETE FROM game_status WHERE LOWER(username) = :username AND game_id = :game_id");
    $delStatus->execute([':username' => $username, ':game_id' => $gameId]);

    // 2. Remove from game_registry (metadata)
    $delRegistry = $pdo->prepare("DELETE FROM game_registry WHERE username = :username AND game_id = :game_id");
    $delRegistry->execute([':username' => $username, ':game_id' => $gameId]);

    // 3. Drop game table from shared scores DB
    $pdo->exec("USE `$scoresDB`");
    $pdo->exec("DROP TABLE IF EXISTS `$gameId`");

    // 4. Delete JSON save file
    $saveFile = __DIR__ . "/gamesaves/game_$gameId.json";
    if (file_exists($saveFile)) {
        unlink($saveFile);
    }

    echo json_encode(['message' => 'Game and all progress deleted successfully']);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
