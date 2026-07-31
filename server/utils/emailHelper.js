const nodemailer = require('nodemailer');

/**
 * Creates a configured nodemailer transporter
 */
function createTransporter(settings) {
  const host = settings.smtp_host || process.env.SMTP_HOST;
  const port = parseInt(settings.smtp_port || process.env.SMTP_PORT) || 587;
  const user = (settings.smtp_user || process.env.SMTP_USER || '').trim();
  const pass = (settings.smtp_pass || process.env.SMTP_PASS || '').trim();
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: isSecure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

/**
 * Tests SMTP credentials connection
 */
async function testSMTP(settings) {
  try {
    const smtpConfig = {
      smtp_host: settings.smtp_host || process.env.SMTP_HOST,
      smtp_port: settings.smtp_port || process.env.SMTP_PORT || '587',
      smtp_user: settings.smtp_user || process.env.SMTP_USER,
      smtp_pass: settings.smtp_pass || process.env.SMTP_PASS,
    };

    if (!smtpConfig.smtp_host || !smtpConfig.smtp_user || !smtpConfig.smtp_pass) {
      return { success: false, error: 'SMTP Host, User, and Password are all required.' };
    }
    const transporter = createTransporter(smtpConfig);
    await transporter.verify();
    return { success: true, message: 'SMTP Server Connection Verified Successfully!' };
  } catch (error) {
    console.error('❌ Test SMTP Error:', error);
    return { success: false, error: error.message || 'SMTP Authentication failed' };
  }
}

/**
 * Sends an email using SMTP settings from database or .env file.
 */
async function sendEmail(db, to, subject, text) {
  try {
    const settings = await db.get('SELECT * FROM system_settings WHERE id = 1') || {};
    
    const smtpConfig = {
      smtp_host: settings.smtp_host || process.env.SMTP_HOST,
      smtp_port: settings.smtp_port || process.env.SMTP_PORT || '587',
      smtp_user: settings.smtp_user || process.env.SMTP_USER,
      smtp_pass: settings.smtp_pass || process.env.SMTP_PASS,
    };

    if (!smtpConfig.smtp_host || !smtpConfig.smtp_user || !smtpConfig.smtp_pass) {
      console.warn('⚠️ SMTP settings not fully configured in DB or .env file. Email skipped.');
      return false;
    }

    const transporter = createTransporter(smtpConfig);

    const info = await transporter.sendMail({
      from: `"Akpali System" <${smtpConfig.smtp_user.trim()}>`,
      to,
      subject,
      text,
    });

    console.log('✅ Email sent successfully to %s: %s', to, info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message || error);
    return false;
  }
}

module.exports = { sendEmail, testSMTP };
