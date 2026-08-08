import React, { useState, useEffect } from 'react'

export default function BankAccountForm({ onSuccess, accountToEdit = null }) {
  const [formData, setFormData] = useState({
    id: accountToEdit ? accountToEdit.id : `ACC-${Math.floor(Math.random() * 10000)}`,
    name: accountToEdit ? accountToEdit.name : '',
    type: accountToEdit ? accountToEdit.type : 'Bank',
    current_balance: accountToEdit ? Number(accountToEdit.current_balance) || 0 : 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (accountToEdit) {
      setFormData({
        id: accountToEdit.id,
        name: accountToEdit.name || '',
        type: accountToEdit.type || 'Bank',
        current_balance: Number(accountToEdit.current_balance) || 0
      })
    }
  }, [accountToEdit])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert(`Bank account '${formData.name}' ${accountToEdit ? 'updated' : 'saved'} successfully!`);
        window.dispatchEvent(new Event('refreshCorporateHub'));
        if (onSuccess) onSuccess();
      } else {
        alert('Failed to save bank account');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving bank account');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontWeight: 'bold' }}>Account Name *</label>
        <input type="text" className="form-control" required placeholder="e.g. KCB Main Operations" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold' }}>Account Type *</label>
          <select className="form-control" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
            <option value="Bank">Bank Account</option>
            <option value="Mobile Money">Mobile Money (M-Pesa/Till)</option>
            <option value="Cash">Petty Cash</option>
            <option value="Escrow">Escrow Account</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold' }}>Current Balance (KSh)</label>
          <input type="number" step="0.01" className="form-control" value={formData.current_balance} onChange={e => setFormData({...formData, current_balance: parseFloat(e.target.value) || 0})} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ background: '#4A8BCE', border: 'none', padding: '0.6rem 1.5rem', fontWeight: 'bold' }}>
          {isSubmitting ? 'Saving...' : (accountToEdit ? 'Update Account' : 'Save Account')}
        </button>
      </div>
    </form>
  )
}
