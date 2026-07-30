export const printElement = async (selector = '.dossier-container', docType = 'GLOBAL') => {
  try {
    const [tplRes, coRes] = await Promise.all([
      fetch('http://localhost:5000/api/templates'),
      fetch('http://localhost:5000/api/company')
    ]);
    const templateMap = await tplRes.json();
    const company = await coRes.json();

    const globalBrand = templateMap['GLOBAL'] || {};
    const moduleTpl = templateMap[docType] || {};

    // Robust Selector Resolution
    let cleanSelector = selector || '.dossier-container';
    if (!cleanSelector.startsWith('.') && !cleanSelector.startsWith('#')) {
      cleanSelector = `.${cleanSelector}`;
    }

    let element = document.querySelector(cleanSelector);
    if (!element) {
      element = document.querySelector('.dossier-container') || document.querySelector('.print-only');
    }

    if (!element) {
      alert('Could not find document element to print.');
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    const primaryColor = globalBrand.primary_color || '#0f172a';
    
    const logoHtml = globalBrand.header_logo_url 
      ? `<div style="margin-bottom: 0.5rem;"><img src="${globalBrand.header_logo_url}" alt="Logo" style="max-height: 80px;" /></div>`
      : '';

    const companyInfoHtml = `
      <div style="font-size: 0.875rem; color: #555; line-height: 1.4;">
        ${company.legal_name ? `<div style="color: ${primaryColor}; font-size: ${globalBrand.header_logo_url ? '1.25rem' : '1.75rem'}; font-weight: bold; margin-bottom: 0.25rem;">${company.legal_name}</div>` : ''}
        ${company.address ? `${company.address.replace(/\\n/g, '<br/>')}<br/>` : ''}
        ${company.email ? `Email: ${company.email}` : ''}
        ${company.email && company.phone_number ? ' | ' : ''}
        ${company.phone_number ? `Phone: ${company.phone_number}` : ''}
      </div>
    `;

    const moduleHeaderHtml = moduleTpl.header_text
      ? `<div style="font-size: 1.5rem; font-weight: bold; color: ${primaryColor}; text-transform: uppercase; margin-top: 1.5rem;">${moduleTpl.header_text}</div>`
      : '';

    const headerHtml = `<div style="text-align: center; margin-bottom: 2rem; border-bottom: 3px solid ${primaryColor}; padding-bottom: 1.5rem;">
      ${logoHtml}
      ${companyInfoHtml}
      ${moduleHeaderHtml}
    </div>`;

    const termsHtml = moduleTpl.terms_conditions_text 
      ? `<div style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 0.8rem; color: #555;"><strong>Terms & Conditions:</strong><br/>${moduleTpl.terms_conditions_text.replace(/\\n/g, '<br/>')}</div>`
      : '';

    const footerHtml = moduleTpl.footer_text 
      ? `<div style="position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 0.75rem; color: #777; padding: 1rem 0; background: white;">${moduleTpl.footer_text}</div>`
      : '';
      
    const isDossier = cleanSelector.includes('dossier') || element.classList.contains('dossier-container');
    const hasEmbeddedHeader = element.innerHTML.includes('Company Logo') || element.innerHTML.includes('AKPALI') || element.querySelector('img') !== null;
    
    const bodyContent = (isDossier || hasEmbeddedHeader) 
      ? `
          <div class="print-only">
            ${element.innerHTML}
          </div>
          ${footerHtml}
        `
      : `
          <div class="print-only">
            ${headerHtml}
            ${element.innerHTML}
            ${termsHtml}
          </div>
          ${footerHtml}
        `;

    // Open Printable Preview Window
    const printWin = window.open('', '_blank', 'width=1100,height=900,scrollbars=yes,resizable=yes');
    
    if (!printWin) {
      // Fallback if popup blocked
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(`<html><head>${styles}</head><body>${bodyContent}</body></html>`);
      iframe.contentWindow.document.close();
      iframe.contentWindow.focus();
      setTimeout(() => {
        iframe.contentWindow.print();
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 500);
      return;
    }

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${isDossier ? 'Corporate Profile Dossier Print Preview' : 'Document Print Preview'}</title>
          ${styles}
          <style>
            body { 
              background: #e2e8f0 !important; 
              padding: 1.5rem !important; 
              margin: 0 !important;
              color: #000;
              font-family: Inter, system-ui, sans-serif;
            }
            :root {
              --primary: ${primaryColor};
            }
            .no-print-toolbar {
              position: sticky;
              top: 0;
              z-index: 99999;
              background: #0f172a;
              color: #fff;
              padding: 0.85rem 1.5rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
              box-shadow: 0 4px 15px rgba(0,0,0,0.2);
              margin-bottom: 1.5rem;
              border-radius: 8px;
            }
            .dossier-container, .print-only {
              background: #ffffff !important;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
              padding: 2.5rem !important;
              max-width: 900px !important;
              margin: 0 auto !important;
              border-radius: 8px !important;
            }
            .page-break {
              page-break-before: always !important;
              margin: 2rem 0 !important;
            }
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print-toolbar { display: none !important; }
              body { background: white !important; padding: 0 !important; margin: 0 !important; }
              .dossier-container, .print-only { 
                box-shadow: none !important; 
                padding: 0 !important; 
                margin: 0 !important; 
                width: 100% !important;
                max-width: 100% !important;
              }
              .page-break { page-break-before: always !important; }
              @page {
                size: A4;
                margin: 15mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print-toolbar">
            <div style="font-weight: 700; font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem;">
              📄 ${isDossier ? 'Corporate Profile Dossier Print Preview' : 'Document Print Preview'}
            </div>
            <div style="display: flex; gap: 1rem;">
              <button onclick="window.print()" style="background: #16a34a; color: #fff; border: none; padding: 0.5rem 1.25rem; font-weight: 700; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                🖨️ Print / Save as PDF
              </button>
              <button onclick="window.close()" style="background: #475569; color: #fff; border: none; padding: 0.5rem 1rem; font-weight: 600; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                ✕ Close Preview
              </button>
            </div>
          </div>

          <div style="display: flex; justify-content: center;">
            ${bodyContent}
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
  } catch (err) {
    console.error('Print engine error:', err);
    window.print();
  }
};
