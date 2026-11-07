import { useState, useEffect } from 'react'
import { VAT_RATES, calculateLineVat, calculateDocumentVatSummary } from '../utils/vatHelper'

export default function SalesQuoteForm({ quoteToEdit = null, onSuccess = null }) {
  const isEditing = Boolean(quoteToEdit)
  const [tenders, setTenders] = useState([])
  const [tenderId, setTenderId] = useState(quoteToEdit?.tender_id || '')
  const [sqId, setSqId] = useState(quoteToEdit?.id || 'Loading SQ ID...')
  const [issueDate, setIssueDate] = useState(quoteToEdit?.issue_date || new Date().toISOString().split('T')[0])
  
  const initialItems = () => {
    if (quoteToEdit?.items) {
      try {
        const parsed = typeof quoteToEdit.items === 'string' ? JSON.parse(quoteToEdit.items) : quoteToEdit.items
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(it => ({
            desc: it.desc || it.description || it.name || '',
            qty: Number(it.qty || it.quantity || 1),
            unit: it.unit || 'PCS',
            unitPrice: Number(it.unitPrice || it.price || it.rate || 0),
            vat_rate: it.vat_rate !== undefined ? String(it.vat_rate) : '16'
          }))
        }
      } catch (e) {
        console.error("Failed to parse quoteToEdit items:", e)
      }
    }
    return [{ desc: '', qty: 1, unit: 'PCS', unitPrice: 0, vat_rate: '16' }]
  }

  const [items, setItems] = useState(initialItems)

  useEffect(() => {
    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => setTenders(data))
      .catch(console.error)

    if (!isEditing) {
      fetch('http://localhost:5000/api/next-id/sq')
        .then(res => res.json())
        .then(data => { if (data && data.id) setSqId(data.id) })
        .catch(console.error)
    }
  }, [isEditing])

  const handleAddItem = () => {
    setItems([...items, { desc: '', qty: 1, unit: 'PCS', unitPrice: 0, vat_rate: '16' }])
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  // Calculate live multi-category VAT summary
  const vatSummary = calculateDocumentVatSummary(items)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!tenderId) {
      alert("Please select a Tender/Project first.")
      return
    }

    const endpoint = isEditing 
      ? `http://localhost:5000/api/sales-quotes/${sqId}` 
      : 'http://localhost:5000/api/sales-quotes'
    
    const method = isEditing ? 'PUT' : 'POST'

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sqId,
          tender_id: tenderId,
          issue_date: issueDate,
          total_value: vatSummary.grandTotal,
          subtotal: vatSummary.netSubtotal,
          vat_amount: vatSummary.totalVat,
          items: JSON.stringify(items)
        })
      })

      if (res.ok) {
        const data = await res.json()
        alert(`✅ Sales Quotation '${sqId}' ${isEditing ? 'updated' : 'generated'} successfully!`)
        if (onSuccess) {
          onSuccess(data.quote || { id: sqId, tender_id: tenderId, issue_date: issueDate, total_value: vatSummary.grandTotal, items: JSON.stringify(items) })
        } else {
          window.location.reload()
        }
      } else {
        const err = await res.json()
        alert("Error: " + (err.error || err.message))
      }
    } catch(err) {
      alert("Error saving Sales Quote: " + err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="form-group">
        <label>Sales Quote #</label>
        <input type="text" className="form-control" value={sqId} disabled style={{ fontWeight: 'bold', color: '#38bdf8' }} />
      </div>

      <div className="form-group">
        <label>Select Tender / Project</label>
        <select className="form-control" value={tenderId} onChange={e => setTenderId(e.target.value)} required>
          <option value="">-- Choose Tender --</option>
          {tenders.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
          ))}
        </select>
        {tenders.find(t => t.id === tenderId) && (
          <small style={{ color: 'hsl(var(--primary))', marginTop: '0.25rem', display: 'block' }}>
            <strong>Quoting To Client:</strong> {tenders.find(t => t.id === tenderId).client}
          </small>
        )}
      </div>

      <div className="form-group">
        <label>Quote Issue Date</label>
        <input type="date" className="form-control" value={issueDate} onChange={e => setIssueDate(e.target.value)} required />
      </div>

      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <label style={{ margin: 0 }}>Quoted Line Items (With Statutory VAT Auto-Calculation)</label>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>16% Standard &bull; 8% Petroleum &bull; 0% Zero-Rated &bull; Exempt</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'hsla(var(--border), 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1fr 1.2fr 1.6fr 1.2fr auto', gap: '0.5rem', fontSize: '0.725rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'hsl(var(--text-secondary))' }}>
            <div>Description</div>
            <div>Qty</div>
            <div>Unit</div>
            <div>Rate (KSh)</div>
            <div>VAT Treatment</div>
            <div style={{ textAlign: 'right' }}>Subtotal (Excl)</div>
            <div></div>
          </div>

          {items.map((item, index) => {
            const lineCalc = calculateLineVat(item.qty, item.unitPrice, item.vat_rate)
            return (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1fr 1.2fr 1.6fr 1.2fr auto', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Item / Service Description" 
                  value={item.desc} 
                  onChange={e => handleItemChange(index, 'desc', e.target.value)} 
                  required 
                />
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Qty" 
                  value={item.qty} 
                  onChange={e => handleItemChange(index, 'qty', Math.max(1, Number(e.target.value)))} 
                  min="1" 
                  step="1" 
                  required 
                />
                <select className="form-control" value={item.unit || 'PCS'} onChange={e => handleItemChange(index, 'unit', e.target.value)}>
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
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Rate (KSh)" 
                  value={item.unitPrice} 
                  onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} 
                  min="0" 
                  step="0.01" 
                  required 
                />
                <select 
                  className="form-control" 
                  value={item.vat_rate || '16'} 
                  onChange={e => handleItemChange(index, 'vat_rate', e.target.value)}
                  style={{ fontSize: '0.8rem', fontWeight: '500' }}
                >
                  {VAT_RATES.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <div style={{ textAlign: 'right', fontWeight: '600', color: 'hsl(var(--text-primary))', fontSize: '0.85rem' }}>
                  KSh {lineCalc.lineSubtotal.toLocaleString()}
                  {lineCalc.lineVat > 0 && (
                    <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 'normal' }}>
                      +VAT: {lineCalc.lineVat.toLocaleString()}
                    </div>
                  )}
                </div>
                {items.length > 1 && (
                  <button type="button" className="btn" style={{ background: 'hsla(var(--danger), 0.1)', color: 'hsl(var(--danger))', padding: '0.4rem 0.6rem' }} onClick={() => handleRemoveItem(index)}>✕</button>
                )}
              </div>
            )
          })}
          
          <button type="button" className="btn" onClick={handleAddItem} style={{ marginTop: '0.5rem', alignSelf: 'flex-start', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>
            + Add Line Item
          </button>
        </div>
      </div>

      {/* AUTO-CALCULATED STATUTORY VAT BREAKDOWN BOX */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#0f172a', border: '1px solid #334155', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', color: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#94a3b8' }}>
          <span>Subtotal (Exclusive of VAT):</span>
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
          <strong style={{ fontSize: '1rem', color: '#22c55e' }}>Quotation Grand Total (Incl. VAT):</strong>
          <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#22c55e' }}>KSh {vatSummary.grandTotal.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
        <button type="submit" className="btn btn-primary" style={{ fontWeight: 'bold', padding: '0.6rem 1.5rem' }}>
          {isEditing ? 'Save & Update Quote' : 'Generate Quote'}
        </button>
      </div>
    </form>
  )
}
