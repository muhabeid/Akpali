import React, { useState, useEffect } from 'react'
import { PlusCircle, Trash2 } from 'lucide-react'

export default function StockRequisitionForm() {
  const [tenders, setTenders] = useState([])
  const [inventory, setInventory] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    id: `REQ-${Math.floor(Math.random() * 10000)}`,
    tender_id: '',
    request_date: new Date().toISOString().split('T')[0]
  })

  const [items, setItems] = useState([
    { item_name: '', quantity: '' }
  ])

  useEffect(() => {
    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => setTenders(data))
      .catch(err => console.error(err))

    fetch('http://localhost:5000/api/inventory')
      .then(res => res.json())
      .then(data => setInventory(data))
      .catch(err => console.error(err))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tender_id) return alert('Select a Tender / Project');
    setIsSubmitting(true);

    try {
      for (let item of items) {
        if (!item.item_name || !item.quantity) continue;
        
        // Ensure requested quantity doesn't exceed available stock
        const stockItem = inventory.find(i => i.item_name === item.item_name);
        if (!stockItem || stockItem.quantity < parseFloat(item.quantity)) {
          alert(`Insufficient stock for ${item.item_name}. Available: ${stockItem?.quantity || 0}`);
          setIsSubmitting(false);
          return;
        }

        const payload = {
          id: `REQ-${Math.floor(Math.random() * 10000)}`,
          tender_id: formData.tender_id,
          item_name: item.item_name,
          quantity: item.quantity,
          request_date: formData.request_date
        };

        await fetch('http://localhost:5000/api/stock_requisitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      alert('Stock Requisition Submitted successfully! It is now pending approval.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Error submitting requisition.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Select Tender / Project (Cost Center)</label>
        <select className="form-control" required value={formData.tender_id} onChange={e => setFormData({...formData, tender_id: e.target.value})}>
          <option value="">Select Project...</option>
          {tenders.map(t => (
            <option key={t.id} value={t.id}>{t.id} - {t.name}</option>
          ))}
        </select>
        <small style={{ color: 'hsl(var(--text-secondary))', display: 'block', marginTop: '0.5rem' }}>
          Approved requisitions will automatically deduct stock from central inventory and allocate the cost to this project.
        </small>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Request Date</label>
          <input type="date" className="form-control" required value={formData.request_date} onChange={e => setFormData({...formData, request_date: e.target.value})} />
        </div>
      </div>

      <div style={{ background: 'hsla(var(--border), 0.2)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0' }}>Requested Items</h4>
        
        {items.map((item, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.8rem' }}>Inventory Item</label>
              <select className="form-control" required value={item.item_name} onChange={e => {
                const newItems = [...items];
                newItems[index].item_name = e.target.value;
                setItems(newItems);
              }}>
                <option value="">Select Item...</option>
                {inventory.map(inv => (
                  <option key={inv.id} value={inv.item_name}>{inv.item_name} (In Stock: {inv.quantity} {inv.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem' }}>Quantity</label>
              <input type="number" className="form-control" required min="0.1" step="0.1" value={item.quantity} onChange={e => {
                const newItems = [...items];
                newItems[index].quantity = e.target.value;
                setItems(newItems);
              }} />
            </div>
            {items.length > 1 && (
              <button type="button" className="btn" style={{ marginTop: '1.2rem', padding: '0.5rem', color: 'hsl(var(--danger))' }} onClick={() => {
                setItems(items.filter((_, i) => i !== index));
              }}>
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
        
        <button type="button" className="btn" onClick={() => setItems([...items, { item_name: '', quantity: '' }])} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>
          <PlusCircle size={16} /> Add Another Item
        </button>
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Requisition for Approval'}
      </button>
    </form>
  )
}
