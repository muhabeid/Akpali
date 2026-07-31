import React, { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Truck, ShoppingCart, Landmark, Menu, Inbox, Search, Bell, HelpCircle, ShieldAlert, LogOut, User, Globe, Shield, UserCheck } from 'lucide-react'
import { CurrencyProvider, useCurrency } from './context/CurrencyContext'
import { RoleProvider, useRole, ROLES } from './context/RoleContext'

import Dashboard from './pages/Dashboard'
import Tenders from './pages/Tenders'
import Procurement from './pages/Procurement'
import Finances from './pages/Finances'
import CorporateHub from './pages/CorporateHub'
import LoginPage from './pages/LoginPage'
import Drawer from './components/Drawer'
import NewClientForm from './components/NewClientForm'
import NewSupplierForm from './components/NewSupplierForm'
import NewTenderForm from './components/NewTenderForm'
import RecordTransactionForm from './components/RecordTransactionForm'
import NewPurchaseOrderForm from './components/NewPurchaseOrderForm'
import UploadDocumentForm from './components/UploadDocumentForm'
import InviteUserForm from './components/InviteUserForm'
import BankAccountForm from './components/BankAccountForm'
import ApprovalWorkflowForm from './components/ApprovalWorkflowForm'
import LegalContractForm from './components/LegalContractForm'
import EditProfileForm from './components/EditProfileForm'

import OperationalDocumentGeneratorModal from './components/OperationalDocumentGeneratorModal'

const Sidebar = ({ companyProfile, isMobileOpen, onCloseMobile }) => {
  const logoUrl = companyProfile?.logo_url ? (
    companyProfile.logo_url.startsWith('http') ? companyProfile.logo_url : `http://localhost:5000${companyProfile.logo_url}`
  ) : '/logo.png'

  return (
    <>
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`} 
        onClick={onCloseMobile}
      />
      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem', borderBottom: '1px solid hsla(var(--border), 0.5)', marginBottom: '1rem', position: 'relative' }}>
          <img 
            src={logoUrl} 
            alt="Company Logo" 
            style={{ height: '36px', width: '36px', objectFit: 'contain', borderRadius: '6px' }}
            onError={(e) => { e.target.src = '/logo.png'; e.target.onerror = null; }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
            <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'hsl(var(--text-primary))', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={companyProfile?.legal_name || 'AKPALI COMPANY LIMITED'}>
              {companyProfile?.legal_name || companyProfile?.trading_name || 'AKPALI COMPANY LIMITED'}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-secondary))', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.1rem' }}>
              Corporate Portal
            </span>
          </div>
          <button 
            className="mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>
        <nav className="nav-menu">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onCloseMobile} end>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/tenders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onCloseMobile}>
            <FileText size={20} />
            Tenders & Projects
          </NavLink>
          <NavLink to="/procurement" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onCloseMobile}>
            <ShoppingCart size={20} />
            Procurement
          </NavLink>
          <NavLink to="/finances" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onCloseMobile}>
            <Landmark size={20} />
            Finance
          </NavLink>
          <NavLink to="/corporate" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onCloseMobile}>
            <ShieldAlert size={20} />
            Corporate Hub
          </NavLink>
        </nav>
      </aside>
    </>
  )
}

const Topbar = ({ setGlobalDrawer, onLogout, userSession, onOpenMobileNav }) => {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  
  const getPageTitle = (path) => {
    switch(path) {
      case '/': return 'Dashboard Overview'
      case '/tenders': return 'Tenders & Projects'
      case '/procurement': return 'Procurement & Inventory'
      case '/finances': return 'Finance & Cashflow'
      case '/corporate': return 'Corporate Hub & Dossiers'
      default: return 'Akpali System'
    }
  }

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button 
          className="mobile-nav-toggle btn" 
          onClick={onOpenMobileNav}
          title="Open Navigation Menu"
        >
          <Menu size={22} />
        </button>
        <h2 className="topbar-title" style={{ margin: 0 }}>{getPageTitle(location.pathname)}</h2>
      </div>
      
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        
        {/* Hamburger Menu Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Menu size={18} />
            <span>Menu</span>
          </button>

          {menuOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, paddingTop: '0.5rem', width: '240px', zIndex: 100 }}>
              <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', width: '100%', color: 'hsl(var(--text-primary))' }} onClick={() => { setGlobalDrawer('inbox'); setMenuOpen(false); }}><Inbox size={18}/> My Inbox (2 Pending)</button>
                <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', width: '100%', color: 'hsl(var(--text-primary))' }} onClick={() => { setGlobalDrawer('search'); setMenuOpen(false); }}><Search size={18}/> Global Search</button>
                <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', width: '100%', color: 'hsl(var(--text-primary))' }} onClick={() => { setGlobalDrawer('notifications'); setMenuOpen(false); }}><Bell size={18}/> Notifications (5 New)</button>
                <div style={{ height: '1px', background: 'hsl(var(--border))', margin: '0.25rem 0' }} />
                <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', width: '100%', color: 'hsl(var(--text-primary))' }} onClick={() => { setGlobalDrawer('help'); setMenuOpen(false); }}><HelpCircle size={18}/> Contextual Help / SOPs</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile - Hover Dropdown */}
        <div 
          style={{ position: 'relative' }}
          onMouseEnter={() => setProfileOpen(true)}
          onMouseLeave={() => setProfileOpen(false)}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'hsl(var(--bg-card))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid hsl(var(--border))', cursor: 'pointer', background: profileOpen ? 'hsla(var(--primary), 0.2)' : 'hsl(var(--bg-card))', transition: 'all 0.2s ease' }}>
            <span style={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}>
              {userSession?.name ? userSession.name.split(' ').map(n=>n[0]).join('') : 'JD'}
            </span>
          </div>

          {profileOpen && (
            <div style={{ position: 'absolute', top: '100%', right: '0', paddingTop: '0.5rem', width: '240px', zIndex: 100 }}>
              <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid hsla(var(--border), 0.5)', marginBottom: '0.25rem' }}>
                  <strong>{userSession?.name || 'Eng. John Akpali'}</strong>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', margin: '0.1rem 0 0 0' }}>{userSession?.title || 'Executive Administrator'}</p>
                </div>
                <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', width: '100%', color: 'hsl(var(--text-primary))' }} onClick={() => { setGlobalDrawer('profile'); setProfileOpen(false); }}><User size={18}/> Edit Profile</button>
                <div style={{ height: '1px', background: 'hsl(var(--border))', margin: '0.25rem 0' }} />
                <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', width: '100%', color: 'hsl(var(--danger))' }} onClick={onLogout}><LogOut size={18}/> Log Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function App() {
  const [globalDrawer, setGlobalDrawer] = useState(null)
  const [companyProfile, setCompanyProfile] = useState(null)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [userSession, setUserSession] = useState(() => {
    const saved = localStorage.getItem('akpali_user_session')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    fetch('http://localhost:5000/api/company')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setCompanyProfile(data)
      })
      .catch(() => {})

    const handleSessionUpdate = () => {
      const saved = localStorage.getItem('akpali_user_session')
      if (saved) setUserSession(JSON.parse(saved))
    }
    window.addEventListener('userSessionUpdated', handleSessionUpdate)
    window.addEventListener('storage', handleSessionUpdate)
    return () => {
      window.removeEventListener('userSessionUpdated', handleSessionUpdate)
      window.removeEventListener('storage', handleSessionUpdate)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('akpali_user_session')
    setUserSession(null)
  }

  if (!userSession) {
    return (
      <RoleProvider>
        <LoginPage onLoginSuccess={setUserSession} companyProfile={companyProfile} />
      </RoleProvider>
    )
  }

  return (
    <CurrencyProvider>
      <RoleProvider>
        <div className="app-container">
          <Sidebar 
            companyProfile={companyProfile} 
            isMobileOpen={isMobileNavOpen}
            onCloseMobile={() => setIsMobileNavOpen(false)}
          />
          <main className="main-content">
            <Topbar 
              setGlobalDrawer={setGlobalDrawer} 
              onLogout={handleLogout} 
              userSession={userSession} 
              onOpenMobileNav={() => setIsMobileNavOpen(true)}
            />
          <div className="page-container">
          <Routes>
            <Route path="/" element={<Dashboard setGlobalDrawer={setGlobalDrawer} />} />
            <Route path="/tenders" element={<Tenders setGlobalDrawer={setGlobalDrawer} />} />
            <Route path="/procurement" element={<Procurement setGlobalDrawer={setGlobalDrawer} />} />
            <Route path="/finances" element={<Finances setGlobalDrawer={setGlobalDrawer} />} />
            <Route path="/corporate" element={<CorporateHub setGlobalDrawer={setGlobalDrawer} />} />
          </Routes>
        </div>
      </main>

      {/* Operational Document Generator Modal */}
      {globalDrawer === 'op_doc' && (
        <OperationalDocumentGeneratorModal onClose={() => setGlobalDrawer(null)} />
      )}

      {/* Global Drawers */}
      <Drawer isOpen={globalDrawer === 'tender'} onClose={() => setGlobalDrawer(null)} title="Create New Tender" onSubmit={() => { setGlobalDrawer(null) }} width="800px">
        <NewTenderForm />
      </Drawer>

      <Drawer isOpen={globalDrawer === 'new_client'} onClose={() => setGlobalDrawer(null)} title="Add New Client" onSubmit={() => { alert('Client Added!'); setGlobalDrawer(null) }} width="800px">
        <NewClientForm />
      </Drawer>

      <Drawer isOpen={globalDrawer === 'new_supplier'} onClose={() => setGlobalDrawer(null)} title="Add New Supplier" onSubmit={() => { alert('Supplier Added!'); setGlobalDrawer(null) }} width="800px">
        <NewSupplierForm />
      </Drawer>

      <Drawer isOpen={globalDrawer === 'new_po'} onClose={() => setGlobalDrawer(null)} title="Raise Purchase Order" width="800px">
        <NewPurchaseOrderForm />
      </Drawer>

      <Drawer isOpen={globalDrawer === 'upload_document'} onClose={() => setGlobalDrawer(null)} title="Upload Corporate Document">
        <UploadDocumentForm onSuccess={() => setGlobalDrawer(null)} />
      </Drawer>

      <Drawer isOpen={globalDrawer === 'invite_user'} onClose={() => setGlobalDrawer(null)} title="Invite User to System">
        <InviteUserForm onSuccess={() => setGlobalDrawer(null)} />
      </Drawer>

      <Drawer isOpen={globalDrawer === 'bank_account'} onClose={() => setGlobalDrawer(null)} title="Add Bank Account">
        <BankAccountForm onSuccess={() => setGlobalDrawer(null)} />
      </Drawer>

      <Drawer isOpen={globalDrawer === 'approval_workflow'} onClose={() => setGlobalDrawer(null)} title="Create Approval Rule">
        <ApprovalWorkflowForm onSuccess={() => setGlobalDrawer(null)} />
      </Drawer>

      <Drawer isOpen={globalDrawer === 'legal_contract'} onClose={() => setGlobalDrawer(null)} title="Log Legal Contract">
        <LegalContractForm onSuccess={() => setGlobalDrawer(null)} />
      </Drawer>

      <Drawer isOpen={globalDrawer === 'transaction'} onClose={() => setGlobalDrawer(null)} title="Record Transaction" onSubmit={() => { setGlobalDrawer(null) }} width="800px">
        <RecordTransactionForm />
      </Drawer>

      <Drawer isOpen={globalDrawer === 'inbox'} onClose={() => setGlobalDrawer(null)} title="My Inbox (2 Pending)" onSubmit={() => { alert('Task Approved!'); setGlobalDrawer(null) }}>
        <div style={{ padding: '1rem', background: 'hsla(var(--warning), 0.1)', borderLeft: '4px solid hsl(var(--warning))', marginBottom: '1rem' }}>
          <strong>Pending Approval</strong>
          <p>LPO-2023-160 exceeds budget by $5,000.</p>
        </div>
        <div style={{ padding: '1rem', background: 'hsla(var(--primary), 0.1)', borderLeft: '4px solid hsl(var(--primary))' }}>
          <strong>3-Way Match Exception</strong>
          <p>Invoice INV-99 does not match GRN.</p>
        </div>
      </Drawer>

      <Drawer isOpen={globalDrawer === 'roles'} onClose={() => setGlobalDrawer(null)} title="Roles & Permissions" submitText="Save Roles" onSubmit={() => { alert('Roles Saved!'); setGlobalDrawer(null) }}>
        <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '1rem' }}>Manage system access levels.</p>
        <label><input type="checkbox" defaultChecked /> Can Create Tenders</label><br/>
        <label><input type="checkbox" defaultChecked /> Can Approve LPOs (Maker-Checker)</label><br/>
        <label><input type="checkbox" /> Can Process Payments</label>
      </Drawer>
      
      <Drawer isOpen={globalDrawer === 'search'} onClose={() => setGlobalDrawer(null)} title="Global Search" submitText="Search">
        <input type="text" className="form-control" placeholder="Search by Tender ID, LPO, PO, Invoice, or Supplier..." autoFocus />
      </Drawer>

      <Drawer isOpen={globalDrawer === 'notifications'} onClose={() => setGlobalDrawer(null)} title="Notifications (5 New)" submitText="Mark All as Read" onSubmit={() => { setGlobalDrawer(null) }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <strong>New Delivery Recorded</strong>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>400 bags of cement delivered for LPO-2023-160.</p>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))' }}>10 mins ago</span>
          </div>
          <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <strong>Invoice Overdue</strong>
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>INV-2023-001 is now 5 days overdue.</p>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger))' }}>2 hours ago</span>
          </div>
        </div>
      </Drawer>

      <Drawer isOpen={globalDrawer === 'help'} onClose={() => setGlobalDrawer(null)} title="Contextual Help & Corporate SOPs" width="750px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.875rem' }}>
          
          <div style={{ background: 'hsla(var(--primary), 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid hsl(var(--primary))' }}>
            <h4 style={{ margin: '0 0 0.3rem 0', color: 'hsl(var(--primary))' }}>📖 Corporate Platform Operating Manual & Guidelines</h4>
            <p style={{ margin: 0, fontSize: '0.825rem', color: 'hsl(var(--text-secondary))' }}>
              Welcome to the Akpali Corporate Management Portal. Below are the Standard Operating Procedures (SOPs) for key platform workflows.
            </p>
          </div>

          {/* SOP SECTION 1: TENDERS & SALES */}
          <div className="card" style={{ padding: '1rem', border: '1px solid hsl(var(--border))' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--primary))' }}>
              <FileText size={18} /> 1. Tenders, Quotations & Client LPOs
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.6', color: 'hsl(var(--text-secondary))' }}>
              <li><strong>Creating Tenders:</strong> Navigate to <em>Tenders & Projects</em> and click <code>+ New Tender</code> to record client reference numbers and target budgets.</li>
              <li><strong>Issuing Quotations & Delivery Notes:</strong> Expand any tender to preview and print official Sales Quotations and Delivery Notes with company logo and stamp.</li>
              <li><strong>Client LPOs:</strong> Record incoming Client Local Purchase Orders to lock in contractual commitments.</li>
            </ul>
          </div>

          {/* SOP SECTION 2: PROCUREMENT & 3-WAY MATCHING */}
          <div className="card" style={{ padding: '1rem', border: '1px solid hsl(var(--border))' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--primary))' }}>
              <ShoppingCart size={18} /> 2. Procurement, AI OCR & 3-Way Matching
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.6', color: 'hsl(var(--text-secondary))' }}>
              <li><strong>Raising Supplier POs:</strong> Issue Purchase Orders to registered suppliers under competitive pricing.</li>
              <li><strong>Goods Received Notes (GRN):</strong> Record site delivery receipts to verify item quantities against POs.</li>
              <li><strong>AI Vision OCR:</strong> Upload supplier invoices to automatically extract data via TenderPro AI Vision.</li>
              <li><strong>3-Way Matching:</strong> System verifies PO value vs. GRN delivery vs. Invoice amount before payment authorization.</li>
            </ul>
          </div>

          {/* SOP SECTION 3: CORPORATE HUB & DOSSIER EXPORT */}
          <div className="card" style={{ padding: '1rem', border: '1px solid hsl(var(--border))' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--primary))' }}>
              <ShieldAlert size={18} /> 3. Corporate Hub & Qualification Dossiers
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.6', color: 'hsl(var(--text-secondary))' }}>
              <li><strong>Company Profile:</strong> Manage legal name, address, tax PIN, bank accounts, and upload official logo/stamp files.</li>
              <li><strong>Statutory Licenses:</strong> Upload compliance certificates, tax clearance, and track expiry alerts.</li>
              <li><strong>Dossier Generator:</strong> Click <code>View Live Profile Dossier</code> in Corporate Hub to generate and print pre-qualification dossiers with watermark, logo, and seal.</li>
            </ul>
          </div>

          {/* SOP SECTION 4: OPERATIONAL DOCUMENTS */}
          <div className="card" style={{ padding: '1rem', border: '1px solid hsl(var(--border))' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--primary))' }}>
              <FileText size={18} /> 4. Operational Documents Generator
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.6', color: 'hsl(var(--text-secondary))' }}>
              <li>Click <code>+ Operational Documents</code> in the top navigation bar to generate subcontracts, site diaries, QA/QC inspection reports, and variation orders instantly.</li>
            </ul>
          </div>

        </div>
      </Drawer>

      <Drawer isOpen={globalDrawer === 'profile'} onClose={() => setGlobalDrawer(null)} title="User Profile & Role Allocation">
        <EditProfileForm onClose={() => setGlobalDrawer(null)} />
      </Drawer>

        </div>
      </RoleProvider>
    </CurrencyProvider>
  )
}

export default App
