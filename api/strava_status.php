<?php
require_once __DIR__ . '/db.php';

session_start();

json_response(['connected' => isset($_SESSION['strava_athlete_id'])]);
