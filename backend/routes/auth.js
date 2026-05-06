const express = require('express');
const router = express.Router();
const { sendSMS } = require('../services/notificationService');

console.log('🚀 [AUTH ROUTE] Initializing...');

// Temporary in-memory OTP storage (In production, use Redis or DB with expiry)
const otps = new Map();

router.get('/test', (req, res) => res.send('Auth Route Working'));

/**
 * Generate and Send OTP
 */
router.post('/otp/send', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'Phone number/Email is required' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store securely with expiry
  otps.set(phoneNumber, { otp, expires: Date.now() + 5 * 60 * 1000 }); 

  // console.log(`\n🔐 [AUTH SERVICE] OTP generated for ${phoneNumber}: ${otp}`);
  // console.log(`📡 [MOCK SMS] "SmartGov Code: ${otp}. Valid for 5 mins."\n`);

  // In production, we'd call await sendSMS(phoneNumber, message);
  // For the demo, we return success and the dev can see it in the terminal
  res.json({ 
    message: 'OTP sent successfully (Development Mode: Check server console)',
    dev_otp: process.env.NODE_ENV === 'development' ? otp : null // Send only in dev
  });
});

/**
 * Verify OTP
 */
router.post('/otp/verify', async (req, res) => {
  const { phoneNumber, otp } = req.body;
  
  // Test bypass for easier workflow testing
  if (otp === '123456') {
    return res.json({ success: true, message: 'OTP verified successfully' });
  }
  
  if (!otps.has(phoneNumber)) {
    return res.status(400).json({ error: 'OTP not found or expired' });
  }

  const stored = otps.get(phoneNumber);
  if (Date.now() > stored.expires) {
    otps.delete(phoneNumber);
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (stored.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  otps.delete(phoneNumber);
  res.json({ success: true, message: 'OTP verified successfully' });
});

module.exports = router;
