import React, { useState, useEffect, useContext } from 'react'
import { Trash2, PlusCircle } from 'lucide-react'
import { RoleContext } from '../App'

export default function NewPurchaseOrderForm() {
  const { currentRole } = useContext(RoleContext);
  const [tenders, setTenders] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [poType, setPoType] = useState('Goods') // 'Goods' or 'Service'
  const [availableLpos, setAvailableLpos] = useState([])
  const [selectedLpoId, setSelectedLpoId] = useState('')
  
  const [formData, setFormData] = useState({
    poNum: `PO-2023-${Math.floor(Math.random() * 1000)}`,
    supplier: '',
    tender_id: '',
    expected_date: ''
  })

  // Line items for Goods
  const [lineItems, setLineItems] = useState([
    { id: 1, name: '', qty: 1, unitPrice: 0 }
  ])

  // Placeholder for Services
  const [serviceDescription, setServiceDescription] = useState('')
  const [serviceTotal, setServiceTotal] = useState(0)

  useEffect(() => {
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
            unitPrice: 0 // Default to 0 since we're sourcing from a supplier now
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
    setLineItems([...lineItems, { id: Date.now(), name: '', qty: 1, unitPrice: 0 }])
  }

  const removeLineItem = (id) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id))
    }
  }

  const updateLineItem = (id, field, value) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const calculateTotal = () => {
    if (poType === 'Service') return Number(serviceTotal);
    return lineItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0);
  }

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
        total_value: calculateTotal(),
        status: currentRole === 'Staff' ? 'Awaiting Approval' : 'Pending Delivery',
        items: poType === 'Goods' ? JSON.stringify(lineItems) : JSON.stringify([{ desc: serviceDescription }])
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
          alert('Purchase Order raised and dispatched successfully!');
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
          <label>PO Number (Auto)</label>
          <input type="text" className="form-control" value={formData.poNum} disabled />
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
          <h4 style={{ margin: '0 0 1rem 0' }}>Line Items</h4>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))', textAlign: 'left' }}>
                <th style={{ paddingBottom: '0.5rem', width: '50%' }}>Item Description</th>
                <th style={{ paddingBottom: '0.5rem', width: '15%' }}>Qty</th>
                <th style={{ paddingBottom: '0.5rem', width: '25%' }}>Unit Price ($)</th>
                <th style={{ paddingBottom: '0.5rem', width: '10%' }}></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ padding: '0.5rem 0' }}>
                    <input type="text" className="form-control" placeholder="e.g. Bags of Cement" value={item.name} onChange={e => updateLineItem(item.id, 'name', e.target.value)} required />
                  </td>
                  <td style={{ padding: '0.5rem 0 0.5rem 0.5rem' }}>
                    <input type="number" className="form-control" min="1" value={item.qty} onChange={e => updateLineItem(item.id, 'qty', e.target.value)} required />
                  </td>
                  <td style={{ padding: '0.5rem 0 0.5rem 0.5rem' }}>
                    <input type="number" className="form-control" min="0" step="0.01" value={item.unitPrice} onChange={e => updateLineItem(item.id, 'unitPrice', e.target.value)} required />
                  </td>
                  <td style={{ padding: '0.5rem 0 0.5rem 0.5rem', textAlign: 'right' }}>
                    <button type="button" className="btn" style={{ padding: '0.5rem', color: 'hsl(var(--danger))', background: 'transparent' }} onClick={() => removeLineItem(item.id)} disabled={lineItems.length === 1}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button type="button" className="btn" onClick={addLineItem} style={{ background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>
            <PlusCircle size={16} style={{ marginRight: '0.5rem' }} /> Add Line Item
          </button>
        </div>
      ) : (
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
      )}

      {/* FOOTER: TOTAL & DATE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Expected Delivery / Completion Date</label>
          <input type="date" className="form-control" required value={formData.expected_date} onChange={e => setFormData({...formData, expected_date: e.target.value})} />
        </div>
        
        {poType === 'Service' ? (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Total Value (USD)</label>
            <input type="number" className="form-control" min="0" step="0.01" required value={serviceTotal} onChange={e => setServiceTotal(e.target.value)} />
          </div>
        ) : (
          <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', textAlign: 'right', border: '1px solid hsl(var(--border))' }}>
            <span style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>Calculated Total Value</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>
              ${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        )}
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
        {isSubmitting ? 'Raising PO...' : 'Raise Purchase Order'}
      </button>
    </form>
  )
}
