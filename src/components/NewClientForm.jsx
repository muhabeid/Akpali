import React, { useState, useEffect } from 'react'

export default function NewClientForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    id: 'CLI-001',
    name: '',
    registration_num: '',
    tax_pin: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/next-id/client')
      .then(r => r.json())
      .then(data => {
        if (data && data.id) setFormData(prev => ({ ...prev, id: data.id }))
      })
      .catch(err => console.error('Failed to fetch next client ID:', err))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert(`✅ Client '${formData.name}' (${formData.id}) registered successfully!`);
        if (onSuccess) onSuccess();
        window.location.reload();
      } else {
        alert('Failed to register client.');
      }
    } catch (err) {
      console.error(err);
      alert('Error registering client');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="form-group">
        <label style={{ fontWeight: 'bold' }}>Client ID (Auto-Linear)</label>
        <input type="text" className="form-control" value={formData.id} disabled style={{ fontWeight: 'bold', color: '#38bdf8' }} />
      </div>

      <div className="form-group">
        <label style={{ fontWeight: 'bold' }}>Client / Organization Name *</label>
        <input type="text" className="form-control" placeholder="e.g., KeNHA (Kenya National Highways Authority)" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label style={{ fontWeight: 'bold' }}>Registration # (Optional)</label>
          <input type="text" className="form-control" placeholder="e.g., PVT-XYZ123" value={formData.registration_num} onChange={e => setFormData({...formData, registration_num: e.target.value})} />
        </div>
        <div className="form-group">
          <label style={{ fontWeight: 'bold' }}>KRA Tax PIN *</label>
          <input type="text" className="form-control" placeholder="e.g., P051234567Z" required value={formData.tax_pin} onChange={e => setFormData({...formData, tax_pin: e.target.value})} />
        </div>
      </div>

      <div className="form-group">
        <label style={{ fontWeight: 'bold' }}>Primary Contact Person Name</label>
        <input type="text" className="form-control" placeholder="Eng. John Doe" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label style={{ fontWeight: 'bold' }}>Email Address</label>
          <input type="email" className="form-control" placeholder="procurement@client.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
        <div className="form-group">
          <label style={{ fontWeight: 'bold' }}>Telephone / Mobile</label>
          <input type="tel" className="form-control" placeholder="+254 7XX XXX XXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>
      </div>

      <div className="form-group">
        <label style={{ fontWeight: 'bold' }}>Physical Office Address</label>
        <textarea className="form-control" rows="2" placeholder="Building, Street, City" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }}>
        {isSubmitting ? 'Registering Client...' : 'Register Client to Directory'}
      </button>
    </form>
  )
}
