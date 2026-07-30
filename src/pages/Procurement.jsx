import React, { useState, useEffect, useContext } from 'react'
import { printElement } from '../utils/printHelper'
import Drawer from '../components/Drawer'
import RecordGRNForm from '../components/RecordGRNForm'
import GenerateRFQForm from '../components/GenerateRFQForm'
import { useRole } from '../context/RoleContext'
import { useCurrency } from '../context/CurrencyContext'

export default function Procurement({ setGlobalDrawer }) {
  const { currentRole } = useRole()
  const { formatAmount } = useCurrency()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [pos, setPos] = useState([])
  const [rfqs, setRfqs] = useState([])
  const [inventory, setInventory] = useState([])
  const [requisitions, setRequisitions] = useState([])
  const [matchAudit, setMatchAudit] = useState([])
  const [isGRNDrawerOpen, setGRNDrawerOpen] = useState(false)
  const [isRFQDrawerOpen, setRFQDrawerOpen] = useState(false)
  const [expandedRFQ, setExpandedRFQ] = useState(null)
  const [expandedPO, setExpandedPO] = useState(null)
  const [companyProfile, setCompanyProfile] = useState(null)

  useEffect(() => {
    fetch('http://localhost:5000/api/company-profile')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setCompanyProfile(data)
      })
      .catch(err => console.error('Company profile error:', err))
  }, [])

  const renderItems = (itemsString, isRfq = false) => {
    if (!itemsString) return <span style={{ color: 'hsl(var(--text-secondary))' }}>No items listed.</span>;
    try {
      const items = typeof itemsString === 'string' ? JSON.parse(itemsString) : itemsString;
      if (!Array.isArray(items)) throw new Error('Not an array');
      return (
        <div style={{ padding: '1rem', background: 'hsla(var(--border), 0.2)', borderLeft: '4px solid hsl(var(--primary))' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', textTransform: 'uppercase', color: 'hsl(var(--text-secondary))' }}>Document Contents</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))', textAlign: 'left', fontSize: '0.875rem' }}>
                <th style={{ padding: '0.5rem' }}>Description</th>
                <th style={{ padding: '0.5rem' }}>Quantity</th>
                <th style={{ padding: '0.5rem' }}>{isRfq ? 'Quoted Unit Price' : 'Details (Price/Unit)'}</th>
                {isRfq && <th style={{ padding: '0.5rem' }}>Quoted Total</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid hsla(var(--border), 0.5)', fontSize: '0.875rem' }}>
                  <td style={{ padding: '0.5rem' }}>{item.desc || item.description || item.name || '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{item.qty || item.quantity || 1}</td>
                  <td style={{ padding: '0.5rem' }}>
                    {isRfq ? <div style={{ borderBottom: '1px dashed hsl(var(--border))', width: '100px', height: '20px' }} /> : (item.unitPrice !== undefined ? formatAmount(item.unitPrice) : (item.unit || '-'))}
                  </td>
                  {isRfq && (
                    <td style={{ padding: '0.5rem' }}>
                      <div style={{ borderBottom: '1px dashed hsl(var(--border))', width: '100px', height: '20px' }} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    } catch(e) {
      return (
        <div style={{ padding: '1rem', background: 'hsla(var(--border), 0.2)', borderLeft: '4px solid hsl(var(--primary))' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', textTransform: 'uppercase', color: 'hsl(var(--text-secondary))' }}>Document Contents</h4>
          <pre style={{ fontSize: '0.875rem', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{itemsString}</pre>
        </div>
      );
    }
  }

  useEffect(() => {
    fetch('http://localhost:5000/api/pos')
      .then(res => res.json())
      .then(data => setPos(Array.isArray(data) ? data : []))
      .catch(err => console.error("Could not fetch POs:", err))

    fetch('http://localhost:5000/api/rfqs')
      .then(res => res.json())
      .then(data => setRfqs(Array.isArray(data) ? data : []))
      .catch(err => console.error("Could not fetch RFQs:", err))

    fetch('http://localhost:5000/api/inventory')
      .then(res => res.json())
      .then(data => setInventory(Array.isArray(data) ? data : []))
      .catch(err => console.error("Could not fetch inventory:", err))

    fetch('http://localhost:5000/api/stock_requisitions')
      .then(res => res.json())
      .then(data => setRequisitions(Array.isArray(data) ? data : []))
      .catch(err => console.error("Could not fetch requisitions:", err))

    fetch('http://localhost:5000/api/procurement/3-way-match-audit')
      .then(res => res.json())
      .then(data => setMatchAudit(Array.isArray(data) ? data : []))
      .catch(err => console.error("Could not fetch match audit:", err))
  }, [])

  const handleApproveReq = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/stock_requisitions/${id}/approve`, { method: 'PUT' });
      if (res.ok) {
        alert('Requisition Approved! Stock deducted & Cost allocated.');
        window.location.reload();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to approve');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectReq = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/stock_requisitions/${id}/reject`, { method: 'PUT' });
      alert('Requisition Rejected.');
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprovePO = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/pos/${id}/approve`, { method: 'PUT' });
      if (res.ok) {
        alert('PO Approved & Dispatched!');
        window.location.reload();
      } else {
        alert('Failed to approve PO');
      }
    } catch (e) { console.error(e); }
  }

  const handleRejectPO = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/pos/${id}/reject`, { method: 'PUT' });
      alert('PO Rejected.');
      window.location.reload();
    } catch (e) { console.error(e); }
  }

  const handleDispatch = (po, method = 'Email & WhatsApp') => {
    alert(`[SYSTEM DISPATCH]\n\nSending Purchase Order ${po.id} via ${method} to ${po.supplier_name}...\n\n✅ Sent Successfully!`);
  }

  const filteredPOs = pos.filter(po => {
    const matchesSearch = po.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (po.tender_name && po.tender_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          po.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'All' || po.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Drawer isOpen={isGRNDrawerOpen} onClose={() => setGRNDrawerOpen(false)} title="Record Goods Receipt Note (GRN)">
        <RecordGRNForm />
      </Drawer>

      <Drawer isOpen={isRFQDrawerOpen} onClose={() => setRFQDrawerOpen(false)} title="Generate Request for Quotation (RFQ)">
        <GenerateRFQForm />
      </Drawer>

      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card stat-card">
          <span className="stat-label">Total Spend (Active Tenders)</span>
          <span className="stat-value">{formatAmount(65500)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Pending Deliveries</span>
          <span className="stat-value" style={{ color: 'hsl(var(--warning))' }}>1</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">POs Awaiting Approval</span>
          <span className="stat-value" style={{ color: 'hsl(var(--danger))' }}>1</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'column' }}>
        
        {/* RFQs Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Requests for Quotation (RFQs)</h3>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>Active sourcing requests sent to suppliers.</p>
              </div>
              <button className="btn" onClick={() => setRFQDrawerOpen(true)} style={{ background: 'hsla(var(--primary), 0.2)', color: 'hsl(var(--primary))' }}>+ Generate RFQ from LPO</button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                <th style={{ padding: '1rem 1.5rem' }}>RFQ Number</th>
                <th style={{ padding: '1rem' }}>Source LPO</th>
                <th style={{ padding: '1rem' }}>Tender</th>
                <th style={{ padding: '1rem' }}>Deadline</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.length > 0 ? rfqs.map(rfq => (
                <React.Fragment key={rfq.id}>
                  <tr style={{ borderBottom: expandedRFQ === rfq.id ? 'none' : '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>{rfq.id}</td>
                    <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>{rfq.lpo_reference || '-'}</td>
                    <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>{rfq.tender_name || '-'}</td>
                    <td style={{ padding: '1rem' }}>{new Date(rfq.deadline).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${rfq.status === 'Awarded' ? 'badge-success' : rfq.status === 'Closed' ? 'badge-danger' : 'badge-warning'}`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }} onClick={() => alert('Sending RFQ via Email...')} title="Email Suppliers">📧</button>
                        <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--success), 0.1)', color: 'hsl(var(--success))' }} onClick={() => alert('Sending RFQ via WhatsApp...')} title="WhatsApp Suppliers">💬</button>
                      </div>
                      <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--text-secondary), 0.1)', color: 'hsl(var(--text-primary))' }} onClick={() => { setExpandedRFQ(rfq.id); printElement('.print-only', 'RFQ'); }} title="Print / Download PDF">
                        🖨️
                      </button>
                      <button 
                        className="btn" 
                        onClick={() => setExpandedRFQ(expandedRFQ === rfq.id ? null : rfq.id)} 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid hsl(var(--border))' }}
                      >
                        {expandedRFQ === rfq.id ? 'Hide Details' : 'View Details'}
                      </button>
                      {rfq.status === 'Open' && (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => setGlobalDrawer('new_po')} 
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          Award Quote
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedRFQ === rfq.id && (
                    <tr style={{ borderBottom: '1px solid hsl(var(--border))', background: 'var(--bg-app)' }}>
                      <td colSpan="6" style={{ padding: '1rem' }}>
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
                                REQUEST FOR QUOTATION (RFQ)
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#334155', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <span><strong>Doc Ref #:</strong> {rfq.id}</span>
                                <span style={{ margin: '0 0.5rem', color: '#94a3b8' }}>|</span>
                                <span><strong>Date Generated:</strong> {rfq.issue_date || new Date().toISOString().split('T')[0]}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                            <div>
                              <p style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--text-secondary))' }}>Tender Reference</p>
                              <strong style={{ fontSize: '1rem' }}>{rfq.tender_name || 'N/A'}</strong>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--text-secondary))' }}>Submission Deadline</p>
                              <strong style={{ fontSize: '1rem' }}>{new Date(rfq.deadline).toLocaleDateString()}</strong>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--text-secondary))' }}>Client References</p>
                              <strong style={{ fontSize: '0.875rem', color: 'hsl(var(--primary))' }}>
                                {rfq.tender_client_reference ? `Tender: ${rfq.tender_client_reference}` : 'No Tender Ref'}
                                <br />
                                {rfq.lpo_client_reference ? `LPO: ${rfq.lpo_client_reference}` : 'No LPO Ref'}
                              </strong>
                            </div>
                          </div>
                          {renderItems(rfq.items, true)}

                          {/* AUTHORIZED SIGNATURE & STAMP BLOCK */}
                          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid hsl(var(--border))', paddingTop: '1.5rem' }}>
                            <div style={{ textAlign: 'center', width: '220px' }}>
                              <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src="/stamp.png" alt="Official Stamp" style={{ height: '90px', objectFit: 'contain', opacity: 0.88 }} onError={(e) => e.target.style.display = 'none'} />
                              </div>
                              <div style={{ borderBottom: '1px solid hsl(var(--border))', width: '100%', marginBottom: '0.3rem' }}></div>
                              <strong style={{ fontSize: '0.85rem' }}>Procurement Officer & Stamp</strong>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )) : (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No RFQs generated yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'column' }}>
          {/* AUTOMATED 3-WAY MATCHING RECONCILIATION LEDGER */}
      {matchAudit && matchAudit.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', background: 'hsla(var(--primary), 0.04)', border: '1px solid hsla(var(--primary), 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem' }}>⚖️ Automated 3-Way Matching Reconciliation Engine</h3>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>Automated ledger audit verifying Purchase Orders (PO) vs Goods Receipt Notes (GRN) vs Supplier Invoices</div>
            </div>
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '12px', background: '#38bdf822', color: '#38bdf8', fontWeight: '700' }}>
              {matchAudit.filter(m => m.match_status === 'Matched').length} / {matchAudit.length} POs Fully Reconciled
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', textAlign: 'left', borderBottom: '2px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '0.6rem 0.8rem' }}>PO Ref #</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Supplier</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>PO Value</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>GRN Recv Qty</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Invoiced</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Match Status</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Audit Findings</th>
                </tr>
              </thead>
              <tbody>
                {matchAudit.map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: '700', color: '#38bdf8' }}>{m.po_id}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#fff' }}>{m.supplier_name}</td>
                    <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: '600' }}>{formatAmount(m.po_total || 0)}</td>
                    <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', color: '#94a3b8' }}>{m.total_received}</td>
                    <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', color: '#94a3b8' }}>{formatAmount(m.total_invoiced || 0)}</td>
                    <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: '700', background: m.match_status === 'Matched' ? '#dcfce7' : '#fee2e2', color: m.match_status === 'Matched' ? '#15803d' : '#b91c1c' }}>
                        {m.match_status}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1', fontSize: '0.78rem' }}>{m.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: PURCHASE ORDERS (POS) */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Supplier Purchase Orders (POs)</h3>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>Track all material orders raised to suppliers.</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn" onClick={() => setGRNDrawerOpen(true)} style={{ background: 'hsla(var(--success), 0.2)', color: 'hsl(var(--success))' }}>+ Record GRN (Delivery)</button>
                <button className="btn btn-primary" onClick={() => setGlobalDrawer('new_po')}>+ Raise PO</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="Search PO, Supplier, or Tender..." 
                className="form-control" 
                style={{ flex: 1 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <select className="form-control" style={{ width: '200px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Pending Delivery">Pending Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Awaiting Approval">Awaiting Approval</option>
              </select>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                <th style={{ padding: '1rem 1.5rem' }}>PO Number</th>
                <th style={{ padding: '1rem' }}>Supplier</th>
                <th style={{ padding: '1rem' }}>Tender</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOs.length > 0 ? filteredPOs.map(po => (
                <React.Fragment key={po.id}>
                  <tr style={{ borderBottom: expandedPO === po.id ? 'none' : '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'hsl(var(--primary))' }}>{po.id}</td>
                    <td style={{ padding: '1rem' }}>{po.supplier_name}</td>
                    <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>
                      {po.tender_name || <span className="badge badge-warning">Company Overhead</span>}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{formatAmount(po.total_value)}</td>
                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`badge ${po.status === 'Delivered' ? 'badge-success' : po.status === 'Awaiting Approval' ? 'badge-danger' : po.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {po.status}
                      </span>
                      
                      {po.status === 'Awaiting Approval' && currentRole !== 'Staff' && (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleApprovePO(po.id)}>Approve</button>
                          <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--danger), 0.1)', color: 'hsl(var(--danger))' }} onClick={() => handleRejectPO(po.id)}>Reject</button>
                        </div>
                      )}
                      
                      {po.status === 'Pending Delivery' && (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }} onClick={() => handleDispatch(po, 'Email')} title="Email Supplier">📧</button>
                          <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--success), 0.1)', color: 'hsl(var(--success))' }} onClick={() => handleDispatch(po, 'WhatsApp')} title="WhatsApp Supplier">💬</button>
                        </div>
                      )}

                      <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--text-secondary), 0.1)', color: 'hsl(var(--text-primary))' }} onClick={() => { setExpandedPO(po.id); printElement('.print-only', 'PO'); }} title="Print / Download PDF">
                        🖨️
                      </button>

                      <button 
                        className="btn" 
                        onClick={() => setExpandedPO(expandedPO === po.id ? null : po.id)} 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid hsl(var(--border))' }}
                      >
                        {expandedPO === po.id ? 'Hide Details' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedPO === po.id && (
                    <tr style={{ borderBottom: '1px solid hsl(var(--border))', background: 'var(--bg-app)' }}>
                      <td colSpan="5" style={{ padding: '1rem' }}>
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
                                PURCHASE ORDER (PO)
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#334155', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <span><strong>Doc Ref #:</strong> {po.id}</span>
                                <span style={{ margin: '0 0.5rem', color: '#94a3b8' }}>|</span>
                                <span><strong>Date Generated:</strong> {po.issue_date || new Date().toISOString().split('T')[0]}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                            <div>
                              <p style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--text-secondary))' }}>Supplier Details</p>
                              <strong style={{ fontSize: '1rem' }}>{po.supplier_name}</strong>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--text-secondary))' }}>Tender / Project</p>
                              <strong style={{ fontSize: '1rem' }}>{po.tender_name || 'N/A'}</strong>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--text-secondary))' }}>Expected Delivery Date</p>
                              <strong style={{ fontSize: '1rem' }}>{po.expected_date}</strong>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--text-secondary))' }}>Total Order Value</p>
                              <strong style={{ fontSize: '1rem' }}>{formatAmount(po.total_value)}</strong>
                            </div>
                          </div>
                          {renderItems(po.items)}

                          {/* AUTHORIZED SIGNATURE & STAMP BLOCK */}
                          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid hsl(var(--border))', paddingTop: '1.5rem' }}>
                            <div style={{ textAlign: 'center', width: '220px' }}>
                              <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src="/stamp.png" alt="Official Stamp" style={{ height: '90px', objectFit: 'contain', opacity: 0.88 }} onError={(e) => e.target.style.display = 'none'} />
                              </div>
                              <div style={{ borderBottom: '1px solid hsl(var(--border))', width: '100%', marginBottom: '0.3rem' }}></div>
                              <strong style={{ fontSize: '0.85rem' }}>Approved Signatory & Stamp</strong>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )) : (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No Purchase Orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
            {/* Inventory Quick View */}
            <div className="card">
              <h3>Live Inventory</h3>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginBottom: '1rem' }}>Updated by GRNs (In) and Requisitions (Out).</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr><td style={{ color: 'hsl(var(--text-secondary))', textAlign: 'center', padding: '1rem' }}>Inventory is empty. Awaiting GRNs.</td></tr>
                  ) : inventory.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid hsla(var(--border), 0.5)' }}>
                      <td style={{ padding: '0.75rem 0' }}>{item.item_name}</td>
                      <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 'bold' }}>
                        {item.quantity} {item.unit}
                        {item.quantity < 10 && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--danger))' }}>⚠️ Low</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stock Requisitions */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
                <h3 style={{ margin: 0 }}>Stock Requisitions (Outflow)</h3>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>Staff requests to issue materials to projects.</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left', fontSize: '0.875rem' }}>
                    <th style={{ padding: '1rem' }}>ID</th>
                    <th style={{ padding: '1rem' }}>Project</th>
                    <th style={{ padding: '1rem' }}>Item</th>
                    <th style={{ padding: '1rem' }}>Qty</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requisitions.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No requisitions found.</td></tr>
                  ) : requisitions.map((req, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border))', fontSize: '0.875rem' }}>
                      <td style={{ padding: '1rem' }}>{req.id}</td>
                      <td style={{ padding: '1rem', color: 'hsl(var(--primary))' }}>{req.tender_name || req.tender_id}</td>
                      <td style={{ padding: '1rem' }}>{req.item_name}</td>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{req.quantity}</td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${req.status === 'Approved' ? 'badge-success' : req.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {req.status === 'Pending' && (
                          <>
                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleApproveReq(req.id)}>Approve</button>
                            <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--danger), 0.1)', color: 'hsl(var(--danger))' }} onClick={() => handleRejectReq(req.id)}>Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h3 style={{ margin: 0 }}>Supplier Directory</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manage KRA PINs, bank details, and performance ratings.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setGlobalDrawer('new_supplier')}>+ Add Supplier</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
              <th style={{ padding: '1rem 1.5rem' }}>Supplier Name</th>
              <th style={{ padding: '1rem' }}>Contact</th>
              <th style={{ padding: '1rem' }}>KRA PIN</th>
              <th style={{ padding: '1rem' }}>Rating</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'BuildMat Ltd', contact: 'john@buildmat.com', pin: 'P051234567Z', rating: 4.8 },
              { name: 'Steel & Timber Co.', contact: 'sales@steeltimber.co', pin: 'P059876543A', rating: 4.2 },
              { name: 'Nairobi Cement Providers', contact: 'dispatch@ncp.co.ke', pin: 'P051122334X', rating: 3.9 }
            ].map((s, i) => (
              <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>{s.name}</td>
                <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>{s.contact}</td>
                <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>{s.pin}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: s.rating > 4 ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>★ {s.rating}</span>
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                  <button className="btn" style={{ padding: '0.25rem 0.75rem', background: 'transparent', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--border))' }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
