<?php
header('Content-Type: application/json');

$servername = "localhost";
$dbUser = "root";
$dbPassword = "";
$dbName = "Users";

if (!isset($_GET['username'])) {
    echo json_encode(['error' => 'No username specified']);
    exit;
}

$username = trim($_GET['username']);

try {
    $pdo = new PDO("mysql:host=$servername", $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $pdo->exec("CREATE DATABASE IF NOT EXISTS $dbName");
    $pdo->exec("USE $dbName");

    $createTableSQL = "
        CREATE TABLE IF NOT EXISTS user (
            username VARCHAR(50) NOT NULL UNIQUE,
            dob DATE NOT NULL,
            security_question VARCHAR(255) NOT NULL,
            security_answer VARCHAR(255) NOT NULL,
            PRIMARY KEY (username)
        )
    ";
    $pdo->exec($createTableSQL);

    $stmt = $pdo->prepare("SELECT username FROM user WHERE username = :username");
    $stmt->bindParam(':username', $username);
    $stmt->execute();

    echo json_encode(['exists' => $stmt->rowCount() > 0]);

} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
