<?php
header('Content-Type: application/json');

$servername = "localhost";
$dbUser = "root";
$dbPassword = "";

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['username']) || empty($data['game_id']) || !isset($data['round']) || empty($data['scores']) || !is_array($data['scores'])) {
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$username = strtolower($data['username']);
$gameId = $data['game_id'];
$round = intval($data['round']);
$scores = $data['scores'];

// Sanitize username for DB name
$userDbName = preg_replace('/[^a-zA-Z0-9_]/', '_', $username);

// Sanitize gameId as table name
$gameTableName = preg_replace('/[^a-zA-Z0-9_]/', '_', $gameId);

try {
    $pdo = new PDO("mysql:host=$servername", $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Use user DB
    $pdo->exec("USE `$userDbName`");

    // Check if round row exists (by round number)
    $stmtCheck = $pdo->prepare("SELECT round FROM `$gameTableName` WHERE round = :round");
    $stmtCheck->bindParam(':round', $round);
    $stmtCheck->execute();

    if ($stmtCheck->rowCount() > 0) {
        // Update existing round row
        $setSqlParts = [];
        $params = [':round' => $round];
        foreach ($scores as $player => $score) {
            $col = preg_replace('/[^a-zA-Z0-9_]/', '_', $player);
            $setSqlParts[] = "`$col` = :$col";
            $params[":$col"] = intval($score);
        }
        $setSql = implode(', ', $setSqlParts);
        $updateSql = "UPDATE `$gameTableName` SET $setSql WHERE round = :round";
        $stmtUpdate = $pdo->prepare($updateSql);
        $stmtUpdate->execute($params);
    } else {
        // Insert new round row
        $columns = ['round'];
        $placeholders = [':round'];
        $params = [':round' => $round];
        foreach ($scores as $player => $score) {
            $col = preg_replace('/[^a-zA-Z0-9_]/', '_', $player);
            $columns[] = "`$col`";
            $placeholders[] = ":$col";
            $params[":$col"] = intval($score);
        }
        $columnsSql = implode(', ', $columns);
        $placeholdersSql = implode(', ', $placeholders);
        $insertSql = "INSERT INTO `$gameTableName` ($columnsSql) VALUES ($placeholdersSql)";
        $stmtInsert = $pdo->prepare($insertSql);
        $stmtInsert->execute($params);
    }

    echo json_encode(['message' => 'Round scores updated']);

} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
