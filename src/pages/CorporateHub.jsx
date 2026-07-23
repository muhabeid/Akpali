import React, { useState, useEffect } from 'react'
import { Building2, Shield, Settings, Users, Landmark, FileText, Briefcase, Download, Upload, GitMerge, HardDrive, Database, Scale, PlusCircle } from 'lucide-react'

export default function CorporateHub({ setGlobalDrawer }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [companyData, setCompanyData] = useState({
    legal_name: '',
    registration_num: '',
    tax_pin: '',
    email: '',
    phone: '',
    address: '',
    logo_url: '',
    base_currency: 'USD'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [documents, setDocuments] = useState([])
  const [accounts, setAccounts] = useState([])
  const [users, setUsers] = useState([])
  const [clients, setClients] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)

  const [systemSettings, setSystemSettings] = useState({
    smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '', wa_token: '', wa_phone_id: ''
  })
  const [documentTemplates, setDocumentTemplates] = useState({})
  const [selectedDocType, setSelectedDocType] = useState('SQ')
  const [approvalWorkflows, setApprovalWorkflows] = useState([])
  const [legalContracts, setLegalContracts] = useState([])

  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isSavingTemplates, setIsSavingTemplates] = useState(false)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coRes, docRes, accRes, usrRes, clRes, supRes, setRes, tplRes, wfRes, lglRes] = await Promise.all([
          fetch('http://localhost:5000/api/company'),
          fetch('http://localhost:5000/api/documents'),
          fetch('http://localhost:5000/api/accounts'),
          fetch('http://localhost:5000/api/users'),
          fetch('http://localhost:5000/api/clients'),
          fetch('http://localhost:5000/api/suppliers'),
          fetch('http://localhost:5000/api/settings'),
          fetch('http://localhost:5000/api/templates'),
          fetch('http://localhost:5000/api/workflows'),
          fetch('http://localhost:5000/api/contracts')
        ])
        
        const coData = await coRes.json();
        if (coData && coData.id) setCompanyData(coData);
        
        setDocuments(await docRes.json());
        setAccounts(await accRes.json());
        setUsers(await usrRes.json());
        setClients(await clRes.json());
        setSuppliers(await supRes.json());
        
        const setData = await setRes.json();
        if (setData && setData.id) setSystemSettings(setData);

        const tplData = await tplRes.json();
        setDocumentTemplates(tplData || {});

        setApprovalWorkflows(await wfRes.json());
        setLegalContracts(await lglRes.json());
      } catch (err) {
        console.error("Error fetching corporate data:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()

    const handleRefresh = () => fetchData()
    window.addEventListener('refreshCorporateHub', handleRefresh)
    return () => window.removeEventListener('refreshCorporateHub', handleRefresh)
  }, [activeTab]) // Re-fetch on tab switch for freshness

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      });
      if (res.ok) alert('Company profile updated successfully!');
      else alert('Failed to update company profile');
    } catch (err) {
      alert('Network error. Ensure backend is running.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      
      {/* Top Navigation Grid */}
      <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid hsl(var(--primary))' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={20} color="hsl(var(--primary))" /> Corporate Configuration Modules
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          
          <button 
            className="btn" 
            onClick={() => setActiveTab('profile')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: activeTab === 'profile' ? 'hsla(var(--primary), 0.1)' : 'hsla(var(--primary), 0.05)', color: 'hsl(var(--primary))', border: activeTab === 'profile' ? '2px solid hsla(var(--primary), 0.5)' : '1px solid hsla(var(--primary), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            <Building2 size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>Company Profile</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('governance')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: activeTab === 'governance' ? 'hsla(var(--accent), 0.1)' : 'hsla(var(--accent), 0.05)', color: 'hsl(var(--accent))', border: activeTab === 'governance' ? '2px solid hsla(var(--accent), 0.5)' : '1px solid hsla(var(--accent), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            <Scale size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>Governance Records</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('banks')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: activeTab === 'banks' ? 'hsla(var(--success), 0.1)' : 'hsla(var(--success), 0.05)', color: 'hsl(var(--success))', border: activeTab === 'banks' ? '2px solid hsla(var(--success), 0.5)' : '1px solid hsla(var(--success), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            <Landmark size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>Bank Accounts</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('master_data')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: activeTab === 'master_data' ? 'hsla(var(--info), 0.1)' : 'hsla(var(--info), 0.05)', color: 'hsl(var(--info))', border: activeTab === 'master_data' ? '2px solid hsla(var(--info), 0.5)' : '1px solid hsla(var(--info), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            <Database size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>Master Data (CRM)</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('users')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: activeTab === 'users' ? 'hsla(var(--warning), 0.1)' : 'hsla(var(--warning), 0.05)', color: 'hsl(var(--warning))', border: activeTab === 'users' ? '2px solid hsla(var(--warning), 0.5)' : '1px solid hsla(var(--warning), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            <Users size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>User Management</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('settings')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: activeTab === 'settings' ? 'hsla(var(--primary), 0.1)' : 'hsla(var(--primary), 0.05)', color: 'hsl(var(--primary))', border: activeTab === 'settings' ? '2px solid hsla(var(--primary), 0.5)' : '1px solid hsla(var(--primary), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            <Settings size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>System Settings</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('templates')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: activeTab === 'templates' ? 'hsla(var(--accent), 0.1)' : 'hsla(var(--accent), 0.05)', color: 'hsl(var(--accent))', border: activeTab === 'templates' ? '2px solid hsla(var(--accent), 0.5)' : '1px solid hsla(var(--accent), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            <FileText size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>Document Templates</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('workflows')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: activeTab === 'workflows' ? 'hsla(var(--warning), 0.1)' : 'hsla(var(--warning), 0.05)', color: 'hsl(var(--warning))', border: activeTab === 'workflows' ? '2px solid hsla(var(--warning), 0.5)' : '1px solid hsla(var(--warning), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            <GitMerge size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>Approval Workflows</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('contracts')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: activeTab === 'contracts' ? 'hsla(var(--info), 0.1)' : 'hsla(var(--info), 0.05)', color: 'hsl(var(--info))', border: activeTab === 'contracts' ? '2px solid hsla(var(--info), 0.5)' : '1px solid hsla(var(--info), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            <Shield size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>Legal & Contracts</span>
          </button>

          <button 
            className="btn" 
            onClick={() => setActiveTab('backups')} 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: activeTab === 'backups' ? 'hsla(var(--success), 0.1)' : 'hsla(var(--success), 0.05)', color: 'hsl(var(--success))', border: activeTab === 'backups' ? '2px solid hsla(var(--success), 0.5)' : '1px solid hsla(var(--success), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            <HardDrive size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>Data Backup & Export</span>
          </button>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ flex: 1, padding: '2rem' }}>
        
        {loading && <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-secondary))' }}>Loading Corporate Data...</div>}

        {!loading && activeTab === 'profile' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>Company Profile</h3>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Legal Company Name</label>
                  <input type="text" className="form-control" required value={companyData.legal_name} onChange={e => setCompanyData({...companyData, legal_name: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Base Currency</label>
                  <select className="form-control" value={companyData.base_currency} onChange={e => setCompanyData({...companyData, base_currency: e.target.value})}>
                    <option value="USD">USD ($)</option>
                    <option value="KES">KES (Ksh)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Company Registration No.</label>
                  <input type="text" className="form-control" value={companyData.registration_num || ''} onChange={e => setCompanyData({...companyData, registration_num: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Tax PIN / VAT No.</label>
                  <input type="text" className="form-control" value={companyData.tax_pin || ''} onChange={e => setCompanyData({...companyData, tax_pin: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Official Email</label>
                  <input type="email" className="form-control" value={companyData.email || ''} onChange={e => setCompanyData({...companyData, email: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Official Phone</label>
                  <input type="text" className="form-control" value={companyData.phone || ''} onChange={e => setCompanyData({...companyData, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Head Office Address</label>
                <textarea className="form-control" rows="3" value={companyData.address || ''} onChange={e => setCompanyData({...companyData, address: e.target.value})}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {!loading && activeTab === 'governance' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Governance & Statutory Records</h3>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => setGlobalDrawer('upload_document')}>+ Upload Document</button>
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
                    <td style={{ padding: '0.75rem 1rem' }}>{doc.expiry_date}</td>
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
              <h3 style={{ margin: 0 }}>Official Bank Accounts</h3>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => setGlobalDrawer('bank_account')}>+ Add Account</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Account ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Account Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Current Balance</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{acc.id}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{acc.name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span className="badge badge-info">{acc.type}</span></td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>${Number(acc.current_balance).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button 
                        className="btn" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--danger), 0.1)', color: 'hsl(var(--danger))' }}
                        onClick={async () => {
                          if(window.confirm('Are you sure you want to remove this account?')) {
                            await fetch(`http://localhost:5000/api/accounts/${acc.id}`, { method: 'DELETE' });
                            window.dispatchEvent(new Event('refreshCorporateHub'));
                          }
                        }}
                      >Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === 'master_data' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Master Data (CRM & Vendors)</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => setGlobalDrawer('new_client')}>+ Add Client</button>
                <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', background: 'hsl(var(--accent))' }} onClick={() => setGlobalDrawer('new_supplier')}>+ Add Supplier</button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              
              {/* Clients Table */}
              <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div style={{ background: 'hsla(var(--primary), 0.1)', padding: '1rem', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>Registered Clients</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <tbody>
                    {clients.length === 0 ? (
                      <tr><td style={{ padding: '1.5rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No clients found.</td></tr>
                    ) : clients.map(client => (
                      <tr key={client.id} style={{ borderTop: '1px solid hsl(var(--border))' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 'bold' }}>{client.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>{client.email} | PIN: {client.tax_pin || 'N/A'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Suppliers Table */}
              <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div style={{ background: 'hsla(var(--accent), 0.1)', padding: '1rem', fontWeight: 'bold', color: 'hsl(var(--accent))' }}>Registered Suppliers (Vendors)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <tbody>
                    {suppliers.length === 0 ? (
                      <tr><td style={{ padding: '1.5rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No suppliers found.</td></tr>
                    ) : suppliers.map(supplier => (
                      <tr key={supplier.id} style={{ borderTop: '1px solid hsl(var(--border))' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 'bold' }}>{supplier.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>{supplier.email} | PIN: {supplier.kra_pin || 'N/A'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {!loading && activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>User Management & Roles</h3>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => setGlobalDrawer('invite_user')}>+ Invite User</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email Address</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No active users found.</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{user.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'hsl(var(--text-secondary))' }}>{user.email}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span className={`badge ${user.role === 'Admin' ? 'badge-warning' : 'badge-info'}`}>{user.role}</span></td>
                    <td style={{ padding: '0.75rem 1rem' }}><span className="badge badge-success">{user.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === 'settings' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>System Settings & Integrations</h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingSettings(true);
              try {
                const res = await fetch('http://localhost:5000/api/settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(systemSettings)
                });
                if(res.ok) alert('Settings saved successfully!');
              } catch (err) {
                alert('Error saving settings');
              } finally {
                setIsSavingSettings(false);
              }
            }}>
              <div style={{ display: 'grid', gap: '2rem' }}>
                
                <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0' }}>Email Notifications (SMTP)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <input type="text" className="form-control" placeholder="SMTP Host (e.g. smtp.gmail.com)" style={{ flex: 1 }} value={systemSettings.smtp_host || ''} onChange={e => setSystemSettings({...systemSettings, smtp_host: e.target.value})} />
                      <input type="text" className="form-control" placeholder="Port (e.g. 587)" style={{ width: '100px' }} value={systemSettings.smtp_port || ''} onChange={e => setSystemSettings({...systemSettings, smtp_port: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <input type="text" className="form-control" placeholder="SMTP Username (Email)" style={{ flex: 1 }} value={systemSettings.smtp_user || ''} onChange={e => setSystemSettings({...systemSettings, smtp_user: e.target.value})} />
                      <input type="password" className="form-control" placeholder="SMTP Password / App Password" style={{ flex: 1 }} value={systemSettings.smtp_pass || ''} onChange={e => setSystemSettings({...systemSettings, smtp_pass: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0' }}>WhatsApp Cloud API Integration</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input type="password" className="form-control" placeholder="API Access Token" value={systemSettings.wa_token || ''} onChange={e => setSystemSettings({...systemSettings, wa_token: e.target.value})} />
                    <input type="text" className="form-control" placeholder="Phone Number ID" value={systemSettings.wa_phone_id || ''} onChange={e => setSystemSettings({...systemSettings, wa_phone_id: e.target.value})} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={isSavingSettings}>
                    {isSavingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>

              </div>
            </form>
          </div>
        )}

        {!loading && activeTab === 'templates' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>Document Template Designer</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              
              {/* GLOBAL SETTINGS */}
              <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'hsl(var(--primary))' }}>Global Brand Settings</h4>
                <p style={{ margin: '0 0 1.5rem 0', color: 'hsl(var(--text-secondary))', fontSize: '0.875rem' }}>These settings apply across all system-generated documents.</p>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSavingTemplates(true);
                  try {
                    await fetch('http://localhost:5000/api/templates', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...documentTemplates['GLOBAL'], id: 'GLOBAL' })
                    });
                    alert('Global brand settings saved!');
                  } catch (err) { alert('Error saving settings'); }
                  finally { setIsSavingTemplates(false); }
                }}>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Header Logo URL</label>
                      <input type="url" className="form-control" placeholder="https://example.com/logo.png" 
                        value={documentTemplates['GLOBAL']?.header_logo_url || ''} 
                        onChange={e => setDocumentTemplates({...documentTemplates, GLOBAL: {...documentTemplates['GLOBAL'], header_logo_url: e.target.value}})} 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Primary Brand Color</label>
                      <input type="color" className="form-control" style={{ width: '100px', padding: '0.25rem' }} 
                        value={documentTemplates['GLOBAL']?.primary_color || '#0f172a'} 
                        onChange={e => setDocumentTemplates({...documentTemplates, GLOBAL: {...documentTemplates['GLOBAL'], primary_color: e.target.value}})} 
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <button type="submit" className="btn btn-primary" disabled={isSavingTemplates}>Save Brand</button>
                    </div>
                  </div>
                </form>
              </div>

              {/* MODULE SPECIFIC SETTINGS */}
              <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: 'hsl(var(--accent))' }}>Module-Specific Terms</h4>
                </div>
                <div className="form-group">
                  <select className="form-control" style={{ fontWeight: 'bold' }} value={selectedDocType} onChange={e => setSelectedDocType(e.target.value)}>
                    <option value="SQ">Sales Quotations</option>
                    <option value="LPO">Local Purchase Orders (LPO)</option>
                    <option value="RFQ">Request for Quotation (RFQ)</option>
                    <option value="PO">Purchase Orders (PO)</option>
                    <option value="DELIVERY">Delivery Notes</option>
                    <option value="INVOICE">Invoices</option>
                    <option value="LETTERHEAD">Standard Letterhead</option>
                  </select>
                </div>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSavingTemplates(true);
                  try {
                    await fetch('http://localhost:5000/api/templates', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...documentTemplates[selectedDocType], id: selectedDocType })
                    });
                    alert(`${selectedDocType} settings saved!`);
                  } catch (err) { alert('Error saving settings'); }
                  finally { setIsSavingTemplates(false); }
                }}>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Header Text ({selectedDocType})</label>
                      <input type="text" className="form-control" placeholder="Optional header text or title..." 
                        value={documentTemplates[selectedDocType]?.header_text || ''} 
                        onChange={e => setDocumentTemplates({...documentTemplates, [selectedDocType]: {...documentTemplates[selectedDocType], header_text: e.target.value}})} 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Footer Text ({selectedDocType})</label>
                      <input type="text" className="form-control" placeholder="Registered Office details..." 
                        value={documentTemplates[selectedDocType]?.footer_text || ''} 
                        onChange={e => setDocumentTemplates({...documentTemplates, [selectedDocType]: {...documentTemplates[selectedDocType], footer_text: e.target.value}})} 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Standard Terms & Conditions ({selectedDocType})</label>
                      <textarea className="form-control" rows="5" placeholder="1. Payment due in 30 days..." 
                        value={documentTemplates[selectedDocType]?.terms_conditions_text || ''} 
                        onChange={e => setDocumentTemplates({...documentTemplates, [selectedDocType]: {...documentTemplates[selectedDocType], terms_conditions_text: e.target.value}})} 
                      ></textarea>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <button type="submit" className="btn btn-primary" style={{ background: 'hsl(var(--accent))', borderColor: 'hsl(var(--accent))' }} disabled={isSavingTemplates}>Save {selectedDocType} Terms</button>
                    </div>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}

        {!loading && activeTab === 'workflows' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Approval Workflows</h3>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => setGlobalDrawer('approval_workflow')}>+ Create Rule</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Module</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Maker Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Checker Role</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Threshold ($)</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvalWorkflows.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No workflow rules defined.</td></tr>
                ) : approvalWorkflows.map(wf => (
                  <tr key={wf.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{wf.module_name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{wf.maker_role}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{wf.checker_role}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{wf.threshold_amount > 0 ? `$${Number(wf.threshold_amount).toLocaleString()}` : 'Any'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button 
                        className="btn" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--danger), 0.1)', color: 'hsl(var(--danger))' }}
                        onClick={async () => {
                          if(window.confirm('Remove this workflow rule?')) {
                            await fetch(`http://localhost:5000/api/workflows/${wf.id}`, { method: 'DELETE' });
                            window.dispatchEvent(new Event('refreshCorporateHub'));
                          }
                        }}
                      >Remove</button>
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
              <h3 style={{ margin: 0 }}>Legal & Contract Vault</h3>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => setGlobalDrawer('legal_contract')}>+ Add Contract</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Contract ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Title</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Party Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {legalContracts.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No legal contracts on file.</td></tr>
                ) : legalContracts.map(lc => (
                  <tr key={lc.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{lc.id}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{lc.title}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{lc.party_name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span className="badge badge-info">{lc.contract_type}</span></td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button 
                        className="btn" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'hsla(var(--danger), 0.1)', color: 'hsl(var(--danger))' }}
                        onClick={async () => {
                          if(window.confirm('Delete this contract record?')) {
                            await fetch(`http://localhost:5000/api/contracts/${lc.id}`, { method: 'DELETE' });
                            window.dispatchEvent(new Event('refreshCorporateHub'));
                          }
                        }}
                      >Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === 'backups' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>Data Backup & Export</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              
              <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Full Database Backup</h4>
                <p style={{ margin: '0 0 1.5rem 0', color: 'hsl(var(--text-secondary))', fontSize: '0.875rem' }}>Download a complete snapshot of the raw SQLite database file. This contains all configurations, master data, finances, and settings.</p>
                <a href="http://localhost:5000/api/backup/sqlite" download className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HardDrive size={16} /> Download SQLite Backup
                </a>
              </div>

              <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>CSV Exports</h4>
                <p style={{ margin: '0 0 1rem 0', color: 'hsl(var(--text-secondary))', fontSize: '0.875rem' }}>Export individual tables to CSV formats for auditing, accounting, or importing into external tools.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['clients', 'suppliers', 'tenders', 'finances', 'purchase_orders', 'inventory'].map(table => (
                    <a key={table} href={`http://localhost:5000/api/export/${table}`} download className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>
                      Export {table}
                    </a>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
