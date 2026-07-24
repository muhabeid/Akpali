import React, { useState } from 'react'

export default function CompanyExperienceForm({ experience, onSuccess }) {
  const [formData, setFormData] = useState({
    id: experience?.id || `EXP-${Date.now()}`,
    project_name: experience?.project_name || '',
    client_name: experience?.client_name || '',
    contract_value: experience?.contract_value || '',
    completion_date: experience?.completion_date || '',
    scope: experience?.scope || ''
  })
  const [refLetterFile, setRefLetterFile] = useState(null)
  const [completionCertFile, setCompletionCertFile] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = new FormData()
      data.append('id', formData.id)
      data.append('project_name', formData.project_name)
      data.append('client_name', formData.client_name)
      data.append('contract_value', formData.contract_value)
      data.append('completion_date', formData.completion_date)
      data.append('scope', formData.scope)

      if (refLetterFile) data.append('reference_letter', refLetterFile)
      if (completionCertFile) data.append('completion_certificate', completionCertFile)
      if (photoFile) data.append('photo', photoFile)

      const res = await fetch('http://localhost:5000/api/experience', {
        method: 'POST',
        body: data
      })

      if (res.ok) {
        alert('Past Project Experience saved successfully!')
        window.dispatchEvent(new Event('refreshCorporateHub'))
        if (onSuccess) onSuccess()
      } else {
        alert('Failed to save project experience')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving project experience')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Project Title / Description *</label>
          <input type="text" className="form-control" required value={formData.project_name} onChange={e => setFormData({...formData, project_name: e.target.value})} placeholder="e.g. Supply & Installation of Solar Generators" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Client Name / Organization *</label>
          <input type="text" className="form-control" required value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} placeholder="e.g. Ministry of Energy / UNHCR" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Contract Value ($ / KES)</label>
          <input type="number" step="0.01" className="form-control" value={formData.contract_value} onChange={e => setFormData({...formData, contract_value: e.target.value})} placeholder="e.g. 150000" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Completion Date</label>
          <input type="date" className="form-control" value={formData.completion_date} onChange={e => setFormData({...formData, completion_date: e.target.value})} />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Scope of Work / Key Deliverables</label>
        <textarea className="form-control" rows={3} value={formData.scope} onChange={e => setFormData({...formData, scope: e.target.value})} placeholder="Enter detailed scope executed..." />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Reference Letter (PDF)</label>
          <input type="file" className="form-control" accept=".pdf,.jpg,.png" onChange={e => setRefLetterFile(e.target.files[0])} />
          {refLetterFile && <span style={{ fontSize: '0.7rem', color: '#16a34a' }}>Ref: {refLetterFile.name}</span>}
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Completion Cert (PDF)</label>
          <input type="file" className="form-control" accept=".pdf,.jpg,.png" onChange={e => setCompletionCertFile(e.target.files[0])} />
          {completionCertFile && <span style={{ fontSize: '0.7rem', color: '#16a34a' }}>Cert: {completionCertFile.name}</span>}
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Project Photo (JPG)</label>
          <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.webp" onChange={e => setPhotoFile(e.target.files[0])} />
          {photoFile && <span style={{ fontSize: '0.7rem', color: '#16a34a' }}>Photo: {photoFile.name}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Project Experience'}
        </button>
      </div>
    </form>
  )
}
