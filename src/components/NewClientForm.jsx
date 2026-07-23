import React from 'react'

export default function NewClientForm() {
  return (
    <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="form-group">
        <label>Client / Organization Name</label>
        <input type="text" className="form-control" placeholder="e.g., KeNHA" required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Registration Number</label>
          <input type="text" className="form-control" placeholder="e.g., PVT-XYZ123" />
        </div>
        <div className="form-group">
          <label>Tax PIN</label>
          <input type="text" className="form-control" placeholder="e.g., P051234567Z" />
        </div>
      </div>

      <div className="form-group">
        <label>Primary Contact Name</label>
        <input type="text" className="form-control" placeholder="John Doe" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" className="form-control" placeholder="contact@client.com" />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input type="tel" className="form-control" placeholder="+254 7XX XXX XXX" />
        </div>
      </div>

      <div className="form-group">
        <label>Physical Address</label>
        <textarea className="form-control" rows="2" placeholder="Building, Street, City"></textarea>
      </div>

    </form>
  )
}
