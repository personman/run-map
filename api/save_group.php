<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

// Limit payload size to 8MB
$raw = file_get_contents('php://input', false, null, 0, 8 * 1024 * 1024 + 1);
if (strlen($raw) > 8 * 1024 * 1024) {
    json_response(['error' => 'Payload too large (max 8MB)'], 413);
}

$body = json_decode($raw, true);
if (!is_array($body)) {
    json_response(['error' => 'Invalid JSON'], 400);
}

$name = trim($body['name'] ?? '');
if ($name === '' || mb_strlen($name) > 255) {
    json_response(['error' => 'Name is required and must be ≤255 characters'], 400);
}

$activities = $body['activities'] ?? null;
if (!is_array($activities) || count($activities) === 0) {
    json_response(['error' => 'activities must be a non-empty array'], 400);
}

$activitiesJson = json_encode($activities);

// Generate 12-char hex ID
$id = bin2hex(random_bytes(6));

try {
    $db = get_db();
    $stmt = $db->prepare(
        'INSERT INTO activity_groups (id, name, activities) VALUES (?, ?, ?)'
    );
    $stmt->execute([$id, $name, $activitiesJson]);
} catch (Exception $e) {
    json_response(['error' => 'Database error'], 500);
}

json_response([
    'id'  => $id,
    'url' => '/group/' . $id,
]);
