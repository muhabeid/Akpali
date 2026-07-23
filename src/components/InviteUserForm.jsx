import React, { useState } from 'react'

export default function InviteUserForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    id: `USR-${Math.floor(Math.random() * 10000)}`,
    name: '',
    email: '',
    role: 'Staff'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('User invited successfully!');
        window.dispatchEvent(new Event('refreshCorporateHub'));
        if (onSuccess) onSuccess();
      } else {
        alert('Failed to invite user');
      }
    } catch (err) {
      console.error(err);
      alert('Error inviting user');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Full Name</label>
        <input type="text" className="form-control" required placeholder="e.g. Jane Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Email Address</label>
        <input type="email" className="form-control" required placeholder="jane.doe@akpali.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>System Role</label>
        <select className="form-control" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
          <option value="Admin">Administrator (Full Access)</option>
          <option value="Manager">Finance / Procurement Manager (Checker)</option>
          <option value="Staff">Junior Staff (Maker)</option>
        </select>
        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.5rem' }}>
          An invitation email will be sent to this user to set their password.
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Sending Invite...' : 'Send Invitation'}
        </button>
      </div>
    </form>
  )
}
