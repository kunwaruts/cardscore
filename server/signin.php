<?php
session_start();
header('Content-Type: application/json');

$servername = "localhost";
$dbUser = "root";
$dbPassword = "";
$dbName = "Users";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request method']);
    exit;
}

$username = trim($_POST['username'] ?? '');
$dob = trim($_POST['dob'] ?? '');

if ($username === '' || $dob === '') {
    echo json_encode(['error' => 'Username and Date of Birth are required']);
    exit;
}

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

    $stmt = $pdo->prepare("SELECT dob FROM user WHERE username = :username");
    $stmt->bindParam(':username', $username);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        // Username does not exist
        echo json_encode(['error' => 'Username is incorrect.']);
        exit;
    }

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row['dob'] === $dob) {
        // Set session and cookie for persistent login
        $_SESSION['username'] = $username; // store in session only
        echo json_encode(['message' => 'Login successful', 'username' => $username]);
    } else {
        echo json_encode(['error' => 'Date of Birth is incorrect.']);
    }

} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
}
?>
