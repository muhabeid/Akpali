import React, { useState } from 'react'
import { useRole } from '../context/RoleContext'
import { ShieldCheck, Plus, CheckCircle2, X } from 'lucide-react'

export default function CreateRoleModal({ onClose, onSuccess }) {
  const { addCustomRole } = useRole()

  const [roleData, setRoleData] = useState({
    name: '',
    badge: '👤 Custom Role',
    color: '#0284c7',
    description: '',
    selectedTasks: []
  })

  const availableTasksList = [
    'Full Executive System Oversight & Approvals',
    'Creating Tenders & Bidding Submissions',
    'Generating Client Sales Quotations (SQ)',
    'Recording Client Local Purchase Orders (LPO)',
    'Uploading Site Deliverables Evidence & Photos',
    'Generating QA/QC Inspection Forms & Site Visit Reports',
    'Issuing Subcontract Agreements & Handover Certificates',
    'Raising Supplier Requests for Quotation (RFQ)',
    'Raising Supplier Purchase Orders (PO)',
    'Logging Goods Received Notes (GRN) on Delivery',
    'Managing Store Stock Requisitions & Inventory',
    'Running AI 3-Way Match Verification (PO vs GRN vs Invoice)',
    'Processing Supplier Invoices & Processing Treasury Payments',
    'Monitoring Bank & M-Pesa Treasury Account Balances',
    'Drafting Standalone Corporate Letters & Memorandums'
  ]

  const handleToggleTask = (task) => {
    if (roleData.selectedTasks.includes(task)) {
      setRoleData({
        ...roleData,
        selectedTasks: roleData.selectedTasks.filter(t => t !== task)
      })
    } else {
      setRoleData({
        ...roleData,
        selectedTasks: [...roleData.selectedTasks, task]
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!roleData.name) {
      alert('Please enter a role name')
      return
    }

    if (roleData.selectedTasks.length === 0) {
      alert('Please select at least one task for this role')
      return
    }

    const roleId = roleData.name.toLowerCase().replace(/\s+/g, '_')
    const newRole = {
      id: roleId,
      name: roleData.name,
      badge: roleData.badge.includes(' ') ? roleData.badge : `👤 ${roleData.badge}`,
      color: roleData.color,
      description: roleData.description || `Custom role with ${roleData.selectedTasks.length} assigned responsibilities.`,
      tasks: roleData.selectedTasks
    }

    addCustomRole(newRole)
    alert(`Custom Role '${roleData.name}' created successfully! You can now assign users to this role.`)
    if (onSuccess) onSuccess(newRole)
    if (onClose) onClose()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontWeight: '700' }}>Role Title / Name *</label>
        <input 
          type="text" 
          className="form-control" 
          required 
          placeholder="e.g. Field QA/QC Inspector, Storekeeper, Commercial Estimator" 
          value={roleData.name} 
          onChange={e => setRoleData({...roleData, name: e.target.value})} 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: '700' }}>Role Badge Label *</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. 🔍 QA/QC Inspector" 
            value={roleData.badge} 
            onChange={e => setRoleData({...roleData, badge: e.target.value})} 
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: '700' }}>Badge Color</label>
          <input 
            type="color" 
            className="form-control" 
            style={{ height: '38px', padding: '0.2rem', cursor: 'pointer' }}
            value={roleData.color} 
            onChange={e => setRoleData({...roleData, color: e.target.value})} 
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontWeight: '700' }}>Role Scope & Description</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Brief description of this role's purpose..." 
          value={roleData.description} 
          onChange={e => setRoleData({...roleData, description: e.target.value})} 
        />
      </div>

      {/* TASK ALLOCATION CHECKBOXES */}
      <div>
        <label style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.65rem' }}>
          <ShieldCheck size={18} color={roleData.color} />
          Select & Allocate Tasks for this Role ({roleData.selectedTasks.length} Selected):
        </label>

        <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {availableTasksList.map((task, idx) => {
            const isChecked = roleData.selectedTasks.includes(task)
            return (
              <label 
                key={idx} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem', borderRadius: '6px', background: isChecked ? 'hsla(var(--primary), 0.08)' : '#ffffff', border: isChecked ? `1px solid ${roleData.color}` : '1px solid #e2e8f0', cursor: 'pointer', fontSize: '0.825rem', color: isChecked ? '#0f172a' : '#475569', fontWeight: isChecked ? '700' : '500', transition: 'all 0.15s' }}
              >
                <input 
                  type="checkbox" 
                  checked={isChecked} 
                  onChange={() => handleToggleTask(task)} 
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <span>{task}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontWeight: '800' }}>
          Save & Create Role
        </button>
      </div>
    </form>
  )
}
