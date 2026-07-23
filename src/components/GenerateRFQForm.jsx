import React, { useState, useEffect } from 'react';

export default function GenerateRFQForm() {
  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [lpos, setLpos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: `RFQ-2026-${Math.floor(Math.random() * 10000)}`,
    lpo_id: '',
    tender_id: '',
    deadline: '',
    items: ''
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => setTenders(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    // When a tender is selected, extract its LPOs
    if (selectedTenderId) {
      const tender = tenders.find(t => t.id === selectedTenderId);
      if (tender && tender.lpos) {
        // tender.lpos is already parsed by backend into an array
        setLpos(tender.lpos);
      } else {
        setLpos([]);
      }
    } else {
      setLpos([]);
    }
    // Reset LPO selection if tender changes
    setFormData(prev => ({ ...prev, lpo_id: '', tender_id: selectedTenderId, items: '' }));
  }, [selectedTenderId, tenders]);

  const handleLPOSelect = (e) => {
    const selectedLpoId = e.target.value;
    const lpo = lpos.find(l => l.id === selectedLpoId);
    
    if (lpo) {
      // Clean up items (remove client pricing to hide it from suppliers)
      let cleanedItems = [];
      try {
        const rawItems = typeof lpo.items === 'string' ? JSON.parse(lpo.items) : lpo.items;
        cleanedItems = rawItems.map(item => ({
          description: item.desc || item.description || '',
          quantity: item.qty || item.quantity || 0,
          unit: item.unit || 'unit'
          // Note: purposefully omitting unit_price and total_price
        }));
      } catch (e) {
        cleanedItems = [{ description: lpo.items || '', quantity: 1, unit: 'lump sum' }];
      }

      setFormData({
        ...formData,
        lpo_id: lpo.id,
        items: JSON.stringify(cleanedItems, null, 2)
      });
    } else {
      setFormData({
        ...formData,
        lpo_id: '',
        items: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('RFQ Generated Successfully! You can now send it to suppliers.');
        window.location.reload();
      } else {
        alert('Failed to generate RFQ.');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating RFQ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>RFQ Number</label>
        <input type="text" className="form-control" value={formData.id} disabled />
      </div>

      <div className="form-group">
        <label>Step 1: Select Tender / Project</label>
        <select className="form-control" required value={selectedTenderId} onChange={e => setSelectedTenderId(e.target.value)}>
          <option value="">Select a Tender...</option>
          {tenders.map(t => (
            <option key={t.id} value={t.id}>{t.id} - {t.name}</option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label>Step 2: Select Client LPO (Source Document)</label>
        <select className="form-control" required value={formData.lpo_id} onChange={handleLPOSelect} disabled={!selectedTenderId || lpos.length === 0}>
          <option value="">{lpos.length === 0 && selectedTenderId ? 'No LPOs found for this Tender' : 'Select an LPO to extract items from...'}</option>
          {lpos.map(lpo => (
            <option key={lpo.id} value={lpo.id}>{lpo.id} - Value: ${lpo.total_value}</option>
          ))}
        </select>
        <small style={{ color: 'hsl(var(--text-secondary))', display: 'block', marginTop: '0.25rem' }}>
          This will automatically extract the required items and strip out the client's pricing so it remains confidential from suppliers.
        </small>
      </div>

      <div className="form-group">
        <label>Extracted Items for Quotation</label>
        <textarea 
          className="form-control" 
          rows="6" 
          required 
          value={formData.items} 
          onChange={e => setFormData({...formData, items: e.target.value})}
          style={{ fontFamily: 'monospace' }}
        ></textarea>
      </div>

      <div className="form-group">
        <label>Submission Deadline for Suppliers</label>
        <input type="date" className="form-control" required value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
        {isSubmitting ? 'Generating...' : 'Generate RFQ'}
      </button>
    </form>
  );
}
