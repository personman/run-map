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

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);

$method = $body['method'] ?? '';
$count = (int)($body['count'] ?? 0);
$total_miles = (float)($body['total_miles'] ?? 0);

if (!in_array($method, ['gpx', 'strava'], true) || $count <= 0) {
    json_response(['error' => 'Invalid parameters'], 400);
}

try {
    $db = get_db();
    $stmt = $db->prepare(
        'INSERT INTO import_logs (method, count, total_miles) VALUES (?, ?, ?)'
    );
    $stmt->execute([$method, $count, round($total_miles, 2)]);
} catch (Exception $e) {
    // Silently fail — logging must not block the user experience
    json_response(['ok' => false]);
}

json_response(['ok' => true]);
