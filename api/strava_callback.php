<?php
require_once __DIR__ . '/db.php';

session_start();

// Validate CSRF state
$state = $_GET['state'] ?? '';
if (empty($_SESSION['strava_oauth_state']) || !hash_equals($_SESSION['strava_oauth_state'], $state)) {
    http_response_code(400);
    echo 'Invalid state parameter.';
    exit;
}
unset($_SESSION['strava_oauth_state']);

// Check for errors from Strava
if (isset($_GET['error'])) {
    header('Location: ' . SITE_URL . '/?strava_error=' . urlencode($_GET['error']));
    exit;
}

$code = $_GET['code'] ?? '';
if (empty($code)) {
    http_response_code(400);
    echo 'Missing authorization code.';
    exit;
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
    http_response_code(502);
    echo 'Failed to exchange token with Strava.';
    exit;
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
