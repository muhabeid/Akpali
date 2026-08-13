import React, { useState, useEffect } from 'react'

export default function NewDeliverableForm() {
  const [tenders, setTenders] = useState([])
  const [formData, setFormData] = useState({
    id: `DLV-${Math.floor(Math.random() * 1000)}`,
    tender_id: '',
    description: '',
    type: 'Goods',
    billing_method: 'Fixed Price',
    planned_date: '',
    due_date: ''
  })
  const [items, setItems] = useState([{ desc: '', qty: 1, unit: 'PCS' }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => setTenders(data))
      .catch(err => console.error("Could not fetch tenders:", err))

    fetch('http://localhost:5000/api/next-id/grn')
      .then(res => res.json())
      .then(data => { if (data && data.id) setFormData(prev => ({ ...prev, id: data.id })) })
      .catch(err => console.error("Could not fetch next deliverable ID:", err))
  }, [])

  const handleAddItem = () => {
    setItems([...items, { desc: '', qty: 1, unit: 'PCS' }])
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tender_id) {
      alert("Please select a parent Tender.");
      return;
    }

    setIsSubmitting(true);
    
    // Ensure default dates if empty
    const today = new Date().toISOString().split('T')[0];
    const defaultDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const payload = { 
      ...formData,
      planned_date: formData.planned_date || today,
      due_date: formData.due_date || defaultDue
    };

    if (formData.type === 'Goods') {
      payload.items = JSON.stringify(items);
    }

    try {
      const res = await fetch('http://localhost:5000/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Deliverable added to Tender successfully!');
        window.location.reload(); 
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to create deliverable: ${errData.error || errData.message || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Ensure backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedTender = tenders.find(t => t.id === formData.tender_id);
  const availableLpos = selectedTender?.lpos || [];
  const availableQuotes = selectedTender?.sales_quotes || [];

  const handleAutoPopulate = (doc, source) => {
    if (!doc) return;
    let docItems = [];
    try {
      docItems = typeof doc.items === 'string' ? JSON.parse(doc.items) : (Array.isArray(doc.items) ? doc.items : []);
    } catch(e) { docItems = []; }

    const formattedItems = docItems.map(item => ({
      desc: item.desc || item.description || item.name || '',
      qty: item.qty || item.quantity || 1,
      unit: item.unit || 'PCS'
    }));

    let cleanTenderName = (selectedTender?.name || '')
      .replace(/^(?:Supply\s+and\s+Delivery\s+of|Supply\s+of|Delivery\s+of|Provision\s+of)\s+/i, '')
      .trim();
    if (cleanTenderName) cleanTenderName = cleanTenderName.charAt(0).toUpperCase() + cleanTenderName.slice(1);

    const docTag = source === 'LPO' ? 'LPO' : 'Quote';
    const cleanDescription = cleanTenderName ? `${docTag} #${doc.id} - ${cleanTenderName}` : `${docTag} #${doc.id} Fulfillment`;

    setFormData(prev => ({
      ...prev,
      description: cleanDescription,
      due_date: doc.due_date || doc.expected_date || prev.due_date || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      planned_date: prev.planned_date || new Date().toISOString().split('T')[0]
    }));

    if (formattedItems.length > 0) {
      setItems(formattedItems);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group">
        <label>Parent Tender / Project</label>
        <select className="form-control" required value={formData.tender_id} onChange={e => setFormData({...formData, tender_id: e.target.value})}>
          <option value="">Select a Tender...</option>
          {tenders.length === 0 ? (
            <option disabled>No tenders found in database</option>
          ) : (
            tenders.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
            ))
          )}
        </select>
        {selectedTender && (
          <small style={{ color: 'hsl(var(--primary))', marginTop: '0.25rem', display: 'block' }}>
            <strong>Client:</strong> {selectedTender.client}
          </small>
        )}
      </div>

      {selectedTender && (availableLpos.length > 0 || availableQuotes.length > 0) && (
        <div className="form-group">
          <label>Import Line Items from Source Document</label>
          <select 
            className="form-control" 
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              const [type, docId] = val.split(':');
              if (type === 'LPO') {
                const targetLpo = availableLpos.find(l => l.id === docId);
                handleAutoPopulate(targetLpo, 'LPO');
              } else if (type === 'SQ') {
                const targetSq = availableQuotes.find(q => q.id === docId);
                handleAutoPopulate(targetSq, 'Sales Quote');
              }
            }}
          >
            <option value="">Select Document to Populate Items...</option>
            {availableLpos.length > 0 && (
              <optgroup label="Client LPOs">
                {availableLpos.map(lpo => (
                  <option key={lpo.id} value={`LPO:${lpo.id}`}>LPO #{lpo.id} (Due: {lpo.due_date || 'N/A'})</option>
                ))}
              </optgroup>
            )}
            {availableQuotes.length > 0 && (
              <optgroup label="Sales Quotations">
                {availableQuotes.map(sq => (
                  <option key={sq.id} value={`SQ:${sq.id}`}>Quote #{sq.id} (Issued: {sq.issue_date || 'N/A'})</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      )}

      <div className="form-group">
        <label>Deliverable Title / Description</label>
        <input type="text" className="form-control" placeholder="e.g. Supply of 500 Laptops" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Type</label>
          <select className="form-control" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
            <option>Goods</option>
            <option>Service</option>
            <option>Construction</option>
          </select>
        </div>
        <div className="form-group">
          <label>Billing Method</label>
          <select className="form-control" required value={formData.billing_method} onChange={e => setFormData({...formData, billing_method: e.target.value})}>
            <option>Fixed Price</option>
            <option>Milestone</option>
            <option>Time & Materials</option>
            <option>Daily Rate</option>
            <option>Monthly Retainer</option>
            <option>Unit Rate</option>
            <option>Percentage of Contract</option>
          </select>
        </div>
      </div>

      {formData.type === 'Goods' && (
        <div className="form-group">
          <label>Goods to Supply (Items & Units of Measurement)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'hsla(var(--border), 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            {items.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr auto', gap: '0.5rem', alignItems: 'center' }}>
                <input type="text" className="form-control" placeholder="Item Description" value={item.desc} onChange={e => handleItemChange(index, 'desc', e.target.value)} required />
                <input type="number" className="form-control" placeholder="Qty" value={item.qty} onChange={e => handleItemChange(index, 'qty', e.target.value)} min="1" required />
                <select className="form-control" value={item.unit || 'PCS'} onChange={e => handleItemChange(index, 'unit', e.target.value)}>
                  <option value="PCS">PCS</option>
                  <option value="KG">KG</option>
                  <option value="TONS">TONS</option>
                  <option value="MTRS">MTRS</option>
                  <option value="BAGS">BAGS</option>
                  <option value="LOT">LOT</option>
                  <option value="SETS">SETS</option>
                  <option value="HRS">HRS</option>
                  <option value="DAYS">DAYS</option>
                  <option value="MONTHS">MONTHS</option>
                  <option value="TRIPS">TRIPS</option>
                  <option value="SQM">SQM</option>
                  <option value="CBM">CBM</option>
                  <option value="LTRS">LTRS</option>
                  <option value="BOX">BOX</option>
                </select>
                {items.length > 1 && (
                  <button type="button" className="btn" style={{ background: 'hsla(var(--danger), 0.1)', color: 'hsl(var(--danger))', padding: '0.5rem' }} onClick={() => handleRemoveItem(index)}>X</button>
                )}
              </div>
            ))}
            <button type="button" className="btn" onClick={handleAddItem} style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>+ Add Item</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Planned Start Date</label>
          <input type="date" className="form-control" required value={formData.planned_date} onChange={e => setFormData({...formData, planned_date: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input type="date" className="form-control" required value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
        </div>
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Add Deliverable'}
      </button>
    </form>
  )
}
