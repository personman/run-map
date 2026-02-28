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

// Helper: redirect back to the SPA with an error message
function fail_redirect(string $msg): never {
    header('Location: ' . SITE_URL . '/?strava_error=' . urlencode($msg));
    exit;
}

try {
    // Validate CSRF state
    $state = $_GET['state'] ?? '';
    if (empty($_SESSION['strava_oauth_state']) || !hash_equals($_SESSION['strava_oauth_state'], $state)) {
        fail_redirect('Session expired. Please try connecting again.');
    }
    unset($_SESSION['strava_oauth_state']);

    // Check for errors from Strava
    if (isset($_GET['error'])) {
        fail_redirect($_GET['error']);
    }

    $code = $_GET['code'] ?? '';
    if (empty($code)) {
        fail_redirect('Missing authorization code.');
    }

    // Exchange code for tokens
    $ch = curl_init('https://www.strava.com/oauth/token');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'client_id'     => STRAVA_CLIENT_ID,
            'client_secret' => STRAVA_CLIENT_SECRET,
            'code'          => $code,
            'grant_type'    => 'authorization_code',
        ]),
    ]);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
        fail_redirect('Failed to connect with Strava. Please try again.');
    }

    $data = json_decode($response, true);
    $athlete = $data['athlete'];
    $athlete_id = (int) $athlete['id'];

    // Upsert token row
    $db = get_db();
    $stmt = $db->prepare(
        'INSERT INTO strava_tokens (athlete_id, access_token, refresh_token, expires_at, athlete_json)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           access_token  = VALUES(access_token),
           refresh_token = VALUES(refresh_token),
           expires_at    = VALUES(expires_at),
           athlete_json  = VALUES(athlete_json),
           updated_at    = NOW()'
    );
    $stmt->execute([
        $athlete_id,
        $data['access_token'],
        $data['refresh_token'],
        $data['expires_at'],
        json_encode($athlete),
    ]);

    $_SESSION['strava_athlete_id'] = $athlete_id;

    header('Location: ' . SITE_URL . '/?strava_connected=1');
    exit;
} catch (Throwable $e) {
    error_log('Strava callback error: ' . $e->getMessage());
    fail_redirect('Something went wrong. Please try again.');
}
