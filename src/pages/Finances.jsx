import React, { useState, useEffect } from 'react'
import Drawer from '../components/Drawer'
import RecordSupplierInvoiceForm from '../components/RecordSupplierInvoiceForm'

export default function Finances({ setGlobalDrawer }) {
  const [matchResult, setMatchResult] = useState(null)
  const [treasury, setTreasury] = useState({ accounts: [], transactions: [] })
  const [evidenceList, setEvidenceList] = useState([])
  const [grns, setGrns] = useState([])
  const [invoices, setInvoices] = useState([])
  const [isInvoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/treasury')
      .then(res => res.json())
      .then(data => setTreasury(data))
      .catch(err => console.error(err))

    fetch('http://localhost:5000/api/evidence')
      .then(res => res.json())
      .then(data => setEvidenceList(data))
      .catch(err => console.error(err))

    fetch('http://localhost:5000/api/grns')
      .then(res => res.json())
      .then(data => setGrns(data))
      .catch(err => console.error(err))

    fetch('http://localhost:5000/api/supplier_invoices')
      .then(res => res.json())
      .then(data => setInvoices(data))
      .catch(err => console.error(err))
  }, [])

  const run3WayMatch = async (invoiceId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/match/${invoiceId}`, { method: 'POST' });
      const data = await res.json();
      setMatchResult(data);
      if (data.success) {
        alert(data.message + '\n' + data.details);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('Match engine failed to run.');
    }
  }

  const payInvoice = async (invoice) => {
    alert(`Payment of $${invoice.amount} sent to ${invoice.supplier_name}!\n\n(In production, this triggers an M-Pesa B2B or Bank Transfer API and creates a Transaction)`);
    // Ideally this does a POST /api/transactions
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <Drawer isOpen={isInvoiceDrawerOpen} onClose={() => setInvoiceDrawerOpen(false)} title="Record Supplier Invoice">
        <RecordSupplierInvoiceForm />
      </Drawer>
      
      {/* TREASURY ACCOUNTS (CASH BOOK) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Treasury & Cash Book</h2>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem' }}>Live balances across all company financial accounts.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setGlobalDrawer('transaction')}>+ Record Transaction</button>
        </div>

        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          {treasury.accounts.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>Loading Accounts...</div>
          ) : (
            treasury.accounts.map(acc => (
              <div key={acc.id} className="card stat-card" style={{ borderTop: `4px solid ${acc.type === 'Bank' ? 'hsl(var(--primary))' : acc.type === 'Mobile Money' ? 'hsl(var(--success))' : 'hsl(var(--warning))'}` }}>
                <span className="stat-label">{acc.name} ({acc.type})</span>
                <span className="stat-value" style={{ fontSize: '1.75rem' }}>${acc.current_balance.toLocaleString()}</span>
              </div>
            ))
          )}
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
                    {tx.type === 'Income' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <hr style={{ border: '0', borderTop: '1px solid hsla(var(--border), 0.5)', margin: '1rem 0' }} />

      {/* GRN / EVIDENCE REVIEW */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
          <h3 style={{ margin: 0 }}>Supplier Goods Receipt Notes (GRNs)</h3>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>Proof of delivery from suppliers. Essential for the 3-Way Match.</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
              <th style={{ padding: '1rem 1.5rem' }}>GRN ID</th>
              <th style={{ padding: '1rem' }}>Supplier</th>
              <th style={{ padding: '1rem' }}>Purchase Order</th>
              <th style={{ padding: '1rem' }}>Tender</th>
              <th style={{ padding: '1rem' }}>Details</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Verified Value</th>
            </tr>
          </thead>
          <tbody>
            {grns.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No Supplier GRNs recorded yet.</td>
              </tr>
            ) : (
              grns.map((grn) => (
                <tr key={grn.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'hsl(var(--primary))' }}>{grn.id}</td>
                  <td style={{ padding: '1rem' }}>{grn.supplier_name}</td>
                  <td style={{ padding: '1rem' }}>{grn.po_id}</td>
                  <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))', fontSize: '0.875rem' }}>{grn.tender_name || '-'}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{grn.details}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>${grn.received_value.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <hr style={{ border: '0', borderTop: '1px solid hsla(var(--border), 0.5)', margin: '1rem 0' }} />

      {/* ORIGINAL FINANCE BLOCKS (Invoices & Matches) */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        


        {/* Supplier Payments & 3-Way Match */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Supplier Invoices & 3-Way Match Engine</h3>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>Process incoming bills from suppliers.</p>
            </div>
            <button className="btn" onClick={() => setInvoiceDrawerOpen(true)} style={{ background: 'hsla(var(--warning), 0.2)', color: 'hsl(var(--warning))' }}>+ Record Invoice</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {invoices.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))', border: '1px dashed hsl(var(--border))', borderRadius: 'var(--radius-md)' }}>
                No supplier invoices pending.
              </div>
            ) : invoices.map(inv => (
              <div key={inv.id} style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: inv.status === 'Discrepancy' ? 'hsla(var(--danger), 0.05)' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {inv.id} <span className={`badge ${inv.status === 'Matched' ? 'badge-success' : inv.status === 'Discrepancy' ? 'badge-danger' : 'badge-warning'}`}>{inv.status}</span>
                    </h4>
                    <strong style={{ display: 'block', marginTop: '0.5rem' }}>{inv.supplier_name}</strong>
                    <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>Linked to: {inv.po_id}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>Billed Amount</p>
                    <h3 style={{ margin: 0, color: 'hsl(var(--danger))' }}>${inv.amount.toLocaleString()}</h3>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Purchase Order Limit</span>
                    <strong style={{ display: 'block' }}>${(inv.po_value || 0).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Verified GRN Total</span>
                    <strong style={{ display: 'block', color: 'hsl(var(--success))' }}>${(inv.total_grn_value || 0).toLocaleString()}</strong>
                  </div>
                </div>

                {inv.status === 'Pending Match' && (
                  <button className="btn btn-primary" onClick={() => run3WayMatch(inv.id)} style={{ width: '100%' }}>
                    Run 3-Way Match
                  </button>
                )}

                {inv.status === 'Discrepancy' && (
                  <div style={{ padding: '1rem', background: 'hsla(var(--danger), 0.1)', borderLeft: '4px solid hsl(var(--danger))', color: 'hsl(var(--danger))', fontSize: '0.875rem', borderRadius: '0 4px 4px 0' }}>
                    <strong>Match Failed: Payment Blocked</strong>
                    <p style={{ marginTop: '0.25rem' }}>Billed amount exceeds verified deliveries. Contact supplier or site manager to upload missing GRNs.</p>
                    <button className="btn" onClick={() => run3WayMatch(inv.id)} style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid hsl(var(--danger))', color: 'hsl(var(--danger))' }}>Re-Run Match</button>
                  </div>
                )}

                {inv.status === 'Matched' && (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, padding: '1rem', background: 'hsla(var(--success), 0.1)', borderLeft: '4px solid hsl(var(--success))', color: 'hsl(var(--success))', fontSize: '0.875rem', borderRadius: '0 4px 4px 0' }}>
                      <strong>Match Verified</strong>
                      <p style={{ marginTop: '0.25rem' }}>Cleared for payment.</p>
                    </div>
                    <button className="btn" onClick={() => payInvoice(inv)} style={{ background: 'hsl(var(--success))', color: '#fff', padding: '1rem', fontWeight: 'bold' }}>
                      Pay ${inv.amount.toLocaleString()}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
