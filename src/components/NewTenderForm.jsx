import React, { useState } from 'react'

export default function NewTenderForm() {
  const [formData, setFormData] = useState({
    id: `TND-${Math.floor(Math.random() * 1000)}`,
    name: '',
    client: '',
    client_reference: '',
    category: '',
    contract_value: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('Tender created successfully in the database!');
        window.location.reload(); // Refresh to see it in the UI
      } else {
        alert('Failed to create tender');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Ensure the backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Tender ID (Auto-Generated)</label>
        <input type="text" className="form-control" value={formData.id} disabled />
      </div>
      <div className="form-group">
        <label>Tender Name</label>
        <input type="text" className="form-control" placeholder="e.g., Mombasa Road Expansion" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      </div>
      <div className="form-group">
        <label>Client</label>
        <select className="form-control" required value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})}>
          <option value="">Select Client...</option>
          <option>KeNHA</option>
          <option>KURA</option>
          <option>Athi Water Works</option>
          <option>TechCorp</option>
        </select>
      </div>
      <div className="form-group">
        <label>Client Tender Reference No. (Optional)</label>
        <input type="text" className="form-control" placeholder="e.g., REF-2026-99A" value={formData.client_reference} onChange={e => setFormData({...formData, client_reference: e.target.value})} />
      </div>
      <div className="form-group">
        <label>Tender Category</label>
        <select className="form-control" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
          <option value="">Select Category...</option>
          <option>Supply of goods</option>
          <option>Provision of services</option>
          <option>Construction works</option>
          <option>Mixed contracts</option>
        </select>
      </div>
      <div className="form-group">
        <label>Contract Value (USD)</label>
        <input type="number" className="form-control" placeholder="0.00" required value={formData.contract_value} onChange={e => setFormData({...formData, contract_value: e.target.value})} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Start Date</label>
          <input type="date" className="form-control" />
        </div>
        <div className="form-group">
          <label>Expected Completion</label>
          <input type="date" className="form-control" />
        </div>
      </div>
      <div className="form-group">
        <label>Upload Contract / BOQ</label>
        <div style={{ border: '2px dashed hsl(var(--border))', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', color: 'hsl(var(--text-secondary))' }}>
          Drag and drop files here, or click to browse
        </div>
      </div>
      
      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
        {isSubmitting ? 'Saving to Database...' : 'Create Tender'}
      </button>
    </form>
  )
}
