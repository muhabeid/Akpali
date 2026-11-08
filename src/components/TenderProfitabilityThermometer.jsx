import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export default function TenderProfitabilityThermometer({ tenderId }) {
  const { formatAmount } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenderId) return;
    setLoading(true);
    fetch(`http://localhost:5000/api/tenders/${tenderId}/profitability-deep-dive`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching tender profitability:', err);
        setLoading(false);
      });
  }, [tenderId]);

  if (loading) {
    return (
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: '#0f172a', border: '1px solid #334155', textAlign: 'center', color: '#94a3b8' }}>
        <span>Analyzing tender cost commitments and live budget thermometer...</span>
      </div>
    );
  }

  if (!data) return null;

  const burnPct = Math.min(Math.max(data.burn_pct || 0, 0), 100);
  const marginPct = data.projected_margin_pct || 0;
  const isOverrun = data.remaining_committed_budget < 0;

  // Thermometer color logic
  let thermometerColor = '#10b981'; // Green
  let statusBadge = { bg: '#10b98122', text: '#10b981', border: '#10b981', label: 'EXCELLENT MARGIN' };

  if (isOverrun) {
    thermometerColor = '#ef4444'; // Red
    statusBadge = { bg: '#ef444422', text: '#ef4444', border: '#ef4444', label: 'BUDGET DEFICIT / OVERRUN' };
  } else if (marginPct < 15) {
    thermometerColor = '#f59e0b'; // Amber
    statusBadge = { bg: '#f59e0b22', text: '#f59e0b', border: '#f59e0b', label: 'SLIM MARGIN WARNING' };
  } else if (marginPct < 25) {
    thermometerColor = '#3b82f6'; // Blue
    statusBadge = { bg: '#3b82f622', text: '#3b82f6', border: '#3b82f6', label: 'HEALTHY MARGIN' };
  }

  return (
    <div className="card" style={{
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      border: `1px solid ${isOverrun ? '#ef4444' : '#334155'}`,
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🌡️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: '700' }}>
              Live Tender Profitability & Budget vs. Actual Thermometer
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Real-time commitment audit: Contract Ceiling vs. Issued POs vs. Incurred Site Expenses
            </span>
          </div>
        </div>

        <div style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          background: statusBadge.bg,
          color: statusBadge.text,
          border: `1px solid ${statusBadge.border}`,
          fontSize: '0.75rem',
          fontWeight: '800',
          letterSpacing: '0.05em'
        }}>
          ● {statusBadge.label} ({marginPct}% Projected)
        </div>
      </div>

      {/* THERMOMETER PROGRESS BAR */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
          <span style={{ color: '#94a3b8' }}>
            Budget Consumed: <strong style={{ color: thermometerColor }}>{data.burn_pct}%</strong>
          </span>
          <span style={{ color: '#94a3b8' }}>
            Available Margin: <strong style={{ color: isOverrun ? '#ef4444' : '#10b981' }}>{marginPct}%</strong>
          </span>
        </div>

        <div style={{
          width: '100%',
          height: '14px',
          background: '#334155',
          borderRadius: '999px',
          overflow: 'hidden',
          display: 'flex',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
        }}>
          <div
            style={{
              width: `${Math.min(data.burn_pct || 0, 100)}%`,
              background: `linear-gradient(90deg, #3b82f6 0%, ${thermometerColor} 100%)`,
              transition: 'width 0.8s ease-in-out',
              borderRadius: '999px'
            }}
          />
        </div>
      </div>

      {/* 5-METRIC COMPARISON GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #334155' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Contract Award Ceiling</div>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>
            {formatAmount(data.contract_value)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Committed PO Orders</div>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#38bdf8' }}>
            {formatAmount(data.committed_cost)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Actual Incurred Cost</div>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#eab308' }}>
            {formatAmount(data.total_budget_burn)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Invoiced to Client</div>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#a855f7' }}>
            {formatAmount(data.total_invoiced)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Projected Net Margin</div>
          <div style={{ fontSize: '1.05rem', fontWeight: '800', color: isOverrun ? '#ef4444' : '#10b981' }}>
            {formatAmount(data.remaining_committed_budget)}
          </div>
        </div>
      </div>
    </div>
  );
}
