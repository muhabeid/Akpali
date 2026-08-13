import React, { useState, useEffect, useContext } from 'react'
import { printElement } from '../utils/printHelper'
import Drawer from '../components/Drawer'
import RecordGRNForm from '../components/RecordGRNForm'
import GenerateRFQForm from '../components/GenerateRFQForm'
import DocumentPreviewModal from '../components/DocumentPreviewModal'
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
  const [suppliers, setSuppliers] = useState([])
  const [clients, setClients] = useState([])
  const [matchAudit, setMatchAudit] = useState([])
  const [isGRNDrawerOpen, setGRNDrawerOpen] = useState(false)
  const [isRFQDrawerOpen, setRFQDrawerOpen] = useState(false)
  const [previewModalDoc, setPreviewModalDoc] = useState({ isOpen: false, doc: null, type: '' })
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
                <th style={{ padding: '0.5rem' }}>Quantity / Unit</th>
                <th style={{ padding: '0.5rem' }}>{isRfq ? 'Quoted Unit Price' : 'Unit Price'}</th>
                {isRfq && <th style={{ padding: '0.5rem' }}>Quoted Total</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid hsla(var(--border), 0.5)', fontSize: '0.875rem' }}>
                  <td style={{ padding: '0.5rem' }}>{item.desc || item.description || item.name || '-'}</td>
                  <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                    {item.qty || item.quantity ? `${item.qty || item.quantity} (${item.unit || 'PCS'})` : (item.unit || 'PCS')}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {isRfq ? <div style={{ borderBottom: '1px dashed hsl(var(--border))', width: '100px', height: '20px' }} /> : ((item.unitPrice !== undefined || item.price !== undefined) ? formatAmount(item.unitPrice || item.price) : '-')}
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

    fetch('http://localhost:5000/api/suppliers')
      .then(res => res.json())
      .then(data => setSuppliers(Array.isArray(data) ? data : []))
      .catch(err => console.error("Could not fetch suppliers:", err))

    fetch('http://localhost:5000/api/clients')
      .then(res => res.json())
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(err => console.error("Could not fetch clients:", err))
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

  const handleDeletePO = async (poId) => {
    if (window.confirm(`Are you sure you want to delete Purchase Order '${poId}'?`)) {
      try {
        const res = await fetch(`http://localhost:5000/api/pos/${poId}`, { method: 'DELETE' });
        if (res.ok) {
          alert(`✅ Purchase Order '${poId}' deleted!`);
          window.location.reload();
        } else { alert('Failed to delete PO'); }
      } catch(err) { alert('Error deleting PO'); }
    }
  };

  const handleDeleteRFQ = async (rfqId) => {
    if (window.confirm(`Are you sure you want to delete RFQ '${rfqId}'?`)) {
      try {
        const res = await fetch(`http://localhost:5000/api/rfqs/${rfqId}`, { method: 'DELETE' });
        if (res.ok) {
          alert(`✅ RFQ '${rfqId}' deleted!`);
          window.location.reload();
        } else { alert('Failed to delete RFQ'); }
      } catch(err) { alert('Error deleting RFQ'); }
    }
  };

  const handleDeleteClient = async (c) => {
    if (window.confirm(`Are you sure you want to delete Client '${c.name}' (${c.id})?`)) {
      try {
        const res = await fetch(`http://localhost:5000/api/clients/${c.id}`, { method: 'DELETE' });
        if (res.ok) {
          alert(`✅ Client '${c.name}' deleted!`);
          window.location.reload();
        } else { alert('Failed to delete client'); }
      } catch(err) { alert('Error deleting client'); }
    }
  };

  const handleDeleteSupplier = async (s) => {
    if (window.confirm(`Are you sure you want to delete Supplier '${s.name}' (${s.id})?`)) {
      try {
        const res = await fetch(`http://localhost:5000/api/suppliers/${s.id}`, { method: 'DELETE' });
        if (res.ok) {
          alert(`✅ Supplier '${s.name}' deleted!`);
          window.location.reload();
        } else { alert('Failed to delete supplier'); }
      } catch(err) { alert('Error deleting supplier'); }
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

  // Dynamic stat card calculations
  const totalSpend = pos.filter(p => p.status !== 'Rejected').reduce((sum, p) => sum + (Number(p.total_value) || 0), 0)
  const pendingDeliveries = pos.filter(p => p.status === 'Approved' || p.status === 'Pending Delivery' || p.status === 'Dispatched').length
  const posAwaitingApproval = pos.filter(p => p.status === 'Pending Approval' || p.status === 'Draft' || p.status === 'Pending').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Drawer isOpen={isGRNDrawerOpen} onClose={() => setGRNDrawerOpen(false)} title="Record Goods Receipt Note (GRN)">
        <RecordGRNForm />
      </Drawer>

      <Drawer isOpen={isRFQDrawerOpen} onClose={() => setRFQDrawerOpen(false)} title="Generate Request for Quotation (RFQ)">
        <GenerateRFQForm />
      </Drawer>

      {/* DYNAMIC STAT CARDS WITH RESPONSIVE AUTO-FIT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="card stat-card">
          <span className="stat-label">Total Spend (Active Tenders)</span>
          <span className="stat-value">{formatAmount(totalSpend)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Pending Deliveries</span>
          <span className="stat-value" style={{ color: 'hsl(var(--warning))' }}>{pendingDeliveries}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">POs Awaiting Approval</span>
          <span className="stat-value" style={{ color: 'hsl(var(--danger))' }}>{posAwaitingApproval}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'column' }}>
        
        {/* RFQs Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>{rfq.id}</td>
                    <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>{rfq.lpo_reference || '-'}</td>
                    <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>{rfq.tender_name || '-'}</td>
                    <td style={{ padding: '1rem' }}>{new Date(rfq.deadline).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${rfq.status === 'Awarded' ? 'badge-success' : rfq.status === 'Closed' ? 'badge-danger' : 'badge-warning'}`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }} onClick={() => alert('Sending RFQ via Email...')} title="Email Suppliers">📧</button>
                        <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--success), 0.1)', color: 'hsl(var(--success))' }} onClick={() => alert('Sending RFQ via WhatsApp...')} title="WhatsApp Suppliers">💬</button>
                      </div>
                      <button 
                        type="button" 
                        className="btn" 
                        onClick={(e) => { e.stopPropagation(); setPreviewModalDoc({ isOpen: true, doc: rfq, type: 'REQUEST FOR QUOTATION' }); }} 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--primary), 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsla(var(--primary), 0.3)' }}
                        title="Preview RFQ Document"
                      >
                        👁️
                      </button>
                      {rfq.status === 'Open' && (
                        <button 
                          className="btn" 
                          onClick={() => setGlobalDrawer('new_po')} 
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', background: 'hsla(var(--success), 0.2)', color: 'hsl(var(--success))', border: 'none' }}
                        >
                          Award Quote
                        </button>
                      )}
                    </td>
                  </tr>
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
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Supplier Purchase Orders (POs)</h3>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>Track all material orders raised to suppliers.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn" onClick={() => setGRNDrawerOpen(true)} style={{ background: 'hsla(var(--success), 0.2)', color: 'hsl(var(--success))' }}>+ Record GRN (Delivery)</button>
                <button className="btn btn-primary" onClick={() => setGlobalDrawer('new_po')}>+ Raise PO</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Search PO, Supplier, or Tender..." 
                className="form-control" 
                style={{ flex: '1 1 200px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <select className="form-control" style={{ flex: '0 1 180px', minWidth: '150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
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
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
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

                      <button 
                        type="button" 
                        className="btn" 
                        onClick={(e) => { e.stopPropagation(); setPreviewModalDoc({ isOpen: true, doc: po, type: 'PURCHASE ORDER' }); }} 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--primary), 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsla(var(--primary), 0.3)' }}
                        title="Preview Purchase Order"
                      >
                        👁️
                      </button>

                      <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#f43f5e', color: '#fff' }} onClick={() => handleDeletePO(po.id)} title="Delete Purchase Order">
                        🗑️
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              )) : (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No Purchase Orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.5rem' }}>
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

      {/* CLIENT DIRECTORY & SUPPLIER DIRECTORY SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* 1. CLIENT DIRECTORY CARD */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', background: 'hsla(var(--primary), 0.05)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#4A8BCE' }}>🏢 Client & Customer Directory</h3>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem', marginTop: '0.2rem' }}>Registered project clients, tax PINs & contacts.</p>
            </div>
            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', fontWeight: 'bold' }} onClick={() => setGlobalDrawer('new_client')}>+ Add Client</button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Client Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Tax PIN</th>
                <th style={{ padding: '0.75rem 1rem' }}>Contact</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
                    No clients registered yet. Click "+ Add Client" to register.
                  </td>
                </tr>
              ) : (
                clients.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#fff' }}>{c.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#38bdf8' }}>{c.tax_pin || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'hsl(var(--text-secondary))' }}>{c.email || c.phone || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#f43f5e', color: '#fff' }} onClick={() => handleDeleteClient(c)} title="Remove Client">🗑️ Remove</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 2. SUPPLIER DIRECTORY CARD */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', background: 'hsla(var(--primary), 0.05)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#4A8BCE' }}>🏭 Supplier & Vendor Directory</h3>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem', marginTop: '0.2rem' }}>Approved vendors, KRA PINs & ratings.</p>
            </div>
            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', fontWeight: 'bold' }} onClick={() => setGlobalDrawer('new_supplier')}>+ Add Supplier</button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Supplier Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>KRA PIN</th>
                <th style={{ padding: '0.75rem 1rem' }}>Contact</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
                    No suppliers registered yet. Click "+ Add Supplier".
                  </td>
                </tr>
              ) : (
                suppliers.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#fff' }}>{s.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#38bdf8' }}>{s.kra_pin || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'hsl(var(--text-secondary))' }}>{s.email || s.phone || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#f43f5e', color: '#fff' }} onClick={() => handleDeleteSupplier(s)} title="Remove Supplier">🗑️ Remove</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

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
