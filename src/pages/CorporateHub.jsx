import React, { useState, useEffect } from 'react'
import { Building2, Shield, Settings, Users, Landmark, FileText, Briefcase, Download, Upload, GitMerge, HardDrive, Database, Scale, PlusCircle, Printer, Eye, Award, CheckSquare, UserCheck, Scroll, Compass, FileCheck, Mail, ShieldCheck, CheckCircle2, Trash2, Edit3 } from 'lucide-react'
import CompanyProfileDossier from '../components/CompanyProfileDossier'
import DirectorForm from '../components/DirectorForm'
import TenderRegistrationForm from '../components/TenderRegistrationForm'
import CompanyPolicyForm from '../components/CompanyPolicyForm'
import CompanyExperienceForm from '../components/CompanyExperienceForm'
import OperationalDocumentGeneratorModal from '../components/OperationalDocumentGeneratorModal'
import CreateRoleModal from '../components/CreateRoleModal'
import EditUserModal from '../components/EditUserModal'
import BankAccountForm from '../components/BankAccountForm'
import Drawer from '../components/Drawer'
import { printElement } from '../utils/printHelper'
import { useRole } from '../context/RoleContext'
import { useCurrency } from '../context/CurrencyContext'

export default function CorporateHub({ setGlobalDrawer }) {
  const { ROLES } = useRole()
  const { formatAmount } = useCurrency()
  const [activeTab, setActiveTab] = useState('profile')
  const [profileSubTab, setProfileSubTab] = useState('info')
  const [showDocGenModal, setShowDocGenModal] = useState(false)
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editingAccount, setEditingAccount] = useState(null)

  const [companyData, setCompanyData] = useState({
    legal_name: '', trading_name: '', registration_num: '', registration_date: '',
    business_type: 'Private Limited Company', tax_pin: '', vat_num: '', email: '',
    phone: '', address: '', postal_address: '', website: '', logo_url: '', seal_url: '',
    industry: '', nature_of_business: '', years_in_operation: 1, vision: '',
    mission: '', core_values: '', profile_doc_url: '', base_currency: 'USD'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [documents, setDocuments] = useState([])
  const [directors, setDirectors] = useState([])
  const [tenderRegistrations, setTenderRegistrations] = useState([])
  const [policies, setPolicies] = useState([])
  const [experience, setExperience] = useState([])
  const [accounts, setAccounts] = useState([])
  const [users, setUsers] = useState([])
  const [clients, setClients] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeModal, setActiveModal] = useState(null) // 'director', 'registration', 'policy', 'experience'

  const [systemSettings, setSystemSettings] = useState({
    smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '', wa_token: '', wa_phone_id: ''
  })
  const [documentTemplates, setDocumentTemplates] = useState({})
  const [selectedDocType, setSelectedDocType] = useState('SQ')
  const [approvalWorkflows, setApprovalWorkflows] = useState([])
  const [legalContracts, setLegalContracts] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [isRunningCron, setIsRunningCron] = useState(false)
  const [dossierData, setDossierData] = useState(null)
  const [dossierOptions, setDossierOptions] = useState({
    showFinancials: true,
    showBankAccounts: true,
    showPersonnel: true,
    showLegalContracts: true,
    showCapacityHighlights: true,
    showAppendix: true,
    showLPOs: true,
    showDirectors: true,
    showRegistrations: true,
    showPolicies: true,
    showExperience: true,
    watermark: 'NONE'
  })
  const [previewFile, setPreviewFile] = useState(null)

  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isSavingTemplates, setIsSavingTemplates] = useState(false)
  
  const fetchData = async () => {
    try {
      setLoading(true)
      const [compRes, docsRes, dirRes, regRes, polRes, expRes, accRes, usrRes, cliRes, supRes, setRes, tmplRes, wfRes, lcRes, dossierRes] = await Promise.all([
        fetch('http://localhost:5000/api/company'),
        fetch('http://localhost:5000/api/documents'),
        fetch('http://localhost:5000/api/directors'),
        fetch('http://localhost:5000/api/tender-registrations'),
        fetch('http://localhost:5000/api/policies'),
        fetch('http://localhost:5000/api/experience'),
        fetch('http://localhost:5000/api/accounts'),
        fetch('http://localhost:5000/api/users'),
        fetch('http://localhost:5000/api/clients'),
        fetch('http://localhost:5000/api/suppliers'),
        fetch('http://localhost:5000/api/settings'),
        fetch('http://localhost:5000/api/document-templates'),
        fetch('http://localhost:5000/api/approval-workflows'),
        fetch('http://localhost:5000/api/legal-contracts'),
        fetch('http://localhost:5000/api/company/dossier')
      ])

      if (compRes.ok) setCompanyData(await compRes.json())
      if (docsRes.ok) setDocuments(await docsRes.json())
      if (dirRes.ok) setDirectors(await dirRes.json())
      if (regRes.ok) setTenderRegistrations(await regRes.json())
      if (polRes.ok) setPolicies(await polRes.json())
      if (expRes.ok) setExperience(await expRes.json())
      if (accRes.ok) setAccounts(await accRes.json())
      if (usrRes.ok) setUsers(await usrRes.json())
      if (cliRes.ok) setClients(await cliRes.json())
      if (supRes.ok) setSuppliers(await supRes.json())
      if (setRes.ok) setSystemSettings(await setRes.json())
      if (tmplRes.ok) setDocumentTemplates(await tmplRes.json())
      if (wfRes.ok) setApprovalWorkflows(await wfRes.json())
      if (lcRes.ok) setLegalContracts(await lcRes.json())
      if (dossierRes.ok) setDossierData(await dossierRes.json())
      
      const auditRes = await fetch('http://localhost:5000/api/audit-logs')
      if (auditRes.ok) setAuditLogs(await auditRes.json())
    } catch (err) {
      console.error('Failed to fetch corporate data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerCron = async () => {
    try {
      setIsRunningCron(true)
      const res = await fetch('http://localhost:5000/api/reminders/trigger-now', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert('⏰ Daily Reminder Cron Job Executed Successfully!\n\nLogs:\n' + data.logs.join('\n'))
        fetchData()
      } else {
        alert('Cron job execution error: ' + data.error)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to trigger cron job.')
    } finally {
      setIsRunningCron(false)
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove user account '${userName}' (${userId})? This user will no longer be able to log into the system.`)) return
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        alert(`User account '${userName}' removed successfully.`)
        fetchData()
      } else {
        alert('Failed to remove user account.')
      }
    } catch (err) {
      console.error(err)
      alert('Error removing user account.')
    }
  }

  useEffect(() => {
    fetchData()
    const handleRefresh = () => fetchData()
    window.addEventListener('refreshCorporateHub', handleRefresh)
    return () => window.removeEventListener('refreshCorporateHub', handleRefresh)
  }, [])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch('http://localhost:5000/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      })
      if (res.ok) {
        alert('Company Profile saved successfully!')
        fetchData()
      } else {
        alert('Failed to update company profile')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Header */}
      <div className="card" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Building2 size={28} color="hsl(var(--primary))" /> Corporate Qualification Hub
            </h2>
            <div style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              9-Section Enterprise Governance, Directors, Regulatory Registrations, Policies & A4 Tender Dossier
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }} onClick={() => setShowDocGenModal(true)}>
              <FileText size={18} /> + Generate Operational Document
            </button>
            <button className="btn btn-primary" onClick={() => setActiveTab('dossier')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={18} /> View A4 Corporate Dossier
            </button>
            <a href="http://localhost:5000/api/company/dossier/zip" download className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#16a34a', color: '#fff' }}>
              <Download size={18} /> Package (.ZIP)
            </a>
          </div>
        </div>

        {/* Module Nav Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
          <button 
            className="btn" 
            onClick={() => setActiveTab('profile')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.85rem 0.25rem', gap: '0.4rem', background: activeTab === 'profile' ? 'hsla(var(--primary), 0.15)' : 'hsla(var(--primary), 0.05)', color: 'hsl(var(--primary))', border: activeTab === 'profile' ? '2px solid hsl(var(--primary))' : '1px solid hsla(var(--primary), 0.2)', borderRadius: 'var(--radius-md)' }}
          >
            <Building2 size={20} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem' }}>Company Profile</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('governance')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.85rem 0.25rem', gap: '0.4rem', background: activeTab === 'governance' ? 'hsla(var(--accent), 0.15)' : 'hsla(var(--accent), 0.05)', color: 'hsl(var(--accent))', border: activeTab === 'governance' ? '2px solid hsl(var(--accent))' : '1px solid hsla(var(--accent), 0.2)', borderRadius: 'var(--radius-md)' }}
          >
            <Shield size={20} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem' }}>Statutory Vault</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('banks')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.85rem 0.25rem', gap: '0.4rem', background: activeTab === 'banks' ? 'hsla(var(--success), 0.15)' : 'hsla(var(--success), 0.05)', color: 'hsl(var(--success))', border: activeTab === 'banks' ? '2px solid hsl(var(--success))' : '1px solid hsla(var(--success), 0.2)', borderRadius: 'var(--radius-md)' }}
          >
            <Landmark size={20} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem' }}>Bank Accounts</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('contracts')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.85rem 0.25rem', gap: '0.4rem', background: activeTab === 'contracts' ? 'hsla(var(--info), 0.15)' : 'hsla(var(--info), 0.05)', color: 'hsl(var(--info))', border: activeTab === 'contracts' ? '2px solid hsl(var(--info))' : '1px solid hsla(var(--info), 0.2)', borderRadius: 'var(--radius-md)' }}
          >
            <FileCheck size={20} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem' }}>Legal Contracts</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('dossier')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.85rem 0.25rem', gap: '0.4rem', background: activeTab === 'dossier' ? 'hsla(var(--warning), 0.15)' : 'hsla(var(--warning), 0.05)', color: 'hsl(var(--warning))', border: activeTab === 'dossier' ? '2px solid hsl(var(--warning))' : '1px solid hsla(var(--warning), 0.2)', borderRadius: 'var(--radius-md)' }}
          >
            <Award size={20} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem' }}>Corporate Dossier</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('settings')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.85rem 0.25rem', gap: '0.4rem', background: activeTab === 'settings' ? 'hsla(var(--secondary), 0.15)' : 'hsla(var(--secondary), 0.05)', color: '#475569', border: activeTab === 'settings' ? '2px solid #475569' : '1px solid #cbd5e1', borderRadius: 'var(--radius-md)' }}
          >
            <Settings size={20} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem' }}>System Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Area - SINGLE UNIFIED CARD */}
      <div className="card" style={{ padding: '1.75rem' }}>
        {loading && <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-secondary))' }}>Loading Corporate Data...</div>}

        {!loading && activeTab === 'profile' && (
          <div>
            
            {/* INTEGRATED SUB-TAB HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'hsl(var(--primary))', fontSize: '1.1rem', fontWeight: '700' }}>Company Profile & 9 Qualification Sections</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>Manage organizational details, directors, regulatory certificates, policies, and past projects.</div>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', background: 'hsla(var(--primary), 0.06)', padding: '0.25rem', borderRadius: '8px', border: '1px solid hsla(var(--primary), 0.12)' }}>
                <button type="button" className={`btn ${profileSubTab === 'info' ? 'btn-primary' : ''}`} style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', border: 'none', background: profileSubTab === 'info' ? 'hsl(var(--primary))' : 'transparent', color: profileSubTab === 'info' ? '#ffffff' : '#475569', fontWeight: profileSubTab === 'info' ? '700' : '600' }} onClick={() => setProfileSubTab('info')}>Company Info</button>
                <button type="button" className={`btn ${profileSubTab === 'letter' ? 'btn-primary' : ''}`} style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', border: 'none', background: profileSubTab === 'letter' ? 'hsl(var(--primary))' : 'transparent', color: profileSubTab === 'letter' ? '#ffffff' : '#475569', fontWeight: profileSubTab === 'letter' ? '700' : '600' }} onClick={() => setProfileSubTab('letter')}>Intro Letter</button>
                <button type="button" className={`btn ${profileSubTab === 'directors' ? 'btn-primary' : ''}`} style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', border: 'none', background: profileSubTab === 'directors' ? 'hsl(var(--primary))' : 'transparent', color: profileSubTab === 'directors' ? '#ffffff' : '#475569', fontWeight: profileSubTab === 'directors' ? '700' : '600' }} onClick={() => setProfileSubTab('directors')}>Directors ({directors.length})</button>
                <button type="button" className={`btn ${profileSubTab === 'registrations' ? 'btn-primary' : ''}`} style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', border: 'none', background: profileSubTab === 'registrations' ? 'hsl(var(--primary))' : 'transparent', color: profileSubTab === 'registrations' ? '#ffffff' : '#475569', fontWeight: profileSubTab === 'registrations' ? '700' : '600' }} onClick={() => setProfileSubTab('registrations')}>Tender Regs ({tenderRegistrations.length})</button>
                <button type="button" className={`btn ${profileSubTab === 'policies' ? 'btn-primary' : ''}`} style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', border: 'none', background: profileSubTab === 'policies' ? 'hsl(var(--primary))' : 'transparent', color: profileSubTab === 'policies' ? '#ffffff' : '#475569', fontWeight: profileSubTab === 'policies' ? '700' : '600' }} onClick={() => setProfileSubTab('policies')}>Policies ({policies.length})</button>
                <button type="button" className={`btn ${profileSubTab === 'experience' ? 'btn-primary' : ''}`} style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', border: 'none', background: profileSubTab === 'experience' ? 'hsl(var(--primary))' : 'transparent', color: profileSubTab === 'experience' ? '#ffffff' : '#475569', fontWeight: profileSubTab === 'experience' ? '700' : '600' }} onClick={() => setProfileSubTab('experience')}>Experience ({experience.length})</button>
              </div>
            </div>
              
              {/* SUB-TAB 1: COMPANY INFORMATION FORM */}
              {profileSubTab === 'info' && (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Company Legal Name *</label>
                      <input type="text" className="form-control" required value={companyData.legal_name} onChange={e => setCompanyData({...companyData, legal_name: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Trading Name (e.g. Akpali Tech)</label>
                      <input type="text" className="form-control" value={companyData.trading_name} onChange={e => setCompanyData({...companyData, trading_name: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Business Type</label>
                      <select className="form-control" value={companyData.business_type} onChange={e => setCompanyData({...companyData, business_type: e.target.value})}>
                        <option value="Private Limited Company">Private Limited Company (Ltd)</option>
                        <option value="Public Limited Company">Public Limited Company (PLC)</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Joint Venture">Joint Venture (JV)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.25rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Certificate of Incorporation #</label>
                      <input type="text" className="form-control" value={companyData.registration_num} onChange={e => setCompanyData({...companyData, registration_num: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Registration Date</label>
                      <input type="date" className="form-control" value={companyData.registration_date} onChange={e => setCompanyData({...companyData, registration_date: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>KRA PIN Number *</label>
                      <input type="text" className="form-control" required value={companyData.tax_pin} onChange={e => setCompanyData({...companyData, tax_pin: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>VAT Registration #</label>
                      <input type="text" className="form-control" value={companyData.vat_num} onChange={e => setCompanyData({...companyData, vat_num: e.target.value})} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Official Email Address</label>
                      <input type="email" className="form-control" value={companyData.email} onChange={e => setCompanyData({...companyData, email: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Telephone Numbers</label>
                      <input type="text" className="form-control" value={companyData.phone} onChange={e => setCompanyData({...companyData, phone: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Company Website</label>
                      <input type="text" className="form-control" value={companyData.website} onChange={e => setCompanyData({...companyData, website: e.target.value})} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Physical Building Address</label>
                      <input type="text" className="form-control" value={companyData.address} onChange={e => setCompanyData({...companyData, address: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Postal Address</label>
                      <input type="text" className="form-control" value={companyData.postal_address} onChange={e => setCompanyData({...companyData, postal_address: e.target.value})} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Industry / Sector</label>
                      <input type="text" className="form-control" value={companyData.industry} onChange={e => setCompanyData({...companyData, industry: e.target.value})} placeholder="e.g. Construction & ICT" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Nature of Main Business</label>
                      <input type="text" className="form-control" value={companyData.nature_of_business} onChange={e => setCompanyData({...companyData, nature_of_business: e.target.value})} placeholder="e.g. General Supplies & Civil Works" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Years in Operation</label>
                      <input type="number" className="form-control" value={companyData.years_in_operation} onChange={e => setCompanyData({...companyData, years_in_operation: e.target.value})} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Company Logo URL</label>
                      <input type="text" className="form-control" value={companyData.logo_url} onChange={e => setCompanyData({...companyData, logo_url: e.target.value})} placeholder="https://..." />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Company Seal / Stamp Image URL</label>
                      <input type="text" className="form-control" value={companyData.seal_url} onChange={e => setCompanyData({...companyData, seal_url: e.target.value})} placeholder="https://..." />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Company Vision Statement</label>
                    <textarea className="form-control" rows={2} value={companyData.vision} onChange={e => setCompanyData({...companyData, vision: e.target.value})} />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Company Mission Statement</label>
                    <textarea className="form-control" rows={2} value={companyData.mission} onChange={e => setCompanyData({...companyData, mission: e.target.value})} />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Core Values (Comma Separated)</label>
                    <input type="text" className="form-control" value={companyData.core_values} onChange={e => setCompanyData({...companyData, core_values: e.target.value})} placeholder="Integrity, Quality, Efficiency" />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? 'Saving Profile...' : 'Save All Company Profile Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* SUB-TAB: EXECUTIVE INTRODUCTORY LETTER */}
              {profileSubTab === 'letter' && (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>Executive Introductory Cover Letter</h4>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Appears on Page 1/2 of your Corporate Dossier as an official cover letter to clients and tender boards.</div>
                    </div>
                    <button 
                      type="button" 
                      className="btn" 
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}
                      onClick={() => {
                        setCompanyData({
                          ...companyData,
                          introductory_letter: `RE: OFFICIAL CORPORATE PREQUALIFICATION & TENDER SUBMISSION

To: The Tender Evaluation Committee & Selection Board,

We are pleased to formally submit our Official Corporate Profile and Qualification Dossier for your evaluation. ${companyData.legal_name || 'AKPALI & CO.'} is a fully registered, compliant enterprise with demonstrated capacity in supply of goods, provision of technical services, and complex project execution.

Inside this dossier, you will find our verified statutory licenses, directors credentials, regulatory registration certificates, past project track records, and financial capacity credentials.

We confirm our readiness to execute all scope requirements in full compliance with your standards.

Sincerely,
Managing Director / Authorized Corporate Signatory`
                        })
                      }}
                    >
                      + Insert Standard Cover Letter Template
                    </button>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <textarea 
                      className="form-control" 
                      rows={12} 
                      value={companyData.introductory_letter || ''} 
                      onChange={e => setCompanyData({...companyData, introductory_letter: e.target.value})}
                      placeholder="Enter official cover letter text..."
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? 'Saving Letter...' : 'Save Introductory Letter'}
                    </button>
                  </div>
                </form>
              )}

              {/* SUB-TAB 2: DIRECTORS & SHAREHOLDERS */}
              {profileSubTab === 'directors' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'hsl(var(--primary))' }}>Directors & Key Shareholders Structure</h4>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Record legal directors, identity credentials, shareholding %, and CV attachments.</div>
                    </div>
                    <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => setActiveModal('director')}>+ Add Director / Shareholder</button>
                  </div>

                  <div style={{ border: '1px solid hsla(var(--primary), 0.18)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'hsla(var(--primary), 0.08)', color: 'hsl(var(--primary))', borderBottom: '2px solid hsla(var(--primary), 0.2)', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Name</th>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Position / Role</th>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>ID / Passport</th>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>KRA PIN</th>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700', textAlign: 'right' }}>Shareholding %</th>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {directors.length === 0 ? (
                          <tr><td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>No directors recorded. Click "+ Add Director / Shareholder" to add.</td></tr>
                        ) : directors.map(dir => (
                          <tr key={dir.id} style={{ borderBottom: '1px solid hsla(var(--border), 0.5)' }}>
                            <td style={{ padding: '0.75rem 0.85rem', fontWeight: '700', color: '#ffffff' }}>{dir.name}</td>
                            <td style={{ padding: '0.75rem 0.85rem', color: '#f8fafc', fontWeight: '500' }}>{dir.position}</td>
                            <td style={{ padding: '0.75rem 0.85rem', color: '#cbd5e1' }}>{dir.id_passport || 'N/A'}</td>
                            <td style={{ padding: '0.75rem 0.85rem', color: '#cbd5e1' }}>{dir.kra_pin || 'N/A'}</td>
                            <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: '700', color: '#38bdf8' }}>{dir.shareholding_pct || 0}%</td>
                            <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                              <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#fee2e2', color: '#dc2626' }} onClick={async () => {
                                if(window.confirm(`Delete director ${dir.name}?`)) {
                                  await fetch(`http://localhost:5000/api/directors/${dir.id}`, { method: 'DELETE' })
                                  fetchData()
                                }
                              }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: TENDER REGISTRATION CERTIFICATES */}
              {profileSubTab === 'registrations' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'hsl(var(--primary))' }}>Tender Registration & Regulatory Certificates</h4>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Log registrations with NCA, EBK, Treasury AGPO, UNGM, World Bank, etc.</div>
                    </div>
                    <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => setActiveModal('registration')}>+ Add Registration Certificate</button>
                  </div>

                  <div style={{ border: '1px solid hsla(var(--primary), 0.18)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'hsla(var(--primary), 0.08)', color: 'hsl(var(--primary))', borderBottom: '2px solid hsla(var(--primary), 0.2)', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Registering Authority</th>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Registration Number</th>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Category / Grade</th>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Expiry Date</th>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenderRegistrations.length === 0 ? (
                          <tr><td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>No registration certificates recorded. Click "+ Add Registration Certificate".</td></tr>
                        ) : tenderRegistrations.map(reg => (
                          <tr key={reg.id} style={{ borderBottom: '1px solid hsla(var(--border), 0.5)' }}>
                            <td style={{ padding: '0.75rem 0.85rem', fontWeight: '700', color: '#ffffff' }}>{reg.authority_name}</td>
                            <td style={{ padding: '0.75rem 0.85rem', color: '#38bdf8', fontWeight: '600' }}>{reg.registration_number}</td>
                            <td style={{ padding: '0.75rem 0.85rem', color: '#f8fafc' }}>{reg.category_grade || 'Standard'}</td>
                            <td style={{ padding: '0.75rem 0.85rem', color: '#cbd5e1' }}>{reg.expiry_date || 'Active'}</td>
                            <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                              <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#fee2e2', color: '#dc2626' }} onClick={async () => {
                                if(window.confirm('Delete registration certificate?')) {
                                  await fetch(`http://localhost:5000/api/tender-registrations/${reg.id}`, { method: 'DELETE' })
                                  fetchData()
                                }
                              }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: COMPANY POLICIES */}
              {profileSubTab === 'policies' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'hsl(var(--primary))' }}>Company Policies & Compliance Governance</h4>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Store signed corporate policies for tender compliance and bid management.</div>
                    </div>
                    <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => setActiveModal('policy')}>+ Add Corporate Policy</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                    {policies.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', border: '1px solid hsla(var(--primary), 0.18)', borderRadius: '8px', color: '#94a3b8' }}>No policies added yet. Click "+ Add Corporate Policy".</div>
                    ) : policies.map(pol => (
                      <div key={pol.id} style={{ border: '1px solid hsla(var(--primary), 0.18)', padding: '1rem', borderRadius: '8px', background: 'hsla(var(--primary), 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h5 style={{ margin: '0 0 0.4rem 0', color: '#38bdf8', fontSize: '0.95rem' }}>{pol.title}</h5>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#f8fafc', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{pol.content_text}</p>
                        </div>
                        <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#fee2e2', color: '#dc2626' }} onClick={async () => {
                          if(window.confirm(`Delete policy ${pol.title}?`)) {
                            await fetch(`http://localhost:5000/api/policies/${pol.id}`, { method: 'DELETE' })
                            fetchData()
                          }
                        }}>Delete</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: PAST EXPERIENCE */}
              {profileSubTab === 'experience' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'hsl(var(--primary))' }}>Past Project Experience & Reference Letters</h4>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Log executed projects, contract values, reference letters, and completion certificates.</div>
                    </div>
                    <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => setActiveModal('experience')}>+ Add Past Project</button>
                  </div>

                  <div style={{ border: '1px solid hsla(var(--primary), 0.18)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'hsla(var(--primary), 0.08)', color: 'hsl(var(--primary))', borderBottom: '2px solid hsla(var(--primary), 0.2)', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Project Title</th>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Client</th>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Completion Date</th>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700', textAlign: 'right' }}>Contract Value</th>
                          <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {experience.length === 0 ? (
                          <tr><td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>No past projects recorded. Click "+ Add Past Project".</td></tr>
                        ) : experience.map(exp => (
                          <tr key={exp.id} style={{ borderBottom: '1px solid hsla(var(--border), 0.5)' }}>
                            <td style={{ padding: '0.75rem 0.85rem', fontWeight: '700', color: '#ffffff' }}>{exp.project_name}</td>
                            <td style={{ padding: '0.75rem 0.85rem', color: '#f8fafc', fontWeight: '500' }}>{exp.client_name}</td>
                            <td style={{ padding: '0.75rem 0.85rem', color: '#cbd5e1' }}>{exp.completion_date || 'Completed'}</td>
                            <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: '700', color: '#4ade80' }}>${Number(exp.contract_value || 0).toLocaleString()}</td>
                            <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                              <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#fee2e2', color: '#dc2626' }} onClick={async () => {
                                if(window.confirm(`Delete project ${exp.project_name}?`)) {
                                  await fetch(`http://localhost:5000/api/experience/${exp.id}`, { method: 'DELETE' })
                                  fetchData()
                                }
                              }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

          </div>
        )}

        {/* MODAL DRAWERS FOR SUB-ENTITIES */}
        {activeModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1.5rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem', background: '#fff', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'hsl(var(--primary))' }}>
                  {activeModal === 'director' && 'Add Director / Shareholder Credentials'}
                  {activeModal === 'registration' && 'Add Tender Registration Certificate'}
                  {activeModal === 'policy' && 'Add Corporate Policy Statement'}
                  {activeModal === 'experience' && 'Add Past Project Experience'}
                </h3>
                <button className="btn" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setActiveModal(null)}>✕</button>
              </div>

              {activeModal === 'director' && <DirectorForm onSuccess={() => { setActiveModal(null); fetchData(); }} />}
              {activeModal === 'registration' && <TenderRegistrationForm onSuccess={() => { setActiveModal(null); fetchData(); }} />}
              {activeModal === 'policy' && <CompanyPolicyForm onSuccess={() => { setActiveModal(null); fetchData(); }} />}
              {activeModal === 'experience' && <CompanyExperienceForm onSuccess={() => { setActiveModal(null); fetchData(); }} />}
            </div>
          </div>
        )}

        {/* OTHER TABS */}
        {!loading && activeTab === 'governance' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Statutory & Governance Document Vault</h3>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => setGlobalDrawer('upload_document')}>+ Upload Statutory Document</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Document Title</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Expiry Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No statutory documents uploaded.</td></tr>
                ) : documents.map(doc => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{doc.title}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'hsl(var(--text-secondary))' }}>{doc.document_type}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{doc.expiry_date || 'Permanent Certificate'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span className="badge badge-success">{doc.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === 'banks' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Official Corporate Bank & Treasury Accounts</h3>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', background: '#4A8BCE', border: 'none', fontWeight: 'bold' }} onClick={() => setEditingAccount({ isNew: true, id: `ACC-${Math.floor(Math.random() * 10000)}`, name: '', type: 'Bank', current_balance: 0 })}>+ Add Account</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Account ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Account Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Account Type</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Current Balance</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No bank accounts registered yet. Click "+ Add Account" to create one.</td></tr>
                ) : accounts.map(acc => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#4A8BCE' }}>{acc.id}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{acc.name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span className="badge badge-info">{acc.type}</span></td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>{formatAmount(acc.current_balance || 0)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          className="btn" 
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: '#0284c7', color: '#fff' }}
                          onClick={() => setEditingAccount(acc)}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          type="button" 
                          className="btn" 
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: '#f43f5e', color: '#fff' }}
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to remove bank account '${acc.name}' (${acc.id})?`)) {
                              try {
                                const res = await fetch(`http://localhost:5000/api/accounts/${acc.id}`, { method: 'DELETE' });
                                if (res.ok) {
                                  alert(`Bank account '${acc.name}' removed!`);
                                  fetchData();
                                }
                              } catch(err) { alert('Failed to delete bank account'); }
                            }
                          }}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === 'contracts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Legal Contracts & MSAs Vault</h3>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => setGlobalDrawer('legal_contract')}>+ Upload Legal Contract</button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Contract Title</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Party Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {legalContracts.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No legal contracts uploaded.</td></tr>
                ) : legalContracts.map(contract => (
                  <tr key={contract.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{contract.title}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{contract.party_name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span className="badge badge-info">{contract.contract_type}</span></td>
                    <td style={{ padding: '0.75rem 1rem' }}><span className="badge badge-success">{contract.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === 'dossier' && (
          <div>
            {/* DOSSIER CONTROLS */}
            <div style={{ background: 'hsla(var(--primary), 0.04)', border: '1px solid hsla(var(--primary), 0.18)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid hsla(var(--primary), 0.15)', paddingBottom: '0.5rem' }}>
                <div style={{ fontWeight: '700', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                  <Award size={18} /> Dossier Customization & Watermark Controls:
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button className="btn btn-primary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => printElement('.dossier-container', 'DOSSIER')}>
                    <Printer size={15} /> Print / Export A4 PDF
                  </button>
                  <a href="http://localhost:5000/api/company/dossier/zip" download className="btn" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#16a34a', color: '#fff' }}>
                    <Download size={15} /> Package (.ZIP)
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.825rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#ffffff', fontWeight: '600' }}>
                  <input type="checkbox" checked={dossierOptions.showIntroLetter !== false} onChange={e => setDossierOptions({...dossierOptions, showIntroLetter: e.target.checked})} />
                  <span>Include Cover Letter</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#ffffff', fontWeight: '600' }}>
                  <input type="checkbox" checked={dossierOptions.showStatutoryTable !== false} onChange={e => setDossierOptions({...dossierOptions, showStatutoryTable: e.target.checked})} />
                  <span>Show Statutory Records Table</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#ffffff', fontWeight: '600' }}>
                  <input type="checkbox" checked={dossierOptions.showFinancials} onChange={e => setDossierOptions({...dossierOptions, showFinancials: e.target.checked})} />
                  <span>Show Contract Values</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#ffffff', fontWeight: '600' }}>
                  <input type="checkbox" checked={dossierOptions.showLPOs} onChange={e => setDossierOptions({...dossierOptions, showLPOs: e.target.checked})} />
                  <span>Show LPOs Under Tenders</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#ffffff', fontWeight: '600' }}>
                  <input type="checkbox" checked={dossierOptions.showDirectors} onChange={e => setDossierOptions({...dossierOptions, showDirectors: e.target.checked})} />
                  <span>Include Directors Section</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#ffffff', fontWeight: '600' }}>
                  <input type="checkbox" checked={dossierOptions.showRegistrations} onChange={e => setDossierOptions({...dossierOptions, showRegistrations: e.target.checked})} />
                  <span>Include Regulatory Regs</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#ffffff', fontWeight: '600' }}>
                  <input type="checkbox" checked={dossierOptions.showExperience} onChange={e => setDossierOptions({...dossierOptions, showExperience: e.target.checked})} />
                  <span>Include Past Experience</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#ffffff', fontWeight: '600' }}>
                  <input type="checkbox" checked={dossierOptions.showBankAccounts} onChange={e => setDossierOptions({...dossierOptions, showBankAccounts: e.target.checked})} />
                  <span>Show Bank Settlement Details</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#ffffff', fontWeight: '600' }}>
                  <input type="checkbox" checked={dossierOptions.showAppendix} onChange={e => setDossierOptions({...dossierOptions, showAppendix: e.target.checked})} />
                  <span>Include Visual Softcopy Appendix</span>
                </label>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div style={{ background: '#f8fafc', padding: '2rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid hsl(var(--border))' }}>
              <CompanyProfileDossier 
                dossierData={dossierData} 
                options={dossierOptions} 
                onPreviewFile={(url, title) => setPreviewFile({ url, title })}
              />
            </div>
          </div>
        )}

        {/* SYSTEM SETTINGS TAB */}
        {!loading && activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* CREATE CUSTOM ROLE DRAWER */}
            <Drawer isOpen={isCreateRoleOpen} onClose={() => setIsCreateRoleOpen(false)} title="Create New Custom Role & Assign Tasks">
              <CreateRoleModal onClose={() => setIsCreateRoleOpen(false)} />
            </Drawer>

            {/* SYSTEM ROLES & USER ACCESS CONTROL PANEL */}
            <div style={{ background: 'hsla(var(--primary), 0.04)', border: '1px solid hsla(var(--primary), 0.18)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid hsla(var(--primary), 0.15)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck color="hsl(var(--primary))" size={22} />
                    <h4 style={{ margin: 0, color: 'hsl(var(--primary))', fontSize: '1.1rem', fontWeight: 'bold' }}>System Roles & Authorized Task Allocations</h4>
                  </div>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                    Invite users, assign specialized roles, and allocate task permissions. Users only access what they are granted.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'bold' }} onClick={() => setGlobalDrawer('invite_user')}>
                    <PlusCircle size={16} /> + Invite / Add User
                  </button>
                  <button className="btn" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#334155', color: '#fff', border: '1px solid #475569' }} onClick={() => setIsCreateRoleOpen(true)}>
                    + Create Custom Role
                  </button>
                </div>
              </div>

              {/* EDIT USER DRAWER */}
              {editingUser && (
                <Drawer isOpen={!!editingUser} onClose={() => setEditingUser(null)} title={`Edit User Account: ${editingUser.name}`}>
                  <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSuccess={() => fetchData()} />
                </Drawer>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', textAlign: 'left', borderBottom: '2px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '0.6rem 0.8rem' }}>User ID</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Full Name</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Email Address</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Assigned System Role</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Account Status</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? users.map((u, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '0.6rem 0.8rem', fontWeight: '700', color: '#38bdf8' }}>{u.id}</td>
                        <td style={{ padding: '0.6rem 0.8rem', fontWeight: '700', color: '#f8fafc' }}>{u.name}</td>
                        <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1' }}>{u.email}</td>
                        <td style={{ padding: '0.6rem 0.8rem' }}>
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: u.role === 'Admin' ? '#0284c7' : u.role === 'Operations' ? '#16a34a' : '#d97706', color: '#fff', fontWeight: '700' }}>
                            {u.role === 'Admin' ? '👑 Administrator' : u.role === 'Operations' ? '🏗️ Operations Manager' : u.role === 'Procurement_Finance' ? '💳 Procurement & Finance' : u.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: '#dcfce7', color: '#15803d', fontWeight: '700' }}>
                            ✓ Active User
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                            <button 
                              className="btn btn-sm" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              onClick={() => setEditingUser(u)}
                              title="Edit User Role & Details"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button 
                              className="btn btn-sm" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              title="Delete / Remove User Account"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '0.6rem 0.8rem', fontWeight: '700', color: '#38bdf8' }}>USR-ADMIN</td>
                        <td style={{ padding: '0.6rem 0.8rem', fontWeight: '700', color: '#f8fafc' }}>Eng. John Akpali</td>
                        <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1' }}>admin@akpali.com</td>
                        <td style={{ padding: '0.6rem 0.8rem' }}>
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#0284c7', color: '#fff', fontWeight: '700' }}>
                            👑 Executive Administrator
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: '#dcfce7', color: '#15803d', fontWeight: '700' }}>
                            ✓ Active System Admin
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                          <button 
                            className="btn btn-sm" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#3b82f6', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={() => setEditingUser({ id: 'USR-ADMIN', name: 'Eng. John Akpali', email: 'admin@akpali.com', role: 'Admin' })}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 1. SMTP EMAIL CONFIGURATION */}
            <div style={{ background: 'hsla(var(--primary), 0.04)', border: '1px solid hsla(var(--primary), 0.18)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid hsla(var(--primary), 0.15)', paddingBottom: '0.5rem' }}>
                <Mail color="hsl(var(--primary))" size={20} />
                <h4 style={{ margin: 0, color: 'hsl(var(--primary))' }}>SMTP Email Server Configuration (Overdue Reminders & Notifications)</h4>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSavingSettings(true);
                try {
                  const res = await fetch('http://localhost:5000/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(systemSettings)
                  });
                  if (res.ok) alert('SMTP & WhatsApp settings updated!');
                } catch(err) { alert('Failed to save settings'); }
                finally { setIsSavingSettings(false); }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>SMTP Host</label>
                    <input type="text" className="form-control" placeholder="smtp.gmail.com" value={systemSettings.smtp_host || ''} onChange={e => setSystemSettings({...systemSettings, smtp_host: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>SMTP Port</label>
                    <input type="text" className="form-control" placeholder="587" value={systemSettings.smtp_port || ''} onChange={e => setSystemSettings({...systemSettings, smtp_port: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>SMTP Username / Email</label>
                    <input type="text" className="form-control" placeholder="notifications@akpali.com" value={systemSettings.smtp_user || ''} onChange={e => setSystemSettings({...systemSettings, smtp_user: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>SMTP Password / App Token</label>
                    <input type="password" className="form-control" placeholder="••••••••••••" value={systemSettings.smtp_pass || ''} onChange={e => setSystemSettings({...systemSettings, smtp_pass: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>WhatsApp Cloud Access Token</label>
                    <input type="text" className="form-control" placeholder="EAABw..." value={systemSettings.wa_token || ''} onChange={e => setSystemSettings({...systemSettings, wa_token: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>WhatsApp Phone Number ID</label>
                    <input type="text" className="form-control" placeholder="105928194..." value={systemSettings.wa_phone_id || ''} onChange={e => setSystemSettings({...systemSettings, wa_phone_id: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn" style={{ background: '#0284c7', color: '#fff', fontWeight: '700' }} onClick={async () => {
                    try {
                      const res = await fetch('http://localhost:5000/api/settings/test-smtp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(systemSettings)
                      });
                      const data = await res.json();
                      if (res.ok && data.success) {
                        alert('✅ SMTP Server Connection Verified Successfully!');
                      } else {
                        alert(`❌ SMTP Test Failed:\n\n${data.error}`);
                      }
                    } catch(err) {
                      alert('Could not connect to server for SMTP test.');
                    }
                  }}>
                    ⚡ Test SMTP Connection
                  </button>
                  <button type="button" className="btn" style={{ background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', fontWeight: '700' }} onClick={handleTriggerCron} disabled={isRunningCron}>
                    {isRunningCron ? 'Running Cron...' : '⏰ Test Daily Reminder Cron Job Now'}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSavingSettings}>
                    {isSavingSettings ? 'Saving Settings...' : 'Save Communication Credentials'}
                  </button>
                </div>
              </form>
            </div>

            {/* 2. DOCUMENT BRANDING & TEMPLATES */}
            <div style={{ background: 'hsla(var(--primary), 0.04)', border: '1px solid hsla(var(--primary), 0.18)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid hsla(var(--primary), 0.15)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText color="hsl(var(--primary))" size={20} />
                  <h4 style={{ margin: 0, color: 'hsl(var(--primary))' }}>Master Document Templates & Module Branding</h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(var(--primary))' }}>Select Module Template:</label>
                  <select className="form-control" style={{ width: 'auto', fontSize: '0.8rem', padding: '0.3rem 0.75rem', fontWeight: 'bold' }} value={selectedDocType} onChange={e => setSelectedDocType(e.target.value)}>
                    <option value="GLOBAL">Global Master Template</option>
                    <option value="SQ">Sales Quotation (SQ)</option>
                    <option value="LPO">Client LPO</option>
                    <option value="RFQ">Supplier RFQ</option>
                    <option value="PO">Purchase Order (PO)</option>
                    <option value="INVOICE">Client Invoice</option>
                    <option value="DELIVERY">Delivery Note</option>
                    <option value="CONTRACT">Contract Agreement Template</option>
                    <option value="INSPECTION">Inspection Form (QA/QC)</option>
                    <option value="SITE_VISIT">Site Visit Report</option>
                    <option value="MATERIAL_REQ">Material Request Form</option>
                    <option value="HANDOVER_CERT">Handover & Completion Certificate</option>
                    <option value="SITE_LOG">Daily Site Work Log & Diary</option>
                    <option value="VAR_ORDER">Variation Order & Scope Change</option>
                    <option value="SAFETY_INCIDENT">EHS Incident & Hazard Report</option>
                    <option value="PAYMENT_CERT">Interim Payment Certificate (IPC)</option>
                    <option value="SUBCONTRACTOR_EVAL">Subcontractor Performance Appraisal</option>
                  </select>
                </div>
              </div>

              {/* UNIFORM BRANDING NOTICE BADGE */}
              <div style={{ background: '#0f172a', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>
                  🎨 System Primary Theme Color: <strong style={{ color: '#4A8BCE' }}>#4A8BCE</strong> (Uniform System-Wide)
                </span>
                <span style={{ color: '#94a3b8' }}>
                  👣 Fixed Footer Notice: <strong style={{ color: '#4A8BCE' }}>"AKPALI LTD thanks you for your business."</strong>
                </span>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSavingTemplates(true);
                const currentTpl = documentTemplates[selectedDocType] || {};
                try {
                  const res = await fetch('http://localhost:5000/api/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: selectedDocType,
                      header_text: currentTpl.header_text || '',
                      terms_conditions_text: currentTpl.terms_conditions_text || '',
                      primary_color: '#4A8BCE',
                      footer_text: 'AKPALI LTD thanks you for your business.'
                    })
                  });
                  if (res.ok) {
                    alert(`✅ Template '${selectedDocType}' updated successfully!`);
                    fetchData();
                  }
                } catch(err) { alert('Failed to save template'); }
                finally { setIsSavingTemplates(false); }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 'bold' }}>Header Banner Title</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. OFFICIAL SALES QUOTATION or CLIENT LOCAL PURCHASE ORDER" 
                    value={documentTemplates[selectedDocType]?.header_text || ''} 
                    onChange={e => setDocumentTemplates({
                      ...documentTemplates,
                      [selectedDocType]: { ...documentTemplates[selectedDocType], header_text: e.target.value }
                    })} 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 'bold' }}>Default Terms & Conditions</label>
                  <textarea 
                    className="form-control" 
                    rows={4} 
                    placeholder="e.g., 1. Payment due within 30 days of invoice date. 2. Goods delivered remain property of Akpali Ltd until paid in full." 
                    value={documentTemplates[selectedDocType]?.terms_conditions_text || ''} 
                    onChange={e => setDocumentTemplates({
                      ...documentTemplates,
                      [selectedDocType]: { ...documentTemplates[selectedDocType], terms_conditions_text: e.target.value }
                    })} 
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={isSavingTemplates} style={{ background: '#4A8BCE', border: 'none', padding: '0.6rem 1.5rem', fontWeight: 'bold' }}>
                    {isSavingTemplates ? 'Saving Template...' : `Save '${selectedDocType}' Template Settings`}
                  </button>
                </div>
              </form>
            </div>

            {/* 3. SYSTEM AUDIT TRAIL & GOVERNANCE LOGS */}
            <div style={{ background: 'hsla(var(--primary), 0.04)', border: '1px solid hsla(var(--primary), 0.18)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid hsla(var(--primary), 0.15)', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield color="hsl(var(--primary))" size={20} />
                  <h4 style={{ margin: 0, color: 'hsl(var(--primary))' }}>System Audit Trail & Governance Logs</h4>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '10px', background: '#38bdf822', color: '#38bdf8', fontWeight: '700' }}>
                  {auditLogs.length} Audit Records
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', textAlign: 'left', borderBottom: '2px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '0.6rem' }}>Timestamp</th>
                      <th style={{ padding: '0.6rem' }}>Role</th>
                      <th style={{ padding: '0.6rem' }}>Action</th>
                      <th style={{ padding: '0.6rem' }}>Entity Type</th>
                      <th style={{ padding: '0.6rem' }}>Event Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No audit records logged yet.</td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '0.6rem', color: '#94a3b8' }}>{new Date(log.created_at).toLocaleString()}</td>
                          <td style={{ padding: '0.6rem', fontWeight: '700', color: '#38bdf8' }}>{log.user_role}</td>
                          <td style={{ padding: '0.6rem', fontWeight: '600', color: '#fff' }}>{log.action}</td>
                          <td style={{ padding: '0.6rem', color: '#4ade80' }}>{log.entity_type || '—'}</td>
                          <td style={{ padding: '0.6rem', color: '#cbd5e1' }}>{log.details || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {showDocGenModal && (
          <OperationalDocumentGeneratorModal 
            onClose={() => setShowDocGenModal(false)} 
            documentTemplates={documentTemplates} 
          />
        )}

        {editingAccount && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card" style={{ width: '450px', background: 'var(--bg-card)', border: '2px solid #4A8BCE', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, color: '#4A8BCE' }}>✏️ Edit Bank Account & Type</h3>
                <button type="button" className="btn" style={{ background: 'transparent', fontSize: '1rem', cursor: 'pointer' }} onClick={() => setEditingAccount(null)}>✕</button>
              </div>
              <BankAccountForm 
                accountToEdit={editingAccount} 
                onSuccess={() => {
                  setEditingAccount(null);
                  fetchData();
                }} 
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
