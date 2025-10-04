<?php
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['game_id']) || empty($data['scores'])) {
    echo json_encode(['error' => 'Invalid data']);
    exit;
}

$gameId = preg_replace('/[^a-zA-Z0-9_-]/', '', $data['game_id']);
$folder = __DIR__ . '/gamesaves';

if (!file_exists($folder)) {
    mkdir($folder, 0777, true);
}

$filePath = "$folder/game_$gameId.json";

if (file_put_contents($filePath, json_encode($data['scores'], JSON_PRETTY_PRINT))) {
    echo json_encode(['message' => 'Game saved']);
} else {
    echo json_encode(['error' => 'Failed to save game']);
}
?>
