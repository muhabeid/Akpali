import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export default function PredictiveCashflowTab() {
  const { formatAmount } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5000/api/finances/predictive-cashflow')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching cashflow forecast:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <p>Calculating 30–60–90 day predictive liquidity forecast...</p>
      </div>
    );
  }

  if (!data) return null;

  const risk = data.risk_status || 'HEALTHY';
  let badgeColor = '#10b981';
  let badgeBg = '#10b98122';
  if (risk === 'DEFICIT RISK') {
    badgeColor = '#ef4444';
    badgeBg = '#ef444422';
  } else if (risk === 'CAUTION') {
    badgeColor = '#f59e0b';
    badgeBg = '#f59e0b22';
  }

  const milestones = data.milestones || {};
  const timeline = data.timeline || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* HEADER CARD */}
      <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              🔮 30–60–90 Day Predictive Cash Flow Forecaster
            </h2>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Dynamic financial projection simulating liquid bank positions against unbilled client milestones, approved supplier POs, and operating overheads.
            </p>
          </div>

          <div style={{
            padding: '0.4rem 1rem',
            borderRadius: '999px',
            background: badgeBg,
            color: badgeColor,
            border: `1px solid ${badgeColor}66`,
            fontSize: '0.85rem',
            fontWeight: '800',
            letterSpacing: '0.05em'
          }}>
            ● LIQUIDITY OUTLOOK: {risk}
          </div>
        </div>

        {/* 3 HORIZON TILES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
          {/* TODAY */}
          <div className="card" style={{ padding: '1.25rem', background: '#0f172a', border: '1px solid #334155' }}>
            <span className="stat-label">Current Liquid Bank Cash</span>
            <span className="stat-value" style={{ color: '#fff' }}>{formatAmount(data.current_liquid_cash)}</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '0.2rem' }}>Reconciled Bank, M-Pesa & Cash balances</span>
          </div>

          {/* 30 DAYS */}
          <div className="card" style={{ padding: '1.25rem', background: '#0f172a', border: '1px solid #38bdf8' }}>
            <span className="stat-label">30-Day Projected Position</span>
            <span className="stat-value" style={{ color: '#38bdf8' }}>{formatAmount(milestones.days_30?.projected_balance || 0)}</span>
            <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
              <span>In: +{formatAmount(milestones.days_30?.inflows || 0)}</span>
              <span>Out: -{formatAmount(milestones.days_30?.outflows || 0)}</span>
            </div>
          </div>

          {/* 60 DAYS */}
          <div className="card" style={{ padding: '1.25rem', background: '#0f172a', border: '1px solid #a855f7' }}>
            <span className="stat-label">60-Day Projected Position</span>
            <span className="stat-value" style={{ color: '#a855f7' }}>{formatAmount(milestones.days_60?.projected_balance || 0)}</span>
            <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
              <span>In: +{formatAmount(milestones.days_60?.inflows || 0)}</span>
              <span>Out: -{formatAmount(milestones.days_60?.outflows || 0)}</span>
            </div>
          </div>

          {/* 90 DAYS */}
          <div className="card" style={{ padding: '1.25rem', background: '#0f172a', border: '1px solid #10b981' }}>
            <span className="stat-label">90-Day Projected Position</span>
            <span className="stat-value" style={{ color: '#10b981' }}>{formatAmount(milestones.days_90?.projected_balance || 0)}</span>
            <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
              <span>In: +{formatAmount(milestones.days_90?.inflows || 0)}</span>
              <span>Out: -{formatAmount(milestones.days_90?.outflows || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* VISUAL TIMELINE PROGRESSION */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#fff' }}>
          Visual Treasury Liquidity Curve (Day 0 to Day 90)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {timeline.map((step, idx) => {
            const isNegative = step.balance < 0;
            return (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: isNegative ? 'rgba(239, 68, 68, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${isNegative ? '#ef4444' : '#334155'}`,
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>{step.label}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0.4rem 0', color: isNegative ? '#ef4444' : '#10b981' }}>
                  {formatAmount(step.balance)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {idx === 0 ? 'Starting Liquidity' : `Net Flow: ${formatAmount((step.inflow || 0) - (step.outflow || 0))}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STRATEGIC TREASURY ADVISORY */}
      <div className="card" style={{ padding: '1.5rem', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8', fontSize: '1rem' }}>
          💡 Treasury & Cash Flow Optimization Recommendations
        </h4>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.7 }}>
          <li>
            <strong>Invoice Accelerated Billing:</strong> Review active tender milestones and ensure Practical Completion / Delivery certificates are verified to trigger client billing within 7 days.
          </li>
          <li>
            <strong>Supplier Payment Terms:</strong> Align major material purchases with 30-day or 60-day vendor credit windows to match scheduled client payment milestones.
          </li>
          <li>
            <strong>Buffer Maintenance:</strong> Maintain a minimum liquid treasury cushion of KES 500,000 across KCB and M-Pesa to prevent project downtime or site payroll delays.
          </li>
        </ul>
      </div>
    </div>
  );
}
