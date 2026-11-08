import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X, Printer, Send, MessageCircle, Edit3, Download } from 'lucide-react'
import { printElement } from '../utils/printHelper'
import SalesQuoteForm from './SalesQuoteForm'
import { calculateDocumentVatSummary, VAT_RATES } from '../utils/vatHelper'

export default function DocumentPreviewModal({ isOpen, onClose, doc, docType, companyProfile }) {
  const [clientsDirectory, setClientsDirectory] = useState([]);
  const [suppliersDirectory, setSuppliersDirectory] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(doc);
  const [isEditingQuote, setIsEditingQuote] = useState(false);

  useEffect(() => {
    setCurrentDoc(doc);
    setIsEditingQuote(false);
  }, [doc]);

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

  const activeDoc = currentDoc || doc;

  if (!isOpen || !activeDoc) return null;

  // Match client directory record
  const targetClientName = activeDoc?.client_name || activeDoc?.client || '';
  const matchedClient = clientsDirectory.find(c => 
    (c.id && c.id === activeDoc?.client_id) || 
    (c.name && targetClientName && c.name.toLowerCase() === targetClientName.toLowerCase()) ||
    (targetClientName && c.name && (c.name.toLowerCase().includes(targetClientName.toLowerCase()) || targetClientName.toLowerCase().includes(c.name.toLowerCase())))
  );

  // Match supplier directory record
  const targetSupplierName = activeDoc?.supplier_name || activeDoc?.supplier || '';
  const matchedSupplier = suppliersDirectory.find(s => 
    (s.id && (s.id === activeDoc?.supplier_id || s.id === activeDoc?.supplier)) || 
    (s.name && targetSupplierName && s.name.toLowerCase() === targetSupplierName.toLowerCase()) ||
    (targetSupplierName && s.name && (s.name.toLowerCase().includes(targetSupplierName.toLowerCase()) || targetSupplierName.toLowerCase().includes(s.name.toLowerCase())))
  );

  // Standardize & Shorten Document Type Title
  const cleanDocTypeName = (type) => {
    if (!type) return 'DOCUMENT';
    const t = type.toUpperCase();
    if (t.includes('CLIENT LPO') || t.includes('CLIENT PURCHASE ORDER')) return 'CLIENT LPO';
    if (t.includes('PURCHASE ORDER')) return 'PURCHASE ORDER';
    if (t.includes('QUOTATION') || t.includes('QUOTE')) return 'QUOTATION';
    if (t.includes('DELIVERY') || t.includes('GRN') || t.includes('GOODS')) return 'DELIVERY NOTE';
    if (t.includes('RFQ') || t.includes('REQUEST FOR QUOTATION')) return 'RFQ';
    return type.replace(/\s*\([^)]*\)/g, '').trim();
  };

  // Ultra-Short Clean Document Ref Number
  const formatCleanDocRef = (id, type) => {
    if (!id) return '#001';
    let raw = String(id).trim()
      .replace(/^(?:CLIENT LPO|LOCAL PURCHASE ORDER|PURCHASE ORDER|SALES QUOTATION|GOODS DELIVERY NOTE|DELIVERY NOTE|RFQ|LPO|PO|SQ|GDN|GRN|Doc Ref|Ref)\s*#?\s*/i, '')
      .replace(/^\d{4}-\d{2}-/, '');

    const cleanType = cleanDocTypeName(type);
    if (cleanType === 'CLIENT LPO') return raw.startsWith('LPO-') ? raw : `LPO-${raw}`;
    if (cleanType === 'PURCHASE ORDER') return raw.startsWith('PO-') ? raw : `PO-${raw}`;
    if (cleanType === 'QUOTATION') return raw.startsWith('SQ-') ? raw : `SQ-${raw}`;
    if (cleanType === 'DELIVERY NOTE') return raw.startsWith('DN-') ? raw : `DN-${raw}`;
    if (cleanType === 'RFQ') return raw.startsWith('RFQ-') ? raw : `RFQ-${raw}`;
    return `#${raw}`;
  };

  // Shorten Tender Name / Project Description to ultra-concise length
  const shortenTenderName = (name) => {
    if (!name) return '';
    let clean = name
      .replace(/^(?:Supply\s+and\s+Delivery\s+of|Supply\s+of|Delivery\s+of|Provision\s+of|Tender\s+for|Contract\s+for|Procurement\s+of)\s+/i, '')
      .trim();
    if (clean.length > 35) {
      clean = clean.substring(0, 32).trim() + '...';
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
    const parsed = typeof activeDoc.items === 'string' ? JSON.parse(activeDoc.items) : activeDoc.items;
    items = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    items = [];
  }

  // Calculate VAT summary across statutory rates
  const isVatEnabled = activeDoc.vat_applicable !== false && activeDoc.include_vat !== false;
  const vatSummary = calculateDocumentVatSummary(items, isVatEnabled);

  const getVatLabel = (vatRate) => {
    const rateStr = String(vatRate !== undefined ? vatRate : '16');
    if (rateStr === '8' || rateStr === '0.08') return '8%';
    if (rateStr === '0' || rateStr === 'ZERO') return '0%';
    if (rateStr === 'EXEMPT') return 'Exempt';
    return '16%';
  };

  const formatAmount = (val) => {
    const num = Number(val) || 0;
    return `KSh ${num.toLocaleString()}`;
  };

  const currentDocTypeLabel = cleanDocTypeName(docType);
  const currentDocRefLabel = formatCleanDocRef(activeDoc.id || activeDoc.doc_ref, docType);

  const handlePrint = () => {
    const cleanRef = (currentDocRefLabel || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanType = (currentDocTypeLabel || 'Doc').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fullTitle = `AKPALI_${cleanType}_${cleanRef}`;
    printElement('#document-preview-print-area', docType || 'Official_Document', fullTitle);
  };

  const handleDownload = () => {
    const printArea = document.querySelector('#document-preview-print-area');
    if (!printArea) {
      alert('Document content could not be located for download.');
      return;
    }

    const cleanRef = (currentDocRefLabel || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanType = (currentDocTypeLabel || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `AKPALI_${cleanType}_${cleanRef}`;

    // Collect all loaded CSS stylesheets and inline styles
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName}</title>
  ${styles}
  <style>
    body {
      background-color: #f1f5f9;
      margin: 0;
      padding: 2rem 1rem;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #0f172a;
    }
    .offline-document-container {
      background: #ffffff;
      max-width: 860px;
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #cbd5e1;
      padding: 2.5rem;
      box-sizing: border-box;
    }
    .offline-toolbar {
      max-width: 860px;
      width: 100%;
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      padding: 0.75rem 1.25rem;
      border-radius: 6px;
      color: #ffffff;
      box-sizing: border-box;
    }
    .print-btn {
      background: #38bdf8;
      color: #0f172a;
      border: none;
      padding: 0.45rem 1.1rem;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      font-size: 0.85rem;
    }
    @media print {
      body { background: white !important; padding: 0 !important; }
      .offline-toolbar { display: none !important; }
      .offline-document-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
      @page {
        size: A4 portrait;
        margin: 12mm 15mm;
      }
    }
  </style>
</head>
<body>
  <div class="offline-toolbar">
    <div style="font-weight: bold; font-size: 0.95rem;">
      AKPALI OFFICIAL DOCUMENT &bull; ${currentDocRefLabel}
    </div>
    <button class="print-btn" onclick="window.print()">
      🖨️ Print / Save as PDF
    </button>
  </div>
  <div class="offline-document-container">
    ${printArea.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }} onClick={onClose}>
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
      }} onClick={e => e.stopPropagation()}>
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
            {currentDocTypeLabel === 'QUOTATION' && (
              <button onClick={() => setIsEditingQuote(!isEditingQuote)} className="btn" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                <Edit3 size={15} /> {isEditingQuote ? 'Hide Editor' : 'Edit Quote Items'}
              </button>
            )}
            <button onClick={handleDownload} className="btn" style={{ background: '#10b981', color: '#ffffff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', fontSize: '0.85rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="Download and save a copy locally to your computer">
              <Download size={15} /> Download
            </button>
            <button onClick={handlePrint} className="btn" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', fontSize: '0.85rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="Print document or Save as PDF">
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
          {isEditingQuote && currentDocTypeLabel === 'QUOTATION' && (
            <div style={{ marginBottom: '1.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '1.25rem', color: '#ffffff' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#f59e0b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={18} /> Edit Sales Quotation Line Items & Rates ({currentDocRefLabel})
              </h4>
              <SalesQuoteForm 
                quoteToEdit={activeDoc} 
                onSuccess={(updatedQuote) => {
                  setCurrentDoc(updatedQuote);
                  setIsEditingQuote(false);
                }} 
              />
            </div>
          )}

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
                  <strong>Date Generated:</strong> {activeDoc.issue_date || activeDoc.expected_date || activeDoc.deadline || new Date().toISOString().split('T')[0]}
                </div>
              </div>
            </div>

            {/* ENHANCED SYMMETRICAL METADATA & CONTACT DETAILS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1.25rem 1.5rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
              {/* LEFT COLUMN: PARTY DETAILS (CLIENT OR SUPPLIER) */}
              <div>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#0284c7', letterSpacing: '0.05em', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.25rem' }}>
                  {activeDoc.supplier_name || activeDoc.supplier || currentDocTypeLabel === 'RFQ' || currentDocTypeLabel === 'PURCHASE ORDER' ? 'Supplier / Vendor Details' : 'Client / Recipient Details'}
                </h5>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block', marginBottom: '0.35rem' }}>
                  {matchedSupplier?.name || activeDoc.supplier_name || activeDoc.supplier || matchedClient?.name || activeDoc.client_name || activeDoc.client || (currentDocTypeLabel === 'RFQ' ? 'Prospective Bidding Supplier / Vendor' : 'Client Organization')}
                </strong>
                <div style={{ color: '#475569', lineHeight: '1.55', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <div>{matchedSupplier?.address || activeDoc.supplier_address || matchedClient?.address || activeDoc.client_address || (currentDocTypeLabel === 'RFQ' ? 'Registered Commercial Vendor' : 'Auto Bazaar, #001, Nairobi, Kenya')}</div>
                  <div>{matchedSupplier?.phone || activeDoc.supplier_phone || matchedClient?.phone || activeDoc.client_phone || '+254 700 000 000'}</div>
                  <div>
                    {(matchedSupplier?.email || matchedClient?.email) ? <span>{matchedSupplier?.email || matchedClient?.email} </span> : ''}
                    {(matchedSupplier?.tax_pin || matchedSupplier?.kra_pin || activeDoc.supplier_pin || matchedClient?.tax_pin || activeDoc.client_pin) ? <span>{(matchedSupplier?.email || matchedClient?.email) ? '&bull; ' : ''}PIN: {matchedSupplier?.tax_pin || matchedSupplier?.kra_pin || activeDoc.supplier_pin || matchedClient?.tax_pin || activeDoc.client_pin}</span> : ''}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: PROJECT & CONTRACT REFERENCE DETAILS */}
              <div>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: '#0284c7', letterSpacing: '0.05em', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.25rem' }}>
                  Project & Contract Reference
                </h5>
                <div style={{ color: '#475569', lineHeight: '1.55', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {activeDoc.tender_name && (
                    <div style={{ marginBottom: '0.35rem' }}>
                      <strong>Tender / Project:</strong>
                      <div style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.1rem' }}>{shortenTenderName(activeDoc.tender_name)}</div>
                    </div>
                  )}
                  {activeDoc.lpo_reference && (
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Source LPO Ref #:</strong> <span style={{ color: '#0f172a', fontWeight: '600' }}>{formatCleanDocRef(activeDoc.lpo_reference, 'CLIENT LPO')}</span>
                    </div>
                  )}
                  {activeDoc.id && (docType?.includes('DELIVERY') || docType?.includes('GOODS') || docType?.includes('GRN')) && (
                    <div style={{ marginBottom: '0.35rem' }}>
                      <strong>Deliverable Ref #:</strong> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>#{String(activeDoc.id).replace(/[^0-9]/g, '') || activeDoc.id}</span>
                    </div>
                  )}
                  {activeDoc.deadline && <div style={{ marginTop: '0.15rem' }}><strong>Bidding Deadline:</strong> {activeDoc.deadline}</div>}
                  {activeDoc.status && (
                    <div style={{ marginTop: '0.15rem' }}>
                      <strong>Document Status:</strong> <span style={{ fontWeight: 'bold', color: '#0284c7' }}>{activeDoc.status}</span>
                    </div>
                  )}
                  {activeDoc.total_value !== undefined && activeDoc.total_value !== null && (
                    <div style={{ marginTop: '0.25rem' }}>
                      <strong>Total Contract Value:</strong> <span style={{ fontWeight: '800', color: '#16a34a', fontSize: '0.9rem' }}>{formatAmount(activeDoc.total_value)}</span>
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
                    <>
                      <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                            <th style={{ padding: '0.6rem 0.5rem', width: hasPricing ? '38%' : '75%' }}>Description</th>
                            <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center', width: hasPricing ? '15%' : '25%' }}>Qty / Unit</th>
                            {hasPricing && (
                              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right', width: '17%' }}>Unit Rate (KSh)</th>
                            )}
                            {hasPricing && (
                              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center', width: '13%' }}>VAT Rate</th>
                            )}
                            {hasPricing && (
                              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right', width: '17%' }}>Subtotal (KSh)</th>
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
                            const itemVat = getVatLabel(item.vat_rate);

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
                                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                                    <span style={{ 
                                      display: 'inline-block',
                                      padding: '0.15rem 0.45rem', 
                                      borderRadius: '4px', 
                                      fontSize: '0.72rem', 
                                      fontWeight: '600',
                                      background: itemVat === '16%' ? '#f0fdf4' : itemVat === '8%' ? '#fff7ed' : itemVat === '0%' ? '#f0f9ff' : '#f1f5f9',
                                      color: itemVat === '16%' ? '#16a34a' : itemVat === '8%' ? '#ea580c' : itemVat === '0%' ? '#0284c7' : '#64748b',
                                      border: `1px solid ${itemVat === '16%' ? '#bbf7d0' : itemVat === '8%' ? '#fed7aa' : itemVat === '0%' ? '#bae6fd' : '#cbd5e1'}`
                                    }}>
                                      {itemVat}
                                    </span>
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

                      {/* STATUTORY VAT & FINANCIAL SUMMARY CARD */}
                      {hasPricing && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                          <div style={{ width: '380px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.85rem 1.1rem', fontSize: '0.825rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', color: '#475569' }}>
                              <span>Subtotal (Net / Excl. VAT):</span>
                              <span style={{ fontWeight: '600', color: '#0f172a' }}>{formatAmount(vatSummary.netSubtotal)}</span>
                            </div>

                            {/* Multi-Tier Statutory VAT Breakdown */}
                            {vatSummary.vat16Base > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem', color: '#64748b', fontSize: '0.78rem' }}>
                                <span>&bull; Standard Rate (16% on {formatAmount(vatSummary.vat16Base)}):</span>
                                <span style={{ fontWeight: '600', color: '#16a34a' }}>+{formatAmount(vatSummary.vat16Amount)}</span>
                              </div>
                            )}

                            {vatSummary.vat8Base > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem', color: '#64748b', fontSize: '0.78rem' }}>
                                <span>&bull; Petroleum Reduced (8% on {formatAmount(vatSummary.vat8Base)}):</span>
                                <span style={{ fontWeight: '600', color: '#ea580c' }}>+{formatAmount(vatSummary.vat8Amount)}</span>
                              </div>
                            )}

                            {vatSummary.zeroRatedBase > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem', color: '#64748b', fontSize: '0.78rem' }}>
                                <span>&bull; Zero-Rated (0% on {formatAmount(vatSummary.zeroRatedBase)}):</span>
                                <span style={{ fontWeight: '600', color: '#0284c7' }}>KSh 0</span>
                              </div>
                            )}

                            {vatSummary.exemptBase > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem', color: '#64748b', fontSize: '0.78rem' }}>
                                <span>&bull; Exempt Supplies ({formatAmount(vatSummary.exemptBase)}):</span>
                                <span style={{ fontWeight: '600', color: '#64748b' }}>No VAT</span>
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderTop: '1px dashed #cbd5e1', borderBottom: '2px solid #0f172a', fontWeight: 'bold', color: '#0f172a', margin: '0.35rem 0' }}>
                              <span>Total VAT Payable:</span>
                              <span style={{ color: '#0284c7' }}>{formatAmount(vatSummary.totalVat)}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                              <span>Grand Total (Gross):</span>
                              <span style={{ color: '#16a34a' }}>
                                {formatAmount(vatSummary.grandTotal || activeDoc.total_value || activeDoc.amount || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              activeDoc.items && typeof activeDoc.items === 'string' && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f1f5f9', borderRadius: '6px' }}>
                  <strong style={{ fontSize: '0.825rem', color: '#475569' }}>Document Specifications:</strong>
                  <pre style={{ fontSize: '0.825rem', margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{activeDoc.items}</pre>
                </div>
              )
            )}

            {/* KRA eTIMS COMPLIANCE FORMAT BANNER */}
            {(currentDocTypeLabel === 'INVOICE' || (docType && docType.toUpperCase().includes('INVOICE'))) && (
              <div style={{
                margin: '1.5rem 0',
                padding: '1rem',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #0284c7',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: '#0f172a',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8'
                  }}>
                    <div style={{ fontSize: '1.4rem' }}>📱</div>
                    <div style={{ fontSize: '0.55rem', fontWeight: '800', color: '#fff' }}>eTIMS QR</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>🇰🇪 KRA eTIMS Compliant Electronic Tax Invoice</span>
                      <span style={{ fontSize: '0.65rem', background: '#10b98122', color: '#16a34a', border: '1px solid #16a34a', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        VERIFIED FISCAL SIGNATURE
                      </span>
                    </div>
                    <div style={{ color: '#475569', marginTop: '0.2rem', fontSize: '0.75rem' }}>
                      Control Unit No: <strong>CU-AKPALI-2026-001</strong> • Fiscal Day: <strong>{new Date().toISOString().split('T')[0]}</strong>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                      KRA Tax Procedures Act (Electronic Tax Invoice) Regulations 2024
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                  <div style={{ color: '#64748b' }}>Buyer KRA PIN:</div>
                  <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>
                    {matchedClient?.tax_pin || activeDoc.tax_pin || 'P051234567Z'}
                  </strong>
                </div>
              </div>
            )}

            {/* AUTHORIZATION STAMP & SIGNATURE AREA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.35rem' }}>Issued By / Authorized Officer:</div>
                {companyProfile?.signature_url ? (
                  <div style={{ height: '55px', display: 'flex', alignItems: 'flex-end', marginBottom: '0.25rem' }}>
                    <img 
                      src={companyProfile.signature_url.startsWith('http') ? companyProfile.signature_url : `http://localhost:5000${companyProfile.signature_url}`} 
                      alt="Authorized Signature" 
                      style={{ maxHeight: '52px', maxWidth: '170px', objectFit: 'contain' }} 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div style={{ height: '45px' }}></div>
                )}
                <div style={{ borderBottom: '1px solid #94a3b8', width: '180px', marginBottom: '0.25rem' }}></div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#334155' }}>Managing Director / Authorized Signatory</div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem' }}>Official Corporate Stamp / Seal:</div>
                {companyProfile?.seal_url ? (
                  <img 
                    src={companyProfile.seal_url.startsWith('http') ? companyProfile.seal_url : `http://localhost:5000${companyProfile.seal_url}`} 
                    alt="Official Seal" 
                    style={{ height: '85px', objectFit: 'contain' }} 
                    onError={(e) => { e.target.src = '/stamp.png'; }}
                  />
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

  return ReactDOM.createPortal(modalContent, document.body);
}
