import React, { useState, useEffect, useContext } from 'react'
import { Trash2, PlusCircle } from 'lucide-react'
import { useRole } from '../context/RoleContext'
import { VAT_RATES, calculateLineVat, calculateDocumentVatSummary } from '../utils/vatHelper'

export default function NewPurchaseOrderForm({ onSuccess }) {
  const { currentRole } = useRole();
  const [tenders, setTenders] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [poType, setPoType] = useState('Goods') // 'Goods' or 'Service'
  const [availableLpos, setAvailableLpos] = useState([])
  const [selectedLpoId, setSelectedLpoId] = useState('')
  
  const [formData, setFormData] = useState({
    poNum: 'PO-001',
    supplier: '',
    tender_id: '',
    expected_date: ''
  })

  // Line items for Goods with statutory VAT rate
  const [lineItems, setLineItems] = useState([
    { id: 1, name: '', qty: 1, unit: 'PCS', unitPrice: 0, vat_rate: '16' }
  ])

  // Placeholder for Services
  const [serviceDescription, setServiceDescription] = useState('')
  const [serviceTotal, setServiceTotal] = useState(0)
  const [serviceVatRate, setServiceVatRate] = useState('16')

  useEffect(() => {
    fetch('http://localhost:5000/api/next-id/po')
      .then(res => res.json())
      .then(data => {
        if (data && data.id) setFormData(prev => ({ ...prev, poNum: data.id }))
      })
      .catch(err => console.error("Could not fetch next PO ID:", err))

    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => setTenders(data))
      .catch(err => console.error("Could not fetch tenders:", err))
  }, [])

  // When tender changes, update available LPOs for auto-fill
  useEffect(() => {
    if (formData.tender_id && formData.tender_id !== 'COMPANY_EXPENSE') {
      const tender = tenders.find(t => t.id === formData.tender_id);
      if (tender && tender.lpos) {
        setAvailableLpos(tender.lpos);
      } else {
        setAvailableLpos([]);
      }
    } else {
      setAvailableLpos([]);
    }
    setSelectedLpoId(''); // Reset LPO selection when tender changes
  }, [formData.tender_id, tenders]);

  const handleLpoSelect = (e) => {
    const lpoId = e.target.value;
    setSelectedLpoId(lpoId);
    
    if (lpoId) {
      const lpo = availableLpos.find(l => l.id === lpoId);
      if (lpo && lpo.items) {
        try {
          const parsedItems = typeof lpo.items === 'string' ? JSON.parse(lpo.items) : lpo.items;
          const mappedItems = parsedItems.map((item, index) => ({
            id: Date.now() + index,
            name: item.desc || item.description || '',
            qty: item.qty || item.quantity || 1,
            unit: item.unit || 'PCS',
            unitPrice: 0, // Default to 0 since we're sourcing from a supplier now
            vat_rate: item.vat_rate !== undefined ? String(item.vat_rate) : '16'
          }));
          
          if (mappedItems.length > 0) {
            setLineItems(mappedItems);
            setPoType('Goods'); // Auto-switch to goods if items are populated
          }
        } catch (err) {
          console.error("Failed to parse LPO items for auto-fill", err);
        }
      }
    }
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now(), name: '', qty: 1, unit: 'PCS', unitPrice: 0, vat_rate: '16' }])
  }

  const removeLineItem = (id) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id))
    }
  }

  const updateLineItem = (id, field, value) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  // Live VAT Calculations
  const vatSummary = poType === 'Goods' 
    ? calculateDocumentVatSummary(lineItems)
    : calculateDocumentVatSummary([{ qty: 1, unitPrice: serviceTotal, vat_rate: serviceVatRate }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        id: formData.poNum,
        tender_id: formData.tender_id,
        supplier_name: formData.supplier,
        type: poType,
        expected_date: formData.expected_date,
        total_value: vatSummary.grandTotal,
        subtotal: vatSummary.netSubtotal,
        vat_amount: vatSummary.totalVat,
        status: currentRole === 'Staff' ? 'Awaiting Approval' : 'Pending Delivery',
        items: poType === 'Goods' 
          ? JSON.stringify(lineItems) 
          : JSON.stringify([{ desc: serviceDescription, unit: 'LOT', qty: 1, unitPrice: Number(serviceTotal), vat_rate: serviceVatRate }])
      };

      const res = await fetch('http://localhost:5000/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (currentRole === 'Staff') {
          alert('Purchase Order drafted successfully and sent to Manager for approval.');
        } else {
          alert(`✅ Purchase Order '${formData.poNum}' raised and dispatched successfully!`);
        }
        window.location.reload();
      } else {
        alert('Failed to raise PO');
      }
    } catch (err) {
      console.error(err);
      alert('Error raising PO');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>PO Number (Linear Generator)</label>
          <input type="text" className="form-control" value={formData.poNum} disabled style={{ fontWeight: 'bold', color: '#38bdf8' }} />
        </div>
        <div className="form-group">
          <label>Supplier</label>
          <select className="form-control" required value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})}>
            <option value="">Select Supplier...</option>
            <option value="BuildMat Ltd">BuildMat Ltd</option>
            <option value="Steel & Timber Co.">Steel & Timber Co.</option>
            <option value="Nairobi Cement Providers">Nairobi Cement Providers</option>
            <option value="Tech Solutions Inc">Tech Solutions Inc (Software/IT)</option>
            <option value="OfficeMax Kenya">OfficeMax Kenya (Stationery)</option>
          </select>
        </div>
      </div>

      {/* COST ALLOCATION */}
      <div style={{ padding: '1rem', background: 'hsla(var(--primary), 0.05)', borderLeft: '4px solid hsl(var(--primary))', borderRadius: 'var(--radius-sm)' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: 'hsl(var(--primary))' }}>Cost Allocation & Auto-Fill</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Link to Project / Tender</label>
            <select className="form-control" required value={formData.tender_id} onChange={e => setFormData({...formData, tender_id: e.target.value})}>
              <option value="">-- Make a Selection --</option>
              
              <optgroup label="General Operations">
                <option value="COMPANY_EXPENSE" style={{ fontWeight: 'bold' }}>Company Overhead / Internal Services (No Project)</option>
              </optgroup>
              
              <optgroup label="Active Projects/Tenders">
                {tenders.map(t => (
                  <option key={t.id} value={t.id}>{t.id} - {t.name}</option>
                ))}
              </optgroup>
            </select>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.5rem' }}>
              Choose <strong>"Company Overhead"</strong> if this Purchase Order is for general company maintenance.
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Auto-fill items from Client LPO</label>
            <select className="form-control" value={selectedLpoId} onChange={handleLpoSelect} disabled={availableLpos.length === 0}>
              <option value="">{availableLpos.length === 0 ? 'Select a project first to see LPOs...' : '-- Optional: Select LPO to auto-fill --'}</option>
              {availableLpos.map(lpo => (
                <option key={lpo.id} value={lpo.id}>{lpo.id}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.5rem' }}>
              Selecting an LPO will instantly populate the line items below. You can delete rows you don't need.
            </p>
          </div>
        </div>
      </div>

      <hr style={{ border: '0', borderTop: '1px solid hsla(var(--border), 0.5)' }} />

      {/* PO TYPE SELECTION */}
      <div className="form-group">
        <label>Purchase Order Type</label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" name="poType" checked={poType === 'Goods'} onChange={() => setPoType('Goods')} /> 
            Buying Physical Items (Goods)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" name="poType" checked={poType === 'Service'} onChange={() => setPoType('Service')} /> 
            Procuring a Service
          </label>
        </div>
      </div>

      {/* DYNAMIC CONTENTS: GOODS OR SERVICES */}
      {poType === 'Goods' ? (
        <div style={{ background: 'var(--bg-card)', padding: '1rem', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0 }}>Line Items & Statutory VAT Treatment</h4>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>16% Standard &bull; 8% Fuel &bull; 0% Zero &bull; Exempt</span>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--text-secondary))' }}>
                <th style={{ paddingBottom: '0.5rem', width: '32%' }}>Item Description</th>
                <th style={{ paddingBottom: '0.5rem', width: '10%' }}>Qty</th>
                <th style={{ paddingBottom: '0.5rem', width: '12%' }}>Unit</th>
                <th style={{ paddingBottom: '0.5rem', width: '16%' }}>Rate (KSh)</th>
                <th style={{ paddingBottom: '0.5rem', width: '18%' }}>VAT Rate</th>
                <th style={{ paddingBottom: '0.5rem', width: '12%', textAlign: 'right' }}>Subtotal</th>
                <th style={{ paddingBottom: '0.5rem', width: '4%' }}></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => {
                const sub = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0)
                return (
                  <tr key={item.id}>
                    <td style={{ padding: '0.5rem 0' }}>
                      <input type="text" className="form-control" placeholder="e.g. Bags of Cement" value={item.name} onChange={e => updateLineItem(item.id, 'name', e.target.value)} required />
                    </td>
                    <td style={{ padding: '0.5rem 0 0.5rem 0.5rem' }}>
                      <input type="number" className="form-control" min="1" value={item.qty} onChange={e => updateLineItem(item.id, 'qty', e.target.value)} required />
                    </td>
                    <td style={{ padding: '0.5rem 0 0.5rem 0.5rem' }}>
                      <select className="form-control" value={item.unit || 'PCS'} onChange={e => updateLineItem(item.id, 'unit', e.target.value)}>
                        <option value="PCS">PCS</option>
                        <option value="KG">KG</option>
                        <option value="TONS">TONS</option>
                        <option value="MTRS">MTRS</option>
                        <option value="BAGS">BAGS</option>
                        <option value="LOT">LOT</option>
                        <option value="SETS">SETS</option>
                        <option value="HRS">HRS</option>
                        <option value="DAYS">DAYS</option>
                        <option value="MONTHS">MONTHS</option>
                        <option value="TRIPS">TRIPS</option>
                        <option value="SQM">SQM</option>
                        <option value="CBM">CBM</option>
                        <option value="LTRS">LTRS</option>
                        <option value="BOX">BOX</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem 0 0.5rem 0.5rem' }}>
                      <input type="number" className="form-control" min="0" step="0.01" value={item.unitPrice} onChange={e => updateLineItem(item.id, 'unitPrice', e.target.value)} required />
                    </td>
                    <td style={{ padding: '0.5rem 0 0.5rem 0.5rem' }}>
                      <select 
                        className="form-control" 
                        value={item.vat_rate || '16'} 
                        onChange={e => updateLineItem(item.id, 'vat_rate', e.target.value)}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {VAT_RATES.map(v => (
                          <option key={v.id} value={v.id}>{v.shortLabel} - {v.label.split(' ')[0]}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem 0 0.5rem 0.5rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      KSh {sub.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.5rem 0 0.5rem 0.5rem', textAlign: 'right' }}>
                      <button type="button" className="btn" style={{ padding: '0.5rem', color: 'hsl(var(--danger))', background: 'transparent' }} onClick={() => removeLineItem(item.id)} disabled={lineItems.length === 1}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          <button type="button" className="btn" onClick={addLineItem} style={{ background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>
            <PlusCircle size={16} style={{ marginRight: '0.5rem' }} /> Add Line Item
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card)', padding: '1rem', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)' }}>
          <div className="form-group">
            <label>Detailed Description of Service Required</label>
            <textarea 
              className="form-control" 
              rows="4" 
              placeholder="e.g. Legal auditing for Q3, software maintenance contract, transport services..." 
              required 
              value={serviceDescription} 
              onChange={e => setServiceDescription(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Service Cost / Fee (Excl. VAT)</label>
              <input type="number" className="form-control" min="0" step="0.01" required value={serviceTotal} onChange={e => setServiceTotal(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Service VAT Rate</label>
              <select className="form-control" value={serviceVatRate} onChange={e => setServiceVatRate(e.target.value)}>
                {VAT_RATES.map(v => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* AUTO-CALCULATED STATUTORY VAT BREAKDOWN BOX */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#0f172a', border: '1px solid #334155', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', color: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#94a3b8' }}>
          <span>Order Subtotal (Exclusive of VAT):</span>
          <span style={{ fontWeight: '600', color: '#e2e8f0' }}>KSh {vatSummary.netSubtotal.toLocaleString()}</span>
        </div>

        {vatSummary.vat16Base > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#38bdf8', paddingLeft: '0.75rem', borderLeft: '2px solid #0284c7' }}>
            <span>Standard Rate VAT (16% on KSh {vatSummary.vat16Base.toLocaleString()}):</span>
            <span style={{ fontWeight: '600' }}>KSh {vatSummary.vat16Amount.toLocaleString()}</span>
          </div>
        )}

        {vatSummary.vat8Base > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#f59e0b', paddingLeft: '0.75rem', borderLeft: '2px solid #d97706' }}>
            <span>Reduced Rate VAT (8% Petroleum on KSh {vatSummary.vat8Base.toLocaleString()}):</span>
            <span style={{ fontWeight: '600' }}>KSh {vatSummary.vat8Amount.toLocaleString()}</span>
          </div>
        )}

        {vatSummary.zeroRatedBase > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#10b981', paddingLeft: '0.75rem', borderLeft: '2px solid #059669' }}>
            <span>Zero-Rated Supplies (0% on KSh {vatSummary.zeroRatedBase.toLocaleString()}):</span>
            <span style={{ fontWeight: '600' }}>KSh 0</span>
          </div>
        )}

        {vatSummary.exemptBase > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#a855f7', paddingLeft: '0.75rem', borderLeft: '2px solid #7c3aed' }}>
            <span>Exempt Supplies (No VAT on KSh {vatSummary.exemptBase.toLocaleString()}):</span>
            <span style={{ fontWeight: '600' }}>KSh 0</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#f59e0b', borderTop: '1px dashed #334155', paddingTop: '0.4rem', fontWeight: 'bold' }}>
          <span>Total Calculated VAT:</span>
          <span>KSh {vatSummary.totalVat.toLocaleString()}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '0.65rem', marginTop: '0.2rem' }}>
          <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>Total Purchase Order Value (Incl. VAT):</strong>
          <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#38bdf8' }}>KSh {vatSummary.grandTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* FOOTER: EXPECTED DATE & SUBMIT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Expected Delivery / Completion Date</label>
          <input type="date" className="form-control" required value={formData.expected_date} onChange={e => setFormData({...formData, expected_date: e.target.value})} />
        </div>
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', fontWeight: 'bold', padding: '0.75rem' }} disabled={isSubmitting}>
        {isSubmitting ? 'Raising PO...' : 'Raise Purchase Order'}
      </button>
    </form>
  )
}
