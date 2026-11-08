import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export default function TenderSubmissionBinderModal({ isOpen, onClose, tenderId }) {
  if (!isOpen || !tenderId) return null;

  const { formatAmount } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/tenders/${tenderId}/submission-pack`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching submission pack:', err);
        setLoading(false);
      });
  }, [tenderId]);

  const handlePrint = () => {
    window.print();
  };

  const tender = data?.tender || {};
  const company = data?.company || {};
  const directors = data?.directors || [];
  const registrations = data?.registrations || [];
  const experience = data?.experience || [];
  const accounts = data?.accounts || [];
  const policies = data?.policies || [];
  const consortium = data?.consortium || [];

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
      padding: '1rem'
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '16px',
        width: '98%',
        maxWidth: '1100px',
        maxHeight: '94vh',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📑</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#fff' }}>
                Automated 1-Click Tender Submission Packager (Bid Binder)
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Sequentially numbered A4 qualification dossier with automated Table of Contents
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: '700',
                padding: '0.5rem 1rem'
              }}
            >
              🖨️ Print / Download A4 Binder
            </button>

            <button
              onClick={onClose}
              style={{
                background: '#0f172a',
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
            >
              ✕
            </button>
          </div>
        </div>

        {/* PRINTABLE BINDER CONTAINER */}
        <div style={{
          padding: '2rem',
          overflowY: 'auto',
          flex: 1,
          background: '#334155',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#cbd5e1' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
              <p style={{ fontSize: '1.1rem' }}>Compiling corporate profiles, NCA licenses, director CVs & statutory declarations...</p>
            </div>
          ) : (
            <div className="bid-binder-document" style={{
              background: '#ffffff',
              color: '#0f172a',
              width: '100%',
              maxWidth: '850px',
              padding: '3rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              borderRadius: '4px',
              fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
              lineHeight: 1.6
            }}>
              {/* PAGE 1: COVER PAGE & TRANSMITTAL */}
              <div style={{
                minHeight: '900px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderBottom: '2px dashed #cbd5e1',
                paddingBottom: '3rem',
                marginBottom: '3rem'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0f172a', paddingBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src="/logo.png" alt="Company Logo" style={{ height: '55px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', letterSpacing: '0.02em', color: '#0f172a' }}>
                          {company.legal_name || 'AKPALI & CO. LIMITED'}
                        </h1>
                        <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                          General Building & Civil Engineering Contractors • Procurement & Supply Logistics
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#475569' }}>
                      <div>KRA PIN: <strong>{company.tax_pin || 'P051234567Z'}</strong></div>
                      <div>Reg No: <strong>{company.registration_num || 'CPR/2021/12345'}</strong></div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', margin: '4rem 0 3rem 0' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.4rem 1.25rem',
                      borderRadius: '999px',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginBottom: '1.5rem'
                    }}>
                      Official Tender Qualification Dossier
                    </div>

                    <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: '0 0 1rem 0', lineHeight: 1.3 }}>
                      {tender.name}
                    </h2>

                    <div style={{ fontSize: '1.1rem', color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Tender Reference No: <strong>{tender.client_reference || tender.id}</strong>
                    </div>

                    <div style={{ fontSize: '1rem', color: '#475569' }}>
                      Procuring Entity: <strong>{tender.client_name || 'Government Ministry / County Government'}</strong>
                    </div>
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    margin: '0 auto',
                    maxWidth: '550px'
                  }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem' }}>
                      Bid Submission Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.4rem', fontSize: '0.875rem' }}>
                      <span style={{ color: '#64748b' }}>Submitted By:</span>
                      <strong style={{ color: '#0f172a' }}>{company.legal_name || 'Akpali & Co.'}</strong>
                      
                      <span style={{ color: '#64748b' }}>Consortium:</span>
                      <strong style={{ color: '#0f172a' }}>{consortium.length > 0 ? `Joint Venture with ${consortium.map(c => c.partner_name).join(', ')}` : 'Sole Primary Contractor'}</strong>

                      <span style={{ color: '#64748b' }}>Submission Date:</span>
                      <strong style={{ color: '#0f172a' }}>{new Date().toLocaleDateString('en-GB')}</strong>

                      <span style={{ color: '#64748b' }}>Physical Address:</span>
                      <span style={{ color: '#0f172a' }}>{company.address || 'Akpali Plaza, Nairobi, Kenya'}</span>

                      <span style={{ color: '#64748b' }}>Contact Email:</span>
                      <span style={{ color: '#0f172a' }}>{company.email || 'info@akpali.com'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    CONFIDENTIAL BID DOCUMENT • PREPARED STRICTLY FOR TENDER EVALUATION
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <img src="/stamp.png" alt="Company Seal" style={{ height: '70px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0f172a', marginTop: '0.2rem' }}>Duly Authorized & Sealed</div>
                  </div>
                </div>
              </div>

              {/* PAGE 2: TABLE OF CONTENTS */}
              <div style={{
                minHeight: '850px',
                borderBottom: '2px dashed #cbd5e1',
                paddingBottom: '3rem',
                marginBottom: '3rem'
              }}>
                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>
                    Comprehensive Document Table of Contents
                  </h2>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Indexed technical and statutory qualification schedules
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', margin: '2rem 0' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #0f172a', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', width: '140px' }}>Schedule #</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Section Title & Qualification Scope</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', width: '90px' }}>Page</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>Preliminary</td>
                      <td style={{ padding: '0.75rem 1rem' }}>Official Tender Bid Submission Cover & Transmittal</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>i</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>Contents</td>
                      <td style={{ padding: '0.75rem 1rem' }}>Document Index & Sequential Schedule Pagination</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ii</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#0f172a' }}>Schedule 1</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Corporate Profile, Legal Incorporation, KRA PIN & CR12</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>1</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#0f172a' }}>Schedule 2</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Regulatory Technical Accreditations (NCA, EBK, PPRA, SBP)</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>2</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#0f172a' }}>Schedule 3</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Board of Directors & Key Engineering Personnel Profiles</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>3</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#0f172a' }}>Schedule 4</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Past Performance & Track Record of Similar Completed Contracts</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>4</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#0f172a' }}>Schedule 5</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Audited Financial Standing, Banker Credentials & Credit Capability</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>5</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#0f172a' }}>Schedule 6</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Statutory Anti-Corruption, Non-Debarment & Ethics Undertakings</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>6</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{
                  padding: '1rem',
                  borderRadius: '6px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  color: '#475569'
                }}>
                  <strong>Note:</strong> All documents appended in this submission are certified genuine copies under the Oaths and Statutory Declarations Act (Cap 15) Laws of Kenya.
                </div>
              </div>

              {/* PAGE 3: SCHEDULE 1 & 2 */}
              <div style={{
                minHeight: '850px',
                borderBottom: '2px dashed #cbd5e1',
                paddingBottom: '3rem',
                marginBottom: '3rem'
              }}>
                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                    Schedule 1: Corporate Profile & Legal Standing
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.85rem', marginBottom: '2rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>Entity Identification</div>
                    <div>Legal Name: <strong>{company.legal_name || 'Akpali & Co.'}</strong></div>
                    <div>Trading Name: <strong>{company.trading_name || company.legal_name}</strong></div>
                    <div>Registration No: <strong>{company.registration_num || 'CPR/2021/12345'}</strong></div>
                    <div>Date of Incorporation: <strong>{company.registration_date || '15/01/2021'}</strong></div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>Tax & Statutory Numbers</div>
                    <div>KRA PIN: <strong>{company.tax_pin || 'P051234567Z'}</strong></div>
                    <div>VAT Number: <strong>{company.vat_num || '01234567X'}</strong></div>
                    <div>Registered Address: <strong>{company.address || 'Upper Hill, Nairobi'}</strong></div>
                    <div>Official Email: <strong>{company.email || 'info@akpali.com'}</strong></div>
                  </div>
                </div>

                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '0.5rem', margin: '2rem 0 1.5rem 0' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                    Schedule 2: Technical Accreditations & Licenses
                  </h3>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Authority / Board</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Category & Grade</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Registration Number</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.length === 0 ? (
                      <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>Active NCA & Statutory Certifications Registered</td></tr>
                    ) : registrations.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.6rem 0.8rem', fontWeight: 'bold' }}>{r.authority_name}</td>
                        <td style={{ padding: '0.6rem 0.8rem' }}>{r.category_grade || 'Standard Contractor'}</td>
                        <td style={{ padding: '0.6rem 0.8rem' }}>{r.registration_number}</td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', color: '#16a34a', fontWeight: 'bold' }}>Active & Compliant</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGE 4: SCHEDULE 3 & 4 */}
              <div style={{
                minHeight: '850px',
                borderBottom: '2px dashed #cbd5e1',
                paddingBottom: '3rem',
                marginBottom: '3rem'
              }}>
                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                    Schedule 3: Board of Directors & Key Engineering Personnel
                  </h3>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '2.5rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Director / Officer</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Position</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>ID / Passport</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Tax PIN</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Shareholding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {directors.map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.6rem 0.8rem', fontWeight: 'bold' }}>{d.name}</td>
                        <td style={{ padding: '0.6rem 0.8rem' }}>{d.position}</td>
                        <td style={{ padding: '0.6rem 0.8rem' }}>{d.id_passport || '—'}</td>
                        <td style={{ padding: '0.6rem 0.8rem' }}>{d.kra_pin || '—'}</td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 'bold' }}>{d.shareholding_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                    Schedule 4: Past Performance & Track Record of Similar Contracts
                  </h3>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Project Name</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Client / Employer</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Contract Value (KES)</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {experience.length === 0 ? (
                      <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>Corporate Experience Log Archiving Active</td></tr>
                    ) : experience.map((exp, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.6rem 0.8rem', fontWeight: 'bold' }}>{exp.project_name}</td>
                        <td style={{ padding: '0.6rem 0.8rem' }}>{exp.client_name}</td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: 'bold' }}>{formatAmount(exp.contract_value)}</td>
                        <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>{exp.completion_date || 'Executed'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGE 5: SCHEDULE 5 & 6 & ATTESTATION */}
              <div>
                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                    Schedule 5: Financial Capacity & Banker Credentials
                  </h3>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', marginBottom: '2rem' }}>
                  <div>Principal Corporate Banker: <strong>{accounts[0]?.name || 'KCB Bank Kenya Limited'}</strong></div>
                  <div>Account Number: <strong>{accounts[0]?.account_number || '1234567890'}</strong> • Branch: <strong>{accounts[0]?.branch || 'Upper Hill Branch, Nairobi'}</strong></div>
                  <div style={{ marginTop: '0.4rem', color: '#475569' }}>
                    Credit Standing: The Company maintains active, unencumbered credit and overdraft facilities with prime commercial banks in Kenya to support project working capital.
                  </div>
                </div>

                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                    Schedule 6: Statutory Declarations & Integrity Undertakings
                  </h3>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                  <p>
                    <strong>1. Anti-Corruption & Ethics Declaration:</strong> We hereby declare and undertake that neither the Company nor any of its directors, executives, or agents have offered, promised, or given any bribe, gift, or inducement to any public officer in connection with this tender.
                  </p>
                  <p>
                    <strong>2. Non-Debarment Commitment:</strong> We confirm that the Company is not debarred by the Public Procurement Regulatory Authority (PPRA) from participating in public procurement proceedings under the Public Procurement and Asset Disposal Act.
                  </p>
                  <p>
                    <strong>3. Capacity to Deliver:</strong> We certify that our operational machinery, personnel, and working capital reserves are fully adequate to execute the contract within the stipulated completion schedules.
                  </p>
                </div>

                {/* SIGNATURE & SEAL BLOCK */}
                <div style={{ borderTop: '2px solid #0f172a', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Managing Director:</div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>{directors[0]?.name || 'Eng. John Akpali'}</div>
                    <div style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}>Signature: __________________________</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Date: {new Date().toLocaleDateString('en-GB')}</div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <img src="/stamp.png" alt="Seal" style={{ height: '75px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: '0.25rem' }}>COMMON CORPORATE SEAL</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
