import React, { useState, useEffect } from 'react'

export default function NewTenderForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    id: 'TND-001',
    name: '',
    client: '',
    client_reference: '',
    category: 'Framework Agreement',
    contract_type: 'Framework Call-Off Agreement',
    contract_period: '24 Months',
    contract_value: ''
  });

  const [clientsList, setClientsList] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Fetch Next Linear Tender ID
    fetch('http://localhost:5000/api/next-id/tender')
      .then(r => r.json())
      .then(data => {
        if (data && data.id) setFormData(prev => ({ ...prev, id: data.id }))
      })
      .catch(err => console.error('Failed to fetch next tender ID:', err))

    // Fetch Clients Directory from Procurement Module
    fetch('http://localhost:5000/api/clients')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setClientsList(data)
      })
      .catch(err => console.error('Failed to fetch clients:', err))
  }, [])

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
        alert(`✅ ${formData.contract_type === 'Framework Call-Off Agreement' ? 'Framework Agreement' : 'Tender'} '${formData.id}' created successfully!`);
        if (onSuccess) onSuccess();
        window.location.reload();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`❌ Failed to create tender: ${errorData.message || errorData.details?.[0]?.message || 'Validation or Server Error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Ensure the backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontWeight: 'bold' }}>Tender ID (Auto-Linear)</label>
        <input type="text" className="form-control" value={formData.id} disabled style={{ fontWeight: 'bold', color: '#38bdf8' }} />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontWeight: 'bold' }}>Tender / Project Name *</label>
        <input type="text" className="form-control" placeholder="e.g., 2-Year Framework Agreement for Road Maintenance Material Supply" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold' }}>Client Organization *</label>
          <select className="form-control" required value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})}>
            <option value="">Select Client from Procurement Directory...</option>
            {clientsList.map(c => (
              <option key={c.id} value={c.name}>{c.name} ({c.id})</option>
            ))}
          </select>
          {clientsList.length === 0 && (
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: 'hsl(var(--warning))' }}>
              ⚠️ No clients found in directory. Please register client in 🛒 Procurement Module first.
            </p>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold' }}>Client Reference / Bid #</label>
          <input type="text" className="form-control" placeholder="e.g., KeNHA/FW/2026/042" value={formData.client_reference} onChange={e => setFormData({...formData, client_reference: e.target.value})} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold' }}>Contract Type *</label>
          <select className="form-control" required value={formData.contract_type} onChange={e => setFormData({...formData, contract_type: e.target.value, category: e.target.value === 'Framework Call-Off Agreement' ? 'Framework Agreement' : formData.category})}>
            <option value="Framework Call-Off Agreement">🤝 Framework Agreement (Multi-Year Call-Off)</option>
            <option value="Standard Fixed-Sum Tender">📜 Standard Fixed-Sum Lump Contract</option>
            <option value="Term Maintenance Contract">🛠️ Term Maintenance Service Contract</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold' }}>Tender Category *</label>
          <select className="form-control" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option value="Framework Agreement">🤝 Framework Agreement (Long-Term)</option>
            <option value="Civil Works">🏗️ Civil Works & Infrastructure</option>
            <option value="Supply Chain">📦 Supply Chain & Material Supply</option>
            <option value="Maintenance & Services">🛠️ Maintenance & Term Services</option>
            <option value="Consulting">📊 Technical Consulting & Advisory</option>
            <option value="ICT Infrastructure">💻 ICT Infrastructure & Systems</option>
          </select>
        </div>
      </div>

      {formData.contract_type === 'Framework Call-Off Agreement' && (
        <div style={{ background: 'hsla(var(--primary), 0.05)', border: '1px solid hsla(var(--primary), 0.2)', padding: '0.85rem', borderRadius: '8px' }}>
          <strong style={{ fontSize: '0.85rem', color: '#38bdf8', display: 'block', marginBottom: '0.3rem' }}>
            💡 Long-Term Framework Structure:
          </strong>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            Framework agreements run for extended periods (e.g. 1 to 3 years) with fixed unit rates. Individual project deliverables & invoices are drawn down progressively via incoming Client Call-off Orders (LPOs).
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold' }}>Framework Period / Validity</label>
          <select className="form-control" value={formData.contract_period} onChange={e => setFormData({...formData, contract_period: e.target.value})}>
            <option value="12 Months">12 Months (1 Year Framework)</option>
            <option value="24 Months">24 Months (2 Years Framework)</option>
            <option value="36 Months">36 Months (3 Years Framework)</option>
            <option value="60 Months">60 Months (5 Years Framework)</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold' }}>
            {formData.contract_type === 'Framework Call-Off Agreement' ? 'Framework Ceiling Budget (KES)' : 'Total Contract Value (KES)'}
          </label>
          <input 
            type="number" 
            className="form-control" 
            placeholder={formData.contract_type === 'Framework Call-Off Agreement' ? "e.g. 50000000 (Or leave 0 for Auto-LPO Accumulation)" : "e.g. 15000000"} 
            value={formData.contract_value} 
            onChange={e => setFormData({...formData, contract_value: e.target.value})} 
          />
          {formData.contract_type === 'Framework Call-Off Agreement' && (
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: '#38bdf8' }}>
              ℹ️ Enter fixed ceiling budget OR leave 0 to auto-accumulate value from issued LPOs.
            </p>
          )}
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', fontWeight: 'bold', fontSize: '0.95rem' }}>
        {isSubmitting ? 'Registering Agreement...' : formData.contract_type === 'Framework Call-Off Agreement' ? 'Register Long-Term Framework Agreement' : 'Create Standard Tender'}
      </button>
    </form>
  )
}
