import React, { useState, useEffect } from 'react'
import { X, Printer, Send, MessageCircle } from 'lucide-react'
import { printElement } from '../utils/printHelper'

export default function DocumentPreviewModal({ isOpen, onClose, doc, docType, companyProfile }) {
  const [clientsDirectory, setClientsDirectory] = useState([]);
  const [suppliersDirectory, setSuppliersDirectory] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetch('http://localhost:5000/api/clients')
        .then(res => res.json())
        .then(data => setClientsDirectory(Array.isArray(data) ? data : []))
        .catch(() => setClientsDirectory([]));

      fetch('http://localhost:5000/api/suppliers')
        .then(res => res.json())
        .then(data => setSuppliersDirectory(Array.isArray(data) ? data : []))
        .catch(() => setSuppliersDirectory([]));
    }
  }, [isOpen]);

  if (!isOpen || !doc) return null;

  const handlePrint = () => {
    printElement('#document-preview-print-area', docType || 'Official_Document');
  };

  // Match client directory record
  const targetClientName = doc.client_name || doc.client || '';
  const matchedClient = clientsDirectory.find(c => 
    (c.id && c.id === doc.client_id) || 
    (c.name && targetClientName && c.name.toLowerCase() === targetClientName.toLowerCase()) ||
    (targetClientName && c.name && (c.name.toLowerCase().includes(targetClientName.toLowerCase()) || targetClientName.toLowerCase().includes(c.name.toLowerCase())))
  );

  // Standardize & Clean Document Type Title
  const cleanDocTypeName = (type) => {
    if (!type) return 'OFFICIAL ERP DOCUMENT';
    const t = type.toUpperCase();
    if (t.includes('CLIENT LPO') || t.includes('CLIENT PURCHASE ORDER')) return 'CLIENT LPO';
    if (t.includes('PURCHASE ORDER')) return 'PURCHASE ORDER';
    if (t.includes('QUOTATION') || t.includes('QUOTE')) return 'SALES QUOTATION';
    if (t.includes('DELIVERY') || t.includes('GRN') || t.includes('GOODS')) return 'GOODS DELIVERY NOTE';
    if (t.includes('RFQ') || t.includes('REQUEST FOR QUOTATION')) return 'REQUEST FOR QUOTATION';
    return type.replace(/\s*\([^)]*\)/g, '').trim();
  };

  // Clean Document Ref to prevent duplicate "LPO #LPO-..." prefixes
  const formatCleanDocRef = (id, type) => {
    if (!id) return 'DOC-001';
    let raw = String(id).trim().replace(/^(?:LPO|PO|SQ|RFQ|GDN|GRN|Doc Ref|Ref)\s*#?\s*/i, '');
    const cleanType = cleanDocTypeName(type);
    if (cleanType === 'CLIENT LPO') return raw.startsWith('LPO-') ? raw : `LPO-${raw}`;
    if (cleanType === 'PURCHASE ORDER') return raw.startsWith('PO-') ? raw : `PO-${raw}`;
    if (cleanType === 'SALES QUOTATION') return raw.startsWith('SQ-') ? raw : `SQ-${raw}`;
    if (cleanType === 'GOODS DELIVERY NOTE') return raw.startsWith('GDN-') ? raw : `GDN-${raw}`;
    return raw;
  };

  // Shorten long Tender Name / Description to avoid bloated titles
  const shortenTenderName = (name) => {
    if (!name) return '';
    let clean = name
      .replace(/^(?:Supply\s+and\s+Delivery\s+of|Supply\s+of|Delivery\s+of|Provision\s+of|Tender\s+for|Contract\s+for)\s+/i, '')
      .trim();
    if (clean.length > 55) {
      clean = clean.substring(0, 52).trim() + '...';
    }
    return clean ? (clean.charAt(0).toUpperCase() + clean.slice(1)) : name;
  };

  // Dynamic Item Schedule Title
  const getScheduleTitle = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('DELIVERY') || t.includes('GRN') || t.includes('GOODS')) return 'Goods & Deliverables Schedule';
    if (t.includes('PURCHASE ORDER') || t.includes('LPO')) return 'Order Items & Quantities Schedule';
    if (t.includes('QUOTATION') || t.includes('RFQ') || t.includes('QUOTE')) return 'Quoted Items & Specifications Schedule';
    return 'Document Line Items Schedule';
  };

  // Parse items safely
  let items = [];
  try {
    const parsed = typeof doc.items === 'string' ? JSON.parse(doc.items) : doc.items;
    items = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    items = [];
  }

  const formatAmount = (val) => {
    const num = Number(val) || 0;
    return `KSh ${num.toLocaleString()}`;
  };

  const currentDocTypeLabel = cleanDocTypeName(docType);
  const currentDocRefLabel = formatCleanDocRef(doc.id || doc.doc_ref, docType);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '880px',
        maxHeight: '92vh',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #cbd5e1'
      }}>
        {/* MODAL ACTION HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.5rem',
          background: '#0f172a',
          color: '#ffffff'
        }}>
          <div>
            <div style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.05em' }}>
              {currentDocTypeLabel} Quick Preview
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38bdf8' }}>
              {currentDocRefLabel}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={handlePrint} className="btn" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', fontSize: '0.85rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              <Printer size={15} /> Print / PDF
            </button>
            <button onClick={() => alert(`Dispatching ${currentDocRefLabel} via Email...`)} className="btn" style={{ background: 'hsla(217, 91%, 60%, 0.2)', color: '#60a5fa', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer' }}>
              <Send size={15} /> Email
            </button>
            <button onClick={() => alert(`Dispatching ${currentDocRefLabel} via WhatsApp...`)} className="btn" style={{ background: 'hsla(142, 71%, 45%, 0.2)', color: '#4ade80', border: '1px solid #22c55e', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer' }}>
              <MessageCircle size={15} /> WhatsApp
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', marginLeft: '0.5rem' }}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* MODAL BODY PREVIEW AREA */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', background: '#f8fafc', flex: 1 }}>
          <div id="document-preview-print-area" style={{ background: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: '#0f172a' }}>
            
            {/* CORPORATE LETTERHEAD */}
            <div style={{ borderBottom: '2px solid #cbd5e1', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', marginBottom: '0.85rem' }}>
                <img 
                  src={companyProfile?.logo_url || '/logo.png'} 
                  alt="Company Logo" 
                  style={{ height: '110px', maxWidth: '280px', objectFit: 'contain' }} 
                  onError={(e) => e.target.style.display = 'none'} 
                />
                <h2 style={{ margin: '0.2rem 0 0 0', color: '#0f172a', fontSize: '1.35rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {companyProfile?.legal_name || companyProfile?.trading_name || 'AKPALI COMPANY LIMITED'}
                </h2>
                <div style={{ fontSize: '0.825rem', color: '#475569', lineHeight: '1.4' }}>
                  <div>{companyProfile?.postal_address || companyProfile?.address || 'Auto Bazaar, #001, Nairobi, Kenya'}</div>
                  <div style={{ fontWeight: '500' }}>
                    Tel: {companyProfile?.phone || '+254705365996'} &bull; Email: {companyProfile?.email || 'info@akpalimited.co.ke'} &bull; KRA PIN: {companyProfile?.tax_pin || 'P051234567Z'}
                  </div>
                </div>

                {/* CENTERED DOCUMENT TITLE (BELOW TEL & EMAIL, OUTSIDE PLACEHOLDER) */}
                <div style={{ marginTop: '0.75rem', marginBottom: '0.15rem' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #0f172a', display: 'inline-block', paddingBottom: '2px' }}>
                    {currentDocTypeLabel}
                  </h3>
                </div>
              </div>

              {/* PLACEHOLDER CONTAINER (DOC REF AT LEFT END, DATE AT RIGHT END) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem', color: '#334155' }}>
                <div>
                  <strong>Doc Ref #:</strong> {currentDocRefLabel}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Date Generated:</strong> {doc.issue_date || doc.expected_date || doc.deadline || new Date().toISOString().split('T')[0]}
                </div>
              </div>
            </div>

            {/* ENHANCED SYMMETRICAL METADATA & CONTACT DETAILS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1.25rem 1.5rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
              {/* LEFT COLUMN: PARTY DETAILS (CLIENT OR SUPPLIER) */}
              <div>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#0284c7', letterSpacing: '0.05em', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.25rem' }}>
                  {doc.supplier_name || doc.supplier ? 'Supplier / Vendor Details' : 'Client / Recipient Details'}
                </h5>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block', marginBottom: '0.35rem' }}>
                  {matchedClient?.name || doc.client_name || doc.client || matchedSupplier?.name || doc.supplier_name || doc.supplier || 'Client Organization'}
                </strong>
                <div style={{ color: '#475569', lineHeight: '1.55', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <div>{matchedClient?.address || matchedSupplier?.address || doc.client_address || doc.supplier_address || 'Auto Bazaar, #001, Nairobi, Kenya'}</div>
                  <div>{matchedClient?.phone || matchedSupplier?.phone || doc.client_phone || doc.supplier_phone || '+254 700 000 000'}</div>
                  <div>
                    {(matchedClient?.email || matchedSupplier?.email) ? <span>{matchedClient?.email || matchedSupplier?.email} </span> : ''}
                    {(matchedClient?.tax_pin || matchedSupplier?.tax_pin || matchedSupplier?.kra_pin || doc.client_pin || doc.supplier_pin) ? <span>{(matchedClient?.email || matchedSupplier?.email) ? '&bull; ' : ''}PIN: {matchedClient?.tax_pin || matchedSupplier?.tax_pin || matchedSupplier?.kra_pin || doc.client_pin || doc.supplier_pin}</span> : ''}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: PROJECT & CONTRACT REFERENCE DETAILS */}
              <div>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#0284c7', letterSpacing: '0.05em', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.25rem' }}>
                  Project & Contract Reference
                </h5>
                <div style={{ color: '#475569', lineHeight: '1.55', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {doc.tender_name && (
                    <div style={{ marginBottom: '0.35rem' }}>
                      <strong>Tender / Project:</strong>
                      <div style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.1rem' }}>{shortenTenderName(doc.tender_name)}</div>
                    </div>
                  )}
                  {doc.lpo_reference && (
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Source LPO Ref #:</strong> <span style={{ color: '#0f172a', fontWeight: '600' }}>{formatCleanDocRef(doc.lpo_reference, 'CLIENT LPO')}</span>
                    </div>
                  )}
                  {doc.id && (docType?.includes('DELIVERY') || docType?.includes('GOODS') || docType?.includes('GRN')) && (
                    <div style={{ marginBottom: '0.35rem' }}>
                      <strong>Deliverable Ref #:</strong> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>#{String(doc.id).replace(/[^0-9]/g, '') || doc.id}</span>
                    </div>
                  )}
                  {doc.deadline && <div style={{ marginTop: '0.15rem' }}><strong>Bidding Deadline:</strong> {doc.deadline}</div>}
                  {doc.status && (
                    <div style={{ marginTop: '0.15rem' }}>
                      <strong>Document Status:</strong> <span style={{ fontWeight: 'bold', color: '#0284c7' }}>{doc.status}</span>
                    </div>
                  )}
                  {doc.total_value !== undefined && doc.total_value !== null && (
                    <div style={{ marginTop: '0.25rem' }}>
                      <strong>Total Contract Value:</strong> <span style={{ fontWeight: '800', color: '#16a34a', fontSize: '0.9rem' }}>{formatAmount(doc.total_value)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LINE ITEMS TABLE */}
            {items.length > 0 ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', textTransform: 'uppercase', color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>
                  {getScheduleTitle(docType)}
                </h4>
                {(() => {
                  const hasPricing = items.some(i => i.unitPrice !== undefined || i.price !== undefined);
                  return (
                    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                          <th style={{ padding: '0.6rem 0.5rem', width: hasPricing ? '46%' : '75%' }}>Description</th>
                          <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center', width: hasPricing ? '18%' : '25%' }}>Qty / Unit</th>
                          {hasPricing && (
                            <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right', width: '18%' }}>Unit Rate (KSh)</th>
                          )}
                          {hasPricing && (
                            <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right', width: '18%' }}>Subtotal (KSh)</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const desc = item.desc || item.description || item.name || '-';
                          const qty = item.qty || item.quantity || '';
                          const unit = item.unit || 'PCS';
                          const unitPrice = item.unitPrice !== undefined ? item.unitPrice : item.price;
                          const hasPrice = unitPrice !== undefined;
                          const subtotal = hasPrice ? (Number(qty || 1) * Number(unitPrice)) : 0;

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '0.6rem 0.5rem', wordBreak: 'break-word' }}>{desc}</td>
                              <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
                                {qty ? `${qty} ${unit}` : unit}
                              </td>
                              {hasPricing && (
                                <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>
                                  {hasPrice ? formatAmount(unitPrice) : '-'}
                                </td>
                              )}
                              {hasPricing && (
                                <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                                  {hasPrice ? formatAmount(subtotal) : '-'}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            ) : (
              doc.items && typeof doc.items === 'string' && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f1f5f9', borderRadius: '6px' }}>
                  <strong style={{ fontSize: '0.825rem', color: '#475569' }}>Document Specifications:</strong>
                  <pre style={{ fontSize: '0.825rem', margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{doc.items}</pre>
                </div>
              )
            )}

            {/* AUTHORIZATION STAMP & SIGNATURE AREA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1.5rem' }}>Issued By / Authorized Officer:</div>
                <div style={{ borderBottom: '1px solid #94a3b8', width: '180px', marginBottom: '0.25rem' }}></div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#334155' }}>Head of Procurement / Contracts</div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem' }}>Official Corporate Stamp / Seal:</div>
                {companyProfile?.seal_url ? (
                  <img src={companyProfile.seal_url} alt="Official Seal" style={{ height: '85px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ border: '2px dashed #cbd5e1', padding: '0.75rem 1.25rem', borderRadius: '50%', color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    AKPALI CO. LTD<br />SEAL HERE
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Akpali Enterprise ERP &bull; Official Document Preview
          </div>
          <button onClick={onClose} className="btn" style={{ padding: '0.4rem 1.25rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
}
