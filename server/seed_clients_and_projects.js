const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
  console.log('Seeding clients, tenders, LPOs, and past experience into SQLite...');

  // 1. Clients Table
  db.run('DELETE FROM clients');
  db.run(`INSERT INTO clients (id, name, registration_num, tax_pin, contact_name, email, phone, address) VALUES
    ('CLI-101', 'UNHCR Sub-Office Turkana', 'UNHCR-KE-891', 'P051892014Z', 'Sarah Jenkins (Senior Procurement Officer)', 'turkana.procurement@unhcr.org', '+254 733 111 222', 'Kakuma Camp, Turkana, Kenya'),
    ('CLI-102', 'County Government of Kiambu', 'CGK/PROC/2022', 'P051284910Y', 'Eng. Peter Kamau (Director of Infrastructure)', 'infrastructure@kiambu.go.ke', '+254 722 333 444', 'County HQ, Kiambu Town, Kenya'),
    ('CLI-103', 'KCB Group Headquarters', 'C.12948', 'P000621482X', 'David Ochieng (Head of Facilities)', 'dochieng@kcbgroup.com', '+254 20 327 0000', 'Kencom House, Moi Avenue, Nairobi')
  `);

  // 2. Tenders Table
  db.run('DELETE FROM tenders');
  db.run(`INSERT INTO tenders (id, name, client_id, client_name, client_reference, category, contract_value, status, progress, total_revenue, total_cost, profit, start_date, expected_completion) VALUES
    ('TND-001', 'Supply & Installation of 250 kW Solar Hybrid System', 'CLI-101', 'UNHCR Sub-Office Turkana', 'UNHCR/TURK/2025/89', 'Provision of services', 185000, 'Completed', 100, 185000, 120000, 65000, '2025-06-01', '2025-11-20'),
    ('TND-002', 'Construction of 3-Storey County Health Clinic Block', 'CLI-102', 'County Government of Kiambu', 'KBU/HLTH/2025/420', 'Construction works', 420000, 'Completed', 100, 420000, 310000, 110000, '2025-01-10', '2025-08-15'),
    ('TND-003', 'Enterprise Fiber Optic Network Expansion Phase 2', 'CLI-103', 'KCB Group Headquarters', 'KCB/ICT/2026/014', 'Provision of services', 95000, 'Active', 65, 95000, 60000, 35000, '2026-01-15', '2026-08-30')
  `);

  // 3. Client LPOs Table
  db.run('DELETE FROM client_lpos');
  db.run(`INSERT INTO client_lpos (id, tender_id, client_reference, issue_date, due_date, total_value) VALUES
    ('LPO-101', 'TND-001', 'LPO-UNHCR-8910', '2025-06-10', '2025-11-15', 185000),
    ('LPO-102', 'TND-002', 'LPO-KBU-4209', '2025-01-15', '2025-08-10', 420000),
    ('LPO-103', 'TND-003', 'LPO-KCB-9021', '2026-02-01', '2026-08-30', 95000)
  `);

  // 4. Company Experience Table (Technical proofs)
  db.run('DELETE FROM company_experience');
  db.run(`INSERT INTO company_experience (id, project_name, client_name, contract_value, completion_date, scope, reference_letter_url, completion_certificate_url) VALUES
    ('EXP-401', 'Supply & Installation of 250 kW Solar Hybrid System', 'UNHCR Sub-Office Turkana', 185000, '2025-11-20', 'Turnkey solar hybrid installation with battery storage for refugee facility.', '/uploads/unhcr_reference_letter.svg', '/uploads/unhcr_reference_letter.svg'),
    ('EXP-402', 'Construction of 3-Storey County Health Clinic Block', 'County Government of Kiambu', 420000, '2025-08-15', 'Civil construction and MEP engineering for 3-storey outpatient health center.', '/uploads/county_health_reference_letter.svg', '/uploads/county_health_reference_letter.svg'),
    ('EXP-403', 'Regional Logistics & Medical Supplies Distribution', 'World Health Organization (WHO)', 310000, '2024-10-05', 'Cold chain logistics and emergency medical kit distribution across 12 counties.', '/uploads/nca1_certificate.svg', '/uploads/nca1_certificate.svg')
  `);

  console.log('✅ Successfully seeded clients, tenders, LPOs, and past experience!');
  process.exit(0);
});
