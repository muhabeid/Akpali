import React, { useState, useEffect } from 'react'
import { FileText, Printer, CheckCircle2, AlertTriangle, XCircle, Plus, Trash2 } from 'lucide-react'
import { printElement } from '../utils/printHelper'
import { useCurrency } from '../context/CurrencyContext'

export default function OperationalDocumentGeneratorModal({ onClose, documentTemplates = {} }) {
  const { formatAmount } = useCurrency()
  const [docType, setDocType] = useState('CONTRACT') // 10 Types: CONTRACT, INSPECTION, SITE_VISIT, MATERIAL_REQ, HANDOVER_CERT, SITE_LOG, VAR_ORDER, SAFETY_INCIDENT, PAYMENT_CERT, SUBCONTRACTOR_EVAL
  
  // Generic Common Fields
  const [title, setTitle] = useState('Master Service Agreement')
  const [projectName, setProjectName] = useState('Nairobi Data Center Expansion')
  const [partyName, setPartyName] = useState('Acme Corporation Ltd')
  const [personInCharge, setPersonInCharge] = useState('Eng. John Akpali')
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0])

  // Custom Specific Fields
  const [logoUrl, setLogoUrl] = useState('/logo.png')
  const [logoSize, setLogoSize] = useState('160px') // Default 160px for prominent visibility
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [sealUrl, setSealUrl] = useState('/stamp.png')
  const [stampSize, setStampSize] = useState('90px') // Options: '50px', '70px', '90px', '120px', '150px'
  const [isUploadingSeal, setIsUploadingSeal] = useState(false)

  const [companyProfile, setCompanyProfile] = useState(null)

  useEffect(() => {
    fetch('http://localhost:5000/api/company-profile')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setCompanyProfile(data)
          if (data.logo_url) setLogoUrl(data.logo_url)
          if (data.seal_url) setSealUrl(data.seal_url)
        }
      })
      .catch(err => console.error('Error fetching company profile:', err))
  }, [])

  const handleLogoFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setIsUploadingLogo(true)
    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.fileUrl) {
        setLogoUrl(data.fileUrl)
      }
    } catch (err) {
      console.error('Logo upload error:', err)
      alert('Failed to upload logo image')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSealFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setIsUploadingSeal(true)
    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.fileUrl) {
        setSealUrl(data.fileUrl)
      }
    } catch (err) {
      console.error('Seal upload error:', err)
      alert('Failed to upload stamp image')
    } finally {
      setIsUploadingSeal(false)
    }
  }

  // 1. Inspection Checklist
  const [checklist, setChecklist] = useState([
    { id: 1, item: 'Reinforcement Steel Bar Diameter & Grade Verification', status: 'Passed', notes: 'Grade 500B verified.' },
    { id: 2, item: 'Concrete Slump & Cube Strength Test Samples', status: 'Passed', notes: '7-day test passed.' },
    { id: 3, item: 'MEP Conduit Routing & Wall Chasing Inspection', status: 'Needs Action', notes: 'Chasing depth requires 10mm correction.' }
  ])

  // 2. Site Visit Details
  const [weather, setWeather] = useState('Sunny / Dry (28°C)')
  const [siteProgress, setSiteProgress] = useState('75% Completed')
  const [observations, setObservations] = useState('Main structural column casting complete. MEP first-fix in progress. Subcontractor workforce on site is 18 personnel.')
  const [actionItems, setActionItems] = useState('1. Contractor to complete plastering of East Wing by Friday.\n2. Submit structural engineer sign-off certificate.')

  // 3. Material Requisition Line Items
  const [materialItems, setMaterialItems] = useState([
    { id: 1, name: 'TMT Steel Bars 12mm (12m length)', unit: 'Pcs', requested: 150, approved: 150 },
    { id: 2, name: 'Ordinary Portland Cement (50kg Bags)', unit: 'Bags', requested: 200, approved: 200 },
    { id: 3, name: 'PVC Electrical Conduit Pipes 25mm', unit: 'Pcs', requested: 80, approved: 80 }
  ])

  // 4. Contract Specific
  const [contractValue, setContractValue] = useState('150000')
  const [contractDuration, setContractDuration] = useState('12 Months (Renewable)')
  const [contractScope, setContractScope] = useState('The Contractor shall provide complete civil works, structural construction, and MEP installation as per approved architectural blueprints.')

  // 5. Handover & Practical Completion
  const [defectPeriod, setDefectPeriod] = useState('6 Months (Expiring 25 Jan 2027)')
  const [snagStatus, setSnagStatus] = useState('Minor Snag List Attached (3 touch-up items remaining)')
  const [retentionRelease, setRetentionRelease] = useState('50% Released ($12,500), 50% Withheld until Defect Period Expiry')

  // 6. Daily Site Log & Diary
  const [laborForce, setLaborForce] = useState('38 Personnel (4 Engineers, 24 Technicians, 10 General Labor)')
  const [equipmentStatus, setEquipmentStatus] = useState('CAT Excavator (8 Hrs), Tower Crane (6.5 Hrs), Cement Mixer (Active)')

  // 7. Variation Order
  const [variationRef, setVariationRef] = useState('VO-2026-004')
  const [reasonForChange, setReasonForChange] = useState('Client requested upgrading ground floor tiling to heavy-duty porcelain tiles & structural re-bar reinforcement.')
  const [costAdjustment, setCostAdjustment] = useState('14500')
  const [timeExtension, setTimeExtension] = useState('7 Calendar Days')

  // 8. Safety & EHS Incident Report
  const [incidentType, setIncidentType] = useState('Near-Miss / Unsafe Scaffolding Assembly')
  const [severity, setSeverity] = useState('Medium Risk - Corrective Action Required')
  const [correctiveAction, setCorrectiveAction] = useState('Scaffolding dismantled & re-erected with certified safety tags. Site safety toolbox talk conducted for all workers.')
  const [ehsOfficer, setEhsOfficer] = useState('Eng. Peter Mutua (EHS Lead Officer)')

  // 9. Interim Payment Certificate (IPC)
  const [ipcRef, setIpcRef] = useState('IPC-003')
  const [valuationPeriod, setValuationPeriod] = useState('01 June 2026 - 30 June 2026')
  const [grossValue, setGrossValue] = useState('125000')
  const [retentionAmt, setRetentionAmt] = useState('12500')
  const [netPayable, setNetPayable] = useState('112500')

  // 10. Subcontractor Performance Appraisal
  const [tradeCategory, setTradeCategory] = useState('HVAC & Mechanical Ducting Work')
  const [qualityScore, setQualityScore] = useState('4.8 / 5.0 (Excellent)')
  const [timelinessScore, setTimelinessScore] = useState('100% On Schedule')
  const [recommendation, setRecommendation] = useState('Highly Recommended for Future Enterprise Tenders & Multi-Story Commercial Projects.')

  // 8. Open Letter / Standalone Correspondence Specific Fields
  const [recipientName, setRecipientName] = useState('The Managing Director / Procurement Committee')
  const [recipientOrg, setRecipientOrg] = useState('Public Works Department, P.O. Box 40100, Nairobi, Kenya')
  const [salutation, setSalutation] = useState('Dear Sir/Madam,')
  const [letterSubject, setLetterSubject] = useState('RE: FORMAL STATEMENT OF INTENT AND CORPORATE UNDERTAKING')
  const [letterBody, setLetterBody] = useState(`We write to formally present our corporate statement regarding the execution of works under the referenced tender framework.\n\nAkpali Company Limited confirms its technical capacity, financial liquidity, and deployment readiness to undertake the assigned scope of works in accordance with all governing statutory standards and project specifications.\n\nShould you require any further clarification or documentation, please do not hesitate to contact the undersigned.`)
  const [closingSignoff, setClosingSignoff] = useState('Yours Faithfully,')
  const [signatoryTitle, setSignatoryTitle] = useState('Eng. John Akpali\nManaging Director & Chief Operations Officer')

  // Update defaults when docType changes
  const handleDocTypeChange = (type) => {
    setDocType(type)
    if (type === 'OPEN_LETTER') setTitle('Official Corporate Correspondence / Open Letter')
    else if (type === 'CONTRACT') setTitle('Master Construction & Service Agreement')
    else if (type === 'INSPECTION') setTitle('Site Material & Quality Inspection Form')
    else if (type === 'SITE_VISIT') setTitle('Technical Site Visit & Engineering Progress Report')
    else if (type === 'MATERIAL_REQ') setTitle('Site Material Requisition & Store Issuance Form')
    else if (type === 'HANDOVER_CERT') setTitle('Certificate of Practical Completion & Site Handover')
    else if (type === 'SITE_LOG') setTitle('Daily Site Work Log & Weather Engineering Diary')
    else if (type === 'VAR_ORDER') setTitle('Variation Order & Scope Change Request Authorization')
    else if (type === 'SAFETY_INCIDENT') setTitle('EHS Incident & Hazard Assessment Compliance Report')
    else if (type === 'PAYMENT_CERT') setTitle('Interim Payment Certificate (IPC) & Milestone Valuation')
    else if (type === 'SUBCONTRACTOR_EVAL') setTitle('Subcontractor & Vendor Performance Audit Appraisal')
  }

  const currentTemplate = documentTemplates[docType] || {}

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '1.5rem' }}>
      <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '1080px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        
        {/* MODAL HEADER */}
        <div style={{ background: '#0f172a', color: '#ffffff', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText color="#38bdf8" size={24} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Operational Document & Template Generator</h3>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Generate 11 printable A4 Open Letters, Contracts, Inspection Forms, Site Logs, Handover Certs & IPCs</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer', fontWeight: '700' }}>✕</button>
        </div>

        {/* MODAL BODY (TWO PANELS: FORM vs LIVE A4 PREVIEW) */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '430px 1fr', overflow: 'hidden', background: '#f8fafc' }}>
          
          {/* LEFT PANEL: INPUT FORM */}
          <div style={{ padding: '1.25rem', borderRight: '1px solid #cbd5e1', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Select Document Template Type *</label>
              <select className="form-control" style={{ fontWeight: '600', borderColor: 'hsl(var(--primary))', padding: '0.45rem' }} value={docType} onChange={e => handleDocTypeChange(e.target.value)}>
                <option value="OPEN_LETTER">✉️ Standalone Open Letter & Official Memorandum</option>
                <option value="CONTRACT">📜 Contract Agreement Template</option>
                <option value="INSPECTION">🔍 Inspection Form (QA/QC)</option>
                <option value="SITE_VISIT">🏗️ Site Visit & Progress Report</option>
                <option value="MATERIAL_REQ">📦 Material Request Form</option>
                <option value="HANDOVER_CERT">🔑 Handover & Completion Certificate</option>
                <option value="SITE_LOG">📅 Daily Site Work Log & Diary</option>
                <option value="VAR_ORDER">⚠️ Variation Order & Scope Change</option>
                <option value="SAFETY_INCIDENT">🦺 EHS Incident & Hazard Report</option>
                <option value="PAYMENT_CERT">💳 Interim Payment Certificate (IPC)</option>
                <option value="SUBCONTRACTOR_EVAL">⭐ Subcontractor Performance Appraisal</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>Document Title</label>
              <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem', margin: 0 }}>Header Logo (URL or Upload)</label>
                <select style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', borderColor: '#cbd5e1' }} value={logoSize} onChange={e => setLogoSize(e.target.value)}>
                  <option value="80px">Size: Small (80px)</option>
                  <option value="120px">Size: Medium (120px)</option>
                  <option value="160px">Size: Large (160px - Default)</option>
                  <option value="200px">Size: XL (200px)</option>
                  <option value="240px">Size: XXL (240px)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="http://... or upload image" 
                  style={{ fontSize: '0.78rem' }}
                  value={logoUrl} 
                  onChange={e => setLogoUrl(e.target.value)} 
                />
                <label className="btn btn-primary" style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.4rem 0.6rem', whiteSpace: 'nowrap' }}>
                  {isUploadingLogo ? 'Uploading...' : '📁 Upload'}
                  <input type="file" accept="image/*" onChange={handleLogoFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem', margin: 0 }}>Official Stamp / Seal</label>
                <select style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', borderColor: '#cbd5e1' }} value={stampSize} onChange={e => setStampSize(e.target.value)}>
                  <option value="50px">Size: Small (50px)</option>
                  <option value="70px">Size: Medium (70px)</option>
                  <option value="90px">Size: Large (90px - Default)</option>
                  <option value="120px">Size: XL (120px)</option>
                  <option value="150px">Size: XXL (150px)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="http://... or upload stamp" 
                  style={{ fontSize: '0.78rem' }}
                  value={sealUrl} 
                  onChange={e => setSealUrl(e.target.value)} 
                />
                <label className="btn btn-primary" style={{ cursor: 'pointer', fontSize: '0.75rem', padding: '0.4rem 0.6rem', whiteSpace: 'nowrap' }}>
                  {isUploadingSeal ? 'Uploading...' : '📁 Upload'}
                  <input type="file" accept="image/*" onChange={handleSealFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Project / Tender Name</label>
                <input type="text" className="form-control" value={projectName} onChange={e => setProjectName(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Date</label>
                <input type="date" className="form-control" value={docDate} onChange={e => setDocDate(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Counterparty / Client</label>
                <input type="text" className="form-control" value={partyName} onChange={e => setPartyName(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Inspector / Manager</label>
                <input type="text" className="form-control" value={personInCharge} onChange={e => setPersonInCharge(e.target.value)} />
              </div>
            </div>

            {/* DYNAMIC FORM SECTIONS BASED ON TEMPLATE TYPE */}
            {docType === 'CONTRACT' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Contract Value ($)</label>
                    <input type="text" className="form-control" value={contractValue} onChange={e => setContractValue(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Duration</label>
                    <input type="text" className="form-control" value={contractDuration} onChange={e => setContractDuration(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Scope Clause / Terms</label>
                  <textarea className="form-control" rows={4} value={contractScope} onChange={e => setContractScope(e.target.value)} />
                </div>
              </>
            )}

            {docType === 'INSPECTION' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', margin: 0 }}>Inspection Checklist Items</label>
                  <button type="button" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: 'hsl(var(--primary))', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setChecklist([...checklist, { id: Date.now(), item: 'New Checklist Item', status: 'Passed', notes: '' }])}>+ Add Item</button>
                </div>
                {checklist.map((item, idx) => (
                  <div key={item.id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
                    <input type="text" className="form-control" style={{ fontSize: '0.78rem', marginBottom: '0.3rem' }} value={item.item} onChange={e => {
                      const updated = [...checklist]
                      updated[idx].item = e.target.value
                      setChecklist(updated)
                    }} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select className="form-control" style={{ fontSize: '0.75rem', width: '110px' }} value={item.status} onChange={e => {
                        const updated = [...checklist]
                        updated[idx].status = e.target.value
                        setChecklist(updated)
                      }}>
                        <option value="Passed">✓ Passed</option>
                        <option value="Failed">✕ Failed</option>
                        <option value="Needs Action">⚠ Action</option>
                      </select>
                      <input type="text" className="form-control" style={{ fontSize: '0.75rem' }} placeholder="Notes/Remarks" value={item.notes} onChange={e => {
                        const updated = [...checklist]
                        updated[idx].notes = e.target.value
                        setChecklist(updated)
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {docType === 'SITE_VISIT' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Weather Conditions</label>
                    <input type="text" className="form-control" value={weather} onChange={e => setWeather(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Site Progress</label>
                    <input type="text" className="form-control" value={siteProgress} onChange={e => setSiteProgress(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Site Observations & Findings</label>
                  <textarea className="form-control" rows={3} value={observations} onChange={e => setObservations(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Corrective Action Items</label>
                  <textarea className="form-control" rows={3} value={actionItems} onChange={e => setActionItems(e.target.value)} />
                </div>
              </>
            )}

            {docType === 'MATERIAL_REQ' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', margin: 0 }}>Requested Material Items</label>
                  <button type="button" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: 'hsl(var(--primary))', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => setMaterialItems([...materialItems, { id: Date.now(), name: 'New Material Item', unit: 'Pcs', requested: 10, approved: 10 }])}>+ Add Item</button>
                </div>
                {materialItems.map((m, mIdx) => (
                  <div key={m.id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
                    <input type="text" className="form-control" style={{ fontSize: '0.78rem', marginBottom: '0.3rem' }} value={m.name} onChange={e => {
                      const updated = [...materialItems]
                      updated[mIdx].name = e.target.value
                      setMaterialItems(updated)
                    }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                      <input type="text" className="form-control" style={{ fontSize: '0.75rem' }} placeholder="Unit" value={m.unit} onChange={e => {
                        const updated = [...materialItems]
                        updated[mIdx].unit = e.target.value
                        setMaterialItems(updated)
                      }} />
                      <input type="number" className="form-control" style={{ fontSize: '0.75rem' }} placeholder="Req" value={m.requested} onChange={e => {
                        const updated = [...materialItems]
                        updated[mIdx].requested = Number(e.target.value)
                        setMaterialItems(updated)
                      }} />
                      <input type="number" className="form-control" style={{ fontSize: '0.75rem' }} placeholder="Appr" value={m.approved} onChange={e => {
                        const updated = [...materialItems]
                        updated[mIdx].approved = Number(e.target.value)
                        setMaterialItems(updated)
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {docType === 'HANDOVER_CERT' && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Defect Liability Period</label>
                  <input type="text" className="form-control" value={defectPeriod} onChange={e => setDefectPeriod(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Snag List Status</label>
                  <input type="text" className="form-control" value={snagStatus} onChange={e => setSnagStatus(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Retention Money Release Terms</label>
                  <input type="text" className="form-control" value={retentionRelease} onChange={e => setRetentionRelease(e.target.value)} />
                </div>
              </>
            )}

            {docType === 'SITE_LOG' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Weather Conditions</label>
                    <input type="text" className="form-control" value={weather} onChange={e => setWeather(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Labor Headcount</label>
                    <input type="text" className="form-control" value={laborForce} onChange={e => setLaborForce(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Plant & Heavy Machinery Status</label>
                  <input type="text" className="form-control" value={equipmentStatus} onChange={e => setEquipmentStatus(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Daily Works Accomplished</label>
                  <textarea className="form-control" rows={3} value={siteProgress} onChange={e => setSiteProgress(e.target.value)} />
                </div>
              </>
            )}

            {docType === 'VAR_ORDER' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Variation Ref #</label>
                    <input type="text" className="form-control" value={variationRef} onChange={e => setVariationRef(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Cost Adjustment ($)</label>
                    <input type="text" className="form-control" value={costAdjustment} onChange={e => setCostAdjustment(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Extension of Time</label>
                  <input type="text" className="form-control" value={timeExtension} onChange={e => setTimeExtension(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Reason for Scope Change</label>
                  <textarea className="form-control" rows={3} value={reasonForChange} onChange={e => setReasonForChange(e.target.value)} />
                </div>
              </>
            )}

            {docType === 'SAFETY_INCIDENT' && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Incident Type / Category</label>
                  <input type="text" className="form-control" value={incidentType} onChange={e => setIncidentType(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Severity Level</label>
                    <input type="text" className="form-control" value={severity} onChange={e => setSeverity(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>EHS Lead Officer</label>
                    <input type="text" className="form-control" value={ehsOfficer} onChange={e => setEhsOfficer(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Immediate Corrective Action Taken</label>
                  <textarea className="form-control" rows={3} value={correctiveAction} onChange={e => setCorrectiveAction(e.target.value)} />
                </div>
              </>
            )}

            {docType === 'PAYMENT_CERT' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>IPC Ref #</label>
                    <input type="text" className="form-control" value={ipcRef} onChange={e => setIpcRef(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Valuation Period</label>
                    <input type="text" className="form-control" value={valuationPeriod} onChange={e => setValuationPeriod(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Gross Work ($)</label>
                    <input type="number" className="form-control" value={grossValue} onChange={e => {
                      setGrossValue(e.target.value)
                      const ret = Number(e.target.value) * 0.1
                      setRetentionAmt(ret.toString())
                      setNetPayable((Number(e.target.value) - ret).toString())
                    }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Retention (10%)</label>
                    <input type="number" className="form-control" value={retentionAmt} onChange={e => setRetentionAmt(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Net Payable ($)</label>
                    <input type="number" className="form-control" value={netPayable} onChange={e => setNetPayable(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {docType === 'SUBCONTRACTOR_EVAL' && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Subcontractor Trade Category</label>
                  <input type="text" className="form-control" value={tradeCategory} onChange={e => setTradeCategory(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Quality Score</label>
                    <input type="text" className="form-control" value={qualityScore} onChange={e => setQualityScore(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Schedule Rating</label>
                    <input type="text" className="form-control" value={timelinessScore} onChange={e => setTimelinessScore(e.target.value)} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Overall Recommendation</label>
                  <textarea className="form-control" rows={3} value={recommendation} onChange={e => setRecommendation(e.target.value)} />
                </div>
              </>
            )}

            {docType === 'OPEN_LETTER' && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Recipient / Addressee</label>
                  <input type="text" className="form-control" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="e.g. The Director of Procurement" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Recipient Organization & Address</label>
                  <input type="text" className="form-control" value={recipientOrg} onChange={e => setRecipientOrg(e.target.value)} placeholder="e.g. Ministry of Infrastructure, Nairobi" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Salutation</label>
                  <input type="text" className="form-control" value={salutation} onChange={e => setSalutation(e.target.value)} placeholder="e.g. Dear Sir/Madam," />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Letter Subject / Heading</label>
                  <input type="text" className="form-control" style={{ fontWeight: '700' }} value={letterSubject} onChange={e => setLetterSubject(e.target.value)} placeholder="RE: ..." />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Letter Content Body</label>
                  <textarea className="form-control" rows={7} value={letterBody} onChange={e => setLetterBody(e.target.value)} placeholder="Draft your letter..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Closing Signoff</label>
                    <input type="text" className="form-control" value={closingSignoff} onChange={e => setClosingSignoff(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Signatory & Title</label>
                    <input type="text" className="form-control" value={signatoryTitle} onChange={e => setSignatoryTitle(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ marginTop: 'auto', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '700' }}
              onClick={() => printElement('#operational-doc-preview', docType)}
            >
              <Printer size={18} /> Print / Export A4 Document PDF
            </button>
          </div>

          {/* RIGHT PANEL: LIVE A4 PREVIEW */}
          <div style={{ padding: '2rem', overflowY: 'auto', background: '#e2e8f0' }}>
            
            <div id="operational-doc-preview" style={{ background: '#ffffff', color: '#0f172a', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxWidth: '750px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
              
              {/* SINGLE UNIFIED HEADER BANNER */}
              <div style={{ borderBottom: `3px solid ${currentTemplate?.primary_color || '#0f172a'}`, paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                {/* CENTERED LOGO & COMPANY DETAILS */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', marginBottom: '0.85rem' }}>
                  <img 
                    src={logoUrl || companyProfile?.logo_url || '/logo.png'} 
                    alt="Logo" 
                    style={{ height: logoSize || '140px', maxWidth: '320px', objectFit: 'contain' }} 
                    onError={(e) => e.target.style.display = 'none'} 
                  />
                  <h1 style={{ margin: '0.3rem 0 0 0', fontSize: '1.5rem', fontWeight: '800', color: currentTemplate?.primary_color || '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {companyProfile?.legal_name || companyProfile?.trading_name || 'AKPALI COMPANY LIMITED'}
                  </h1>
                  <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>
                    <div>{companyProfile?.postal_address || companyProfile?.address || 'Auto Bazaar, #001, Nairobi, Kenya'}</div>
                    <div style={{ fontWeight: '500' }}>
                      Tel: {companyProfile?.phone || '+254705365996'} &bull; Email: {companyProfile?.email || 'info@akpalimited.co.ke'}
                    </div>
                  </div>
                </div>

                {/* BOTTOM HEADER BAR: DOCUMENT TITLE (LEFT) + DOC REF & DATE (FAR RIGHT ABOVE LINE BREAK) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: '800', color: currentTemplate?.primary_color || '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {title || currentTemplate?.header_text || 'OFFICIAL DOCUMENT'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#334155', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span><strong>Doc Ref #:</strong> {docType}-{Math.floor(Math.random() * 9000 + 1000)}</span>
                    <span style={{ margin: '0 0.5rem', color: '#94a3b8' }}>|</span>
                    <span><strong>Date Generated:</strong> {docDate}</span>
                  </div>
                </div>
              </div>

              {/* METADATA SUMMARY GRID (FOR OPERATIONAL DOCUMENTS ONLY) */}
              {docType !== 'OPEN_LETTER' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
                  <div><strong>Project / Site Name:</strong> {projectName}</div>
                  <div><strong>Counterparty / Client:</strong> {partyName}</div>
                  <div><strong>Issued / Inspected By:</strong> {personInCharge}</div>
                  <div><strong>Date Executed:</strong> {docDate}</div>
                </div>
              )}

              {/* STANDALONE OPEN LETTER / CORRESPONDENCE SPECIFIC CONTENT */}
              {docType === 'OPEN_LETTER' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem', color: '#0f172a', lineHeight: '1.6', marginBottom: '2rem' }}>
                  {/* RECIPIENT BLOCK */}
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{recipientName}</div>
                    <div style={{ color: '#475569', fontSize: '0.85rem' }}>{recipientOrg}</div>
                  </div>

                  {/* SALUTATION */}
                  <div style={{ fontWeight: '600' }}>{salutation}</div>

                  {/* SUBJECT HEADING */}
                  {letterSubject && (
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a', textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '0.02em', margin: '0.25rem 0' }}>
                      {letterSubject}
                    </div>
                  )}

                  {/* LETTER BODY */}
                  <div style={{ whiteSpace: 'pre-wrap', color: '#1e293b', textAlign: 'justify', minHeight: '180px' }}>
                    {letterBody}
                  </div>

                  {/* CLOSING & SIGNATORY BLOCK */}
                  <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #cbd5e1', paddingTop: '1.25rem' }}>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>{closingSignoff}</div>
                      <div style={{ fontWeight: '700', color: '#0f172a', whiteSpace: 'pre-wrap' }}>{signatoryTitle}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>{companyProfile?.legal_name || 'AKPALI COMPANY LIMITED'}</div>
                    </div>

                    <div style={{ textAlign: 'center', width: '220px' }}>
                      <div style={{ minHeight: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}>
                        <img 
                          src={sealUrl ? (sealUrl.startsWith('http') ? sealUrl : `http://localhost:5000${sealUrl}`) : '/stamp.png'} 
                          alt="Official Stamp" 
                          style={{ height: stampSize || '90px', objectFit: 'contain', opacity: 0.9 }} 
                          onError={(e) => { e.target.src = '/stamp.png'; e.target.onerror = null; }} 
                        />
                      </div>
                      <div style={{ borderBottom: '1px solid #cbd5e1', width: '100%', marginBottom: '0.3rem' }}></div>
                      <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>Authorized Corporate Seal & Signature</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTRACT SPECIFIC CONTENT */}
              {docType === 'CONTRACT' && (
                <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  <h4 style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.3rem' }}>1. Scope of Work & Services</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{contractScope}</p>
                  
                  <h4 style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.3rem', marginTop: '1rem' }}>2. Financial Consideration & Duration</h4>
                  <div><strong>Contract Value:</strong> {formatAmount(contractValue)}</div>
                  <div><strong>Execution Duration:</strong> {contractDuration}</div>
                </div>
              )}

              {/* INSPECTION SPECIFIC CONTENT */}
              {docType === 'INSPECTION' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.5rem' }}>Quality Assurance Checklist Results</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '0.5rem' }}>Inspection Item</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Result</th>
                        <th style={{ padding: '0.5rem' }}>Field Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checklist.map((c, i) => (
                        <tr key={c.id || i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.5rem', fontWeight: '600' }}>{c.item}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: c.status === 'Passed' ? '#dcfce7' : c.status === 'Failed' ? '#fee2e2' : '#fef3c7', color: c.status === 'Passed' ? '#15803d' : c.status === 'Failed' ? '#b91c1c' : '#b45309', fontWeight: '700' }}>
                              {c.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem', color: '#475569' }}>{c.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SITE VISIT SPECIFIC CONTENT */}
              {docType === 'SITE_VISIT' && (
                <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  <div style={{ display: 'flex', gap: '2rem', background: '#f1f5f9', padding: '0.6rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                    <div><strong>Site Weather:</strong> {weather}</div>
                    <div><strong>Overall Progress:</strong> {siteProgress}</div>
                  </div>
                  
                  <h4 style={{ fontSize: '0.9rem', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.2rem' }}>Field Audit Observations</h4>
                  <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{observations}</p>

                  <h4 style={{ fontSize: '0.9rem', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.2rem', marginTop: '1rem' }}>Corrective Action Plan & Directives</h4>
                  <p style={{ whiteSpace: 'pre-wrap', color: '#b45309' }}>{actionItems}</p>
                </div>
              )}

              {/* MATERIAL REQUEST CONTENT */}
              {docType === 'MATERIAL_REQ' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.5rem' }}>Material Requisition Schedule</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '0.5rem' }}>Material Description</th>
                        <th style={{ padding: '0.5rem' }}>Unit</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Requested</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Approved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materialItems.map((m, i) => (
                        <tr key={m.id || i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.5rem', fontWeight: '600' }}>{m.name}</td>
                          <td style={{ padding: '0.5rem', color: '#64748b' }}>{m.unit}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '600' }}>{m.requested}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>{m.approved}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. HANDOVER CERTIFICATE CONTENT */}
              {docType === 'HANDOVER_CERT' && (
                <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  <h4 style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.3rem' }}>1. Practical Completion & Handover Certification</h4>
                  <p>This document certifies that the project <strong>{projectName}</strong> has achieved Practical Completion in accordance with the contract specifications and is hereby handed over to <strong>{partyName}</strong>.</p>
                  
                  <h4 style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.3rem', marginTop: '1rem' }}>2. Defect Liability & Retention Terms</h4>
                  <div><strong>Defect Liability Period:</strong> {defectPeriod}</div>
                  <div><strong>Snag List Status:</strong> {snagStatus}</div>
                  <div><strong>Retention Money Terms:</strong> {retentionRelease}</div>
                </div>
              )}

              {/* 6. DAILY SITE LOG CONTENT */}
              {docType === 'SITE_LOG' && (
                <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f1f5f9', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                    <div><strong>Weather & Temp:</strong> {weather}</div>
                    <div><strong>Workforce Headcount:</strong> {laborForce}</div>
                  </div>

                  <h4 style={{ fontSize: '0.9rem', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.2rem' }}>Heavy Equipment & Machinery Status</h4>
                  <p style={{ color: '#334155' }}>{equipmentStatus}</p>

                  <h4 style={{ fontSize: '0.9rem', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.2rem', marginTop: '1rem' }}>Daily Works & Milestone Accomplishments</h4>
                  <p style={{ whiteSpace: 'pre-wrap', color: '#0f172a' }}>{siteProgress}</p>
                </div>
              )}

              {/* 7. VARIATION ORDER CONTENT */}
              {docType === 'VAR_ORDER' && (
                <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#fef3c7', border: '1px solid #f59e0b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.825rem', color: '#b45309' }}>
                    <div><strong>Variation Order Ref:</strong> {variationRef}</div>
                    <div><strong>Cost Impact:</strong> +{formatAmount(costAdjustment)}</div>
                    <div><strong>Extension of Time:</strong> {timeExtension}</div>
                  </div>

                  <h4 style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.3rem' }}>Justification & Reason for Change</h4>
                  <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{reasonForChange}</p>
                </div>
              )}

              {/* 8. SAFETY INCIDENT CONTENT */}
              {docType === 'SAFETY_INCIDENT' && (
                <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#fee2e2', border: '1px solid #f87171', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.825rem', color: '#991b1b' }}>
                    <div><strong>Incident Category:</strong> {incidentType}</div>
                    <div><strong>Severity Level:</strong> {severity}</div>
                  </div>

                  <h4 style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.3rem' }}>Immediate Corrective Actions & Containment</h4>
                  <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{correctiveAction}</p>

                  <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#475569' }}>
                    <strong>Reporting EHS Officer:</strong> {ehsOfficer}
                  </div>
                </div>
              )}

              {/* 9. PAYMENT CERTIFICATE CONTENT */}
              {docType === 'PAYMENT_CERT' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '0.6rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                    <div><strong>IPC Ref #:</strong> {ipcRef}</div>
                    <div><strong>Valuation Period:</strong> {valuationPeriod}</div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.6rem', fontWeight: '600' }}>Gross Executed Work Value to Date:</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '700' }}>{formatAmount(grossValue)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#b91c1c' }}>
                        <td style={{ padding: '0.6rem' }}>Less: Contract Statutory Retention Deduction (10%):</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: '700' }}>-{formatAmount(retentionAmt)}</td>
                      </tr>
                      <tr style={{ background: '#dcfce7', color: '#15803d', fontWeight: '800' }}>
                        <td style={{ padding: '0.75rem', fontSize: '0.95rem' }}>NET PAYABLE CLAIM AMOUNT:</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '1.05rem' }}>{formatAmount(netPayable)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* 10. SUBCONTRACTOR APPRAISAL CONTENT */}
              {docType === 'SUBCONTRACTOR_EVAL' && (
                <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', background: '#f1f5f9', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                    <div><strong>Trade:</strong> {tradeCategory}</div>
                    <div><strong>Quality Rating:</strong> <span style={{ color: '#15803d', fontWeight: '700' }}>{qualityScore}</span></div>
                    <div><strong>Timeliness:</strong> {timelinessScore}</div>
                  </div>

                  <h4 style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.3rem' }}>Engineering Performance Audit & Recommendation</h4>
                  <p style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{recommendation}</p>
                </div>
              )}

              {/* TERMS & CONDITIONS FOOTER (FOR OPERATIONAL DOCUMENTS ONLY) */}
              {docType !== 'OPEN_LETTER' && (
                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px stroke #cbd5e1', fontSize: '0.75rem', color: '#64748b', whiteSpace: 'pre-wrap' }}>
                  <strong>Field Guidelines & Terms:</strong><br/>
                  {currentTemplate.terms_conditions_text || 'Standard corporate quality, health, and safety protocols apply.'}
                </div>
              )}

              {/* DUAL SIGNATURE BLOCK (FOR OPERATIONAL DOCUMENTS ONLY) */}
              {docType !== 'OPEN_LETTER' && (
                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#475569' }}>
                  <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ borderBottom: '1px solid #0f172a', marginBottom: '0.3rem', height: '30px' }}></div>
                    <div><strong>Prepared / Inspected By:</strong></div>
                    <div>{personInCharge}</div>
                  </div>
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ borderBottom: '1px solid #0f172a', marginBottom: '0.3rem', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sealUrl && (
                        <img 
                          src={sealUrl} 
                          alt="Stamp / Seal" 
                          style={{ height: stampSize || '90px', objectFit: 'contain', opacity: 0.88 }} 
                          onError={(e) => e.target.style.display = 'none'} 
                        />
                      )}
                    </div>
                    <div><strong>Approved By (Sign & Stamp):</strong></div>
                    <div>Project Manager / QA Director</div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
