<?php
require_once __DIR__ . '/db.php';

session_start();

$athlete_id = $_SESSION['strava_athlete_id'] ?? null;
if (!$athlete_id) {
    http_response_code(401);
    echo 'Not authenticated';
    exit;
}

$activity_id = (int) ($_GET['id'] ?? 0);
if (!$activity_id) {
    http_response_code(400);
    echo 'Missing activity id';
    exit;
}

$access_token = refresh_strava_token((int) $athlete_id);

$url = 'https://www.strava.com/api/v3/activities/' . $activity_id
     . '/streams?keys=latlng,time,altitude&key_by_type=true';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $access_token],
]);
$response  = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 200) {
    http_response_code(502);
    echo 'Failed to fetch streams from Strava';
    exit;
}

$streams = json_decode($response, true);

$latlng   = $streams['latlng']['data']   ?? [];
$times    = $streams['time']['data']     ?? [];
$altitude = $streams['altitude']['data'] ?? [];

if (empty($latlng)) {
    http_response_code(404);
    echo 'No GPS data for this activity';
    exit;
}

// Fetch the activity metadata to get name + start time
$ch2 = curl_init('https://www.strava.com/api/v3/activities/' . $activity_id);
curl_setopt_array($ch2, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $access_token],
]);
$meta_resp = curl_exec($ch2);
$meta_code = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);

$activity_name = 'Strava Run';
$start_ts      = time();

if ($meta_code === 200) {
    $meta           = json_decode($meta_resp, true);
    $activity_name  = htmlspecialchars($meta['name'] ?? 'Strava Run', ENT_XML1);
    $start_ts       = strtotime($meta['start_date'] ?? 'now');
}

// Build GPX XML
$lines   = [];
$lines[] = '<?xml version="1.0" encoding="UTF-8"?>';
$lines[] = '<gpx version="1.1" creator="run-map" xmlns="http://www.topografix.com/GPX/1/1">';
$lines[] = '  <trk>';
$lines[] = '    <name>' . $activity_name . '</name>';
$lines[] = '    <trkseg>';

foreach ($latlng as $i => [$lat, $lng]) {
    $ele  = isset($altitude[$i]) ? number_format((float) $altitude[$i], 1, '.', '') : '0.0';
    $secs = (int) ($times[$i] ?? 0);
    $iso  = gmdate('Y-m-d\TH:i:s\Z', $start_ts + $secs);
    $lines[] = sprintf(
        '      <trkpt lat="%.7f" lon="%.7f"><ele>%s</ele><time>%s</time></trkpt>',
        $lat, $lng, $ele, $iso
    );
}

$lines[] = '    </trkseg>';
$lines[] = '  </trk>';
$lines[] = '</gpx>';

header('Content-Type: text/xml; charset=UTF-8');
echo implode("\n", $lines);
