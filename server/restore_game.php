<?php
header('Content-Type: application/json');

$servername = "sql109.infinityfree.com";
$dbUser = "if0_40166914";
$dbPassword = "Cardgame0112";
$centralDB = "Users";

$data = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !$data || empty($data['username'])) {
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$username = strtolower($data['username']);

try {
    $pdo = new PDO("mysql:host=$servername", $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$centralDB`");
    $pdo->exec("USE `$centralDB`");

    $stmt = $pdo->prepare("SELECT game_id FROM game_status WHERE LOWER(username) = :username AND game_in_progress = 'yes' LIMIT 1");
    $stmt->execute([':username' => $username]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row && !empty($row['game_id'])) {
        $gameId = $row['game_id'];
        $filePath = __DIR__ . "/gamesaves/game_{$gameId}.json";
        $gameData = null;
        if (file_exists($filePath)) {
            $gameData = json_decode(file_get_contents($filePath));
        }
        echo json_encode(['activeGameId' => $gameId, 'gameData' => $gameData]);
    } else {
        echo json_encode(['activeGameId' => null, 'gameData' => null]);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
