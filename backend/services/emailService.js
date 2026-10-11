const nodemailer = require('nodemailer');

/**
 * Helper to check if an email is a fake/demo test address
 */
const isDummyEmail = (email) => {
  if (!email) return true;
  const lower = email.toLowerCase().trim();
  const dummyDomains = ['example.com', 'test.com', 'fake.com', 'agency.gov', 'demo.com'];
  const domain = lower.split('@')[1];
  if (dummyDomains.includes(domain)) return true;
  if (lower.startsWith('kai@') || lower.startsWith('test') || lower.startsWith('fake')) return true;
  return false;
};

/**
 * Send OTP Verification Email
 * @param {string} toEmail - Recipient email
 * @param {string} otpCode - 6 digit OTP
 * @param {string} type - 'forgot' or 'verify'
 */
const sendOtpEmail = async (toEmail, otpCode, type = 'verify') => {
  // ⚡ ALWAYS LOG OTP FIRST TO TERMINAL SO YOU ARE NEVER BLOCKED
  console.log(`\n======================================================`);
  console.log(`✉️ OTP REQUESTED FOR: ${toEmail}`);
  console.log(`🔑 VERIFICATION CODE (OTP): ${otpCode}`);
  console.log(`======================================================\n`);

  try {
    let transporter;

    // 1. Try configured SMTP credentials
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const isGmail = process.env.EMAIL_USER.toLowerCase().includes('@gmail.com');
        transporter = nodemailer.createTransport(
          isGmail
            ? {
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
              }
            : {
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT || '587', 10),
                secure: process.env.EMAIL_PORT === '465',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
              }
        );
      } catch (tErr) {
        console.warn('⚠️ SMTP Transporter creation error:', tErr.message);
      }
    }

    // 2. Fallback to Ethereal sandbox if SMTP not configured or fails
    if (!transporter) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
      } catch (ethErr) {
        console.warn('⚠️ Ethereal account creation failed. Terminal fallback active.');
        return true;
      }
    }

    const isReset = type === 'forgot';
    const subject = isReset
      ? '🔒 CivicEvidence - Password Reset Verification Code'
      : '🛡️ CivicEvidence - Account Email Verification Code';

    const actionText = isReset
      ? 'A password reset request was initiated for your CivicEvidence account.'
      : 'Thank you for registering with the CivicEvidence Digital Evidence Management System.';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; }
          .brand { font-size: 22px; font-weight: 800; color: #3b82f6; letter-spacing: 1px; }
          .sub { color: #94a3b8; font-size: 13px; margin-top: 4px; }
          .body-content { font-size: 15px; line-height: 1.6; color: #cbd5e1; }
          .otp-box { background: #0f172a; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 28px 0; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #60a5fa; font-family: monospace; }
          .warning { font-size: 13px; color: #f59e0b; background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 12px; margin-top: 20px; border-radius: 4px; }
          .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #334155; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">🛡️ CIVICEVIDENCE DEMS</div>
            <div class="sub">Digital Evidence Management & Chain of Custody System</div>
          </div>
          <div class="body-content">
            <p>Hello,</p>
            <p>${actionText}</p>
            <p>Use the following secure 6-digit verification code to complete your request:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otpCode}</div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Valid for 10 minutes</div>
            </div>

            <div class="warning">
              ⚠️ <strong>Security Notice:</strong> Never share this code with anyone. CivicEvidence personnel will never ask for your verification code or password.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} CivicEvidence Digital Forensics System. All rights reserved.<br/>
            This is an automated system notification. Please do not reply directly to this email.
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"CivicEvidence Security" <no-reply@civicevidence.gov>',
      to: toEmail,
      subject: subject,
      text: `${subject}\n\n${actionText}\n\nYour 6-Digit Verification Code is: ${otpCode}\n\nThis code expires in 10 minutes.`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    if (info && info.messageId) {
      console.log(`✔ Mail Sent (MessageID: ${info.messageId})`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Ethereal Sandbox Link: ${previewUrl}`);
      }
    }
    return true;
  } catch (error) {
    console.warn('⚠️ SMTP Delivery Notice:', error.message);
    return true;
  }
};

module.exports = {
  sendOtpEmail,
  isDummyEmail,
};
