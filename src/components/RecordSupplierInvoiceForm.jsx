import React, { useState, useEffect } from 'react';
import { FileSearch, PackageCheck, FileText, Check, AlertCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { VAT_RATES, calculateDocumentVatSummary } from '../utils/vatHelper';

export default function RecordSupplierInvoiceForm() {
  const { formatAmount } = useCurrency();
  const [sourceType, setSourceType] = useState('lpo'); // 'lpo' | 'delivery' | 'manual'
  const [pos, setPos] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: `INV-2026-${Math.floor(Math.random() * 10000)}`,
    po_id: '',
    delivery_id: '',
    supplier_name: '',
    invoice_date: new Date().toISOString().split('T')[0],
    subtotal: 0,
    include_vat: true,
    vat_amount: 0,
    amount: 0,
    items: []
  });

  const [vatSummary, setVatSummary] = useState({
    netSubtotal: 0,
    vat16Base: 0,
    vat16Amount: 0,
    vat8Base: 0,
    vat8Amount: 0,
    zeroRatedBase: 0,
    exemptBase: 0,
    totalVat: 0,
    grandTotal: 0
  });

  useEffect(() => {
    // Load POs/LPOs and Deliveries (GRNs)
    Promise.all([
      fetch('http://localhost:5000/api/pos').then(res => res.json()).catch(() => []),
      fetch('http://localhost:5000/api/evidence').then(res => res.json()).catch(() => [])
    ]).then(([poData, evData]) => {
      setPos(Array.isArray(poData) ? poData : []);
      setDeliveries(Array.isArray(evData) ? evData : []);
    });
  }, []);

  // Recalculate Subtotal, VAT, and Grand Total whenever items or include_vat changes
  const updateAmounts = (itemsList, includeVat) => {
    const summary = calculateDocumentVatSummary(
      itemsList.map(i => ({
        qty: Number(i.qty || 1),
        unitPrice: Number(i.unit_price || 0),
        vat_rate: i.vat_rate !== undefined ? String(i.vat_rate) : '16'
      })),
      includeVat
    );

    setVatSummary(summary);
    setFormData(prev => ({
      ...prev,
      items: itemsList,
      subtotal: summary.netSubtotal,
      include_vat: includeVat,
      vat_amount: summary.totalVat,
      amount: summary.grandTotal
    }));
  };

  // Handle LPO / PO Selection
  const handlePOSelect = (e) => {
    const poId = e.target.value;
    const po = pos.find(p => p.id === poId);

    if (po) {
      // Extract items or fallback to single line if no items array exists
      let extractedItems = [];
      if (Array.isArray(po.items) && po.items.length > 0) {
        extractedItems = po.items.map(i => ({
          description: i.description || i.item_name || i.desc || 'Supplies',
          qty: Number(i.quantity || i.qty || 1),
          unit_price: Number(i.unit_price || i.price || i.unitPrice || (po.total_value / (i.quantity || 1))),
          total: Number(i.total || (i.quantity * i.unit_price) || po.total_value),
          vat_rate: i.vat_rate !== undefined ? String(i.vat_rate) : '16'
        }));
      } else {
        extractedItems = [
          {
            description: `Supplies for LPO/PO ${po.id}`,
            qty: 1,
            unit_price: Number(po.total_value || 0),
            total: Number(po.total_value || 0),
            vat_rate: '16'
          }
        ];
      }

      setFormData(prev => ({
        ...prev,
        po_id: poId,
        delivery_id: '',
        supplier_name: po.supplier_name || 'Supplier'
      }));

      updateAmounts(extractedItems, formData.include_vat);
    } else {
      setFormData(prev => ({ ...prev, po_id: '', supplier_name: '' }));
      updateAmounts([], formData.include_vat);
    }
  };

  // Handle Delivery / GRN Selection
  const handleDeliverySelect = (e) => {
    const delId = e.target.value;
    const del = deliveries.find(d => d.id === delId);

    if (del) {
      const extractedItems = [
        {
          description: del.deliverable_name || `Delivered items for ${del.tender_name || 'Tender'}`,
          qty: 1,
          unit_price: Number(del.revenue_generated || 0),
          total: Number(del.revenue_generated || 0),
          vat_rate: '16'
        }
      ];

      setFormData(prev => ({
        ...prev,
        delivery_id: delId,
        po_id: '',
        supplier_name: del.client_name || del.tender_name || 'Site Vendor'
      }));

      updateAmounts(extractedItems, formData.include_vat);
    } else {
      setFormData(prev => ({ ...prev, delivery_id: '', supplier_name: '' }));
      updateAmounts([], formData.include_vat);
    }
  };

  const handleVatToggle = (e) => {
    const checked = e.target.checked;
    updateAmounts(formData.items, checked);
  };

  const handleItemChange = (idx, field, val) => {
    const newItems = [...formData.items];
    newItems[idx][field] = val;
    if (field === 'qty' || field === 'unit_price') {
      const qty = Number(newItems[idx].qty) || 0;
      const price = Number(newItems[idx].unit_price) || 0;
      newItems[idx].total = qty * price;
    }
    updateAmounts(newItems, formData.include_vat);
  };

  const handleAddLineItem = () => {
    const newItems = [...formData.items, { description: '', qty: 1, unit_price: 0, total: 0, vat_rate: '16' }];
    updateAmounts(newItems, formData.include_vat);
  };

  const handleRemoveLineItem = (idx) => {
    const newItems = formData.items.filter((_, i) => i !== idx);
    updateAmounts(newItems, formData.include_vat);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      id: formData.id,
      po_id: formData.po_id || null,
      delivery_id: formData.delivery_id || null,
      supplier_name: formData.supplier_name,
      amount: formData.amount,
      subtotal: formData.subtotal,
      vat_amount: formData.vat_amount,
      include_vat: formData.include_vat,
      invoice_date: formData.invoice_date,
      items: formData.items
    };

    try {
      const res = await fetch('http://localhost:5000/api/supplier_invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`✅ Supplier Invoice '${formData.id}' recorded successfully! 3-Way Match Audit Updated.`);
        window.location.reload();
      } else {
        const err = await res.json();
        alert('Failed to record invoice: ' + (err.error || 'Server error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error recording supplier invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* SOURCE SELECTION */}
      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
          Select Verification & Source Document:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => { setSourceType('lpo'); updateAmounts([], formData.include_vat); }}
            style={{
              padding: '0.6rem',
              borderRadius: '6px',
              border: sourceType === 'lpo' ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
              background: sourceType === 'lpo' ? 'hsla(var(--primary), 0.12)' : 'transparent',
              color: sourceType === 'lpo' ? 'hsl(var(--primary))' : 'inherit',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            📋 Purchase Order (PO)
          </button>
          
          <button
            type="button"
            onClick={() => { setSourceType('delivery'); updateAmounts([], formData.include_vat); }}
            style={{
              padding: '0.6rem',
              borderRadius: '6px',
              border: sourceType === 'delivery' ? '2px solid #10b981' : '1px solid hsl(var(--border))',
              background: sourceType === 'delivery' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              color: sourceType === 'delivery' ? '#10b981' : 'inherit',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            🚚 Site Delivery Note (GRN)
          </button>

          <button
            type="button"
            onClick={() => { setSourceType('manual'); updateAmounts([], formData.include_vat); }}
            style={{
              padding: '0.6rem',
              borderRadius: '6px',
              border: sourceType === 'manual' ? '2px solid #f59e0b' : '1px solid hsl(var(--border))',
              background: sourceType === 'manual' ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
              color: sourceType === 'manual' ? '#f59e0b' : 'inherit',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            ✍️ Manual / Direct Entry
          </button>
        </div>
      </div>

      {sourceType === 'lpo' && (
        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Select Supplier Purchase Order (PO) *</label>
          <select className="form-control" required value={formData.po_id} onChange={handlePOSelect}>
            <option value="">Select a Purchase Order to match...</option>
            {pos.map(po => (
              <option key={po.id} value={po.id}>
                {po.id} - {po.supplier_name} ({formatAmount(po.total_value)})
              </option>
            ))}
          </select>
        </div>
      )}

      {sourceType === 'delivery' && (
        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Select Goods Received Note (GRN) / Delivery *</label>
          <select className="form-control" required value={formData.delivery_id} onChange={handleDeliverySelect}>
            <option value="">Select an approved site delivery...</option>
            {deliveries.map(del => (
              <option key={del.id} value={del.id}>
                {del.id} - {del.deliverable_name} ({formatAmount(del.revenue_generated)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* METADATA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Supplier Invoice #</label>
          <input type="text" className="form-control" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} required />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Supplier / Vendor Name *</label>
          <input type="text" className="form-control" required value={formData.supplier_name} onChange={e => setFormData({...formData, supplier_name: e.target.value})} />
        </div>
      </div>

      {/* INVOICE LINE ITEMS TABLE */}
      <div style={{ background: '#0f172a11', padding: '1rem', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <strong style={{ fontSize: '0.85rem', color: 'hsl(var(--primary))' }}>📦 Invoiced Line Items ({formData.items.length})</strong>
          <button type="button" className="btn" style={{ fontSize: '0.75rem', background: 'hsl(var(--primary))', color: '#fff', padding: '0.3rem 0.6rem' }} onClick={handleAddLineItem}>
            + Add Line Item
          </button>
        </div>

        {formData.items.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
            No line items loaded. Select an LPO / Delivery above or click "+ Add Line Item".
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))', textAlign: 'left', color: 'hsl(var(--text-secondary))' }}>
                <th style={{ padding: '0.4rem' }}>Item Description</th>
                <th style={{ padding: '0.4rem', width: '65px' }}>Qty</th>
                <th style={{ padding: '0.4rem', width: '95px' }}>Unit Price</th>
                <th style={{ padding: '0.4rem', width: '130px' }}>VAT Rate</th>
                <th style={{ padding: '0.4rem', width: '100px', textAlign: 'right' }}>Total (KSh)</th>
                <th style={{ padding: '0.4rem', width: '35px' }}></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid hsla(var(--border), 0.4)' }}>
                  <td style={{ padding: '0.4rem' }}>
                    <input type="text" className="form-control" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }} value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} placeholder="Item description..." required />
                  </td>
                  <td style={{ padding: '0.4rem' }}>
                    <input type="number" min="1" className="form-control" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }} value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} required />
                  </td>
                  <td style={{ padding: '0.4rem' }}>
                    <input type="number" step="0.01" min="0" className="form-control" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }} value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} required />
                  </td>
                  <td style={{ padding: '0.4rem' }}>
                    <select
                      className="form-control"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.4rem' }}
                      value={item.vat_rate || '16'}
                      onChange={e => handleItemChange(idx, 'vat_rate', e.target.value)}
                    >
                      {VAT_RATES.map(v => (
                        <option key={v.id} value={v.id}>{v.shortLabel} - {v.label.split(' ')[0]}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 'bold' }}>
                    {formatAmount(item.total || 0)}
                  </td>
                  <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                    <button type="button" style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '1rem' }} onClick={() => handleRemoveLineItem(idx)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* AUTO-CALCULATED STATUTORY VAT BREAKDOWN BOX */}
      <div style={{ background: '#0f172a', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #334155', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={formData.include_vat} 
            onChange={handleVatToggle}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'hsl(var(--primary))' }}
          />
          <span style={{ color: '#38bdf8' }}>Enable Statutory Input VAT Claim (KRA Tax Deductible)</span>
        </label>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#94a3b8', borderTop: '1px solid #334155', paddingTop: '0.5rem' }}>
          <span>Invoice Subtotal (Exclusive of VAT):</span>
          <span style={{ fontWeight: '600', color: '#e2e8f0' }}>{formatAmount(vatSummary.netSubtotal)}</span>
        </div>

        {formData.include_vat && vatSummary.vat16Base > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#38bdf8', paddingLeft: '0.75rem', borderLeft: '2px solid #0284c7' }}>
            <span>Standard Rate VAT (16% on {formatAmount(vatSummary.vat16Base)}):</span>
            <span style={{ fontWeight: '600' }}>{formatAmount(vatSummary.vat16Amount)}</span>
          </div>
        )}

        {formData.include_vat && vatSummary.vat8Base > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#f59e0b', paddingLeft: '0.75rem', borderLeft: '2px solid #d97706' }}>
            <span>Reduced Rate VAT (8% Petroleum on {formatAmount(vatSummary.vat8Base)}):</span>
            <span style={{ fontWeight: '600' }}>{formatAmount(vatSummary.vat8Amount)}</span>
          </div>
        )}

        {formData.include_vat && vatSummary.zeroRatedBase > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#10b981', paddingLeft: '0.75rem', borderLeft: '2px solid #059669' }}>
            <span>Zero-Rated Supplies (0% on {formatAmount(vatSummary.zeroRatedBase)}):</span>
            <span style={{ fontWeight: '600' }}>KSh 0</span>
          </div>
        )}

        {formData.include_vat && vatSummary.exemptBase > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#a855f7', paddingLeft: '0.75rem', borderLeft: '2px solid #7c3aed' }}>
            <span>Exempt Supplies (No VAT on {formatAmount(vatSummary.exemptBase)}):</span>
            <span style={{ fontWeight: '600' }}>KSh 0</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#f59e0b', borderTop: '1px dashed #334155', paddingTop: '0.4rem', fontWeight: 'bold' }}>
          <span>Total Input VAT:</span>
          <span>{formData.include_vat ? formatAmount(vatSummary.totalVat) : 'KSh 0.00 (Exempt)'}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '0.65rem', marginTop: '0.2rem' }}>
          <strong style={{ fontSize: '1rem', color: '#22c55e' }}>Grand Invoice Total (Gross Payable):</strong>
          <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#22c55e' }}>{formatAmount(formData.amount)}</span>
        </div>
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }} disabled={isSubmitting}>
        {isSubmitting ? 'Recording Invoice...' : 'Record Supplier Invoice'}
      </button>
    </form>
  );
}
