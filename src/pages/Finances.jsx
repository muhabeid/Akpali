import React, { useState, useEffect } from 'react'
import Drawer from '../components/Drawer'
import RecordSupplierInvoiceForm from '../components/RecordSupplierInvoiceForm'
import BookkeepingHub from '../components/BookkeepingHub'
import MoneyMovementModal from '../components/MoneyMovementModal'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useCurrency } from '../context/CurrencyContext'

export default function Finances({ setGlobalDrawer }) {
  const { formatAmount } = useCurrency()
  const [activeFinanceTab, setActiveFinanceTab] = useState('bookkeeping') // 'bookkeeping' | 'treasury'
  const [matchResult, setMatchResult] = useState(null)
  const [treasury, setTreasury] = useState({ accounts: [], transactions: [] })
  const [evidenceList, setEvidenceList] = useState([])
  const [grns, setGrns] = useState([])
  const [invoices, setInvoices] = useState([])
  const [cashflow, setCashflow] = useState([])
  const [forecastEngine, setForecastEngine] = useState(null)
  const [isInvoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [payingInvoice, setPayingInvoice] = useState(null)
  const [paymentAccount, setPaymentAccount] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

  const reloadData = () => {
    fetch('http://localhost:5000/api/treasury')
      .then(res => res.json())
      .then(data => setTreasury(data))
      .catch(err => console.error(err))

    fetch('http://localhost:5000/api/supplier_invoices')
      .then(res => res.json())
      .then(data => setInvoices(data))
      .catch(err => console.error(err))
  }

  useEffect(() => {
    reloadData()

    fetch('http://localhost:5000/api/evidence')
      .then(res => res.json())
      .then(data => setEvidenceList(data))
      .catch(err => console.error(err))

    fetch('http://localhost:5000/api/grns')
      .then(res => res.json())
      .then(data => setGrns(data))
      .catch(err => console.error(err))

    fetch('http://localhost:5000/api/analytics/cashflow')
      .then(res => res.json())
      .then(data => setCashflow(data))
      .catch(err => console.error(err))

    fetch('http://localhost:5000/api/finances/cashflow-forecast')
      .then(res => res.json())
      .then(data => setForecastEngine(data))
      .catch(err => console.error(err))
  }, [])

  const run3WayMatch = async (invoiceId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/procurement/3-way-match/${invoiceId}`, { method: 'POST' });
      const data = await res.json();
      setMatchResult(data);
      
      const invRes = await fetch('http://localhost:5000/api/supplier_invoices');
      const invData = await invRes.json();
      setInvoices(invData);

      alert(`[3-WAY MATCH ENGINE RESULT]\n\nStatus: ${data.matchStatus}\nDetails: ${data.details}\nBilled Amount: ${formatAmount(data.invoiceAmount)}\nVerified GRN Total: ${formatAmount(data.totalGRNValue)}`);
    } catch (e) {
      console.error(e);
      alert('Error running 3-way match');
    }
  }

  const handleConfirmDisbursement = async (e) => {
    e.preventDefault();
    if (!payingInvoice || !paymentAccount) {
      return alert('Please select a disbursement account.');
    }
    setIsSubmittingPayment(true);
    try {
      const res = await fetch(`http://localhost:5000/api/supplier_invoices/${payingInvoice.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: paymentAccount,
          reference: paymentRef,
          payment_date: new Date().toISOString().split('T')[0]
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Payment disbursed successfully!');
        setPayingInvoice(null);
        reloadData();
        window.dispatchEvent(new Event('refreshCorporateHub'));
      } else {
        alert(data.error || 'Failed to disburse payment');
      }
    } catch(err) {
      console.error(err);
      alert('Error connecting to payment disbursement engine');
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <Drawer isOpen={isInvoiceDrawerOpen} onClose={() => setInvoiceDrawerOpen(false)} title="Record Supplier Invoice">
        <RecordSupplierInvoiceForm />
      </Drawer>

      {/* TOP MODULE SWITCHER TABS (NO HORIZONTAL SLIDER) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', borderBottom: '2px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveFinanceTab('bookkeeping')}
          style={{
            padding: '0.75rem 1rem',
            background: activeFinanceTab === 'bookkeeping' ? 'hsla(var(--primary), 0.15)' : 'hsla(var(--border), 0.15)',
            border: 'none',
            borderBottom: activeFinanceTab === 'bookkeeping' ? '3px solid hsl(var(--primary))' : 'none',
            color: activeFinanceTab === 'bookkeeping' ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))',
            fontWeight: activeFinanceTab === 'bookkeeping' ? '800' : '600',
            fontSize: '0.9rem',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            textAlign: 'center'
          }}
        >
          📖 Corporate Bookkeeping & General Ledger
        </button>
        <button
          onClick={() => setActiveFinanceTab('treasury')}
          style={{
            padding: '0.75rem 1rem',
            background: activeFinanceTab === 'treasury' ? 'hsla(var(--primary), 0.15)' : 'hsla(var(--border), 0.15)',
            border: 'none',
            borderBottom: activeFinanceTab === 'treasury' ? '3px solid hsl(var(--primary))' : 'none',
            color: activeFinanceTab === 'treasury' ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))',
            fontWeight: activeFinanceTab === 'treasury' ? '800' : '600',
            fontSize: '0.9rem',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            textAlign: 'center'
          }}
        >
          🏦 Treasury, Cash Flow & 3-Way Audit
        </button>
      </div>

      {/* MAIN TAB CONTENT */}
      {activeFinanceTab === 'bookkeeping' ? (
        <BookkeepingHub />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* TREASURY ACCOUNTS (CASH BOOK) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0 }}>Treasury & Cash Book</h2>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem' }}>Live balances across all company financial accounts.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button className="btn" style={{ background: '#16a34a', color: '#fff', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setIsMovementModalOpen(true)}>
                  ↕️ Money In / Out / Transfer
                </button>
                <button className="btn btn-primary" onClick={() => setGlobalDrawer('transaction')}>+ Record Transaction</button>
              </div>
            </div>

            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              {treasury.accounts.length === 0 ? (
                <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>Loading Accounts...</div>
              ) : (
                treasury.accounts.map(acc => (
                  <div key={acc.id} className="card stat-card" style={{ borderTop: `4px solid ${acc.type === 'Bank' ? 'hsl(var(--primary))' : acc.type === 'Mobile Money' ? 'hsl(var(--success))' : 'hsl(var(--warning))'}` }}>
                    <span className="stat-label">{acc.name} ({acc.type})</span>
                    <span className="stat-value" style={{ fontSize: '1.75rem' }}>{formatAmount(acc?.current_balance || 0)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 30, 60 & 90-DAY PREDICTIVE CASH FLOW FORECASTING ENGINE */}
          {forecastEngine && forecastEngine.summary && Array.isArray(forecastEngine.forecast) && (
            <div className="card" style={{ padding: '1.5rem', background: 'hsla(var(--primary), 0.04)', border: '1px solid hsla(var(--primary), 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem' }}>📊 30, 60 & 90-Day Predictive Cash Flow Engine</h3>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>Real-time cash flow forecasting (Inflows vs Outflows)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Projected Net Working Capital</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: Number(forecastEngine.summary.net_working_capital || 0) >= 0 ? '#4ade80' : '#f87171' }}>
                    {formatAmount(forecastEngine.summary.net_working_capital || 0)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {forecastEngine.forecast.map((item, i) => (
                  <div key={i} style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8', marginBottom: '0.5rem' }}>{item.horizon} Horizon</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: '#94a3b8' }}>Expected Inflows:</span>
                      <span style={{ color: '#4ade80', fontWeight: '700' }}>+{formatAmount(item?.inflows || 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#94a3b8' }}>Expected Outflows:</span>
                      <span style={{ color: '#f87171', fontWeight: '700' }}>-{formatAmount(item?.outflows || 0)}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #334155', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700' }}>
                      <span style={{ color: '#fff' }}>Net Position:</span>
                      <span style={{ color: item.net >= 0 ? '#4ade80' : '#f87171' }}>{formatAmount(item?.net || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CASHFLOW TREND CHART */}
          <div className="card">
            <h3>Net Cashflow & Liquidity Trend</h3>
            <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashflow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--border), 0.5)" />
                  <XAxis dataKey="month" stroke="hsl(var(--text-secondary))" />
                  <YAxis stroke="hsl(var(--text-secondary))" />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="inflow" stroke="hsl(var(--success))" name="Inflow (Revenue)" strokeWidth={2} />
                  <Line type="monotone" dataKey="outflow" stroke="hsl(var(--danger))" name="Outflow (Expenses)" strokeWidth={2} />
                  <Line type="monotone" dataKey="net" stroke="hsl(var(--primary))" name="Net Position" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TRANSACTION LEDGER */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
              <h3 style={{ margin: 0 }}>Transaction Ledger</h3>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>Chronological history of all cash inflows and outflows.</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Transaction ID</th>
                  <th style={{ padding: '1rem' }}>Account</th>
                  <th style={{ padding: '1rem' }}>Purpose</th>
                  <th style={{ padding: '1rem' }}>Project Link</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {treasury.transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No transactions recorded yet.</td>
                  </tr>
                ) : (
                  treasury.transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <td style={{ padding: '1rem 1.5rem', color: 'hsl(var(--text-secondary))', fontSize: '0.875rem' }}>
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{tx.id}</td>
                      <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>{tx.account_name}</td>
                      <td style={{ padding: '1rem' }}>{tx.purpose}</td>
                      <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))', fontSize: '0.875rem' }}>{tx.tender_name || '-'}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: tx.type === 'Income' ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
                        {tx.type === 'Income' ? '+' : '-'}{formatAmount(tx?.amount || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 3-WAY MATCHING RECONCILIATION AUDIT */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3>3-Way Matching Reconciliation</h3>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem' }}>Audit PO vs GRN vs Supplier Invoice before payment release.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setInvoiceDrawerOpen(true)}>+ Record Supplier Invoice</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {invoices.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '2rem' }}>No supplier invoices recorded yet.</div>
              ) : (
                invoices.map(inv => (
                  <div key={inv.id} className="card" style={{ borderLeft: `4px solid ${inv.status === 'Matched' ? 'hsl(var(--success))' : inv.status === 'Mismatch' ? 'hsl(var(--danger))' : 'hsl(var(--warning))'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '1.1rem' }}>{inv.supplier_name} - Invoice {inv.id}</strong>
                      <span className={`badge ${inv.status === 'Matched' ? 'badge-success' : inv.status === 'Mismatch' ? 'badge-danger' : 'badge-warning'}`}>
                        {inv.status || 'Pending Match'}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
                      PO Ref: {inv.po_id} &bull; Amount: {formatAmount(inv.amount)} &bull; Date: {inv.invoice_date}
                    </p>

                    {inv.status === 'Mismatch' && (
                      <div style={{ padding: '1rem', background: 'hsla(var(--danger), 0.1)', borderLeft: '4px solid hsl(var(--danger))', color: 'hsl(var(--danger))', fontSize: '0.875rem' }}>
                        <strong>⚠️ 3-Way Match Exception Detected</strong>
                        <p style={{ marginTop: '0.25rem' }}>Billed amount exceeds verified deliveries. Contact supplier or site manager to upload missing GRNs.</p>
                        <button className="btn" onClick={() => run3WayMatch(inv.id)} style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid hsl(var(--danger))', color: 'hsl(var(--danger))' }}>Re-Run Match</button>
                      </div>
                    )}

                    {inv.status === 'Matched' && (
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, padding: '0.75rem 1rem', background: 'hsla(var(--success), 0.1)', borderLeft: '4px solid hsl(var(--success))', color: 'hsl(var(--success))', fontSize: '0.875rem', borderRadius: '0 4px 4px 0' }}>
                          <strong>Match Verified</strong>
                          <div style={{ marginTop: '0.2rem' }}>Audit confirmed. Ready for account disbursement.</div>
                        </div>
                        <button 
                          className="btn" 
                          onClick={() => {
                            setPayingInvoice(inv);
                            setPaymentAccount(treasury.accounts[0]?.id || '');
                            setPaymentRef(`PAY-${inv.id}`);
                          }} 
                          style={{ background: '#16a34a', color: '#fff', padding: '0.75rem 1.25rem', fontWeight: 'bold', fontSize: '0.9rem' }}
                        >
                          Disburse {formatAmount(inv?.amount || 0)}
                        </button>
                      </div>
                    )}

                    {inv.status === 'Paid' && (
                      <div style={{ padding: '0.75rem 1rem', background: 'hsla(var(--success), 0.15)', borderLeft: '4px solid hsl(var(--success))', color: 'hsl(var(--success))', fontSize: '0.875rem', borderRadius: '0 4px 4px 0', fontWeight: 'bold' }}>
                        ✅ Paid & Disbursed from Treasury Accounts
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUPPLIER PAYMENT DISBURSEMENT MODAL */}
      {payingInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '540px', maxWidth: '100%', background: 'var(--bg-card)', border: '2px solid #16a34a', borderRadius: '12px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#16a34a', fontSize: '1.15rem', fontWeight: '800' }}>
                  Disburse Supplier Payment
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginTop: '0.2rem' }}>
                  Authorized disbursement for {payingInvoice.supplier_name}
                </div>
              </div>
              <button type="button" className="btn" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => setPayingInvoice(null)}>✕</button>
            </div>

            <div style={{ padding: '0.85rem 1rem', background: 'hsla(var(--primary), 0.06)', borderRadius: '8px', border: '1px solid hsla(var(--primary), 0.15)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Invoice Ref:</span>
                <span style={{ fontWeight: 'bold' }}>#{payingInvoice.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Purchase Order:</span>
                <span style={{ fontWeight: 'bold' }}>{payingInvoice.po_id || 'Direct'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid hsl(var(--border))', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                <span style={{ fontWeight: 'bold' }}>Total Payable:</span>
                <span style={{ fontWeight: '800', color: '#16a34a', fontSize: '1.1rem' }}>{formatAmount(payingInvoice.amount)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmDisbursement} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Disburse From Account *</label>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.35rem' }}>
                  Select which Bank Account, M-Pesa Till or Office Petty Cash to deduct:
                </div>
                <select 
                  className="form-control" 
                  required 
                  value={paymentAccount} 
                  onChange={e => setPaymentAccount(e.target.value)}
                >
                  <option value="">-- Choose Paying Account --</option>
                  {treasury.accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.type === 'Bank' ? '🏦' : acc.type === 'Mobile Money' ? '📱' : '💵'} {acc.name} ({acc.type}) — Bal: {formatAmount(acc.current_balance || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Transaction / Voucher Reference *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="e.g. EFT-982103, MPESA-QA883, or CHQ-00192" 
                  value={paymentRef} 
                  onChange={e => setPaymentRef(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
                <button type="button" className="btn" onClick={() => setPayingInvoice(null)} disabled={isSubmittingPayment} style={{ background: 'transparent', border: '1px solid hsl(var(--border))' }}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn" 
                  disabled={isSubmittingPayment}
                  style={{ background: '#16a34a', color: '#fff', fontWeight: 'bold', padding: '0.65rem 1.5rem', border: 'none' }}
                >
                  {isSubmittingPayment ? 'Disbursing...' : `Confirm & Deduct ${formatAmount(payingInvoice.amount)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MONEY MOVEMENT & TRANSFER MODAL */}
      {isMovementModalOpen && (
        <MoneyMovementModal
          isOpen={isMovementModalOpen}
          onClose={() => setIsMovementModalOpen(false)}
          accounts={treasury.accounts}
          onSuccess={() => reloadData()}
        />
      )}
    </div>
  )
}
