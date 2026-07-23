import React, { useState } from 'react'

export default function UploadDocumentForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    id: `DOC-${Math.floor(Math.random() * 10000)}`,
    title: '',
    document_type: 'Certificate of Incorporation',
    expiry_date: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Auto-fill title if not 'Other'
    const finalTitle = formData.document_type === 'Other' ? formData.title : formData.document_type;

    try {
      const res = await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, title: finalTitle })
      });

      if (res.ok) {
        alert('Document uploaded successfully!');
        window.dispatchEvent(new Event('refreshCorporateHub'));
        if (onSuccess) onSuccess();
      } else {
        alert('Failed to upload document');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading document');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Document ID (Auto)</label>
        <input type="text" className="form-control" value={formData.id} disabled />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Document Type</label>
          <select className="form-control" required value={formData.document_type} onChange={e => setFormData({...formData, document_type: e.target.value, title: ''})}>
            <option value="Certificate of Incorporation">Certificate of Incorporation</option>
            <option value="Tax Compliance Certificate">Tax Compliance Certificate</option>
            <option value="CR12">CR12</option>
            <option value="Business Permit">Business Permit</option>
            <option value="NCA Registration">NCA Registration</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Expiry Date</label>
          <input type="date" className="form-control" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} />
        </div>
      </div>

      {formData.document_type === 'Other' && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Document Title</label>
          <input type="text" className="form-control" required placeholder="e.g. Special License 2026" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
        </div>
      )}

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Upload File (PDF/JPG)</label>
        <input type="file" className="form-control" accept=".pdf,.jpg,.jpeg,.png" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Uploading...' : 'Save Document'}
        </button>
      </div>
    </form>
  )
}
