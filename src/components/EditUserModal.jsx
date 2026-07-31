import React, { useState } from 'react'
import { ROLES } from '../context/RoleContext'
import { ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function EditUserModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'Operations'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedRoleDetails = Object.values(ROLES).find(r => r.id === formData.role) || ROLES.OPERATIONS

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`http://localhost:5000/api/users/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        // Sync active user session if editing current logged in account
        const savedSession = localStorage.getItem('akpali_user_session')
        if (savedSession) {
          const current = JSON.parse(savedSession)
          if (current.id === formData.id || current.email.toLowerCase() === formData.email.toLowerCase()) {
            const updated = { ...current, name: formData.name, email: formData.email, role: formData.role }
            localStorage.setItem('akpali_user_session', JSON.stringify(updated))
            window.dispatchEvent(new Event('userSessionUpdated'))
          }
        }

        alert(`✅ User Account '${formData.name}' Updated Successfully!`);
        window.dispatchEvent(new Event('refreshCorporateHub'));
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        alert('Failed to update user details.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating user');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontWeight: '700' }}>Full Name *</label>
        <input 
          type="text" 
          className="form-control" 
          required 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
        />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontWeight: '700' }}>Work Email Address *</label>
        <input 
          type="email" 
          className="form-control" 
          required 
          value={formData.email} 
          onChange={e => setFormData({...formData, email: e.target.value})} 
        />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontWeight: '700' }}>Assigned System Role *</label>
        <select 
          className="form-control" 
          style={{ fontWeight: '600' }} 
          required 
          value={formData.role} 
          onChange={e => setFormData({...formData, role: e.target.value})}
        >
          <option value="Admin">👑 Administrator (Full Executive Access)</option>
          <option value="Operations">🏗️ Operations Manager (Tenders, Sales & Site Works)</option>
          <option value="Procurement_Finance">💳 Procurement & Finance Manager (Supply Chain & Audit)</option>
        </select>
      </div>

      {/* DYNAMIC ROLE TASKS PREVIEW */}
      <div style={{ background: 'hsla(var(--primary), 0.04)', borderLeft: `4px solid ${selectedRoleDetails.color}`, border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px' }}>
        <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={16} color={selectedRoleDetails.color} />
          Updated Capabilities for {selectedRoleDetails.name}:
        </strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {selectedRoleDetails.tasks.map((task, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
              <CheckCircle2 size={15} color={selectedRoleDetails.color} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span>{task}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="button" className="btn" style={{ background: '#cbd5e1', color: '#0f172a' }} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ padding: '0.65rem 1.25rem', fontWeight: '700' }}>
          {isSubmitting ? 'Saving Changes...' : 'Save User Changes'}
        </button>
      </div>
    </form>
  )
}
