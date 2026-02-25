import { useState, useEffect } from 'react';
import { getGroup } from '../services/api.js';

const GROUP_PATH_RE = /^\/group\/([a-f0-9]{12})$/;

export function useGroupLoader(onActivitiesLoaded) {
  const [groupId, setGroupId] = useState(null);
  const [groupName, setGroupName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const match = window.location.pathname.match(GROUP_PATH_RE);
    if (!match) return;

    const id = match[1];
    setGroupId(id);
    setLoading(true);

    getGroup(id)
      .then((data) => {
        setGroupName(data.name);
        onActivitiesLoaded(data.activities);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { groupId, groupName, loading, error };
}
