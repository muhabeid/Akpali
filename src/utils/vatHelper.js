// VAT (Value Added Tax) Categories and Auto-Calculation Helper
// Compliant with Kenya VAT Act 2013 and statutory tax categories

export const VAT_RATES = [
  {
    id: '16',
    code: 'STANDARD_16',
    label: 'Standard Rate (16%)',
    shortLabel: '16%',
    rate: 0.16,
    description: 'Applies to general taxable goods, services, and taxable imports'
  },
  {
    id: '8',
    code: 'REDUCED_8',
    label: 'Reduced Rate (8%)',
    shortLabel: '8%',
    rate: 0.08,
    description: 'Applies specifically to petroleum and petroleum products (motor spirit, diesel, kerosene)'
  },
  {
    id: '0',
    code: 'ZERO_RATED',
    label: 'Zero-Rated Supplies (0%)',
    shortLabel: '0%',
    rate: 0.00,
    description: 'Taxable at 0% (exports, international transport, designated agricultural/industrial inputs)'
  },
  {
    id: 'EXEMPT',
    code: 'EXEMPT',
    label: 'Exempt Supplies (No VAT)',
    shortLabel: 'Exempt',
    rate: 0.00,
    description: 'Not subject to VAT (unprocessed foods, certain medical/pharma, financial & education)'
  }
];

/**
 * Returns the numeric multiplier for a given VAT rate identifier
 */
export function getVatMultiplier(rateId) {
  if (rateId === '8' || rateId === 8 || rateId === '0.08') return 0.08;
  if (rateId === '0' || rateId === 0 || rateId === 'ZERO' || rateId === 'EXEMPT') return 0.00;
  return 0.16; // Default to Standard 16%
}

/**
 * Calculates a single line item's subtotal and VAT
 */
export function calculateLineVat(qty, unitPrice, rateId = '16') {
  const q = Math.max(0, Number(qty) || 0);
  const p = Math.max(0, Number(unitPrice) || 0);
  const lineSubtotal = q * p;
  const multiplier = getVatMultiplier(rateId);
  const lineVat = lineSubtotal * multiplier;
  return {
    lineSubtotal,
    lineVat,
    lineTotal: lineSubtotal + lineVat,
    ratePercent: multiplier * 100
  };
}

/**
 * Computes complete document VAT breakdown across all items
 */
export function calculateDocumentVatSummary(items = [], globalVatEnabled = true) {
  let netSubtotal = 0; // Excl. VAT
  let vat16Base = 0;
  let vat16Amount = 0;
  let vat8Base = 0;
  let vat8Amount = 0;
  let zeroRatedBase = 0;
  let exemptBase = 0;

  items.forEach(item => {
    const q = Math.max(0, Number(item.qty || item.quantity || 1));
    const p = Math.max(0, Number(item.unitPrice || item.price || item.unit_price || 0));
    const lineSub = q * p;
    netSubtotal += lineSub;

    if (!globalVatEnabled) {
      exemptBase += lineSub;
      return;
    }

    const rateId = String(item.vat_rate !== undefined ? item.vat_rate : '16');
    if (rateId === '16' || rateId === '0.16') {
      vat16Base += lineSub;
      vat16Amount += lineSub * 0.16;
    } else if (rateId === '8' || rateId === '0.08') {
      vat8Base += lineSub;
      vat8Amount += lineSub * 0.08;
    } else if (rateId === '0' || rateId === 'ZERO') {
      zeroRatedBase += lineSub;
    } else if (rateId === 'EXEMPT') {
      exemptBase += lineSub;
    } else {
      // Default fallback
      vat16Base += lineSub;
      vat16Amount += lineSub * 0.16;
    }
  });

  const totalVat = vat16Amount + vat8Amount;
  const grandTotal = netSubtotal + totalVat;

  return {
    netSubtotal,      // Total before VAT
    vat16Base,        // Taxable 16% base
    vat16Amount,      // VAT @ 16%
    vat8Base,         // Taxable 8% base
    vat8Amount,       // VAT @ 8%
    zeroRatedBase,    // Zero-rated 0%
    exemptBase,       // Exempt 0%
    totalVat,         // Combined VAT payable
    grandTotal        // Net + Total VAT
  };
}
