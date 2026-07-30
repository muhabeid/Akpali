import React, { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Truck, ShoppingCart, Landmark, Menu, Inbox, Search, Bell, HelpCircle, ShieldAlert, LogOut, User, Globe } from 'lucide-react'
import { CurrencyProvider, useCurrency } from './context/CurrencyContext'

import Dashboard from './pages/Dashboard'
import Tenders from './pages/Tenders'
import Procurement from './pages/Procurement'
import Finances from './pages/Finances'
import CorporateHub from './pages/CorporateHub'
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

import OperationalDocumentGeneratorModal from './components/OperationalDocumentGeneratorModal'

export const RoleContext = createContext();

const Sidebar = ({ companyProfile }) => {
  const logoUrl = companyProfile?.logo_url ? (
    companyProfile.logo_url.startsWith('http') ? companyProfile.logo_url : `http://localhost:5000${companyProfile.logo_url}`
  ) : '/logo.png'

  return (
    <aside className="sidebar">
      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 1.25rem 1.5rem 1.25rem', borderBottom: '1px solid hsla(var(--border), 0.5)', marginBottom: '1rem' }}>
        <img 
          src={logoUrl} 
          alt="Company Logo" 
          style={{ height: '36px', width: '36px', objectFit: 'contain', borderRadius: '6px' }}
          onError={(e) => { e.target.src = '/logo.png'; e.target.onerror = null; }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'hsl(var(--text-primary))', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={companyProfile?.legal_name || 'AKPALI COMPANY LIMITED'}>
            {companyProfile?.legal_name || companyProfile?.trading_name || 'AKPALI COMPANY LIMITED'}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-secondary))', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Corporate Portal
          </span>
        </div>
      </div>
      <nav className="nav-menu">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/tenders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          Tenders & Projects
        </NavLink>
        <NavLink to="/procurement" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShoppingCart size={20} />
          Procurement
        </NavLink>
        <NavLink to="/finances" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Landmark size={20} />
          Finance
        </NavLink>
        <NavLink to="/corporate" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShieldAlert size={20} />
          Corporate Hub
        </NavLink>
      </nav>
    </aside>
  )
}

const Topbar = ({ setGlobalDrawer }) => {
  const { currentRole, setCurrentRole } = useContext(RoleContext);
  const { currency, setCurrency, rates, isLive, lastUpdated } = useCurrency();
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  
  const getPageTitle = (path) => {
    switch(path) {
      case '/': return 'Dashboard Overview'
      case '/tenders': return 'Tenders & Projects'
      case '/procurement': return 'Procurement & Inventory'
      case '/finances': return 'Finance'
      case '/corporate': return 'Corporate Management & Admin'
      default: return 'TenderPro'
    }
  }

  return (
    <header className="topbar">
      <h2>{getPageTitle(location.pathname)}</h2>
      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
        
        {/* Real-Time Multi-Currency Switcher Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'hsla(var(--primary), 0.1)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid hsla(var(--primary), 0.2)' }}>
          <Globe size={16} color="hsl(var(--primary))" />
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>Currency:</span>
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
            style={{ fontSize: '0.78rem', background: 'transparent', border: 'none', color: 'hsl(var(--text-primary))', fontWeight: '700', cursor: 'pointer', outline: 'none' }}
          >
            <option value="USD">💵 USD ($)</option>
            <option value="KES">🇰🇪 KES (KSh)</option>
            <option value="TZS">🇹🇿 TZS (TSh)</option>
          </select>
          <span style={{ fontSize: '0.68rem', color: isLive ? 'hsl(var(--success))' : 'hsl(var(--text-secondary))', fontWeight: '600', marginLeft: '0.2rem' }} title={`Live Rates: 1 USD = ${rates.KES} KES | ${rates.TZS} TZS (Updated: ${lastUpdated})`}>
            {isLive ? '• Live' : '• System'}
          </span>
        </div>

        {/* Global Operational Document Generator Shortcut */}
        <button 
          type="button"
          className="btn btn-primary" 
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          onClick={() => setGlobalDrawer('op_doc')}
          title="Generate Contract, QA/QC Inspection, Site Visit Report, or Material Request Form"
        >
          <FileText size={16} /> + Operational Documents
        </button>



        {/* Global Utilities - Hover Dropdown */}
        <div 
          style={{ position: 'relative' }}
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <button 
            className="btn" 
            style={{ padding: '0.5rem', background: menuOpen ? 'hsla(var(--primary), 0.2)' : 'transparent', color: menuOpen ? 'hsl(var(--primary))' : 'hsl(var(--text-primary))' }} 
            title="Global Utilities"
          >
            <Menu size={24} />
          </button>
          
          {menuOpen && (
            <div style={{ position: 'absolute', top: '100%', right: '0', paddingTop: '0.5rem', width: '280px', zIndex: 100 }}>
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
            <span style={{ color: profileOpen ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))', fontWeight: 'bold' }}>JD</span>
          </div>

          {profileOpen && (
            <div style={{ position: 'absolute', top: '100%', right: '0', paddingTop: '0.5rem', width: '250px', zIndex: 100 }}>
              <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid hsla(var(--border), 0.5)', marginBottom: '0.25rem' }}>
                  <strong>John Doe</strong>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>Administrator</p>
                </div>
                <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', width: '100%', color: 'hsl(var(--text-primary))' }} onClick={() => { setGlobalDrawer('profile'); setProfileOpen(false); }}><User size={18}/> Edit Profile</button>
                <div style={{ height: '1px', background: 'hsl(var(--border))', margin: '0.25rem 0' }} />
                <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', width: '100%', color: 'hsl(var(--danger))' }} onClick={() => alert('Logging out...')}><LogOut size={18}/> Log Out</button>
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
  const [currentRole, setCurrentRole] = useState('Admin')
  const [companyProfile, setCompanyProfile] = useState(null)

  useEffect(() => {
    fetch('http://localhost:5000/api/company')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setCompanyProfile(data)
      })
      .catch(() => {})
  }, [])

  return (
    <CurrencyProvider>
      <RoleContext.Provider value={{ currentRole, setCurrentRole }}>
        <div className="app-container">
          <Sidebar companyProfile={companyProfile} />
          <main className="main-content">
            <Topbar setGlobalDrawer={setGlobalDrawer} />
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

      <Drawer isOpen={globalDrawer === 'profile'} onClose={() => setGlobalDrawer(null)} title="Edit Profile" submitText="Save Changes" onSubmit={() => { alert('Profile Updated!'); setGlobalDrawer(null) }}>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" className="form-control" defaultValue="John Doe" />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" className="form-control" defaultValue="admin@tenderpro.com" />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input type="text" className="form-control" defaultValue="+254 700 123456" />
        </div>
      </Drawer>

        </div>
      </RoleContext.Provider>
    </CurrencyProvider>
  )
}

export default App
