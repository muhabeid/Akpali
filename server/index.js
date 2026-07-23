require('express-async-errors');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { z } = require('zod');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Expose the uploads directory publicly so the frontend can load images/files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------------------------------------------------
// MULTER SETUP (FILE UPLOADS)
// ---------------------------------------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// ---------------------------------------------------------
// ZOD SCHEMAS (DATA VALIDATION LAYER)
// ---------------------------------------------------------
const TenderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3, "Name must be at least 3 characters"),
  client_id: z.string().optional(), // Kept optional for backward compatibility if client isn't fully implemented on frontend
  client: z.string().optional(), // Old fallback
  category: z.enum(['Supply of goods', 'Provision of services', 'Construction works', 'Mixed contracts']),
  contract_value: z.coerce.number().min(0, "Contract value cannot be negative")
});

const TransactionSchema = z.object({
  id: z.string().min(1),
  account_id: z.string().min(1, "Account ID is required"),
  tender_id: z.string().optional().nullable(), // nullable allows empty string to become null
  type: z.enum(['Income', 'Expense']),
  amount: z.coerce.number().min(0, "Amount must be greater than or equal to 0"),
  purpose: z.string().min(3),
  reference: z.string().optional()
});

// Middleware to validate Zod schemas
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({ error: true, message: "Validation failed", details: error.errors });
  }
};

let db;

// ---------------------------------------------------------
// DATABASE INITIALIZATION
// ---------------------------------------------------------
async function initializeDB() {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Enable Foreign Keys in SQLite
  await db.exec('PRAGMA foreign_keys = ON;');

  console.log('✅ Connected to SQLite Database (database.sqlite)!');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await db.exec(schema);
  console.log('✅ Strict Database Schema & Triggers verified.');

  const accountsCount = await db.get('SELECT COUNT(*) as count FROM accounts');
  if (accountsCount.count === 0) {
    await db.exec(`
      INSERT INTO accounts (id, name, type, current_balance) VALUES 
      ('ACC-BANK', 'KCB Main Account', 'Bank', 0.00),
      ('ACC-MPESA', 'M-Pesa Till 123456', 'Mobile Money', 0.00),
      ('ACC-CASH', 'Office Petty Cash', 'Cash', 0.00)
    `);
    console.log('✅ Default Treasury Accounts seeded.');
  }
}

initializeDB().catch(err => {
  console.error('Failed to initialize database:', err);
});

// ---------------------------------------------------------
// ROUTES
// ---------------------------------------------------------

// GET /api/tenders - Optimized O(1) query using SQLite JSON aggregation
app.get('/api/tenders', async (req, res) => {
  const query = `
    SELECT 
      t.*,
      COALESCE(
        (
          SELECT json_group_array(
            json_object(
              'id', d.id,
              'description', d.description,
              'type', d.type,
              'billing_method', d.billing_method,
              'status', d.status,
              'cost', d.cost,
              'revenue', d.revenue,
              'profit', d.profit,
              'evidence', COALESCE(
                (
                  SELECT json_group_array(
                    json_object(
                      'id', e.id,
                      'type', e.type,
                      'details', e.details,
                      'revenue_generated', e.revenue_generated,
                      'file_url', e.file_url,
                      'date_submitted', e.date_submitted
                    )
                  )
                  FROM evidence e WHERE e.deliverable_id = d.id
                ), '[]'
              )
            )
          )
          FROM deliverables d WHERE d.tender_id = t.id
        ), '[]'
      ) as deliverables_json,
      COALESCE(
        (
          SELECT json_group_array(
            json_object(
              'id', l.id,
              'issue_date', l.issue_date,
              'due_date', l.due_date,
              'total_value', l.total_value,
              'items', l.items
            )
          )
          FROM client_lpos l WHERE l.tender_id = t.id
        ), '[]'
      ) as lpos_json,
      COALESCE(
        (
          SELECT json_group_array(
            json_object(
              'id', p.id,
              'supplier_name', p.supplier_name,
              'type', p.type,
              'status', p.status,
              'total_value', p.total_value
            )
          )
          FROM purchase_orders p WHERE p.tender_id = t.id
        ), '[]'
      ) as pos_json
    FROM tenders t
    ORDER BY t.created_at DESC
  `;

  const rows = await db.all(query);
  
  // Parse the JSON string back into actual nested arrays for the frontend
  const tenders = rows.map(row => ({
    ...row,
    deliverables: JSON.parse(row.deliverables_json),
    lpos: JSON.parse(row.lpos_json),
    pos: JSON.parse(row.pos_json)
  }));

  res.json(tenders);
});

// POST /api/tenders
app.post('/api/tenders', validate(TenderSchema), async (req, res) => {
  const { id, name, client, category, contract_value } = req.body;
  
  // Note: We use client directly as text for now since frontend doesn't pass client_id yet
  await db.run(
    `INSERT INTO tenders (id, name, client_id, category, contract_value) 
     VALUES (?, ?, NULL, ?, ?)`,
    [id, name, category, contract_value]
  );
  
  const newTender = await db.get('SELECT * FROM tenders WHERE id = ?', [id]);
  res.status(201).json(newTender);
});

// ==========================================
// CLIENT LPOs
// ==========================================

app.get('/api/lpos', async (req, res) => {
  const query = `
    SELECT l.*, t.name as tender_name 
    FROM client_lpos l
    JOIN tenders t ON l.tender_id = t.id
    ORDER BY l.created_at DESC
  `;
  const lpos = await db.all(query);
  res.json(lpos);
});

app.post('/api/lpos', async (req, res) => {
  const { id, tender_id, issue_date, due_date, total_value, items } = req.body;
  
  await db.run(
    `INSERT INTO client_lpos (id, tender_id, issue_date, due_date, total_value, items)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, tender_id, issue_date, due_date, total_value, items]
  );
  
  const newLPO = await db.get('SELECT * FROM client_lpos WHERE id = ?', [id]);
  res.status(201).json(newLPO);
});

// ==========================================
// REQUESTS FOR QUOTATION (RFQS)
// ==========================================

app.get('/api/rfqs', async (req, res) => {
  const query = `
    SELECT r.*, t.name as tender_name, l.id as lpo_reference
    FROM rfqs r
    LEFT JOIN tenders t ON r.tender_id = t.id
    LEFT JOIN client_lpos l ON r.lpo_id = l.id
    ORDER BY r.created_at DESC
  `;
  const rfqs = await db.all(query);
  res.json(rfqs);
});

app.post('/api/rfqs', async (req, res) => {
  const { id, lpo_id, tender_id, deadline, items } = req.body;
  
  await db.run(
    `INSERT INTO rfqs (id, lpo_id, tender_id, deadline, items)
     VALUES (?, ?, ?, ?, ?)`,
    [id, lpo_id, tender_id, deadline, items]
  );
  
  const newRFQ = await db.get('SELECT * FROM rfqs WHERE id = ?', [id]);
  res.status(201).json(newRFQ);
});

// ==========================================
// PURCHASE ORDERS (POs)
// ==========================================

app.get('/api/pos', async (req, res) => {
  const query = `
    SELECT p.*, t.name as tender_name 
    FROM purchase_orders p
    LEFT JOIN tenders t ON p.tender_id = t.id
    ORDER BY p.created_at DESC
  `;
  const pos = await db.all(query);
  res.json(pos);
});

app.post('/api/pos', async (req, res) => {
  const { id, tender_id, supplier_name, type, expected_date, total_value, items } = req.body;
  
  // tender_id can be 'COMPANY_EXPENSE' or empty string from frontend, handle it
  const finalTenderId = (tender_id && tender_id !== 'COMPANY_EXPENSE') ? tender_id : null;

  await db.run(
    `INSERT INTO purchase_orders (id, tender_id, supplier_name, type, expected_date, total_value, items)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, finalTenderId, supplier_name, type, expected_date, total_value, items]
  );
  
  const newPO = await db.get('SELECT * FROM purchase_orders WHERE id = ?', [id]);
  res.status(201).json(newPO);
});

// ==========================================
// GRNS & SUPPLIER INVOICES (3-WAY MATCH)
// ==========================================

app.get('/api/grns', async (req, res) => {
  const query = `
    SELECT g.*, p.supplier_name, p.total_value as po_value, t.name as tender_name
    FROM grns g
    JOIN purchase_orders p ON g.po_id = p.id
    LEFT JOIN tenders t ON p.tender_id = t.id
    ORDER BY g.created_at DESC
  `;
  const grns = await db.all(query);
  res.json(grns);
});

app.post('/api/grns', upload.single('grn_file'), async (req, res) => {
  const { id, po_id, received_date, received_value, details, items } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const value = parseFloat(received_value) || 0;

  // Insert GRN
  await db.run(
    `INSERT INTO grns (id, po_id, received_date, received_value, details, file_url, items)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, po_id, received_date, value, details, fileUrl, items || '[]']
  );

  // Process Inventory UPSERT
  if (items) {
    try {
      const parsedItems = JSON.parse(items);
      for (let item of parsedItems) {
        const desc = item.desc || item.description || item.name;
        if (!desc || !item.received_qty) continue;
        const qty = parseFloat(item.received_qty) || 0;
        const unit = item.unit || 'unit';
        
        await db.run(`
          INSERT INTO inventory (item_name, unit, quantity) 
          VALUES (?, ?, ?)
          ON CONFLICT(item_name) DO UPDATE SET 
            quantity = quantity + ?,
            last_updated = CURRENT_TIMESTAMP
        `, [desc, unit, qty, qty]);
      }
    } catch (e) {
      console.error("Failed to process GRN items for inventory", e);
    }
  }
  
  const newGRN = await db.get('SELECT * FROM grns WHERE id = ?', [id]);
  res.status(201).json(newGRN);
});

// ==========================================
// INVENTORY ENGINE
// ==========================================
app.get('/api/inventory', async (req, res) => {
  const inv = await db.all('SELECT * FROM inventory ORDER BY item_name ASC');
  res.json(inv);
});

app.get('/api/supplier_invoices', async (req, res) => {
  const query = `
    SELECT i.*, p.supplier_name as po_supplier, t.name as tender_name, p.total_value as po_value,
           (SELECT SUM(received_value) FROM grns WHERE po_id = i.po_id) as total_grn_value
    FROM supplier_invoices i
    JOIN purchase_orders p ON i.po_id = p.id
    LEFT JOIN tenders t ON p.tender_id = t.id
    ORDER BY i.created_at DESC
  `;
  const invoices = await db.all(query);
  res.json(invoices);
});

app.post('/api/supplier_invoices', async (req, res) => {
  const { id, po_id, supplier_name, amount, invoice_date } = req.body;
  
  await db.run(
    `INSERT INTO supplier_invoices (id, po_id, supplier_name, amount, invoice_date)
     VALUES (?, ?, ?, ?, ?)`,
    [id, po_id, supplier_name, parseFloat(amount), invoice_date]
  );
  
  const newInv = await db.get('SELECT * FROM supplier_invoices WHERE id = ?', [id]);
  res.status(201).json(newInv);
});

// ==========================================
// CLIENT INVOICES
// ==========================================
app.get('/api/client_invoices', async (req, res) => {
  const query = `
    SELECT i.*, t.name as tender_name 
    FROM client_invoices i
    LEFT JOIN tenders t ON i.tender_id = t.id
    ORDER BY i.created_at DESC
  `;
  const invoices = await db.all(query);
  res.json(invoices);
});

app.post('/api/client_invoices', async (req, res) => {
  const { id, tender_id, billing_type, reference_id, amount, invoice_date } = req.body;
  
  await db.run(
    `INSERT INTO client_invoices (id, tender_id, billing_type, reference_id, amount, invoice_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, tender_id, billing_type, reference_id, parseFloat(amount), invoice_date]
  );
  
  // Update Deliverable status to Invoiced if this was a delivery billing
  if (billing_type === 'delivery' && reference_id) {
    // reference_id here is evidence_id. Let's find its deliverable.
    const ev = await db.get('SELECT deliverable_id FROM evidence WHERE id = ?', [reference_id]);
    if (ev) {
      await db.run('UPDATE deliverables SET status = ? WHERE id = ?', ['Invoiced', ev.deliverable_id]);
    }
  }

  const newInv = await db.get('SELECT * FROM client_invoices WHERE id = ?', [id]);
  res.status(201).json(newInv);
});

// The 3-Way Match Engine Endpoint
app.post('/api/match/:invoice_id', async (req, res) => {
  const { invoice_id } = req.params;
  
  // 1. Get Invoice
  const invoice = await db.get('SELECT * FROM supplier_invoices WHERE id = ?', [invoice_id]);
  if (!invoice) return res.status(404).json({ error: true, message: 'Invoice not found' });
  
  // 2. Get PO
  const po = await db.get('SELECT * FROM purchase_orders WHERE id = ?', [invoice.po_id]);
  if (!po) return res.status(404).json({ error: true, message: 'Purchase Order not found' });

  // 3. Get Sum of GRNs for this PO
  const grnResult = await db.get('SELECT SUM(received_value) as total_grn FROM grns WHERE po_id = ?', [po.id]);
  const totalGRN = grnResult.total_grn || 0;

  // 4. Match Logic (Strict Matching: Invoice <= GRN <= PO)
  const isMatch = (invoice.amount <= totalGRN) && (totalGRN <= po.total_value);

  if (isMatch) {
    await db.run('UPDATE supplier_invoices SET status = ? WHERE id = ?', ['Matched', invoice_id]);
    res.json({ success: true, message: '3-Way Match Successful', details: 'Invoice amount is fully backed by GRN receipts and authorized by the PO.', invoice_amount: invoice.amount, grn_amount: totalGRN, po_amount: po.total_value });
  } else {
    await db.run('UPDATE supplier_invoices SET status = ? WHERE id = ?', ['Discrepancy', invoice_id]);
    res.json({ success: false, message: '3-Way Match Failed', details: `Discrepancy detected! Invoice (${invoice.amount}) exceeds verified GRN deliveries (${totalGRN}).`, invoice_amount: invoice.amount, grn_amount: totalGRN, po_amount: po.total_value });
  }
});

// POST /api/deliverables
app.post('/api/deliverables', async (req, res) => {
  const { id, tender_id, description, type, billing_method, planned_date, due_date } = req.body;
  await db.run(
    `INSERT INTO deliverables (id, tender_id, description, type, billing_method, planned_date, due_date) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, tender_id, description, type, billing_method, planned_date, due_date]
  );
  const newDlv = await db.get('SELECT * FROM deliverables WHERE id = ?', [id]);
  res.status(201).json(newDlv);
});

// POST /api/deliverables/:id/evidence (With File Upload)
// Note: We use Multer to process the 'evidence_file' field if it exists
app.post('/api/deliverables/:id/evidence', upload.single('evidence_file'), async (req, res) => {
  const { id } = req.params;
  const { evidence_id, type, details, date_submitted, revenue_generated } = req.body;
  
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const revenue = revenue_generated ? parseFloat(revenue_generated) : 0;

  // The database triggers will automatically recalculate the profit and cascade up to the Tender
  await db.run(
    `INSERT INTO evidence (id, deliverable_id, type, details, date_submitted, revenue_generated, file_url) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [evidence_id, id, type, details, date_submitted, revenue, fileUrl]
  );
  
  const updatedEv = await db.get('SELECT * FROM evidence WHERE id = ?', [evidence_id]);
  res.status(201).json(updatedEv);
});

// GET /api/evidence (For GRN / Deliveries Review in Finance)
app.get('/api/evidence', async (req, res) => {
  const query = `
    SELECT e.*, d.description as deliverable_name, t.name as tender_name 
    FROM evidence e
    JOIN deliverables d ON e.deliverable_id = d.id
    JOIN tenders t ON d.tender_id = t.id
    ORDER BY e.created_at DESC
  `;
  const evidence = await db.all(query);
  res.json(evidence);
});

// GET /api/treasury
app.get('/api/treasury', async (req, res) => {
  const accounts = await db.all('SELECT * FROM accounts');
  const transactions = await db.all(`
    SELECT t.*, a.name as account_name, tnd.name as tender_name 
    FROM transactions t
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN tenders tnd ON t.tender_id = tnd.id
    ORDER BY t.created_at DESC
  `);
  res.json({ accounts, transactions });
});

// POST /api/transactions
app.post('/api/transactions', validate(TransactionSchema), async (req, res) => {
  const { id, account_id, tender_id, type, amount, purpose, reference } = req.body;
  
  // The database triggers will automatically update the account balance,
  // and if it's an expense linked to a tender, it will automatically update the tender's cost.
  await db.run(
    `INSERT INTO transactions (id, account_id, tender_id, type, amount, purpose, reference) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, account_id, tender_id || null, type, amount, purpose, reference]
  );

  const newTx = await db.get('SELECT * FROM transactions WHERE id = ?', [id]);
  res.status(201).json(newTx);
});

// ---------------------------------------------------------
// GLOBAL ERROR HANDLING MIDDLEWARE
// ---------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  
  // SQLite Constraint Error
  if (err.message.includes('SQLITE_CONSTRAINT')) {
    return res.status(400).json({
      error: true,
      message: "Database Constraint Violation. Ensure data inputs strictly match allowed values.",
      details: err.message
    });
  }

  // Multer Error
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: true, message: "File upload failed", details: err.message });
  }

  res.status(500).json({ error: true, message: "Internal Server Error", details: err.message });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
