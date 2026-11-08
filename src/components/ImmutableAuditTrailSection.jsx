import React, { useState, useEffect } from 'react';

export default function ImmutableAuditTrailSection() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedRole && selectedRole !== 'ALL') params.append('user_role', selectedRole);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`http://localhost:5000/api/audit-logs/query?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
        setTotalCount(json.total || 0);
      }
    } catch (err) {
      console.error('Error fetching audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedRole, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportCSV = () => {
    window.open('http://localhost:5000/api/audit-logs/export-csv', '_blank');
  };

  return (
    <div style={{ background: 'hsla(var(--primary), 0.04)', border: '1px solid hsla(var(--primary), 0.18)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid hsla(var(--primary), 0.15)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🛡️</span>
            <h4 style={{ margin: 0, color: 'hsl(var(--primary))', fontSize: '1.1rem', fontWeight: 'bold' }}>
              Immutable System Audit Trail & Tamper-Proof Activity Log
            </h4>
          </div>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: '#64748b' }}>
            Permanent forensic logging of user identities, role access, mutations, IP addresses, and timestamps.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '10px', background: '#38bdf822', color: '#38bdf8', fontWeight: '700' }}>
            {totalCount} Total Audit Records
          </span>

          <button
            onClick={handleExportCSV}
            className="btn btn-primary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            📥 Export Audit Log (CSV)
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem', fontWeight: '600' }}>Search Keywords</label>
          <input
            type="text"
            className="form-control"
            style={{ fontSize: '0.8rem', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
            placeholder="Search action, user, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem', fontWeight: '600' }}>Filter by Role</label>
          <select
            className="form-control"
            style={{ fontSize: '0.8rem', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="Admin">Executive Administrator</option>
            <option value="Operations">Operations Manager</option>
            <option value="Procurement_Finance">Procurement & Finance</option>
            <option value="Procurement_Officer">Procurement Officer</option>
            <option value="Finance_Officer">Finance Officer</option>
            <option value="Site_Engineer">Site Engineer</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem', fontWeight: '600' }}>Date From</label>
          <input
            type="date"
            className="form-control"
            style={{ fontSize: '0.8rem', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem', fontWeight: '600' }}>Date To</label>
          <input
            type="date"
            className="form-control"
            style={{ fontSize: '0.8rem', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
      </form>

      {/* AUDIT LOGS TABLE */}
      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #334155' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: '#0f172a', textAlign: 'left', borderBottom: '2px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '0.6rem 0.8rem', width: '150px' }}>Timestamp</th>
              <th style={{ padding: '0.6rem 0.8rem' }}>User & Role</th>
              <th style={{ padding: '0.6rem 0.8rem' }}>Action Taken</th>
              <th style={{ padding: '0.6rem 0.8rem' }}>Entity</th>
              <th style={{ padding: '0.6rem 0.8rem' }}>Event Details</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading forensic audit trail...</td></tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No audit records match the specified filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '0.6rem 0.8rem', color: '#94a3b8' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString('en-GB') : '—'}
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem' }}>
                    <div style={{ fontWeight: '700', color: '#f8fafc' }}>{log.user_name || 'System User'}</div>
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>{log.user_role}</span>
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem', fontWeight: '600', color: '#fff' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#334155', color: '#38bdf8' }}>
                      {log.entity_type || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1', maxWidth: '350px', wordBreak: 'break-word' }}>
                    {log.details || '—'}
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', color: '#64748b', fontFamily: 'monospace' }}>
                    {log.ip_address || '127.0.0.1'}
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
