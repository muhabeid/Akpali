import React, { useState, useEffect } from 'react'
import { printElement } from '../utils/printHelper'
import { useCurrency } from '../context/CurrencyContext'

export default function Tenders({ setGlobalDrawer }) {
  const { formatAmount } = useCurrency()
  const [selectedTender, setSelectedTender] = useState(null)
  const [expandedDeliverable, setExpandedDeliverable] = useState(null)
  const [expandedLPO, setExpandedLPO] = useState(null)
  const [expandedSQ, setExpandedSQ] = useState(null)
  const [tenders, setTenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)
  const [companyProfile, setCompanyProfile] = useState(null)

  useEffect(() => {
    fetch('http://localhost:5000/api/company-profile')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setCompanyProfile(data)
      })
      .catch(err => console.error('Company profile error:', err))
  }, [])

  const renderItems = (itemsString) => {
    if (!itemsString) return <span style={{ color: 'hsl(var(--text-secondary))' }}>No items listed.</span>;
    try {
      const items = typeof itemsString === 'string' ? JSON.parse(itemsString) : itemsString;
      if (!Array.isArray(items)) throw new Error('Not an array');
      if (items.length === 0) return <span style={{ color: 'hsl(var(--text-secondary))' }}>No items listed.</span>;
      
      return (
        <div style={{ padding: '1rem', background: 'hsla(var(--border), 0.1)', borderLeft: '4px solid hsl(var(--primary))' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', textTransform: 'uppercase', color: 'hsl(var(--text-secondary))' }}>Document Contents</h4>
          
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: 'hsla(var(--border), 0.2)', borderBottom: '2px solid hsl(var(--border))', fontWeight: 'bold', fontSize: '0.875rem' }}>
              <div style={{ padding: '0.75rem' }}>Description</div>
              <div style={{ padding: '0.75rem' }}>Quantity</div>
              <div style={{ padding: '0.75rem' }}>Details (Price/Unit)</div>
            </div>
            
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: idx === items.length - 1 ? 'none' : '1px solid hsl(var(--border))', fontSize: '0.875rem' }}>
                <div style={{ padding: '0.75rem' }}>{item.desc || item.description || item.name || '-'}</div>
                <div style={{ padding: '0.75rem' }}>{item.qty || item.quantity || 1}</div>
                <div style={{ padding: '0.75rem' }}>
                  {item.unitPrice !== undefined ? `$${Number(item.unitPrice).toLocaleString()}` : (item.unit || '-')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    } catch(e) {
      return (
        <div style={{ padding: '1rem', background: 'hsla(var(--border), 0.2)', borderLeft: '4px solid hsl(var(--danger))' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', textTransform: 'uppercase', color: 'hsl(var(--danger))' }}>Raw Contents</h4>
          <pre style={{ fontSize: '0.875rem', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {typeof itemsString === 'object' ? JSON.stringify(itemsString, null, 2) : String(itemsString)}
          </pre>
        </div>
      );
    }
  }

  useEffect(() => {
    fetch('http://localhost:5000/api/tenders')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setTenders(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch tenders:', err)
        setLoading(false)
      })
  }, [])

  if (selectedTender) {
    const currentDeliverables = selectedTender.deliverables || [];
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button className="btn" onClick={() => setSelectedTender(null)} style={{ background: 'hsla(var(--text-secondary), 0.2)', color: 'hsl(var(--text-primary))', marginBottom: '1rem' }}>
              ← Back to Tenders
            </button>
            <h2>{selectedTender.name}</h2>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>
              {selectedTender.id} {selectedTender.client_reference ? <span style={{ color: 'hsl(var(--primary))' }}>(Ref: {selectedTender.client_reference})</span> : ''} | Client: {selectedTender.client}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="badge badge-success">{selectedTender.status}</div>
            <a href={`http://localhost:5000/api/tenders/${selectedTender.id}/archive`} className="btn" style={{ background: 'hsla(var(--primary), 0.2)', color: 'hsl(var(--primary))', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
              📦 Download Archive (.zip)
            </a>
          </div>
        </div>


        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="card stat-card">
            <span className="stat-label">Contract Value</span>
            <span className="stat-value">{formatAmount(selectedTender.contract_value)}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Committed Costs (POs) + Actual</span>
            <span className="stat-value" style={{ color: 'hsl(var(--danger))' }}>{formatAmount(selectedTender.total_cost || 0)}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value" style={{ color: 'hsl(var(--success))' }}>{formatAmount(selectedTender.total_revenue || 0)}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Project Profit</span>
            <span className="stat-value" style={{ color: 'hsl(var(--warning))' }}>{formatAmount(selectedTender.profit || 0)}</span>
          </div>
        </div>

        {/* LINKED DOCUMENTS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem', background: 'hsla(var(--primary), 0.1)', borderBottom: '1px solid hsl(var(--border))' }}>
                <h4 style={{ margin: 0, color: 'hsl(var(--primary))' }}>Sales Quotes (Outbound)</h4>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <tbody>
                  {!selectedTender.sales_quotes || selectedTender.sales_quotes.length === 0 ? (
                    <tr><td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>No Quotes sent yet.</td></tr>
                  ) : selectedTender.sales_quotes.map(sq => (
                    <React.Fragment key={sq.id}>
                      <tr style={{ borderBottom: expandedSQ === sq.id ? 'none' : '1px solid hsl(var(--border))', cursor: 'pointer' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }} onClick={() => setExpandedSQ(expandedSQ === sq.id ? null : sq.id)}>{sq.id}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'hsl(var(--text-secondary))' }} onClick={() => setExpandedSQ(expandedSQ === sq.id ? null : sq.id)}>{sq.issue_date}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ color: 'hsl(var(--primary))', marginRight: '0.5rem' }}>${Number(sq.total_value).toLocaleString()}</span>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className="btn" onClick={(e) => { e.stopPropagation(); setExpandedSQ(sq.id); printElement('.print-only', 'SQ'); }} style={{ background: 'hsla(var(--text-secondary), 0.1)', color: 'hsl(var(--text-primary))', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} title="Print / Save PDF">🖨️</button>
                            <button className="btn" onClick={(e) => { e.stopPropagation(); alert('Dispatching Quote via Email...'); }} style={{ background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} title="Email Quote">📧</button>
                            <button className="btn" onClick={(e) => { e.stopPropagation(); alert('Dispatching Quote via WhatsApp...'); }} style={{ background: 'hsla(var(--success), 0.1)', color: 'hsl(var(--success))', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} title="WhatsApp Quote">💬</button>
                          </div>
                        </td>
                      </tr>
                      {expandedSQ === sq.id && (
                        <tr style={{ borderBottom: '1px solid hsl(var(--border))', background: 'var(--bg-app)' }}>
                          <td colSpan="3" style={{ padding: '1rem' }}>
                            <div className="print-only" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                              {/* SINGLE UNIFIED HEADER BANNER */}
                              <div style={{ borderBottom: '2px solid #cbd5e1', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                {/* CENTERED LOGO & COMPANY DETAILS */}
                                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', marginBottom: '0.85rem' }}>
                                  <img 
                                    src={companyProfile?.logo_url || '/logo.png'} 
                                    alt="Company Logo" 
                                    style={{ height: '140px', maxWidth: '320px', objectFit: 'contain' }} 
                                    onError={(e) => e.target.style.display = 'none'} 
                                  />
                                  <h2 style={{ margin: '0.3rem 0 0 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                    {companyProfile?.legal_name || companyProfile?.trading_name || 'AKPALI COMPANY LIMITED'}
                                  </h2>
                                  <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>
                                    <div>{companyProfile?.postal_address || companyProfile?.address || 'Auto Bazaar, #001, Nairobi, Kenya'}</div>
                                    <div style={{ fontWeight: '500' }}>
                                      Tel: {companyProfile?.phone || '+254705365996'} &bull; Email: {companyProfile?.email || 'info@akpalimited.co.ke'}
                                    </div>
                                  </div>
                                </div>

                                {/* BOTTOM HEADER BAR: DOCUMENT TITLE (LEFT) + DOC REF & DATE (FAR RIGHT) */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                  <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    OFFICIAL SALES QUOTATION
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#334155', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    <span><strong>Doc Ref #:</strong> {sq.id}</span>
                                    <span style={{ margin: '0 0.5rem', color: '#94a3b8' }}>|</span>
                                    <span><strong>Date Generated:</strong> {sq.issue_date || new Date().toISOString().split('T')[0]}</span>
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                <div>
                                  <p style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--text-secondary))' }}>Tender / Project</p>
                                  <strong style={{ fontSize: '1rem' }}>{selectedTender.name} ({selectedTender.id})</strong>
                                </div>
                                {selectedTender.client_reference && (
                                  <div>
                                    <p style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--text-secondary))' }}>Client Tender Ref</p>
                                    <strong style={{ fontSize: '1rem', color: 'hsl(var(--primary))' }}>{selectedTender.client_reference}</strong>
                                  </div>
                                )}
                                <div>
                                  <p style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--text-secondary))' }}>Quoted To</p>
                                  <strong style={{ fontSize: '1rem' }}>{selectedTender.client}</strong>
                                </div>
                                <div>
                                  <p style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--text-secondary))' }}>Date Issued</p>
                                  <strong style={{ fontSize: '1rem' }}>{sq.issue_date}</strong>
                                </div>
                                <div>
                                  <p style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--text-secondary))' }}>Total Quoted Value</p>
                                  <strong style={{ fontSize: '1rem' }}>${Number(sq.total_value).toLocaleString()}</strong>
                                </div>
                              </div>
                              {renderItems(sq.items)}

                              {/* AUTHORIZED SIGNATURE & STAMP BLOCK */}
                              <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid hsl(var(--border))', paddingTop: '1.5rem' }}>
                                <div>
                                  <p style={{ color: 'hsl(var(--text-secondary))', margin: '0 0 0.5rem 0', fontSize: '0.8rem' }}>Terms & Validity:</p>
                                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>1. Valid for 30 days from issue date.<br/>2. Prices inclusive of applicable statutory taxes.</p>
                                </div>
                                <div style={{ textAlign: 'center', width: '220px' }}>
                                  <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src="/stamp.png" alt="Official Stamp" style={{ height: '90px', objectFit: 'contain', opacity: 0.88 }} onError={(e) => e.target.style.display = 'none'} />
                                  </div>
                                  <div style={{ borderBottom: '1px solid hsl(var(--border))', width: '100%', marginBottom: '0.3rem' }}></div>
                                  <strong style={{ fontSize: '0.85rem' }}>Authorized Signatory & Stamp</strong>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem', background: 'hsla(var(--border), 0.3)', borderBottom: '1px solid hsl(var(--border))' }}>
              <h4 style={{ margin: 0 }}>Client LPOs (Incoming)</h4>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <tbody>
                {!selectedTender.lpos || selectedTender.lpos.length === 0 ? (
                  <tr><td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>No Client LPOs linked.</td></tr>
                ) : selectedTender.lpos.map(lpo => (
                  <React.Fragment key={lpo.id}>
                    <tr style={{ borderBottom: expandedLPO === lpo.id ? 'none' : '1px solid hsl(var(--border))', cursor: 'pointer' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }} onClick={() => setExpandedLPO(expandedLPO === lpo.id ? null : lpo.id)}>
                        {lpo.id}
                        {lpo.client_reference && (
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem', fontWeight: 'normal' }}>
                            Ref: {lpo.client_reference}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'hsl(var(--text-secondary))' }} onClick={() => setExpandedLPO(expandedLPO === lpo.id ? null : lpo.id)}>Due: {lpo.due_date}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <span style={{ color: 'hsl(var(--success))', marginRight: '0.5rem' }}>${Number(lpo.total_value).toLocaleString()}</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn" onClick={(e) => { e.stopPropagation(); setExpandedLPO(lpo.id); printElement('.print-only', 'LPO'); }} style={{ background: 'hsla(var(--text-secondary), 0.1)', color: 'hsl(var(--text-primary))', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} title="Print / Save PDF">🖨️</button>
                          <button className="btn" onClick={(e) => { e.stopPropagation(); alert('Dispatching LPO via Email...'); }} style={{ background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} title="Email LPO">📧</button>
                          <button className="btn" onClick={(e) => { e.stopPropagation(); alert('Dispatching LPO via WhatsApp...'); }} style={{ background: 'hsla(var(--success), 0.1)', color: 'hsl(var(--success))', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} title="WhatsApp LPO">💬</button>
                        </div>
                      </td>
                    </tr>
                    {expandedLPO === lpo.id && (
                      <tr style={{ borderBottom: '1px solid hsl(var(--border))', background: 'var(--bg-app)' }}>
                        <td colSpan="3" style={{ padding: '1rem' }}>
                          <div className="print-only" style={{ background: '#ffffff', color: '#0f172a', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                            {/* SINGLE UNIFIED HEADER BANNER */}
                            <div style={{ borderBottom: '2px solid #cbd5e1', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                              {/* CENTERED LOGO & COMPANY DETAILS */}
                              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', marginBottom: '0.85rem' }}>
                                <img 
                                  src={companyProfile?.logo_url || '/logo.png'} 
                                  alt="Company Logo" 
                                  style={{ height: '140px', maxWidth: '320px', objectFit: 'contain' }} 
                                  onError={(e) => e.target.style.display = 'none'} 
                                />
                                <h2 style={{ margin: '0.3rem 0 0 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                  {companyProfile?.legal_name || companyProfile?.trading_name || 'AKPALI COMPANY LIMITED'}
                                </h2>
                                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>
                                  <div>{companyProfile?.postal_address || companyProfile?.address || 'Auto Bazaar, #001, Nairobi, Kenya'}</div>
                                  <div style={{ fontWeight: '500' }}>
                                    Tel: {companyProfile?.phone || '+254705365996'} &bull; Email: {companyProfile?.email || 'info@akpalimited.co.ke'}
                                  </div>
                                </div>
                              </div>

                              {/* BOTTOM HEADER BAR: DOCUMENT TITLE (LEFT) + DOC REF & DATE (FAR RIGHT) */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  CLIENT LOCAL PURCHASE ORDER: {lpo.id}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#334155', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <span><strong>Doc Ref #:</strong> {lpo.id}</span>
                                  <span style={{ margin: '0 0.5rem', color: '#94a3b8' }}>|</span>
                                  <span><strong>Date Generated:</strong> {lpo.issue_date || new Date().toISOString().split('T')[0]}</span>
                                </div>
                              </div>
                            </div>

                            {/* HIGH-CONTRAST METADATA GRID */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                              <div>
                                <p style={{ margin: '0 0 0.25rem 0', color: '#475569', fontWeight: '500' }}>Tender / Project</p>
                                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedTender.name} ({selectedTender.id})</strong>
                              </div>
                              <div>
                                <p style={{ margin: '0 0 0.25rem 0', color: '#475569', fontWeight: '500' }}>Client Name</p>
                                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedTender.client}</strong>
                              </div>
                              <div>
                                <p style={{ margin: '0 0 0.25rem 0', color: '#475569', fontWeight: '500' }}>Due Date</p>
                                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{lpo.due_date}</strong>
                              </div>
                              {lpo.client_reference && (
                                <div>
                                  <p style={{ margin: '0 0 0.25rem 0', color: '#475569', fontWeight: '500' }}>Client LPO Ref</p>
                                  <strong style={{ fontSize: '1rem', color: '#0284c7' }}>{lpo.client_reference}</strong>
                                </div>
                              )}
                              <div>
                                <p style={{ margin: '0 0 0.25rem 0', color: '#475569', fontWeight: '500' }}>Total Value</p>
                                <strong style={{ fontSize: '1rem', color: '#16a34a' }}>${Number(lpo.total_value).toLocaleString()}</strong>
                              </div>
                            </div>
                            {renderItems(lpo.items)}

                            {/* AUTHORIZED SIGNATURE & STAMP BLOCK */}
                            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '1.5rem' }}>
                              <div>
                                <p style={{ color: '#475569', margin: '0 0 0.5rem 0', fontSize: '0.8rem' }}>Order Confirmation:</p>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>1. Local Purchase Order accepted under corporate terms.<br/>2. Subject to delivery and milestone acceptance criteria.</p>
                              </div>
                              <div style={{ textAlign: 'center', width: '220px' }}>
                                <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <img src="/stamp.png" alt="Official Stamp" style={{ height: '90px', objectFit: 'contain', opacity: 0.88 }} onError={(e) => e.target.style.display = 'none'} />
                                </div>
                                <div style={{ borderBottom: '1px solid #cbd5e1', width: '100%', marginBottom: '0.3rem' }}></div>
                                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Authorized Signatory & Stamp</strong>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem', background: 'hsla(var(--border), 0.3)', borderBottom: '1px solid hsl(var(--border))' }}>
              <h4 style={{ margin: 0 }}>Supplier Purchase Orders (Outgoing)</h4>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <tbody>
                {!selectedTender.pos || selectedTender.pos.length === 0 ? (
                  <tr><td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>No Supplier POs linked.</td></tr>
                ) : selectedTender.pos.map(po => (
                  <tr key={po.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{po.id}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'hsl(var(--text-secondary))' }}>{po.supplier_name}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'hsl(var(--danger))' }}>${Number(po.total_value).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
            <h3 style={{ margin: 0 }}>Project Deliverables</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>Track goods, services, and construction phases fulfilling this tender.</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                <th style={{ padding: '1rem 1.5rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>Description</th>
                <th style={{ padding: '1rem' }}>Type</th>
                <th style={{ padding: '1rem' }}>Billing Method</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Revenue</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Cost</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Profit</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentDeliverables.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No deliverables created for this tender yet.</td></tr>
              ) : currentDeliverables.map(dlv => (
                <React.Fragment key={dlv.id}>
                  <tr 
                    style={{ borderBottom: '1px solid hsl(var(--border))', cursor: 'pointer', background: expandedDeliverable === dlv.id ? 'hsla(var(--primary), 0.05)' : 'transparent' }}
                    onClick={() => setExpandedDeliverable(expandedDeliverable === dlv.id ? null : dlv.id)}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'hsl(var(--primary))' }}>
                      <span style={{ display: 'inline-block', width: '20px' }}>{expandedDeliverable === dlv.id ? '▼' : '▶'}</span> {dlv.id}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{dlv.description}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${dlv.type === 'Goods' ? 'badge-info' : dlv.type === 'Service' ? 'badge-warning' : 'badge-danger'}`} style={{ opacity: 0.8 }}>{dlv.type}</span>
                    </td>
                    <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))', fontSize: '0.875rem' }}>{dlv.billing_method}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: 'hsl(var(--success))' }}>${Number(dlv.revenue).toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: 'hsl(var(--danger))' }}>${Number(dlv.cost).toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>${Number(dlv.profit).toLocaleString()}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <span className={`badge ${dlv.status === 'Approved' || dlv.status === 'Invoiced' ? 'badge-success' : dlv.status === 'Planned' ? 'badge-info' : 'badge-warning'}`}>
                        {dlv.status}
                      </span>
                    </td>
                  </tr>
                  {expandedDeliverable === dlv.id && (
                    <tr style={{ background: 'hsla(var(--bg-app), 0.5)' }}>
                      <td colSpan="8" style={{ padding: '1.5rem' }}>
                        <div style={{ padding: '1.5rem', border: '1px dashed hsl(var(--border))', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)' }}>
                          
                          <div style={{ display: 'flex', gap: '3rem', marginBottom: '1.5rem', borderBottom: '1px solid hsla(var(--border), 0.5)', paddingBottom: '1.5rem' }}>
                            <div>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Planned Date</p>
                              <strong>{dlv.planned_date || 'N/A'}</strong>
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Due Date</p>
                              <strong>{dlv.due_date || 'N/A'}</strong>
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Assigned Staff</p>
                              <strong>System Admin</strong>
                            </div>
                          </div>

                          <h4 style={{ margin: '0 0 1rem 0', color: 'hsl(var(--text-secondary))' }}>Submitted Evidence History</h4>
                          {dlv.evidence && dlv.evidence.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                              <thead>
                                <tr style={{ textAlign: 'left', color: 'hsl(var(--text-secondary))', borderBottom: '1px solid hsla(var(--border), 0.5)' }}>
                                  <th style={{ paddingBottom: '0.5rem' }}>Reference ID</th>
                                  <th style={{ paddingBottom: '0.5rem' }}>Date Submitted</th>
                                  <th style={{ paddingBottom: '0.5rem' }}>Fulfillment Details</th>
                                  <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Evidence Type</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dlv.evidence.map((ev, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid hsla(var(--border), 0.3)' }}>
                                    <td style={{ padding: '0.75rem 0', fontWeight: '500', color: 'hsl(var(--primary))' }}>{ev.id}</td>
                                    <td style={{ padding: '0.75rem 0' }}>{ev.date_submitted}</td>
                                    <td style={{ padding: '0.75rem 0' }}>{ev.details}</td>
                                    <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                                      <span style={{ background: 'hsla(var(--text-secondary), 0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                        {ev.type}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.875rem', margin: 0 }}>No evidence submitted for this deliverable yet.</p>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid hsla(var(--border), 0.5)', paddingTop: '1.5rem' }}>
                            <button className="btn" onClick={() => { printElement('.print-only', 'DELIVERY'); }} style={{ background: 'hsla(var(--text-secondary), 0.1)', color: 'hsl(var(--text-primary))', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              🖨️ Print / Save PDF
                            </button>
                            <button className="btn" onClick={() => alert('Dispatching Delivery Note via Email...')} style={{ background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              📧 Email
                            </button>
                            <button className="btn" onClick={() => alert('Dispatching Delivery Note via WhatsApp...')} style={{ background: 'hsla(var(--success), 0.1)', color: 'hsl(var(--success))', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              💬 WhatsApp
                            </button>
                          </div>

                          <div className="print-only" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                            {/* SINGLE UNIFIED HEADER BANNER */}
                            <div style={{ borderBottom: '2px solid #cbd5e1', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                              {/* CENTERED LOGO & COMPANY DETAILS */}
                              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', marginBottom: '0.85rem' }}>
                                <img 
                                  src={companyProfile?.logo_url || '/logo.png'} 
                                  alt="Company Logo" 
                                  style={{ height: '140px', maxWidth: '320px', objectFit: 'contain' }} 
                                  onError={(e) => e.target.style.display = 'none'} 
                                />
                                <h2 style={{ margin: '0.3rem 0 0 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                  {companyProfile?.legal_name || companyProfile?.trading_name || 'AKPALI COMPANY LIMITED'}
                                </h2>
                                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>
                                  <div>{companyProfile?.postal_address || companyProfile?.address || 'Auto Bazaar, #001, Nairobi, Kenya'}</div>
                                  <div style={{ fontWeight: '500' }}>
                                    Tel: {companyProfile?.phone || '+254705365996'} &bull; Email: {companyProfile?.email || 'info@akpalimited.co.ke'}
                                  </div>
                                </div>
                              </div>

                              {/* BOTTOM HEADER BAR: DOCUMENT TITLE (LEFT) + DOC REF & DATE (FAR RIGHT) */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  GOODS DELIVERY NOTE
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#334155', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <span><strong>Doc Ref #:</strong> {dlv.id}</span>
                                  <span style={{ margin: '0 0.5rem', color: '#94a3b8' }}>|</span>
                                  <span><strong>Date Generated:</strong> {dlv.date_submitted || new Date().toISOString().split('T')[0]}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                              <div>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'hsl(var(--text-secondary))' }}>To Client:</h4>
                                <strong style={{ fontSize: '1.25rem' }}>{selectedTender.client}</strong>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'hsl(var(--text-secondary))' }}>Project / Tender:</h4>
                                <strong>{selectedTender.name} ({selectedTender.id})</strong>
                              </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid hsl(var(--border))', textAlign: 'left' }}>
                                  <th style={{ padding: '1rem' }}>Deliverable Ref</th>
                                  <th style={{ padding: '1rem' }}>{dlv.type === 'Goods' ? 'Quantity' : 'Type'}</th>
                                  <th style={{ padding: '1rem' }}>Description of Goods/Services</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(dlv.type === 'Goods' && dlv.items && dlv.items.length > 0) ? (
                                  dlv.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}><strong>{dlv.id}-{idx+1}</strong></td>
                                      <td style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}>{item.qty} Unit(s)</td>
                                      <td style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}>{item.desc}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}><strong>{dlv.id}</strong></td>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}>{dlv.type}</td>
                                    <td style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}>{dlv.description}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginTop: '3rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '2rem' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <img src="/stamp.png" alt="Official Stamp" style={{ height: '90px', objectFit: 'contain', opacity: 0.88 }} onError={(e) => e.target.style.display = 'none'} />
                                </div>
                                <div style={{ borderBottom: '1px solid hsl(var(--border))', width: '100%', marginBottom: '0.5rem' }}></div>
                                <p style={{ margin: 0, fontSize: '0.875rem' }}><strong>Authorized Dispatcher & Stamp</strong></p>
                              </div>
                              <div>
                                <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '2rem' }}>Received in Good Condition By (Client):</p>
                                <div style={{ borderBottom: '1px solid hsl(var(--border))', width: '100%', marginBottom: '0.5rem', height: '2rem' }}></div>
                                <p style={{ margin: 0, fontSize: '0.875rem' }}>Name, Signature, & Date</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input type="text" placeholder="Search tenders..." style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid hsl(var(--border))', color: '#fff', width: '300px' }} />
        <button className="btn btn-primary" onClick={() => setGlobalDrawer('tender')}>+ New Tender</button>
      </div>
      


      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Tender ID</th>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Client</th>
              <th style={{ padding: '1rem' }}>Category</th>
              <th style={{ padding: '1rem' }}>Value</th>
              <th style={{ padding: '1rem' }}>Progress</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center' }}>Loading Tenders from Database...</td></tr>
            ) : tenders.length === 0 ? (
              <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No tenders found. Click "New Tender" to create one.</td></tr>
            ) : tenders.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>
                  {t.id}
                  {t.client_reference && (
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>
                      Ref: {t.client_reference}
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>{t.name}</td>
                <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>{t.client}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'hsla(var(--text-primary), 0.1)', borderRadius: '4px' }}>
                    {t.category}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>{formatAmount(t.contract_value)}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ width: '100%', height: '8px', background: 'hsl(var(--border))', borderRadius: '4px' }}>
                    <div style={{ width: `${t.progress}%`, height: '100%', background: 'hsl(var(--primary))', borderRadius: '4px' }} />
                  </div>
                </td>
                <td style={{ padding: '1rem' }}><span className={`badge ${t.status === 'Active' ? 'badge-info' : t.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span></td>
                <td style={{ padding: '1rem' }}>
                  <button className="btn" style={{ padding: '0.4rem 0.8rem', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }} onClick={() => setSelectedTender(t)}>View 360</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
