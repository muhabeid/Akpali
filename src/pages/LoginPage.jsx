import React, { useState } from 'react'
import { ShieldCheck, Lock, Mail, ArrowRight, Building2, CheckCircle2 } from 'lucide-react'
import { useRole, ROLES } from '../context/RoleContext'

export default function LoginPage({ onLoginSuccess, companyProfile }) {
  const { setCurrentRole } = useRole()
  const [email, setEmail] = useState('admin@akpali.com')
  const [password, setPassword] = useState('password123')
  const [selectedPreset, setSelectedPreset] = useState('Admin')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const presetUsers = [
    {
      roleId: 'Admin',
      name: 'Eng. John Akpali',
      email: 'admin@akpali.com',
      badge: '👑 Executive Admin',
      color: '#0284c7',
      title: 'Managing Director & CEO'
    },
    {
      roleId: 'Operations',
      name: 'Sarah Jenkins',
      email: 'operations@akpali.com',
      badge: '🏗️ Operations Manager',
      color: '#16a34a',
      title: 'Head of Tenders & Site Execution'
    },
    {
      roleId: 'Procurement_Finance',
      name: 'David Omondi',
      email: 'finance@akpali.com',
      badge: '💳 Procurement & Finance',
      color: '#d97706',
      title: 'Chief Financial & Supply Chain Officer'
    }
  ]

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.roleId)
    setEmail(preset.email)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    setTimeout(() => {
      // Find matching preset or default to Admin
      const matched = presetUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || presetUsers[0]
      setCurrentRole(matched.roleId)

      const userSession = {
        name: matched.name,
        email: matched.email,
        role: matched.roleId,
        title: matched.title,
        loggedInAt: new Date().toISOString()
      }

      localStorage.setItem('akpali_user_session', JSON.stringify(userSession))
      setIsSubmitting(false)
      if (onLoginSuccess) onLoginSuccess(userSession)
    }, 400)
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* LEFT BRANDING PANEL */}
      <div style={{ flex: 1, padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(255, 255, 255, 0.1)', background: 'radial-gradient(circle at top left, rgba(2, 132, 199, 0.15), transparent 60%)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2rem' }}>
            <img 
              src={companyProfile?.logo_url || '/logo.png'} 
              alt="Logo" 
              style={{ height: '48px', maxWidth: '180px', objectFit: 'contain', borderRadius: '8px', background: '#fff', padding: '4px' }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '0.03em', color: '#f8fafc' }}>
                {companyProfile?.legal_name || 'AKPALI COMPANY LIMITED'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Enterprise ERP & Pre-Qualification System
              </span>
            </div>
          </div>

          <div style={{ marginTop: '4rem', maxWidth: '520px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.25', margin: '0 0 1.25rem 0', background: 'linear-gradient(90deg, #ffffff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Streamlined Procurement, Tenders & Treasury Management
            </h1>
            <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
              Secure corporate portal for managing tenders, client LPOs, supplier purchase orders, site deliverables, AI 3-Way Match audits, and official dossiers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} color="#38bdf8" />
                <span>Standardized Kenyan Shilling (KES) Financial Treasury Engine</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} color="#38bdf8" />
                <span>Multi-Role Access Control & Customized Task Allocations</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} color="#38bdf8" />
                <span>Automated 1-Click Operational Document & Letter Generator</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          &copy; {new Date().getFullYear()} {companyProfile?.legal_name || 'Akpali Company Limited'}. All rights reserved.
        </div>
      </div>

      {/* RIGHT LOGIN CARD PANEL */}
      <div style={{ width: '480px', padding: '3rem 3.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#0f172a' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: '#fff' }}>
            System Sign In
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
            Enter your credentials or choose a role persona to access your workstation:
          </p>
        </div>

        {/* QUICK ROLE PERSONA SELECTION */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', display: 'block', marginBottom: '0.6rem' }}>
            Select User Persona:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {presetUsers.map((user) => {
              const isSelected = selectedPreset === user.roleId
              return (
                <div
                  key={user.roleId}
                  onClick={() => handlePresetSelect(user)}
                  style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: isSelected ? `2px solid ${user.color}` : '1px solid #334155', background: isSelected ? 'rgba(255, 255, 255, 0.06)' : '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#f8fafc' }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user.title}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: user.color, color: '#fff', fontWeight: '800' }}>
                    {user.badge}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
              Work Email Address
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem' }} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 0.85rem 0.75rem 2.6rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem' }} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 0.85rem 0.75rem 2.6rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
              <span>Remember me</span>
            </label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact your System Administrator to reset your password.'); }} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
              Forgot password?
            </a>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s', marginTop: '0.5rem', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
