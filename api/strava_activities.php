<?php
require_once __DIR__ . '/db.php';

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => true,
    'httponly'  => true,
    'samesite' => 'Lax',
]);
session_start();

$athlete_id = $_SESSION['strava_athlete_id'] ?? null;
if (!$athlete_id) {
    json_response(['error' => 'Not authenticated'], 401);
}

try {
    $page = max(1, (int) ($_GET['page'] ?? 1));

    $access_token = refresh_strava_token((int) $athlete_id);

    $ch = curl_init(
        'https://www.strava.com/api/v3/athlete/activities?per_page=50&page=' . $page
    );
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $access_token],
    ]);
    $response  = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
        json_response(['error' => 'Failed to fetch activities from Strava'], 502);
    }

    $all = json_decode($response, true);
    if (!is_array($all)) {
        json_response(['error' => 'Unexpected response from Strava'], 502);
    }

    // Exclude activity types that don't have GPS routes
    $no_map_types = ['WeightTraining', 'Yoga', 'Workout', 'Swim'];
    $runs = array_values(array_filter($all, fn($a) => !in_array($a['type'] ?? '', $no_map_types)));

    $result = array_map(fn($a) => [
        'id'           => $a['id'],
        'name'         => $a['name'] ?? 'Untitled',
        'type'         => $a['type'] ?? '',
        'start_date'   => $a['start_date'] ?? '',
        'distance'     => $a['distance'] ?? 0,
        'elapsed_time' => $a['elapsed_time'] ?? 0,
    ], $runs);

    json_response($result);
} catch (Throwable $e) {
    error_log('strava_activities error: ' . $e->getMessage());
    json_response(['error' => 'Failed to load activities. Please try again.'], 500);
}
