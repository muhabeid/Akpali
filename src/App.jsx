import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Truck, ShoppingCart, Landmark, Menu, Inbox, Search, Bell, HelpCircle, ShieldAlert, LogOut, User, Globe, Shield, UserCheck, PlusCircle, CheckCircle2, AlertTriangle, ArrowRight, X, Building2, FileCheck } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Tenders from './pages/Tenders'
import Procurement from './pages/Procurement'
import Finances from './pages/Finances'
import CorporateHub from './pages/CorporateHub'
import Drawer from './components/Drawer'
import EditProfileForm from './components/EditProfileForm'
import InviteUserForm from './components/InviteUserForm'
import BankAccountForm from './components/BankAccountForm'
import ApprovalWorkflowForm from './components/ApprovalWorkflowForm'
import LegalContractForm from './components/LegalContractForm'
import RecordTransactionForm from './components/RecordTransactionForm'
import CompanyProfileDossier from './components/CompanyProfileDossier'
import { printElement } from './utils/printHelper'
import { CurrencyProvider, useCurrency } from './context/CurrencyContext'
import { RoleProvider, useRole } from './context/RoleContext'

function Header({ onOpenMobileNav, globalDrawer, setGlobalDrawer, userSession, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { currency, setCurrency, rates } = useCurrency()
  const { currentRole, setRole, ROLES } = useRole()
  
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Pending Maker-Checker items count
  const [pendingApprovals, setPendingApprovals] = useState([
    { id: 'APPR-101', type: 'PO Limit Exceeded', title: 'Purchase Order PO-2026-004 exceeds ceiling by KSh 450,000', detail: 'Requested by Logistics Team for Bamburi Cement', date: '10 mins ago', status: 'Pending' },
    { id: 'APPR-102', type: '3-Way Match Mismatch', title: 'Supplier Invoice INV-99 total does not match Delivery Note GRN-12', detail: 'Discrepancy of KSh 12,000 in transportation surcharge', date: '1 hour ago', status: 'Pending' }
  ])

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 'NOTIF-1', cat: 'Urgent', title: 'Overdue Client Invoice INV-2026-001', desc: 'Invoice for Crown Paints project is now 5 days overdue.', time: '2 hours ago', unread: true },
    { id: 'NOTIF-2', cat: 'Operations', title: 'Site Delivery Recorded', desc: '500 bags of cement delivered for Tender #4092.', time: '10 mins ago', unread: true },
    { id: 'NOTIF-3', cat: 'Approvals', title: 'New Supplier Quotation Received', desc: 'Simba Cement submitted quote for RFQ-2026-08.', time: '1 day ago', unread: false }
  ])
  const [notifFilter, setNotifFilter] = useState('All')

  // Keyboard shortcut Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setGlobalDrawer('search')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setGlobalDrawer])

  // Live Search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    const q = searchQuery.toLowerCase()

    Promise.all([
      fetch('http://localhost:5000/api/tenders').then(r => r.json()).catch(() => []),
      fetch('http://localhost:5000/api/pos').then(r => r.json()).catch(() => []),
      fetch('http://localhost:5000/api/supplier_invoices').then(r => r.json()).catch(() => []),
      fetch('http://localhost:5000/api/clients').then(r => r.json()).catch(() => [])
    ]).then(([tenders, pos, invoices, clients]) => {
      const matchedTenders = tenders.filter(t => (t.id || '').toLowerCase().includes(q) || (t.name || '').toLowerCase().includes(q) || (t.client || '').toLowerCase().includes(q)).map(t => ({ type: 'Tender / Project', title: `${t.id} - ${t.name}`, sub: `Client: ${t.client || 'N/A'}`, path: '/tenders' }))
      const matchedPOs = pos.filter(p => (p.id || '').toLowerCase().includes(q) || (p.supplier_name || '').toLowerCase().includes(q)).map(p => ({ type: 'Purchase Order', title: `${p.id} - ${p.supplier_name}`, sub: `Value: KSh ${p.total_value?.toLocaleString() || 0}`, path: '/procurement' }))
      const matchedInvoices = invoices.filter(i => (i.id || '').toLowerCase().includes(q) || (i.supplier_name || '').toLowerCase().includes(q)).map(i => ({ type: 'Supplier Invoice', title: `${i.id} - ${i.supplier_name}`, sub: `Amount: KSh ${i.amount?.toLocaleString() || 0}`, path: '/finances' }))
      const matchedClients = clients.filter(c => (c.name || '').toLowerCase().includes(q) || (c.id || '').toLowerCase().includes(q)).map(c => ({ type: 'Client Directory', title: `${c.id || 'CLI'} - ${c.name}`, sub: `Tax PIN: ${c.tax_pin || 'N/A'}`, path: '/corporate' }))

      setSearchResults([...matchedTenders, ...matchedPOs, ...matchedInvoices, ...matchedClients])
      setSearchLoading(false)
    })
  }, [searchQuery])

  const getPageTitle = (path) => {
    switch (path) {
      case '/': return 'Dashboard'
      case '/tenders': return 'Tenders & Sales Operations'
      case '/procurement': return 'Procurement'
      case '/finances': return 'Finance & Corporate Bookkeeping'
      case '/corporate': return 'Corporate Governance & Administration'
      default: return 'Akpali Corporate ERP'
    }
  }

  const handleApproveItem = (id) => {
    setPendingApprovals(prev => prev.filter(item => item.id !== id))
    alert(`✅ Approval Item '${id}' has been verified and authorized. Audit record created!`)
  }

  const unreadNotifCount = notifications.filter(n => n.unread).length

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
        <h2 className="topbar-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'hsl(var(--primary))' }}>
          {getPageTitle(location.pathname)}
        </h2>
      </div>
      
      {/* TOPBAR ACTION CONTROL BAR */}
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        
        {/* REAL-TIME GLOBAL SEARCH BUTTON (CTRL+K) */}
        <button 
          type="button"
          className="btn" 
          onClick={() => setGlobalDrawer('search')}
          style={{ 
            background: 'hsla(var(--border), 0.2)', 
            color: 'hsl(var(--text-secondary))', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            border: '1px solid hsl(var(--border))'
          }}
        >
          <Search size={15} />
          <span style={{ display: 'none', minWidth: '120px', textAlign: 'left' }}>Search ERP...</span>
          <span className="mobile-hide" style={{ background: '#334155', color: '#fff', fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>Ctrl + K</span>
        </button>

        {/* MAKER-CHECKER INBOX ACTION BUTTON WITH BADGE */}
        <button 
          type="button"
          className="btn" 
          onClick={() => setGlobalDrawer('inbox')}
          style={{ 
            position: 'relative',
            background: pendingApprovals.length > 0 ? 'rgba(239, 68, 68, 0.12)' : 'hsla(var(--border), 0.2)', 
            color: pendingApprovals.length > 0 ? '#ef4444' : 'hsl(var(--text-primary))',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            border: pendingApprovals.length > 0 ? '1px solid #ef4444' : '1px solid hsl(var(--border))',
            fontWeight: 'bold'
          }}
        >
          <Inbox size={16} />
          <span>Inbox</span>
          {pendingApprovals.length > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', borderRadius: '10px', padding: '0.1rem 0.45rem', fontWeight: '800' }}>
              {pendingApprovals.length}
            </span>
          )}
        </button>

        {/* CATEGORIZED NOTIFICATION BELL WITH BADGE */}
        <button 
          type="button"
          className="btn" 
          onClick={() => {
            setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
            setGlobalDrawer('notifications')
          }}
          style={{ 
            position: 'relative',
            background: unreadNotifCount > 0 ? 'rgba(245, 158, 11, 0.12)' : 'hsla(var(--border), 0.2)', 
            color: unreadNotifCount > 0 ? '#f59e0b' : 'hsl(var(--text-primary))',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            border: unreadNotifCount > 0 ? '1px solid #f59e0b' : '1px solid hsl(var(--border))',
            fontWeight: 'bold'
          }}
        >
          <Bell size={16} />
          <span style={{ display: 'none' }}>Alerts</span>
          {unreadNotifCount > 0 && (
            <span style={{ background: '#f59e0b', color: '#fff', fontSize: '0.7rem', borderRadius: '10px', padding: '0.1rem 0.45rem', fontWeight: '800' }}>
              {unreadNotifCount}
            </span>
          )}
        </button>

        {/* MASTER COMMAND MENU DROPDOWN */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', background: '#4A8BCE', border: 'none', fontWeight: 'bold' }}
          >
            <Menu size={18} />
            <span>Master Menu</span>
          </button>

          {menuOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, paddingTop: '0.5rem', width: '270px', zIndex: 100 }}>
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: '#fff' }}>
                
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', padding: '0.2rem 0.5rem' }}>⚡ QUICK LAUNCHERS</div>

                <button className="btn" style={{ justifyContent: 'flex-start', background: '#1e293b', color: '#38bdf8', fontSize: '0.8rem', border: '1px solid #334155' }} onClick={() => { navigate('/tenders'); setMenuOpen(false); }}>
                  <PlusCircle size={15} /> + Create New Tender
                </button>
                <button className="btn" style={{ justifyContent: 'flex-start', background: '#1e293b', color: '#10b981', fontSize: '0.8rem', border: '1px solid #334155' }} onClick={() => { navigate('/finances'); setMenuOpen(false); }}>
                  <PlusCircle size={15} /> + Post Journal Entry
                </button>
                <button className="btn" style={{ justifyContent: 'flex-start', background: '#1e293b', color: '#f59e0b', fontSize: '0.8rem', border: '1px solid #334155' }} onClick={() => { setGlobalDrawer('transaction'); setMenuOpen(false); }}>
                  <PlusCircle size={15} /> + Record Cashbook Payment
                </button>
                
                <div style={{ height: '1px', background: '#334155', margin: '0.2rem 0' }} />
                
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', padding: '0.2rem 0.5rem' }}>📋 CORPORATE DOSSIER</div>

                <button className="btn" style={{ justifyContent: 'flex-start', background: '#1e293b', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #334155' }} onClick={() => { setGlobalDrawer('dossier'); setMenuOpen(false); }}>
                  <FileCheck size={16}/> Corporate Dossier
                </button>
                <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', color: '#fff', fontSize: '0.85rem' }} onClick={() => { setGlobalDrawer('help'); setMenuOpen(false); }}>
                  <HelpCircle size={16}/> System SOPs & Manual
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PROFILE DROPDOWN */}
        <div 
          style={{ position: 'relative' }}
          onMouseEnter={() => setProfileOpen(true)}
          onMouseLeave={() => setProfileOpen(false)}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#4A8BCE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontWeight: 'bold', border: '2px solid #38bdf8' }}>
            {userSession?.name ? userSession.name.split(' ').map(n=>n[0]).join('') : 'JD'}
          </div>

          {profileOpen && (
            <div style={{ position: 'absolute', top: '100%', right: '0', paddingTop: '0.5rem', width: '230px', zIndex: 100 }}>
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#fff' }}>
                <div style={{ padding: '0.5rem', borderBottom: '1px solid #334155', marginBottom: '0.25rem' }}>
                  <strong style={{ color: '#38bdf8' }}>{userSession?.name || 'Eng. John Akpali'}</strong>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.1rem 0 0 0' }}>{userSession?.title || 'Executive Administrator'}</p>
                </div>
                <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', color: '#fff', fontSize: '0.8rem' }} onClick={() => { setGlobalDrawer('profile'); setProfileOpen(false); }}><User size={16}/> Edit Profile</button>
                <div style={{ height: '1px', background: '#334155', margin: '0.2rem 0' }} />
                <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', color: '#f43f5e', fontSize: '0.8rem' }} onClick={onLogout}><LogOut size={16}/> Log Out</button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* DRAWERS FOR SEARCH, INBOX & NOTIFICATIONS */}
      
      {/* 1. LIVE GLOBAL SEARCH MODAL */}
      <Drawer isOpen={globalDrawer === 'search'} onClose={() => setGlobalDrawer(null)} title="🔍 Live Real-Time Global ERP Search" isModal={true} width="750px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search Tenders, POs, Invoices, Clients, or Suppliers..." 
              autoFocus 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ fontSize: '1rem', padding: '0.75rem 1rem 0.75rem 2.6rem', borderRadius: '8px' }}
            />
            <Search size={20} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
          </div>

          <div style={{ minHeight: '250px' }}>
            {searchLoading ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>Searching ERP database...</div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
                {searchQuery ? `No results found matching "${searchQuery}".` : 'Type any keyword, reference ID, or supplier name above.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'hsl(var(--text-secondary))' }}>Found {searchResults.length} Match(es):</div>
                {searchResults.map((res, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      navigate(res.path)
                      setGlobalDrawer(null)
                    }}
                    style={{ background: 'var(--bg-card)', border: '1px solid hsl(var(--border))', padding: '0.85rem 1.1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <span className="badge badge-primary" style={{ fontSize: '0.75rem', marginBottom: '0.2rem', padding: '0.15rem 0.5rem' }}>{res.type}</span>
                      <strong style={{ display: 'block', fontSize: '0.95rem', marginTop: '0.15rem' }}>{res.title}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{res.sub}</span>
                    </div>
                    <ArrowRight size={18} style={{ color: '#4A8BCE' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* 2. MAKER-CHECKER ACTIONABLE INBOX MODAL */}
      <Drawer isOpen={globalDrawer === 'inbox'} onClose={() => setGlobalDrawer(null)} title={`📥 Actionable Maker-Checker Inbox (${pendingApprovals.length} Pending)`} isModal={true} width="750px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {pendingApprovals.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={42} style={{ color: '#10b981' }} />
              <strong style={{ display: 'block', color: 'hsl(var(--text-primary))', fontSize: '1.1rem', marginTop: '0.5rem' }}>Your Inbox is Clear!</strong>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>There are no pending maker-checker approvals requiring your review.</p>
            </div>
          ) : (
            pendingApprovals.map((item) => (
              <div key={item.id} style={{ background: '#0f172a', border: '1px solid #334155', padding: '1.1rem', borderRadius: '10px', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>{item.type}</span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.date}</span>
                </div>
                <div>
                  <strong style={{ color: '#38bdf8', fontSize: '1rem' }}>{item.title}</strong>
                  <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.5' }}>{item.detail}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', borderTop: '1px solid #334155', paddingTop: '0.65rem' }}>
                  <button type="button" className="btn" style={{ background: '#f43f5e', color: '#fff', fontSize: '0.8rem', padding: '0.35rem 0.85rem', fontWeight: '600' }} onClick={() => setPendingApprovals(prev => prev.filter(x => x.id !== item.id))}>
                    ✕ Reject
                  </button>
                  <button type="button" className="btn" style={{ background: '#10b981', color: '#fff', fontSize: '0.85rem', padding: '0.35rem 1.1rem', fontWeight: 'bold' }} onClick={() => handleApproveItem(item.id)}>
                    ✓ Authorize & Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Drawer>

      {/* 3. CATEGORIZED NOTIFICATIONS MODAL */}
      <Drawer isOpen={globalDrawer === 'notifications'} onClose={() => setGlobalDrawer(null)} title="🔔 Categorized System Notifications" isModal={true} width="750px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.65rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['All', 'Urgent', 'Operations', 'Approvals'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNotifFilter(cat)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: notifFilter === cat ? '#4A8BCE' : 'hsla(var(--border), 0.3)',
                    color: notifFilter === cat ? '#fff' : 'inherit',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn" style={{ fontSize: '0.8rem', color: '#4A8BCE', background: 'transparent', fontWeight: 'bold' }} onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}>
                Mark All Read
              </button>
              <button type="button" className="btn" style={{ fontSize: '0.8rem', color: '#f43f5e', background: 'transparent', fontWeight: 'bold' }} onClick={() => setNotifications([])}>
                Clear All
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
                No notifications to display.
              </div>
            ) : notifications.filter(n => notifFilter === 'All' || n.cat === notifFilter).map((notif) => (
              <div key={notif.id} style={{ background: notif.unread ? 'hsla(var(--primary), 0.06)' : 'var(--bg-card)', border: '1px solid hsl(var(--border))', padding: '0.95rem', borderRadius: '8px', borderLeft: notif.cat === 'Urgent' ? '5px solid #f43f5e' : '5px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{notif.title}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>{notif.time}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', lineHeight: '1.5' }}>{notif.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </Drawer>

    </header>
  )
}

function CorporateDossierModal({ isOpen, onClose }) {
  const [dossierData, setDossierData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetch('http://localhost:5000/api/company/dossier')
        .then(r => r.json())
        .then(data => {
          setDossierData(data)
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch dossier:', err)
          setLoading(false)
        })
    }
  }, [isOpen])

  const handlePrint = () => {
    printElement('.dossier-container', 'DOSSIER')
  }

  const handleEmail = () => {
    const email = prompt('Enter recipient email address to send Corporate Dossier:', 'info@client.com')
    if (email) {
      alert(`✅ Official Corporate Qualification Dossier successfully dispatched to ${email}!`)
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="📋 AKPALI LTD - Complete Corporate Dossier" isModal={true} width="1050px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* DOSSIER TOOLBAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '0.85rem 1.25rem', borderRadius: '8px', border: '1px solid #334155', color: '#fff', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>Official Company Qualification Profile</strong>
            <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Ready for Instant Printing, PDF Export, or Dispatch</p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" className="btn" style={{ background: '#4A8BCE', color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', padding: '0.45rem 1rem' }} onClick={handlePrint}>
              🖨️ Print / Save PDF
            </button>
            <button type="button" className="btn" style={{ background: '#10b981', color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', padding: '0.45rem 1rem' }} onClick={handleEmail}>
              ✉️ Email Dossier
            </button>
          </div>
        </div>

        {/* DOSSIER BODY */}
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Compiling Complete Corporate Dossier...</div>
          ) : (
            <CompanyProfileDossier dossierData={dossierData} />
          )}
        </div>
      </div>
    </Drawer>
  )
}

function Sidebar({ onNavigate }) {
  const location = useLocation()
  const activePath = location.pathname

  return (
    <aside className="sidebar">
      <div className="brand" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
        <h2 style={{ margin: 0, color: '#4A8BCE', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '0.5px' }}>
          AKPALI <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-secondary))', fontWeight: '400', display: 'block' }}>Corporate ERP Platform</span>
        </h2>
      </div>

      <nav style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <Link to="/" onClick={onNavigate} className={`nav-item ${activePath === '/' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: '6px', color: activePath === '/' ? '#fff' : 'hsl(var(--text-secondary))', background: activePath === '/' ? '#4A8BCE' : 'transparent', fontWeight: activePath === '/' ? 'bold' : 'normal', textDecoration: 'none' }}>
          <LayoutDashboard size={18} /> Dashboard
        </Link>
        <Link to="/tenders" onClick={onNavigate} className={`nav-item ${activePath === '/tenders' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: '6px', color: activePath === '/tenders' ? '#fff' : 'hsl(var(--text-secondary))', background: activePath === '/tenders' ? '#4A8BCE' : 'transparent', fontWeight: activePath === '/tenders' ? 'bold' : 'normal', textDecoration: 'none' }}>
          <FileText size={18} /> Tenders & Projects
        </Link>
        <Link to="/procurement" onClick={onNavigate} className={`nav-item ${activePath === '/procurement' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: '6px', color: activePath === '/procurement' ? '#fff' : 'hsl(var(--text-secondary))', background: activePath === '/procurement' ? '#4A8BCE' : 'transparent', fontWeight: activePath === '/procurement' ? 'bold' : 'normal', textDecoration: 'none' }}>
          <ShoppingCart size={18} /> Procurement
        </Link>
        <Link to="/finances" onClick={onNavigate} className={`nav-item ${activePath === '/finances' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: '6px', color: activePath === '/finances' ? '#fff' : 'hsl(var(--text-secondary))', background: activePath === '/finances' ? '#4A8BCE' : 'transparent', fontWeight: activePath === '/finances' ? 'bold' : 'normal', textDecoration: 'none' }}>
          <Landmark size={18} /> Corporate Bookkeeping
        </Link>
        <Link to="/corporate" onClick={onNavigate} className={`nav-item ${activePath === '/corporate' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: '6px', color: activePath === '/corporate' ? '#fff' : 'hsl(var(--text-secondary))', background: activePath === '/corporate' ? '#4A8BCE' : 'transparent', fontWeight: activePath === '/corporate' ? 'bold' : 'normal', textDecoration: 'none' }}>
          <Building2 size={18} /> Corporate Governance Hub
        </Link>
      </nav>
    </aside>
  )
}

function App() {
  const [globalDrawer, setGlobalDrawer] = useState(null)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [userSession, setUserSession] = useState(() => {
    const saved = localStorage.getItem('akpali_user_session')
    return saved ? JSON.parse(saved) : { name: 'Eng. John Akpali', title: 'Executive Administrator' }
  })

  const handleLogout = () => {
    localStorage.removeItem('akpali_user_session')
    window.location.reload()
  }

  return (
    <CurrencyProvider>
      <RoleProvider>
        <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar onNavigate={() => setIsMobileNavOpen(false)} />
          
          <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Header 
              onOpenMobileNav={() => setIsMobileNavOpen(true)} 
              globalDrawer={globalDrawer} 
              setGlobalDrawer={setGlobalDrawer} 
              userSession={userSession}
              onLogout={handleLogout}
            />

            <main style={{ flex: 1, padding: '1.5rem' }}>
              <Routes>
                <Route path="/" element={<Dashboard setGlobalDrawer={setGlobalDrawer} />} />
                <Route path="/tenders" element={<Tenders />} />
                <Route path="/procurement" element={<Procurement setGlobalDrawer={setGlobalDrawer} />} />
                <Route path="/finances" element={<Finances setGlobalDrawer={setGlobalDrawer} />} />
                <Route path="/corporate" element={<CorporateHub setGlobalDrawer={setGlobalDrawer} />} />
              </Routes>
            </main>
          </div>

          {/* DRAWERS FOR GLOBAL FORMS */}
          <CorporateDossierModal isOpen={globalDrawer === 'dossier'} onClose={() => setGlobalDrawer(null)} />

          <Drawer isOpen={globalDrawer === 'invite_user'} onClose={() => setGlobalDrawer(null)} title="Invite User to System">
            <InviteUserForm onSuccess={() => setGlobalDrawer(null)} />
          </Drawer>

          <Drawer isOpen={globalDrawer === 'bank_account'} onClose={() => setGlobalDrawer(null)} title="Add Corporate Bank Account">
            <BankAccountForm onSuccess={() => setGlobalDrawer(null)} />
          </Drawer>

          <Drawer isOpen={globalDrawer === 'approval_workflow'} onClose={() => setGlobalDrawer(null)} title="Create Approval Rule">
            <ApprovalWorkflowForm onSuccess={() => setGlobalDrawer(null)} />
          </Drawer>

          <Drawer isOpen={globalDrawer === 'legal_contract'} onClose={() => setGlobalDrawer(null)} title="Log Legal Contract">
            <LegalContractForm onSuccess={() => setGlobalDrawer(null)} />
          </Drawer>

          <Drawer isOpen={globalDrawer === 'transaction'} onClose={() => setGlobalDrawer(null)} title="Record Transaction" width="800px">
            <RecordTransactionForm />
          </Drawer>

          <Drawer isOpen={globalDrawer === 'profile'} onClose={() => setGlobalDrawer(null)} title="User Profile Settings">
            <EditProfileForm onClose={() => setGlobalDrawer(null)} />
          </Drawer>

        </div>
      </RoleProvider>
    </CurrencyProvider>
  )
}

export default App
