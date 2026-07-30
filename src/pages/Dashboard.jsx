import React, { useState, useEffect } from 'react'
import { PlusCircle, FilePlus, Send, HandCoins, Truck, Zap, FileText, Box } from 'lucide-react'
import { useCurrency } from '../context/CurrencyContext'
import Drawer from '../components/Drawer'
import NewTenderForm from '../components/NewTenderForm'
import RecordLPOForm from '../components/RecordLPOForm'
import GenerateInvoiceForm from '../components/GenerateInvoiceForm'
import FulfillDeliverableForm from '../components/FulfillDeliverableForm'
import NewDeliverableForm from '../components/NewDeliverableForm'
import RecordGRNForm from '../components/RecordGRNForm'
import GenerateRFQForm from '../components/GenerateRFQForm'
import StockRequisitionForm from '../components/StockRequisitionForm'
import SalesQuoteForm from '../components/SalesQuoteForm'

export default function Dashboard({ setGlobalDrawer }) {
  const { formatAmount } = useCurrency()
  const [openDrawer, setOpenDrawer] = useState(null)
  const [tenders, setTenders] = useState([])
  const [lpos, setLpos] = useState([])

  useEffect(() => {
    fetch('http://localhost:5000/api/tenders')
      .then(res => res.json())
      .then(data => setTenders(data))
      .catch(err => console.error("Could not fetch tenders:", err))

    fetch('http://localhost:5000/api/lpos')
      .then(res => res.json())
      .then(data => setLpos(data))
      .catch(err => console.error("Could not fetch LPOs:", err))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Local Drawers */}

      <Drawer isOpen={openDrawer === 'new_deliverable'} onClose={() => setOpenDrawer(null)} title="Add Deliverable to Tender" onSubmit={() => { setOpenDrawer(null) }}>
        <NewDeliverableForm />
      </Drawer>
      
      <Drawer isOpen={openDrawer === 'lpo'} onClose={() => setOpenDrawer(null)} title="Record Client LPO" onSubmit={() => { alert('LPO Recorded!'); setOpenDrawer(null) }}>
        <RecordLPOForm />
      </Drawer>
      
      <Drawer isOpen={openDrawer === 'delivery'} onClose={() => setOpenDrawer(null)} title="Fulfill Deliverable (Upload Evidence)" onSubmit={() => { alert('Fulfillment Recorded & Evidence Uploaded!'); setOpenDrawer(null) }}>
        <FulfillDeliverableForm />
      </Drawer>
      
      <Drawer isOpen={openDrawer === 'invoice'} onClose={() => setOpenDrawer(null)} title="Generate Invoice" onSubmit={() => { alert('Invoice Generated!'); setOpenDrawer(null) }}>
        <GenerateInvoiceForm />
      </Drawer>

      <Drawer isOpen={openDrawer === 'rfq'} onClose={() => setOpenDrawer(null)} title="Generate Request for Quotation (RFQ)">
        <GenerateRFQForm />
      </Drawer>

      <Drawer isOpen={openDrawer === 'grn'} onClose={() => setOpenDrawer(null)} title="Record Goods Receipt Note (GRN)">
        <RecordGRNForm />
      </Drawer>
      
      <Drawer isOpen={openDrawer === 'stock_req'} onClose={() => setOpenDrawer(null)} title="Request Stock / Materials">
        <StockRequisitionForm />
      </Drawer>

      <Drawer isOpen={openDrawer === 'sales_quote'} onClose={() => setOpenDrawer(null)} title="Generate Sales Quotation">
        <SalesQuoteForm />
      </Drawer>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', borderTop: '4px solid hsl(var(--primary))' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={20} color="hsl(var(--primary))" /> Project Pipeline & Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
          
          <button className="btn" onClick={() => setGlobalDrawer('tender')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: 'hsla(var(--primary), 0.05)', color: 'hsl(var(--primary))', border: '1px solid hsla(var(--primary), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <PlusCircle size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>1. New Tender</span>
          </button>

          <button className="btn" onClick={() => setOpenDrawer('sales_quote')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', border: '1px solid hsla(var(--primary), 0.3)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <FileText size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>2. Quote Client</span>
          </button>

          <button className="btn" onClick={() => setOpenDrawer('lpo')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: 'hsla(var(--accent), 0.05)', color: 'hsl(var(--accent))', border: '1px solid hsla(var(--accent), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <FilePlus size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>3. Record LPO</span>
          </button>

          <button className="btn" onClick={() => setOpenDrawer('new_deliverable')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: 'hsla(var(--primary), 0.05)', color: 'hsl(var(--primary))', border: '1px solid hsla(var(--primary), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <PlusCircle size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>4. Add Deliverable</span>
          </button>

          <button className="btn" onClick={() => setOpenDrawer('rfq')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: 'hsla(var(--warning), 0.05)', color: 'hsl(var(--warning))', border: '1px solid hsla(var(--warning), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <FileText size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>5. Generate RFQ</span>
          </button>

          <button className="btn" onClick={() => setGlobalDrawer('new_po')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: 'hsla(var(--warning), 0.1)', color: 'hsl(var(--warning))', border: '1px solid hsla(var(--warning), 0.3)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <Send size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>6. Raise PO</span>
          </button>

          <button className="btn" onClick={() => setOpenDrawer('grn')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: 'hsla(var(--success), 0.05)', color: 'hsl(var(--success))', border: '1px solid hsla(var(--success), 0.2)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <Truck size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>7. Record GRN</span>
          </button>

          <button className="btn" onClick={() => setOpenDrawer('stock_req')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: 'hsla(var(--accent), 0.1)', color: 'hsl(var(--accent))', border: '1px solid hsla(var(--accent), 0.3)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <Box size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>8. Stock Req.</span>
          </button>

          <button className="btn" onClick={() => setOpenDrawer('delivery')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: 'hsla(var(--success), 0.1)', color: 'hsl(var(--success))', border: '1px solid hsla(var(--success), 0.3)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <Truck size={22} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>9. Fulfill Delivery</span>
          </button>

          <button className="btn" onClick={() => setOpenDrawer('invoice')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: 'hsla(var(--success), 0.8)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <HandCoins size={22} style={{ opacity: 0.9 }} />
            <span style={{ fontWeight: '600', fontSize: '0.75rem', textAlign: 'center' }}>10. Gen. Invoice</span>
          </button>

          <button className="btn" onClick={() => setGlobalDrawer('op_doc')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0.25rem', gap: '0.5rem', background: 'hsla(var(--primary), 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsla(var(--primary), 0.4)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <FileText size={22} style={{ opacity: 0.9 }} />
            <span style={{ fontWeight: '700', fontSize: '0.75rem', textAlign: 'center' }}>11. Op. Documents</span>
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
            <h3 style={{ margin: 0 }}>Active Projects & Tenders</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>Your highest level projects created from Quick Create or Tenders module.</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
                <th style={{ padding: '1rem 1.5rem' }}>Tender ID</th>
                <th style={{ padding: '1rem' }}>Project Name</th>
                <th style={{ padding: '1rem' }}>Category</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Contract Value</th>
              </tr>
            </thead>
            <tbody>
              {tenders.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No active projects or tenders found.</td>
                </tr>
              ) : (
                tenders.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'hsl(var(--primary))' }}>{t.id}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{t.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-primary">{t.category}</span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>{formatAmount(t.contract_value)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
            <h3 style={{ margin: 0 }}>Recent Client LPOs</h3>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.875rem', marginTop: '0.25rem' }}>Local Purchase Orders issued by clients.</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'hsla(var(--border), 0.3)', textAlign: 'left' }}>
              <th style={{ padding: '1rem 1.5rem' }}>LPO Number</th>
              <th style={{ padding: '1rem' }}>Tender Linked</th>
              <th style={{ padding: '1rem' }}>Issue Date</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {lpos.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>No Client LPOs recorded yet.</td>
              </tr>
            ) : (
              lpos.map(lpo => (
                <tr key={lpo.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'hsl(var(--primary))' }}>{lpo.id}</td>
                  <td style={{ padding: '1rem' }}>{lpo.tender_name}</td>
                  <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>{lpo.issue_date}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>${lpo.total_value.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  )
}
