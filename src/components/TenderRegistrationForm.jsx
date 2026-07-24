import React, { useState } from 'react'

export default function TenderRegistrationForm({ registration, onSuccess }) {
  const [formData, setFormData] = useState({
    id: registration?.id || `REG-${Date.now()}`,
    authority_name: registration?.authority_name || 'National Construction Authority (NCA)',
    registration_number: registration?.registration_number || '',
    category_grade: registration?.category_grade || '',
    expiry_date: registration?.expiry_date || ''
  })
  const [certFile, setCertFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = new FormData()
      data.append('id', formData.id)
      data.append('authority_name', formData.authority_name)
      data.append('registration_number', formData.registration_number)
      data.append('category_grade', formData.category_grade)
      data.append('expiry_date', formData.expiry_date)

      if (certFile) data.append('certificate', certFile)

      const res = await fetch('http://localhost:5000/api/tender-registrations', {
        method: 'POST',
        body: data
      })

      if (res.ok) {
        alert('Tender Registration Certificate saved successfully!')
        window.dispatchEvent(new Event('refreshCorporateHub'))
        if (onSuccess) onSuccess()
      } else {
        alert('Failed to save registration certificate')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving registration certificate')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Registering Authority / Body *</label>
        <select className="form-control" required value={formData.authority_name} onChange={e => setFormData({...formData, authority_name: e.target.value})}>
          <option value="National Construction Authority (NCA)">National Construction Authority (NCA)</option>
          <option value="Engineers Board of Kenya (EBK)">Engineers Board of Kenya (EBK)</option>
          <option value="National Treasury Supplier Registration">National Treasury Supplier Registration</option>
          <option value="County Government Supplier Registration">County Government Supplier Registration</option>
          <option value="Public Procurement Regulatory Authority (PPRA)">Public Procurement Regulatory Authority (PPRA)</option>
          <option value="NGO Supplier Registration">NGO Supplier Registration</option>
          <option value="UN Supplier Registration (UNGM)">UN Supplier Registration (UNGM)</option>
          <option value="World Bank Vendor Registration">World Bank Vendor Registration</option>
          <option value="African Development Bank (AfDB) Registration">African Development Bank (AfDB) Registration</option>
          <option value="Other Authority">Other Regulatory Authority</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Registration Number / Ref *</label>
          <input type="text" className="form-control" required value={formData.registration_number} onChange={e => setFormData({...formData, registration_number: e.target.value})} placeholder="e.g. NCA-1/29841/2026" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Category / Grade / Class</label>
          <input type="text" className="form-control" value={formData.category_grade} onChange={e => setFormData({...formData, category_grade: e.target.value})} placeholder="e.g. NCA 1 Building Works / Youth Category" />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Expiry Date</label>
        <input type="date" className="form-control" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Upload Registration Certificate (PDF/JPG)</label>
        <input type="file" className="form-control" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setCertFile(e.target.files[0])} />
        {certFile && <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>File: {certFile.name}</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Tender Registration'}
        </button>
      </div>
    </form>
  )
}
