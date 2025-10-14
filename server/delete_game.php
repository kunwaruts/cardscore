<?php
header('Content-Type: application/json');

$servername = "sql109.infinityfree.com";
$dbUser = "if0_40166914";
$dbPassword = "Cardgame0112";
$centralDB = "Users";

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
$gameId = $data['game_id'];

try {
    $pdo = new PDO("mysql:host=$servername", $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Remove from status table
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$centralDB`");
    $pdo->exec("USE `$centralDB`");
    $delStatus = $pdo->prepare("DELETE FROM game_status WHERE LOWER(username) = :username AND game_id = :game_id");
    $delStatus->execute([':username' => $username, ':game_id' => $gameId]);

    // Get proper user DB (case preserved)
    $checkUser = $pdo->prepare("SELECT username FROM user WHERE LOWER(username) = :username LIMIT 1");
    $checkUser->execute([':username' => $username]);
    $userRow = $checkUser->fetch(PDO::FETCH_ASSOC);
    if (!$userRow) {
        echo json_encode(['error' => 'User database not found']);
        exit;
    }
    $userDb = preg_replace('/[^a-zA-Z0-9_]/', '_', $userRow['username']);

    // Drop game table (disconnects from status)
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$userDb`");
    $pdo->exec("USE `$userDb`");
    $pdo->exec("DROP TABLE IF EXISTS `$gameId`");

    // Remove JSON save file (if any)
    $saveFile = __DIR__ . "/gamesaves/game_$gameId.json";
    if (file_exists($saveFile)) {
        unlink($saveFile);
    }

    echo json_encode(['message' => 'Game and all progress deleted successfully']);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
