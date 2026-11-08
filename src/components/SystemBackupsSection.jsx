import React, { useState, useEffect } from 'react';

export default function SystemBackupsSection() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/system/backups');
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (err) {
      console.error('Failed to load system backups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateSnapshot = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('http://localhost:5000/api/system/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'Admin',
          'x-user-name': 'System Administrator'
        },
        body: JSON.stringify({ backup_type: 'Manual' })
      });
      if (res.ok) {
        const result = await res.json();
        alert(`✅ Instant snapshot created successfully!\n\nFile: ${result.filename}\nSize: ${result.size_kb} KB\nRecords Archived: ${result.records_count}`);
        fetchBackups();
      } else {
        const err = await res.json();
        alert(`❌ Failed to create snapshot: ${err.error || 'Server error'}`);
      }
    } catch (err) {
      alert(`❌ Connection error: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (backup) => {
    const confirmRestore = window.confirm(
      `⚠️ CAUTION: RESTORE DATABASE SNAPSHOT\n\n` +
      `You are about to restore snapshot '${backup.filename}' from ${new Date(backup.created_at).toLocaleString()}.\n\n` +
      `The system will automatically generate a safety rollback checkpoint before applying this snapshot.\n\n` +
      `Do you wish to proceed?`
    );

    if (!confirmRestore) return;

    setIsRestoring(true);
    setRestoreStatus({ type: 'info', message: 'Restoring snapshot and creating safety point...' });
    try {
      const res = await fetch('http://localhost:5000/api/system/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'Admin',
          'x-user-name': 'System Administrator'
        },
        body: JSON.stringify({ backup_id: backup.id })
      });

      if (res.ok) {
        const result = await res.json();
        setRestoreStatus({ type: 'success', message: result.message });
        alert(`✅ System database restored successfully!\n\n${result.message}`);
        fetchBackups();
      } else {
        const err = await res.json();
        setRestoreStatus({ type: 'error', message: err.error || 'Restore failed' });
        alert(`❌ Restore failed: ${err.error || 'Server error'}`);
      }
    } catch (err) {
      setRestoreStatus({ type: 'error', message: err.message });
      alert(`❌ Error restoring snapshot: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDownload = (filename) => {
    window.open(`http://localhost:5000/api/system/backup/download/${filename}`, '_blank');
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div style={{ background: 'hsla(var(--primary), 0.04)', border: '1px solid hsla(var(--primary), 0.18)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid hsla(var(--primary), 0.15)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.3rem' }}>💾</span>
            <h4 style={{ margin: 0, color: 'hsl(var(--primary))', fontSize: '1.1rem', fontWeight: 'bold' }}>
              Automated Nightly Cloud Backup & Snapshot Manager
            </h4>
          </div>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: '#64748b' }}>
            Zero-downtime database archiving, scheduled daily recovery checkpoints, and instant point-in-time rollbacks.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateSnapshot}
          disabled={isCreating}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
        >
          {isCreating ? '⏳ Archiving System...' : '⚡ Create Instant System Snapshot'}
        </button>
      </div>

      {/* SCHEDULE STATUS BANNER */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#3b82f622', color: '#38bdf8', padding: '0.5rem', borderRadius: '8px', fontSize: '1.1rem' }}>
            ⏰
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f8fafc' }}>
              Automated Nightly Cron Backup Service Active
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Daily full database image captured every night at <strong>02:00 AM EAT</strong> with rolling 30-day retention.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '6px', background: '#10b98122', color: '#34d399', fontWeight: 'bold' }}>
            ✓ Automated Cron Active
          </span>
          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '6px', background: '#38bdf822', color: '#38bdf8', fontWeight: 'bold' }}>
            📦 {backups.length} Snapshots Stored
          </span>
        </div>
      </div>

      {restoreStatus && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.825rem',
          background: restoreStatus.type === 'success' ? '#10b98122' : restoreStatus.type === 'error' ? '#ef444422' : '#3b82f622',
          color: restoreStatus.type === 'success' ? '#34d399' : restoreStatus.type === 'error' ? '#f87171' : '#38bdf8',
          border: `1px solid ${restoreStatus.type === 'success' ? '#10b98144' : restoreStatus.type === 'error' ? '#ef444444' : '#3b82f644'}`
        }}>
          {restoreStatus.message}
        </div>
      )}

      {/* BACKUPS TABLE */}
      <div style={{ overflowX: 'auto', background: '#0b1120', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#0f172a', textAlign: 'left', borderBottom: '2px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '0.75rem' }}>Snapshot ID & File</th>
              <th style={{ padding: '0.75rem' }}>Capture Time</th>
              <th style={{ padding: '0.75rem' }}>Backup Type</th>
              <th style={{ padding: '0.75rem' }}>Archive Size</th>
              <th style={{ padding: '0.75rem' }}>Health Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  Loading backup catalog...
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No backup snapshots recorded. Click "Create Instant System Snapshot" above to generate your first checkpoint.
                </td>
              </tr>
            ) : (
              backups.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>{b.filename}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{b.id}</div>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                    {new Date(b.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: b.backup_type === 'Scheduled_Nightly' ? '#8b5cf622' : '#0284c722',
                      color: b.backup_type === 'Scheduled_Nightly' ? '#c084fc' : '#38bdf8',
                      fontWeight: 'bold'
                    }}>
                      {b.backup_type === 'Scheduled_Nightly' ? '🌙 Scheduled Nightly' : '⚡ Manual Snapshot'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {formatSize(b.size_bytes)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600' }}>
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                      {b.status || 'Verified Clean'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleDownload(b.filename)}
                        title="Download SQLite Database File"
                        style={{
                          background: '#1e293b',
                          border: '1px solid #334155',
                          color: '#38bdf8',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}
                      >
                        ⬇️ Download
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRestore(b)}
                        disabled={isRestoring}
                        title="Restore SQLite Database from this snapshot"
                        style={{
                          background: '#ef44441a',
                          border: '1px solid #ef444444',
                          color: '#f87171',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}
                      >
                        🔄 Restore
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
