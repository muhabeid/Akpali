-- Master Data Tables
CREATE TABLE IF NOT EXISTS company_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Enforce single row
    legal_name TEXT DEFAULT 'Akpali & Co.',
    registration_num TEXT,
    tax_pin TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    base_currency TEXT DEFAULT 'USD',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Enforce single row
    smtp_host TEXT,
    smtp_port TEXT,
    smtp_user TEXT,
    smtp_pass TEXT,
    wa_token TEXT,
    wa_phone_id TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_templates (
    id TEXT PRIMARY KEY, -- E.g. 'GLOBAL', 'SQ', 'LPO', 'PO', 'DELIVERY', 'LETTERHEAD'
    header_logo_url TEXT,
    header_text TEXT,
    footer_text TEXT,
    terms_conditions_text TEXT,
    primary_color TEXT DEFAULT '#0f172a',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_workflows (
    id TEXT PRIMARY KEY,
    module_name TEXT NOT NULL,
    maker_role TEXT NOT NULL,
    checker_role TEXT NOT NULL,
    threshold_amount REAL DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS legal_contracts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    party_name TEXT NOT NULL,
    contract_type TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'Active',
    file_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    document_type TEXT,
    expiry_date TEXT,
    status TEXT DEFAULT 'Active',
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'Staff',
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    registration_num TEXT,
    tax_pin TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kra_pin TEXT,
    registration_num TEXT,
    email TEXT,
    phone TEXT,
    bank_name TEXT,
    bank_branch TEXT,
    account_number TEXT,
    rating REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Core Entities
CREATE TABLE IF NOT EXISTS tenders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client_id TEXT REFERENCES clients(id),
    client_name TEXT,
    client_reference TEXT,
    category TEXT NOT NULL CHECK(category IN ('Supply of goods', 'Provision of services', 'Construction works', 'Mixed contracts')),
    contract_value REAL DEFAULT 0.00,
    status TEXT DEFAULT 'Active' CHECK(status IN ('Draft', 'Active', 'On Hold', 'Completed', 'Cancelled')),
    progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
    total_revenue REAL DEFAULT 0.00,
    total_cost REAL DEFAULT 0.00,
    profit REAL DEFAULT 0.00,
    start_date TEXT,
    expected_completion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_quotes (
    id TEXT PRIMARY KEY,
    tender_id TEXT REFERENCES tenders(id) ON DELETE CASCADE,
    issue_date TEXT,
    total_value REAL DEFAULT 0.00,
    items TEXT, -- JSON string of line items
    status TEXT DEFAULT 'Sent' CHECK(status IN ('Sent', 'Accepted', 'Rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_lpos (
    id TEXT PRIMARY KEY,
    tender_id TEXT REFERENCES tenders(id) ON DELETE CASCADE,
    client_reference TEXT,
    issue_date TEXT,
    due_date TEXT,
    total_value REAL DEFAULT 0.00,
    items TEXT, -- JSON string of line items
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rfqs (
    id TEXT PRIMARY KEY,
    lpo_id TEXT REFERENCES client_lpos(id) ON DELETE CASCADE,
    tender_id TEXT REFERENCES tenders(id) ON DELETE CASCADE,
    deadline TEXT NOT NULL,
    items TEXT, -- JSON string of items requested for quote
    status TEXT DEFAULT 'Open' CHECK(status IN ('Open', 'Closed', 'Awarded')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    tender_id TEXT REFERENCES tenders(id) ON DELETE SET NULL, -- Can be NULL for company overhead
    supplier_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Goods', 'Service')),
    expected_date TEXT,
    total_value REAL DEFAULT 0.00,
    items TEXT, -- JSON string of line items or service description
    status TEXT DEFAULT 'Pending Delivery' CHECK(status IN ('Pending Delivery', 'Delivered', 'Awaiting Approval')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grns (
    id TEXT PRIMARY KEY,
    po_id TEXT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    received_date TEXT NOT NULL,
    received_value REAL DEFAULT 0.00,
    items TEXT, -- JSON string of actual item quantities received
    details TEXT,
    file_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT UNIQUE NOT NULL,
    unit TEXT NOT NULL,
    quantity REAL DEFAULT 0.00,
    avg_unit_cost REAL DEFAULT 0.00,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_requisitions (
    id TEXT PRIMARY KEY,
    tender_id TEXT REFERENCES tenders(id),
    item_name TEXT REFERENCES inventory(item_name),
    quantity REAL NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
    request_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_invoices (
    id TEXT PRIMARY KEY,
    po_id TEXT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    supplier_name TEXT NOT NULL,
    amount REAL NOT NULL,
    invoice_date TEXT NOT NULL,
    status TEXT DEFAULT 'Pending Match' CHECK(status IN ('Pending Match', 'Matched', 'Discrepancy', 'Paid')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_invoices (
    id TEXT PRIMARY KEY,
    tender_id TEXT REFERENCES tenders(id),
    billing_type TEXT NOT NULL CHECK(billing_type IN ('delivery', 'milestone')),
    reference_id TEXT,
    amount REAL NOT NULL,
    invoice_date TEXT NOT NULL,
    status TEXT DEFAULT 'Sent' CHECK(status IN ('Draft', 'Sent', 'Paid', 'Overdue')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deliverables (
    id TEXT PRIMARY KEY,
    tender_id TEXT REFERENCES tenders(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    items TEXT, -- JSON string of line items
    type TEXT NOT NULL CHECK(type IN ('Goods', 'Service', 'Construction')),
    billing_method TEXT NOT NULL,
    planned_date TEXT,
    due_date TEXT,
    status TEXT DEFAULT 'Planned' CHECK(status IN ('Planned', 'In Progress', 'Awaiting Review', 'Approved', 'Invoiced', 'Paid')),
    cost REAL DEFAULT 0.00,
    revenue REAL DEFAULT 0.00,
    profit REAL DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    deliverable_id TEXT REFERENCES deliverables(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    details TEXT,
    date_submitted TEXT,
    revenue_generated REAL DEFAULT 0.00,
    file_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Treasury Tables
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Bank', 'Mobile Money', 'Cash')),
    current_balance REAL DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    account_id TEXT REFERENCES accounts(id),
    tender_id TEXT REFERENCES tenders(id),
    type TEXT NOT NULL CHECK(type IN ('Income', 'Expense')),
    amount REAL NOT NULL CHECK(amount >= 0),
    purpose TEXT NOT NULL,
    reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TRIGGERS: REAL-TIME PROFITABILITY ENGINE

-- 1. When Evidence is added, increase the Deliverable's revenue and recalculate profit.
CREATE TRIGGER IF NOT EXISTS after_evidence_insert
AFTER INSERT ON evidence
BEGIN
    UPDATE deliverables 
    SET 
        revenue = revenue + NEW.revenue_generated,
        profit = (revenue + NEW.revenue_generated) - cost,
        status = 'In Progress',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.deliverable_id;
END;

-- 2. When a Deliverable's financials change, cascade the sum up to the Parent Tender.
CREATE TRIGGER IF NOT EXISTS after_deliverable_update
AFTER UPDATE OF revenue, cost, profit ON deliverables
BEGIN
    UPDATE tenders
    SET 
        total_revenue = (SELECT SUM(revenue) FROM deliverables WHERE tender_id = NEW.tender_id),
        total_cost = (SELECT SUM(cost) FROM deliverables WHERE tender_id = NEW.tender_id),
        profit = (SELECT SUM(profit) FROM deliverables WHERE tender_id = NEW.tender_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.tender_id;
END;

-- 3. Treasury: When a Transaction occurs, update Account balances. 
--    If an Expense is linked to a Tender, increase the Tender's total_cost directly.
CREATE TRIGGER IF NOT EXISTS after_transaction_insert
AFTER INSERT ON transactions
BEGIN
    -- Update Account Balance
    UPDATE accounts 
    SET 
        current_balance = CASE 
            WHEN NEW.type = 'Income' THEN current_balance + NEW.amount
            WHEN NEW.type = 'Expense' THEN current_balance - NEW.amount
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.account_id;

    -- If this is an Expense linked directly to a Tender, add it to the Tender's cost and reduce profit.
    -- (This allows generic project expenses that don't fit neatly into a specific Deliverable)
    UPDATE tenders
    SET 
        total_cost = total_cost + NEW.amount,
        profit = total_revenue - (total_cost + NEW.amount),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.tender_id AND NEW.type = 'Expense';
END;

-- 4. When a Purchase Order is raised, commit the cost to the Tender
CREATE TRIGGER IF NOT EXISTS after_po_insert
AFTER INSERT ON purchase_orders
WHEN NEW.tender_id IS NOT NULL
BEGIN
    UPDATE tenders
    SET 
        total_cost = total_cost + NEW.total_value,
        profit = total_revenue - (total_cost + NEW.total_value),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.tender_id;
END;

-- 5. When a Stock Requisition is approved, deduct inventory and add cost to Tender
CREATE TRIGGER IF NOT EXISTS after_stock_requisition_update
AFTER UPDATE OF status ON stock_requisitions
WHEN NEW.status = 'Approved' AND OLD.status != 'Approved'
BEGIN
    -- Deduct from inventory
    UPDATE inventory 
    SET quantity = quantity - NEW.quantity, last_updated = CURRENT_TIMESTAMP
    WHERE item_name = NEW.item_name;

    -- Add cost to tender
    UPDATE tenders
    SET 
        total_cost = total_cost + (NEW.quantity * (SELECT avg_unit_cost FROM inventory WHERE item_name = NEW.item_name)),
        profit = total_revenue - (total_cost + (NEW.quantity * (SELECT avg_unit_cost FROM inventory WHERE item_name = NEW.item_name))),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.tender_id;
END;
