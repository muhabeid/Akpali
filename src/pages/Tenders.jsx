import React, { useState, useEffect } from 'react'

export default function Tenders({ setGlobalDrawer }) {
  const [selectedTender, setSelectedTender] = useState(null)
  const [expandedDeliverable, setExpandedDeliverable] = useState(null)
  const [tenders, setTenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)



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
            <p style={{ color: 'hsl(var(--text-secondary))' }}>{selectedTender.id} | Client: {selectedTender.client}</p>
          </div>
          <div className="badge badge-success">{selectedTender.status}</div>
        </div>
        


        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="card stat-card">
            <span className="stat-label">Contract Value</span>
            <span className="stat-value">${Number(selectedTender.contract_value).toLocaleString()}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Committed Costs (POs) + Actual</span>
            <span className="stat-value" style={{ color: 'hsl(var(--danger))' }}>${Number(selectedTender.total_cost || 0).toLocaleString()}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value" style={{ color: 'hsl(var(--success))' }}>${Number(selectedTender.total_revenue || 0).toLocaleString()}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Project Profit</span>
            <span className="stat-value" style={{ color: 'hsl(var(--warning))' }}>${Number(selectedTender.profit || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* LINKED DOCUMENTS: LPOs and POs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem', background: 'hsla(var(--border), 0.3)', borderBottom: '1px solid hsl(var(--border))' }}>
              <h4 style={{ margin: 0 }}>Client LPOs (Incoming)</h4>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <tbody>
                {!selectedTender.lpos || selectedTender.lpos.length === 0 ? (
                  <tr><td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>No Client LPOs linked.</td></tr>
                ) : selectedTender.lpos.map(lpo => (
                  <tr key={lpo.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{lpo.id}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'hsl(var(--text-secondary))' }}>Due: {lpo.due_date}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'hsl(var(--success))' }}>${Number(lpo.total_value).toLocaleString()}</td>
                  </tr>
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
                <td style={{ padding: '1rem', fontWeight: '500' }}>{t.id}</td>
                <td style={{ padding: '1rem' }}>{t.name}</td>
                <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>{t.client}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'hsla(var(--text-primary), 0.1)', borderRadius: '4px' }}>
                    {t.category}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>${Number(t.contract_value).toLocaleString()}</td>
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
