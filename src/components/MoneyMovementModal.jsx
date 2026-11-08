import React, { useState, useEffect } from 'react'
import { useCurrency } from '../context/CurrencyContext'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, X, CheckCircle2, AlertCircle } from 'lucide-react'

export default function MoneyMovementModal({ isOpen, onClose, initialAccountId = '', accounts = [], onSuccess }) {
  const { formatAmount } = useCurrency()
  const [tab, setTab] = useState('inward') // 'inward' | 'outward' | 'transfer'
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState(null)

  // Inward / Outward form state
  const [formData, setFormData] = useState({
    account_id: initialAccountId || '',
    amount: '',
    category: '',
    purpose: '',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Transfer form state
  const [transferData, setTransferData] = useState({
    from_account_id: initialAccountId || '',
    to_account_id: '',
    amount: '',
    purpose: 'Petty Cash Imprest Replenishment',
    reference: `XFER-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (initialAccountId) {
      setFormData(prev => ({ ...prev, account_id: initialAccountId }))
      setTransferData(prev => ({ ...prev, from_account_id: initialAccountId }))
    } else if (accounts.length > 0) {
      setFormData(prev => ({ ...prev, account_id: prev.account_id || accounts[0].id }))
      setTransferData(prev => ({ 
        ...prev, 
        from_account_id: prev.from_account_id || accounts[0].id,
        to_account_id: prev.to_account_id || (accounts[1] ? accounts[1].id : '')
      }))
    }
  }, [initialAccountId, accounts])

  if (!isOpen) return null

  const handleInwardOutwardSubmit = async (e) => {
    e.preventDefault()
    if (!formData.account_id) return alert('Please select an account.')
    const amountNum = parseFloat(formData.amount)
    if (!amountNum || amountNum <= 0) return alert('Please enter a valid amount greater than 0.')

    setLoading(true)
    setStatusMsg(null)

    try {
      const payload = {
        account_id: formData.account_id,
        type: tab === 'inward' ? 'Income' : 'Expense',
        amount: amountNum,
        purpose: formData.category ? `[${formData.category}] ${formData.purpose}` : formData.purpose,
        reference: formData.reference || `${tab === 'inward' ? 'DEP' : 'DISB'}-${Date.now().toString().slice(-4)}`
      }

      const res = await fetch('http://localhost:5000/api/accounts/money-movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok) {
        setStatusMsg({ type: 'success', text: data.message || 'Money movement processed successfully!' })
        window.dispatchEvent(new Event('refreshCorporateHub'))
        setTimeout(() => {
          if (onSuccess) onSuccess()
          onClose()
        }, 1200)
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to process movement' })
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Network error processing movement' })
    } finally {
      setLoading(false)
    }
  }

  const handleTransferSubmit = async (e) => {
    e.preventDefault()
    if (!transferData.from_account_id || !transferData.to_account_id) {
      return alert('Please select both source and destination accounts.')
    }
    if (transferData.from_account_id === transferData.to_account_id) {
      return alert('Source and destination accounts must be different.')
    }
    const amountNum = parseFloat(transferData.amount)
    if (!amountNum || amountNum <= 0) return alert('Please enter a valid transfer amount.')

    setLoading(true)
    setStatusMsg(null)

    try {
      const res = await fetch('http://localhost:5000/api/accounts/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transferData,
          amount: amountNum
        })
      })

      const data = await res.json()
      if (res.ok) {
        setStatusMsg({ type: 'success', text: data.message || 'Transfer completed successfully!' })
        window.dispatchEvent(new Event('refreshCorporateHub'))
        setTimeout(() => {
          if (onSuccess) onSuccess()
          onClose()
        }, 1200)
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Transfer failed' })
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Network error during transfer' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card" style={{ width: '620px', maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', background: 'var(--bg-card)', border: '2px solid hsl(var(--primary))', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', borderRadius: '12px', padding: '1.75rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'hsl(var(--primary))', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeftRight size={22} /> Money Movement & Fund Approvals
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginTop: '0.2rem' }}>
              Real-time update across Bank Accounts, M-Pesa Till & Office Petty Cash
            </div>
          </div>
          <button type="button" className="btn" style={{ background: 'transparent', padding: '0.4rem', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem', background: 'hsla(var(--border), 0.25)', padding: '0.35rem', borderRadius: '8px' }}>
          <button
            type="button"
            className="btn"
            onClick={() => { setTab('inward'); setStatusMsg(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              padding: '0.6rem 0.5rem',
              border: 'none',
              borderRadius: '6px',
              background: tab === 'inward' ? '#16a34a' : 'transparent',
              color: tab === 'inward' ? '#ffffff' : 'hsl(var(--text-secondary))',
              cursor: 'pointer'
            }}
          >
            <ArrowDownLeft size={16} /> 📥 Money In (Receipt)
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => { setTab('outward'); setStatusMsg(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              padding: '0.6rem 0.5rem',
              border: 'none',
              borderRadius: '6px',
              background: tab === 'outward' ? '#dc2626' : 'transparent',
              color: tab === 'outward' ? '#ffffff' : 'hsl(var(--text-secondary))',
              cursor: 'pointer'
            }}
          >
            <ArrowUpRight size={16} /> 📤 Money Out (Disbursed)
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => { setTab('transfer'); setStatusMsg(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              padding: '0.6rem 0.5rem',
              border: 'none',
              borderRadius: '6px',
              background: tab === 'transfer' ? '#0284c7' : 'transparent',
              color: tab === 'transfer' ? '#ffffff' : 'hsl(var(--text-secondary))',
              cursor: 'pointer'
            }}
          >
            <ArrowLeftRight size={16} /> 🔁 Transfer / Top-Up
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            background: statusMsg.type === 'success' ? 'hsla(var(--success), 0.15)' : 'hsla(var(--danger), 0.15)',
            color: statusMsg.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--danger))',
            border: `1px solid ${statusMsg.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--danger))'}`,
            fontSize: '0.875rem'
          }}>
            {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* INWARD OR OUTWARD FORM */}
        {(tab === 'inward' || tab === 'outward') && (
          <form onSubmit={handleInwardOutwardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div style={{ padding: '0.75rem 1rem', background: tab === 'inward' ? 'hsla(142, 70%, 45%, 0.1)' : 'hsla(0, 84%, 60%, 0.1)', borderLeft: `4px solid ${tab === 'inward' ? '#16a34a' : '#dc2626'}`, borderRadius: '4px', fontSize: '0.825rem' }}>
              <strong>{tab === 'inward' ? '📥 Inward Movement (Incoming Funds / Receipt):' : '📤 Outward Movement (Disbursement / Petty Cash Expense):'}</strong>
              <div style={{ marginTop: '0.2rem', color: 'hsl(var(--text-secondary))' }}>
                {tab === 'inward' 
                  ? 'Increases the selected Bank, M-Pesa, or Petty Cash balance immediately, logs transaction in Treasury, and syncs double-entry GL.'
                  : 'Deducts from the selected Bank, M-Pesa, or Petty Cash balance immediately, logs transaction in Treasury, and syncs double-entry GL.'}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Target Account *</label>
              <select 
                className="form-control" 
                required 
                value={formData.account_id} 
                onChange={e => setFormData({ ...formData, account_id: e.target.value })}
              >
                <option value="">-- Choose Account --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.type === 'Bank' ? '🏦' : acc.type === 'Mobile Money' ? '📱' : '💵'} {acc.name} ({acc.type}) — Bal: {formatAmount(acc.current_balance || 0)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Amount (KES) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  className="form-control" 
                  required 
                  placeholder="e.g. 25000" 
                  value={formData.amount} 
                  onChange={e => setFormData({ ...formData, amount: e.target.value })} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Entry Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.date} 
                  onChange={e => setFormData({ ...formData, date: e.target.value })} 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Category / Source *</label>
              {tab === 'inward' ? (
                <select 
                  className="form-control" 
                  required 
                  value={formData.category} 
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">-- Select Inward Source --</option>
                  <option value="Client Payment Receipt">Client Payment / Invoice Receipt</option>
                  <option value="Tender Mobilization Advance">Tender Mobilization Advance</option>
                  <option value="Director / Capital Injection">Director / Capital Injection</option>
                  <option value="Refund / Reversal">Vendor Refund / Bank Reversal</option>
                  <option value="Cash Deposit">Direct Cash / Cheque Deposit</option>
                  <option value="Other Inflow">Other Income</option>
                </select>
              ) : (
                <select 
                  className="form-control" 
                  required 
                  value={formData.category} 
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">-- Select Expense / Outward Reason --</option>
                  <option value="Office Petty Cash Expense">Office Petty Cash Voucher</option>
                  <option value="Site Logistics & Transport">Site Logistics & Fuel / Transport</option>
                  <option value="Supplier / Vendor Payment">Supplier / Vendor Disbursement</option>
                  <option value="Site Operations & Labor">Site Operations & Casual Labor</option>
                  <option value="Rent & Utilities">Rent, Power & Internet Utilities</option>
                  <option value="Statutory Fees & Taxes">Statutory Taxes, County & Tender Fees</option>
                  <option value="Direct Operational Cost">Direct Operational Cost</option>
                </select>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Description / Purpose *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder={tab === 'inward' ? 'e.g. Milestone 1 payment for Supply Contract' : 'e.g. Fuel for generator and dispatch courier'} 
                  value={formData.purpose} 
                  onChange={e => setFormData({ ...formData, purpose: e.target.value })} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Ref / Code</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. MPESA-Q48B or CHQ-001" 
                  value={formData.reference} 
                  onChange={e => setFormData({ ...formData, reference: e.target.value })} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
              <button type="button" className="btn" onClick={onClose} disabled={loading} style={{ background: 'transparent', border: '1px solid hsl(var(--border))' }}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn" 
                disabled={loading}
                style={{
                  background: tab === 'inward' ? '#16a34a' : '#dc2626',
                  color: '#ffffff',
                  fontWeight: '700',
                  padding: '0.65rem 1.5rem',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? 'Processing...' : tab === 'inward' ? '📥 Confirm & Deposit Funds' : '📤 Authorize & Disburse Funds'}
              </button>
            </div>
          </form>
        )}

        {/* TRANSFER FORM */}
        {tab === 'transfer' && (
          <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div style={{ padding: '0.75rem 1rem', background: 'hsla(199, 89%, 48%, 0.1)', borderLeft: '4px solid #0284c7', borderRadius: '4px', fontSize: '0.825rem' }}>
              <strong>🔁 Internal Account Transfer & Petty Cash Replenishment:</strong>
              <div style={{ marginTop: '0.2rem', color: 'hsl(var(--text-secondary))' }}>
                Moves liquidity between accounts (e.g. Bank to Petty Cash imprest top-up, Bank to M-Pesa float, or M-Pesa sweep to Bank). Both account balances update simultaneously.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Source Account (From) *</label>
                <select 
                  className="form-control" 
                  required 
                  value={transferData.from_account_id} 
                  onChange={e => setTransferData({ ...transferData, from_account_id: e.target.value })}
                >
                  <option value="">-- Deduct From --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === transferData.to_account_id}>
                      {acc.type === 'Bank' ? '🏦' : acc.type === 'Mobile Money' ? '📱' : '💵'} {acc.name} ({formatAmount(acc.current_balance || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Destination Account (To) *</label>
                <select 
                  className="form-control" 
                  required 
                  value={transferData.to_account_id} 
                  onChange={e => setTransferData({ ...transferData, to_account_id: e.target.value })}
                >
                  <option value="">-- Credit To --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === transferData.from_account_id}>
                      {acc.type === 'Bank' ? '🏦' : acc.type === 'Mobile Money' ? '📱' : '💵'} {acc.name} ({formatAmount(acc.current_balance || 0)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Transfer Amount (KES) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  className="form-control" 
                  required 
                  placeholder="e.g. 10000" 
                  value={transferData.amount} 
                  onChange={e => setTransferData({ ...transferData, amount: e.target.value })} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Transfer Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={transferData.date} 
                  onChange={e => setTransferData({ ...transferData, date: e.target.value })} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Transfer Purpose / Reason *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. Office Petty Cash Weekly Float Top-Up" 
                  value={transferData.purpose} 
                  onChange={e => setTransferData({ ...transferData, purpose: e.target.value })} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '700', fontSize: '0.85rem' }}>Reference Code</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. CHQ-9921 or TRF-102" 
                  value={transferData.reference} 
                  onChange={e => setTransferData({ ...transferData, reference: e.target.value })} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
              <button type="button" className="btn" onClick={onClose} disabled={loading} style={{ background: 'transparent', border: '1px solid hsl(var(--border))' }}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn" 
                disabled={loading}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: '700',
                  padding: '0.65rem 1.5rem',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? 'Executing Transfer...' : '🔁 Complete Inter-Account Transfer'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
