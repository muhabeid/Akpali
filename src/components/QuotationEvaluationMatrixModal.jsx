import React, { useState, useEffect } from 'react';

export default function QuotationEvaluationMatrixModal({ isOpen, onClose, rfq, onAwardSuccess }) {
  if (!isOpen || !rfq) return null;

  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'add'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ quotations: [], rfq_items: [], matrix_comparison: [] });
  const [suppliers, setSuppliers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [awardingId, setAwardingId] = useState(null);

  // Form State for Adding Quote
  const [quoteForm, setQuoteForm] = useState({
    supplier_id: '',
    supplier_name: '',
    delivery_lead_time_days: 7,
    warranty_terms: '12 Months Manufacturer Warranty',
    payment_credit_terms: '30 Days Net on Invoiced Delivery',
    compliance_status: 'Compliant',
    compliance_notes: '',
    items: []
  });

  const fetchMatrixData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/rfqs/${rfq.id}/quotations`);
      if (res.ok) {
        const json = await res.json();
        setData(json);

        // Pre-fill form items based on RFQ items
        if (json.rfq_items && json.rfq_items.length > 0) {
          setQuoteForm(prev => ({
            ...prev,
            items: json.rfq_items.map(item => ({
              description: item.description || item.name || 'Item',
              quantity: Number(item.quantity || item.qty || 1),
              unit: item.unit || 'Units',
              unit_price: ''
            }))
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching quotation matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrixData();

    // Fetch suppliers list for dropdown
    fetch('http://localhost:5000/api/suppliers')
      .then(res => res.json())
      .then(list => setSuppliers(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, [rfq.id]);

  const handleSupplierSelect = (supplierId) => {
    const sup = suppliers.find(s => s.id === supplierId);
    if (sup) {
      setQuoteForm(prev => ({
        ...prev,
        supplier_id: sup.id,
        supplier_name: sup.name
      }));
    } else {
      setQuoteForm(prev => ({ ...prev, supplier_id: '', supplier_name: supplierId }));
    }
  };

  const handleItemPriceChange = (index, price) => {
    setQuoteForm(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], unit_price: price };
      return { ...prev, items: updated };
    });
  };

  const calculateFormTotal = () => {
    return quoteForm.items.reduce((sum, item) => {
      const price = parseFloat(item.unit_price) || 0;
      const qty = parseFloat(item.quantity) || 1;
      return sum + (price * qty);
    }, 0);
  };

  const handleAddQuoteSubmit = async (e) => {
    e.preventDefault();
    if (!quoteForm.supplier_name.trim()) {
      alert('Please select or specify a supplier name.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplier_id: quoteForm.supplier_id || null,
        supplier_name: quoteForm.supplier_name,
        delivery_lead_time_days: Number(quoteForm.delivery_lead_time_days) || 7,
        warranty_terms: quoteForm.warranty_terms,
        payment_credit_terms: quoteForm.payment_credit_terms,
        compliance_status: quoteForm.compliance_status,
        compliance_notes: quoteForm.compliance_notes,
        items: quoteForm.items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unit: i.unit,
          unit_price: parseFloat(i.unit_price) || 0,
          total_price: (parseFloat(i.unit_price) || 0) * (parseFloat(i.quantity) || 1)
        })),
        total_amount: calculateFormTotal()
      };

      const res = await fetch(`http://localhost:5000/api/rfqs/${rfq.id}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`✅ Quotation from "${quoteForm.supplier_name}" successfully recorded!`);
        setActiveTab('matrix');
        fetchMatrixData();
      } else {
        const errJson = await res.json();
        alert(`Failed to save quote: ${errJson.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error submitting quotation: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAwardPO = async (quote) => {
    if (!window.confirm(`Are you sure you want to award RFQ #${rfq.id} to "${quote.supplier_name}" for KES ${Number(quote.total_amount).toLocaleString()}?\n\nThis will automatically generate an approved Supplier Purchase Order (PO).`)) {
      return;
    }

    setAwardingId(quote.id);
    try {
      const res = await fetch(`http://localhost:5000/api/rfqs/${rfq.id}/award-po`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation_id: quote.id })
      });

      const result = await res.json();
      if (res.ok) {
        alert(`🎉 Purchase Order #${result.po_id} successfully created and RFQ #${rfq.id} awarded to ${result.supplier_name}!`);
        if (onAwardSuccess) onAwardSuccess(result);
        onClose();
      } else {
        alert(`Failed to award RFQ: ${result.error || 'Server error'}`);
      }
    } catch (err) {
      alert(`Error awarding RFQ: ${err.message}`);
    } finally {
      setAwardingId(null);
    }
  };

  const quotes = data.quotations || [];
  const matrix = data.matrix_comparison || [];
  const recommendedId = data.recommended_quote_id;

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
        maxWidth: '1200px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        overflow: 'hidden',
        color: '#f8fafc'
      }}>
        {/* MODAL HEADER */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #334155',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.4rem' }}>⚖️</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
                Side-by-Side Supplier Quotation Evaluation Matrix
              </h2>
              <span style={{
                background: rfq.status === 'Awarded' ? '#059669' : '#3b82f6',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                textTransform: 'uppercase'
              }}>
                RFQ #{rfq.id} ({rfq.status})
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 2.15rem', fontSize: '0.825rem', color: '#94a3b8' }}>
              Tender: <strong style={{ color: '#e2e8f0' }}>{rfq.tender_name || 'Direct Project Supply'}</strong> • 
              Deadline: <strong style={{ color: '#e2e8f0' }}>{rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : 'N/A'}</strong> • 
              Responding Vendors: <strong style={{ color: '#38bdf8' }}>{quotes.length} Suppliers</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              style={{
                background: '#1e293b',
                border: '1px solid #475569',
                color: '#94a3b8',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.1rem'
              }}
              title="Close Modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #334155',
          background: '#1e293b',
          padding: '0 1.75rem'
        }}>
          <button
            onClick={() => setActiveTab('matrix')}
            style={{
              padding: '0.9rem 1.4rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'matrix' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'matrix' ? '#38bdf8' : '#94a3b8',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📊 Side-by-Side Comparison Matrix ({quotes.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            style={{
              padding: '0.9rem 1.4rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'add' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'add' ? '#38bdf8' : '#94a3b8',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ➕ Record Supplier Quotation
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              <p>Analyzing quotation metrics and vendor unit prices...</p>
            </div>
          ) : activeTab === 'matrix' ? (
            <div>
              {quotes.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  background: '#1e293b55',
                  borderRadius: '12px',
                  border: '1px dashed #475569'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#e2e8f0' }}>No Supplier Quotations Received Yet</h3>
                  <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
                    Record responses from competing vendors to view the side-by-side unit price matrix, lowest compliant bidder indicator, and 1-click PO conversion.
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="btn btn-primary"
                    style={{ padding: '0.6rem 1.25rem', fontWeight: 'bold' }}
                  >
                    + Record First Supplier Quotation
                  </button>
                </div>
              ) : (
                <div>
                  {/* RECOMMENDED BIDDER HIGHLIGHT BANNER */}
                  {data.recommended_supplier_name && (
                    <div style={{
                      marginBottom: '1.5rem',
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                      border: '1px solid #10b981',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.75rem' }}>🏆</span>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Lowest Compliant Bidder Identified
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>
                            {data.recommended_supplier_name}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Bid Valuation</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#38bdf8' }}>
                            KES {Number(quotes.find(q => q.id === recommendedId)?.total_amount || 0).toLocaleString()}
                          </div>
                        </div>

                        {rfq.status !== 'Awarded' && (
                          <button
                            onClick={() => handleAwardPO(quotes.find(q => q.id === recommendedId))}
                            disabled={awardingId !== null}
                            className="btn btn-primary"
                            style={{
                              background: '#10b981',
                              borderColor: '#059669',
                              fontWeight: '700',
                              padding: '0.6rem 1.2rem',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            {awardingId === recommendedId ? 'Generating PO...' : '⚡ 1-Click Award & Issue PO'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SIDE-BY-SIDE MATRIX TABLE */}
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #334155' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: '#1e293b', borderBottom: '2px solid #334155' }}>
                          <th style={{ padding: '1rem', textAlign: 'left', minWidth: '220px', color: '#94a3b8' }}>
                            Evaluation Metric / Item
                          </th>
                          {quotes.map(q => {
                            const isRecommended = q.id === recommendedId;
                            const isAwarded = q.is_awarded === 1;
                            return (
                              <th
                                key={q.id}
                                style={{
                                  padding: '1rem',
                                  textAlign: 'center',
                                  minWidth: '240px',
                                  background: isRecommended ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                                  borderLeft: '1px solid #334155'
                                }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                  {isRecommended && (
                                    <span style={{
                                      fontSize: '0.65rem',
                                      padding: '0.15rem 0.5rem',
                                      borderRadius: '999px',
                                      background: '#10b981',
                                      color: '#fff',
                                      fontWeight: '800'
                                    }}>
                                      ⭐ LOWEST COMPLIANT
                                    </span>
                                  )}
                                  {isAwarded && (
                                    <span style={{
                                      fontSize: '0.65rem',
                                      padding: '0.15rem 0.5rem',
                                      borderRadius: '999px',
                                      background: '#3b82f6',
                                      color: '#fff',
                                      fontWeight: '800'
                                    }}>
                                      ✅ AWARDED PO
                                    </span>
                                  )}
                                  <span style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>
                                    {q.supplier_name}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    Quote Ref: {q.id}
                                  </span>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody>
                        {/* LINE ITEMS UNIT PRICES */}
                        {matrix.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#0f172a' : '#1e293b33' }}>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ fontWeight: '600', color: '#e2e8f0' }}>{row.description}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                Req. Qty: <strong>{row.quantity} {row.unit}</strong>
                              </div>
                            </td>

                            {quotes.map(q => {
                              const bid = row.supplier_bids.find(b => b.quote_id === q.id);
                              const isLowestItemPrice = bid && bid.unit_price !== null && bid.unit_price === row.lowest_unit_price;

                              return (
                                <td
                                  key={q.id}
                                  style={{
                                    padding: '0.85rem 1rem',
                                    textAlign: 'center',
                                    borderLeft: '1px solid #334155',
                                    background: isLowestItemPrice ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                                  }}
                                >
                                  {bid && bid.unit_price !== null ? (
                                    <div>
                                      <div style={{
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        color: isLowestItemPrice ? '#10b981' : '#f8fafc',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem'
                                      }}>
                                        KES {bid.unit_price.toLocaleString()}
                                        {isLowestItemPrice && (
                                          <span style={{ fontSize: '0.65rem', background: '#10b98122', color: '#10b981', border: '1px solid #10b98144', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                            Best
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                                        Total: KES {(bid.total_line_price || 0).toLocaleString()}
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{ color: '#64748b' }}>Not Quoted</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}

                        {/* TOTAL COST ROW */}
                        <tr style={{ background: '#1e293b', borderBottom: '2px solid #334155', fontWeight: '700' }}>
                          <td style={{ padding: '1rem', color: '#38bdf8', fontSize: '0.95rem' }}>
                            💰 Total Quoted Bid Value
                          </td>
                          {quotes.map(q => {
                            const isLowest = q.id === recommendedId;
                            return (
                              <td
                                key={q.id}
                                style={{
                                  padding: '1rem',
                                  textAlign: 'center',
                                  borderLeft: '1px solid #334155',
                                  fontSize: '1.1rem',
                                  color: isLowest ? '#10b981' : '#fff'
                                }}
                              >
                                KES {Number(q.total_amount).toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>

                        {/* DELIVERY LEAD TIME ROW */}
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                            ⏱️ Delivery Lead Time
                          </td>
                          {quotes.map(q => (
                            <td key={q.id} style={{ padding: '0.85rem 1rem', textAlign: 'center', borderLeft: '1px solid #334155' }}>
                              <span style={{
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                background: q.delivery_lead_time_days <= 5 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                color: q.delivery_lead_time_days <= 5 ? '#10b981' : '#eab308',
                                fontWeight: '700'
                              }}>
                                {q.delivery_lead_time_days} Calendar Days
                              </span>
                            </td>
                          ))}
                        </tr>

                        {/* WARRANTY TERMS ROW */}
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                            🛡️ Warranty Guarantee
                          </td>
                          {quotes.map(q => (
                            <td key={q.id} style={{ padding: '0.85rem 1rem', textAlign: 'center', borderLeft: '1px solid #334155', fontSize: '0.8rem', color: '#94a3b8' }}>
                              {q.warranty_terms}
                            </td>
                          ))}
                        </tr>

                        {/* PAYMENT CREDIT TERMS ROW */}
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                            💳 Payment Credit Terms
                          </td>
                          {quotes.map(q => (
                            <td key={q.id} style={{ padding: '0.85rem 1rem', textAlign: 'center', borderLeft: '1px solid #334155', fontSize: '0.8rem', color: '#94a3b8' }}>
                              {q.payment_credit_terms}
                            </td>
                          ))}
                        </tr>

                        {/* COMPLIANCE STATUS ROW */}
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                            📋 Technical & Tax Compliance
                          </td>
                          {quotes.map(q => (
                            <td key={q.id} style={{ padding: '0.85rem 1rem', textAlign: 'center', borderLeft: '1px solid #334155' }}>
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                background: q.compliance_status === 'Compliant' ? '#05966933' : '#dc262633',
                                color: q.compliance_status === 'Compliant' ? '#10b981' : '#ef4444'
                              }}>
                                {q.compliance_status}
                              </span>
                            </td>
                          ))}
                        </tr>

                        {/* 1-CLICK AWARD ACTION ROW */}
                        <tr style={{ background: '#1e293b' }}>
                          <td style={{ padding: '1rem', color: '#94a3b8' }}>
                            Final Award Action
                          </td>
                          {quotes.map(q => (
                            <td key={q.id} style={{ padding: '1rem', textAlign: 'center', borderLeft: '1px solid #334155' }}>
                              {q.is_awarded === 1 ? (
                                <span style={{ color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                  ✓ PO Already Issued
                                </span>
                              ) : rfq.status === 'Awarded' ? (
                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>RFQ Closed</span>
                              ) : (
                                <button
                                  onClick={() => handleAwardPO(q)}
                                  disabled={awardingId !== null}
                                  className="btn"
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    background: q.id === recommendedId ? '#10b981' : '#334155',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {awardingId === q.id ? 'Issuing PO...' : q.id === recommendedId ? '🏆 Award Best Bidder' : 'Award This Bid'}
                                </button>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: RECORD SUPPLIER QUOTATION FORM */
            <form onSubmit={handleAddQuoteSubmit} style={{ maxWidth: '850px', margin: '0 auto' }}>
              <div style={{
                background: '#1e293b',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#fff' }}>
                  Record Incoming Vendor Quotation
                </h3>

                {/* SUPPLIER SELECTOR */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: '600' }}>
                    Select Supplier / Vendor *
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <select
                      className="form-control"
                      style={{ flex: 1, background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                      value={quoteForm.supplier_id}
                      onChange={e => handleSupplierSelect(e.target.value)}
                    >
                      <option value="">-- Choose from Supplier Registry --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.kra_pin || 'No PIN'})</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      className="form-control"
                      style={{ flex: 1, background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                      placeholder="Or enter custom supplier name..."
                      value={quoteForm.supplier_name}
                      onChange={e => setQuoteForm(prev => ({ ...prev, supplier_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* LINE ITEMS PRICING */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: '600' }}>
                    Itemized Quoted Unit Rates (KES) *
                  </label>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                        <th style={{ padding: '0.6rem 0.8rem' }}>Item Description</th>
                        <th style={{ padding: '0.6rem 0.8rem', width: '100px' }}>Quantity</th>
                        <th style={{ padding: '0.6rem 0.8rem', width: '180px' }}>Quoted Unit Price (KES)</th>
                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right', width: '160px' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteForm.items.map((item, idx) => {
                        const price = parseFloat(item.unit_price) || 0;
                        const subtotal = price * (parseFloat(item.quantity) || 1);

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '0.6rem 0.8rem', color: '#fff' }}>{item.description}</td>
                            <td style={{ padding: '0.6rem 0.8rem', color: '#94a3b8' }}>
                              {item.quantity} {item.unit}
                            </td>
                            <td style={{ padding: '0.6rem 0.8rem' }}>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                className="form-control"
                                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', padding: '0.35rem 0.5rem' }}
                                placeholder="0.00"
                                value={item.unit_price}
                                onChange={e => handleItemPriceChange(idx, e.target.value)}
                                required
                              />
                            </td>
                            <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: '700', color: '#38bdf8' }}>
                              KES {subtotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#0f172a', fontWeight: '800', borderTop: '2px solid #475569' }}>
                        <td colSpan="3" style={{ padding: '0.75rem 0.8rem', textAlign: 'right', color: '#e2e8f0' }}>
                          Total Quotation Value:
                        </td>
                        <td style={{ padding: '0.75rem 0.8rem', textAlign: 'right', color: '#10b981', fontSize: '1rem' }}>
                          KES {calculateFormTotal().toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* COMMERCIAL TERMS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: '600' }}>
                      Delivery Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                      value={quoteForm.delivery_lead_time_days}
                      onChange={e => setQuoteForm(prev => ({ ...prev, delivery_lead_time_days: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: '600' }}>
                      Warranty Period
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                      value={quoteForm.warranty_terms}
                      onChange={e => setQuoteForm(prev => ({ ...prev, warranty_terms: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: '600' }}>
                      Payment Credit Terms
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                      value={quoteForm.payment_credit_terms}
                      onChange={e => setQuoteForm(prev => ({ ...prev, payment_credit_terms: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: '600' }}>
                      Compliance Classification
                    </label>
                    <select
                      className="form-control"
                      style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                      value={quoteForm.compliance_status}
                      onChange={e => setQuoteForm(prev => ({ ...prev, compliance_status: e.target.value }))}
                    >
                      <option value="Compliant">✓ Fully Compliant</option>
                      <option value="Non-Compliant">⚠️ Non-Compliant / Deviations</option>
                    </select>
                  </div>
                </div>

                {/* FORM ACTIONS */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('matrix')}
                    className="btn"
                    style={{ background: '#334155', color: '#fff' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ fontWeight: '700', padding: '0.6rem 1.5rem' }}
                  >
                    {submitting ? 'Recording...' : '💾 Save Supplier Quotation'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
