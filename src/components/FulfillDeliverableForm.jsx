import React, { useState, useEffect } from 'react'

export default function FulfillDeliverableForm() {
  const [deliverables, setDeliverables] = useState([])
  const [selectedType, setSelectedType] = useState('Goods')
  const [selectedDeliverable, setSelectedDeliverable] = useState('')
  const [details, setDetails] = useState('')
  const [documentType, setDocumentType] = useState('Delivery Note')
  const [file, setFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch available deliverables to populate the dropdown
  useEffect(() => {
    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => {
        // Flatten deliverables from all tenders
        const allDeliverables = []
        data.forEach(t => {
          if (t.deliverables) {
            t.deliverables.forEach(d => {
              allDeliverables.push({
                ...d,
                tender_name: t.name
              })
            })
          }
        })
        setDeliverables(allDeliverables)
      })
      .catch(err => console.error("Could not fetch deliverables:", err))
  }, [])

  // Auto-update the Type when a deliverable is selected
  useEffect(() => {
    if (selectedDeliverable) {
      const dlv = deliverables.find(d => d.id === selectedDeliverable)
      if (dlv) setSelectedType(dlv.type)
    }
  }, [selectedDeliverable, deliverables])

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDeliverable) {
      alert("Please select a target deliverable.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('evidence_id', `EV-${Math.floor(Math.random() * 10000)}`);
    formData.append('type', selectedType === 'Goods' ? documentType : selectedType === 'Service' ? 'Timesheet/Report' : 'Inspection Report');
    formData.append('details', details);
    formData.append('date_submitted', new Date().toISOString().split('T')[0]);
    formData.append('revenue_generated', 1500); // Mock dynamic revenue
    if (file) {
      formData.append('evidence_file', file);
    }

    try {
      const res = await fetch(`http://localhost:5000/api/deliverables/${selectedDeliverable}/evidence`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        alert('Evidence uploaded and fulfillment recorded!');
        window.location.reload(); // Refresh to see updates in the UI
      } else {
        alert('Failed to record fulfillment');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Ensure the backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="form-group">
        <label>Select Target Deliverable</label>
        <select 
          className="form-control" 
          value={selectedDeliverable} 
          onChange={e => setSelectedDeliverable(e.target.value)}
          required
        >
          <option value="">Select a Deliverable to fulfill...</option>
          {deliverables.length === 0 ? (
            <option disabled>No deliverables found in database</option>
          ) : (
            deliverables.map(dlv => (
              <option key={dlv.id} value={dlv.id}>
                {dlv.id} - {dlv.description} ({dlv.tender_name})
              </option>
            ))
          )}
        </select>
      </div>

      <div className="form-group">
        <label>Deliverable Type (Auto-detected from Target)</label>
        <select className="form-control" value={selectedType} onChange={e => setSelectedType(e.target.value)} disabled>
          <option value="Goods">Goods (Supply)</option>
          <option value="Service">Service (Consultancy, Training)</option>
          <option value="Construction">Construction (Works)</option>
        </select>
      </div>

      {selectedType === 'Goods' && (
        <div style={{ padding: '1rem', background: 'hsla(var(--primary), 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid hsla(var(--primary), 0.2)' }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>Goods Fulfillment Details</h4>
          <div className="form-group">
            <label>GRN Document Type</label>
            <select className="form-control" value={documentType} onChange={e => setDocumentType(e.target.value)} required>
              <option value="Delivery Note">Delivery Note</option>
              <option value="Receipt of Goods Bought">Receipt of Goods Bought</option>
              <option value="Signed Acceptance Form">Signed Acceptance Form</option>
            </select>
          </div>
          <div className="form-group">
            <label>Quantity Delivered</label>
            <input type="text" className="form-control" placeholder="e.g. 250 Bags" required value={details} onChange={e => setDetails(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Upload Evidence (Delivery Note / Signed Acceptance / Photos)</label>
            <input type="file" className="form-control" onChange={e => setFile(e.target.files[0])} />
          </div>
        </div>
      )}

      {selectedType === 'Service' && (
        <div style={{ padding: '1rem', background: 'hsla(var(--accent), 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid hsla(var(--accent), 0.2)' }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>Service Fulfillment Details</h4>
          <div className="form-group">
            <label>Hours Worked / Milestone Completed</label>
            <input type="text" className="form-control" placeholder="e.g. 40 hours or 'System Design Completed'" required value={details} onChange={e => setDetails(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Upload Evidence (Timesheet / Training Report / Consultancy Output)</label>
            <input type="file" className="form-control" onChange={e => setFile(e.target.files[0])} />
          </div>
        </div>
      )}

      {selectedType === 'Construction' && (
        <div style={{ padding: '1rem', background: 'hsla(var(--warning), 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid hsla(var(--warning), 0.2)' }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>Construction Fulfillment Details</h4>
          <div className="form-group">
            <label>Percentage / Phase Completion</label>
            <input type="text" className="form-control" placeholder="e.g. Foundation 100%" required value={details} onChange={e => setDetails(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Upload Evidence (Engineer Report / Inspection Report / Completion Cert)</label>
            <input type="file" className="form-control" onChange={e => setFile(e.target.files[0])} />
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Staff Comments / Notes</label>
        <textarea className="form-control" rows="3" placeholder="Additional details about this fulfillment..."></textarea>
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isSubmitting}>
        {isSubmitting ? 'Uploading Evidence...' : 'Submit Fulfillment & Upload Evidence'}
      </button>

    </form>
  )
}
