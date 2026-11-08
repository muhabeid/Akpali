import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export default function BankReconciliationTab() {
  const { formatAmount } = useCurrency();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('ACC-BANK');
  const [csvText, setCsvText] = useState('');
  const [filename, setFilename] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reconciliationResult, setReconciliationResult] = useState(null);
  const [pastReconciliations, setPastReconciliations] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/finances/accounts')
      .then(res => res.json())
      .then(list => {
        if (Array.isArray(list) && list.length > 0) {
          setAccounts(list);
          setSelectedAccount(list[0].id);
        }
      })
      .catch(() => {});

    fetchPastReconciliations();
  }, []);

  const fetchPastReconciliations = () => {
    fetch('http://localhost:5000/api/finances/reconciliations')
      .then(res => res.json())
      .then(list => setPastReconciliations(Array.isArray(list) ? list : []))
      .catch(() => {});
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFilename(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCsvText(evt.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSampleStatement = () => {
    const today = new Date().toISOString().split('T')[0];
    const sample = `Date,Reference,Description,Debit,Credit,Balance
${today},MPESA-QC819201,Payment from Ministry of Health Tender Milestone,,450000.00,1450000.00
${today},KCB-TX-90218,Supplier PO Delivery - Cement & Reinforcement Steel,125000.00,,1325000.00
${today},MPESA-W789123,Site Fuel & Transport Logistics,15000.00,,1310000.00
${today},BANK-FEE-881,Monthly Corporate Account Maintenance Ledger Fee,2500.00,,1307500.00
${today},INT-CR-0021,Credit Interest Accrued on Operating Balance,,1450.00,1308950.00`;
    setCsvText(sample);
    setFilename('KCB_Commercial_Statement_Sample.csv');
  };

  const handleRunReconciliation = async () => {
    if (!csvText.trim()) {
      alert('Please upload a bank or M-Pesa CSV statement or click "Load Sample Statement".');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch('http://localhost:5000/api/finances/reconciliation/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: selectedAccount,
          csv_text: csvText,
          filename: filename || 'Bank_Statement.csv'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReconciliationResult(data);
      } else {
        alert(`Reconciliation error: ${data.error || 'Failed to parse'}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveReconciliation = async () => {
    if (!reconciliationResult) return;
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/finances/reconciliation/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: selectedAccount,
          statement_filename: filename || 'Bank_Statement.csv',
          opening_balance: 0,
          closing_balance: reconciliationResult.summary?.total_statement_in - reconciliationResult.summary?.total_statement_out,
          reconciled_items: reconciliationResult.matched,
          unmatched_items: reconciliationResult.unmatched_statement
        })
      });

      if (res.ok) {
        alert('✅ Reconciliation snapshot committed to audit ledger successfully!');
        fetchPastReconciliations();
      }
    } catch (err) {
      alert(`Error saving reconciliation: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* HEADER CARD */}
      <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              💳 Automated Bank & M-Pesa CSV Statement Reconciliation
            </h2>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Auto-matches KCB, Equity, Stanbic, and Safaricom M-Pesa statements against ERP Cash Book ledger by amount, date, and reference.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadSampleStatement}
            className="btn"
            style={{ background: '#334155', color: '#38bdf8', border: '1px solid #475569', fontSize: '0.8rem', fontWeight: 'bold' }}
          >
            📋 Load Sample Statement
          </button>
        </div>

        {/* INPUT CONTROLS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 'bold' }}>
              Target ERP Account
            </label>
            <select
              className="form-control"
              style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type}) - Balance: {formatAmount(acc.current_balance)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 'bold' }}>
              Upload CSV Statement File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="form-control"
              style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
            />
          </div>
        </div>

        {/* CSV PASTE BOX */}
        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 'bold' }}>
            Statement CSV Content (Direct File or Pasted Text)
          </label>
          <textarea
            rows="4"
            className="form-control"
            style={{ background: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.8rem', border: '1px solid #475569' }}
            placeholder="Date,Reference,Description,Debit,Credit,Balance..."
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button
            onClick={handleRunReconciliation}
            disabled={analyzing}
            className="btn btn-primary"
            style={{ fontWeight: 'bold', padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {analyzing ? 'Auto-Matching Ledger Records...' : '⚡ Run Intelligent Auto-Reconciliation'}
          </button>
        </div>
      </div>

      {/* RECONCILIATION RESULT VIEW */}
      {reconciliationResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem', background: '#1e293b', border: '1px solid #334155' }}>
              <span className="stat-label">Statement Records</span>
              <span className="stat-value" style={{ color: '#fff' }}>{reconciliationResult.summary?.statement_lines_count}</span>
            </div>

            <div className="card" style={{ padding: '1rem', background: '#1e293b', border: '1px solid #10b981' }}>
              <span className="stat-label">Matched & Verified</span>
              <span className="stat-value" style={{ color: '#10b981' }}>
                {reconciliationResult.summary?.matched_count} ({reconciliationResult.summary?.reconciliation_health_pct}%)
              </span>
            </div>

            <div className="card" style={{ padding: '1rem', background: '#1e293b', border: '1px solid #f59e0b' }}>
              <span className="stat-label">Unmatched Statement Lines</span>
              <span className="stat-value" style={{ color: '#f59e0b' }}>{reconciliationResult.summary?.unmatched_statement_count}</span>
            </div>

            <div className="card" style={{ padding: '1rem', background: '#1e293b', border: '1px solid #38bdf8' }}>
              <span className="stat-label">Total Inflows (Deposits)</span>
              <span className="stat-value" style={{ color: '#38bdf8' }}>{formatAmount(reconciliationResult.summary?.total_statement_in)}</span>
            </div>
          </div>

          {/* SIDE-BY-SIDE MATCHING TABLES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {/* 1. MATCHED TRANSACTIONS */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #10b981' }}>
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(16, 185, 129, 0.1)', borderBottom: '1px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  ✓ Matched & Verified Transactions ({reconciliationResult.matched.length})
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981' }}>Confidence: 100%</span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Date</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Statement Reference</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Statement Particulars</th>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>ERP Ledger Record</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliationResult.matched.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No direct matches identified in this run.</td></tr>
                  ) : reconciliationResult.matched.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '0.6rem 0.8rem', color: '#e2e8f0' }}>{m.statement_line.date}</td>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: 'bold', color: '#38bdf8' }}>{m.statement_line.reference}</td>
                      <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1' }}>{m.statement_line.description}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 'bold', color: m.statement_line.type === 'Income' ? '#10b981' : '#f43f5e' }}>
                        {formatAmount(m.statement_line.amount)}
                      </td>
                      <td style={{ padding: '0.6rem 0.8rem', color: '#94a3b8' }}>
                        {m.erp_transaction?.purpose || m.erp_transaction?.reference || 'ERP Transaction'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. UNMATCHED STATEMENT LINES (DISCREPANCIES) */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #f59e0b' }}>
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(245, 158, 11, 0.1)', borderBottom: '1px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  ⚠️ Unmatched Statement Lines ({reconciliationResult.unmatched_statement.length})
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Bank charges, unrecorded client deposits, or direct debit fees</span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Date</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Reference</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Statement Narrative</th>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliationResult.unmatched_statement.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>✓ Zero statement discrepancies! All lines reconciled.</td></tr>
                  ) : reconciliationResult.unmatched_statement.map((u, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '0.6rem 0.8rem', color: '#e2e8f0' }}>{u.date}</td>
                      <td style={{ padding: '0.6rem 0.8rem', color: '#f59e0b', fontWeight: 'bold' }}>{u.reference}</td>
                      <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1' }}>{u.description}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 'bold', color: u.type === 'Income' ? '#10b981' : '#f43f5e' }}>
                        {formatAmount(u.amount)}
                      </td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#f59e0b22', color: '#f59e0b', fontWeight: 'bold' }}>
                          Pending Ledger Entry
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COMMIT ACTION BAR */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              onClick={handleSaveReconciliation}
              disabled={saving}
              className="btn btn-primary"
              style={{ fontWeight: 'bold', padding: '0.65rem 1.5rem', background: '#059669', borderColor: '#047857' }}
            >
              {saving ? 'Saving...' : '💾 Commit Reconciliation Record to Ledger'}
            </button>
          </div>
        </div>
      )}

      {/* PAST RECONCILIATIONS AUDIT HISTORY */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid hsl(var(--border))' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Past Statement Reconciliation History</h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
              <th style={{ padding: '0.6rem 0.8rem' }}>Reconciliation ID</th>
              <th style={{ padding: '0.6rem 0.8rem' }}>Account</th>
              <th style={{ padding: '0.6rem 0.8rem' }}>Statement File</th>
              <th style={{ padding: '0.6rem 0.8rem' }}>Period</th>
              <th style={{ padding: '0.6rem 0.8rem' }}>Status</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Date Reconciled</th>
            </tr>
          </thead>
          <tbody>
            {pastReconciliations.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No prior reconciliations saved yet.</td></tr>
            ) : pastReconciliations.map((rec, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '0.6rem 0.8rem', fontWeight: 'bold', color: '#38bdf8' }}>{rec.id}</td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#fff' }}>{rec.account_name}</td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#94a3b8' }}>{rec.statement_filename}</td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#e2e8f0' }}>{rec.statement_period}</td>
                <td style={{ padding: '0.6rem 0.8rem' }}>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#10b98122', color: '#10b981', fontWeight: 'bold' }}>
                    {rec.status}
                  </span>
                </td>
                <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', color: '#94a3b8' }}>
                  {new Date(rec.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
