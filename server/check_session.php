<?php
session_start();


$username = $_SESSION['username'] ?? null;

echo json_encode(['username' => $username]);

?>
