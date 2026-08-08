import React, { useState, useEffect } from 'react'
import { useCurrency } from '../context/CurrencyContext'
import { BookOpen, FileSpreadsheet, Scale, Receipt, Clock, Plus, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

export default function BookkeepingHub() {
  const { formatAmount } = useCurrency()
  const [activeTab, setActiveTab] = useState('reports') // 'reports' | 'journals' | 'vat' | 'aging' | 'coa'

  // Data states
  const [accounts, setAccounts] = useState([])
  const [journals, setJournals] = useState([])
  const [trialBalance, setTrialBalance] = useState(null)
  const [pnl, setPnl] = useState(null)
  const [balanceSheet, setBalanceSheet] = useState(null)
  const [vatLedger, setVatLedger] = useState(null)
  const [aging, setAging] = useState(null)
  const [erpDocs, setErpDocs] = useState([])
  const [loading, setLoading] = useState(true)

  // Journal Entry Form State & Mode ('debit' | 'credit')
  const [showJournalForm, setShowJournalForm] = useState(false)
  const [entryMode, setEntryMode] = useState('debit') 

  const [journalMeta, setJournalMeta] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    reference: '',
    description: ''
  })

  // Multi-Line Debit Form Items (Used when entryMode === 'debit')
  const [debitLines, setDebitLines] = useState([
    { category: '🛒 Expense / Direct Materials / Site Supplies', account_code: '5000', amount: 0, memo: '' }
  ])
  const [balancingCreditAccount, setBalancingCreditAccount] = useState('1010')

  // Multi-Line Credit Form Items (Used when entryMode === 'credit')
  const [creditLines, setCreditLines] = useState([
    { category: '📈 Revenue Earned / Sales Invoice', account_code: '4000', amount: 0, memo: '' }
  ])
  const [balancingDebitAccount, setBalancingDebitAccount] = useState('1010')

  const [isCustomRef, setIsCustomRef] = useState(false)

  const loadAllBookkeepingData = async () => {
    setLoading(true)
    try {
      const [accRes, jrnRes, tbRes, pnlRes, bsRes, vatRes, agingRes, invRes, poRes, tenderRes] = await Promise.all([
        fetch('http://localhost:5000/api/bookkeeping/accounts').then(r => r.json()),
        fetch('http://localhost:5000/api/bookkeeping/journals').then(r => r.json()),
        fetch('http://localhost:5000/api/bookkeeping/trial-balance').then(r => r.json()),
        fetch('http://localhost:5000/api/bookkeeping/profit-and-loss').then(r => r.json()),
        fetch('http://localhost:5000/api/bookkeeping/balance-sheet').then(r => r.json()),
        fetch('http://localhost:5000/api/bookkeeping/vat-ledger').then(r => r.json()),
        fetch('http://localhost:5000/api/bookkeeping/aging').then(r => r.json()),
        fetch('http://localhost:5000/api/supplier_invoices').then(r => r.json()).catch(() => []),
        fetch('http://localhost:5000/api/pos').then(r => r.json()).catch(() => []),
        fetch('http://localhost:5000/api/tenders').then(r => r.json()).catch(() => [])
      ])

      setAccounts(Array.isArray(accRes) ? accRes : [])
      setJournals(Array.isArray(jrnRes) ? jrnRes : [])
      setTrialBalance(tbRes)
      setPnl(pnlRes)
      setBalanceSheet(bsRes)
      setVatLedger(vatRes)
      setAging(agingRes)

      // Identify closed/completed tender IDs to strictly exclude their documents
      const closedTenderIds = new Set(
        Array.isArray(tenderRes) 
          ? tenderRes.filter(t => t.status === 'Closed' || t.status === 'Completed' || t.status === 'Rejected').map(t => t.id)
          : []
      )

      // Filter active ERP documents (exclude docs tied to closed tenders)
      const activeInvoices = Array.isArray(invRes) 
        ? invRes.filter(i => !i.tender_id || !closedTenderIds.has(i.tender_id))
        : []

      const activePOs = Array.isArray(poRes)
        ? poRes.filter(p => p.status !== 'Delivered' && (!p.tender_id || !closedTenderIds.has(p.tender_id)))
        : []

      const mergedDocs = [
        ...activeInvoices.map(i => ({ id: i.id, label: `Supplier Invoice ${i.id} - ${i.supplier_name || 'Supplier'} (${formatAmount(i.amount)})`, type: 'Supplier Invoice', amount: i.amount })),
        ...activePOs.map(p => ({ id: p.id, label: `Purchase Order ${p.id} - ${p.supplier_name || 'PO'} (${formatAmount(p.total_value)})`, type: 'Purchase Order', amount: p.total_value }))
      ]
      setErpDocs(mergedDocs)
    } catch(err) {
      console.error('Error loading bookkeeping data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllBookkeepingData()
  }, [])

  // Auto-switch tab handler: Hides journal form when navigating away from General Ledger
  const handleTabSwitch = (tabId) => {
    setActiveTab(tabId)
    if (tabId !== 'journals') {
      setShowJournalForm(false)
    }
  }

  // Debit Category Options
  const debitCategoryOptions = [
    { label: '🛒 Expense / Direct Materials / Site Supplies', defaultAccount: '5000' },
    { label: '🏦 Asset Purchase / Cash Deposit / Bank Inflow', defaultAccount: '1010' },
    { label: '📑 Client Billing / Accounts Receivable (AR)', defaultAccount: '1020' },
    { label: '⚖️ Debt Reduction / Liability Payment (AP)', defaultAccount: '2000' }
  ]

  // Credit Category Options
  const creditCategoryOptions = [
    { label: '📈 Revenue Earned / Sales Invoice', defaultAccount: '4000' },
    { label: '💳 Bank / Cash / M-Pesa Payment Out', defaultAccount: '1010' },
    { label: '🧾 Supplier Invoice Owed (Accounts Payable)', defaultAccount: '2000' },
    { label: '🏛️ Shareholder Capital / Equity Inflow', defaultAccount: '3000' }
  ]

  // Multi-Debit Handlers
  const handleAddDebitLine = () => {
    setDebitLines(prev => [...prev, { category: '🛒 Expense / Direct Materials / Site Supplies', account_code: '5000', amount: 0, memo: '' }])
  }

  const handleRemoveDebitLine = (idx) => {
    if (debitLines.length > 1) {
      setDebitLines(prev => prev.filter((_, i) => i !== idx))
    }
  }

  // Multi-Credit Handlers
  const handleAddCreditLine = () => {
    setCreditLines(prev => [...prev, { category: '📈 Revenue Earned / Sales Invoice', account_code: '4000', amount: 0, memo: '' }])
  }

  const handleRemoveCreditLine = (idx) => {
    if (creditLines.length > 1) {
      setCreditLines(prev => prev.filter((_, i) => i !== idx))
    }
  }

  // Calculate total amount based on active mode
  const totalAmount = entryMode === 'debit'
    ? debitLines.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    : creditLines.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  const isValidAmount = totalAmount > 0

  const handlePostJournal = async (e) => {
    e.preventDefault()

    if (!isValidAmount) {
      alert(`⚠️ Please enter a non-zero amount for your journal entry lines.`)
      return
    }

    let formattedItems = []

    if (entryMode === 'debit') {
      // User is recording 1 or more Debits -> 1 Balancing Credit
      formattedItems = [
        ...debitLines.map(d => ({
          account_code: d.account_code,
          debit: Number(d.amount) || 0,
          credit: 0,
          memo: `[${d.category}] ${d.memo || ''}`.trim()
        })),
        {
          account_code: balancingCreditAccount,
          debit: 0,
          credit: totalAmount,
          memo: `Balancing Credit Offset for ${debitLines.length} debit line(s)`
        }
      ]
    } else {
      // User is recording 1 or more Credits -> 1 Balancing Debit
      formattedItems = [
        {
          account_code: balancingDebitAccount,
          debit: totalAmount,
          credit: 0,
          memo: `Balancing Debit Offset for ${creditLines.length} credit line(s)`
        },
        ...creditLines.map(c => ({
          account_code: c.account_code,
          debit: 0,
          credit: Number(c.amount) || 0,
          memo: `[${c.category}] ${c.memo || ''}`.trim()
        }))
      ]
    }

    const payload = {
      entry_date: journalMeta.entry_date,
      reference: journalMeta.reference,
      description: journalMeta.description || `${entryMode.toUpperCase()} Journal Entry`,
      items: formattedItems
    }

    try {
      const res = await fetch('http://localhost:5000/api/bookkeeping/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      if (res.ok) {
        alert(`✅ Journal Entry ${result.journal_id} posted successfully!`)
        setShowJournalForm(false)
        setDebitLines([{ category: '🛒 Expense / Direct Materials / Site Supplies', account_code: '5000', amount: 0, memo: '' }])
        setCreditLines([{ category: '📈 Revenue Earned / Sales Invoice', account_code: '4000', amount: 0, memo: '' }])
        setJournalMeta({
          entry_date: new Date().toISOString().split('T')[0],
          reference: '',
          description: ''
        })
        loadAllBookkeepingData()
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch(err) {
      alert('Failed to post journal entry')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* MODULE TITLE HEADER */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BookOpen size={24} /> Corporate Bookkeeping & General Ledger Hub
            </h2>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              GAAP/IFRS Double-Entry Accounting, Trial Balance Audit, KRA 16% VAT Ledger & Financial Statements
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn" onClick={loadAllBookkeepingData} style={{ background: '#334155', color: '#fff' }}>
              <RefreshCw size={16} /> Refresh Ledgers
            </button>
            <button className="btn btn-primary" onClick={() => { setActiveTab('journals'); setShowJournalForm(true); }}>
              <Plus size={16} /> + Post Journal Entry
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS (FIT CLEANLY WITHOUT SLIDER SCROLLING) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', borderBottom: '2px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
        {[
          { id: 'reports', label: '📊 Financial Statements', icon: FileSpreadsheet },
          { id: 'journals', label: '📑 General Ledger', icon: BookOpen },
          { id: 'vat', label: '⚖️ KRA 16% VAT Ledger', icon: Scale },
          { id: 'aging', label: '⏳ AR & AP Debt Aging', icon: Clock },
          { id: 'coa', label: '🏦 Chart of Accounts', icon: Receipt }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.65rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                borderBottom: isActive ? '3px solid hsl(var(--primary))' : 'none',
                background: isActive ? 'hsla(var(--primary), 0.12)' : 'hsla(var(--border), 0.15)',
                fontWeight: isActive ? '800' : '600',
                color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))',
                cursor: 'pointer',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* TAB 1: FINANCIAL STATEMENTS (P&L, BALANCE SHEET, TRIAL BALANCE) */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* STATS OVERVIEW CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value" style={{ color: '#10b981' }}>{formatAmount(pnl?.total_revenue || 0)}</span>
            </div>
            <div className="card">
              <span className="stat-label">Total Operating Expenses</span>
              <span className="stat-value" style={{ color: '#f43f5e' }}>{formatAmount(pnl?.total_expenses || 0)}</span>
            </div>
            <div className="card">
              <span className="stat-label">Net Profit / Margin</span>
              <span className="stat-value" style={{ color: (pnl?.net_profit || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                {formatAmount(pnl?.net_profit || 0)} ({pnl?.net_margin_pct || 0}%)
              </span>
            </div>
            <div className="card">
              <span className="stat-label">Total Corporate Assets</span>
              <span className="stat-value" style={{ color: '#38bdf8' }}>{formatAmount(balanceSheet?.total_assets || 0)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            
            {/* PROFIT & LOSS STATEMENT */}
            <div className="card">
              <h3 style={{ borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'hsl(var(--primary))' }}>
                📈 Profit & Loss Statement (Income Statement)
              </h3>
              
              <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.875rem', color: '#10b981' }}>Operating Revenues</h4>
              <table style={{ width: '100%', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <tbody>
                  {pnl?.revenues?.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid hsla(var(--border), 0.4)' }}>
                      <td style={{ padding: '0.4rem 0' }}>{r.account_code} - {r.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>{formatAmount(Math.abs(r.current_balance))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.875rem', color: '#f43f5e' }}>Operating Expenses</h4>
              <table style={{ width: '100%', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <tbody>
                  {pnl?.expenses?.map((e, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid hsla(var(--border), 0.4)' }}>
                      <td style={{ padding: '0.4rem 0' }}>{e.account_code} - {e.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>{formatAmount(Math.abs(e.current_balance))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ background: 'hsla(var(--primary), 0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid hsl(var(--primary))', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                <span>NET OPERATING PROFIT:</span>
                <span style={{ color: (pnl?.net_profit || 0) >= 0 ? '#10b981' : '#f43f5e' }}>{formatAmount(pnl?.net_profit || 0)}</span>
              </div>
            </div>

            {/* BALANCE SHEET STATEMENT */}
            <div className="card">
              <h3 style={{ borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#38bdf8' }}>
                🏛️ Corporate Balance Sheet (Assets = Liabilities + Equity)
              </h3>

              <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.875rem', color: '#38bdf8' }}>Total Corporate Assets</h4>
              <table style={{ width: '100%', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <tbody>
                  {balanceSheet?.assets?.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid hsla(var(--border), 0.4)' }}>
                      <td style={{ padding: '0.4rem 0' }}>{a.account_code} - {a.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>{formatAmount(Math.abs(a.current_balance))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.875rem', color: '#f59e0b' }}>Liabilities & Shareholder Equity</h4>
              <table style={{ width: '100%', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <tbody>
                  {balanceSheet?.liabilities?.map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid hsla(var(--border), 0.4)' }}>
                      <td style={{ padding: '0.4rem 0' }}>{l.account_code} - {l.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>{formatAmount(Math.abs(l.current_balance))}</td>
                    </tr>
                  ))}
                  {balanceSheet?.equity?.map((eq, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid hsla(var(--border), 0.4)' }}>
                      <td style={{ padding: '0.4rem 0' }}>{eq.account_code} - {eq.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>{formatAmount(Math.abs(eq.current_balance))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ background: 'hsla(var(--success), 0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                <span>TOTAL ASSETS EQUAL BALANCE:</span>
                <span style={{ color: '#10b981' }}>{formatAmount(balanceSheet?.total_assets || 0)}</span>
              </div>
            </div>

          </div>

          {/* TRIAL BALANCE AUDIT TABLE */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0 }}>Trial Balance Audit Ledger</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: 'hsl(var(--text-secondary))' }}>Verifies that total debits strictly equal total credits</p>
              </div>
              <span className={`badge ${trialBalance?.is_balanced ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>
                {trialBalance?.is_balanced ? '✓ Trial Balance In Balance' : '⚠️ Unbalanced Ledger Alert'}
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Code</th>
                  <th style={{ padding: '0.75rem' }}>Account Name</th>
                  <th style={{ padding: '0.75rem' }}>Category</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Debit (KSh)</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>Credit (KSh)</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance?.accounts?.map((acc, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid hsla(var(--border), 0.4)' }}>
                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: '700' }}>{acc.account_code}</td>
                    <td style={{ padding: '0.75rem' }}>{acc.name}</td>
                    <td style={{ padding: '0.75rem', color: 'hsl(var(--text-secondary))' }}>{acc.type}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', color: acc.debit > 0 ? '#38bdf8' : 'inherit' }}>
                      {acc.debit > 0 ? formatAmount(acc.debit) : '-'}
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontWeight: '700', color: acc.credit > 0 ? '#10b981' : 'inherit' }}>
                      {acc.credit > 0 ? formatAmount(acc.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'hsla(var(--primary), 0.1)', fontWeight: '800', borderTop: '2px solid hsl(var(--primary))' }}>
                  <td colSpan="3" style={{ padding: '1rem 1.5rem' }}>TOTAL LEDGER AUDIT BALANCE:</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: '#38bdf8' }}>{formatAmount(trialBalance?.total_debit || 0)}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: '#10b981' }}>{formatAmount(trialBalance?.total_credit || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: GENERAL LEDGER & JOURNALS (STRICTLY SCOPED TO THIS TAB) */}
      {activeTab === 'journals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* FOCUSED 2-OPTION JOURNAL ENTRY FORM CONTAINER */}
          {showJournalForm && (
            <div className="card" style={{ border: '2px solid #38bdf8', background: 'var(--bg-card)', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
              
              {/* FORM HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📑 Post Journal Record
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                    Select whether you are recording a Debit or Credit entry. Include multiple line items as needed.
                  </p>
                </div>
                <button className="btn" onClick={() => setShowJournalForm(false)} style={{ background: 'transparent', fontSize: '1rem' }}>✕ Close</button>
              </div>

              {/* 2 CLEAN ENTRY TYPE OPTIONS (DEBIT VS CREDIT ONLY) */}
              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #334155' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '0.5rem' }}>
                  Select Entry Type:
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setEntryMode('debit')}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '6px',
                      border: entryMode === 'debit' ? '2px solid #38bdf8' : '1px solid #334155',
                      background: entryMode === 'debit' ? '#0284c7' : '#1e293b',
                      color: '#fff',
                      fontWeight: '800',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    🔵 Record DEBIT Entry (Multiple Debits)
                    <div style={{ fontSize: '0.725rem', fontWeight: '400', opacity: 0.9, marginTop: '0.25rem' }}>Expense / Materials / Asset Purchase / Client Bill</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryMode('credit')}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '6px',
                      border: entryMode === 'credit' ? '2px solid #10b981' : '1px solid #334155',
                      background: entryMode === 'credit' ? '#059669' : '#1e293b',
                      color: '#fff',
                      fontWeight: '800',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    🟢 Record CREDIT Entry (Multiple Credits)
                    <div style={{ fontSize: '0.725rem', fontWeight: '400', opacity: 0.9, marginTop: '0.25rem' }}>Revenue / Sales / Bank Outflow / Supplier Owed</div>
                  </button>
                </div>
              </div>

              <form onSubmit={handlePostJournal} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* JOURNAL METADATA */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: '#0f172a11', padding: '1rem', borderRadius: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>Entry Date *</label>
                    <input type="date" className="form-control" required value={journalMeta.entry_date} onChange={e => setJournalMeta({...journalMeta, entry_date: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>Reference # (Active ERP Document) *</label>
                    {!isCustomRef ? (
                      <select 
                        className="form-control" 
                        required 
                        value={journalMeta.reference} 
                        onChange={e => {
                          const val = e.target.value
                          if (val === 'CUSTOM_MANUAL') {
                            setIsCustomRef(true)
                            setJournalMeta({ ...journalMeta, reference: '' })
                          } else {
                            const selected = erpDocs.find(d => d.id === val)
                            setJournalMeta({
                              ...journalMeta,
                              reference: val,
                              description: selected ? `Journal record for ${selected.label}` : journalMeta.description
                            })
                            if (selected && selected.amount) {
                              if (entryMode === 'debit') {
                                const newLines = [...debitLines]
                                newLines[0].amount = Number(selected.amount) || 0
                                setDebitLines(newLines)
                              } else {
                                const newLines = [...creditLines]
                                newLines[0].amount = Number(selected.amount) || 0
                                setCreditLines(newLines)
                              }
                            }
                          }
                        }}
                      >
                        <option value="">📋 Select Active ERP Document...</option>
                        {erpDocs.map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.label}</option>
                        ))}
                        <option value="CUSTOM_MANUAL">✏️ Type Custom Manual Reference...</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <input 
                          type="text" 
                          className="form-control" 
                          required 
                          placeholder="Type custom voucher / ref..." 
                          value={journalMeta.reference} 
                          onChange={e => setJournalMeta({...journalMeta, reference: e.target.value})} 
                        />
                        <button 
                          type="button" 
                          className="btn" 
                          style={{ background: '#334155', color: '#fff', fontSize: '0.75rem', padding: '0.4rem 0.6rem' }} 
                          onClick={() => setIsCustomRef(false)}
                        >
                          📋 List ERP
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700' }}>Journal Description *</label>
                    <input type="text" className="form-control" required placeholder="Describe commercial entry purpose..." value={journalMeta.description} onChange={e => setJournalMeta({...journalMeta, description: e.target.value})} />
                  </div>
                </div>

                {/* MODE A: DEBIT-FOCUSED MULTI-LINE FORM (CREDIT CARD HIDDEN) */}
                {entryMode === 'debit' && (
                  <div style={{ background: '#0f172a', border: '2px solid #0284c7', padding: '1.5rem', borderRadius: '8px', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#38bdf8', fontWeight: '800', fontSize: '0.95rem' }}>🔵 DEBIT ENTRY DETAILS (Record 1 or Multiple Debits)</span>
                      <span style={{ fontSize: '0.75rem', background: '#0284c7', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>{debitLines.length} Debit Line(s)</span>
                    </div>

                    {debitLines.map((line, idx) => (
                      <div key={idx} style={{ background: '#1e293b', border: '1px solid #334155', padding: '1rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '700' }}>Debit Line #{idx + 1}</span>
                          {debitLines.length > 1 && (
                            <button type="button" className="btn" style={{ background: '#f43f5e', color: '#fff', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleRemoveDebitLine(idx)}>Remove Line</button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>1. Choose Category *</label>
                            <select className="form-control" value={line.category} onChange={e => {
                              const newCat = e.target.value
                              const opt = debitCategoryOptions.find(o => o.label === newCat)
                              const newLines = [...debitLines]
                              newLines[idx].category = newCat
                              if (opt) newLines[idx].account_code = opt.defaultAccount
                              setDebitLines(newLines)
                            }}>
                              {debitCategoryOptions.map((opt, i) => (
                                <option key={i} value={opt.label}>{opt.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>2. Target Debit Account *</label>
                            <select className="form-control" value={line.account_code} onChange={e => {
                              const newLines = [...debitLines]
                              newLines[idx].account_code = e.target.value
                              setDebitLines(newLines)
                            }}>
                              {accounts.map(a => (
                                <option key={a.account_code} value={a.account_code}>{a.account_code} - {a.name} ({a.type})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>3. Amount (KSh) *</label>
                            <input type="number" step="0.01" className="form-control" placeholder="0.00" value={line.amount || ''} onChange={e => {
                              const newLines = [...debitLines]
                              newLines[idx].amount = parseFloat(e.target.value) || 0
                              setDebitLines(newLines)
                            }} />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Line Memo / Notes</label>
                            <input type="text" className="form-control" placeholder="Memo..." value={line.memo} onChange={e => {
                              const newLines = [...debitLines]
                              newLines[idx].memo = e.target.value
                              setDebitLines(newLines)
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button type="button" className="btn" style={{ background: '#0284c7', color: '#fff', width: '100%', padding: '0.6rem', fontWeight: 'bold' }} onClick={handleAddDebitLine}>
                      + Add Another Debit Line
                    </button>

                    <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '700' }}>Balancing Credit Source Account (Where is this paid from?) *</label>
                        <select className="form-control" value={balancingCreditAccount} onChange={e => setBalancingCreditAccount(e.target.value)}>
                          {accounts.map(a => (
                            <option key={a.account_code} value={a.account_code}>{a.account_code} - {a.name} ({a.type})</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #334155' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total Credit Offset</span>
                        <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>{formatAmount(totalAmount)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODE B: CREDIT-FOCUSED MULTI-LINE FORM (DEBIT CARD HIDDEN) */}
                {entryMode === 'credit' && (
                  <div style={{ background: '#0f172a', border: '2px solid #10b981', padding: '1.5rem', borderRadius: '8px', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                      <span style={{ color: '#10b981', fontWeight: '800', fontSize: '0.95rem' }}>🟢 CREDIT ENTRY DETAILS (Record 1 or Multiple Credits)</span>
                      <span style={{ fontSize: '0.75rem', background: '#059669', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>{creditLines.length} Credit Line(s)</span>
                    </div>

                    {creditLines.map((line, idx) => (
                      <div key={idx} style={{ background: '#1e293b', border: '1px solid #334155', padding: '1rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '700' }}>Credit Line #{idx + 1}</span>
                          {creditLines.length > 1 && (
                            <button type="button" className="btn" style={{ background: '#f43f5e', color: '#fff', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleRemoveCreditLine(idx)}>Remove Line</button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>1. Choose Category *</label>
                            <select className="form-control" value={line.category} onChange={e => {
                              const newCat = e.target.value
                              const opt = creditCategoryOptions.find(o => o.label === newCat)
                              const newLines = [...creditLines]
                              newLines[idx].category = newCat
                              if (opt) newLines[idx].account_code = opt.defaultAccount
                              setCreditLines(newLines)
                            }}>
                              {creditCategoryOptions.map((opt, i) => (
                                <option key={i} value={opt.label}>{opt.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>2. Source Credit Account *</label>
                            <select className="form-control" value={line.account_code} onChange={e => {
                              const newLines = [...creditLines]
                              newLines[idx].account_code = e.target.value
                              setCreditLines(newLines)
                            }}>
                              {accounts.map(a => (
                                <option key={a.account_code} value={a.account_code}>{a.account_code} - {a.name} ({a.type})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>3. Amount (KSh) *</label>
                            <input type="number" step="0.01" className="form-control" placeholder="0.00" value={line.amount || ''} onChange={e => {
                              const newLines = [...creditLines]
                              newLines[idx].amount = parseFloat(e.target.value) || 0
                              setCreditLines(newLines)
                            }} />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Line Memo / Notes</label>
                            <input type="text" className="form-control" placeholder="Memo..." value={line.memo} onChange={e => {
                              const newLines = [...creditLines]
                              newLines[idx].memo = e.target.value
                              setCreditLines(newLines)
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button type="button" className="btn" style={{ background: '#059669', color: '#fff', width: '100%', padding: '0.6rem', fontWeight: 'bold' }} onClick={handleAddCreditLine}>
                      + Add Another Credit Line
                    </button>

                    <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '700' }}>Balancing Debit Destination Account (Where is value deposited/received?) *</label>
                        <select className="form-control" value={balancingDebitAccount} onChange={e => setBalancingDebitAccount(e.target.value)}>
                          {accounts.map(a => (
                            <option key={a.account_code} value={a.account_code}>{a.account_code} - {a.name} ({a.type})</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #334155' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total Debit Offset</span>
                        <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>{formatAmount(totalAmount)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* DOUBLE-ENTRY BALANCE SUMMARY STATUS BAR */}
                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', fontWeight: '800', fontSize: '0.9rem', color: '#fff' }}>
                    <span>Total Entry Value: <strong style={{ color: entryMode === 'debit' ? '#38bdf8' : '#10b981' }}>{formatAmount(totalAmount)}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className={`badge ${isValidAmount ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                      {isValidAmount ? '✓ Balanced (Ready to Post)' : '⚠️ Enter Amount'}
                    </span>

                    <button type="submit" className="btn btn-primary" disabled={!isValidAmount} style={{ padding: '0.6rem 1.5rem', fontWeight: 'bold' }}>
                      Post Journal Entry
                    </button>
                  </div>
                </div>

              </form>
            </div>
          )}

          {/* POSTED JOURNALS AUDIT TABLE */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
              <h3 style={{ margin: 0 }}>Posted General Ledger Journal Audit Trail</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: 'hsl(var(--text-secondary))' }}>All manual and automated double-entry records</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Journal ID</th>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Ref #</th>
                  <th style={{ padding: '0.75rem' }}>Description</th>
                  <th style={{ padding: '0.75rem' }}>Line Items</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {journals.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
                      No journal entries posted yet. Click "+ Post Journal Entry" above to create one.
                    </td>
                  </tr>
                ) : (
                  journals.map((j, i) => (
                    <React.Fragment key={i}>
                      <tr style={{ borderBottom: '1px solid hsla(var(--border), 0.4)', background: 'hsla(var(--primary), 0.02)' }}>
                        <td style={{ padding: '0.75rem 1.5rem', fontWeight: '800', color: 'hsl(var(--primary))' }}>{j.id}</td>
                        <td style={{ padding: '0.75rem' }}>{j.entry_date}</td>
                        <td style={{ padding: '0.75rem', fontWeight: '700' }}>{j.reference || '-'}</td>
                        <td style={{ padding: '0.75rem' }}>{j.description}</td>
                        <td style={{ padding: '0.75rem' }}>{j.items?.length || 0} line items</td>
                        <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>
                          <span className="badge badge-success">Posted</span>
                        </td>
                      </tr>
                      {j.items && j.items.length > 0 && (
                        <tr>
                          <td colSpan="6" style={{ padding: '0.5rem 1.5rem 1rem 3rem', background: '#0f172a11' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', background: 'var(--bg-card)', borderRadius: '6px' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid hsl(var(--border))', textAlign: 'left', color: 'hsl(var(--text-secondary))' }}>
                                  <th style={{ padding: '0.4rem 0.75rem' }}>Account Code & Name</th>
                                  <th style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>Debit (KSh)</th>
                                  <th style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>Credit (KSh)</th>
                                  <th style={{ padding: '0.4rem 0.75rem' }}>Memo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {j.items.map((line, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid hsla(var(--border), 0.3)' }}>
                                    <td style={{ padding: '0.4rem 0.75rem', fontWeight: '600' }}>{line.account_code} - {line.account_name || 'Account'}</td>
                                    <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', fontWeight: '700', color: line.debit > 0 ? '#38bdf8' : 'inherit' }}>{line.debit > 0 ? formatAmount(line.debit) : '-'}</td>
                                    <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', fontWeight: '700', color: line.credit > 0 ? '#10b981' : 'inherit' }}>{line.credit > 0 ? formatAmount(line.credit) : '-'}</td>
                                    <td style={{ padding: '0.4rem 0.75rem', color: 'hsl(var(--text-secondary))' }}>{line.memo || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: KRA 16% VAT & TAX LEDGER */}
      {activeTab === 'vat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <span className="stat-label">Output VAT 16% (Client Sales)</span>
              <span className="stat-value" style={{ color: '#f59e0b' }}>{formatAmount(vatLedger?.total_output_vat || 0)}</span>
            </div>
            <div className="card">
              <span className="stat-label">Input VAT 16% (Purchases)</span>
              <span className="stat-value" style={{ color: '#38bdf8' }}>{formatAmount(vatLedger?.total_input_vat || 0)}</span>
            </div>
            <div className="card">
              <span className="stat-label">Net KRA VAT Payable</span>
              <span className="stat-value" style={{ color: (vatLedger?.net_kra_vat_payable || 0) >= 0 ? '#f43f5e' : '#10b981' }}>
                {formatAmount(vatLedger?.net_kra_vat_payable || 0)}
              </span>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
              <h3 style={{ margin: 0 }}>Monthly KRA VAT 16% Return Audit Trail</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: 'hsl(var(--text-secondary))' }}>Output VAT collected from clients vs Input VAT claimed on supplier invoices</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1.5rem' }}>Invoice Ref</th>
                  <th style={{ padding: '0.75rem' }}>Tax Type</th>
                  <th style={{ padding: '0.75rem' }}>Party Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Invoice</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>16% VAT Portion</th>
                </tr>
              </thead>
              <tbody>
                {[...(vatLedger?.sales_vat || []), ...(vatLedger?.purchase_vat || [])].length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
                      No VAT transactions logged in system yet.
                    </td>
                  </tr>
                ) : (
                  [...(vatLedger?.sales_vat || []), ...(vatLedger?.purchase_vat || [])].map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid hsla(var(--border), 0.4)' }}>
                      <td style={{ padding: '0.75rem 1.5rem', fontWeight: '700', color: 'hsl(var(--primary))' }}>{item.ref}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge ${item.type.includes('Output') ? 'badge-warning' : 'badge-primary'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{item.party}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700' }}>{formatAmount(item.amount)}</td>
                      <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontWeight: '800', color: item.type.includes('Output') ? '#f59e0b' : '#38bdf8' }}>
                        {formatAmount(item.vat_amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 4: AR & AP DEBT AGING ANALYSIS */}
      {activeTab === 'aging' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* ACCOUNTS RECEIVABLE (CLIENT DEBTS) AGING */}
            <div className="card">
              <h3 style={{ color: '#10b981', margin: '0 0 1rem 0' }}>📥 Accounts Receivable Aging (Client Debts)</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem', background: '#0f172a11', padding: '0.75rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-secondary))' }}>0-30 Days</div>
                  <strong style={{ fontSize: '0.85rem' }}>{formatAmount(aging?.ar_aging?.current || 0)}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#f59e0b' }}>31-60 Days</div>
                  <strong style={{ fontSize: '0.85rem', color: '#f59e0b' }}>{formatAmount(aging?.ar_aging?.days30 || 0)}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#f43f5e' }}>61-90 Days</div>
                  <strong style={{ fontSize: '0.85rem', color: '#f43f5e' }}>{formatAmount(aging?.ar_aging?.days60 || 0)}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#e11d48' }}>90+ Days</div>
                  <strong style={{ fontSize: '0.85rem', color: '#e11d48' }}>{formatAmount(aging?.ar_aging?.days90Plus || 0)}</strong>
                </div>
              </div>

              <table style={{ width: '100%', fontSize: '0.825rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0' }}>Inv #</th>
                    <th style={{ padding: '0.5rem 0' }}>Client</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Age</th>
                  </tr>
                </thead>
                <tbody>
                  {aging?.ar_aging?.items?.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '1rem 0', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No pending client debts.</td></tr>
                  ) : (
                    aging?.ar_aging?.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid hsla(var(--border), 0.3)' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: '700' }}>{item.id}</td>
                        <td style={{ padding: '0.5rem 0' }}>{item.client_name}</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: '700' }}>{formatAmount(item.amount)}</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                          <span className={`badge ${item.age_days > 60 ? 'badge-danger' : item.age_days > 30 ? 'badge-warning' : 'badge-success'}`}>
                            {item.age_days}d overdue
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ACCOUNTS PAYABLE (SUPPLIER DEBTS) AGING */}
            <div className="card">
              <h3 style={{ color: '#f43f5e', margin: '0 0 1rem 0' }}>📤 Accounts Payable Aging (Supplier Bills)</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem', background: '#0f172a11', padding: '0.75rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-secondary))' }}>0-30 Days</div>
                  <strong style={{ fontSize: '0.85rem' }}>{formatAmount(aging?.ap_aging?.current || 0)}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#f59e0b' }}>31-60 Days</div>
                  <strong style={{ fontSize: '0.85rem', color: '#f59e0b' }}>{formatAmount(aging?.ap_aging?.days30 || 0)}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#f43f5e' }}>61-90 Days</div>
                  <strong style={{ fontSize: '0.85rem', color: '#f43f5e' }}>{formatAmount(aging?.ap_aging?.days60 || 0)}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#e11d48' }}>90+ Days</div>
                  <strong style={{ fontSize: '0.85rem', color: '#e11d48' }}>{formatAmount(aging?.ap_aging?.days90Plus || 0)}</strong>
                </div>
              </div>

              <table style={{ width: '100%', fontSize: '0.825rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0' }}>Inv #</th>
                    <th style={{ padding: '0.5rem 0' }}>Supplier</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Age</th>
                  </tr>
                </thead>
                <tbody>
                  {aging?.ap_aging?.items?.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '1rem 0', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No pending supplier bills.</td></tr>
                  ) : (
                    aging?.ap_aging?.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid hsla(var(--border), 0.3)' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: '700' }}>{item.id}</td>
                        <td style={{ padding: '0.5rem 0' }}>{item.supplier_name}</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: '700' }}>{formatAmount(item.amount)}</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                          <span className={`badge ${item.age_days > 60 ? 'badge-danger' : item.age_days > 30 ? 'badge-warning' : 'badge-primary'}`}>
                            {item.age_days}d overdue
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* TAB 5: CHART OF ACCOUNTS (COA) DIRECTORY */}
      {activeTab === 'coa' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0 }}>Master Chart of Accounts (COA) Directory</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: 'hsl(var(--text-secondary))' }}>Master ledger account code classification structure</p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1.5rem' }}>Code</th>
                <th style={{ padding: '0.75rem' }}>Account Name</th>
                <th style={{ padding: '0.75rem' }}>Type</th>
                <th style={{ padding: '0.75rem' }}>Category</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>Current Balance (KSh)</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid hsla(var(--border), 0.4)' }}>
                  <td style={{ padding: '0.75rem 1.5rem', fontWeight: '800', color: 'hsl(var(--primary))' }}>{acc.account_code}</td>
                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>{acc.name}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${acc.type === 'Asset' ? 'badge-primary' : acc.type === 'Liability' ? 'badge-warning' : acc.type === 'Revenue' ? 'badge-success' : 'badge-danger'}`}>
                      {acc.type}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'hsl(var(--text-secondary))' }}>{acc.category}</td>
                  <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontWeight: '700' }}>{formatAmount(acc.current_balance || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
