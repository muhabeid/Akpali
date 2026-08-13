import React, { useState, useEffect } from 'react'

export default function NewSupplierForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    id: 'SUP-001',
    name: '',
    kra_pin: '',
    registration_num: '',
    email: '',
    phone: '',
    bank_name: 'Equity Bank',
    account_number: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/next-id/supplier')
      .then(r => r.json())
      .then(data => {
        if (data && data.id) setFormData(prev => ({ ...prev, id: data.id }))
      })
      .catch(err => console.error('Failed to fetch next supplier ID:', err))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert(`✅ Supplier '${formData.name}' (${formData.id}) registered successfully!`);
        if (onSuccess) onSuccess();
        window.location.reload();
      } else {
        alert('Failed to register supplier');
      }
    } catch (err) {
      console.error(err);
      alert('Error registering supplier');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="form-group">
        <label style={{ fontWeight: 'bold' }}>Supplier ID (Auto-Linear)</label>
        <input type="text" className="form-control" value={formData.id} disabled style={{ fontWeight: 'bold', color: '#38bdf8' }} />
      </div>

      <div className="form-group">
        <label style={{ fontWeight: 'bold' }}>Supplier / Company Name *</label>
        <input type="text" className="form-control" placeholder="e.g., BuildMat Ltd" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label style={{ fontWeight: 'bold' }}>KRA PIN *</label>
          <input type="text" className="form-control" placeholder="e.g., P051234567Z" required value={formData.kra_pin} onChange={e => setFormData({...formData, kra_pin: e.target.value})} />
        </div>
        <div className="form-group">
          <label style={{ fontWeight: 'bold' }}>Registration Number</label>
          <input type="text" className="form-control" placeholder="e.g., PVT-XYZ123" value={formData.registration_num} onChange={e => setFormData({...formData, registration_num: e.target.value})} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label style={{ fontWeight: 'bold' }}>Primary Contact Email</label>
          <input type="email" className="form-control" placeholder="contact@supplier.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
        <div className="form-group">
          <label style={{ fontWeight: 'bold' }}>Phone Number</label>
          <input type="tel" className="form-control" placeholder="+254 7XX XXX XXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label style={{ fontWeight: 'bold' }}>Bank Name</label>
          <select className="form-control" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})}>
            <option value="Equity Bank">Equity Bank</option>
            <option value="KCB Bank">KCB Bank</option>
            <option value="Co-operative Bank">Co-operative Bank</option>
            <option value="Standard Chartered">Standard Chartered</option>
            <option value="NCBA Bank">NCBA Bank</option>
            <option value="ABSA Bank">ABSA Bank</option>
          </select>
        </div>
        <div className="form-group">
          <label style={{ fontWeight: 'bold' }}>Bank Account Number</label>
          <input type="text" className="form-control" placeholder="0123456789" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} />
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }}>
        {isSubmitting ? 'Registering Supplier...' : 'Register Supplier to Directory'}
      </button>
    </form>
  )
}
