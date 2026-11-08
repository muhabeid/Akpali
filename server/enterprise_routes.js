const fs = require('fs');
const path = require('path');

function registerEnterpriseRoutes(app, getDb) {
  const db = () => getDb();

  // -------------------------------------------------------------
  // Audit Trail Helper
  // -------------------------------------------------------------
  async function logAudit(req, { action, entity_type, entity_id, details, user_role, user_name, previous_state, new_state }) {
    try {
      const database = db();
      if (!database) return;
      const role = user_role || req?.headers?.['x-user-role'] || req?.body?.user_role || 'Admin';
      const name = user_name || req?.headers?.['x-user-name'] || req?.body?.user_name || (role === 'Admin' ? 'Eng. John Akpali' : 'System User');
      const ip = req?.ip || req?.socket?.remoteAddress || '127.0.0.1';
      await database.run(
        `INSERT INTO audit_logs (user_role, user_name, action, entity_type, entity_id, details, previous_state, new_state, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          role,
          name,
          action,
          entity_type || '',
          entity_id || '',
          typeof details === 'object' ? JSON.stringify(details) : (details || ''),
          typeof previous_state === 'object' ? JSON.stringify(previous_state) : (previous_state || ''),
          typeof new_state === 'object' ? JSON.stringify(new_state) : (new_state || ''),
          ip
        ]
      );
    } catch (err) {
      console.error('Audit Logging Error:', err.message);
    }
  }

  // -------------------------------------------------------------
  // 1. SIDE-BY-SIDE SUPPLIER QUOTATION EVALUATION MATRIX
  // -------------------------------------------------------------
  
  // Get all quotations for an RFQ with matrix analytics
  app.get('/api/rfqs/:id/quotations', async (req, res) => {
    try {
      const { id } = req.params;
      const database = db();
      const rfq = await database.get(
        `SELECT r.*, t.name as tender_name, t.client_name as tender_client_name, l.client_reference as lpo_client_reference
         FROM rfqs r
         LEFT JOIN tenders t ON r.tender_id = t.id
         LEFT JOIN client_lpos l ON r.lpo_id = l.id
         WHERE r.id = ?`,
        [id]
      );
      if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

      let rfqItems = [];
      try {
        rfqItems = typeof rfq.items === 'string' ? JSON.parse(rfq.items || '[]') : (rfq.items || []);
      } catch (e) {
        rfqItems = [];
      }

      const quotes = await database.all(
        `SELECT * FROM supplier_quotations WHERE rfq_id = ? ORDER BY total_amount ASC, delivery_lead_time_days ASC`,
        [id]
      );

      const parsedQuotes = quotes.map(q => {
        let items = [];
        try {
          items = typeof q.items_json === 'string' ? JSON.parse(q.items_json || '[]') : (q.items_json || []);
        } catch (e) {
          items = [];
        }
        return {
          ...q,
          items
        };
      });

      // Matrix Item Comparison Analysis
      const itemComparison = rfqItems.map((rfqItem, idx) => {
        const itemDesc = rfqItem.description || rfqItem.name || `Item #${idx + 1}`;
        const itemQty = Number(rfqItem.quantity || rfqItem.qty || 1);

        const supplierBids = parsedQuotes.map(quote => {
          const matchedItem = quote.items.find(i => 
            (i.description && i.description.toLowerCase().trim() === itemDesc.toLowerCase().trim()) ||
            (i.name && i.name.toLowerCase().trim() === itemDesc.toLowerCase().trim())
          ) || quote.items[idx] || null;

          const unitPrice = matchedItem ? Number(matchedItem.unit_price || matchedItem.price || 0) : null;
          const totalLinePrice = unitPrice !== null ? unitPrice * itemQty : null;

          return {
            quote_id: quote.id,
            supplier_name: quote.supplier_name,
            unit_price: unitPrice,
            total_line_price: totalLinePrice,
            is_compliant: quote.compliance_status === 'Compliant'
          };
        });

        // Find lowest compliant unit price for this item
        const validBids = supplierBids.filter(b => b.unit_price !== null && b.unit_price > 0 && b.is_compliant);
        const lowestBid = validBids.length > 0 
          ? validBids.reduce((prev, curr) => (curr.unit_price < prev.unit_price ? curr : prev), validBids[0])
          : null;

        return {
          item_index: idx,
          description: itemDesc,
          quantity: itemQty,
          unit: rfqItem.unit || 'Units',
          supplier_bids: supplierBids,
          lowest_bidder_for_item: lowestBid ? lowestBid.supplier_name : null,
          lowest_unit_price: lowestBid ? lowestBid.unit_price : null
        };
      });

      // Find Overall Recommended / Lowest Compliant Bidder
      const compliantQuotes = parsedQuotes.filter(q => q.compliance_status === 'Compliant');
      const recommendedQuote = compliantQuotes.length > 0
        ? compliantQuotes.reduce((prev, curr) => (curr.total_amount < prev.total_amount ? curr : prev), compliantQuotes[0])
        : (parsedQuotes[0] || null);

      res.json({
        rfq,
        rfq_items: rfqItems,
        quotations: parsedQuotes,
        matrix_comparison: itemComparison,
        recommended_quote_id: recommendedQuote ? recommendedQuote.id : null,
        recommended_supplier_name: recommendedQuote ? recommendedQuote.supplier_name : null,
        is_awarded: rfq.status === 'Awarded' || parsedQuotes.some(q => q.is_awarded === 1)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Record a new Supplier Quotation
  app.post('/api/rfqs/:id/quotations', async (req, res) => {
    try {
      const { id } = req.params;
      const database = db();
      const {
        supplier_id,
        supplier_name,
        items,
        total_amount,
        delivery_lead_time_days,
        warranty_terms,
        payment_credit_terms,
        compliance_status,
        compliance_notes
      } = req.body;

      if (!supplier_name) {
        return res.status(400).json({ error: 'Supplier name is required' });
      }

      const quoteId = `SQ-${Date.now().toString().slice(-6)}`;
      const rfq = await database.get('SELECT tender_id FROM rfqs WHERE id = ?', [id]);
      const tenderId = rfq ? rfq.tender_id : null;

      const itemsJson = typeof items === 'object' ? JSON.stringify(items) : (items || '[]');

      // Calculate total amount if not explicitly provided
      let finalTotal = Number(total_amount) || 0;
      if (!finalTotal && Array.isArray(items)) {
        finalTotal = items.reduce((acc, curr) => {
          const qty = Number(curr.quantity || curr.qty || 1);
          const price = Number(curr.unit_price || curr.price || 0);
          return acc + (qty * price);
        }, 0);
      }

      await database.run(
        `INSERT INTO supplier_quotations (
          id, rfq_id, tender_id, supplier_id, supplier_name, items_json,
          total_amount, delivery_lead_time_days, warranty_terms, payment_credit_terms,
          compliance_status, compliance_notes, is_awarded
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          quoteId,
          id,
          tenderId,
          supplier_id || null,
          supplier_name,
          itemsJson,
          finalTotal,
          Number(delivery_lead_time_days) || 7,
          warranty_terms || '12 Months Standard Manufacturer Warranty',
          payment_credit_terms || '30 Days Net on Invoiced Delivery',
          compliance_status || 'Compliant',
          compliance_notes || ''
        ]
      );

      await logAudit(req, {
        action: 'Record Supplier Quotation',
        entity_type: 'supplier_quotations',
        entity_id: quoteId,
        details: `Recorded quotation of KES ${finalTotal.toLocaleString()} from ${supplier_name} for RFQ #${id}`
      });

      const newQuote = await database.get('SELECT * FROM supplier_quotations WHERE id = ?', [quoteId]);
      res.status(201).json(newQuote);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a Supplier Quotation
  app.delete('/api/rfqs/:id/quotations/:quoteId', async (req, res) => {
    try {
      const { id, quoteId } = req.params;
      const database = db();
      await database.run('DELETE FROM supplier_quotations WHERE id = ? AND rfq_id = ?', [quoteId, id]);
      await logAudit(req, {
        action: 'Delete Supplier Quotation',
        entity_type: 'supplier_quotations',
        entity_id: quoteId,
        details: `Deleted quotation ${quoteId} from RFQ #${id}`
      });
      res.json({ success: true, message: 'Quotation deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 1-Click PO Conversion / Award RFQ
  app.post('/api/rfqs/:id/award-po', async (req, res) => {
    try {
      const { id } = req.params;
      const { quotation_id, expected_date } = req.body;
      const database = db();

      const quote = await database.get('SELECT * FROM supplier_quotations WHERE id = ? AND rfq_id = ?', [quotation_id, id]);
      if (!quote) return res.status(404).json({ error: 'Quotation not found for this RFQ' });

      const rfq = await database.get('SELECT * FROM rfqs WHERE id = ?', [id]);
      if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

      // Generate Purchase Order ID
      const poId = `PO-${Date.now().toString().slice(-6)}`;
      const calcExpectedDate = expected_date || new Date(Date.now() + (quote.delivery_lead_time_days || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Insert Purchase Order
      await database.run(
        `INSERT INTO purchase_orders (id, tender_id, supplier_name, type, expected_date, total_value, items, status)
         VALUES (?, ?, ?, 'Goods', ?, ?, ?, 'Pending Delivery')`,
        [
          poId,
          rfq.tender_id || null,
          quote.supplier_name,
          calcExpectedDate,
          quote.total_amount,
          quote.items_json
        ]
      );

      // Mark this quotation as awarded
      await database.run('UPDATE supplier_quotations SET is_awarded = 1 WHERE id = ?', [quotation_id]);
      await database.run('UPDATE supplier_quotations SET is_awarded = 0 WHERE rfq_id = ? AND id != ?', [id, quotation_id]);

      // Mark RFQ as Awarded
      await database.run("UPDATE rfqs SET status = 'Awarded', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);

      await logAudit(req, {
        action: 'Award RFQ to Supplier PO',
        entity_type: 'rfqs',
        entity_id: id,
        details: `Awarded RFQ #${id} to ${quote.supplier_name} (KES ${quote.total_amount.toLocaleString()}) -> Generated PO #${poId}`
      });

      res.status(201).json({
        success: true,
        po_id: poId,
        supplier_name: quote.supplier_name,
        total_value: quote.total_amount,
        expected_date: calcExpectedDate,
        message: `Successfully awarded RFQ #${id} to ${quote.supplier_name} and generated Purchase Order #${poId}.`
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 2. IMMUTABLE SYSTEM AUDIT TRAIL (TAMPER-PROOF ACTIVITY LOG)
  // -------------------------------------------------------------
  
  // Extended Audit Trail with advanced filtering
  app.get('/api/audit-logs/query', async (req, res) => {
    try {
      const database = db();
      const { user_role, action, entity_type, startDate, endDate, search, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const params = [];

      if (user_role && user_role !== 'ALL') {
        query += ' AND user_role = ?';
        params.push(user_role);
      }
      if (action && action !== 'ALL') {
        query += ' AND action LIKE ?';
        params.push(`%${action}%`);
      }
      if (entity_type && entity_type !== 'ALL') {
        query += ' AND entity_type = ?';
        params.push(entity_type);
      }
      if (startDate) {
        query += ' AND created_at >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND created_at <= ?';
        params.push(`${endDate} 23:59:59`);
      }
      if (search) {
        query += ' AND (details LIKE ? OR user_name LIKE ? OR entity_id LIKE ?)';
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
      params.push(Math.min(Number(limit) || 100, 500), Number(offset) || 0);

      const logs = await database.all(query, params);
      const totalCountRow = await database.get('SELECT COUNT(*) as count FROM audit_logs');

      res.json({
        total: totalCountRow ? totalCountRow.count : logs.length,
        logs
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Export Audit Trail as CSV
  app.get('/api/audit-logs/export-csv', async (req, res) => {
    try {
      const database = db();
      const logs = await database.all('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 1000');
      
      const headers = ['ID', 'Timestamp', 'User Role', 'User Name', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP Address'];
      const rows = logs.map(l => [
        l.id,
        `"${l.created_at || ''}"`,
        `"${(l.user_role || '').replace(/"/g, '""')}"`,
        `"${(l.user_name || '').replace(/"/g, '""')}"`,
        `"${(l.action || '').replace(/"/g, '""')}"`,
        `"${(l.entity_type || '').replace(/"/g, '""')}"`,
        `"${(l.entity_id || '').replace(/"/g, '""')}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`,
        `"${l.ip_address || '127.0.0.1'}"`
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment(`akpali_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } catch (err) {
      res.status(500).send(`Export Error: ${err.message}`);
    }
  });

  // -------------------------------------------------------------
  // 3. MAKER-CHECKER & MULTI-LEVEL APPROVAL LIMITS
  // -------------------------------------------------------------

  app.get('/api/approval-workflows/matrix', async (req, res) => {
    try {
      const database = db();
      const workflows = await database.all('SELECT * FROM approval_workflows ORDER BY threshold_amount ASC');
      
      // Standard authorization ceilings overview
      const limitsSummary = [
        { role: 'Procurement_Officer', module: 'Procurement (PO)', max_approval: 100000, label: 'Officer Limit: Up to KES 100,000' },
        { role: 'Procurement_Finance', module: 'Procurement (PO)', max_approval: 500000, label: 'Manager Limit: Up to KES 500,000' },
        { role: 'Admin', module: 'Procurement (PO)', max_approval: Infinity, label: 'Admin Limit: Unlimited' },
        { role: 'Finance_Officer', module: 'Treasury & Payments', max_approval: 50000, label: 'Officer Limit: Up to KES 50,000' },
        { role: 'Procurement_Finance', module: 'Treasury & Payments', max_approval: 300000, label: 'Manager Limit: Up to KES 300,000' },
        { role: 'Admin', module: 'Treasury & Payments', max_approval: Infinity, label: 'Admin Limit: Unlimited' }
      ];

      res.json({ workflows, limits: limitsSummary });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 4. AUTOMATED BANK & M-PESA CSV STATEMENT RECONCILIATION
  // -------------------------------------------------------------

  app.post('/api/finances/reconciliation/parse', async (req, res) => {
    try {
      const { account_id, csv_text, filename } = req.body;
      const database = db();

      if (!account_id) return res.status(400).json({ error: 'Account ID is required' });
      if (!csv_text) return res.status(400).json({ error: 'CSV statement data is required' });

      const account = await database.get('SELECT * FROM accounts WHERE id = ?', [account_id]);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      // Parse CSV text lines
      const lines = csv_text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        return res.status(400).json({ error: 'CSV file contains insufficient rows' });
      }

      // Helper to parse CSV row handling quotes
      const parseCSVLine = (text) => {
        const re = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\/]+))\s*(?:,|$)/g;
        const res = [];
        let match;
        while ((match = re.exec(text)) !== null) {
          res.push(match[1] || match[2] || match[3] || '');
        }
        return res;
      };

      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());

      // Auto-detect columns
      const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('posting') || h.includes('time'));
      const refIdx = headers.findIndex(h => h.includes('ref') || h.includes('receipt') || h.includes('code') || h.includes('id') || h.includes('trans'));
      const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('particular') || h.includes('detail') || h.includes('narrat') || h.includes('memo'));
      const debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('paid out') || h.includes('withdrawal') || h.includes('outflow'));
      const creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('paid in') || h.includes('deposit') || h.includes('inflow'));
      const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('sum'));

      const statementRows = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length < 2) continue;

        const date = dateIdx >= 0 ? row[dateIdx] : new Date().toISOString().split('T')[0];
        const ref = refIdx >= 0 ? row[refIdx] : `STMT-${i}`;
        const desc = descIdx >= 0 ? row[descIdx] : 'Bank Transaction';

        let debit = 0;
        let credit = 0;

        if (debitIdx >= 0 && creditIdx >= 0) {
          debit = Math.abs(parseFloat(String(row[debitIdx] || '0').replace(/[^0-9.-]/g, '')) || 0);
          credit = Math.abs(parseFloat(String(row[creditIdx] || '0').replace(/[^0-9.-]/g, '')) || 0);
        } else if (amountIdx >= 0) {
          const rawAmt = parseFloat(String(row[amountIdx] || '0').replace(/[^0-9.-]/g, '')) || 0;
          if (rawAmt < 0) debit = Math.abs(rawAmt);
          else credit = rawAmt;
        }

        if (debit > 0 || credit > 0) {
          statementRows.push({
            row_id: `STMT-LINE-${i}`,
            date: date.trim(),
            reference: ref.trim(),
            description: desc.trim(),
            debit,
            credit,
            amount: debit > 0 ? debit : credit,
            type: debit > 0 ? 'Expense' : 'Income'
          });
        }
      }

      // Fetch ERP Transactions for this account
      const erpTransactions = await database.all(
        'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC',
        [account_id]
      );

      // Intelligent Matching Engine
      const matched = [];
      const unmatchedStatement = [];
      const matchedErpIds = new Set();

      statementRows.forEach(stmt => {
        // Match 1: Exact reference match
        let erpMatch = erpTransactions.find(t => 
          !matchedErpIds.has(t.id) &&
          stmt.reference && t.reference &&
          (stmt.reference.toLowerCase().includes(t.reference.toLowerCase()) || t.reference.toLowerCase().includes(stmt.reference.toLowerCase()))
        );

        // Match 2: Exact Amount + Same Type match if reference didn't match
        if (!erpMatch) {
          erpMatch = erpTransactions.find(t => 
            !matchedErpIds.has(t.id) &&
            Math.abs(t.amount - stmt.amount) < 0.01 &&
            t.type === stmt.type
          );
        }

        if (erpMatch) {
          matchedErpIds.add(erpMatch.id);
          matched.push({
            statement_line: stmt,
            erp_transaction: erpMatch,
            match_status: 'Matched',
            confidence: Math.abs(erpMatch.amount - stmt.amount) < 0.01 ? 100 : 85
          });
        } else {
          unmatchedStatement.push(stmt);
        }
      });

      const unmatchedErp = erpTransactions.filter(t => !matchedErpIds.has(t.id));

      const totalStatementIn = statementRows.reduce((acc, r) => acc + r.credit, 0);
      const totalStatementOut = statementRows.reduce((acc, r) => acc + r.debit, 0);

      res.json({
        account,
        filename: filename || 'Bank_Statement.csv',
        summary: {
          statement_lines_count: statementRows.length,
          matched_count: matched.length,
          unmatched_statement_count: unmatchedStatement.length,
          unmatched_erp_count: unmatchedErp.length,
          total_statement_in: totalStatementIn,
          total_statement_out: totalStatementOut,
          reconciliation_health_pct: statementRows.length > 0 ? Math.round((matched.length / statementRows.length) * 100) : 100
        },
        matched,
        unmatched_statement: unmatchedStatement,
        unmatched_erp: unmatchedErp
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/finances/reconciliation/save', async (req, res) => {
    try {
      const { account_id, statement_filename, opening_balance, closing_balance, reconciled_items, unmatched_items } = req.body;
      const database = db();
      const account = await database.get('SELECT name FROM accounts WHERE id = ?', [account_id]);

      const reconId = `REC-${Date.now().toString().slice(-6)}`;
      await database.run(
        `INSERT INTO bank_reconciliations (
          id, account_id, account_name, statement_period, statement_filename,
          opening_balance, closing_balance, reconciled_items_json, unmatched_items_json, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Reconciled')`,
        [
          reconId,
          account_id,
          account ? account.name : 'Treasury Account',
          new Date().toISOString().slice(0, 7),
          statement_filename || 'Uploaded_Statement.csv',
          Number(opening_balance) || 0,
          Number(closing_balance) || 0,
          JSON.stringify(reconciled_items || []),
          JSON.stringify(unmatched_items || [])
        ]
      );

      await logAudit(req, {
        action: 'Commit Bank Statement Reconciliation',
        entity_type: 'bank_reconciliations',
        entity_id: reconId,
        details: `Saved statement reconciliation #${reconId} for ${account ? account.name : account_id}`
      });

      res.status(201).json({ success: true, reconciliation_id: reconId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/finances/reconciliations', async (req, res) => {
    try {
      const database = db();
      const list = await database.all('SELECT * FROM bank_reconciliations ORDER BY created_at DESC');
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 5. RETENTION MONEY & DEFECT LIABILITY LEDGER
  // -------------------------------------------------------------

  app.get('/api/finances/retention', async (req, res) => {
    try {
      const database = db();
      const records = await database.all(
        `SELECT r.*, t.name as tender_name, t.client_name as tender_client_name
         FROM retention_records r
         LEFT JOIN tenders t ON r.tender_id = t.id
         ORDER BY r.created_at DESC`
      );

      const now = new Date();
      let totalRetained = 0;
      let totalClaimed = 0;
      let totalReleased = 0;
      let totalDueForRelease = 0;

      const enhanced = records.map(rec => {
        const retainedAmt = Number(rec.retained_amount) || 0;
        if (rec.status === 'Retained') totalRetained += retainedAmt;
        else if (rec.status === 'Claimed') totalClaimed += retainedAmt;
        else if (rec.status === 'Released') totalReleased += retainedAmt;

        let daysRemaining = 0;
        let dlpProgressPct = 0;
        let isDue = false;

        if (rec.release_due_date) {
          const dueDate = new Date(rec.release_due_date);
          const handoverDate = rec.handover_date ? new Date(rec.handover_date) : new Date(dueDate.getTime() - (rec.dlp_tenor_months || 6) * 30 * 24 * 60 * 60 * 1000);
          
          const totalDurationMs = Math.max(dueDate.getTime() - handoverDate.getTime(), 1);
          const elapsedMs = Math.max(now.getTime() - handoverDate.getTime(), 0);
          
          daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          dlpProgressPct = Math.min(Math.round((elapsedMs / totalDurationMs) * 100), 100);

          if (daysRemaining <= 0 && rec.status === 'Retained') {
            isDue = true;
            totalDueForRelease += retainedAmt;
          }
        }

        return {
          ...rec,
          days_remaining_dlp: daysRemaining,
          dlp_progress_pct: dlpProgressPct,
          is_due_for_release: isDue
        };
      });

      res.json({
        kpis: {
          total_retained: totalRetained,
          total_claimed: totalClaimed,
          total_released: totalReleased,
          total_due_for_release: totalDueForRelease
        },
        records: enhanced
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/finances/retention', async (req, res) => {
    try {
      const database = db();
      const {
        tender_id,
        client_name,
        contract_reference,
        contract_value,
        retention_rate_pct = 10,
        dlp_tenor_months = 6,
        handover_date,
        notes
      } = req.body;

      if (!tender_id) return res.status(400).json({ error: 'Tender ID is required' });

      const tender = await database.get('SELECT * FROM tenders WHERE id = ?', [tender_id]);
      const finalClient = client_name || (tender ? tender.client_name : 'Valued Client');
      const finalVal = Number(contract_value) || (tender ? tender.contract_value : 0);
      const ratePct = Number(retention_rate_pct) || 10;
      const retainedAmount = (finalVal * ratePct) / 100;

      const handover = handover_date || new Date().toISOString().split('T')[0];
      const dueDateObj = new Date(handover);
      dueDateObj.setMonth(dueDateObj.getMonth() + Number(dlp_tenor_months || 6));
      const releaseDueDate = dueDateObj.toISOString().split('T')[0];

      const retentionId = `RET-${Date.now().toString().slice(-6)}`;
      await database.run(
        `INSERT INTO retention_records (
          id, tender_id, client_name, contract_reference, contract_value,
          retention_rate_pct, retained_amount, dlp_tenor_months, handover_date,
          release_due_date, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Retained', ?)`,
        [
          retentionId,
          tender_id,
          finalClient,
          contract_reference || tender_id,
          finalVal,
          ratePct,
          retainedAmount,
          Number(dlp_tenor_months) || 6,
          handover,
          releaseDueDate,
          notes || ''
        ]
      );

      await logAudit(req, {
        action: 'Record Contract Retention',
        entity_type: 'retention_records',
        entity_id: retentionId,
        details: `Recorded statutory retention of KES ${retainedAmount.toLocaleString()} (${ratePct}%) for Tender #${tender_id}`
      });

      const newRecord = await database.get('SELECT * FROM retention_records WHERE id = ?', [retentionId]);
      res.status(201).json(newRecord);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 1-Click Retention Claim Invoice Generation
  app.post('/api/finances/retention/:id/claim-invoice', async (req, res) => {
    try {
      const { id } = req.params;
      const database = db();
      const rec = await database.get('SELECT * FROM retention_records WHERE id = ?', [id]);
      if (!rec) return res.status(404).json({ error: 'Retention record not found' });

      const invoiceId = `INV-RET-${Date.now().toString().slice(-5)}`;
      const today = new Date().toISOString().split('T')[0];

      await database.run(
        `INSERT INTO client_invoices (id, tender_id, billing_type, reference_id, amount, invoice_date, status)
         VALUES (?, ?, 'milestone', ?, ?, ?, 'Sent')`,
        [
          invoiceId,
          rec.tender_id,
          `Retention Release Claim - DLP Expiry (${rec.contract_reference || rec.id})`,
          rec.retained_amount,
          today
        ]
      );

      await database.run(
        'UPDATE retention_records SET status = "Claimed", claim_invoice_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [invoiceId, id]
      );

      await logAudit(req, {
        action: 'Generate Retention Claim Invoice',
        entity_type: 'retention_records',
        entity_id: id,
        details: `Generated client invoice #${invoiceId} for retained amount KES ${rec.retained_amount.toLocaleString()}`
      });

      res.status(201).json({
        success: true,
        invoice_id: invoiceId,
        message: `Successfully generated Retention Claim Invoice #${invoiceId} for KES ${rec.retained_amount.toLocaleString()}.`
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Mark retention as released / settled
  app.post('/api/finances/retention/:id/release', async (req, res) => {
    try {
      const { id } = req.params;
      const database = db();
      await database.run('UPDATE retention_records SET status = "Released", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      await logAudit(req, {
        action: 'Mark Retention Released',
        entity_type: 'retention_records',
        entity_id: id,
        details: `Marked retention #${id} as Released & Settled`
      });
      res.json({ success: true, message: 'Retention marked as Released.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 6. 30–60–90 DAY PREDICTIVE CASH FLOW FORECASTER
  // -------------------------------------------------------------

  app.get('/api/finances/predictive-cashflow', async (req, res) => {
    try {
      const database = db();
      const accounts = await database.all('SELECT * FROM accounts');
      const currentLiquidCash = accounts.reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);

      // Inflows: Unpaid Client Invoices
      const clientInvoices = await database.all("SELECT * FROM client_invoices WHERE status != 'Paid'");
      const now = new Date();

      let in30 = 0, in60 = 0, in90 = 0;
      clientInvoices.forEach(inv => {
        const amt = Number(inv.amount) || 0;
        const invDate = new Date(inv.invoice_date || now);
        const daysOld = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));
        if (daysOld <= 30) in30 += amt;
        else if (daysOld <= 60) in60 += amt;
        else in90 += amt;
      });

      // Active Tenders unbilled value projected as milestone inflow
      const activeTenders = await database.all("SELECT * FROM tenders WHERE status = 'Active'");
      let tenderInflow30 = 0, tenderInflow60 = 0, tenderInflow90 = 0;
      activeTenders.forEach(t => {
        const unbilled = Math.max((Number(t.contract_value) || 0) - (Number(t.total_revenue) || 0), 0);
        if (unbilled > 0) {
          tenderInflow30 += unbilled * 0.4;
          tenderInflow60 += unbilled * 0.4;
          tenderInflow90 += unbilled * 0.2;
        }
      });

      // Outflows: Pending Purchase Orders
      const pendingPOs = await database.all("SELECT * FROM purchase_orders WHERE status IN ('Pending Delivery', 'Awaiting Approval')");
      let out30 = 0, out60 = 0, out90 = 0;
      pendingPOs.forEach(po => {
        const val = Number(po.total_value) || 0;
        out30 += val * 0.6;
        out60 += val * 0.3;
        out90 += val * 0.1;
      });

      // Baseline monthly overheads (payroll, office rent, utilities)
      const monthlyOverhead = 250000;
      out30 += monthlyOverhead;
      out60 += monthlyOverhead;
      out90 += monthlyOverhead;

      // Project liquidity milestone steps
      const totalIn30 = in30 + tenderInflow30;
      const totalIn60 = in60 + tenderInflow60;
      const totalIn90 = in90 + tenderInflow90;

      const projDay0 = currentLiquidCash;
      const projDay15 = projDay0 + (totalIn30 * 0.4) - (out30 * 0.4);
      const projDay30 = projDay0 + totalIn30 - out30;
      const projDay60 = projDay30 + totalIn60 - out60;
      const projDay90 = projDay60 + totalIn90 - out90;

      const timeline = [
        { label: 'Today (Day 0)', days: 0, balance: projDay0, inflow: 0, outflow: 0 },
        { label: 'Day 15', days: 15, balance: projDay15, inflow: totalIn30 * 0.4, outflow: out30 * 0.4 },
        { label: 'Day 30', days: 30, balance: projDay30, inflow: totalIn30, outflow: out30 },
        { label: 'Day 60', days: 60, balance: projDay60, inflow: totalIn60, outflow: out60 },
        { label: 'Day 90', days: 90, balance: projDay90, inflow: totalIn90, outflow: out90 }
      ];

      const minProjected = Math.min(projDay0, projDay15, projDay30, projDay60, projDay90);
      let riskStatus = 'HEALTHY';
      if (minProjected < 0) riskStatus = 'DEFICIT RISK';
      else if (minProjected < 150000) riskStatus = 'CAUTION';

      res.json({
        current_liquid_cash: currentLiquidCash,
        risk_status: riskStatus,
        lowest_projected_balance: minProjected,
        milestones: {
          days_30: { inflows: totalIn30, outflows: out30, net_change: totalIn30 - out30, projected_balance: projDay30 },
          days_60: { inflows: totalIn60, outflows: out60, net_change: totalIn60 - out60, projected_balance: projDay60 },
          days_90: { inflows: totalIn90, outflows: out90, net_change: totalIn90 - out90, projected_balance: projDay90 }
        },
        timeline
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 7. CONSORTIUM & JOINT VENTURE (JV) PARTNERSHIP MODULE
  // -------------------------------------------------------------

  app.get('/api/tenders/:id/consortium', async (req, res) => {
    try {
      const { id } = req.params;
      const database = db();
      const partners = await database.all('SELECT * FROM tender_consortiums WHERE tender_id = ? ORDER BY equity_share_pct DESC', [id]);
      const tender = await database.get('SELECT * FROM tenders WHERE id = ?', [id]);
      const company = await database.get('SELECT * FROM company_profile WHERE id = 1');

      const allocatedPartnerPct = partners.reduce((sum, p) => sum + (Number(p.equity_share_pct) || 0), 0);
      const leadPartnerPct = Math.max(100 - allocatedPartnerPct, 0);

      res.json({
        tender,
        lead_partner: {
          name: company?.legal_name || 'Akpali & Co.',
          kra_pin: company?.tax_pin || 'P051234567Z',
          equity_share_pct: leadPartnerPct,
          is_lead: true
        },
        total_partners_count: partners.length,
        partners,
        is_consortium_valid: allocatedPartnerPct <= 100
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/tenders/:id/consortium', async (req, res) => {
    try {
      const { id } = req.params;
      const database = db();
      const {
        partner_name,
        partner_type = 'Technical Partner',
        kra_pin,
        registration_num,
        contact_person,
        email,
        phone,
        equity_share_pct = 20,
        scope_allocated,
        agreement_status = 'Drafted',
        agreement_date
      } = req.body;

      if (!partner_name) return res.status(400).json({ error: 'Partner name is required' });

      const partnerId = `JV-${Date.now().toString().slice(-6)}`;
      await database.run(
        `INSERT INTO tender_consortiums (
          id, tender_id, partner_name, partner_type, kra_pin, registration_num,
          contact_person, email, phone, equity_share_pct, scope_allocated,
          lead_partner_name, agreement_status, agreement_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Akpali & Co.', ?, ?)`,
        [
          partnerId,
          id,
          partner_name,
          partner_type,
          kra_pin || '',
          registration_num || '',
          contact_person || '',
          email || '',
          phone || '',
          Number(equity_share_pct) || 0,
          scope_allocated || '',
          agreement_status,
          agreement_date || new Date().toISOString().split('T')[0]
        ]
      );

      await logAudit(req, {
        action: 'Add Consortium Partner',
        entity_type: 'tender_consortiums',
        entity_id: partnerId,
        details: `Added JV partner ${partner_name} (${equity_share_pct}%) for Tender #${id}`
      });

      const partner = await database.get('SELECT * FROM tender_consortiums WHERE id = ?', [partnerId]);
      res.status(201).json(partner);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/tenders/:id/consortium/:partnerId', async (req, res) => {
    try {
      const { id, partnerId } = req.params;
      const database = db();
      await database.run('DELETE FROM tender_consortiums WHERE id = ? AND tender_id = ?', [partnerId, id]);
      await logAudit(req, {
        action: 'Remove Consortium Partner',
        entity_type: 'tender_consortiums',
        entity_id: partnerId,
        details: `Removed JV partner #${partnerId} from Tender #${id}`
      });
      res.json({ success: true, message: 'Partner removed from consortium.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 8. 1-CLICK TENDER SUBMISSION PACKAGER (BID BINDER)
  // -------------------------------------------------------------

  app.get('/api/tenders/:id/submission-pack', async (req, res) => {
    try {
      const { id } = req.params;
      const database = db();
      const tender = await database.get(
        `SELECT t.*, c.tax_pin as client_pin, c.address as client_address, c.email as client_email
         FROM tenders t
         LEFT JOIN clients c ON t.client_id = c.id
         WHERE t.id = ?`,
        [id]
      );
      if (!tender) return res.status(404).json({ error: 'Tender not found' });

      const company = await database.get('SELECT * FROM company_profile WHERE id = 1');
      const directors = await database.all('SELECT * FROM directors ORDER BY shareholding_pct DESC');
      const registrations = await database.all('SELECT * FROM tender_registrations ORDER BY authority_name ASC');
      const experience = await database.all('SELECT * FROM company_experience ORDER BY contract_value DESC LIMIT 8');
      const accounts = await database.all('SELECT * FROM accounts');
      const policies = await database.all('SELECT * FROM company_policies');
      const consortium = await database.all('SELECT * FROM tender_consortiums WHERE tender_id = ?', [id]);

      // Generate Structured Binder Index
      const binderIndex = [
        { section_num: 'Cover', title: 'Official Tender Bid Submission Cover & Transmittal', page: 1 },
        { section_num: 'TOC', title: 'Comprehensive Document Table of Contents', page: 2 },
        { section_num: 'Schedule 1', title: 'Corporate Profile, Registration & Statutory Certificates', page: 3 },
        { section_num: 'Schedule 2', title: 'Technical Regulatory Accreditations (NCA, EBK, PPRA)', page: 4 },
        { section_num: 'Schedule 3', title: 'Board of Directors & Key Engineering Personnel Profiles', page: 5 },
        { section_num: 'Schedule 4', title: 'Past Performance & Track Record of Similar Contracts', page: 6 },
        { section_num: 'Schedule 5', title: 'Financial Standing, Banker Credentials & Credit Capability', page: 7 },
        { section_num: 'Schedule 6', title: 'Anti-Corruption, Non-Debarment & Statutory Declarations', page: 8 }
      ];

      res.json({
        tender,
        company,
        directors,
        registrations,
        experience,
        accounts,
        policies,
        consortium,
        binder_index: binderIndex
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 9. LIVE TENDER PROFITABILITY & BUDGET VS. ACTUAL THERMOMETER
  // -------------------------------------------------------------

  app.get('/api/tenders/:id/profitability-deep-dive', async (req, res) => {
    try {
      const { id } = req.params;
      const database = db();
      const tender = await database.get('SELECT * FROM tenders WHERE id = ?', [id]);
      if (!tender) return res.status(404).json({ error: 'Tender not found' });

      const contractValue = Number(tender.contract_value) || 0;

      // Committed POs
      const poRows = await database.all("SELECT * FROM purchase_orders WHERE tender_id = ? AND status != 'Rejected'", [id]);
      const committedCost = poRows.reduce((sum, po) => sum + (Number(po.total_value) || 0), 0);

      // Incurred Direct Expenses (transactions tagged to tender)
      const expenseTrans = await database.all("SELECT * FROM transactions WHERE tender_id = ? AND type = 'Expense'", [id]);
      const actualDirectExpenses = expenseTrans.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      // Client Invoiced
      const clientInvs = await database.all('SELECT * FROM client_invoices WHERE tender_id = ?', [id]);
      const totalInvoiced = clientInvs.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
      const totalCashCollected = clientInvs.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

      // Goods Received (GRNs)
      const grnRows = await database.all(
        `SELECT g.* FROM grns g
         JOIN purchase_orders p ON g.po_id = p.id
         WHERE p.tender_id = ?`,
        [id]
      );
      const actualDeliveredGoodsValue = grnRows.reduce((sum, g) => sum + (Number(g.received_value) || 0), 0);

      const totalBudgetBurn = committedCost + actualDirectExpenses;
      const remainingCommittedBudget = contractValue - totalBudgetBurn;
      const burnPct = contractValue > 0 ? Math.round((totalBudgetBurn / contractValue) * 100) : 0;
      const projectedMarginPct = contractValue > 0 ? Math.round((remainingCommittedBudget / contractValue) * 100) : 0;

      let status = 'HEALTHY';
      if (remainingCommittedBudget < 0) status = 'OVERRUN';
      else if (projectedMarginPct < 15) status = 'WARNING';
      else if (projectedMarginPct >= 30) status = 'EXCELLENT';

      res.json({
        tender,
        contract_value: contractValue,
        committed_cost: committedCost,
        actual_direct_expenses: actualDirectExpenses,
        actual_delivered_goods_value: actualDeliveredGoodsValue,
        total_budget_burn: totalBudgetBurn,
        remaining_committed_budget: remainingCommittedBudget,
        burn_pct: burnPct,
        projected_margin_pct: projectedMarginPct,
        total_invoiced: totalInvoiced,
        total_cash_collected: totalCashCollected,
        health_status: status,
        purchase_orders_count: poRows.length,
        invoices_count: clientInvs.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 10. CLIENT STATEMENT OF ACCOUNT (SOA) & AGING ANALYSIS
  // -------------------------------------------------------------

  app.get('/api/finances/statement-of-account/:clientId', async (req, res) => {
    try {
      const { clientId } = req.params;
      const database = db();
      const client = await database.get('SELECT * FROM clients WHERE id = ?', [clientId]);
      if (!client) return res.status(404).json({ error: 'Client not found' });

      const company = await database.get('SELECT * FROM company_profile WHERE id = 1');
      const bankAccounts = await database.all("SELECT * FROM accounts WHERE type = 'Bank' LIMIT 1");

      // Invoices for this client
      const invoices = await database.all(
        `SELECT i.*, t.name as tender_name, t.client_reference as tender_ref
         FROM client_invoices i
         JOIN tenders t ON i.tender_id = t.id
         WHERE t.client_id = ?
         ORDER BY i.invoice_date ASC`,
        [clientId]
      );

      const now = new Date();
      let totalBilled = 0;
      let totalPaid = 0;
      let current0_30 = 0;
      let days31_60 = 0;
      let days61_90 = 0;
      let days90Plus = 0;

      const enhancedInvoices = invoices.map(inv => {
        const amt = Number(inv.amount) || 0;
        totalBilled += amt;

        const isPaid = inv.status === 'Paid';
        if (isPaid) totalPaid += amt;

        const invDate = new Date(inv.invoice_date || now);
        const ageDays = Math.max(Math.floor((now - invDate) / (1000 * 60 * 60 * 24)), 0);

        if (!isPaid) {
          if (ageDays <= 30) current0_30 += amt;
          else if (ageDays <= 60) days31_60 += amt;
          else if (ageDays <= 90) days61_90 += amt;
          else days90Plus += amt;
        }

        return {
          ...inv,
          age_days: ageDays,
          balance_due: isPaid ? 0 : amt
        };
      });

      const totalBalanceDue = totalBilled - totalPaid;

      // Formatted WhatsApp Reminder Text
      const bankInfo = bankAccounts.length > 0 ? `${bankAccounts[0].name} A/C: ${bankAccounts[0].account_number}` : 'KCB Main Operating Account';
      const formattedDate = now.toLocaleDateString('en-GB');
      const whatsappReminder = `*STATEMENT OF ACCOUNT REMINDER*\n\n` +
        `Dear *${client.name}*,\n\n` +
        `This is a courtesy financial update from *${company?.legal_name || 'Akpali & Co.'}* as of ${formattedDate}.\n\n` +
        `*Total Outstanding Balance:* KES ${totalBalanceDue.toLocaleString()}\n` +
        `• Current (0-30 Days): KES ${current0_30.toLocaleString()}\n` +
        `• 31-60 Days: KES ${days31_60.toLocaleString()}\n` +
        `• 61-90 Days: KES ${days61_90.toLocaleString()}\n` +
        `• Over 90 Days: KES ${days90Plus.toLocaleString()}\n\n` +
        `Please arrange payment to our bank account:\n` +
        `*Bank Details:* ${bankInfo}\n` +
        `*Payee:* ${company?.legal_name || 'Akpali & Co.'}\n` +
        `*Tax PIN:* ${company?.tax_pin || 'P051234567Z'}\n\n` +
        `Thank you for your valued partnership.`;

      res.json({
        client,
        company,
        bank: bankAccounts[0] || null,
        statement_date: formattedDate,
        total_billed: totalBilled,
        total_paid: totalPaid,
        total_balance_due: totalBalanceDue,
        aging_summary: {
          current_0_30: current0_30,
          days_31_60: days31_60,
          days_61_90: days61_90,
          days_90_plus: days90Plus,
          total_overdue: days31_60 + days61_90 + days90Plus
        },
        invoices: enhancedInvoices,
        whatsapp_reminder_template: whatsappReminder
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 11. AUTOMATED CORE FINANCIAL STATEMENTS (P&L, BALANCE SHEET, TRIAL BALANCE)
  // -------------------------------------------------------------

  app.get('/api/finances/reports/trial-balance', async (req, res) => {
    try {
      const database = db();
      const accounts = await database.all('SELECT * FROM chart_of_accounts ORDER BY account_code ASC');
      
      const journalItems = await database.all(`
        SELECT ji.account_code, SUM(ji.debit) as total_debit, SUM(ji.credit) as total_credit
        FROM journal_items ji
        JOIN journal_entries je ON ji.journal_id = je.id
        WHERE je.status = 'Posted'
        GROUP BY ji.account_code
      `);

      let totalDebits = 0;
      let totalCredits = 0;

      const reportRows = accounts.map(acc => {
        const item = journalItems.find(j => j.account_code === acc.account_code) || { total_debit: 0, total_credit: 0 };
        const debit = Number(item.total_debit) || 0;
        const credit = Number(item.total_credit) || 0;

        totalDebits += debit;
        totalCredits += credit;

        return {
          code: acc.account_code,
          name: acc.name,
          type: acc.type,
          category: acc.category,
          debit,
          credit,
          net_balance: debit - credit
        };
      });

      res.json({
        report_date: new Date().toISOString().split('T')[0],
        total_debits: totalDebits,
        total_credits: totalCredits,
        is_balanced: Math.abs(totalDebits - totalCredits) < 0.01,
        rows: reportRows
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/finances/reports/profit-loss', async (req, res) => {
    try {
      const database = db();
      // Revenue (Invoiced + Transactions Income)
      const clientInvs = await database.all('SELECT amount FROM client_invoices');
      const directRev = clientInvs.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

      // Cost of Goods Sold (Purchase Orders Goods + Subcontractors)
      const pos = await database.all("SELECT total_value, type FROM purchase_orders WHERE status != 'Rejected'");
      const cogsMaterials = pos.filter(p => p.type === 'Goods').reduce((sum, p) => sum + (Number(p.total_value) || 0), 0);
      const cogsServices = pos.filter(p => p.type === 'Service').reduce((sum, p) => sum + (Number(p.total_value) || 0), 0);
      const totalCOGS = cogsMaterials + cogsServices;

      const grossProfit = directRev - totalCOGS;
      const grossMarginPct = directRev > 0 ? Math.round((grossProfit / directRev) * 100) : 0;

      // Operating Expenses
      const overheadTransactions = await database.all("SELECT amount, purpose FROM transactions WHERE type = 'Expense' AND tender_id IS NULL");
      const totalOperatingExpenses = overheadTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const netOperatingIncome = grossProfit - totalOperatingExpenses;
      const netMarginPct = directRev > 0 ? Math.round((netOperatingIncome / directRev) * 100) : 0;

      res.json({
        period: `Fiscal Year ${new Date().getFullYear()}`,
        revenue: {
          tender_contract_billings: directRev,
          total_revenue: directRev
        },
        cost_of_sales: {
          materials_and_site_supplies: cogsMaterials,
          subcontractor_and_equipment_hire: cogsServices,
          total_cogs: totalCOGS
        },
        gross_profit: grossProfit,
        gross_margin_pct: grossMarginPct,
        operating_expenses: {
          administrative_and_utilities: totalOperatingExpenses,
          total_operating_expenses: totalOperatingExpenses
        },
        net_operating_profit: netOperatingIncome,
        net_margin_pct: netMarginPct
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/finances/reports/balance-sheet', async (req, res) => {
    try {
      const database = db();
      // Assets
      const accounts = await database.all('SELECT current_balance, type FROM accounts');
      const cashAndBank = accounts.reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);

      const unpaidInvoices = await database.all("SELECT amount FROM client_invoices WHERE status != 'Paid'");
      const accountsReceivable = unpaidInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

      const inventoryRows = await database.all('SELECT quantity, avg_unit_cost FROM inventory');
      const inventoryVal = inventoryRows.reduce((sum, inv) => sum + ((Number(inv.quantity) || 0) * (Number(inv.avg_unit_cost) || 0)), 0);

      const totalCurrentAssets = cashAndBank + accountsReceivable + inventoryVal;
      const nonCurrentAssets = 1500000; // Capital Equipment & Vehicles baseline
      const totalAssets = totalCurrentAssets + nonCurrentAssets;

      // Liabilities
      const unpaidPOs = await database.all("SELECT total_value FROM purchase_orders WHERE status = 'Pending Delivery'");
      const accountsPayable = unpaidPOs.reduce((sum, p) => sum + (Number(p.total_value) || 0), 0);

      const retentions = await database.all("SELECT retained_amount FROM retention_records WHERE status = 'Retained'");
      const retentionPayable = retentions.reduce((sum, r) => sum + (Number(r.retained_amount) || 0), 0);

      const totalLiabilities = accountsPayable + retentionPayable;

      // Equity
      const shareCapital = 1000000;
      const retainedEarnings = totalAssets - totalLiabilities - shareCapital;
      const totalEquity = shareCapital + retainedEarnings;

      res.json({
        as_of_date: new Date().toISOString().split('T')[0],
        assets: {
          current_assets: {
            cash_and_bank_balances: cashAndBank,
            trade_accounts_receivable: accountsReceivable,
            materials_inventory: inventoryVal,
            total_current_assets: totalCurrentAssets
          },
          non_current_assets: {
            plant_machinery_and_equipment: nonCurrentAssets,
            total_non_current_assets: nonCurrentAssets
          },
          total_assets: totalAssets
        },
        liabilities: {
          current_liabilities: {
            trade_accounts_payable: accountsPayable,
            statutory_contract_retention_payable: retentionPayable,
            total_liabilities: totalLiabilities
          }
        },
        equity: {
          shareholder_capital: shareCapital,
          retained_earnings: retainedEarnings,
          total_equity: totalEquity
        },
        total_liabilities_and_equity: totalLiabilities + totalEquity,
        is_balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 12. PRE-SUBMISSION COMPLIANCE & DOCUMENT EXPIRY GUARD
  // -------------------------------------------------------------

  app.get('/api/tenders/:id/compliance-preflight', async (req, res) => {
    try {
      const { id } = req.params;
      const database = db();
      const tender = await database.get('SELECT * FROM tenders WHERE id = ?', [id]);
      if (!tender) return res.status(404).json({ error: 'Tender not found' });

      const registrations = await database.all('SELECT * FROM tender_registrations');
      const documents = await database.all('SELECT * FROM company_documents');

      const now = new Date();

      // Mandatory Standard Kenyan Tender Compliance Requirements
      const mandatoryRequirements = [
        { code: 'TCC', title: 'KRA Tax Compliance Certificate (TCC)', authority: 'Kenya Revenue Authority', mandatory: true },
        { code: 'NCA', title: 'NCA Contractor Practicing License', authority: 'National Construction Authority', mandatory: true },
        { code: 'CR12', title: 'CR12 Official Company Search Certificate', authority: 'Registrar of Companies', mandatory: true },
        { code: 'SBP', title: 'Single Business Permit / Trade License', authority: 'County Government', mandatory: true },
        { code: 'AGPO', title: 'AGPO Certificate (Youth/Women/PWD)', authority: 'National Treasury', mandatory: false },
        { code: 'NSSF', title: 'NSSF Compliance Certificate', authority: 'National Social Security Fund', mandatory: true },
        { code: 'SHIF', title: 'NHIF / SHIF Compliance Certificate', authority: 'Social Health Insurance Fund', mandatory: true },
        { code: 'POLICY_ETHICS', title: 'Statutory Anti-Corruption Undertaking', authority: 'Public Procurement Regulatory Authority (PPRA)', mandatory: true }
      ];

      const evaluatedChecklist = mandatoryRequirements.map(reqItem => {
        // Find matching registration or document
        const reg = registrations.find(r => 
          (r.authority_name && r.authority_name.toLowerCase().includes(reqItem.code.toLowerCase())) ||
          (r.authority_name && r.authority_name.toLowerCase().includes(reqItem.authority.toLowerCase())) ||
          (r.category_grade && r.category_grade.toLowerCase().includes(reqItem.code.toLowerCase()))
        );

        const doc = documents.find(d => 
          (d.title && d.title.toLowerCase().includes(reqItem.code.toLowerCase())) ||
          (d.title && d.title.toLowerCase().includes(reqItem.title.toLowerCase()))
        );

        const record = reg || doc;
        const isPresent = !!record;
        let expiryDate = reg?.expiry_date || doc?.expiry_date || null;
        let daysUntilExpiry = null;
        let status = 'MISSING';

        if (isPresent) {
          if (expiryDate) {
            const exp = new Date(expiryDate);
            daysUntilExpiry = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry < 0) status = 'EXPIRED';
            else if (daysUntilExpiry <= 30) status = 'EXPIRING_SOON';
            else status = 'VALID';
          } else {
            status = 'VALID';
          }
        }

        return {
          ...reqItem,
          is_present: isPresent,
          expiry_date: expiryDate,
          days_until_expiry: daysUntilExpiry,
          status,
          record_id: record ? record.id : null
        };
      });

      const validCount = evaluatedChecklist.filter(c => c.status === 'VALID' || c.status === 'EXPIRING_SOON').length;
      const expiredCount = evaluatedChecklist.filter(c => c.status === 'EXPIRED').length;
      const missingCount = evaluatedChecklist.filter(c => c.status === 'MISSING' && c.mandatory).length;

      const readinessPct = Math.round((validCount / mandatoryRequirements.length) * 100);
      const isSubmissionReady = expiredCount === 0 && missingCount === 0;

      res.json({
        tender_id: id,
        tender_name: tender.name,
        readiness_pct: readinessPct,
        is_submission_ready: isSubmissionReady,
        recommendation: isSubmissionReady 
          ? 'CLEARED FOR SUBMISSION: All statutory bidding credentials are active and compliant.'
          : 'SUBMISSION RISK DETECTED: Renew expired or missing mandatory documents before final bid envelope lock.',
        expired_count: expiredCount,
        missing_count: missingCount,
        checklist: evaluatedChecklist
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // -------------------------------------------------------------
  // 13. AUTOMATED NIGHTLY CLOUD BACKUP & SNAPSHOT MANAGER
  // -------------------------------------------------------------

  app.post('/api/system/backup/create', async (req, res) => {
    try {
      const database = db();
      const { backup_type = 'Manual' } = req.body;

      const backupsDir = path.join(__dirname, 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `akpali_snapshot_${timestamp}.sqlite`;
      const targetPath = path.join(backupsDir, filename);

      const dbSourcePath = path.join(__dirname, 'database.sqlite');
      if (fs.existsSync(dbSourcePath)) {
        fs.copyFileSync(dbSourcePath, targetPath);
      }

      const stats = fs.statSync(targetPath);
      const backupId = `BKP-${Date.now().toString().slice(-6)}`;

      // Count total records in database
      const tendersCount = await database.get('SELECT COUNT(*) as c FROM tenders');
      const posCount = await database.get('SELECT COUNT(*) as c FROM purchase_orders');
      const invCount = await database.get('SELECT COUNT(*) as c FROM client_invoices');
      const totalRecords = (tendersCount?.c || 0) + (posCount?.c || 0) + (invCount?.c || 0);

      await database.run(
        `INSERT INTO system_backups (id, filename, filepath, size_bytes, backup_type, records_count, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Completed')`,
        [backupId, filename, targetPath, stats.size, backup_type, totalRecords]
      );

      await logAudit(req, {
        action: 'Create System Backup',
        entity_type: 'system_backups',
        entity_id: backupId,
        details: `Created database snapshot ${filename} (${Math.round(stats.size / 1024)} KB)`
      });

      res.status(201).json({
        id: backupId,
        filename,
        size_bytes: stats.size,
        size_kb: Math.round(stats.size / 1024),
        backup_type,
        records_count: totalRecords,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/system/backups', async (req, res) => {
    try {
      const database = db();
      const backups = await database.all('SELECT * FROM system_backups ORDER BY created_at DESC');
      res.json(backups);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/system/backup/download/:filename', (req, res) => {
    try {
      const { filename } = req.params;
      const safeFilename = path.basename(filename);
      const filepath = path.join(__dirname, 'backups', safeFilename);

      if (!fs.existsSync(filepath)) {
        return res.status(404).send('Backup archive not found');
      }

      res.download(filepath, safeFilename);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.post('/api/system/backup/restore', async (req, res) => {
    try {
      const database = db();
      const { backup_id } = req.body;
      const backup = await database.get('SELECT * FROM system_backups WHERE id = ?', [backup_id]);
      if (!backup) return res.status(404).json({ error: 'Backup not found' });

      if (!fs.existsSync(backup.filepath)) {
        return res.status(404).json({ error: 'Backup physical file missing on disk' });
      }

      // Safety pre-restore snapshot
      const safetyFile = `safety_pre_restore_${Date.now()}.sqlite`;
      const dbSourcePath = path.join(__dirname, 'database.sqlite');
      fs.copyFileSync(dbSourcePath, path.join(__dirname, 'backups', safetyFile));

      // Restore target file
      fs.copyFileSync(backup.filepath, dbSourcePath);

      await logAudit(req, {
        action: 'Restore Database Snapshot',
        entity_type: 'system_backups',
        entity_id: backup_id,
        details: `Restored database from snapshot ${backup.filename}`
      });

      res.json({
        success: true,
        message: `Database successfully restored from snapshot ${backup.filename}. Safety checkpoint created.`
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Automated Nightly Cloud Backup Trigger (Runs every midnight at 02:00 AM EAT)
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 2 && now.getMinutes() === 0) {
      console.log('🌙 Executing Automated Nightly System Snapshot (02:00 AM EAT)...');
      try {
        const backupsDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

        const filename = `akpali_nightly_${new Date().toISOString().split('T')[0]}.sqlite`;
        const targetPath = path.join(backupsDir, filename);
        const dbSourcePath = path.join(__dirname, 'database.sqlite');

        if (fs.existsSync(dbSourcePath)) {
          fs.copyFileSync(dbSourcePath, targetPath);
          const stats = fs.statSync(targetPath);
          const database = db();
          if (database) {
            await database.run(
              `INSERT INTO system_backups (id, filename, filepath, size_bytes, backup_type, status)
               VALUES (?, ?, ?, ?, 'Scheduled_Nightly', 'Completed')`,
              [`BKP-NIGHTLY-${Date.now().toString().slice(-6)}`, filename, targetPath, stats.size]
            );
          }
        }
      } catch (e) {
        console.error('Nightly Backup Error:', e.message);
      }
    }
  }, 60000);
}

module.exports = { registerEnterpriseRoutes };
