<?php
require_once __DIR__ . '/config.php';

function get_db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

function json_response(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function refresh_strava_token(int $athlete_id): string {
    $db = get_db();
    $stmt = $db->prepare('SELECT * FROM strava_tokens WHERE athlete_id = ?');
    $stmt->execute([$athlete_id]);
    $row = $stmt->fetch();

    if (!$row) {
        json_response(['error' => 'No Strava token found'], 401);
    }

    // Return current token if it still has 5+ minutes
    if ($row['expires_at'] - 300 > time()) {
        return $row['access_token'];
    }

    // Refresh expired token
    $ch = curl_init('https://www.strava.com/oauth/token');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'client_id'     => STRAVA_CLIENT_ID,
            'client_secret' => STRAVA_CLIENT_SECRET,
            'grant_type'    => 'refresh_token',
            'refresh_token' => $row['refresh_token'],
        ]),
    ]);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
        json_response(['error' => 'Failed to refresh Strava token'], 502);
    }

    $data = json_decode($response, true);

    $update = $db->prepare(
        'UPDATE strava_tokens SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = NOW()
         WHERE athlete_id = ?'
    );
    $update->execute([$data['access_token'], $data['refresh_token'], $data['expires_at'], $athlete_id]);

    return $data['access_token'];
}
