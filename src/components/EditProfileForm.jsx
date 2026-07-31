import React, { useState, useEffect } from 'react'
import { useRole, ROLES } from '../context/RoleContext'
import { User, Mail, Phone, Briefcase, ShieldCheck, CheckCircle2, Key, Award, FileSignature } from 'lucide-react'

export default function EditProfileForm({ onClose }) {
  const { currentRole, setCurrentRole, getRoleDetails } = useRole()
  const activeRole = getRoleDetails()

  const [userSession, setUserSession] = useState(() => {
    const saved = localStorage.getItem('akpali_user_session')
    return saved ? JSON.parse(saved) : null
  })

  const [profile, setProfile] = useState({
    name: userSession?.name || 'Eng. John Akpali',
    email: userSession?.email || 'admin@akpali.com',
    phone: '+254 705 365996',
    designation: userSession?.title || 'Managing Director / Lead Engineer',
    department: 'Executive Management',
    role: currentRole
  })

  useEffect(() => {
    const saved = localStorage.getItem('akpali_user_session')
    if (saved) {
      const parsed = JSON.parse(saved)
      setProfile(prev => ({
        ...prev,
        name: parsed.name || prev.name,
        email: parsed.email || prev.email,
        designation: parsed.title || prev.designation
      }))
    }
  }, [])

  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'tasks' | 'security'

  const handleSave = async (e) => {
    e.preventDefault()
    if (!profile.name || !profile.name.trim()) {
      alert('Please enter a valid full name.')
      return
    }

    const trimmedName = profile.name.trim()
    const trimmedEmail = profile.email.trim()

    setCurrentRole(profile.role)

    // Save profile update to backend database
    try {
      const userId = userSession?.id || 'USR-ADMIN'
      await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          name: trimmedName,
          email: trimmedEmail,
          role: profile.role
        })
      })
    } catch(err) {
      console.warn('Backend update skipped, updating local session.', err)
    }

    const updatedSession = {
      ...(userSession || {}),
      id: userSession?.id || 'USR-ADMIN',
      name: trimmedName,
      email: trimmedEmail,
      role: profile.role,
      title: profile.designation
    }

    localStorage.setItem('akpali_user_session', JSON.stringify(updatedSession))
    setUserSession(updatedSession)
    window.dispatchEvent(new Event('userSessionUpdated'))
    window.dispatchEvent(new Event('refreshCorporateHub'))
    alert(`✅ User profile updated successfully to: ${trimmedName}`)
    if (onClose) onClose()
  }

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* PROFILE HEADER BADGE */}
      <div style={{ background: 'hsla(var(--primary), 0.05)', padding: '1rem', borderRadius: '10px', border: `1.5px solid ${activeRole.color}`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: activeRole.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: '800' }}>
          {profile.name ? profile.name.split(' ').map(n=>n[0]).join('') : 'JD'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '800' }}>{profile.name}</h3>
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: activeRole.color, color: '#fff', fontWeight: '800' }}>
              {activeRole.badge}
            </span>
          </div>
          <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.825rem', color: '#475569' }}>
            {profile.designation} &bull; {profile.department}
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', borderBottom: '2px solid hsl(var(--border))', gap: '1rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{ padding: '0.5rem 0.75rem', background: 'none', border: 'none', borderBottom: activeTab === 'profile' ? '3px solid hsl(var(--primary))' : 'none', fontWeight: activeTab === 'profile' ? '800' : '600', color: activeTab === 'profile' ? 'hsl(var(--primary))' : '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          👤 General Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          style={{ padding: '0.5rem 0.75rem', background: 'none', border: 'none', borderBottom: activeTab === 'tasks' ? '3px solid hsl(var(--primary))' : 'none', fontWeight: activeTab === 'tasks' ? '800' : '600', color: activeTab === 'tasks' ? 'hsl(var(--primary))' : '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          🛡️ Role & Allocated Tasks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          style={{ padding: '0.5rem 0.75rem', background: 'none', border: 'none', borderBottom: activeTab === 'security' ? '3px solid hsl(var(--primary))' : 'none', fontWeight: activeTab === 'security' ? '800' : '600', color: activeTab === 'security' ? 'hsl(var(--primary))' : '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          🔑 Security & Signatures
        </button>
      </div>

      {/* TAB 1: GENERAL INFO */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Full Name *</label>
            <input 
              type="text" 
              className="form-control" 
              required 
              value={profile.name} 
              onChange={e => setProfile({...profile, name: e.target.value})} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Work Email Address *</label>
              <input 
                type="email" 
                className="form-control" 
                required 
                value={profile.email} 
                onChange={e => setProfile({...profile, email: e.target.value})} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Phone Number</label>
              <input 
                type="text" 
                className="form-control" 
                value={profile.phone} 
                onChange={e => setProfile({...profile, phone: e.target.value})} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Official Title / Designation</label>
              <input 
                type="text" 
                className="form-control" 
                value={profile.designation} 
                onChange={e => setProfile({...profile, designation: e.target.value})} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Corporate Department</label>
              <input 
                type="text" 
                className="form-control" 
                value={profile.department} 
                onChange={e => setProfile({...profile, department: e.target.value})} 
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE & ALLOCATED TASKS */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Select Assigned System Role</label>
            <select 
              className="form-control" 
              style={{ fontWeight: '700' }}
              value={profile.role} 
              onChange={e => setProfile({...profile, role: e.target.value})}
            >
              <option value="Admin">👑 Administrator (Full Executive Access)</option>
              <option value="Operations">🏗️ Operations Manager (Tenders, Sales & Site Works)</option>
              <option value="Procurement_Finance">💳 Procurement & Finance Manager (Supply Chain & Audit)</option>
            </select>
          </div>

          <div style={{ background: 'hsla(var(--primary), 0.04)', borderLeft: `4px solid ${activeRole.color}`, border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} color={activeRole.color} />
              Authorized System Capabilities ({activeRole.name}):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {activeRole.tasks.map((task, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.8rem', color: '#334155', lineHeight: '1.4' }}>
                  <CheckCircle2 size={15} color={activeRole.color} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <span>{task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & SIGNATURES */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Key size={16} /> Account Password Management
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>New Password</label>
                <input type="password" className="form-control" placeholder="••••••••" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>Confirm Password</label>
                <input type="password" className="form-control" placeholder="••••••••" />
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileSignature size={16} /> Operational Digital Signature & Authorization Seal
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
              Your digital signature and stamp will be affixed to approved Purchase Orders, Invoices, and Official Operational Letters.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.5rem 1rem', background: '#ffffff', border: '1px dashed #94a3b8', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem' }}>
                <img src="/stamp.png" alt="Stamp" style={{ height: '40px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
                <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: '800', marginTop: '0.2rem' }}>✓ Authorized Seal Active</div>
              </div>
              <button type="button" className="btn" style={{ fontSize: '0.78rem', border: '1px solid hsl(var(--border))' }}>
                Upload New Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem', marginTop: '0.5rem' }}>
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontWeight: '800' }}>
          Save Profile & Role
        </button>
      </div>
    </form>
  )
}
