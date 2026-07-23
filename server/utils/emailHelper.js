const nodemailer = require('nodemailer');

/**
 * Sends an email using SMTP settings from the database.
 * @param {object} db - Database connection
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email plain text body
 */
async function sendEmail(db, to, subject, text) {
  try {
    const settings = await db.get('SELECT * FROM system_settings WHERE id = 1');
    if (!settings || !settings.smtp_host || !settings.smtp_user) {
      console.warn('⚠️ SMTP settings not configured. Email skipped.');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: parseInt(settings.smtp_port) || 587,
      secure: parseInt(settings.smtp_port) === 465, // true for 465, false for other ports
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Akpali System" <${settings.smtp_user}>`,
      to,
      subject,
      text,
    });

    console.log('✅ Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

module.exports = { sendEmail };
