const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function resetToProduction() {
  console.log('🧹 Resetting database to production state...');
  
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Turn off foreign keys temporarily for clean truncation
  await db.exec('PRAGMA foreign_keys = OFF;');

  // Truncate operational data tables
  const tablesToWipe = [
    'tenders',
    'client_lpos',
    'deliverables',
    'evidence',
    'purchase_orders',
    'grns',
    'invoices',
    'supplier_invoices',
    'client_invoices',
    'transactions',
    'sales_quotes',
    'rfqs',
    'inventory',
    'stock_requisitions',
    'suppliers',
    'clients',
    'company_documents',
    'audit_logs',
    'company_experience',
    'legal_contracts'
  ];

  for (const table of tablesToWipe) {
    try {
      await db.exec(`DELETE FROM ${table};`);
      console.log(`  ✓ Cleared table: ${table}`);
    } catch(err) {
      console.warn(`  ⚠️ Could not clear ${table}:`, err.message);
    }
  }

  // Reset treasury accounts balances to zero
  try {
    await db.exec(`UPDATE accounts SET current_balance = 0.00;`);
    console.log('  ✓ Reset treasury account balances to 0.00 (KSh)');
  } catch(e) {}

  // Keep only the primary Executive Admin account in users table
  try {
    await db.exec(`DELETE FROM users WHERE id != 'USR-ADMIN' AND LOWER(email) != 'admin@akpali.com';`);
    console.log('  ✓ Preserved primary Executive Admin user account');
  } catch(e) {}

  // Turn foreign keys back on
  await db.exec('PRAGMA foreign_keys = ON;');

  console.log('✅ Database reset complete! Ready for production deployment.');
  await db.close();
}

resetToProduction().catch(console.error);
