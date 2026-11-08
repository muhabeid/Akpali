import React, { useState, useEffect } from 'react';

export default function TenderConsortiumModal({ isOpen, onClose, tenderId, tenderName }) {
  if (!isOpen || !tenderId) return null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('partners'); // 'partners' | 'add' | 'agreement'
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [partnerForm, setPartnerForm] = useState({
    partner_name: '',
    partner_type: 'Technical Partner',
    kra_pin: '',
    registration_num: '',
    contact_person: '',
    email: '',
    phone: '',
    equity_share_pct: 30,
    scope_allocated: 'Civil engineering works, site equipment provision & specialized technical labor',
    agreement_status: 'Drafted'
  });

  const fetchConsortium = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/tenders/${tenderId}/consortium`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching consortium:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsortium();
  }, [tenderId]);

  const handleAddPartner = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/tenders/${tenderId}/consortium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerForm)
      });
      if (res.ok) {
        alert(`✅ Joint Venture partner "${partnerForm.partner_name}" registered!`);
        setPartnerForm({
          partner_name: '',
          partner_type: 'Technical Partner',
          kra_pin: '',
          registration_num: '',
          contact_person: '',
          email: '',
          phone: '',
          equity_share_pct: 20,
          scope_allocated: '',
          agreement_status: 'Drafted'
        });
        setActiveTab('partners');
        fetchConsortium();
      } else {
        const err = await res.json();
        alert(`Failed to add partner: ${err.error || 'Server error'}`);
      }
    } catch (err) {
      alert(`Error adding partner: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePartner = async (partnerId) => {
    if (!window.confirm('Are you sure you want to remove this partner from the consortium?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/tenders/${tenderId}/consortium/${partnerId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchConsortium();
      }
    } catch (err) {
      alert('Error removing partner');
    }
  };

  const handlePrintAgreement = () => {
    window.print();
  };

  const partners = data?.partners || [];
  const leadPartner = data?.lead_partner || { name: 'Akpali & Co.', equity_share_pct: 100 };

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
        maxWidth: '1000px',
        maxHeight: '92vh',
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
            <span style={{ fontSize: '1.5rem' }}>🤝</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
                Consortium & Joint Venture (JV) Partnership Module
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Manage partner equity split, shared deliverables, and JV agreements for: <strong style={{ color: '#e2e8f0' }}>{tenderName || tenderId}</strong>
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

        {/* TABS HEADER */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #334155',
          background: '#1e293b',
          padding: '0 1.75rem'
        }}>
          <button
            onClick={() => setActiveTab('partners')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'partners' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'partners' ? '#38bdf8' : '#94a3b8',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            👥 Consortium Structure ({partners.length + 1} Parties)
          </button>

          <button
            onClick={() => setActiveTab('add')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'add' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'add' ? '#38bdf8' : '#94a3b8',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            ➕ Add JV Partner
          </button>

          <button
            onClick={() => setActiveTab('agreement')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'agreement' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'agreement' ? '#38bdf8' : '#94a3b8',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            📄 Joint Venture Agreement
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <p>Loading consortium records...</p>
            </div>
          ) : activeTab === 'partners' ? (
            <div>
              {/* EQUITY SPLIT BAR */}
              <div style={{
                marginBottom: '1.5rem',
                padding: '1.25rem',
                borderRadius: '12px',
                background: '#1e293b',
                border: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e2e8f0' }}>Consortium Equity / Profit Allocation</span>
                  <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '700' }}>
                    Lead Partner: {leadPartner.equity_share_pct}% | JV Partners: {100 - leadPartner.equity_share_pct}%
                  </span>
                </div>

                <div style={{
                  width: '100%',
                  height: '20px',
                  borderRadius: '999px',
                  background: '#334155',
                  overflow: 'hidden',
                  display: 'flex'
                }}>
                  <div
                    style={{
                      width: `${leadPartner.equity_share_pct}%`,
                      background: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      color: '#fff'
                    }}
                    title={`Akpali & Co. (Lead): ${leadPartner.equity_share_pct}%`}
                  >
                    Akpali {leadPartner.equity_share_pct}%
                  </div>

                  {partners.map((p, idx) => {
                    const colors = ['#10b981', '#f59e0b', '#a855f7', '#ec4899'];
                    const color = colors[idx % colors.length];
                    return (
                      <div
                        key={p.id}
                        style={{
                          width: `${p.equity_share_pct}%`,
                          background: color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          color: '#fff'
                        }}
                        title={`${p.partner_name}: ${p.equity_share_pct}%`}
                      >
                        {p.equity_share_pct}%
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PARTNERS TABLE */}
              <div style={{ borderRadius: '10px', border: '1px solid #334155', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Partner Entity</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Role in Consortium</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Tax PIN</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Equity Share</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Allocated Scope</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* LEAD PARTNER ROW */}
                    <tr style={{ borderBottom: '1px solid #334155', background: 'rgba(59, 130, 246, 0.05)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: '700', color: '#38bdf8' }}>{leadPartner.name}</div>
                        <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#3b82f6', color: '#fff', fontWeight: '800' }}>
                          LEAD CONTRACTOR
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#e2e8f0' }}>Lead Bidder & Financial Sponsor</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{leadPartner.kra_pin}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '800', color: '#38bdf8' }}>
                        {leadPartner.equity_share_pct}%
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>Overall contract administration, procurement & treasury management</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b' }}>Primary</td>
                    </tr>

                    {/* JV PARTNER ROWS */}
                    {partners.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: '700', color: '#fff' }}>{p.partner_name}</div>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{p.contact_person} {p.phone && `(${p.phone})`}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#e2e8f0' }}>{p.partner_type}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{p.kra_pin || 'Pending'}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '800', color: '#10b981' }}>
                          {p.equity_share_pct}%
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>{p.scope_allocated || '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeletePartner(p.id)}
                            style={{
                              background: '#ef444422',
                              border: '1px solid #ef444444',
                              color: '#ef4444',
                              borderRadius: '6px',
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ACTION FOOTER */}
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={() => setActiveTab('agreement')}
                  className="btn btn-primary"
                  style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  📄 View / Print Joint Venture Agreement
                </button>
              </div>
            </div>
          ) : activeTab === 'add' ? (
            /* ADD PARTNER FORM */
            <form onSubmit={handleAddPartner} style={{ maxWidth: '750px', margin: '0 auto' }}>
              <div style={{
                background: '#1e293b',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
                  Register Consortium / Joint Venture Partner
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: '600' }}>
                      Partner Entity Legal Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                      placeholder="e.g. Apex Civil Works Ltd"
                      value={partnerForm.partner_name}
                      onChange={e => setPartnerForm({ ...partnerForm, partner_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: '600' }}>
                      Partner Role / Classification
                    </label>
                    <select
                      className="form-control"
                      style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                      value={partnerForm.partner_type}
                      onChange={e => setPartnerForm({ ...partnerForm, partner_type: e.target.value })}
                    >
                      <option value="Technical Partner">Technical Partner</option>
                      <option value="Financial Partner">Financial Partner</option>
                      <option value="Sub-Contractor Partner">Sub-Contractor Partner</option>
                      <option value="Joint Bidding Consortium Partner">Joint Bidding Consortium Partner</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: '600' }}>
                      Partner KRA PIN
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                      placeholder="e.g. P051987654K"
                      value={partnerForm.kra_pin}
                      onChange={e => setPartnerForm({ ...partnerForm, kra_pin: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: '600' }}>
                      Equity / Profit Share (%) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      className="form-control"
                      style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                      value={partnerForm.equity_share_pct}
                      onChange={e => setPartnerForm({ ...partnerForm, equity_share_pct: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: '600' }}>
                      Authorized Contact Person
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                      placeholder="e.g. Eng. Paul Otieno"
                      value={partnerForm.contact_person}
                      onChange={e => setPartnerForm({ ...partnerForm, contact_person: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: '600' }}>
                      Phone / Mobile
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                      placeholder="+254 700 000 000"
                      value={partnerForm.phone}
                      onChange={e => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: '600' }}>
                    Allocated Scope of Works / Deliverables *
                  </label>
                  <textarea
                    rows="3"
                    className="form-control"
                    style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                    value={partnerForm.scope_allocated}
                    onChange={e => setPartnerForm({ ...partnerForm, scope_allocated: e.target.value })}
                    placeholder="Describe specific engineering or supply scope assigned to this partner..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('partners')}
                    className="btn"
                    style={{ background: '#334155', color: '#fff' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ fontWeight: '700', padding: '0.6rem 1.5rem' }}
                  >
                    {submitting ? 'Registering...' : '🤝 Save Consortium Partner'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* TAB 3: PRINTABLE JOINT VENTURE AGREEMENT */
            <div style={{
              background: '#ffffff',
              color: '#0f172a',
              padding: '2.5rem',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              fontFamily: 'serif',
              lineHeight: 1.6
            }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Joint Venture Consortium Agreement
                </h1>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                  In accordance with the Public Procurement & Asset Disposal Act (PPADA Kenya 2015)
                </p>
              </div>

              <p style={{ fontSize: '0.95rem' }}>
                THIS AGREEMENT is entered into on this <strong>{new Date().toLocaleDateString('en-GB')}</strong>, BY AND BETWEEN:
              </p>

              <ol style={{ paddingLeft: '1.5rem', fontSize: '0.95rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>{leadPartner.name}</strong> (hereinafter referred to as the <em>"Lead Partner"</em>), having its registered offices at Nairobi, Kenya (Tax PIN: {leadPartner.kra_pin}); AND
                </li>
                {partners.map((p, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                    <strong>{p.partner_name}</strong> (hereinafter referred to as <em>"{p.partner_type}"</em>), having its registered address at Nairobi, Kenya (Tax PIN: {p.kra_pin || 'Pending'}).
                  </li>
                ))}
              </ol>

              <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.25rem' }}>
                1. RECITALS & PURPOSE OF JOINT VENTURE
              </h3>
              <p style={{ fontSize: '0.9rem' }}>
                The Parties have agreed to pool their technical, financial, and organizational capabilities as a unified bidding consortium for the purpose of executing the contract: <strong>{tenderName || tenderId}</strong>.
              </p>

              <h3 style={{ fontSize: '1.1rem', marginTop: '1.25rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.25rem' }}>
                2. EQUITY & PROFIT DISTRIBUTION RATIO
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', margin: '0.75rem 0' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Party Legal Name</th>
                    <th style={{ padding: '0.5rem' }}>Role</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Equity & Revenue Split (%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem' }}>{leadPartner.name}</td>
                    <td style={{ padding: '0.5rem' }}>Lead Partner & Administrative Lead</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{leadPartner.equity_share_pct}%</td>
                  </tr>
                  {partners.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.5rem' }}>{p.partner_name}</td>
                      <td style={{ padding: '0.5rem' }}>{p.partner_type}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{p.equity_share_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ fontSize: '1.1rem', marginTop: '1.25rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.25rem' }}>
                3. JOINT & SEVERAL LIABILITY
              </h3>
              <p style={{ fontSize: '0.85rem' }}>
                The Parties explicitly covenant that each entity shall be jointly and severally liable to the Procuring Entity for all obligations arising out of the performance and execution of the Tender Contract in strict compliance with the laws of Kenya.
              </p>

              {/* SIGNATURE BLOCK */}
              <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div style={{ borderTop: '1px solid #0f172a', paddingTop: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Signed for & on behalf of Lead Partner:</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>{leadPartner.name}</div>
                  <div style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}>Authorized Signatory: _____________________</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Common Corporate Seal</div>
                </div>

                <div style={{ borderTop: '1px solid #0f172a', paddingTop: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Signed for & on behalf of Consortium Partners:</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>{partners[0]?.partner_name || 'Partner Entity'}</div>
                  <div style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}>Authorized Signatory: _____________________</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Common Corporate Seal</div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button
                  onClick={handlePrintAgreement}
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🖨️ Print Official JV Agreement
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
