import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export default function MakerCheckerMatrixSection() {
  const { formatAmount } = useCurrency();
  const [workflows, setWorkflows] = useState([]);
  const [limits, setLimits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatrix = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/approval-workflows/matrix')
      .then(res => res.json())
      .then(json => {
        setWorkflows(json.workflows || []);
        setLimits(json.limits || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching approval matrix:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  return (
    <div style={{ background: 'hsla(var(--primary), 0.04)', border: '1px solid hsla(var(--primary), 0.18)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid hsla(var(--primary), 0.15)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.3rem' }}>⚖️</span>
            <h4 style={{ margin: 0, color: 'hsl(var(--primary))', fontSize: '1.1rem', fontWeight: 'bold' }}>
              Automated Multi-Level Approval Limits (Maker-Checker Matrix)
            </h4>
          </div>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: '#64748b' }}>
            Segregation of duties enforcing financial ceilings. Purchases and disbursements exceeding threshold automatically flag for higher manager approval.
          </p>
        </div>

        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '10px', background: '#10b98122', color: '#10b981', fontWeight: '700' }}>
          ✓ Maker-Checker Enforcement Active
        </span>
      </div>

      {/* 3 TIERS OVERVIEW TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase' }}>Tier 1: Operational Officers</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginTop: '0.3rem' }}>Up to KES 100,000</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Procurement Officers & Finance Accountants. Standard operational orders.
          </div>
        </div>

        <div style={{ padding: '1rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #38bdf8' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a855f7', textTransform: 'uppercase' }}>Tier 2: Department Managers</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginTop: '0.3rem' }}>Up to KES 500,000</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Procurement & Finance Managers. Commercial approvals and bulk supplies.
          </div>
        </div>

        <div style={{ padding: '1rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase' }}>Tier 3: Executive Board / Admin</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginTop: '0.3rem' }}>Over KES 500,000 (Unlimited)</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Managing Director & Universal Admin. High-value capital orders.
          </div>
        </div>
      </div>

      {/* RULES TABLE */}
      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #334155' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
          <thead>
            <tr style={{ background: '#0f172a', textAlign: 'left', borderBottom: '2px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '0.6rem 0.8rem' }}>Rule Ref</th>
              <th style={{ padding: '0.6rem 0.8rem' }}>Module / Financial Action</th>
              <th style={{ padding: '0.6rem 0.8rem' }}>Initiating Role (Maker)</th>
              <th style={{ padding: '0.6rem 0.8rem' }}>Approving Authority (Checker)</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Authorization Ceiling (KES)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading authorization matrix...</td></tr>
            ) : workflows.map((wf, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '0.6rem 0.8rem', fontWeight: 'bold', color: '#38bdf8' }}>{wf.id}</td>
                <td style={{ padding: '0.6rem 0.8rem', fontWeight: '600', color: '#fff' }}>{wf.module_name}</td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1' }}>
                  <span style={{ padding: '0.15rem 0.45rem', borderRadius: '4px', background: '#334155', color: '#e2e8f0', fontSize: '0.75rem' }}>
                    {wf.maker_role}
                  </span>
                </td>
                <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1' }}>
                  <span style={{ padding: '0.15rem 0.45rem', borderRadius: '4px', background: '#0284c722', color: '#38bdf8', border: '1px solid #0284c744', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {wf.checker_role}
                  </span>
                </td>
                <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: '800', color: '#10b981' }}>
                  {formatAmount(wf.threshold_amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
