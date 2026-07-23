export const printElement = async (selector = '.print-only', docType = 'GLOBAL') => {
  try {
    const [tplRes, coRes] = await Promise.all([
      fetch('http://localhost:5000/api/templates'),
      fetch('http://localhost:5000/api/company')
    ]);
    const templateMap = await tplRes.json();
    const company = await coRes.json();

    const globalBrand = templateMap['GLOBAL'] || {};
    const moduleTpl = templateMap[docType] || {};

    setTimeout(() => {
      const element = document.querySelector(selector);
      if (!element) {
        window.print();
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      
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
        
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Document</title>
            ${styles}
            <style>
              body { 
                background: white !important; 
                padding: 0 !important; 
                margin: 0 !important;
                color: #000;
              }
              /* Inject primary brand color variables into root for print elements to inherit */
              :root {
                --primary: ${primaryColor};
              }
              .print-only { 
                position: static !important; 
                left: auto !important; 
                top: auto !important; 
                width: 100% !important; 
                height: auto !important;
                margin: 0 !important; 
                padding: 2rem 2rem 5rem 2rem !important; /* extra bottom padding for footer */
              }
              @media print {
                .print-only { position: static !important; }
                body * { visibility: visible !important; }
              }
            </style>
          </head>
          <body>
            <div class="print-only">
              ${headerHtml}
              ${element.innerHTML}
              ${termsHtml}
            </div>
            ${footerHtml}
          </body>
        </html>
      `);
      iframe.contentWindow.document.close();
      
      iframe.contentWindow.focus();
      setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 500);
    }, 100);
  } catch (err) {
    console.error('Print engine error:', err);
    window.print();
  }
};
