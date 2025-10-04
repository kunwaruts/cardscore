<?php
session_start();
header('Content-Type: application/json');

$servername = "localhost";
$dbUser = "root";
$dbPassword = "";
$centralDB = "Users";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request method']);
    exit;
}

$username = trim($_POST['username'] ?? '');
$dob = trim($_POST['dob'] ?? '');
$security_question = trim($_POST['security_question'] ?? '');
$security_answer = trim($_POST['security_answer'] ?? '');

if ($username === '' || $dob === '' || $security_question === '' || $security_answer === '') {
    echo json_encode(['error' => 'All fields must be filled']);
    exit;
}

// Sanitize username for use as DB name (allow only letters, numbers, underscore)
$dbNameUser = preg_replace('/[^a-zA-Z0-9_]/', '_', $username);

try {
    $pdo = new PDO("mysql:host=$servername", $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // 1. Setup central Users database and user table
    $pdo->exec("CREATE DATABASE IF NOT EXISTS $centralDB");
    $pdo->exec("USE $centralDB");

    $createUserTable = "
        CREATE TABLE IF NOT EXISTS user (
            username VARCHAR(50) NOT NULL UNIQUE,
            dob DATE NOT NULL,
            security_question VARCHAR(255) NOT NULL,
            security_answer VARCHAR(255) NOT NULL,
            PRIMARY KEY (username)
        );
    ";

    $pdo->exec($createUserTable);

    // 2. Check if username exists
    $stmt = $pdo->prepare("SELECT username FROM user WHERE username = :username");
    $stmt->bindParam(':username', $username);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        echo json_encode(['error' => 'Username not available']);
        exit;
    }

    // 3. Insert user into central table
    $insertStmt = $pdo->prepare("INSERT INTO user (username, dob, security_question, security_answer) VALUES (:username, :dob, :question, :answer)");
    $insertStmt->bindParam(':username', $username);
    $insertStmt->bindParam(':dob', $dob);
    $insertStmt->bindParam(':question', $security_question);
    $insertStmt->bindParam(':answer', $security_answer);

    if (!$insertStmt->execute()) {
        echo json_encode(['error' => 'Failed to create user']);
        exit;
    }

    // 4. Check if user-specific database exists
    $dbExistsStmt = $pdo->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = :dbname");
    $dbExistsStmt->bindParam(':dbname', $dbNameUser);
    $dbExistsStmt->execute();

    if ($dbExistsStmt->rowCount() === 0) {
        // Database does not exist, create it
        $pdo->exec("CREATE DATABASE `$dbNameUser`");
    }

    // 5. Optionally, initialize user DB's tables here, example:
    //$pdo->exec("USE `$dbNameUser`");
    //$pdo->exec('CREATE TABLE IF NOT EXISTS example_table (id INT PRIMARY KEY AUTO_INCREMENT, data VARCHAR(255))');

    $_SESSION['username'] = $username;
    echo json_encode(['message' => 'Signup successful', 'username' => $username]);

} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
