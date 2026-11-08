import React, { useRef, useState, useEffect } from 'react'
import { PenTool, Trash2, Check, X, ShieldCheck } from 'lucide-react'

export default function DigitalSignatureModal({ isOpen, onClose, onSave, initialSignature }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [penColor, setPenColor] = useState('#002060') // Formal legal navy blue
  const [penWidth, setPenWidth] = useState(2.5)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasDrawn(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Get coordinates relative to canvas
  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = penColor
    ctx.lineWidth = penWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    const ctx = canvasRef.current.getContext('2d')
    ctx.closePath()
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleAdoptSignature = async () => {
    if (!hasDrawn && !initialSignature) {
      alert('Please draw your signature inside the box before saving.')
      return
    }

    setIsSaving(true)
    try {
      const canvas = canvasRef.current
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSaving(false)
          return
        }

        const formData = new FormData()
        formData.append('file', blob, `signature-${Date.now()}.png`)

        const res = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          body: formData
        })

        if (res.ok) {
          const data = await res.json()
          if (onSave) onSave(data.fileUrl)
          onClose()
        } else {
          // Fallback to base64 DataURL
          const dataUrl = canvas.toDataURL('image/png')
          if (onSave) onSave(dataUrl)
          onClose()
        }
        setIsSaving(false)
      }, 'image/png')
    } catch (err) {
      console.error('Error saving signature:', err)
      const dataUrl = canvasRef.current.toDataURL('image/png')
      if (onSave) onSave(dataUrl)
      onClose()
      setIsSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '1.5rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '580px', background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', color: '#0f172a' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <PenTool size={20} /> Draw Authorized Digital Signature
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Use your mouse, trackpad, or finger/stylus to sign within the designated box.
            </p>
          </div>
          <button className="btn" style={{ padding: '0.25rem 0.5rem', border: 'none', background: '#f1f5f9', cursor: 'pointer', borderRadius: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* CONTROLS (COLOR & THICKNESS) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: '600', color: '#475569' }}>Pen Ink:</span>
            {[
              { label: 'Legal Navy', color: '#002060' },
              { label: 'Executive Black', color: '#000000' },
              { label: 'Classic Blue', color: '#0284c7' }
            ].map((p, idx) => (
              <button 
                key={idx}
                type="button"
                onClick={() => setPenColor(p.color)}
                style={{ width: '22px', height: '22px', borderRadius: '50%', background: p.color, border: penColor === p.color ? '2px solid #38bdf8' : '2px solid transparent', cursor: 'pointer', padding: 0 }}
                title={p.label}
              />
            ))}
          </div>

          <button 
            type="button" 
            onClick={clearCanvas} 
            className="btn" 
            style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Trash2 size={13} /> Clear Canvas
          </button>
        </div>

        {/* CANVAS DRAWING PAD */}
        <div style={{ border: '2px dashed #94a3b8', borderRadius: '8px', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
          <canvas 
            ref={canvasRef}
            width={520}
            height={200}
            style={{ width: '100%', height: '200px', cursor: 'crosshair', display: 'block', touchAction: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div style={{ position: 'absolute', bottom: '10px', left: '15px', pointerEvents: 'none', fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ShieldCheck size={14} color="#0284c7" />
            <span>Authorized Corporate Signatory Line</span>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button type="button" className="btn" style={{ padding: '0.55rem 1rem' }} onClick={onClose}>
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            disabled={isSaving || !hasDrawn}
            onClick={handleAdoptSignature}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem', fontWeight: '700' }}
          >
            <Check size={16} /> {isSaving ? 'Saving Signature...' : 'Adopt & Apply Signature'}
          </button>
        </div>

      </div>
    </div>
  )
}
