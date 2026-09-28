import React, { useState } from 'react';
import Modal from './Modal';
import Select from './Select';
import Button from './Button';
import { ASSET_STATUSES } from '../config/labels';

export default function StatusChangeModal({ isOpen, onClose, asset, onConfirm, userRole }) {
  const [status, setStatus] = useState(asset?.status || '');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // When asset changes, reset form
  React.useEffect(() => {
    if (isOpen) {
      setStatus(asset?.status || '');
      setNote('');
      setError(null);
    }
  }, [isOpen, asset]);

  if (!isOpen || !asset) return null;

  const allowedStatuses = userRole === 'OFFICER' 
    ? ['ACTIVE', 'VACANT', 'UNDER_MAINTENANCE'] 
    : Object.keys(ASSET_STATUSES);

  const options = allowedStatuses.map(k => ({ value: k, label: ASSET_STATUSES[k] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === asset.status) {
      setError('Asset is already in this status');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm(asset.id, { status, note });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to change status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Asset Status">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <div className="alert alert-danger" style={{ backgroundColor: 'var(--color-status-red-bg)', color: 'var(--color-status-red)' }}>
            {error}
          </div>
        )}
        
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Current status: <strong style={{ color: 'var(--color-text-main)' }}>{ASSET_STATUSES[asset.status] || asset.status}</strong>
        </p>

        <Select
          id="status"
          label="New Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={options}
          required
        />

        <div className="form-group">
          <label htmlFor="note" className="form-label">Note (optional, up to 300 chars)</label>
          <textarea
            id="note"
            className="form-textarea"
            style={{ width: '100%', minHeight: '80px', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)', fontFamily: 'inherit' }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading || status === asset.status}>
            {loading ? 'Saving...' : 'Confirm'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
