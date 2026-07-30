import React, { useState } from 'react'
import { useRole, ROLES } from '../context/RoleContext'
import { User, Mail, Phone, Briefcase, ShieldCheck, CheckCircle2, Key, Award, FileSignature } from 'lucide-react'

export default function EditProfileForm({ onClose }) {
  const { currentRole, setCurrentRole, getRoleDetails } = useRole()
  const activeRole = getRoleDetails()

  const [profile, setProfile] = useState({
    name: 'Eng. John Doe',
    email: 'admin@akpali.com',
    phone: '+254 705 365996',
    designation: 'Managing Director / Lead Engineer',
    department: 'Executive Management',
    role: currentRole
  })

  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'tasks' | 'security'

  const handleSave = (e) => {
    e.preventDefault()
    setCurrentRole(profile.role)
    alert('Profile and System Role updated successfully!')
    if (onClose) onClose()
  }

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* PROFILE HEADER BADGE */}
      <div style={{ background: 'hsla(var(--primary), 0.05)', padding: '1rem', borderRadius: '10px', border: `1.5px solid ${activeRole.color}`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: activeRole.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: '800' }}>
          JD
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
            <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Full Name</label>
            <input type="text" className="form-control" required value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Email Address</label>
              <input type="email" className="form-control" required value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Phone Number</label>
              <input type="text" className="form-control" required value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Designation / Job Title</label>
              <input type="text" className="form-control" value={profile.designation} onChange={e => setProfile({...profile, designation: e.target.value})} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Department</label>
              <input type="text" className="form-control" value={profile.department} onChange={e => setProfile({...profile, department: e.target.value})} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE & ALLOCATED TASKS */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Assigned System Role</label>
            <select
              className="form-control"
              style={{ fontWeight: '700' }}
              value={profile.role}
              onChange={e => setProfile({...profile, role: e.target.value})}
            >
              {Object.values(ROLES).map(r => (
                <option key={r.id} value={r.id}>{r.badge} — {r.name}</option>
              ))}
            </select>
          </div>

          {/* DYNAMIC ROLE TASKS BOX */}
          <div style={{ background: 'hsla(var(--primary), 0.03)', borderLeft: `5px solid ${activeRole.color}`, border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} color={activeRole.color} />
              Authorized System Responsibilities for {activeRole.name}:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {activeRole.tasks.map((task, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.825rem', color: '#334155', lineHeight: '1.4' }}>
                  <CheckCircle2 size={16} color={activeRole.color} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <span style={{ fontWeight: '600' }}>{task}</span>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE PERMISSIONS MATRIX */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>
              Module Access Permissions:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <div style={{ padding: '0.6rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span>📊 Tenders & Bidding</span>
                <span className="badge badge-success">Full Access</span>
              </div>
              <div style={{ padding: '0.6rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span>📦 Procurement & Stores</span>
                <span className="badge badge-success">Full Access</span>
              </div>
              <div style={{ padding: '0.6rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span>💳 Finance & Treasury</span>
                <span className="badge badge-success">Full Access</span>
              </div>
              <div style={{ padding: '0.6rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span>🛡️ Corporate Administration</span>
                <span className="badge badge-success">Admin Only</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & SIGNATURES */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Key size={16} /> Security & Password
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
