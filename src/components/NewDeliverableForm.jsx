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
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => setTenders(data))
      .catch(err => console.error("Could not fetch tenders:", err))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tender_id) {
      alert("Please select a parent Tender.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="form-group">
        <label>Deliverable ID (Auto-Generated)</label>
        <input type="text" className="form-control" value={formData.id} disabled />
      </div>
      
      <div className="form-group">
        <label>Parent Tender</label>
        <select className="form-control" required value={formData.tender_id} onChange={e => setFormData({...formData, tender_id: e.target.value})}>
          <option value="">Select a Tender...</option>
          {tenders.length === 0 ? (
            <option disabled>No tenders found in database</option>
          ) : (
            tenders.map(t => (
              <option key={t.id} value={t.id}>{t.id} - {t.name}</option>
            ))
          )}
        </select>
      </div>

      <div className="form-group">
        <label>Description</label>
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
