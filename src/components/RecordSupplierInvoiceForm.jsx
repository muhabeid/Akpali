import React, { useState, useEffect } from 'react';

export default function RecordSupplierInvoiceForm() {
  const [pos, setPos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  return (
    <form onSubmit={handleSubmit}>
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
