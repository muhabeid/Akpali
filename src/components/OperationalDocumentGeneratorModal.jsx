import React, { useState } from 'react'
import { FileText, Printer, CheckCircle2, AlertTriangle, XCircle, Plus, Trash2 } from 'lucide-react'
import { printElement } from '../utils/printHelper'

export default function OperationalDocumentGeneratorModal({ onClose, documentTemplates = {} }) {
  const [docType, setDocType] = useState('CONTRACT') // 'CONTRACT', 'INSPECTION', 'SITE_VISIT', 'MATERIAL_REQ'
  
  // Generic Common Fields
  const [title, setTitle] = useState('Master Service Agreement')
  const [projectName, setProjectName] = useState('Nairobi Data Center Expansion')
  const [partyName, setPartyName] = useState('Acme Corporation Ltd')
  const [personInCharge, setPersonInCharge] = useState('Eng. John Akpali')
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0])

  // Custom Specific Fields
  // Inspection Checklist
  const [checklist, setChecklist] = useState([
    { id: 1, item: 'Reinforcement Steel Bar Diameter & Grade Verification', status: 'Passed', notes: 'Grade 500B verified.' },
    { id: 2, item: 'Concrete Slump & Cube Strength Test Samples', status: 'Passed', notes: '7-day test passed.' },
    { id: 3, item: 'MEP Conduit Routing & Wall Chasing Inspection', status: 'Needs Action', notes: 'Chasing depth requires 10mm correction.' }
  ])

  // Site Visit Details
  const [weather, setWeather] = useState('Clear / Dry')
  const [siteProgress, setSiteProgress] = useState('75% Completed')
  const [observations, setObservations] = useState('Main structural column casting complete. MEP first-fix in progress. Subcontractor workforce on site is 18 personnel.')
  const [actionItems, setActionItems] = useState('1. Contractor to complete plastering of East Wing by Friday.\n2. Submit structural engineer sign-off certificate.')

  // Material Requisition Line Items
  const [materialItems, setMaterialItems] = useState([
    { id: 1, name: 'TMT Steel Bars 12mm (12m length)', unit: 'Pcs', requested: 150, approved: 150 },
    { id: 2, name: 'Ordinary Portland Cement (50kg Bags)', unit: 'Bags', requested: 200, approved: 200 },
    { id: 3, name: 'PVC Electrical Conduit Pipes 25mm', unit: 'Pcs', requested: 80, approved: 80 }
  ])

  // Contract Specific
  const [contractValue, setContractValue] = useState('150000')
  const [contractDuration, setContractDuration] = useState('12 Months (Renewable)')
  const [contractScope, setContractScope] = useState('The Contractor shall provide complete civil works, structural construction, and MEP installation as per approved architectural blueprints.')

  // Update defaults when docType changes
  const handleDocTypeChange = (type) => {
    setDocType(type)
    if (type === 'CONTRACT') {
      setTitle('Master Construction & Service Agreement')
    } else if (type === 'INSPECTION') {
      setTitle('Site Material & Quality Inspection Form')
    } else if (type === 'SITE_VISIT') {
      setTitle('Technical Site Visit & Engineering Progress Report')
    } else if (type === 'MATERIAL_REQ') {
      setTitle('Site Material Requisition & Store Issuance Form')
    }
  }

  const currentTemplate = documentTemplates[docType] || {}

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '1.5rem' }}>
      <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '1000px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        
        {/* MODAL HEADER */}
        <div style={{ background: '#0f172a', color: '#ffffff', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText color="#38bdf8" size={24} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Operational Document & Template Generator</h3>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Generate printable A4 Contracts, Inspection Forms, Site Reports, and Requisitions</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer', fontWeight: '700' }}>✕</button>
        </div>

        {/* MODAL BODY (TWO PANELS: FORM vs LIVE A4 PREVIEW) */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '420px 1fr', overflow: 'hidden', background: '#f8fafc' }}>
          
          {/* LEFT PANEL: INPUT FORM */}
          <div style={{ padding: '1.25rem', borderRight: '1px solid #cbd5e1', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Document Template Type *</label>
              <select className="form-control" style={{ fontWeight: '600', borderColor: 'hsl(var(--primary))' }} value={docType} onChange={e => handleDocTypeChange(e.target.value)}>
                <option value="CONTRACT">📜 Contract Agreement Template</option>
                <option value="INSPECTION">🔍 Inspection Form (QA/QC)</option>
                <option value="SITE_VISIT">🏗️ Site Visit & Progress Report</option>
                <option value="MATERIAL_REQ">📦 Material Request Form</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>Document Title</label>
              <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} />
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
              
              {/* HEADER BANNER */}
              <div style={{ borderBottom: '3px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>AKPALI ENTERPRISES & CONTRACTORS LTD</h1>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>Akpali Plaza, Upper Hill Road, Nairobi &bull; Email: info@akpali.com &bull; Tel: +254 712 345 678</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', background: '#f1f5f9', padding: '0.5rem 0.8rem', borderRadius: '6px' }}>
                  <div><strong>Doc Ref #:</strong> {docType}-{Math.floor(Math.random() * 9000 + 1000)}</div>
                  <div><strong>Date:</strong> {docDate}</div>
                </div>
              </div>

              {/* DOCUMENT TITLE */}
              <div style={{ background: '#0f172a', color: '#ffffff', padding: '0.6rem 1rem', textAlign: 'center', borderRadius: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', fontSize: '1rem' }}>
                {title || currentTemplate.header_text}
              </div>

              {/* METADATA SUMMARY GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
                <div><strong>Project / Site Name:</strong> {projectName}</div>
                <div><strong>Counterparty / Client:</strong> {partyName}</div>
                <div><strong>Issued / Inspected By:</strong> {personInCharge}</div>
                <div><strong>Date Executed:</strong> {docDate}</div>
              </div>

              {/* CONTRACT SPECIFIC CONTENT */}
              {docType === 'CONTRACT' && (
                <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  <h4 style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.3rem' }}>1. Scope of Work & Services</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{contractScope}</p>
                  
                  <h4 style={{ color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.3rem', marginTop: '1rem' }}>2. Financial Consideration & Duration</h4>
                  <div><strong>Contract Value:</strong> USD ${Number(contractValue).toLocaleString()}</div>
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

              {/* TERMS & CONDITIONS FOOTER */}
              <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px stroke #cbd5e1', fontSize: '0.75rem', color: '#64748b', whiteSpace: 'pre-wrap' }}>
                <strong>Field Guidelines & Terms:</strong><br/>
                {currentTemplate.terms_conditions_text || 'Standard corporate quality, health, and safety protocols apply.'}
              </div>

              {/* SIGNATURE BLOCK */}
              <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#475569' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ borderBottom: '1px solid #0f172a', marginBottom: '0.3rem', height: '30px' }}></div>
                  <div><strong>Prepared / Inspected By:</strong></div>
                  <div>{personInCharge}</div>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ borderBottom: '1px solid #0f172a', marginBottom: '0.3rem', height: '30px' }}></div>
                  <div><strong>Approved By (Sign & Stamp):</strong></div>
                  <div>Project Manager / QA Director</div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
