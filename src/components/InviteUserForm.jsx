import React, { useState } from 'react'
import { ROLES } from '../context/RoleContext'
import { ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function InviteUserForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    id: `USR-${Math.floor(Math.random() * 10000)}`,
    name: '',
    email: '',
    role: 'Operations'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedRoleDetails = Object.values(ROLES).find(r => r.id === formData.role) || ROLES.OPERATIONS

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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontWeight: '700' }}>Full Name *</label>
        <input type="text" className="form-control" required placeholder="e.g. Jane Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontWeight: '700' }}>Email Address *</label>
        <input type="email" className="form-control" required placeholder="jane.doe@akpali.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontWeight: '700' }}>Assign System Role *</label>
        <select className="form-control" style={{ fontWeight: '600' }} required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
          <option value="Admin">👑 Administrator (Full Executive Access)</option>
          <option value="Operations">🏗️ Operations Manager (Tenders, Sales & Site Works)</option>
          <option value="Procurement_Finance">💳 Procurement & Finance Manager (Supply Chain & Audit)</option>
        </select>
      </div>

      {/* DYNAMIC ROLE TASKS & CAPABILITIES TOGGLE PANEL */}
      <div style={{ background: 'hsla(var(--primary), 0.04)', borderLeft: `4px solid ${selectedRoleDetails.color}`, border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '0.5rem' }}>
          <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={16} color={selectedRoleDetails.color} />
            Authorized Tasks & Capabilities for {selectedRoleDetails.name}:
          </strong>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
          {selectedRoleDetails.tasks.map((task, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.8rem', color: '#334155', lineHeight: '1.4' }}>
              <CheckCircle2 size={15} color={selectedRoleDetails.color} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span>{task}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ padding: '0.65rem 1.25rem', fontWeight: '700' }}>
          {isSubmitting ? 'Sending Invite...' : 'Send User Invitation'}
        </button>
      </div>
    </form>
  )
}
}
