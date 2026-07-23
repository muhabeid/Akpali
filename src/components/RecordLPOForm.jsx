import React, { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function RecordLPOForm() {
  const [tenders, setTenders] = useState([])
  const [items, setItems] = useState([{ id: 1, desc: '', qty: 0, price: 0 }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    id: `LPO-2026-${Math.floor(Math.random() * 10000)}`,
    tender_id: '',
    client_reference: '',
    issue_date: '',
    due_date: ''
  })

  useEffect(() => {
    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => setTenders(data))
      .catch(err => console.error("Could not fetch tenders:", err))
  }, [])

  const addItem = () => {
    setItems([...items, { id: Date.now(), desc: '', qty: 0, price: 0 }])
  }

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id, field, value) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const totalValue = items.reduce((sum, item) => {
    const q = parseFloat(item.qty) || 0
    const p = parseFloat(item.price) || 0
    return sum + (q * p)
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/lpos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          total_value: totalValue,
          items: JSON.stringify(items)
        })
      });

      if (res.ok) {
        alert('LPO Recorded successfully!');
        window.location.reload();
      } else {
        alert('Failed to record LPO');
      }
    } catch (err) {
      console.error(err);
      alert('Error recording LPO');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>LPO Number (Auto)</label>
        <input type="text" className="form-control" value={formData.id} disabled />
      </div>
      <div className="form-group">
        <label>Link to Tender</label>
        <select className="form-control" required value={formData.tender_id} onChange={e => setFormData({...formData, tender_id: e.target.value})}>
          <option value="">Select a Tender...</option>
          {tenders.length === 0 ? (
            <option disabled>No Tenders found. Create one first.</option>
          ) : (
            tenders.map(t => (
              <option key={t.id} value={t.id}>{t.id} - {t.name}</option>
            ))
          )}
        </select>
      </div>
      <div className="form-group">
        <label>Client LPO Reference No. (Optional)</label>
        <input type="text" className="form-control" placeholder="e.g., PO-456-XYZ" value={formData.client_reference} onChange={e => setFormData({...formData, client_reference: e.target.value})} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Issue Date</label>
          <input type="date" className="form-control" required value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input type="date" className="form-control" required value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
        </div>
      </div>
      
      <div className="form-group">
        <label>LPO Items</label>
        <div style={{ background: 'hsla(var(--border), 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem', flex: 1 }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Description" 
                  value={item.desc}
                  onChange={(e) => updateItem(item.id, 'desc', e.target.value)}
                />
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Qty" 
                  value={item.qty || ''}
                  onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                />
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Unit Price" 
                  value={item.price || ''}
                  onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                />
              </div>
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(item.id)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--danger))', cursor: 'pointer', padding: '0.5rem' }}>
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItem} className="btn" style={{ background: 'transparent', color: 'hsl(var(--primary))', padding: '0.5rem 0', marginTop: '0.5rem' }}>
            <Plus size={16}/> Add Item Row
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Total Value (Auto-calculated)</label>
        <input 
          type="text" 
          className="form-control" 
          value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          disabled 
          style={{ opacity: 0.7, fontWeight: 'bold', color: 'hsl(var(--success))' }} 
        />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
        {isSubmitting ? 'Recording LPO...' : 'Record LPO'}
      </button>
    </form>
  )
}
