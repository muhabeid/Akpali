import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export default function RetentionLedgerTab() {
  const { formatAmount } = useCurrency();
  const [data, setData] = useState({ kpis: {}, records: [] });
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [tenders, setTenders] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    tender_id: '',
    client_name: '',
    contract_reference: '',
    contract_value: '',
    retention_rate_pct: 10,
    dlp_tenor_months: 6,
    handover_date: new Date().toISOString().split('T')[0],
    notes: 'Statutory 10% contract defect liability retention'
  });

  const fetchRetention = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/finances/retention')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching retention ledger:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRetention();

    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(list => setTenders(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  const handleTenderSelect = (tenderId) => {
    const t = tenders.find(item => item.id === tenderId);
    if (t) {
      setForm(prev => ({
        ...prev,
        tender_id: t.id,
        client_name: t.client_name || t.client || 'Valued Client',
        contract_reference: t.client_reference || t.id,
        contract_value: t.contract_value || 0
      }));
    } else {
      setForm(prev => ({ ...prev, tender_id: tenderId }));
    }
  };

  const handleCreateRetention = async (e) => {
    e.preventDefault();
    if (!form.tender_id) {
      alert('Please select a project/tender.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/finances/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        alert('✅ Contract retention record created successfully!');
        setIsAddOpen(false);
        fetchRetention();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to save'}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimInvoice = async (record) => {
    if (!window.confirm(`Issue formal client retention release invoice for KES ${Number(record.retained_amount).toLocaleString()} on contract "${record.contract_reference}"?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/finances/retention/${record.id}/claim-invoice`, {
        method: 'POST'
      });
      const json = await res.json();
      if (res.ok) {
        alert(`🎉 ${json.message}`);
        fetchRetention();
      } else {
        alert(`Failed to issue claim invoice: ${json.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRelease = async (recordId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/finances/retention/${recordId}/release`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('✓ Retention marked as Released & Settled.');
        fetchRetention();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const kpis = data.kpis || {};
  const records = data.records || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* HEADER CARD */}
      <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              🛡️ Statutory Retention Money & Defect Liability Ledger
            </h2>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Tracks 5%–10% statutory retention held by clients, Defect Liability Period (DLP) maturity countdowns, and 1-click claim invoice generation.
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="btn btn-primary"
            style={{ fontWeight: 'bold', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            + Record Contract Retention
          </button>
        </div>

        {/* 4 SUMMARY METRIC TILES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <div className="card" style={{ padding: '1rem', background: '#0f172a', border: '1px solid #334155' }}>
            <span className="stat-label">Total Retained by Clients</span>
            <span className="stat-value" style={{ color: '#f59e0b' }}>{formatAmount(kpis.total_retained || 0)}</span>
          </div>

          <div className="card" style={{ padding: '1rem', background: '#0f172a', border: '1px solid #10b981' }}>
            <span className="stat-label">Due for Release (DLP Matured)</span>
            <span className="stat-value" style={{ color: '#10b981' }}>{formatAmount(kpis.total_due_for_release || 0)}</span>
          </div>

          <div className="card" style={{ padding: '1rem', background: '#0f172a', border: '1px solid #38bdf8' }}>
            <span className="stat-label">Invoices Claimed</span>
            <span className="stat-value" style={{ color: '#38bdf8' }}>{formatAmount(kpis.total_claimed || 0)}</span>
          </div>

          <div className="card" style={{ padding: '1rem', background: '#0f172a', border: '1px solid #64748b' }}>
            <span className="stat-label">Released & Settled</span>
            <span className="stat-value" style={{ color: '#cbd5e1' }}>{formatAmount(kpis.total_released || 0)}</span>
          </div>
        </div>
      </div>

      {/* RETENTION RECORDS TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Contract Retention Commitments ({records.length})</h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Contract / Project</th>
              <th style={{ padding: '0.75rem 1rem' }}>Client Name</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Contract Value</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Retained (5-10%)</th>
              <th style={{ padding: '0.75rem 1rem' }}>Handover / Release Due</th>
              <th style={{ padding: '0.75rem 1rem' }}>DLP Countdown</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading retention ledger...</td></tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  No retention records found. Click "+ Record Contract Retention" to track DLP countdowns.
                </td>
              </tr>
            ) : records.map((r, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ fontWeight: '700', color: '#38bdf8' }}>{r.tender_name || r.contract_reference}</div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {r.id}</span>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#fff', fontWeight: '500' }}>
                  {r.client_name}
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#e2e8f0' }}>
                  {formatAmount(r.contract_value)}
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '800', color: '#f59e0b' }}>
                  {formatAmount(r.retained_amount)}
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>({r.retention_rate_pct}%)</span>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                  <div>Due: <strong>{r.release_due_date ? new Date(r.release_due_date).toLocaleDateString() : 'N/A'}</strong></div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Handover: {r.handover_date}</span>
                </td>
                <td style={{ padding: '0.75rem 1rem', width: '160px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: r.days_remaining_dlp <= 0 ? '#10b981' : '#f59e0b', fontWeight: '700' }}>
                      {r.days_remaining_dlp <= 0 ? 'Matured / Due' : `${r.days_remaining_dlp} days left`}
                    </span>
                    <span style={{ color: '#94a3b8' }}>{r.dlp_progress_pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${r.dlp_progress_pct}%`, height: '100%', background: r.days_remaining_dlp <= 0 ? '#10b981' : '#f59e0b', borderRadius: '4px' }} />
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <span style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    background: r.status === 'Released' ? '#10b98122' : r.status === 'Claimed' ? '#38bdf822' : '#f59e0b22',
                    color: r.status === 'Released' ? '#10b981' : r.status === 'Claimed' ? '#38bdf8' : '#f59e0b',
                    border: `1px solid ${r.status === 'Released' ? '#10b981' : r.status === 'Claimed' ? '#38bdf8' : '#f59e0b'}44`
                  }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    {r.status === 'Retained' && (
                      <button
                        onClick={() => handleClaimInvoice(r)}
                        className="btn"
                        style={{
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.75rem',
                          background: r.is_due_for_release ? '#10b981' : '#38bdf8',
                          color: '#fff',
                          fontWeight: 'bold',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        title="Generate Claim Invoice"
                      >
                        ⚡ Claim Invoice
                      </button>
                    )}

                    {r.status === 'Claimed' && (
                      <button
                        onClick={() => handleRelease(r.id)}
                        className="btn"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', background: '#059669', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                        title="Mark as Received & Released"
                      >
                        ✓ Mark Settled
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RECORD RETENTION MODAL */}
      {isAddOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '16px',
            width: '95%',
            maxWidth: '650px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
            color: '#fff'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #334155', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Record Contract Retention & DLP</h3>
              <button onClick={() => setIsAddOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateRetention} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 'bold' }}>
                  Select Tender / Project Contract *
                </label>
                <select
                  className="form-control"
                  style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                  value={form.tender_id}
                  onChange={e => handleTenderSelect(e.target.value)}
                  required
                >
                  <option value="">-- Choose Project --</option>
                  {tenders.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({formatAmount(t.contract_value)})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 'bold' }}>
                    Client Legal Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                    value={form.client_name}
                    onChange={e => setForm({ ...form, client_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 'bold' }}>
                    Contract Value (KES)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                    value={form.contract_value}
                    onChange={e => setForm({ ...form, contract_value: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 'bold' }}>
                    Retention Rate (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="form-control"
                    style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                    value={form.retention_rate_pct}
                    onChange={e => setForm({ ...form, retention_rate_pct: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 'bold' }}>
                    DLP Tenor (Months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                    value={form.dlp_tenor_months}
                    onChange={e => setForm({ ...form, dlp_tenor_months: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 'bold' }}>
                  Practical Handover Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                  value={form.handover_date}
                  onChange={e => setForm({ ...form, handover_date: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsAddOpen(false)} className="btn" style={{ background: '#334155', color: '#fff' }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ fontWeight: 'bold' }}>
                  {submitting ? 'Saving...' : '💾 Save Retention'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
