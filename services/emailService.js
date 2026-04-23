require("dotenv").config();
const nodemailer = require("nodemailer");

// Singleton transporter instance
let transporter = null;

/**
 * Initialize or get the existing transporter
 */
const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT);
  const secure = port === 465;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !port || !user || !pass) {
    console.error("❌ Email Configuration Error: Missing environment variables.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: port === 587 ? { rejectUnauthorized: false } : undefined,
    // Add pool configuration for high volume
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Email Transporter Verification Failed:", error.message);
    } else {
      console.log(`✅ Email Server Ready: ${host}:${port} (secure=${secure})`);
    }
  });

  return transporter;
};

/**
 * Send an email with optional attachments
 */
const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  const currentTransporter = getTransporter();
  
  if (!currentTransporter) {
    throw new Error("Email service not configured correctly.");
  }

  const mailOptions = {
    from: `"EngineersParcel" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
    attachments,
  };

  let lastError;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      console.log(`📨 Attempt ${attempt}/${maxRetries}: Sending email to ${to} | ${subject}`);
      
      const info = await currentTransporter.sendMail(mailOptions);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Email sent successfully on attempt ${attempt} in ${duration}ms | ID: ${info.messageId}`);
      return info;
    } catch (error) {
      lastError = error;
      console.error(`⚠️ Attempt ${attempt} failed for ${to}:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s
        const delay = attempt * 2000;
        console.log(`   Retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

module.exports = { sendEmail };
