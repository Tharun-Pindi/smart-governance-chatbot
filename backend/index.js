const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check (Logging disabled to prevent terminal scrolling)

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Smart Governance System API is running' });
});

// Routes
const { sendSMS, sendEmail } = require('./services/notificationService');
const otps = new Map();

app.post('/api/auth/otp/send', async (req, res) => {
  let { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'Phone number/Email is required' });
  
  phoneNumber = phoneNumber.trim().toLowerCase(); // Normalize
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps.set(phoneNumber, { otp, expires: Date.now() + 5 * 60 * 1000 });
  
  // console.log(`🔐 [AUTH] OTP for ${phoneNumber}: ${otp}`);

  try {
    try {
      if (phoneNumber.includes('@')) {
        const subject = "SmartGov Verification Code";
        const html = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>SmartGov Verification</h2>
            <p>Your 6-digit verification code is: <strong style="font-size: 1.5rem; color: #4f46e5;">${otp}</strong></p>
            <p>This code is valid for 5 minutes. Do not share it with anyone.</p>
          </div>
        `;
        await sendEmail(phoneNumber, subject, html);
      } else {
        const message = `SmartGov Verification Code: ${otp}. Valid for 5 minutes.`;
        await sendSMS(phoneNumber, message);
      }

      res.json({ message: 'OTP sent successfully!' });
    } catch (err) {
      console.error('Notification Error:', err.message);
      res.status(500).json({ error: `Failed to deliver OTP: ${err.message}` });
    }
  } catch (error) {
    res.status(500).json({ error: `System Error: ${error.message}` });
  }
});

app.post('/api/auth/otp/verify', async (req, res) => {
  let { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) return res.status(400).json({ error: 'Missing data' });

  phoneNumber = phoneNumber.trim().toLowerCase();
  otp = otp.trim();

  // Test bypass for easier workflow testing
  if (otp === '123456') {
    return res.json({ success: true });
  }

  const stored = otps.get(phoneNumber);
  // console.log(`🧐 [AUTH] Verifying ${phoneNumber}: Input=${otp}, Stored=${stored?.otp}`);

  if (stored && stored.otp === otp && Date.now() < stored.expires) {
    otps.delete(phoneNumber);
    return res.json({ success: true });
  }
  res.status(400).json({ error: 'Invalid or expired OTP' });
});

app.use('/api/ai', require('./routes/ai'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/broadcast', require('./routes/broadcast'));
app.use('/api/webhooks', require('./routes/webhooks'));

app.get('/api/stats', async (req, res) => {
  try {
    const supabase = require('./services/supabaseService');
    const { data, error } = await supabase.from('complaints').select('status, priority, is_emergency');
    if (error) throw error;
    
    const stats = {
      total: data.length,
      pending: data.filter(c => c.status === 'Pending').length,
      inProgress: data.filter(c => c.status === 'In Progress').length,
      resolved: data.filter(c => c.status === 'Resolved').length,
      overdue: data.filter(c => c.priority === 'Urgent' && c.status !== 'Resolved').length
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Stats Error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
// Initialize free wwebjs WhatsApp Bot
const { initializeWhatsAppBot, getWhatsAppStatus, resetWhatsAppBot } = require('./services/whatsappService');

app.get('/api/whatsapp/status', (req, res) => {
  res.json(getWhatsAppStatus());
});

app.post('/api/whatsapp/reset', async (req, res) => {
  await resetWhatsAppBot();
  res.json({ message: 'WhatsApp session reset initiated' });
});

app.get('/api/whatsapp/qr', (req, res) => {
  const status = getWhatsAppStatus();
  if (status.ready) return res.send(`
    <html>
      <body style="font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; background:#f0f2f5;">
        <div style="background:white; padding:40px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); text-align:center;">
          <h1 style="color:#25d366;">✅ WhatsApp Connected!</h1>
          <p style="color:#667781;">The bot is live and ready to receive complaints.</p>
          <button onclick="window.close()" style="background:#25d366; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; margin-top:10px;">Close Window</button>
        </div>
      </body>
    </html>
  `);

  res.send(`
    <html>
      <head>
        <title>WhatsApp Login</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f0f2f5; margin: 0; }
          .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; min-width: 400px; border: 1px solid #e2e8f0; }
          .qr-container { margin: 25px 0; padding: 15px; background: white; border: 2px solid #f0f2f5; border-radius: 12px; display: inline-block; min-height: 256px; min-width: 256px; display: flex; align-items: center; justify-content: center; }
          h1 { color: #128c7e; margin-bottom: 10px; font-weight: 800; }
          p { color: #667781; max-width: 320px; line-height: 1.6; margin: 0 auto; font-size: 0.9rem; }
          .status { font-weight: 700; color: #128c7e; margin-top: 15px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
          .btn-reset { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; padding: 8px 16px; border-radius: 8px; cursor: pointer; margin-top: 25px; font-size: 0.75rem; font-weight: 600; transition: all 0.2s; }
          .btn-reset:hover { background: #fee2e2; }
          .loading-spinner { border: 4px solid #f3f3f3; border-top: 4px solid #128c7e; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .error-box { background: #fff1f2; color: #e11d48; padding: 10px; border-radius: 8px; margin-top: 15px; font-size: 0.75rem; font-weight: 500; border: 1px solid #fecdd3; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>SmartGov Connect</h1>
          <p id="msg">${status.qr ? 'Scan this code with WhatsApp to enable automated notifications and bot features.' : (status.error ? 'Initialization Error' : '⏳ Initializing WhatsApp secure connection... Please wait.')}</p>
          
          <div class="qr-container">
            ${status.qr 
              ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(status.qr)}" width="256" height="256" />`
              : `<div class="loading-spinner"></div>`
            }
          </div>
          
          <div class="status" id="status-text">${status.qr ? 'Waiting for scan...' : (status.error ? 'FAILED' : 'Initializing...')}</div>
          
          ${status.error ? `<div class="error-box">${status.error}</div>` : ''}
          
          <button class="btn-reset" onclick="resetSession()">Reset Session & Logout</button>
        </div>
        
        <script>
          async function resetSession() {
            if(confirm('This will log out the bot and clear all session data. Continue?')) {
              document.getElementById('status-text').innerText = 'RESETTING...';
              await fetch('/api/whatsapp/reset', { method: 'POST' });
              setTimeout(() => window.location.reload(), 2000);
            }
          }

          // Auto-refresh logic
          setInterval(async () => {
            try {
              const res = await fetch('/api/whatsapp/status');
              const data = await res.json();
              
              if (data.ready) {
                window.location.reload();
              }
              
              // If we didn't have a QR but now we do, reload to show it
              const hadQR = ${!!status.qr};
              if (data.qr && !hadQR) {
                window.location.reload();
              }
            } catch(e) {}
          }, 3000);
        </script>
      </body>
    </html>
  `);
});

try {
  initializeWhatsAppBot();
} catch (error) {
  console.error("Failed to initialize WhatsApp Bot:", error);
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
