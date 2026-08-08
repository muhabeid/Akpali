import React, { useState, useEffect } from 'react';
import { FileSearch, PackageCheck, FileText, Check, AlertCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

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
    const sub = itemsList.reduce((sum, item) => sum + (Number(item.total) || (Number(item.qty || 1) * Number(item.unit_price || 0))), 0);
    const vat = includeVat ? sub * 0.16 : 0;
    const total = sub + vat;

    setFormData(prev => ({
      ...prev,
      items: itemsList,
      subtotal: sub,
      include_vat: includeVat,
      vat_amount: vat,
      amount: total
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
          description: i.description || i.item_name || 'Supplies',
          qty: Number(i.quantity || i.qty || 1),
          unit_price: Number(i.unit_price || i.price || (po.total_value / (i.quantity || 1))),
          total: Number(i.total || (i.quantity * i.unit_price) || po.total_value)
        }));
      } else {
        extractedItems = [
          {
            description: `Supplies for LPO/PO ${po.id}`,
            qty: 1,
            unit_price: Number(po.total_value || 0),
            total: Number(po.total_value || 0)
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
          description: del.deliverable_name || `Delivered Goods for ${del.tender_name || 'Tender'}`,
          qty: 1,
          unit_price: Number(del.revenue_generated || 0),
          total: Number(del.revenue_generated || 0)
        }
      ];

      setFormData(prev => ({
        ...prev,
        delivery_id: delId,
        po_id: del.po_id || '',
        supplier_name: del.supplier_name || del.client_name || 'Supplier'
      }));

      updateAmounts(extractedItems, formData.include_vat);
    } else {
      setFormData(prev => ({ ...prev, delivery_id: '' }));
      updateAmounts([], formData.include_vat);
    }
  };

  // Toggle VAT inclusion
  const handleVatToggle = (e) => {
    const checked = e.target.checked;
    updateAmounts(formData.items, checked);
  };

  // Manual line item changes
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
    const newItems = [...formData.items, { description: '', qty: 1, unit_price: 0, total: 0 }];
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
      po_id: formData.po_id,
      delivery_id: formData.delivery_id,
      supplier_name: formData.supplier_name,
      invoice_date: formData.invoice_date,
      subtotal: formData.subtotal,
      include_vat: formData.include_vat,
      vat_amount: formData.vat_amount,
      amount: formData.amount,
      items: formData.items
    };

    try {
      const res = await fetch('http://localhost:5000/api/supplier_invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('✅ Supplier Invoice Recorded Successfully! Line items and 16% VAT logged into system.');
        window.location.reload();
      } else {
        alert('Failed to record invoice.');
      }
    } catch (err) {
      console.error(err);
      alert('Error recording invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const simulateOCRScan = (e) => {
    e.preventDefault();
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const mockItems = [
        { description: 'Class 32.5 Bamburi Cement 50kg', qty: 50, unit_price: 850, total: 42500 },
        { description: 'Transport & Offloading Fee', qty: 1, unit_price: 2500, total: 2500 }
      ];
      setFormData(prev => ({
        ...prev,
        supplier_name: 'Simba Cement Distro Ltd',
        invoice_date: new Date().toISOString().split('T')[0]
      }));
      updateAmounts(mockItems, true);
      alert('AI Scan Complete: Pulled line items & totals from uploaded Supplier Invoice!');
    }, 1800);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* AI OCR SCANNER DROPZONE */}
      <div 
        style={{ 
          border: '2px dashed hsl(var(--warning))', 
          borderRadius: 'var(--radius-md)', 
          padding: '1.25rem', 
          textAlign: 'center',
          background: isScanning ? 'hsla(var(--warning), 0.1)' : 'hsla(var(--warning), 0.02)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={simulateOCRScan}
      >
        <FileSearch size={28} style={{ color: 'hsl(var(--warning))', marginBottom: '0.4rem' }} />
        <h4 style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--warning))', fontSize: '0.95rem' }}>
          {isScanning ? 'Extracting Invoice Line Items via AI...' : 'Drag & Drop Supplier Invoice / ETR to Auto-Fill'}
        </h4>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
          {isScanning ? 'Processing...' : 'Auto-extracts items, quantities, subtotal & 16% VAT.'}
        </p>
      </div>

      {/* SOURCE DOCUMENT SELECTOR (LPO VS DELIVERY VS MANUAL) */}
      <div>
        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>
          Pull Content From ERP Document:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setSourceType('lpo')}
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
            📋 From LPO / PO
          </button>
          <button
            type="button"
            onClick={() => setSourceType('delivery')}
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
            🚚 From Delivery (GRN)
          </button>
          <button
            type="button"
            onClick={() => setSourceType('manual')}
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
            ✏️ Manual Item Entry
          </button>
        </div>
      </div>

      {/* SOURCE DOCUMENT DROPDOWNS */}
      {sourceType === 'lpo' && (
        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Select LPO / Purchase Order *</label>
          <select className="form-control" required value={formData.po_id} onChange={handlePOSelect}>
            <option value="">Choose LPO to pull items from...</option>
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
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Select Delivery Note / Goods Receipt Note (GRN) *</label>
          <select className="form-control" required value={formData.delivery_id} onChange={handleDeliverySelect}>
            <option value="">Choose Delivery to pull items from...</option>
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

      {/* INVOICE LINE ITEMS TABLE (AUTO-PULLED FROM LPO/DELIVERY OR MANUALLY ADDED) */}
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
              <tr style={{ borderBottom: '1px solid hsl(var(--border))', textAlign: 'left' }}>
                <th style={{ padding: '0.4rem' }}>Item Description</th>
                <th style={{ padding: '0.4rem', width: '70px' }}>Qty</th>
                <th style={{ padding: '0.4rem', width: '110px' }}>Unit Price</th>
                <th style={{ padding: '0.4rem', width: '110px', textAlign: 'right' }}>Total (KSh)</th>
                <th style={{ padding: '0.4rem', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid hsla(var(--border), 0.4)' }}>
                  <td style={{ padding: '0.4rem' }}>
                    <input type="text" className="form-control" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }} value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} placeholder="Item description..." />
                  </td>
                  <td style={{ padding: '0.4rem' }}>
                    <input type="number" className="form-control" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }} value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} />
                  </td>
                  <td style={{ padding: '0.4rem' }}>
                    <input type="number" step="0.01" className="form-control" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }} value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} />
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

      {/* VAT 16% TOGGLE & TAX BREAKDOWN */}
      <div style={{ background: 'hsla(var(--primary), 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid hsl(var(--primary))', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={formData.include_vat} 
            onChange={handleVatToggle}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'hsl(var(--primary))' }}
          />
          <span>Include 16% VAT in Total Invoiced Amount</span>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', borderTop: '1px solid hsla(var(--border), 0.6)', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', display: 'block' }}>Subtotal (Net Amount)</span>
            <strong>{formatAmount(formData.subtotal)}</strong>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', display: 'block' }}>16% Input VAT Portion</span>
            <strong style={{ color: formData.include_vat ? '#38bdf8' : 'hsl(var(--text-secondary))' }}>
              {formData.include_vat ? formatAmount(formData.vat_amount) : 'KSh 0.00 (Exempt)'}
            </strong>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', display: 'block' }}>Grand Invoiced Total</span>
            <strong style={{ fontSize: '1.05rem', color: '#10b981' }}>{formatAmount(formData.amount)}</strong>
          </div>
        </div>
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }} disabled={isSubmitting}>
        {isSubmitting ? 'Recording Invoice...' : 'Record Supplier Invoice'}
      </button>
    </form>
  );
}
