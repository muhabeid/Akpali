import React, { useState, useEffect } from 'react'
import { Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck, KeyRound, UserCheck } from 'lucide-react'
import { useRole } from '../context/RoleContext'

export default function LoginPage({ onLoginSuccess, companyProfile: initialProfile }) {
  const { setCurrentRole } = useRole()
  const [email, setEmail] = useState('admin@akpali.com')
  const [password, setPassword] = useState('password123')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [companyProfile, setCompanyProfile] = useState(initialProfile || null)

  useEffect(() => {
    if (!companyProfile) {
      fetch('http://localhost:5000/api/company')
        .then(res => res.json())
        .then(data => setCompanyProfile(data))
        .catch(err => console.error('Could not fetch company profile for login:', err))
    }
  }, [companyProfile])

  const handleQuickFill = (roleEmail, rolePass) => {
    setEmail(roleEmail)
    setPassword(rolePass)
    setErrorMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const res = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed. Please verify your credentials.')
        setIsSubmitting(false)
        return
      }

      if (data.user) {
        setCurrentRole(data.user.role || 'Admin')

        const userSession = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'Admin',
          title: data.user.title || 'System User',
          loggedInAt: new Date().toISOString()
        }

        localStorage.setItem('akpali_user_session', JSON.stringify(userSession))
        window.dispatchEvent(new Event('userSessionUpdated'))
        setIsSubmitting(false)
        if (onLoginSuccess) onLoginSuccess(userSession)
      } else {
        setErrorMessage('Invalid server response during authentication.')
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setErrorMessage('Could not connect to the backend server. Please verify the server is running on port 5000.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-wrapper">
      
      {/* LEFT BRANDING PANEL */}
      <div className="login-brand-panel">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2rem' }}>
            <img 
              src={companyProfile?.logo_url || '/logo.png'} 
              alt="Logo" 
              style={{ height: '48px', maxWidth: '170px', objectFit: 'contain', borderRadius: '8px', background: '#fff', padding: '4px' }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', letterSpacing: '0.03em', color: '#f8fafc' }}>
                {companyProfile?.legal_name || 'AKPALI & CO.'}
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Enterprise ERP & Pre-Qualification System
              </span>
            </div>
          </div>

          <div style={{ marginTop: 'clamp(1.5rem, 4vw, 3.5rem)', maxWidth: '540px' }}>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: '800', lineHeight: '1.25', margin: '0 0 1rem 0', background: 'linear-gradient(90deg, #ffffff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Streamlined Procurement, Tenders & Treasury Management
            </h1>
            <p style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.05rem)', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
              Secure corporate portal for managing tenders, client LPOs, supplier purchase orders, site deliverables, AI 3-Way Match audits, and official dossiers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1', fontSize: '0.875rem' }}>
                <CheckCircle2 size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                <span>Standardized Kenyan Shilling (KES) Financial Treasury Engine</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1', fontSize: '0.875rem' }}>
                <CheckCircle2 size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                <span>Multi-Role Access Control & Customized Task Allocations</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1', fontSize: '0.875rem' }}>
                <CheckCircle2 size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                <span>Automated 1-Click Operational Document & Letter Generator</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2rem' }}>
          &copy; {new Date().getFullYear()} {companyProfile?.legal_name || 'Akpali & Co.'}. All rights reserved.
        </div>
      </div>

      {/* RIGHT LOGIN CARD PANEL */}
      <div className="login-card-panel">
        
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: '20px', background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.85rem' }}>
            <ShieldCheck size={16} /> Secure Authentication Gateway
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#fff' }}>
            Sign In to Akpali Portal
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
            Enter your authorized corporate email address and password to access the ERP:
          </p>
        </div>

        {errorMessage && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: '600' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.45rem' }}>
              Work Email Address *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem' }} />
              <input 
                type="email" 
                required 
                placeholder="e.g. name@akpali.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 0.85rem 0.8rem 2.6rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.45rem' }}>
              Password *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem' }} />
              <input 
                type="password" 
                required 
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 0.85rem 0.8rem 2.6rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
              <span>Remember session</span>
            </label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('To reset your account password, contact your Executive Administrator in System Settings.'); }} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
              Forgot password?
            </a>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s', marginTop: '0.5rem', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}
          >
            {isSubmitting ? 'Authenticating Credentials...' : 'Sign In to Portal'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* 1-CLICK ROLE QUICK-TEST SELECTOR */}
        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <KeyRound size={14} color="#38bdf8" /> 1-Click Role Switch & Test Credentials:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button 
              type="button" 
              onClick={() => handleQuickFill('admin@akpali.com', 'password123')}
              style={{ padding: '0.5rem 0.35rem', background: email === 'admin@akpali.com' ? 'rgba(2, 132, 199, 0.25)' : '#1e293b', border: email === 'admin@akpali.com' ? '1px solid #0284c7' : '1px solid #334155', borderRadius: '6px', color: '#38bdf8', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
            >
              👑 Admin
            </button>
            <button 
              type="button" 
              onClick={() => handleQuickFill('operations@akpali.com', 'password123')}
              style={{ padding: '0.5rem 0.35rem', background: email === 'operations@akpali.com' ? 'rgba(22, 163, 74, 0.25)' : '#1e293b', border: email === 'operations@akpali.com' ? '1px solid #16a34a' : '1px solid #334155', borderRadius: '6px', color: '#4ade80', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
            >
              🏗️ Operations
            </button>
            <button 
              type="button" 
              onClick={() => handleQuickFill('finance@akpali.com', 'password123')}
              style={{ padding: '0.5rem 0.35rem', background: email === 'finance@akpali.com' ? 'rgba(217, 119, 6, 0.25)' : '#1e293b', border: email === 'finance@akpali.com' ? '1px solid #d97706' : '1px solid #334155', borderRadius: '6px', color: '#fbbf24', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
            >
              💳 Finance
            </button>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'center' }}>
            Click any role to test its specific rights, dashboard tasks, and authorized modules.
          </div>
        </div>

      </div>
    </div>
  )
}
