import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2, CheckCircle2, AlertCircle, Building2, Calendar, FileText } from 'lucide-react';

export default function GenerateRFQForm({ onSuccess }) {
  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [lpos, setLpos] = useState([]);
  const [selectedLpoId, setSelectedLpoId] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [targetSupplier, setTargetSupplier] = useState('');
  const [itemsList, setItemsList] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [rfqId, setRfqId] = useState('Loading RFQ ID...');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 1. Fetch Tenders
    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => setTenders(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching tenders:', err));

    // 2. Fetch Suppliers (for targeting specific vendors)
    fetch('http://localhost:5000/api/suppliers')
      .then(res => res.json())
      .then(data => setSuppliers(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching suppliers:', err));

    // 3. Fetch Next RFQ ID
    fetch('http://localhost:5000/api/next-id/rfq')
      .then(res => res.json())
      .then(data => {
        if (data && data.id) setRfqId(data.id);
      })
      .catch(err => console.error('Error fetching next RFQ ID:', err));

    // Default deadline to 7 days from today
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setDeadline(nextWeek.toISOString().split('T')[0]);
  }, []);

  // Update LPOs when Tender changes
  useEffect(() => {
    if (selectedTenderId) {
      const tender = tenders.find(t => t.id === selectedTenderId);
      if (tender && tender.lpos) {
        setLpos(Array.isArray(tender.lpos) ? tender.lpos : []);
      } else {
        setLpos([]);
      }
    } else {
      setLpos([]);
    }
    setSelectedLpoId('');
    setItemsList([]);
  }, [selectedTenderId, tenders]);

  // Handle LPO Selection and Item Extraction
  const handleLPOSelect = (e) => {
    const lpoId = e.target.value;
    setSelectedLpoId(lpoId);

    const lpo = lpos.find(l => l.id === lpoId);
    if (lpo) {
      let extracted = [];
      try {
        const rawItems = typeof lpo.items === 'string' ? JSON.parse(lpo.items) : lpo.items;
        if (Array.isArray(rawItems)) {
          extracted = rawItems.map((item, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            description: item.desc || item.description || item.name || '',
            quantity: item.qty || item.quantity || 1,
            unit: item.unit || 'PCS',
            selected: true // Selected by default
          }));
        } else if (typeof lpo.items === 'string' && lpo.items.trim()) {
          // Fallback if plain text lines
          extracted = lpo.items
            .split('\n')
            .filter(line => line.trim())
            .map((line, idx) => ({
              id: `item-${Date.now()}-${idx}`,
              description: line.trim(),
              quantity: 1,
              unit: 'PCS',
              selected: true
            }));
        }
      } catch (err) {
        extracted = [
          {
            id: `item-${Date.now()}`,
            description: typeof lpo.items === 'string' ? lpo.items : 'Required Supplies',
            quantity: 1,
            unit: 'LOT',
            selected: true
          }
        ];
      }

      setItemsList(extracted);
    } else {
      setItemsList([]);
    }
  };

  // Toggle selection for single item
  const handleToggleItem = (id) => {
    setItemsList(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  // Select All items
  const handleSelectAll = () => {
    setItemsList(prev => prev.map(item => ({ ...item, selected: true })));
  };

  // Omit All items
  const handleOmitAll = () => {
    setItemsList(prev => prev.map(item => ({ ...item, selected: false })));
  };

  // Update item field
  const handleItemChange = (id, field, value) => {
    setItemsList(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Add a new custom item
  const handleAddItem = () => {
    setItemsList(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        description: '',
        quantity: 1,
        unit: 'PCS',
        selected: true
      }
    ]);
  };

  // Remove an item row
  const handleRemoveItem = (id) => {
    setItemsList(prev => prev.filter(item => item.id !== id));
  };

  // Calculation counts
  const selectedCount = itemsList.filter(i => i.selected).length;
  const omittedCount = itemsList.length - selectedCount;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTenderId) {
      alert('Please select a Tender / Project.');
      return;
    }

    if (!selectedLpoId) {
      alert('Please select a Client LPO source document.');
      return;
    }

    // Filter only marked / selected items that have a description
    const itemsToSend = itemsList
      .filter(item => item.selected && item.description.trim() !== '')
      .map(item => ({
        description: item.description.trim(),
        quantity: Number(item.quantity) || 1,
        unit: (item.unit || 'PCS').trim().toUpperCase()
      }));

    if (itemsToSend.length === 0) {
      alert('Please mark at least one item to send to suppliers before generating the RFQ.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        id: rfqId,
        lpo_id: selectedLpoId,
        tender_id: selectedTenderId,
        deadline: deadline,
        items: JSON.stringify(itemsToSend)
      };

      const res = await fetch('http://localhost:5000/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`✅ RFQ ${rfqId} Generated Successfully with ${itemsToSend.length} item(s) to send!`);
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to generate RFQ: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error connecting to RFQ generation service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* RFQ HEADER INFO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
        <div>
          <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
            RFQ Reference Number
          </label>
          <input 
            type="text" 
            className="form-control" 
            value={rfqId} 
            disabled 
            style={{ fontWeight: 'bold', color: '#0284c7', background: '#ffffff', cursor: 'not-allowed' }} 
          />
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 'bold', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
            <Calendar size={14} /> Submission Deadline for Suppliers
          </label>
          <input 
            type="date" 
            className="form-control" 
            required 
            value={deadline} 
            onChange={e => setDeadline(e.target.value)} 
          />
        </div>
      </div>

      {/* STEP 1: SELECT TENDER */}
      <div className="form-group" style={{ margin: 0 }}>
        <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <FileText size={16} style={{ color: '#0284c7' }} /> Step 1: Select Tender / Project Bidding
        </label>
        <select 
          className="form-control" 
          required 
          value={selectedTenderId} 
          onChange={e => setSelectedTenderId(e.target.value)}
          style={{ fontSize: '0.9rem' }}
        >
          <option value="">Select a Tender...</option>
          {tenders.map(t => (
            <option key={t.id} value={t.id}>
              {t.id} - {t.name} ({t.client || 'Client'})
            </option>
          ))}
        </select>
      </div>

      {/* STEP 2: SELECT CLIENT LPO */}
      <div className="form-group" style={{ margin: 0 }}>
        <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <CheckCircle2 size={16} style={{ color: '#16a34a' }} /> Step 2: Select Source Client LPO
        </label>
        <select 
          className="form-control" 
          required 
          value={selectedLpoId} 
          onChange={handleLPOSelect} 
          disabled={!selectedTenderId || lpos.length === 0}
          style={{ fontSize: '0.9rem' }}
        >
          <option value="">
            {!selectedTenderId 
              ? 'Select a tender first' 
              : lpos.length === 0 
                ? 'No LPOs found for this Tender' 
                : 'Select an LPO to extract line items from...'}
          </option>
          {lpos.map(lpo => (
            <option key={lpo.id} value={lpo.id}>
              {lpo.id} &bull; Total Value: KSh {Number(lpo.total_value || 0).toLocaleString()} (Client Ref: {lpo.client_reference || 'N/A'})
            </option>
          ))}
        </select>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem', lineHeight: '1.4' }}>
          💡 Client pricing will be automatically stripped out so vendor bidding remains strictly competitive and confidential.
        </div>
      </div>

      {/* STEP 3: OPTIONAL TARGET SUPPLIER */}
      {suppliers.length > 0 && (
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', fontSize: '0.85rem', color: '#475569' }}>
            <Building2 size={15} style={{ color: '#8b5cf6' }} /> Step 3: Target Supplier / Category (Optional)
          </label>
          <select 
            className="form-control" 
            value={targetSupplier} 
            onChange={e => setTargetSupplier(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="">Multi-Vendor / General RFQ (Any Supplier)</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.name}>
                {s.name} ({s.category || 'Vendor'}) &bull; PIN: {s.tax_pin || s.kra_pin || 'N/A'}
              </option>
            ))}
          </select>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
            Helpful for tailoring this RFQ specifically for hardware, plumbing, or electrical specialists.
          </div>
        </div>
      )}

      {/* STEP 4: INTERACTIVE ITEM SELECTION LIST (MARK TO SEND / OMIT) */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        
        {/* TOOLBAR */}
        <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#0f172a' }}>
              Choose Items to Send or Omit
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>
              Check items you want to send; uncheck to omit from this specific supplier request.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              fontSize: '0.78rem', 
              padding: '0.25rem 0.6rem', 
              borderRadius: '999px', 
              fontWeight: 'bold', 
              background: selectedCount > 0 ? '#dcfce7' : '#fee2e2', 
              color: selectedCount > 0 ? '#15803d' : '#b91c1c',
              border: `1px solid ${selectedCount > 0 ? '#86efac' : '#fca5a5'}`
            }}>
              {selectedCount} to Send
            </span>

            {omittedCount > 0 && (
              <span style={{ 
                fontSize: '0.78rem', 
                padding: '0.25rem 0.6rem', 
                borderRadius: '999px', 
                fontWeight: 'bold', 
                background: '#f1f5f9', 
                color: '#64748b',
                border: '1px solid #cbd5e1'
              }}>
                {omittedCount} Omitted
              </span>
            )}

            <button 
              type="button" 
              onClick={handleSelectAll} 
              className="btn" 
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', fontWeight: '600' }}
              title="Mark all items to send"
            >
              Select All
            </button>
            <button 
              type="button" 
              onClick={handleOmitAll} 
              className="btn" 
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', fontWeight: '600' }}
              title="Omit all items"
            >
              Omit All
            </button>
            <button 
              type="button" 
              onClick={handleAddItem} 
              className="btn btn-primary" 
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}
            >
              <Plus size={14} /> Add Item
            </button>
          </div>
        </div>

        {/* ITEMS LIST BODY */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '0.75rem' }}>
          {itemsList.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 0.5rem auto', color: '#94a3b8', display: 'block' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#334155' }}>
                No line items loaded yet
              </div>
              <p style={{ margin: '0.25rem 0 0.75rem 0', fontSize: '0.8rem' }}>
                Select a Client LPO in Step 2 above to extract items, or add items manually.
              </p>
              <button 
                type="button" 
                onClick={handleAddItem} 
                className="btn" 
                style={{ fontSize: '0.8rem', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
              >
                + Add Custom Item
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {itemsList.map((item, idx) => (
                <div 
                  key={item.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    border: `1px solid ${item.selected ? '#86efac' : '#e2e8f0'}`,
                    background: item.selected ? '#f0fdf4' : '#f8fafc',
                    transition: 'all 0.15s ease',
                    opacity: item.selected ? 1 : 0.75
                  }}
                >
                  {/* CHECKBOX / MARK TO SEND */}
                  <div 
                    onClick={() => handleToggleItem(item.id)} 
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', userSelect: 'none' }}
                    title={item.selected ? 'Click to omit from this RFQ' : 'Click to send in this RFQ'}
                  >
                    {item.selected ? (
                      <CheckSquare size={20} style={{ color: '#16a34a' }} />
                    ) : (
                      <Square size={20} style={{ color: '#94a3b8' }} />
                    )}
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 'bold', 
                      padding: '0.15rem 0.45rem', 
                      borderRadius: '4px',
                      background: item.selected ? '#16a34a' : '#94a3b8',
                      color: '#ffffff'
                    }}>
                      {item.selected ? 'SEND' : 'OMIT'}
                    </span>
                  </div>

                  {/* ITEM DESCRIPTION */}
                  <div style={{ flex: 1 }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={item.description} 
                      onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                      placeholder="e.g. 50kg Bags of Cement, 12mm Rebar..."
                      style={{ 
                        fontSize: '0.85rem', 
                        padding: '0.4rem 0.6rem',
                        textDecoration: item.selected ? 'none' : 'line-through',
                        color: item.selected ? '#0f172a' : '#64748b'
                      }}
                    />
                  </div>

                  {/* QUANTITY */}
                  <div style={{ width: '90px' }}>
                    <input 
                      type="number" 
                      min="0.01" 
                      step="any"
                      className="form-control" 
                      value={item.quantity} 
                      onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                      placeholder="Qty"
                      title="Quantity to request from supplier"
                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.5rem', textAlign: 'center' }}
                    />
                  </div>

                  {/* UNIT OF MEASURE */}
                  <div style={{ width: '95px' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={item.unit} 
                      onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
                      placeholder="Unit"
                      list="rfq-unit-options"
                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.5rem', textAlign: 'center', textTransform: 'uppercase' }}
                    />
                  </div>

                  {/* REMOVE BUTTON */}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(item.id)} 
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
                    title="Delete item row"
                  >
                    <Trash2 size={16} onMouseEnter={e => e.target.style.color = '#ef4444'} onMouseLeave={e => e.target.style.color = '#94a3b8'} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER HELPER */}
        {itemsList.length > 0 && (
          <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', borderTop: '1px solid #cbd5e1', fontSize: '0.78rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <strong>Summary:</strong> {selectedCount} item(s) will be included in the RFQ document. {omittedCount} item(s) will be excluded.
            </span>
            {targetSupplier && (
              <span style={{ color: '#8b5cf6', fontWeight: '600' }}>
                Vendor Target: {targetSupplier}
              </span>
            )}
          </div>
        )}
      </div>

      {/* UNIT SUGGESTIONS DATALIST */}
      <datalist id="rfq-unit-options">
        <option value="PCS" />
        <option value="BAGS" />
        <option value="KG" />
        <option value="TONNES" />
        <option value="MTR" />
        <option value="ROLLS" />
        <option value="LITRES" />
        <option value="LOT" />
        <option value="SETS" />
        <option value="BOXES" />
        <option value="DRUMS" />
      </datalist>

      {/* SUBMIT BUTTON */}
      <button 
        type="submit" 
        className="btn btn-primary" 
        style={{ 
          width: '100%', 
          padding: '0.75rem', 
          fontSize: '0.95rem', 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem' 
        }} 
        disabled={isSubmitting || selectedCount === 0}
      >
        {isSubmitting ? 'Generating RFQ...' : `Generate RFQ (${selectedCount} Items Included)`}
      </button>

    </form>
  );
}
