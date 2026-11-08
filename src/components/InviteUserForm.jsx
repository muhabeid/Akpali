import React, { useState } from 'react'
import { ROLES } from '../context/RoleContext'
import { ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react'

export default function InviteUserForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    id: `USR-${Math.floor(Math.random() * 10000)}`,
    name: '',
    email: '',
    role: 'Operations',
    password: 'password123'
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
        alert(`✅ User Account '${formData.name}' Created & Activated Successfully!\n\nEmail: ${formData.email}\nAssigned Role: ${formData.role}\n\nNote: The user can log in immediately on the login screen. To deliver physical email invitations to real inboxes, configure your SMTP server credentials under Corporate Hub -> System Settings.`);
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
        <label style={{ fontWeight: '700' }}>Initial Temporary Password *</label>
        <input 
          type="text" 
          className="form-control" 
          required 
          placeholder="password123" 
          value={formData.password} 
          onChange={e => setFormData({...formData, password: e.target.value})} 
        />
        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
          {formData.role === 'Admin' 
            ? 'Default: password123. Universal administrator password (no change mandated).' 
            : 'Default: password123. Temporary password — user will be mandated to change this upon first login.'}
        </span>
      </div>

      {formData.role !== 'Admin' && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '0.6rem 0.85rem', fontSize: '0.78rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <KeyRound size={16} style={{ flexShrink: 0 }} />
          <span><strong>Mandatory Security Policy:</strong> New users are mandated to set their personal password immediately upon first login. Admin passwords remain universal.</span>
        </div>
      )}

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontWeight: '700' }}>Assign System Role & Reporting Line *</label>
        <select className="form-control" style={{ fontWeight: '600' }} required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
          <optgroup label="👑 Executive Directorate">
            <option value="Admin">Executive Administrator (Full System & Governance Access)</option>
          </optgroup>
          <optgroup label="🏗️ Operations & Field Execution">
            <option value="Operations">Operations Manager (Bidding, Tenders & Projects - Reports to MD)</option>
            <option value="Site_Engineer">Site Engineer / Field Officer (Site Deliverables & QA/QC - Reports to Operations Manager)</option>
          </optgroup>
          <optgroup label="💳 Procurement & Supply Chain / Treasury">
            <option value="Procurement_Finance">Procurement & Finance Manager (Supply Chain & Treasury - Reports to MD)</option>
            <option value="Procurement_Officer">Procurement Officer (Vendor RFQs, POs, Stores - Reports to Procurement & Finance Manager)</option>
            <option value="Finance_Officer">Accountant / Finance Officer (Invoices, Ledgers & Cashflow - Reports to Procurement & Finance Manager)</option>
          </optgroup>
        </select>
      </div>

      {/* DYNAMIC ROLE TASKS & CAPABILITIES TOGGLE PANEL */}
      <div style={{ background: 'hsla(var(--primary), 0.04)', borderLeft: `4px solid ${selectedRoleDetails.color}`, border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
              <ShieldCheck size={16} color={selectedRoleDetails.color} />
              <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{selectedRoleDetails.name}</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              <strong>Department:</strong> {selectedRoleDetails.department} &bull; <strong>Reports To:</strong> <span style={{ color: selectedRoleDetails.color, fontWeight: '700' }}>{selectedRoleDetails.reportsTo}</span>
            </div>
          </div>
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
