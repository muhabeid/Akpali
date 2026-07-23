import React, { useState, useEffect } from 'react'

const EXPENSE_CATEGORIES = {
  "Payroll and Benefits": ["Salaries & Wages", "Allowances", "Health Insurance", "Bonuses"],
  "Rent and Utilities": ["Office Rent", "Electricity & Water", "Internet & Communications"],
  "Project & Tender Fulfillment": ["Sourcing Materials (Goods)", "Subcontractor Payments", "Logistics & Transport", "Site Operations (Construction)", "Consultant Fees (Services)"],
  "Marketing and Advertising": ["Digital Marketing", "Print Media", "Event Sponsorship"],
  "Travel and Entertainment": ["Flights & Accommodation", "Fuel & Mileage", "Client Meals"],
  "Software and Subscriptions": ["SaaS Tools", "Software Licenses", "Cloud Hosting"],
  "Professional Services": ["Legal Fees", "Accounting & Audit", "Tax Consultancy"],
  "Office Supplies & Admin": ["Stationery", "Cleaning Services", "Repairs & Maintenance"]
};

const INCOME_CATEGORIES = [
  "Tender/Project Revenue (Milestone Payment)",
  "Tender/Project Revenue (Final Payment)",
  "General Pool - Direct Client Payment",
  "General Pool - Investment/Capital",
  "Refunds / Rebates"
];

export default function RecordTransactionForm() {
  const [accounts, setAccounts] = useState([])
  const [tenders, setTenders] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    id: `TRX-${Math.floor(Math.random() * 10000)}`,
    account_id: '',
    tender_id: '', // Empty string means General Pool
    type: 'Expense',
    amount: '',
    reference: ''
  })

  // Dynamic state for categorization
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [customNote, setCustomNote] = useState('') // Optional free text

  useEffect(() => {
    fetch('http://localhost:5000/api/treasury')
      .then(res => res.json())
      .then(data => setAccounts(data.accounts))
      .catch(err => console.error("Could not fetch accounts:", err))

    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => setTenders(data))
      .catch(err => console.error("Could not fetch tenders:", err))
  }, [])

  // Reset category selections if the Transaction Type changes
  useEffect(() => {
    setCategory('')
    setSubCategory('')
  }, [formData.type])

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.account_id) {
      alert("Please select a Source/Destination Account.");
      return;
    }
    if (!category) {
      alert("Please select a category.");
      return;
    }
    if (formData.type === 'Expense' && !subCategory) {
      alert("Please select a sub-category for the expense.");
      return;
    }

    setIsSubmitting(true);

    // Build the final "purpose" string for the database
    let finalPurpose = formData.type === 'Expense' ? `${category} - ${subCategory}` : category;
    if (customNote) finalPurpose += ` (${customNote})`;

    const payload = {
      ...formData,
      purpose: finalPurpose,
      // If "General Pool" is selected, tender_id remains an empty string which the backend maps to NULL
      tender_id: formData.tender_id === 'GENERAL_POOL' ? '' : formData.tender_id 
    }

    try {
      const res = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Transaction recorded successfully!');
        window.location.reload(); 
      } else {
        alert('Failed to record transaction');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Ensure backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. TRANSACTION BASICS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Transaction Type</label>
          <select className="form-control" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
            <option value="Income">Income (Money IN)</option>
            <option value="Expense">Expense (Money OUT)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Amount (USD)</label>
          <input type="number" className="form-control" placeholder="0.00" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
        </div>
      </div>

      <div className="form-group">
        <label>Account</label>
        <select className="form-control" required value={formData.account_id} onChange={e => setFormData({...formData, account_id: e.target.value})}>
          <option value="">Select Target Account...</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name} (Bal: ${acc.current_balance.toLocaleString()})</option>
          ))}
        </select>
      </div>

      <hr style={{ border: '0', borderTop: '1px solid hsla(var(--border), 0.5)', margin: '0.5rem 0' }} />

      {/* 2. CATEGORIZATION & PURPOSE */}
      {formData.type === 'Expense' ? (
        <div style={{ padding: '1rem', background: 'hsla(var(--danger), 0.05)', borderLeft: '4px solid hsl(var(--danger))', borderRadius: 'var(--radius-sm)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'hsl(var(--danger))' }}>Expense Classification</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Expense Category</label>
              <select className="form-control" required value={category} onChange={e => { setCategory(e.target.value); setSubCategory(''); }}>
                <option value="">Select Category...</option>
                {Object.keys(EXPENSE_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Sub-Category</label>
              <select className="form-control" required disabled={!category} value={subCategory} onChange={e => setSubCategory(e.target.value)}>
                <option value="">Select Sub-Category...</option>
                {category && EXPENSE_CATEGORIES[category].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '1rem', background: 'hsla(var(--success), 0.05)', borderLeft: '4px solid hsl(var(--success))', borderRadius: 'var(--radius-sm)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'hsl(var(--success))' }}>Income Source</h4>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Income Category</label>
            <select className="form-control" required value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select Category...</option>
              {INCOME_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 3. PROJECT LINKING & NOTES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Link to Project / Tender</label>
          <select className="form-control" required value={formData.tender_id} onChange={e => setFormData({...formData, tender_id: e.target.value})}>
            <option value="">-- Make a Selection --</option>
            <option value="GENERAL_POOL" style={{ fontWeight: 'bold' }}>Company General Pool (No Project)</option>
            <optgroup label="Active Projects/Tenders">
              {tenders.map(t => (
                <option key={t.id} value={t.id}>{t.id} - {t.name}</option>
              ))}
            </optgroup>
          </select>
          <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>
            Choose "General Pool" if this transaction is not related to fulfilling a specific tender.
          </p>
        </div>
        
        <div className="form-group">
          <label>Custom Note / Vendor Name (Optional)</label>
          <input type="text" className="form-control" placeholder="e.g. Paid to BuildMat Ltd via Check" value={customNote} onChange={e => setCustomNote(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label>Payment Reference (Optional)</label>
        <input type="text" className="form-control" placeholder="e.g. Check #, M-Pesa Transaction Code" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
        {isSubmitting ? 'Recording...' : `Record ${formData.type}`}
      </button>
    </form>
  )
}
