import React, { useState, useRef } from 'react';
import { saveGroup } from '../services/api.js';

function SaveGroupModal({ activities, onClose }) {
  const [name, setName] = useState('');
  const [publicList, setPublicList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const urlInputRef = useRef(null);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const { url } = await saveGroup(trimmed, activities, publicList);
      setSavedUrl(window.location.origin + url);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(savedUrl);
    } catch {
      // Fallback for non-HTTPS or permission denied
      if (urlInputRef.current) {
        urlInputRef.current.select();
        document.execCommand('copy');
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Save Map</h2>

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
            <label className="modal-checkbox-label">
              <input
                type="checkbox"
                checked={publicList}
                onChange={(e) => setPublicList(e.target.checked)}
              />
              Include in public list
            </label>
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
            <p>Your map has been saved. Share this link:</p>
            <div className="saved-url-row">
              <input
                ref={urlInputRef}
                type="text"
                className="modal-input"
                readOnly
                value={savedUrl}
                onClick={(e) => e.target.select()}
              />
              <button onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
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
