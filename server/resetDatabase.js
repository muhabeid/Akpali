const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function resetToProduction() {
  console.log('🧹 Resetting database to clean production state...');
  
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Turn off foreign keys temporarily for clean truncation
  await db.exec('PRAGMA foreign_keys = OFF;');

  // Truncate operational data tables
  const tablesToWipe = [
    'tenders',
    'tenders_v2',
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
    'legal_contracts',
    'approval_workflows',
    'vat_ledger',
    'journal_items',
    'journal_entries'
  ];

  for (const table of tablesToWipe) {
    try {
      await db.exec(`DELETE FROM "${table}";`);
      console.log(`  ✓ Cleared table: ${table}`);
    } catch(err) {
      console.warn(`  ⚠️ Could not clear ${table}:`, err.message);
    }
  }

  // Reset treasury accounts balances to zero
  try {
    await db.exec('UPDATE accounts SET current_balance = 0.00;');
    console.log('  ✓ Reset treasury account balances to 0.00 KES');
  } catch(e) {}

  // Reset chart of accounts balances to zero
  try {
    await db.exec('UPDATE chart_of_accounts SET current_balance = 0.00;');
    console.log('  ✓ Reset chart of accounts balances to 0.00 KES');
  } catch(e) {}

  // Keep standard core corporate user accounts
  const standardEmails = [
    'admin@akpali.com',
    'operations@akpali.com',
    'site@akpali.com',
    'procurement.finance@akpali.com',
    'procurement@akpali.com',
    'finance@akpali.com'
  ];
  try {
    const placeholders = standardEmails.map(() => '?').join(',');
    await db.run(`DELETE FROM users WHERE LOWER(email) NOT IN (${placeholders});`, standardEmails);
    console.log('  ✓ Preserved core corporate accounts');
  } catch(e) {}

  // Turn foreign keys back on
  await db.exec('PRAGMA foreign_keys = ON;');
  await db.exec('VACUUM;');

  console.log('✅ Database reset complete! Ready for production deployment.');
  await db.close();
}

resetToProduction().catch(console.error);
