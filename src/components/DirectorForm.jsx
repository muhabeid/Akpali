import React, { useState, useEffect } from 'react'

export default function DirectorForm({ director, onSuccess }) {
  const [formData, setFormData] = useState({
    id: director?.id || `DIR-${Date.now()}`,
    name: director?.name || '',
    position: director?.position || 'Director',
    id_passport: director?.id_passport || '',
    kra_pin: director?.kra_pin || '',
    contact_info: director?.contact_info || '',
    appointment_date: director?.appointment_date || '',
    shareholding_pct: director?.shareholding_pct ?? 0
  })
  const [cvFile, setCvFile] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (director) {
      setFormData({
        id: director.id,
        name: director.name || '',
        position: director.position || 'Director',
        id_passport: director.id_passport || '',
        kra_pin: director.kra_pin || '',
        contact_info: director.contact_info || '',
        appointment_date: director.appointment_date || '',
        shareholding_pct: director.shareholding_pct ?? 0
      })
      setCvFile(null)
      setPhotoFile(null)
    } else {
      setFormData({
        id: `DIR-${Date.now()}`,
        name: '',
        position: 'Director',
        id_passport: '',
        kra_pin: '',
        contact_info: '',
        appointment_date: '',
        shareholding_pct: 0
      })
      setCvFile(null)
      setPhotoFile(null)
    }
  }, [director])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = new FormData()
      data.append('id', formData.id)
      data.append('name', formData.name)
      data.append('position', formData.position)
      data.append('id_passport', formData.id_passport || '')
      data.append('kra_pin', formData.kra_pin || '')
      data.append('contact_info', formData.contact_info || '')
      data.append('appointment_date', formData.appointment_date || '')
      data.append('shareholding_pct', formData.shareholding_pct || 0)

      if (cvFile) data.append('cv', cvFile)
      if (photoFile) data.append('photo', photoFile)

      const res = await fetch('http://localhost:5000/api/directors', {
        method: 'POST',
        body: data
      })

      if (res.ok) {
        alert(director ? 'Director / Shareholder updated successfully!' : 'Director / Shareholder saved successfully!')
        window.dispatchEvent(new Event('refreshCorporateHub'))
        if (onSuccess) onSuccess()
      } else {
        alert('Failed to save director credentials')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving director')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Full Name *</label>
          <input 
            type="text" 
            className="form-control" 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="e.g. John Doe" 
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Official Position / Role *</label>
          <input 
            type="text" 
            className="form-control" 
            required 
            value={formData.position} 
            onChange={e => setFormData({...formData, position: e.target.value})} 
            placeholder="e.g. Managing Director / Shareholder" 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>National ID / Passport No.</label>
          <input 
            type="text" 
            className="form-control" 
            value={formData.id_passport} 
            onChange={e => setFormData({...formData, id_passport: e.target.value})} 
            placeholder="e.g. 29481023" 
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Director KRA PIN</label>
          <input 
            type="text" 
            className="form-control" 
            value={formData.kra_pin} 
            onChange={e => setFormData({...formData, kra_pin: e.target.value})} 
            placeholder="e.g. A019283741Z" 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Appointment Date</label>
          <input 
            type="date" 
            className="form-control" 
            value={formData.appointment_date} 
            onChange={e => setFormData({...formData, appointment_date: e.target.value})} 
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Shareholding Percentage (%)</label>
          <input 
            type="number" 
            step="0.1" 
            className="form-control" 
            value={formData.shareholding_pct} 
            onChange={e => setFormData({...formData, shareholding_pct: e.target.value})} 
            placeholder="e.g. 50" 
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Contact Info (Email / Phone)</label>
        <input 
          type="text" 
          className="form-control" 
          value={formData.contact_info} 
          onChange={e => setFormData({...formData, contact_info: e.target.value})} 
          placeholder="john.doe@company.com / +254700000000" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Upload Director CV (PDF)</label>
          {director?.cv_url && (
            <div style={{ marginBottom: '0.4rem', fontSize: '0.8rem' }}>
              <a 
                href={`http://localhost:5000${director.cv_url}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: 'hsl(var(--primary))', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: '500' }}
              >
                📄 View Current Uploaded CV
              </a>
            </div>
          )}
          <input type="file" className="form-control" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files[0])} />
          {cvFile && <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', marginTop: '0.25rem' }}>Selected: {cvFile.name}</span>}
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Upload Passport Photo</label>
          {director?.photo_url && (
            <div style={{ marginBottom: '0.4rem', fontSize: '0.8rem' }}>
              <a 
                href={`http://localhost:5000${director.photo_url}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: 'hsl(var(--primary))', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: '500' }}
              >
                🖼️ View Current Photo
              </a>
            </div>
          )}
          <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.webp" onChange={e => setPhotoFile(e.target.files[0])} />
          {photoFile && <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', marginTop: '0.25rem' }}>Selected: {photoFile.name}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '0.75rem' }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (director ? 'Update Director Details' : 'Save Director Credentials')}
        </button>
      </div>
    </form>
  )
}
