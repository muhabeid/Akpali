import React, { useState, useEffect } from 'react'

export default function GenerateInvoiceForm() {
  const [billingType, setBillingType] = useState('delivery') // 'delivery' or 'milestone'
  const [evidence, setEvidence] = useState([])
  const [tenders, setTenders] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    id: `INV-2026-${Math.floor(Math.random() * 1000)}`,
    tender_id: '',
    reference_id: '', // evidence_id for delivery, or description for milestone
    amount: '',
    invoice_date: ''
  })

  useEffect(() => {
    fetch('http://localhost:5000/api/evidence')
      .then(res => res.json())
      .then(data => setEvidence(data))
      .catch(err => console.error("Error fetching evidence:", err));

    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => setTenders(data))
      .catch(err => console.error("Error fetching tenders:", err));
  }, []);

  const handleDeliverySelect = (e) => {
    const evId = e.target.value;
    const ev = evidence.find(x => x.id === evId);
    if (ev) {
      setFormData({
        ...formData,
        reference_id: ev.id,
        tender_id: ev.tender_id || '', // Note: evidence has deliverable_id, we need to map to tender
        amount: ev.revenue_generated
      });
    } else {
      setFormData({ ...formData, reference_id: '', amount: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      id: formData.id,
      tender_id: formData.tender_id, // For delivery, we might need to look it up if not strictly set
      billing_type: billingType,
      reference_id: formData.reference_id,
      amount: formData.amount,
      invoice_date: formData.invoice_date
    };

    if (billingType === 'delivery' && !payload.tender_id) {
      // Find tender from evidence -> deliverable
      const ev = evidence.find(x => x.id === payload.reference_id);
      if (ev) {
        const t = tenders.find(tnd => tnd.name === ev.tender_name);
        if (t) payload.tender_id = t.id;
      }
    }

    try {
      const res = await fetch('http://localhost:5000/api/client_invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Client Invoice Generated successfully!');
        window.location.reload();
      } else {
        alert('Failed to generate invoice.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          type="button" 
          onClick={() => { setBillingType('delivery'); setFormData({...formData, reference_id: '', tender_id: '', amount: ''}); }}
          style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${billingType === 'delivery' ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`, background: billingType === 'delivery' ? 'hsla(var(--primary), 0.1)' : 'transparent', color: billingType === 'delivery' ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Delivery Note Billing
        </button>
        <button 
          type="button" 
          onClick={() => { setBillingType('milestone'); setFormData({...formData, reference_id: '', tender_id: '', amount: ''}); }}
          style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${billingType === 'milestone' ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`, background: billingType === 'milestone' ? 'hsla(var(--primary), 0.1)' : 'transparent', color: billingType === 'milestone' ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Milestone / Advance
        </button>
      </div>

      {billingType === 'delivery' ? (
        <div className="form-group">
          <label>Select Completed Delivery / Evidence</label>
          <select className="form-control" required value={formData.reference_id} onChange={handleDeliverySelect}>
            <option value="">Select an approved delivery...</option>
            {evidence.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.id} - {ev.deliverable_name} ({ev.tender_name}) - ${ev.revenue_generated.toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div className="form-group">
            <label>Select Tender / Project</label>
            <select className="form-control" required value={formData.tender_id} onChange={e => setFormData({...formData, tender_id: e.target.value})}>
              <option value="">Select...</option>
              {tenders.map(t => (
                <option key={t.id} value={t.id}>
                  {t.id} - {t.name} (Value: ${t.contract_value.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Milestone Description</label>
            <input type="text" className="form-control" placeholder="e.g., 30% Advance Payment for Mobilization" required value={formData.reference_id} onChange={e => setFormData({...formData, reference_id: e.target.value})} />
          </div>
        </>
      )}

      <div className="form-group">
        <label>Invoice Number</label>
        <input type="text" className="form-control" value={formData.id} disabled required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Invoice Date</label>
          <input type="date" className="form-control" required value={formData.invoice_date} onChange={e => setFormData({...formData, invoice_date: e.target.value})} />
        </div>
        <div className="form-group">
          <label>VAT Rate (%)</label>
          <input type="number" className="form-control" defaultValue="16" required />
        </div>
      </div>
      
      <div className="form-group">
        <label>{billingType === 'delivery' ? 'Total Invoice Amount (Auto-calculated from Delivery)' : 'Invoice Amount (Net of VAT)'}</label>
        <input 
          type="number" 
          className="form-control" 
          placeholder={billingType === 'milestone' ? "0.00" : "Auto-calculated..."}
          disabled={billingType === 'delivery'} 
          style={{ opacity: billingType === 'delivery' ? 0.7 : 1 }}
          required
          value={formData.amount}
          onChange={e => setFormData({...formData, amount: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Upload Final Invoice PDF (Optional)</label>
        <div style={{ border: '2px dashed hsl(var(--border))', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', color: 'hsl(var(--text-secondary))' }}>
          Drag and drop PDF here
        </div>
      </div>
      
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
        {isSubmitting ? 'Generating...' : 'Generate Client Invoice'}
      </button>
    </form>
  )
}
