import React from 'react'
import { Building2, Shield, Briefcase, FileCheck, Landmark, Users, Award, CheckCircle2, Clock, AlertCircle, FileText, ExternalLink, Paperclip, BarChart3, CheckSquare, Eye, UserCheck, Scroll, FileCode, HardHat, Compass, Mail } from 'lucide-react'
import { useCurrency } from '../context/CurrencyContext'

export default function CompanyProfileDossier({ dossierData, options = {}, onPreviewFile }) {
  const { formatAmount } = useCurrency()
  if (!dossierData) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading corporate dossier data...</div>

  const {
    profile = {},
    documents = [],
    directors = [],
    tenderRegistrations = [],
    policies = [],
    experience = [],
    clientPortfolio = [],
    allTenders = [],
    allLPOs = [],
    accounts = [],
    users = [],
    contracts = []
  } = dossierData

  const {
    showFinancials = true,
    showBankAccounts = true,
    showPersonnel = true,
    showLegalContracts = true,
    showCapacityHighlights = true,
    showAppendix = true,
    showLPOs = true,
    showDirectors = true,
    showRegistrations = true,
    showPolicies = true,
    showExperience = true,
    showIntroLetter = true,
    showStatutoryTable = true,
    watermark = 'NONE'
  } = options

  const currency = profile.base_currency || 'USD'

  const getCleanUrl = (url, fallback = '') => {
    if (!url) return fallback
    if (url === '/logo.png' || url === '/stamp.png') return url
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('/')) return `http://localhost:5000${url}`
    return `http://localhost:5000/${url}`
  }

  // Capacity Math
  const highestSingleContract = allTenders.length > 0 
    ? Math.max(...allTenders.map(t => Number(t.contract_value) || 0)) 
    : 0
  const totalPortfolioValue = allTenders.reduce((sum, t) => sum + (Number(t.contract_value) || 0), 0)
  const completedTendersCount = allTenders.filter(t => t.status === 'Completed').length
  const executionRate = allTenders.length > 0 ? Math.round((completedTendersCount / allTenders.length) * 100) : 100

  // Scope Distribution
  const categories = ['Supply of goods', 'Provision of services', 'Construction works', 'Mixed contracts']
  const categoryStats = categories.map(cat => {
    const catTenders = allTenders.filter(t => t.category === cat)
    const catValue = catTenders.reduce((sum, t) => sum + (Number(t.contract_value) || 0), 0)
    const percentage = totalPortfolioValue > 0 ? Math.round((catValue / totalPortfolioValue) * 100) : 0
    return { category: cat, count: catTenders.length, value: catValue, percentage }
  })

  const activeClientPortfolio = clientPortfolio.filter(c => c.tenderCount > 0 || c.lpos.length > 0)

  // Section 8: Combine Tenders (Completed & Active) with Manual Experience
  const combinedProjects = [
    ...allTenders.map(t => ({
      id: t.id,
      name: t.name,
      client: t.client_full_name || t.client_name || 'Institutional Client',
      value: t.contract_value,
      status: t.status,
      progress: t.progress,
      date: t.expected_completion || t.start_date || t.created_at,
      category: t.category,
      isSystemTender: true
    })),
    ...experience.map(e => ({
      id: e.id,
      name: e.project_name,
      client: e.client_name,
      value: e.contract_value,
      status: 'Completed',
      progress: 100,
      date: e.completion_date,
      category: e.scope || 'Project Execution',
      isSystemTender: false
    }))
  ]

  // Collect Appendix Softcopies
  const appendixDocs = [
    ...documents.map(d => ({ id: d.id, title: d.title, category: d.document_type || 'Statutory Certificate', date: d.expiry_date || d.created_at, fileUrl: d.file_path, status: d.status })),
    ...directors.filter(d => d.cv_url).map(d => ({ id: d.id, title: `Director CV: ${d.name}`, category: 'Director CV', date: d.appointment_date, fileUrl: d.cv_url, status: 'Active' })),
    ...tenderRegistrations.filter(r => r.certificate_url).map(r => ({ id: r.id, title: `Registration: ${r.authority_name}`, category: 'Tender Registration', date: r.expiry_date, fileUrl: r.certificate_url, status: 'Active' })),
    ...policies.filter(p => p.document_url).map(p => ({ id: p.id, title: `Policy: ${p.title}`, category: 'Company Policy', date: 'Active Policy', fileUrl: p.document_url, status: 'Active' })),
    ...experience.filter(e => e.reference_letter_url || e.completion_certificate_url).map(e => ({ id: e.id, title: `Project Reference: ${e.project_name}`, category: 'Past Project Proof', date: e.completion_date, fileUrl: e.reference_letter_url || e.completion_certificate_url, status: 'Completed' })),
    ...contracts.map(c => ({ id: c.id, title: c.title, category: `Legal Contract (${c.contract_type})`, date: c.start_date || c.created_at, fileUrl: c.file_url, status: c.status })),
  ].filter(doc => Boolean(doc.fileUrl))

  // Dynamic Section Counter
  let secIndex = 1

  return (
    <div className="dossier-container" style={{ position: 'relative', background: '#fff', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif', padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', maxWidth: '900px', margin: '0 auto', overflow: 'hidden' }}>
      
      {/* WATERMARK */}
      {watermark && watermark !== 'NONE' && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%) rotate(-35deg)',
          fontSize: '3rem', fontWeight: '900', color: 'rgba(15, 23, 42, 0.05)', whiteSpace: 'nowrap',
          pointerEvents: 'none', userSelect: 'none', zIndex: 1, textTransform: 'uppercase', letterSpacing: '0.1em',
          border: '4px dashed rgba(15, 23, 42, 0.06)', padding: '1rem 3rem', borderRadius: '12px'
        }}>
          {watermark}
        </div>
      )}

      {/* COVER BANNER */}
      <div style={{ borderBottom: '3px solid hsl(var(--primary))', paddingBottom: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <img 
            src={getCleanUrl(profile.logo_url, '/logo.png')} 
            alt="Company Logo" 
            style={{ height: '160px', maxWidth: '320px', objectFit: 'contain' }} 
            onError={(e) => { e.target.src = '/logo.png'; e.target.onerror = null; }} 
          />
          <h1 style={{ margin: '0.4rem 0 0 0', fontSize: '1.5rem', color: 'hsl(var(--primary))', fontWeight: '800', textTransform: 'uppercase' }}>
            {profile.legal_name || 'AKPALI COMPANY LIMITED'}
          </h1>
          {profile.trading_name && <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Trading As: {profile.trading_name}</div>}
          <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', marginTop: '0.4rem' }}>
            <div><strong>Head Office:</strong> {profile.address || 'Nairobi, Kenya'} {profile.postal_address && `| P.O. Box ${profile.postal_address}`}</div>
            <div>
              {profile.email && <span><strong>Email:</strong> {profile.email}</span>}
              {profile.phone && <span> &bull; <strong>Phone:</strong> {profile.phone}</span>}
              {profile.website && <span> &bull; <strong>Web:</strong> {profile.website}</span>}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', background: 'hsla(var(--primary), 0.05)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid hsla(var(--primary), 0.2)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--primary))', fontWeight: '700' }}>Corporate Credentials</div>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', marginTop: '0.25rem' }}>Inc Reg #: {profile.registration_num || 'CPR/2026/8941'}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'hsl(var(--text-secondary))' }}>Tax PIN: {profile.tax_pin || 'P051234567Z'}</div>
          {profile.vat_num && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>VAT #: {profile.vat_num}</div>}
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Business Type: {profile.business_type || 'Limited Liability Company'}</div>
          
          {showBankAccounts && accounts.length > 0 && (
            <div style={{ marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px dashed hsla(var(--primary), 0.25)', fontSize: '0.73rem', color: '#334155', textAlign: 'right' }}>
              <div><strong>Primary Banker:</strong> {accounts[0].name} ({accounts[0].branch || 'Main'})</div>
              <div><strong>Swift:</strong> {accounts[0].swift_code || 'N/A'} | <strong>Acc #:</strong> {accounts[0].account_number || accounts[0].id}</div>
            </div>
          )}
        </div>
      </div>

      {/* DOCUMENT TITLE BADGE */}
      <div style={{ background: 'hsl(var(--primary))', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '1.5rem', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)', position: 'relative', zIndex: 2 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: '700' }}>
          Official Corporate Profile & Tender Qualification Dossier
        </h2>
        <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.2rem' }}>
          Comprehensive Organizational Identity, Directors, Statutory Licenses, Registrations & Track Record
        </div>
      </div>

      {/* INTRODUCTORY / COVER LETTER */}
      {showIntroLetter && profile.introductory_letter && (
        <section style={{ marginBottom: '2rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1.5rem', borderRadius: 'var(--radius-md)', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            <Mail color="hsl(var(--primary))" size={18} />
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'hsl(var(--primary))', fontWeight: '700', textTransform: 'uppercase' }}>
              {secIndex++}. Executive Introductory Cover Letter
            </h3>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {profile.introductory_letter}
          </div>
        </section>
      )}

      {/* VISION, MISSION & VALUES BOX */}
      {(profile.vision || profile.mission || profile.core_values) && (
        <section style={{ marginBottom: '2rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1.25rem', borderRadius: 'var(--radius-md)', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: profile.core_values ? '1fr 1fr 1fr' : '1fr 1fr', gap: '1rem' }}>
            {profile.vision && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'hsl(var(--primary))', marginBottom: '0.25rem' }}>Our Vision</div>
                <div style={{ fontSize: '0.825rem', color: '#334155', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{profile.vision}</div>
              </div>
            )}
            {profile.mission && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'hsl(var(--primary))', marginBottom: '0.25rem' }}>Our Mission</div>
                <div style={{ fontSize: '0.825rem', color: '#334155', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{profile.mission}</div>
              </div>
            )}
            {profile.core_values && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'hsl(var(--primary))', marginBottom: '0.25rem' }}>Core Values</div>
                <div style={{ fontSize: '0.825rem', color: '#334155', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{profile.core_values}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CAPACITY HIGHLIGHTS */}
      {showCapacityHighlights && (
        <section style={{ marginBottom: '2rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'hsla(var(--primary), 0.04)', border: '1px solid hsla(var(--primary), 0.2)', padding: '0.85rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'hsl(var(--primary))', fontWeight: '700' }}>Single Contract Capacity</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                {showFinancials && highestSingleContract > 0 ? formatAmount(highestSingleContract) : 'Qualified'}
              </div>
            </div>
            <div style={{ background: 'hsla(var(--success), 0.04)', border: '1px solid hsla(var(--success), 0.2)', padding: '0.85rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#16a34a', fontWeight: '700' }}>Total Executed Volume</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#16a34a', marginTop: '0.2rem' }}>
                {showFinancials ? formatAmount(totalPortfolioValue) : `${allTenders.length} Projects`}
              </div>
            </div>
            <div style={{ background: 'hsla(var(--accent), 0.04)', border: '1px solid hsla(var(--accent), 0.2)', padding: '0.85rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'hsl(var(--accent))', fontWeight: '700' }}>Completion Rate</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>
                {executionRate}% Success Rate
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: STATUTORY COMPLIANCE RECORDS TABLE (DYNAMIC NUMBERING & TOGGLEABLE) */}
      {showStatutoryTable && (
        <section style={{ marginBottom: '2rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
            <Shield color="hsl(var(--primary))" size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
              {secIndex++}. Corporate Governance & Statutory Compliance Records
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Document Title</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Category</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Expiry Date</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600', textAlign: 'center' }}>Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8' }}>No statutory documents recorded.</td></tr>
              ) : documents.map((doc, idx) => {
                const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date()
                return (
                  <tr key={doc.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: '600', color: '#1e293b' }}>{doc.title}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>{doc.document_type || 'Statutory Compliance'}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: isExpired ? '#dc2626' : '#475569' }}>{doc.expiry_date || 'Permanent Certificate'}</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: isExpired ? '#fef2f2' : '#f0fdf4', color: isExpired ? '#dc2626' : '#16a34a', fontWeight: '600' }}>
                        {isExpired ? 'Expired' : 'Active & Compliant'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* SECTION: DIRECTORS & SHAREHOLDERS */}
      {showDirectors && directors.length > 0 && (
        <section style={{ marginBottom: '2rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
            <UserCheck color="hsl(var(--primary))" size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
              {secIndex++}. Directors & Key Shareholders Structure
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Director Name</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Position / Role</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>ID / KRA PIN</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600', textAlign: 'right' }}>Shareholding %</th>
              </tr>
            </thead>
            <tbody>
              {directors.map((dir, dIdx) => (
                <tr key={dir.id || dIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: '600', color: '#1e293b' }}>{dir.name}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>{dir.position}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>ID: {dir.id_passport || 'N/A'} | PIN: {dir.kra_pin || 'N/A'}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '700', color: 'hsl(var(--primary))' }}>{dir.shareholding_pct || 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* SECTION: TENDER REGISTRATION CERTIFICATES */}
      {showRegistrations && tenderRegistrations.length > 0 && (
        <section style={{ marginBottom: '2rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
            <Award color="hsl(var(--primary))" size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
              {secIndex++}. Tender Registration & Regulatory Certificates (NCA, EBK, Treasury)
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Registering Authority</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Registration / Ref #</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Category / Grade</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {tenderRegistrations.map((reg, rIdx) => (
                <tr key={reg.id || rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: '600', color: '#1e293b' }}>{reg.authority_name}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'hsl(var(--primary))', fontWeight: '600' }}>{reg.registration_number}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>{reg.category_grade || 'Standard'}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{reg.expiry_date || 'Active'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* SECTION: COMPANY POLICIES */}
      {showPolicies && policies.length > 0 && (
        <section style={{ marginBottom: '2rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
            <Scroll color="hsl(var(--primary))" size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
              {secIndex++}. Corporate Policies & Compliance Governance
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            {policies.map((pol, pIdx) => (
              <div key={pol.id || pIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'hsl(var(--primary))' }}>{pol.title}</div>
                {pol.content_text && <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.2rem', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{pol.content_text}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PAGE BREAK */}
      <div className="page-break" style={{ pageBreakBefore: 'always', margin: '1.5rem 0' }}></div>

      {/* SECTION: CLIENT TRACK RECORD */}
      <section style={{ marginBottom: '2rem', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
          <Briefcase color="hsl(var(--primary))" size={20} />
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
            {secIndex++}. Client Track Record & Tender Reference Portfolio
          </h3>
        </div>

        {activeClientPortfolio.map((client, cIdx) => (
          <div key={client.id || cIdx} style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'hsl(var(--primary))' }}>{client.name}</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>PIN: {client.tax_pin || 'N/A'}</span>
              </div>
              <span style={{ fontSize: '0.7rem', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '700' }}>
                {client.tenderCount} Tender{client.tenderCount !== 1 ? 's' : ''} Awarded
              </span>
            </div>

            {client.tenders.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569' }}>
                    <th style={{ padding: '0.3rem 0.5rem' }}>Tender ID / Name</th>
                    <th style={{ padding: '0.3rem 0.5rem' }}>Client Ref #</th>
                    <th style={{ padding: '0.3rem 0.5rem' }}>Category</th>
                    <th style={{ padding: '0.3rem 0.5rem', textAlign: 'center' }}>Status</th>
                    {showFinancials && <th style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>Value</th>}
                  </tr>
                </thead>
                <tbody>
                  {client.tenders.map((t, tIdx) => {
                    const tenderLPOs = allLPOs.filter(l => l.tender_id === t.id)
                    return (
                      <React.Fragment key={t.id || tIdx}>
                        <tr style={{ borderBottom: '1px dashed #e2e8f0' }}>
                          <td style={{ padding: '0.35rem 0.5rem', fontWeight: '600', color: '#1e293b' }}>[{t.id}] {t.name}</td>
                          <td style={{ padding: '0.35rem 0.5rem', color: 'hsl(var(--primary))', fontWeight: '600' }}>{t.client_reference || 'N/A'}</td>
                          <td style={{ padding: '0.35rem 0.5rem', color: '#64748b' }}>{t.category}</td>
                          <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '8px', background: t.status === 'Completed' ? '#dcfce7' : '#e0f2fe', color: t.status === 'Completed' ? '#15803d' : '#0369a1', fontWeight: '600' }}>
                              {t.status}
                            </span>
                          </td>
                          {showFinancials && (
                            <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                              {currency} {Number(t.contract_value || 0).toLocaleString()}
                            </td>
                          )}
                        </tr>

                        {showLPOs && tenderLPOs.length > 0 && (
                          <tr style={{ background: '#f8fafc' }}>
                            <td colSpan={showFinancials ? 5 : 4} style={{ padding: '0.25rem 0.5rem 0.4rem 1rem' }}>
                              {tenderLPOs.map((lpo, lIdx) => (
                                <div key={lpo.id || lIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', background: '#fff', border: '1px solid #e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', marginBottom: '0.15rem' }}>
                                  <span><strong>LPO Ref #:</strong> {lpo.client_reference || lpo.id} (Issued: {lpo.issue_date || 'N/A'})</span>
                                  {showFinancials && <span style={{ fontWeight: '700', color: '#16a34a' }}>{currency} {Number(lpo.total_value || 0).toLocaleString()}</span>}
                                </div>
                              ))}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </section>

      {/* SECTION 8: COMPANY EXPERIENCE & SYSTEM PROJECTS (COMPLETED & CONTINUING) */}
      {showExperience && combinedProjects.length > 0 && (
        <section style={{ marginBottom: '2rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
            <Compass color="hsl(var(--primary))" size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
              {secIndex++}. Company Experience & Projects Portfolio (Completed & Continuing)
            </h3>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '-0.4rem', marginBottom: '0.75rem' }}>
            Summary of all system-recorded tender projects and contract executions across our operational history:
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Project / Tender Name</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Client</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Category</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Status</th>
                {showFinancials && <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600', textAlign: 'right' }}>Contract Value</th>}
              </tr>
            </thead>
            <tbody>
              {combinedProjects.map((p, pIdx) => (
                <tr key={p.id || pIdx} style={{ borderBottom: '1px solid #f1f5f9', background: pIdx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: '600', color: '#1e293b' }}>
                    [{p.id}] {p.name}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>{p.client}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{p.category}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: p.status === 'Completed' ? '#dcfce7' : '#e0f2fe', color: p.status === 'Completed' ? '#15803d' : '#0369a1', fontWeight: '700' }}>
                      {p.status} ({p.progress || 100}%)
                    </span>
                  </td>
                  {showFinancials && (
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
                      {currency} {Number(p.value || 0).toLocaleString()}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}



      {/* SECTION: LEGAL CONTRACTS & MSAS */}
      {showLegalContracts && contracts.length > 0 && (
        <section style={{ marginBottom: '2rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
            <FileCheck color="hsl(var(--primary))" size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
              {secIndex++}. Legal Contracts, MSAs & Joint Venture Agreements Repository
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Contract Title</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Counterparty</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Contract Type</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '600' }}>Effective Dates</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((lc, lIdx) => (
                <tr key={lc.id || lIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: '600', color: '#1e293b' }}>{lc.title}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>{lc.party_name}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{lc.contract_type}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{lc.start_date || 'N/A'} to {lc.end_date || 'Ongoing'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* SECTION: VISUAL APPENDIX & EMBEDDED SOFTCOPIES */}
      {showAppendix && (
        <section style={{ marginBottom: '2rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
            <Paperclip color="hsl(var(--primary))" size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
              {secIndex++}. Visual Appendix: Verified Attached Softcopies & Document Scans
            </h3>
          </div>

          {appendixDocs.length === 0 ? (
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
              No softcopies attached.
            </div>
          ) : (
            appendixDocs.map((item, aIdx) => {
              const fullUrl = getCleanUrl(item.fileUrl)
              const isImage = fullUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)
              return (
                <div key={item.id || aIdx} style={{ marginBottom: '2rem', border: '2px solid #cbd5e1', borderRadius: 'var(--radius-md)', background: '#ffffff', overflow: 'hidden', pageBreakBefore: 'always' }}>
                  <div style={{ background: 'hsl(var(--primary))', color: '#ffffff', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.85 }}>
                        Attachment Exhibit #{aIdx + 1} &bull; {item.category}
                      </div>
                      <h4 style={{ margin: '0.1rem 0 0 0', fontSize: '0.95rem', fontWeight: '700', color: '#ffffff' }}>
                        📄 {item.title}
                      </h4>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: '#f8fafc', textAlign: 'center', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {isImage ? (
                      <img src={fullUrl} alt={item.title} style={{ maxWidth: '100%', maxHeight: '750px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    ) : (
                      <div style={{ width: '100%', height: '650px', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', background: '#ffffff' }}>
                        <iframe src={fullUrl} title={item.title} style={{ width: '100%', height: '100%', border: 'none' }} />
                      </div>
                    )}
                    <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                      <a href={fullUrl} target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--primary))', fontWeight: '600', textDecoration: 'underline' }}>
                        Open Direct Softcopy ↗
                      </a>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </section>
      )}

      {/* OFFICIAL SEAL & SIGNATURE */}
      <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#475569', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '500px' }}>
          <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Corporate Certification & Seal:</div>
          <div style={{ lineHeight: '1.4' }}>We hereby certify that all corporate credentials, statutory records, and attached exhibits in this dossier are authentic, accurate representations of our official corporate repository.</div>
        </div>

        <div style={{ textAlign: 'center', minWidth: '220px' }}>
          <div style={{ minHeight: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}>
            <img 
              src={getCleanUrl(profile.seal_url, '/stamp.png')} 
              alt="Official Stamp" 
              style={{ height: '90px', objectFit: 'contain', opacity: 0.9 }} 
              onError={(e) => { e.target.src = '/stamp.png'; e.target.onerror = null; }} 
            />
          </div>
          <div style={{ borderBottom: '1px dashed #475569', width: '100%', marginBottom: '0.35rem' }}></div>
          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>Authorized Corporate Signatory</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>Official Stamp & Signature</div>
        </div>
      </div>

    </div>
  )
}
