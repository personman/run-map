<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');

echo json_encode([
    'mapbox' => [
        'accessToken'   => MAPBOX_TOKEN,
        'style'         => MAPBOX_STYLE,
        'defaultCenter' => [MAPBOX_DEFAULT_CENTER_LNG, MAPBOX_DEFAULT_CENTER_LAT],
        'defaultZoom'   => MAPBOX_DEFAULT_ZOOM,
    ],
]);
