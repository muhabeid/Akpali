import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export default function ClientStatementOfAccountModal({ isOpen, onClose, clientId, clientName }) {
  if (!isOpen || !clientId) return null;

  const { formatAmount } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/finances/statement-of-account/${clientId}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching statement of account:', err);
        setLoading(false);
      });
  }, [clientId]);

  const handleCopyWhatsApp = () => {
    if (data?.whatsapp_reminder_template) {
      navigator.clipboard.writeText(data.whatsapp_reminder_template);
      alert('✅ Formatted WhatsApp payment reminder copied to clipboard! You can paste directly to the client.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const client = data?.client || {};
  const company = data?.company || {};
  const aging = data?.aging_summary || {};
  const invoices = data?.invoices || [];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1.5rem'
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '16px',
        width: '95%',
        maxWidth: '950px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden',
        color: '#f8fafc'
      }}>
        {/* MODAL CONTROL HEADER */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #334155',
          background: '#1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: '700' }}>
              Client Statement of Account (SOA) & Debt Aging
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Client: <strong style={{ color: '#38bdf8' }}>{clientName || client.name}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleCopyWhatsApp}
              className="btn"
              style={{ background: '#16a34a', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              title="Copy WhatsApp Payment Reminder"
            >
              💬 WhatsApp Reminder
            </button>

            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', fontWeight: 'bold' }}
            >
              🖨️ Print Statement
            </button>

            <button
              onClick={onClose}
              style={{
                background: '#0f172a',
                border: '1px solid #475569',
                color: '#94a3b8',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* PRINTABLE STATEMENT BODY */}
        <div style={{
          padding: '2rem',
          overflowY: 'auto',
          flex: 1,
          background: '#334155',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#cbd5e1' }}>
              <p>Compiling customer statement ledger and debt aging schedule...</p>
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              color: '#0f172a',
              width: '100%',
              maxWidth: '800px',
              padding: '2.5rem',
              borderRadius: '4px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              fontFamily: '"Segoe UI", sans-serif',
              lineHeight: 1.5
            }}>
              {/* CORPORATE STATEMENT HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
                    {company.legal_name || 'AKPALI & CO. LIMITED'}
                  </h1>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                    {company.address || 'Akpali Plaza, Upper Hill, Nairobi, Kenya'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    KRA Tax PIN: <strong>{company.tax_pin || 'P051234567Z'}</strong> | Tel: {company.phone || '+254 700 000 000'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.3rem 0.8rem',
                    background: '#0f172a',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    Statement of Account
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.4rem' }}>
                    Date: <strong>{data.statement_date || new Date().toLocaleDateString('en-GB')}</strong>
                  </div>
                </div>
              </div>

              {/* CLIENT DETAILS */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Client Account Details</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>{client.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>KRA PIN: {client.tax_pin || 'Not Specified'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>Address: {client.address || 'Nairobi, Kenya'}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Balance Due</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: data.total_balance_due > 0 ? '#b91c1c' : '#15803d' }}>
                    {formatAmount(data.total_balance_due || 0)}
                  </div>
                </div>
              </div>

              {/* AGING ANALYSIS MATRIX */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Aging Analysis Breakdown (Days Past Due)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
                  <div style={{ background: '#f1f5f9', padding: '0.6rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Current (0-30)</div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', marginTop: '0.2rem' }}>{formatAmount(aging.current_0_30 || 0)}</div>
                  </div>
                  <div style={{ background: '#f1f5f9', padding: '0.6rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>31 - 60 Days</div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', marginTop: '0.2rem' }}>{formatAmount(aging.days_31_60 || 0)}</div>
                  </div>
                  <div style={{ background: '#f1f5f9', padding: '0.6rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>61 - 90 Days</div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', marginTop: '0.2rem' }}>{formatAmount(aging.days_61_90 || 0)}</div>
                  </div>
                  <div style={{ background: '#fef2f2', padding: '0.6rem', borderRadius: '4px', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: '0.7rem', color: '#b91c1c' }}>90+ Days (Overdue)</div>
                    <div style={{ fontWeight: 'bold', color: '#b91c1c', marginTop: '0.2rem' }}>{formatAmount(aging.days_90_plus || 0)}</div>
                  </div>
                  <div style={{ background: '#0f172a', color: '#fff', padding: '0.6rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Total Amount Due</div>
                    <div style={{ fontWeight: 'bold', color: '#fff', marginTop: '0.2rem' }}>{formatAmount(data.total_balance_due || 0)}</div>
                  </div>
                </div>
              </div>

              {/* INVOICES & BILLINGS LEDGER TABLE */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #0f172a', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Invoice Ref</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Date</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Project / Tender Scope</th>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Billed Amount</th>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Age (Days)</th>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Balance Due</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No invoices billed to this client yet.</td></tr>
                  ) : invoices.map((inv, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: 'bold', color: '#0f172a' }}>{inv.id}</td>
                      <td style={{ padding: '0.6rem 0.8rem', color: '#475569' }}>{inv.invoice_date}</td>
                      <td style={{ padding: '0.6rem 0.8rem', color: '#334155' }}>{inv.tender_name || inv.reference_id || 'Tender Milestone'}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: '600' }}>{formatAmount(inv.amount)}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: inv.age_days > 60 ? '#b91c1c' : '#475569', fontWeight: inv.age_days > 60 ? 'bold' : 'normal' }}>
                        {inv.age_days}d
                      </td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 'bold', color: inv.balance_due > 0 ? '#b91c1c' : '#15803d' }}>
                        {formatAmount(inv.balance_due)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* REMITTANCE INSTRUCTIONS */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '0.3rem' }}>Banking & Remittance Instructions</div>
                <div>Bank: <strong>{data.bank?.name || 'KCB Bank Kenya Limited'}</strong></div>
                <div>Account Name: <strong>{company.legal_name || 'Akpali & Co.'}</strong></div>
                <div>Account Number: <strong>{data.bank?.account_number || '1234567890'}</strong> • Branch: {data.bank?.branch || 'Upper Hill Branch'}</div>
                <div style={{ marginTop: '0.4rem', color: '#64748b' }}>Please quote the statement or invoice reference when remitting funds. Thank you.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
