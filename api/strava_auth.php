<?php
require_once __DIR__ . '/config.php';

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => true,
    'httponly'  => true,
    'samesite' => 'Lax',
]);
session_start();

// Generate CSRF state token
$state = bin2hex(random_bytes(16));
$_SESSION['strava_oauth_state'] = $state;

$params = http_build_query([
    'client_id'     => STRAVA_CLIENT_ID,
    'redirect_uri'  => SITE_URL . '/api/strava_callback.php',
    'response_type' => 'code',
    'approval_prompt' => 'auto',
    'scope'         => 'activity:read_all',
    'state'         => $state,
]);

header('Location: https://www.strava.com/oauth/authorize?' . $params);
exit;
