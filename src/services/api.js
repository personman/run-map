const BASE = '/api';

export async function saveGroup(name, activities) {
  const res = await fetch(`${BASE}/save_group.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, activities }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json(); // { id, url }
}

export async function getGroup(id) {
  const res = await fetch(`${BASE}/get_group.php?id=${encodeURIComponent(id)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json(); // { id, name, activities, created_at }
}

export function stravaAuthUrl() {
  return `${BASE}/strava_auth.php`;
}

export async function getStravaActivities(page = 1) {
  const res = await fetch(`${BASE}/strava_activities.php?page=${page}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json(); // array of activity summaries
}

export async function fetchStravaGpx(activityId) {
  const res = await fetch(`${BASE}/strava_gpx.php?id=${encodeURIComponent(activityId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text(); // GPX XML string
}
