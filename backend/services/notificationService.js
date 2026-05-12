require('dotenv').config();
const nodemailer = require('nodemailer');
const twilio = require('twilio');

/**
 * Notification Service
 * Handles multi-channel communication: Email, SMS, WhatsApp, and Voice.
 */

// Twilio Client
const twilioClient = (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) 
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN) 
  : null;

// Email Transporter (Explicit Gmail Config)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Helps with some network/security blocks
  }
});

const sendEmail = async (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("❌ Email credentials missing in .env. Skipping email.");
    throw new Error("Email configuration missing");
  }

  const mailOptions = {
    from: `"SmartGov Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email notification sent to:', to);
    return true;
  } catch (error) {
    console.error("❌ Email Error:", error.message);
    throw error;
  }
};

const sendSMS = async (to, message) => {
  try {
    if (!twilioClient) {
      console.warn("Twilio credentials missing. SMS skipped.");
      return;
    }

    // Skip SMS for WhatsApp internal IDs (@c.us or @lid)
    if (to.includes('@')) {
      console.log('ℹ️ Skipping SMS for WhatsApp ID:', to);
      return;
    }

    // Basic cleaning for phone numbers
    const cleanNumber = to.replace(/\s/g, '');
    if (!/^\+?\d+$/.test(cleanNumber)) {
        console.warn('⚠️ Invalid phone number format for SMS:', cleanNumber);
        return;
    }

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: cleanNumber
    });
    console.log('✅ SMS alert sent to:', cleanNumber);
  } catch (error) {
    console.error("❌ SMS Error:", error.message);
  }
};

const sendWhatsApp = async (to, message) => {
  const { sendWhatsAppMessage } = require('./whatsappService');
  return sendWhatsAppMessage(to, message);
};

const sendVoiceAlert = async (to, text) => {
  try {
    if (!twilioClient) {
      console.warn("Twilio credentials missing. Voice call skipped.");
      return;
    }
    
    // Skip Voice for WhatsApp IDs
    if (to.includes('@')) return;

    await twilioClient.calls.create({
      twiml: `<Response><Say voice="alice">${text}</Say></Response>`,
      to: to,
      from: process.env.TWILIO_PHONE
    });
    console.log('🚨 Voice emergency call initiated to:', to);
  } catch (error) {
    console.error("❌ Voice Error:", error.message);
  }
};

const notifyCitizen = async (type, recipientEmail, recipientPhone, data) => {
  const message = `SmartGov Update: Your complaint regarding "${data.title}" is now "${data.status}". Dept: ${data.department || 'General'}.\n\nస్మార్ట్ గవర్నెన్స్ అప్‌డేట్: మీ ఫిర్యాదు "${data.title}" ఇప్పుడు "${data.status}" స్థితిలో ఉంది. విభాగం: ${data.department || 'సాధారణం'}.`;
  
  console.log(`📢 [NOTIFY] Recipient Email: ${recipientEmail || 'N/A'}, Phone/Chat: ${recipientPhone || 'N/A'}`);
  
  // Send notifications without blocking the main process
  if (recipientEmail) {
    sendEmail(recipientEmail, `Update: ${data.title}`, message).catch(e => console.error("❌ Email notify error:", e.message));
  }
  
  if (recipientPhone) {
    // If it's a WhatsApp ID or a phone number, try WhatsApp first
    sendWhatsApp(recipientPhone, message).catch(e => console.error("❌ WhatsApp notify error:", e.message));
    
    // Only try SMS if it's NOT a WhatsApp specific ID
    if (!recipientPhone.includes('@')) {
       sendSMS(recipientPhone, message).catch(e => console.error("❌ SMS notify error:", e.message));
    }
  }
};

const notifyCitizenEmail = async (recipientEmail, data) => {
  const subject = `Update: Complaint #${data.id ? data.id.substring(0,8) : 'N/A'} - ${data.status}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 600px;">
      <h2 style="color: #1e40af;">Smart Governance Portal</h2>
      <p>Hello,</p>
      <p>There is a new update regarding your governance report.</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #1e40af;">
        <p><strong>Title:</strong> ${data.title}</p>
        <p><strong>Description:</strong> ${data.description || 'N/A'}</p>
        <p><strong>Current Status:</strong> <span style="color: #2563eb; font-weight: bold;">${data.status}</span></p>
        <p><strong>Department:</strong> ${data.department || 'N/A'}</p>
        <p><strong>Priority:</strong> ${data.priority || 'N/A'}</p>
      </div>
      <p>You can track further details by logging into your dashboard with your ID.</p>
      <p style="font-size: 0.8rem; color: #64748b; margin-top: 30px;">This is an automated governance alert. Please do not reply to this email.</p>
    </div>
  `;
  await sendEmail(recipientEmail, subject, html);
};

module.exports = { 
  notifyCitizen, 
  sendEmail, 
  sendSMS, 
  sendWhatsApp, 
  sendVoiceAlert 
};
