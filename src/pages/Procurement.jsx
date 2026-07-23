import React, { useState, useEffect } from 'react'
import Drawer from '../components/Drawer'
import RecordGRNForm from '../components/RecordGRNForm'
import GenerateRFQForm from '../components/GenerateRFQForm'

export default function Procurement({ setGlobalDrawer }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [pos, setPos] = useState([])
  const [rfqs, setRfqs] = useState([])
  const [inventory, setInventory] = useState([])
  const [isGRNDrawerOpen, setGRNDrawerOpen] = useState(false)
  const [isRFQDrawerOpen, setRFQDrawerOpen] = useState(false)
  const [expandedRFQ, setExpandedRFQ] = useState(null)
  const [expandedPO, setExpandedPO] = useState(null)

  const renderItems = (itemsString) => {
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
                <th style={{ padding: '0.5rem' }}>Details (Price/Unit)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid hsla(var(--border), 0.5)', fontSize: '0.875rem' }}>
                  <td style={{ padding: '0.5rem' }}>{item.desc || item.description || item.name || '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{item.qty || item.quantity || 1}</td>
                  <td style={{ padding: '0.5rem' }}>
                    {item.unitPrice !== undefined ? `$${Number(item.unitPrice).toLocaleString()}` : (item.unit || '-')}
                  </td>
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
      .then(data => setPos(data))
      .catch(err => console.error("Could not fetch POs:", err))

    fetch('http://localhost:5000/api/rfqs')
      .then(res => res.json())
      .then(data => setRfqs(data))
      .catch(err => console.error("Could not fetch RFQs:", err))

    fetch('http://localhost:5000/api/inventory')
      .then(res => res.json())
      .then(data => setInventory(data))
      .catch(err => console.error("Could not fetch inventory:", err))
  }, [])

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
          <span className="stat-value">$65,500</span>
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
                    <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <td colSpan="6" style={{ padding: 0 }}>
                        {renderItems(rfq.items)}
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

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {/* PO Tracking Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', flex: 2 }}>
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
                    <td style={{ padding: '1rem', textAlign: 'right' }}>${po.total_value.toLocaleString()}</td>
                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`badge ${po.status === 'Delivered' ? 'badge-success' : po.status === 'Awaiting Approval' ? 'badge-danger' : 'badge-warning'}`}>
                        {po.status}
                      </span>
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
                    <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <td colSpan="5" style={{ padding: 0 }}>
                        {renderItems(po.items)}
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

        {/* Inventory Quick View */}
        <div className="card" style={{ flex: 1 }}>
          <h3>Live Inventory Engine</h3>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginBottom: '1rem' }}>Automatically updated by Goods Receipt Notes (GRNs).</p>
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
