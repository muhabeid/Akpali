import React from 'react'

export default function NewSupplierForm() {
  return (
    <form>
      <div className="form-group">
        <label>Supplier/Company Name</label>
        <input type="text" className="form-control" placeholder="e.g., BuildMat Ltd" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>KRA PIN</label>
          <input type="text" className="form-control" placeholder="e.g., P051234567Z" />
        </div>
        <div className="form-group">
          <label>Registration Number</label>
          <input type="text" className="form-control" placeholder="e.g., PVT-XYZ123" />
        </div>
      </div>

      <div className="form-group">
        <label>Primary Contact Email</label>
        <input type="email" className="form-control" placeholder="contact@supplier.com" />
      </div>

      <div className="form-group">
        <label>Phone Number</label>
        <input type="tel" className="form-control" placeholder="+254 7XX XXX XXX" />
      </div>
      
      <div className="form-group">
        <label>Bank Name</label>
        <select className="form-control">
          <option>Select Bank...</option>
          <option>Equity Bank</option>
          <option>KCB</option>
          <option>Co-operative Bank</option>
          <option>Standard Chartered</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Branch / Branch Code</label>
          <input type="text" className="form-control" />
        </div>
        <div className="form-group">
          <label>Account Number</label>
          <input type="text" className="form-control" />
        </div>
      </div>

      <div className="form-group">
        <label>Upload Supporting Documents (KRA Pin Cert, Registration)</label>
        <div style={{ border: '2px dashed hsl(var(--border))', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', color: 'hsl(var(--text-secondary))' }}>
          Drag and drop files here, or click to browse
        </div>
      </div>
    </form>
  )
}
