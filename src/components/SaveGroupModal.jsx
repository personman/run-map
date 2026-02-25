import React, { useState } from 'react';
import { saveGroup } from '../services/api.js';

function SaveGroupModal({ activities, onClose }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const { url } = await saveGroup(trimmed, activities);
      setSavedUrl(window.location.origin + url);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(savedUrl).catch(() => {});
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Save Group</h2>

        {!savedUrl ? (
          <>
            <p>Give this collection of {activities.length} activities a name to share it via a public link.</p>
            <input
              type="text"
              className="modal-input"
              placeholder="e.g. Spring 2024 runs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              maxLength={255}
              autoFocus
            />
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-buttons">
              <button onClick={handleSave} disabled={saving || !name.trim()}>
                {saving ? 'Saving…' : 'Save & get link'}
              </button>
              <button onClick={onClose} className="button-secondary">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p>Your group has been saved. Share this link:</p>
            <div className="saved-url-row">
              <input
                type="text"
                className="modal-input"
                readOnly
                value={savedUrl}
                onClick={(e) => e.target.select()}
              />
              <button onClick={handleCopy}>Copy</button>
            </div>
            <div className="modal-buttons">
              <button onClick={onClose}>Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SaveGroupModal;
