import React, { useState, useEffect } from 'react'
import { Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck, KeyRound, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useRole } from '../context/RoleContext'

export default function LoginPage({ onLoginSuccess, companyProfile: initialProfile }) {
  const { setCurrentRole } = useRole()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [companyProfile, setCompanyProfile] = useState(initialProfile || null)

  // Mandatory password change state for new users
  const [requirePasswordChange, setRequirePasswordChange] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changeError, setChangeError] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (!companyProfile) {
      fetch('http://localhost:5000/api/company')
        .then(res => res.json())
        .then(data => setCompanyProfile(data))
        .catch(err => console.error('Could not fetch company profile for login:', err))
    }
  }, [companyProfile])

  const completeLogin = (user) => {
    setCurrentRole(user.role || 'Admin')

    const userSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'Admin',
      title: user.title || 'System User',
      loggedInAt: new Date().toISOString()
    }

    localStorage.setItem('akpali_user_session', JSON.stringify(userSession))
    window.dispatchEvent(new Event('userSessionUpdated'))
    if (onLoginSuccess) onLoginSuccess(userSession)
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

      // If user must change password (newly created non-admin user)
      if (data.mustChangePassword && data.user) {
        setIsSubmitting(false)
        setPendingUser(data.user)
        setRequirePasswordChange(true)
        return
      }

      if (data.user) {
        setIsSubmitting(false)
        completeLogin(data.user)
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

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault()
    setChangeError('')

    if (newPassword.length < 6) {
      setChangeError('New password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setChangeError('Passwords do not match. Please verify and re-enter.')
      return
    }

    if (newPassword === 'password123') {
      setChangeError('Please choose a personal password different from the temporary default password.')
      return
    }

    setIsChangingPassword(true)

    try {
      const res = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pendingUser?.id,
          email: pendingUser?.email,
          newPassword: newPassword.trim(),
          confirmPassword: confirmPassword.trim()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setChangeError(data.error || 'Failed to update password. Please try again.')
        setIsChangingPassword(false)
        return
      }

      if (data.user) {
        setIsChangingPassword(false)
        completeLogin(data.user)
      }
    } catch (err) {
      console.error('Password change error:', err)
      setChangeError('Network error while updating password. Please try again.')
      setIsChangingPassword(false)
    }
  }

  const handleBackToLogin = () => {
    setRequirePasswordChange(false)
    setPendingUser(null)
    setNewPassword('')
    setConfirmPassword('')
    setChangeError('')
    setPassword('')
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

      {/* RIGHT CARD PANEL */}
      <div className="login-card-panel">
        
        {!requirePasswordChange ? (
          /* STANDARD SIGN IN FORM */
          <>
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
                    placeholder="Enter work email address (e.g. name@akpali.com)"
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
                    placeholder="Enter password"
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
          </>
        ) : (
          /* MANDATORY PASSWORD CHANGE FORM FOR NEW USERS */
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.85rem' }}>
                <KeyRound size={16} /> Mandatory Security Action
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#fff' }}>
                Create Your Personal Password
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>
                Welcome, <strong style={{ color: '#38bdf8' }}>{pendingUser?.name}</strong> (<span style={{ color: '#a5f3fc' }}>{pendingUser?.role}</span>). Company security policy requires all new users to set a personalized password before gaining access to the ERP.
              </p>
            </div>

            {changeError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: '600' }}>
                ⚠️ {changeError}
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.45rem' }}>
                  New Secure Password *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem' }} />
                  <input 
                    type="password" 
                    required 
                    minLength={6}
                    placeholder="Enter new password (min. 6 characters)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem 0.85rem 0.8rem 2.6rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                  Minimum 6 characters. Must differ from the default password.
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '0.45rem' }}>
                  Confirm New Password *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem' }} />
                  <input 
                    type="password" 
                    required 
                    minLength={6}
                    placeholder="Re-enter new password to confirm"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem 0.85rem 0.8rem 2.6rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
                {confirmPassword && (
                  <span style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem', color: newPassword === confirmPassword ? '#4ade80' : '#f87171', fontWeight: '600' }}>
                    {newPassword === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button 
                  type="submit" 
                  disabled={isChangingPassword}
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: 'none', background: '#059669', color: '#fff', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }}
                >
                  {isChangingPassword ? 'Saving Password...' : 'Save Password & Enter Portal'}
                  <CheckCircle2 size={18} />
                </button>

                <button 
                  type="button" 
                  onClick={handleBackToLogin}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s' }}
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  )
}
