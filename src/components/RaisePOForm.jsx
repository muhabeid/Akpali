import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function RaisePOForm() {
  const [items, setItems] = useState([{ id: 1, desc: '', qty: 0, cost: 0 }])

  const addItem = () => {
    setItems([...items, { id: Date.now(), desc: '', qty: 0, cost: 0 }])
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
    const c = parseFloat(item.cost) || 0
    return sum + (q * c)
  }, 0)

  const remainingBudget = 50000;
  const overBudget = totalValue > remainingBudget;

  return (
    <form>
      <div className="form-group">
        <label>Supplier</label>
        <select className="form-control">
          <option>Select Supplier...</option>
          <option>BuildMat Ltd</option>
          <option>Steel & Timber Co.</option>
        </select>
      </div>
      <div className="form-group">
        <label>Link to Tender</label>
        <select className="form-control">
          <option>TND-001 - Mombasa Road Expansion</option>
          <option>TND-002 - Office Block B Supply</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Purchase Items</label>
        <div style={{ background: 'hsla(var(--border), 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem', flex: 1 }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Item Name" 
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
                  placeholder="Unit Cost" 
                  value={item.cost || ''}
                  onChange={(e) => updateItem(item.id, 'cost', e.target.value)}
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
        <label>Expected Delivery Date</label>
        <input type="date" className="form-control" />
      </div>

      <div className="form-group">
        <label>Total PO Value</label>
        <input 
          type="text" 
          className="form-control" 
          value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          disabled 
          style={{ opacity: 0.7, fontWeight: 'bold' }} 
        />
      </div>

      <div style={{ padding: '1rem', background: overBudget ? 'hsla(var(--danger), 0.1)' : 'hsla(var(--success), 0.1)', borderLeft: `4px solid ${overBudget ? 'hsl(var(--danger))' : 'hsl(var(--success))'}`, borderRadius: 'var(--radius-sm)', color: overBudget ? 'hsl(var(--danger))' : 'hsl(var(--success))', fontSize: '0.875rem' }}>
        <strong>Budget Check:</strong> Tender TND-001 has ${remainingBudget.toLocaleString()} remaining budget.
        {overBudget && <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>EXCEEDED: This PO will require Director Approval.</div>}
      </div>
    </form>
  )
}
