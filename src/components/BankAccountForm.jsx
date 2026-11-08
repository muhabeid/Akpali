import React, { useState, useEffect } from 'react'

export default function BankAccountForm({ onSuccess, accountToEdit = null }) {
  const [formData, setFormData] = useState({
    id: accountToEdit ? accountToEdit.id : `ACC-${Math.floor(Math.random() * 10000)}`,
    name: accountToEdit ? accountToEdit.name : '',
    type: accountToEdit ? accountToEdit.type : 'Bank',
    account_number: accountToEdit ? (accountToEdit.account_number || '') : '',
    branch: accountToEdit ? (accountToEdit.branch || '') : '',
    account_name: accountToEdit ? (accountToEdit.account_name || '') : '',
    swift_code: accountToEdit ? (accountToEdit.swift_code || '') : '',
    currency: accountToEdit ? (accountToEdit.currency || 'KES') : 'KES',
    current_balance: accountToEdit ? Number(accountToEdit.current_balance) || 0 : 0,
    bank_contact: accountToEdit ? (accountToEdit.bank_contact || '') : ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (accountToEdit) {
      setFormData({
        id: accountToEdit.id,
        name: accountToEdit.name || '',
        type: accountToEdit.type || 'Bank',
        account_number: accountToEdit.account_number || '',
        branch: accountToEdit.branch || '',
        account_name: accountToEdit.account_name || '',
        swift_code: accountToEdit.swift_code || '',
        currency: accountToEdit.currency || 'KES',
        current_balance: Number(accountToEdit.current_balance) || 0,
        bank_contact: accountToEdit.bank_contact || ''
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Bank / Institution Name *</label>
          <input 
            type="text" 
            className="form-control" 
            required 
            placeholder="e.g. I & M Bank, KCB Bank, Equity Bank" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Account Type *</label>
          <select 
            className="form-control" 
            required 
            value={formData.type} 
            onChange={e => setFormData({...formData, type: e.target.value})}
          >
            <option value="Bank">Bank Account</option>
            <option value="Mobile Money">Mobile Money (M-Pesa/Till)</option>
            <option value="Cash">Petty Cash</option>
            <option value="Escrow">Escrow Account</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
            {formData.type === 'Mobile Money' ? 'Till / Paybill / Phone Number *' : 'Bank Account Number *'}
          </label>
          <input 
            type="text" 
            className="form-control" 
            required={formData.type === 'Bank'} 
            placeholder={formData.type === 'Mobile Money' ? 'e.g. 522522 or Till 123456' : 'e.g. 012019482910'} 
            value={formData.account_number} 
            onChange={e => setFormData({...formData, account_number: e.target.value})} 
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Branch Name</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. Upper Hill Branch" 
            value={formData.branch} 
            onChange={e => setFormData({...formData, branch: e.target.value})} 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Account Name / Beneficiary Title</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. Akpali Enterprises Ltd" 
            value={formData.account_name} 
            onChange={e => setFormData({...formData, account_name: e.target.value})} 
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>SWIFT / BIC Code</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. IMBLKENA" 
            value={formData.swift_code} 
            onChange={e => setFormData({...formData, swift_code: e.target.value.toUpperCase()})} 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Settlement Currency</label>
          <select 
            className="form-control" 
            value={formData.currency} 
            onChange={e => setFormData({...formData, currency: e.target.value})}
          >
            <option value="KES">KES (Kenya Shilling)</option>
            <option value="USD">USD (US Dollar)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="GBP">GBP (British Pound)</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Current Balance</label>
          <input 
            type="number" 
            step="0.01" 
            className="form-control" 
            value={formData.current_balance} 
            onChange={e => setFormData({...formData, current_balance: parseFloat(e.target.value) || 0})} 
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Bank Contact / Tender Settlement Notes</label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="e.g. Branch Relationship Manager, Tel, Email (optional)" 
          value={formData.bank_contact} 
          onChange={e => setFormData({...formData, bank_contact: e.target.value})} 
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={isSubmitting} 
          style={{ background: '#4A8BCE', border: 'none', padding: '0.6rem 1.5rem', fontWeight: 'bold' }}
        >
          {isSubmitting ? 'Saving...' : (accountToEdit && !accountToEdit.isNew ? 'Update Account Details' : 'Save Account')}
        </button>
      </div>
    </form>
  )
}