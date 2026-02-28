import { useState, useEffect } from 'react';
import { stravaAuthUrl, getStravaStatus, getStravaActivities, fetchStravaGpx, logImport } from '../services/api';
import { parseGpxText } from '../utils/gpxParser';

function formatDistance(meters) {
  const miles = meters / 1609.344;
  return miles.toFixed(2) + ' mi';
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function StravaConnect({ onActivitiesImported }) {
  // checking | idle | ready | loading | picker | importing | done
  const [phase, setPhase] = useState('checking');
  const [activities, setActivities] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.has('strava_error')) {
      const msg = params.get('strava_error');
      window.history.replaceState({}, '', window.location.pathname);
      setError(msg);
      setPhase('idle');
      return;
    }

    if (params.has('strava_connected')) {
      // Just finished OAuth — clean URL and load activities
      window.history.replaceState({}, '', window.location.pathname);
      setPhase('loading');
      getStravaActivities(1)
        .then(data => {
          setActivities(data);
          setPage(1);
          setHasMore(data.length === 50);
          setPhase('picker');
        })
        .catch(err => {
          setError(err.message);
          setPhase('idle');
        });
      return;
    }

    // Check if already authenticated
    getStravaStatus()
      .then(({ connected }) => setPhase(connected ? 'ready' : 'idle'))
      .catch(() => setPhase('idle'));
  }, []);

  function fetchActivities() {
    setPhase('loading');
    getStravaActivities(1)
      .then(data => {
        setActivities(data);
        setPage(1);
        setHasMore(data.length === 50);
        setPhase('picker');
      })
      .catch(err => {
        setError(err.message);
        setPhase('ready');
      });
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === activities.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(activities.map(a => a.id)));
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getStravaActivities(nextPage);
      setActivities(prev => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleImport() {
    const ids = [...selected];
    if (ids.length === 0) return;

    setPhase('importing');
    setProgress({ done: 0, total: ids.length });

    const parsed = [];
    for (let i = 0; i < ids.length; i++) {
      try {
        const gpxText = await fetchStravaGpx(ids[i]);
        const activity = parseGpxText(gpxText, `strava-${ids[i]}`);
        if (activity) parsed.push(activity);
      } catch (err) {
        console.error(`Failed to import activity ${ids[i]}:`, err);
      }
      setProgress({ done: i + 1, total: ids.length });
    }

    if (parsed.length > 0) {
      const totalMiles = parsed.reduce((s, a) => s + parseFloat(a.distance || 0), 0);
      logImport('strava', parsed.length, totalMiles);
      onActivitiesImported(parsed);
    }
    setPhase('done');
  }

  if (phase === 'checking') {
    return null;
  }

  if (phase === 'idle') {
    return (
      <div className="strava-connect">
        {error && <p className="strava-error">{error}</p>}
        <a href={stravaAuthUrl()} className="strava-connect-btn">
          Connect with Strava
        </a>
      </div>
    );
  }

  if (phase === 'ready') {
    return (
      <div className="strava-connect">
        {error && <p className="strava-error">{error}</p>}
        <button onClick={fetchActivities}>Load Strava activities</button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="strava-connect">
        <span className="strava-spinner">Loading Strava activities…</span>
      </div>
    );
  }

  if (phase === 'importing') {
    return (
      <div className="strava-connect">
        <span className="strava-spinner">
          Importing {progress.done}/{progress.total}…
        </span>
      </div>
    );
  }

  if (phase === 'done') {
    return null;
  }

  // picker
  const allSelected = activities.length > 0 && selected.size === activities.length;

  return (
    <div className="strava-connect strava-picker">
      {error && <p className="strava-error">{error}</p>}
      <div className="strava-picker-header">
        <span className="strava-picker-title">Strava activities</span>
        <button className="strava-select-all" onClick={toggleAll}>
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>
      <ul className="strava-activity-list">
        {activities.map(a => (
          <li key={a.id} className="strava-activity-row">
            <label>
              <input
                type="checkbox"
                checked={selected.has(a.id)}
                onChange={() => toggleSelect(a.id)}
              />
              <span className="strava-activity-name">{a.name}</span>
              <span className="strava-activity-meta">
                {formatDate(a.start_date)} · {formatDistance(a.distance)}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          className="strava-load-more"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
      <button
        className="strava-import-btn"
        onClick={handleImport}
        disabled={selected.size === 0}
      >
        Import {selected.size > 0 ? `${selected.size} ` : ''}activit{selected.size !== 1 ? 'ies' : 'y'}
      </button>
    </div>
  );
}
