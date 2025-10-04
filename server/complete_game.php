<?php
header('Content-Type: application/json');

$servername = "localhost";
$dbUser = "root";
$dbPassword = "";
$centralDB = "Users";

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['username']) || empty($data['game_id'])) {
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$username = strtolower($data['username']);
$gameId = $data['game_id'];

try {
    $pdo = new PDO("mysql:host=$servername", $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$centralDB`");
    $pdo->exec("USE `$centralDB`");

    $createGameStatusTable = "
        CREATE TABLE IF NOT EXISTS game_status (
            username VARCHAR(50) UNIQUE,
            game_in_progress ENUM('yes','no') NOT NULL DEFAULT 'no',
            game_id VARCHAR(100)
        )
    ";
    $pdo->exec($createGameStatusTable);

    // Mark as completed
    $stmtUpdate = $pdo->prepare(
        "UPDATE game_status SET game_in_progress = 'no' WHERE LOWER(username) = :username AND game_id = :game_id"
    );
    $stmtUpdate->execute([':username' => $username, ':game_id' => $gameId]);

    // Delete entry for this game_id
    $stmtDelete = $pdo->prepare(
        "DELETE FROM game_status WHERE LOWER(username) = :username AND game_id = :game_id"
    );
    $stmtDelete->execute([':username' => $username, ':game_id' => $gameId]);

    echo json_encode(['message' => 'Game marked as completed and removed from game_status']);

    //CHECK JSOON FILE AND DELETE
    $gameSaveFile = __DIR__ . "/gamesaves/game_$gameId.json";
    if (file_exists($gameSaveFile)) {
        unlink($gameSaveFile);
    }

} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
