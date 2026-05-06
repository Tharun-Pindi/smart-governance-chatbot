const express = require('express');
const router = express.Router();
const { classifyComplaint } = require('../services/aiService');

router.post('/classify', async (req, res) => {
  const { description } = req.body;
  
  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  const result = await classifyComplaint(description);
  res.json(result);
});

module.exports = router;
