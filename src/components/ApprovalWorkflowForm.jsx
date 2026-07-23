import React, { useState } from 'react'

export default function ApprovalWorkflowForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    id: `WF-${Math.floor(Math.random() * 10000)}`,
    module_name: 'Purchase Orders',
    maker_role: 'Staff',
    checker_role: 'Manager',
    threshold_amount: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Workflow saved!');
        window.dispatchEvent(new Event('refreshCorporateHub'));
        if (onSuccess) onSuccess();
      } else {
        alert('Failed to save workflow');
      }
    } catch (err) {
      alert('Error connecting to backend');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>System Module</label>
        <select className="form-control" value={formData.module_name} onChange={e => setFormData({...formData, module_name: e.target.value})}>
          <option>Purchase Orders</option>
          <option>Sales Quotations</option>
          <option>LPO Generation</option>
          <option>Invoices</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Maker Role (Initiator)</label>
          <select className="form-control" value={formData.maker_role} onChange={e => setFormData({...formData, maker_role: e.target.value})}>
            <option>Staff</option>
            <option>Manager</option>
            <option>Admin</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Checker Role (Approver)</label>
          <select className="form-control" value={formData.checker_role} onChange={e => setFormData({...formData, checker_role: e.target.value})}>
            <option>Manager</option>
            <option>Admin</option>
            <option>Director</option>
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Threshold Amount ($)</label>
        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.5rem' }}>If set above 0, rule only applies when amount exceeds threshold.</div>
        <input type="number" step="0.01" className="form-control" value={formData.threshold_amount} onChange={e => setFormData({...formData, threshold_amount: parseFloat(e.target.value) || 0})} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Rule'}
        </button>
      </div>
    </form>
  )
}
