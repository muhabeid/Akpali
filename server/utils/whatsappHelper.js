const https = require('https');

/**
 * Sends a WhatsApp message using Meta Cloud API settings from the database.
 * @param {object} db - Database connection
 * @param {string} toPhone - Recipient phone number (with country code, no +)
 * @param {string} message - Message text
 */
async function sendWhatsApp(db, toPhone, message) {
  try {
    const settings = await db.get('SELECT * FROM system_settings WHERE id = 1');
    if (!settings || !settings.wa_token || !settings.wa_phone_id) {
      console.warn('⚠️ WhatsApp settings not configured. Message skipped.');
      return false;
    }

    const data = JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'text',
      text: { body: message }
    });

    const options = {
      hostname: 'graph.facebook.com',
      path: `/v17.0/${settings.wa_phone_id}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.wa_token}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ WhatsApp message sent');
            resolve(true);
          } else {
            console.error('❌ Error from WhatsApp API:', responseBody);
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Error sending WhatsApp message:', error);
        resolve(false);
      });

      req.write(data);
      req.end();
    });
  } catch (error) {
    console.error('❌ Error in WhatsApp helper:', error);
    return false;
  }
}

module.exports = { sendWhatsApp };
