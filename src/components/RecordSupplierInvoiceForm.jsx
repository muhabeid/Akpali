import React, { useState, useEffect } from 'react';
import { FileSearch } from 'lucide-react';

export default function RecordSupplierInvoiceForm() {
  const [pos, setPos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const [formData, setFormData] = useState({
    id: `INV-2026-${Math.floor(Math.random() * 10000)}`,
    po_id: '',
    supplier_name: '',
    invoice_date: '',
    amount: 0
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/pos')
      .then(res => res.json())
      .then(data => setPos(data))
      .catch(err => console.error(err));
  }, []);

  const handlePOSelect = (e) => {
    const selectedPoId = e.target.value;
    const po = pos.find(p => p.id === selectedPoId);
    setFormData({
      ...formData,
      po_id: selectedPoId,
      supplier_name: po ? po.supplier_name : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/supplier_invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('Supplier Invoice Recorded Successfully! It is now pending 3-Way Match.');
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
    // Simulate 2 seconds of AI processing
    setTimeout(() => {
      setIsScanning(false);
      setFormData(prev => ({
        ...prev,
        invoice_date: new Date().toISOString().split('T')[0],
        amount: 4500 // Mock extracted value
      }));
      alert('AI Scan Complete: Extracted Date and Amount from Supplier Invoice.');
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* AI OCR SCANNER MOCK */}
      <div 
        style={{ 
          border: '2px dashed hsl(var(--warning))', 
          borderRadius: 'var(--radius-md)', 
          padding: '2rem', 
          textAlign: 'center', 
          marginBottom: '1.5rem',
          background: isScanning ? 'hsla(var(--warning), 0.1)' : 'hsla(var(--warning), 0.02)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={simulateOCRScan}
      >
        <FileSearch size={32} style={{ color: 'hsl(var(--warning))', marginBottom: '0.5rem' }} />
        <h4 style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--warning))' }}>
          {isScanning ? 'Extracting Invoice Data via AI...' : 'Drag & Drop Supplier Invoice to Auto-Fill'}
        </h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
          {isScanning ? 'Please wait...' : 'Supports PDF, JPG, PNG. Powered by TenderPro OCR.'}
        </p>
      </div>

      <div className="form-group">
        <label>Supplier Invoice Number</label>
        <input type="text" className="form-control" value={formData.id} disabled />
      </div>
      
      <div className="form-group">
        <label>Link to Purchase Order</label>
        <select className="form-control" required value={formData.po_id} onChange={handlePOSelect}>
          <option value="">Select the PO this invoice bills against...</option>
          {pos.map(po => (
            <option key={po.id} value={po.id}>{po.id} - {po.supplier_name} (${po.total_value.toLocaleString()})</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Supplier Name</label>
        <input type="text" className="form-control" value={formData.supplier_name} disabled style={{ opacity: 0.7 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Invoice Date</label>
          <input type="date" className="form-control" required value={formData.invoice_date} onChange={e => setFormData({...formData, invoice_date: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Billed Amount ($)</label>
          <input type="number" step="0.01" className="form-control" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
        </div>
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
        {isSubmitting ? 'Recording...' : 'Record Invoice'}
      </button>
    </form>
  );
}
