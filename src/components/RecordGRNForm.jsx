import React, { useState, useEffect } from 'react';

export default function RecordGRNForm() {
  const [pos, setPos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: `GRN-2026-${Math.floor(Math.random() * 10000)}`,
    po_id: '',
    received_date: '',
    received_value: 0,
    details: '',
    items: [] // Structured array of items received
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/pos')
      .then(res => res.json())
      .then(data => setPos(data))
      .catch(err => console.error(err));
  }, []);

  const selectedPO = pos.find(p => p.id === formData.po_id);

  // When PO changes, load the items from the PO
  useEffect(() => {
    if (selectedPO && selectedPO.items) {
      try {
        const poItems = JSON.parse(selectedPO.items);
        const initializedItems = poItems.map(item => ({
          ...item,
          received_qty: '' // Default to empty so they have to fill it
        }));
        setFormData(prev => ({ ...prev, items: initializedItems }));
      } catch (e) {
        setFormData(prev => ({ ...prev, items: [] }));
      }
    } else {
      setFormData(prev => ({ ...prev, items: [] }));
    }
  }, [selectedPO]);

  const handleItemQtyChange = (index, qty) => {
    const updatedItems = [...formData.items];
    updatedItems[index].received_qty = qty;
    
    let autoValue = 0;
    let canAutoCalculate = true;
    updatedItems.forEach(item => {
      const price = item.unit_price || item.unitPrice;
      if (price !== undefined && price !== null) {
        autoValue += (parseFloat(item.received_qty) || 0) * parseFloat(price);
      } else {
        canAutoCalculate = false;
      }
    });

    setFormData({
      ...formData,
      items: updatedItems,
      received_value: canAutoCalculate ? autoValue : formData.received_value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append('id', formData.id);
    formDataToSend.append('po_id', formData.po_id);
    formDataToSend.append('received_date', formData.received_date);
    formDataToSend.append('received_value', formData.received_value);
    formDataToSend.append('details', formData.details);
    
    // Pass the structured items JSON to the backend so the Inventory Engine can process it
    formDataToSend.append('items', JSON.stringify(formData.items));
    
    const fileInput = document.getElementById('grn_file');
    if (fileInput && fileInput.files[0]) {
      formDataToSend.append('grn_file', fileInput.files[0]);
    }

    try {
      const res = await fetch('http://localhost:5000/api/grns', {
        method: 'POST',
        body: formDataToSend
      });

      if (res.ok) {
        alert('GRN Recorded! Stock Inventory has been automatically updated.');
        window.location.reload();
      } else {
        alert('Failed to record GRN.');
      }
    } catch (err) {
      console.error(err);
      alert('Error recording GRN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>GRN Document ID</label>
        <input type="text" className="form-control" value={formData.id} disabled />
      </div>
      
      <div className="form-group">
        <label>Select Purchase Order</label>
        <select className="form-control" required value={formData.po_id} onChange={e => setFormData({...formData, po_id: e.target.value})}>
          <option value="">Select an outgoing PO...</option>
          {pos.map(po => (
            <option key={po.id} value={po.id}>{po.id} - {po.supplier_name} (${po.total_value.toLocaleString()})</option>
          ))}
        </select>
      </div>

      {formData.items.length > 0 && (
        <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>Verify Item Quantities Received</h4>
          {formData.items.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <div style={{ fontSize: '0.875rem' }}>
                <strong>{item.desc || item.description || item.name}</strong>
                <span style={{ display: 'block', color: 'hsl(var(--text-secondary))' }}>Ordered: {item.qty || item.quantity} {item.unit || 'unit'}</span>
              </div>
              <div>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control" 
                  placeholder={`Qty in ${item.unit}`}
                  value={item.received_qty}
                  onChange={e => handleItemQtyChange(index, e.target.value)}
                  required
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Received Date</label>
          <input type="date" className="form-control" required value={formData.received_date} onChange={e => setFormData({...formData, received_date: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Total Verified Value ($)</label>
          <input type="number" step="0.01" className="form-control" required value={formData.received_value} onChange={e => setFormData({...formData, received_value: e.target.value})} />
        </div>
      </div>

      <div className="form-group">
        <label>Condition / Details</label>
        <textarea className="form-control" rows="3" required placeholder="e.g., Some bags rejected due to water damage." value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}></textarea>
      </div>

      <div className="form-group">
        <label>Upload Signed Delivery Note (PDF/Image)</label>
        <input type="file" id="grn_file" className="form-control" accept="image/*,.pdf" />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
        {isSubmitting ? 'Recording...' : 'Record GRN & Update Inventory'}
      </button>
    </form>
  );
}
