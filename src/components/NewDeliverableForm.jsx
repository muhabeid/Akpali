import React, { useState, useEffect } from 'react'

export default function NewDeliverableForm() {
  const [tenders, setTenders] = useState([])
  const [formData, setFormData] = useState({
    id: `DLV-${Math.floor(Math.random() * 1000)}`,
    tender_id: '',
    description: '',
    type: 'Goods',
    billing_method: 'Fixed Price',
    planned_date: '',
    due_date: ''
  })
  const [items, setItems] = useState([{ desc: '', qty: 1 }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => setTenders(data))
      .catch(err => console.error("Could not fetch tenders:", err))
  }, [])

  const handleAddItem = () => {
    setItems([...items, { desc: '', qty: 1 }])
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
    e.preventDefault();
    if (!formData.tender_id) {
      alert("Please select a parent Tender.");
      return;
    }

    setIsSubmitting(true);
    
    // Only send items if type is Goods
    const payload = { ...formData };
    if (formData.type === 'Goods') {
      payload.items = JSON.stringify(items);
    }

    try {
      const res = await fetch('http://localhost:5000/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Deliverable added to Tender successfully!');
        window.location.reload(); 
      } else {
        alert('Failed to create deliverable');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Ensure backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedTender = tenders.find(t => t.id === formData.tender_id);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="form-group">
        <label>Parent Tender</label>
        <select className="form-control" required value={formData.tender_id} onChange={e => setFormData({...formData, tender_id: e.target.value})}>
          <option value="">Select a Tender...</option>
          {tenders.length === 0 ? (
            <option disabled>No tenders found in database</option>
          ) : (
            tenders.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
            ))
          )}
        </select>
        {selectedTender && (
          <small style={{ color: 'hsl(var(--primary))', marginTop: '0.25rem', display: 'block' }}>
            <strong>Client:</strong> {selectedTender.client}
          </small>
        )}
      </div>

      <div className="form-group">
        <label>Deliverable Title / Description</label>
        <input type="text" className="form-control" placeholder="e.g. Supply of 500 Laptops" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Type</label>
          <select className="form-control" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
            <option>Goods</option>
            <option>Service</option>
            <option>Construction</option>
          </select>
        </div>
        <div className="form-group">
          <label>Billing Method</label>
          <select className="form-control" required value={formData.billing_method} onChange={e => setFormData({...formData, billing_method: e.target.value})}>
            <option>Fixed Price</option>
            <option>Milestone</option>
            <option>Time & Materials</option>
            <option>Daily Rate</option>
            <option>Monthly Retainer</option>
            <option>Unit Rate</option>
            <option>Percentage of Contract</option>
          </select>
        </div>
      </div>

      {formData.type === 'Goods' && (
        <div className="form-group">
          <label>Goods to Supply (Items List)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'hsla(var(--border), 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            {items.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                <input type="text" className="form-control" placeholder="Item Description" value={item.desc} onChange={e => handleItemChange(index, 'desc', e.target.value)} required />
                <input type="number" className="form-control" placeholder="Qty" value={item.qty} onChange={e => handleItemChange(index, 'qty', e.target.value)} min="1" required />
                {items.length > 1 && (
                  <button type="button" className="btn" style={{ background: 'hsla(var(--danger), 0.1)', color: 'hsl(var(--danger))', padding: '0.5rem' }} onClick={() => handleRemoveItem(index)}>X</button>
                )}
              </div>
            ))}
            <button type="button" className="btn" onClick={handleAddItem} style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>+ Add Item</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Planned Start Date</label>
          <input type="date" className="form-control" required value={formData.planned_date} onChange={e => setFormData({...formData, planned_date: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input type="date" className="form-control" required value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
        </div>
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Add Deliverable'}
      </button>
    </form>
  )
}
