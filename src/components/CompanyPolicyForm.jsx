import React, { useState } from 'react'

export default function CompanyPolicyForm({ policy, onSuccess }) {
  const [formData, setFormData] = useState({
    id: policy?.id || `POL-${Date.now()}`,
    title: policy?.title || 'Tender Bid Management & Compliance Policy',
    content_text: policy?.content_text || ''
  })
  const [docFile, setDocFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = new FormData()
      data.append('id', formData.id)
      data.append('title', formData.title)
      data.append('content_text', formData.content_text)

      if (docFile) data.append('document', docFile)

      const res = await fetch('http://localhost:5000/api/policies', {
        method: 'POST',
        body: data
      })

      if (res.ok) {
        alert('Company Policy saved successfully!')
        window.dispatchEvent(new Event('refreshCorporateHub'))
        if (onSuccess) onSuccess()
      } else {
        alert('Failed to save company policy')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving policy')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Policy Title *</label>
        <input type="text" className="form-control" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Tender Bid Management & Compliance Policy" />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Policy Content Summary / Provisions</label>
        <textarea className="form-control" rows={5} value={formData.content_text} onChange={e => setFormData({...formData, content_text: e.target.value})} placeholder="Enter summary of compliance, anti-corruption, Maker/Checker authorization rules, and tender submission quality controls..." />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Upload Signed Policy Document (PDF)</label>
        <input type="file" className="form-control" accept=".pdf,.doc,.docx" onChange={e => setDocFile(e.target.files[0])} />
        {docFile && <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>File: {docFile.name}</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Corporate Policy'}
        </button>
      </div>
    </form>
  )
}
