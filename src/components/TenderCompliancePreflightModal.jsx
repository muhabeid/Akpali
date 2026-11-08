import React, { useState, useEffect } from 'react';

export default function TenderCompliancePreflightModal({ isOpen, onClose, tenderId, tenderName }) {
  if (!isOpen || !tenderId) return null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/tenders/${tenderId}/compliance-preflight`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching compliance preflight:', err);
        setLoading(false);
      });
  }, [tenderId]);

  return (
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
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        overflow: 'hidden',
        color: '#f8fafc'
      }}>
        {/* MODAL HEADER */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #334155',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>
                Pre-Submission Compliance & Document Expiry Guard
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Automated pre-flight bid audit for Tender: <strong style={{ color: '#e2e8f0' }}>{tenderName || tenderId}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#1e293b',
              border: '1px solid #475569',
              color: '#94a3b8',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.1rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              <p>Auditing active statutory certificates and expiry dates...</p>
            </div>
          ) : data ? (
            <div>
              {/* READINESS SCORE BANNER */}
              <div style={{
                marginBottom: '1.5rem',
                padding: '1.25rem',
                borderRadius: '12px',
                background: data.is_submission_ready 
                  ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)' 
                  : 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
                border: `1px solid ${data.is_submission_ready ? '#10b981' : '#ef4444'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: data.is_submission_ready ? '#10b981' : '#ef4444',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: '900',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}>
                    {data.readiness_pct}%
                  </div>

                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: data.is_submission_ready ? '#10b981' : '#ef4444',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {data.is_submission_ready ? 'Pre-Flight Clearance Status' : 'Submission Risk Detected'}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginTop: '0.2rem' }}>
                      {data.recommendation}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Expired Documents: <strong style={{ color: '#ef4444' }}>{data.expired_count}</strong></div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Missing Mandatory: <strong style={{ color: '#f59e0b' }}>{data.missing_count}</strong></div>
                </div>
              </div>

              {/* STATUTORY CHECKLIST TABLE */}
              <div style={{ borderRadius: '10px', border: '1px solid #334155', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Mandatory Tender Credential</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Issuing Authority</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Expiry Date</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Time Remaining</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Compliance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.checklist.map((item, idx) => {
                      let badgeBg = '#10b98122';
                      let badgeText = '#10b981';
                      let label = 'VALID';

                      if (item.status === 'EXPIRED') {
                        badgeBg = '#ef444422';
                        badgeText = '#ef4444';
                        label = 'EXPIRED';
                      } else if (item.status === 'EXPIRING_SOON') {
                        badgeBg = '#f59e0b22';
                        badgeText = '#f59e0b';
                        label = 'EXPIRING SOON';
                      } else if (item.status === 'MISSING') {
                        badgeBg = '#64748b22';
                        badgeText = '#94a3b8';
                        label = item.mandatory ? 'MISSING (MANDATORY)' : 'NOT PROVIDED';
                      }

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#0f172a' : '#1e293b33' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#fff' }}>
                            {item.title}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                            {item.authority}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: item.expiry_date ? '#e2e8f0' : '#64748b' }}>
                            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'Perpetual / Not Set'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {item.days_until_expiry !== null ? (
                              item.days_until_expiry < 0 ? (
                                <span style={{ color: '#ef4444', fontWeight: '700' }}>Expired {Math.abs(item.days_until_expiry)} days ago</span>
                              ) : (
                                <span style={{ color: item.days_until_expiry <= 30 ? '#f59e0b' : '#10b981', fontWeight: '700' }}>
                                  {item.days_until_expiry} days remaining
                                </span>
                              )
                            ) : (
                              <span style={{ color: '#64748b' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <span style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: '800',
                              background: badgeBg,
                              color: badgeText,
                              border: `1px solid ${badgeText}44`
                            }}>
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* FOOTER NOTICE */}
              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  ℹ️ Public Procurement & Disposal Act (PPADA Kenya 2015) mandates active non-expired certificates upon bid opening.
                </span>

                <button
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ fontWeight: '700', padding: '0.5rem 1.25rem' }}
                >
                  ✓ Close Audit
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
