import React, { useState, useEffect } from 'react'
import { printElement } from '../utils/printHelper'
import { useCurrency } from '../context/CurrencyContext'
import DocumentPreviewModal from '../components/DocumentPreviewModal'
import Drawer from '../components/Drawer'
import SalesQuoteForm from '../components/SalesQuoteForm'

export default function Tenders({ setGlobalDrawer }) {
  const { formatAmount } = useCurrency()
  const [selectedTender, setSelectedTender] = useState(null)
  const [expandedDeliverable, setExpandedDeliverable] = useState(null)
  const [tenders, setTenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)
  const [companyProfile, setCompanyProfile] = useState(null)
  const [editingTender, setEditingTender] = useState(null)
  const [editingQuote, setEditingQuote] = useState(null)
  const [previewModalDoc, setPreviewModalDoc] = useState({ isOpen: false, doc: null, type: '' })

  const handleDeleteTender = async (t) => {
    if (window.confirm(`Are you sure you want to delete Tender '${t.name}' (${t.id})?\nThis will permanently remove associated LPOs and RFQs.`)) {
      try {
        const res = await fetch(`http://localhost:5000/api/tenders/${t.id}`, { method: 'DELETE' });
        if (res.ok) {
          alert(`✅ Tender '${t.id}' deleted successfully!`);
          window.location.reload();
        } else { alert('Failed to delete tender'); }
      } catch(err) { console.error(err); alert('Error deleting tender'); }
    }
  }

  const handleDeleteLPO = async (lpoId) => {
    if (window.confirm(`Are you sure you want to delete Client LPO '${lpoId}'?`)) {
      try {
        const res = await fetch(`http://localhost:5000/api/lpos/${lpoId}`, { method: 'DELETE' });
        if (res.ok) {
          alert(`✅ Client LPO '${lpoId}' deleted successfully!`);
          window.location.reload();
        } else { alert('Failed to delete LPO'); }
      } catch(err) { console.error(err); alert('Error deleting LPO'); }
    }
  }

  const handleSaveTenderEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/tenders/${editingTender.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTender)
      });
      if (res.ok) {
        alert(`✅ Tender '${editingTender.id}' updated successfully!`);
        setEditingTender(null);
        window.location.reload();
      } else { alert('Failed to update tender'); }
    } catch(err) { console.error(err); alert('Error updating tender'); }
  }

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
              <div style={{ padding: '0.75rem' }}>Quantity / Unit</div>
              <div style={{ padding: '0.75rem' }}>Unit Price</div>
            </div>
            
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: idx === items.length - 1 ? 'none' : '1px solid hsl(var(--border))', fontSize: '0.875rem' }}>
                <div style={{ padding: '0.75rem' }}>{item.desc || item.description || item.name || '-'}</div>
                <div style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                  {item.qty || item.quantity ? `${item.qty || item.quantity} (${item.unit || 'PCS'})` : (item.unit || 'PCS')}
                </div>
                <div style={{ padding: '0.75rem' }}>
                  {(item.unitPrice !== undefined || item.price !== undefined) ? `$${Number(item.unitPrice || item.price || 0).toLocaleString()}` : '-'}
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
            <span className="stat-label">Contract Value / Ceiling</span>
            <span className="stat-value">{formatAmount(selectedTender.effective_contract_value || selectedTender.contract_value || selectedTender.lpo_total || 0)}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Committed Costs (POs)</span>
            <span className="stat-value" style={{ color: 'hsl(var(--danger))' }}>{formatAmount(selectedTender.total_cost || 0)}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Total Revenue (LPOs)</span>
            <span className="stat-value" style={{ color: 'hsl(var(--success))' }}>{formatAmount(selectedTender.lpo_total || selectedTender.total_revenue || 0)}</span>
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
                      <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{sq.id}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'hsl(var(--text-secondary))' }}>{sq.issue_date}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ color: 'hsl(var(--primary))', marginRight: '0.5rem', fontWeight: 'bold' }}>{formatAmount(sq.total_value)}</span>
                          <button 
                            className="btn" 
                            onClick={() => setPreviewModalDoc({ 
                              isOpen: true, 
                              doc: { 
                                ...sq, 
                                tender_id: sq.tender_id || selectedTender.id, 
                                tender_name: selectedTender.name, 
                                client: selectedTender.client, 
                                client_name: selectedTender.client 
                              }, 
                              type: 'SALES QUOTATION' 
                            })} 
                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', background: 'hsla(var(--primary), 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsla(var(--primary), 0.3)' }}
                            title="Preview Sales Quote"
                          >
                            👁️
                          </button>
                          <button 
                            className="btn" 
                            onClick={() => setEditingQuote({ 
                              ...sq, 
                              tender_id: sq.tender_id || selectedTender.id, 
                              tender_name: selectedTender.name 
                            })} 
                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', background: 'hsla(var(--warning), 0.15)', color: 'hsl(var(--warning))', border: '1px solid hsla(var(--warning), 0.3)' }}
                            title="Edit / Add Line Items to Sales Quote"
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
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
                    <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>
                        {lpo.id}
                        {lpo.client_reference && (
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem', fontWeight: 'normal' }}>
                            Ref: {lpo.client_reference}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'hsl(var(--text-secondary))' }}>Due: {lpo.due_date}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <span style={{ color: 'hsl(var(--success))', marginRight: '0.5rem', fontWeight: 'bold' }}>{formatAmount(lpo.total_value)}</span>
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                          <button 
                            className="btn" 
                            onClick={() => setPreviewModalDoc({ isOpen: true, doc: lpo, type: 'CLIENT LOCAL PURCHASE ORDER' })} 
                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', background: 'hsla(var(--primary), 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsla(var(--primary), 0.3)' }}
                            title="Preview Client LPO"
                          >
                            👁️
                          </button>
                          <button className="btn" onClick={() => handleDeleteLPO(lpo.id)} style={{ background: '#f43f5e', color: '#fff', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} title="Delete LPO">🗑️</button>
                        </div>
                      </td>
                    </tr>
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
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'hsl(var(--danger))', fontWeight: 'bold' }}>{formatAmount(po.total_value)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button 
                        className="btn" 
                        onClick={() => setPreviewModalDoc({ isOpen: true, doc: po, type: 'PURCHASE ORDER' })} 
                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', background: 'hsla(var(--primary), 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsla(var(--primary), 0.3)' }}
                        title="Preview Purchase Order"
                      >
                        👁️
                      </button>
                    </td>
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
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'hsl(var(--primary))' }}>
                      {dlv.id}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{dlv.description}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${dlv.type === 'Goods' ? 'badge-info' : dlv.type === 'Service' ? 'badge-warning' : 'badge-danger'}`} style={{ opacity: 0.8 }}>{dlv.type}</span>
                    </td>
                    <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))', fontSize: '0.875rem' }}>{dlv.billing_method}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: 'hsl(var(--success))' }}>{formatAmount(dlv.revenue)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: 'hsl(var(--danger))' }}>{formatAmount(dlv.cost)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>{formatAmount(dlv.profit)}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <span className={`badge ${dlv.status === 'Approved' || dlv.status === 'Invoiced' ? 'badge-success' : dlv.status === 'Planned' ? 'badge-info' : 'badge-warning'}`}>
                        {dlv.status}
                      </span>
                      <button 
                        type="button" 
                        className="btn" 
                        onClick={(e) => { e.stopPropagation(); setPreviewModalDoc({ isOpen: true, doc: { ...dlv, client: selectedTender.client, client_name: selectedTender.client, tender_name: selectedTender.name }, type: 'GOODS DELIVERY NOTE' }); }} 
                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', background: 'hsla(var(--primary), 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsla(var(--primary), 0.3)' }}
                        title="Preview Goods Delivery Note"
                      >
                        👁️
                      </button>
                      {dlv.status !== 'Approved' && dlv.status !== 'Invoiced' && (
                        <button 
                          className="btn" 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Auto-fulfill deliverable '${dlv.description}' and generate Goods Delivery Note?`)) {
                              try {
                                const res = await fetch(`http://localhost:5000/api/deliverables/${dlv.id}/auto-fulfill`, { method: 'POST' });
                                const data = await res.json();
                                if (res.ok) {
                                  alert(`✅ ${data.message}`);
                                  window.location.reload();
                                } else { alert(data.error || 'Failed to auto-fulfill'); }
                              } catch(err) { console.error(err); alert('Error fulfilling deliverable'); }
                            }
                          }}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--success), 0.15)', color: 'hsl(var(--success))', border: '1px solid hsla(var(--success), 0.3)', fontWeight: 'bold' }}
                          title="1-Click Auto Fulfill Delivery & Auto Generate Delivery Note"
                        >
                          Fulfill Deliverable
                        </button>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* DOCUMENT PREVIEW MODAL FOR 360 TENDER VIEW */}
        <DocumentPreviewModal 
          isOpen={previewModalDoc.isOpen} 
          onClose={() => setPreviewModalDoc({ isOpen: false, doc: null, type: '' })} 
          doc={previewModalDoc.doc} 
          docType={previewModalDoc.type} 
          companyProfile={companyProfile} 
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input type="text" placeholder="Search tenders..." style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid hsl(var(--border))', color: '#fff', width: '300px' }} />
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>+ New Tender</button>
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
                <td style={{ padding: '1rem' }}>
                  <div>
                    <strong>{formatAmount(t.effective_contract_value || t.contract_value || t.lpo_total || 0)}</strong>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ width: '100%', height: '8px', background: 'hsl(var(--border))', borderRadius: '4px' }}>
                    <div style={{ width: `${t.progress}%`, height: '100%', background: 'hsl(var(--primary))', borderRadius: '4px' }} />
                  </div>
                </td>
                <td style={{ padding: '1rem' }}><span className={`badge ${t.status === 'Active' ? 'badge-info' : t.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span></td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button className="btn" style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', fontWeight: 'bold' }} onClick={() => setSelectedTender(t)}>View 360</button>
                    <button className="btn" style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', background: '#0284c7', color: '#fff', fontWeight: 'bold' }} onClick={() => setEditingTender(t)}>✏️ Edit</button>
                    <button className="btn" style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', background: '#f43f5e', color: '#fff', fontWeight: 'bold' }} onClick={() => handleDeleteTender(t)}>🗑️ Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT TENDER MODAL */}
      {editingTender && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="card" style={{ width: '550px', background: '#0f172a', border: '1px solid #38bdf8', padding: '1.5rem', color: '#fff', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#38bdf8' }}>✏️ Edit Tender Details ({editingTender.id})</h3>
            <form onSubmit={handleSaveTenderEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Tender / Project Name *</label>
                <input type="text" className="form-control" required value={editingTender.name} onChange={e => setEditingTender({...editingTender, name: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Client Organization *</label>
                  <input type="text" className="form-control" required value={editingTender.client_name || editingTender.client || ''} onChange={e => setEditingTender({...editingTender, client: e.target.value, client_name: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Client Ref #</label>
                  <input type="text" className="form-control" value={editingTender.client_reference || ''} onChange={e => setEditingTender({...editingTender, client_reference: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Contract Value (KES) *</label>
                  <input type="number" className="form-control" required value={editingTender.contract_value} onChange={e => setEditingTender({...editingTender, contract_value: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Status *</label>
                  <select className="form-control" value={editingTender.status} onChange={e => setEditingTender({...editingTender, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn" style={{ background: '#334155', color: '#fff' }} onClick={() => setEditingTender(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 'bold' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EDIT SALES QUOTATION DRAWER */}
      <Drawer isOpen={Boolean(editingQuote)} onClose={() => setEditingQuote(null)} title={`✏️ Edit Sales Quotation (${editingQuote?.id})`}>
        {editingQuote && (
          <SalesQuoteForm 
            quoteToEdit={editingQuote} 
            onSuccess={() => {
              setEditingQuote(null);
              window.location.reload();
            }} 
          />
        )}
      </Drawer>

      {/* DOCUMENT PREVIEW MODAL */}
      <DocumentPreviewModal 
        isOpen={previewModalDoc.isOpen} 
        onClose={() => setPreviewModalDoc({ isOpen: false, doc: null, type: '' })} 
        doc={previewModalDoc.doc} 
        docType={previewModalDoc.type} 
        companyProfile={companyProfile} 
      />
    </div>
  )
}
