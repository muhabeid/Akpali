import React from 'react'
import { X } from 'lucide-react'

export default function Drawer({ isOpen, onClose, title, children, onSubmit, submitText = 'Save', width }) {
  if (!isOpen) return null

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" style={width ? { maxWidth: width } : {}} onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn" onClick={onClose} style={{ padding: '0.25rem', background: 'transparent', color: 'hsl(var(--text-secondary))' }}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer-body">
          {children}
        </div>
        <div className="drawer-footer">
          <button className="btn" onClick={onClose} style={{ background: 'transparent', border: '1px solid hsl(var(--border))' }}>Cancel</button>
          <button className="btn btn-primary" onClick={onSubmit}>{submitText}</button>
        </div>
      </div>
    </div>
  )
}
