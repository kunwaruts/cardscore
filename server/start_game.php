<?php
header('Content-Type: application/json');

$servername = "sql109.infinityfree.com";
$dbUser = "if0_40166914";
$dbPassword = "Cardgame0112";
$centralDB = "if0_40166914_users";
$scoresDB = "if0_40166914_scores"; // ✅ New shared DB for storing all game tables

// Input validation
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['username']) || empty($data['players']) || !is_array($data['players'])) {
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$inputUsername = strtolower($data['username']);
$players = $data['players'];
$created_at = $data['local_time'];

// Sanitize player names for column names (remove special chars, keep letters, numbers, underscore)
$sanitizeColumnName = function ($name) {
    return preg_replace('/[^a-zA-Z0-9_]/', '_', $name);
};

try {
    $pdo = new PDO("mysql:host=$servername", $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // 1. Use central DB
    //$pdo->exec("CREATE DATABASE IF NOT EXISTS `$centralDB`"); // ❌ InfinityFree does not allow CREATE DATABASE
    $pdo->exec("USE `$centralDB`");

    // Create metadata table if not exists to store all the game ids of particular users
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS game_registry (
            game_id VARCHAR(100) PRIMARY KEY,
            username VARCHAR(50) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");

    // Create game_status table if not exists
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS game_status (
            username VARCHAR(50) UNIQUE,
            game_in_progress ENUM('yes','no') NOT NULL DEFAULT 'no',
            game_id VARCHAR(100)
        )"
    );

    // 2. Find matching user database with case-insensitive match
    $stmt = $pdo->prepare("SELECT username FROM user WHERE LOWER(username) = :username LIMIT 1");
    $stmt->bindParam(':username', $inputUsername);
    $stmt->execute();

    if ($stmt->rowCount() == 0) {
        echo json_encode(['error' => 'User database not found']);
        exit;
    }

    // Username from DB (case-preserved)
    $userRow = $stmt->fetch(PDO::FETCH_ASSOC);
    $realUsername = $userRow['username'];

    // User DB name sanitized
    $userDbName = preg_replace('/[^a-zA-Z0-9_]/', '_', $realUsername);

    // 3. Prepare game table name: username_YYYYMMDD_HHMMSS
    $gameTableName = $userDbName . '_' . date('Ymd_His');

    // Connect to user database
    //$pdo->exec("CREATE DATABASE IF NOT EXISTS `$userDbName`"); // ❌ Removed: user-specific databases are deprecated
    //$pdo->exec("USE `$userDbName`"); // ❌ Deprecated: now using shared scores DB

    // ✅ Use shared scores DB for storing game tables
    $pdo->exec("USE `$scoresDB`");

    // 4. Create the game table with player names as columns + round INT primary key
    // Columns: round INT PRIMARY KEY, then for each player a column INT score
    $columnsSqlParts = ['round INT PRIMARY KEY AUTO_INCREMENT'];
    foreach ($players as $player) {
        $colName = $sanitizeColumnName($player);
        $columnsSqlParts[] = "`$colName` INT DEFAULT 0";
    }
    $columnsSql = implode(', ', $columnsSqlParts);

    $createTableSql = "CREATE TABLE `$gameTableName` ($columnsSql)";
    $pdo->exec($createTableSql);

    //5. Update game_registry table (metadata table)
    $pdo->exec("USE `$centralDB`");

    $created_at = $data['local_time'] ?? date('Y-m-d H:i:s'); // fallback to server time if not provided

    $insertMeta = $pdo->prepare("
        INSERT INTO game_registry (game_id, username, created_at)
        VALUES (:game_id, :username, :created_at)
    ");
    $insertMeta->execute([
        ':game_id' => $gameTableName,
        ':username' => $realUsername,
        ':created_at' => $created_at
    ]);


    // 5. Update central game_status table to mark in progress and record game_id
    $pdo->exec("USE `$centralDB`");
    $upsertStmt = $pdo->prepare(
        "INSERT INTO game_status (username, game_in_progress, game_id)
        VALUES (:username, 'yes', :game_id)
        ON DUPLICATE KEY UPDATE game_in_progress='yes', game_id=:game_id"
    );
    $upsertStmt->execute([':username' => $realUsername, ':game_id' => $gameTableName]);

    echo json_encode(['message' => 'Game started', 'game_id' => $gameTableName]);

} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>