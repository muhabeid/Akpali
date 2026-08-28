import { useState, useEffect } from 'react'

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
            unitPrice: Number(it.unitPrice || it.price || it.rate || 0)
          }))
        }
      } catch (e) {
        console.error("Failed to parse quoteToEdit items:", e)
      }
    }
    return [{ desc: '', qty: 1, unit: 'PCS', unitPrice: 0 }]
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
    setItems([...items, { desc: '', qty: 1, unit: 'PCS', unitPrice: 0 }])
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

  const calculateSubtotal = (item) => {
    const q = Number(item.qty || 1)
    const p = Number(item.unitPrice || 0)
    return q * p
  }

  const totalValue = items.reduce((sum, item) => sum + calculateSubtotal(item), 0)

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
          total_value: totalValue,
          items: JSON.stringify(items)
        })
      })

      if (res.ok) {
        const data = await res.json()
        alert(`✅ Sales Quotation '${sqId}' ${isEditing ? 'updated' : 'generated'} successfully!`)
        if (onSuccess) {
          onSuccess(data.quote || { id: sqId, tender_id: tenderId, issue_date: issueDate, total_value: totalValue, items: JSON.stringify(items) })
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
        <label>Quoted Line Items (Description, Quantity, Unit & Price/Rate)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'hsla(var(--border), 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.2fr 1.5fr 1.5fr auto', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'hsl(var(--text-secondary))' }}>
            <div>Description</div>
            <div>Qty</div>
            <div>Unit</div>
            <div>Rate (KSh)</div>
            <div>Subtotal</div>
            <div></div>
          </div>
          {items.map((item, index) => {
            const sub = calculateSubtotal(item)
            return (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.2fr 1.5fr 1.5fr auto', gap: '0.5rem', alignItems: 'center' }}>
                <input type="text" className="form-control" placeholder="Item / Service Description" value={item.desc} onChange={e => handleItemChange(index, 'desc', e.target.value)} required />
                <input type="number" className="form-control" placeholder="Qty" value={item.qty} onChange={e => handleItemChange(index, 'qty', Math.max(1, Number(e.target.value)))} min="1" step="1" required />
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
                <input type="number" className="form-control" placeholder="Rate (KSh)" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} min="0" step="0.01" required />
                <div style={{ fontWeight: 'bold', color: 'hsl(var(--primary))', fontSize: '0.85rem' }}>
                  KSh {sub.toLocaleString()}
                </div>
                {items.length > 1 && (
                  <button type="button" className="btn" style={{ background: 'hsla(var(--danger), 0.1)', color: 'hsl(var(--danger))', padding: '0.4rem 0.6rem' }} onClick={() => handleRemoveItem(index)}>✕</button>
                )}
              </div>
            )
          })}
          <button type="button" className="btn" onClick={handleAddItem} style={{ marginTop: '0.5rem', alignSelf: 'flex-start', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>+ Add Line Item</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsla(var(--success), 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
        <strong style={{ color: 'hsl(var(--success))' }}>Quotation Grand Total:</strong>
        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'hsl(var(--success))' }}>KSh {totalValue.toLocaleString()}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-primary">{isEditing ? 'Save & Update Quote' : 'Generate Quote'}</button>
      </div>
    </form>
  )
}
