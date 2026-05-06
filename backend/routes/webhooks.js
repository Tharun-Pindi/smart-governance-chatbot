const express = require('express');
const router = express.Router();
const { sendWhatsApp } = require('../services/notificationService');
const supabase = require('../services/supabaseService');

/**
 * WhatsApp Webhook for Twilio
 * Citizen sends "STATUS <COMPLAINT_ID>" or "స్థితి <COMPLAINT_ID>" to check status
 */
router.post('/whatsapp', async (req, res) => {
  const incomingMsg = req.body.Body || '';
  const from = req.body.From.replace('whatsapp:', '');
  
  console.log(`[WhatsApp Bot] Message from ${from}: ${incomingMsg}`);

  let reply = '';
  const parts = incomingMsg.trim().split(/\s+/);
  const command = parts[0] ? parts[0].toUpperCase() : '';

  if ((command === 'STATUS' || command === 'స్థితి') && parts[1]) {
    const complaintId = parts[1];
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('title, status, department')
        .eq('id', complaintId)
        .single();

      if (data) {
        reply = `📄 SmartGov Report Found / స్మార్ట్ గవర్నెన్స్ రిపోర్ట్:\n\nTitle / శీర్షిక: ${data.title}\nStatus / స్థితి: ${data.status}\nDept / విభాగం: ${data.department}\n\nThank you for your patience / మీ సహనానికి ధన్యవాదాలు.`;
      } else {
        reply = `❌ Sorry, we couldn't find a report with ID: ${complaintId}. Please check the ID and try again.\nక్షమించండి, ఈ ID తో ఎలాంటి రిపోర్ట్ కనుగొనబడలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.`;
      }
    } catch (e) {
      reply = "❌ An error occurred while fetching the status. Please try again later.\nస్థితిని పొందుటలో లోపం ఏర్పడింది. దయచేసి తర్వాత మళ్ళీ ప్రయత్నించండి.";
    }
  } else {
    reply = "👋 Welcome to SmartGov WhatsApp Bot! / స్మార్ట్ గవర్నెన్స్ వాట్సాప్ బాట్‌కు స్వాగతం!\n\nTo check your report status, reply with:\nమీ రిపోర్ట్ స్థితిని తెలుసుకోవడానికి ఇలా రిప్లై ఇవ్వండి:\n\nSTATUS <YOUR_ID>\nలేదా (or)\nస్థితి <YOUR_ID>";
  }

  await sendWhatsApp(from, reply);
  res.status(200).send('OK');
});

module.exports = router;
