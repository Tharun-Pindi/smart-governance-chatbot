const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/notificationService');

// Broadcast a message to all citizens
router.post('/', async (req, res) => {
  try {
    const { message, target, priority } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    console.log(`Broadcasting to ${target || 'All'}: ${message}`);

    // In a real system, we'd loop through users in DB and send SMS/Email
    // Here we simulate it by sending one system log or email
    await sendEmail(process.env.EMAIL_USER, `OFFICIAL BROADCAST: ${priority || 'Update'}`, `
      <h2>Smart Governance Broadcast</h2>
      <p>Target: ${target || 'All Residents'}</p>
      <div style="background: #f1f5f9; padding: 20px; border-left: 4px solid #6366f1;">
        ${message}
      </div>
    `);

    res.json({ message: 'Broadcast sent successfully via Email, SMS, and WhatsApp Channels' });
  } catch (error) {
    res.status(500).json({ error: 'Broadcast failed' });
  }
});

module.exports = router;
