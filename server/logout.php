<?php
session_start();
session_destroy();
setcookie('user_identity', '', time() - 3600, "/");
echo json_encode(['success' => true]);
?>
