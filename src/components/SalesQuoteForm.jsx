import { useState, useEffect } from 'react'

export default function SalesQuoteForm() {
  const [tenders, setTenders] = useState([])
  const [tenderId, setTenderId] = useState('')
  const [sqId, setSqId] = useState('Loading SQ ID...')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState([{ desc: '', unit: 'PCS', unitPrice: 0 }])

  useEffect(() => {
    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => setTenders(data))
      .catch(console.error)

    fetch('http://localhost:5000/api/next-id/sq')
      .then(res => res.json())
      .then(data => { if (data && data.id) setSqId(data.id) })
      .catch(console.error)
  }, [])

  const handleAddItem = () => {
    setItems([...items, { desc: '', unit: 'PCS', unitPrice: 0 }])
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!tenderId) {
      alert("Please select a Tender/Project first.")
      return
    }

    const total_value = items.reduce((sum, item) => sum + Number(item.unitPrice || 0), 0)

    try {
      const res = await fetch('http://localhost:5000/api/sales-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sqId,
          tender_id: tenderId,
          issue_date: issueDate,
          total_value,
          items: JSON.stringify(items)
        })
      })

      if (res.ok) {
        alert(`✅ Sales Quotation '${sqId}' generated successfully!`)
        window.location.reload()
      } else {
        const err = await res.json()
        alert("Error: " + err.message)
      }
    } catch(err) {
      alert("Error: " + err.message)
    }
  }

  const totalValue = items.reduce((sum, item) => sum + Number(item.unitPrice || 0), 0)

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="form-group">
        <label>Sales Quote # (Linear Generator)</label>
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
            <strong>Quoting To:</strong> {tenders.find(t => t.id === tenderId).client}
          </small>
        )}
        <small style={{ color: 'hsl(var(--text-secondary))', display: 'block', marginTop: '0.25rem' }}>Which project are you quoting for?</small>
      </div>

      <div className="form-group">
        <label>Quote Issue Date</label>
        <input type="date" className="form-control" value={issueDate} onChange={e => setIssueDate(e.target.value)} required />
      </div>

      <div className="form-group">
        <label>Uniform Unit Rates (Description, Unit of Measurement & Price/Rate)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'hsla(var(--border), 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 2fr auto', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'hsl(var(--text-secondary))' }}>
            <div>Description</div>
            <div>Unit of Measurement</div>
            <div>Quoted Price (KSh per Unit)</div>
            <div></div>
          </div>
          {items.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 2fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <input type="text" className="form-control" placeholder="Item / Service Description" value={item.desc} onChange={e => handleItemChange(index, 'desc', e.target.value)} required />
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
              <input type="number" className="form-control" placeholder="Price (KSh per Unit)" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} min="0" step="0.01" required />
              {items.length > 1 && (
                <button type="button" className="btn" style={{ background: 'hsla(var(--danger), 0.1)', color: 'hsl(var(--danger))', padding: '0.5rem' }} onClick={() => handleRemoveItem(index)}>X</button>
              )}
            </div>
          ))}
          <button type="button" className="btn" onClick={handleAddItem} style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>+ Add Quoted Rate</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsla(var(--success), 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
        <strong style={{ color: 'hsl(var(--success))' }}>Quotation Rate Schedule Sum:</strong>
        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'hsl(var(--success))' }}>KSh {totalValue.toLocaleString()}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-primary">Generate Quote</button>
      </div>
    </form>
  )
}
