import React, { useState } from 'react'

export default function LegalContractForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    id: `LC-${Math.floor(Math.random() * 10000)}`,
    title: '',
    party_name: '',
    contract_type: 'MSA',
    start_date: '',
    end_date: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Contract logged!');
        window.dispatchEvent(new Event('refreshCorporateHub'));
        if (onSuccess) onSuccess();
      } else {
        alert('Failed to log contract');
      }
    } catch (err) {
      alert('Error connecting to backend');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Contract Title</label>
        <input type="text" className="form-control" required placeholder="e.g. Master Vendor Agreement 2026" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Counterparty (Client/Vendor)</label>
          <input type="text" className="form-control" required placeholder="e.g. Acme Corp" value={formData.party_name} onChange={e => setFormData({...formData, party_name: e.target.value})} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Contract Type</label>
          <select className="form-control" value={formData.contract_type} onChange={e => setFormData({...formData, contract_type: e.target.value})}>
            <option value="MSA">MSA (Master Service Agreement)</option>
            <option value="NDA">NDA (Non-Disclosure Agreement)</option>
            <option value="Lease">Office/Equipment Lease</option>
            <option value="Vendor">Vendor Contract</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Start Date</label>
          <input type="date" className="form-control" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>End/Expiry Date</label>
          <input type="date" className="form-control" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Upload Signed File (PDF)</label>
        <input type="file" className="form-control" style={{ padding: '0.4rem' }} />
        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>*File upload is mock UI for now.</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Log Contract'}
        </button>
      </div>
    </form>
  )
}
