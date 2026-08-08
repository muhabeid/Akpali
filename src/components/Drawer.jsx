import React from 'react'
import ReactDOM from 'react-dom'
import { X } from 'lucide-react'

export default function Drawer({ isOpen, onClose, title, children, onSubmit, submitText = 'Save', width, isModal = false }) {
  if (!isOpen) return null

  const content = isModal ? (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.82)', 
        backdropFilter: 'blur(8px)', 
        zIndex: 99999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '1rem'
      }} 
      onClick={onClose}
    >
      <div 
        style={{ 
          background: 'hsl(var(--bg-main))', 
          border: '1px solid hsl(var(--border))', 
          borderRadius: '12px', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', 
          width: '100%', 
          maxWidth: width || '750px', 
          maxHeight: '85vh', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER WITH PROMINENT CLOSE BUTTON */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--bg-panel))', flexShrink: 0 }}>
          <h3 style={{ margin: 0, color: 'hsl(var(--text-primary))', fontSize: '1.1rem', fontWeight: 'bold' }}>{title}</h3>
          <button 
            type="button"
            className="btn" 
            onClick={onClose} 
            style={{ 
              padding: '0.35rem 0.75rem', 
              background: '#ef4444', 
              color: '#fff', 
              borderRadius: '6px', 
              fontWeight: 'bold',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              border: 'none'
            }}
          >
            <X size={16} /> Close
          </button>
        </div>

        {/* BODY CONTENT */}
        <div style={{ padding: '1.5rem', flexGrow: 1, overflowY: 'auto' }}>
          {children}
        </div>

        {/* FOOTER BOTTOM ACTION BAR */}
        <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'hsl(var(--bg-panel))', flexShrink: 0 }}>
          <button 
            type="button" 
            className="btn" 
            onClick={onClose} 
            style={{ background: 'hsla(var(--border), 0.4)', border: '1px solid hsl(var(--border))', color: 'hsl(var(--text-primary))', fontWeight: 'bold', padding: '0.4rem 1.25rem' }}
          >
            Close Window
          </button>
          {onSubmit && (
            <button type="button" className="btn btn-primary" onClick={onSubmit}>{submitText}</button>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="drawer-overlay" style={{ zIndex: 99999 }} onClick={onClose}>
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
          {onSubmit && <button className="btn btn-primary" onClick={onSubmit}>{submitText}</button>}
        </div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(content, document.body)
}
