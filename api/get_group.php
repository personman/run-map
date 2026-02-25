<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$id = $_GET['id'] ?? '';

// Validate: exactly 12 lowercase hex chars
if (!preg_match('/^[a-f0-9]{12}$/', $id)) {
    json_response(['error' => 'Invalid group ID'], 400);
}

try {
    $db = get_db();
    $stmt = $db->prepare('SELECT id, name, activities, created_at FROM activity_groups WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
} catch (Exception $e) {
    json_response(['error' => 'Database error'], 500);
}

if (!$row) {
    json_response(['error' => 'Group not found'], 404);
}

json_response([
    'id'         => $row['id'],
    'name'       => $row['name'],
    'activities' => json_decode($row['activities'], true),
    'created_at' => $row['created_at'],
]);
