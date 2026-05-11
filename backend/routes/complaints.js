const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseService');
const { classifyComplaint, checkDuplicateWithAI, analyzeAndCheckDuplicate } = require('../services/aiService');
const { notifyCitizen } = require('../services/notificationService');
const { uploadBase64 } = require('../services/cloudinaryService');

// Create a new complaint
router.post('/', async (req, res) => {
  try {
    const { title, description, citizen_id, citizen_name, ward, location, address, is_emergency, media_url, status, category } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    let finalMediaUrl = null;
    if (media_url) {
      if (media_url.startsWith('data:')) {
        console.log('📦 [MEDIA] Uploading base64 payload to Cloudinary...');
        try {
          const uploadedUrl = await uploadBase64(media_url);
          if (uploadedUrl) {
            finalMediaUrl = uploadedUrl;
            console.log('✅ [MEDIA] Cloudinary Upload Success:', finalMediaUrl);
          } else {
            console.warn('⚠️ [MEDIA] Cloudinary upload failed, but continuing without image to prevent DB overflow.');
          }
        } catch (uploadErr) {
          console.error('❌ [MEDIA] Cloudinary Error:', uploadErr.message);
        }
      } else {
        finalMediaUrl = media_url;
      }
    }

    // 1. Fetch recent complaints from the last 24 hours
    const { data: recentIssues, error: searchError } = await supabase
      .from('complaints')
      .select('id, title, description, category, address')
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // 2. Use AI to classify the complaint
    // We removed the duplicate check to allow citizens to report the same issue multiple times
    const aiResult = await analyzeAndCheckDuplicate({ description, address }, []);


    // 3. Save to Supabase (Robust Insert)
    let insertPayload = {
      title: title || aiResult.title || (description.split(' ').slice(0, 3).join(' ') + (description.split(' ').length > 3 ? '...' : '')),
      description,
      category: category || aiResult.category,
      priority: is_emergency ? 'High' : aiResult.priority,
      department: aiResult.department,
      status: status || 'Pending',
      citizen_id: citizen_id || 'anonymous',
      location: location || null,
      address: address || null,
      ward: ward || aiResult.ward || null,
      is_emergency: is_emergency || false,
      media_url: finalMediaUrl || null
    };

    // Add citizen_name only if provided
    if (citizen_name) {
      insertPayload.citizen_name = citizen_name;
    }

    let { data, error } = await supabase
      .from('complaints')
      .insert([insertPayload])
      .select();

    if (error) {
      console.warn('⚠️ [DB] Insert failed:', error.message);
      
      // Automatic Fallback: Identify missing column from various error formats
      const pgRegex = /column "(.+)" does not exist/;
      const restRegex = /Could not find the '(.+)' column/;
      
      const missingColumnMatch = error.message.match(pgRegex) || error.message.match(restRegex);
      
      if (missingColumnMatch) {
        const missingCol = missingColumnMatch[1];
        console.log(`🧹 Auto-healing: Removing missing column "${missingCol}" and retrying...`);
        
        // Append missing data to description so it's not lost
        if (insertPayload[missingCol]) {
            insertPayload.description = `[${missingCol}: ${insertPayload[missingCol]}]\n${insertPayload.description}`;
        }
        delete insertPayload[missingCol];
        
        const retry = await supabase
          .from('complaints')
          .insert([insertPayload])
          .select();
        
        data = retry.data;
        error = retry.error;
        
        // Recursive check in case multiple columns are missing
        if (error && (error.message.includes('does not exist') || error.message.includes('schema cache'))) {
            const missingCol2Match = error.message.match(pgRegex) || error.message.match(restRegex);
            if (missingCol2Match) {
                const missingCol2 = missingCol2Match[1];
                console.log(`🧹 Auto-healing: Also removing "${missingCol2}"`);
                if (insertPayload[missingCol2]) {
                    insertPayload.description = `[${missingCol2}: ${insertPayload[missingCol2]}]\n${insertPayload.description}`;
                }
                delete insertPayload[missingCol2];
                const retry2 = await supabase.from('complaints').insert([insertPayload]).select();
                data = retry2.data;
                error = retry2.error;
            }
        }
      }
    }

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw error;
    }

    // console.log("=========================================");
    // console.log(`🚀 SUCCESS: Complaint stored in Supabase!`);
    // console.log(`ID: ${data[0].id}`);
    // console.log(`Category: ${aiResult.category}`);
    // console.log("=========================================");

    // 4. Handle Notifications (Multi-channel)
    if (data[0]) {
      const complaint = data[0];
      let recipientEmail = null;
      let recipientPhone = null;

      // Identify if citizen_id is an email or phone
      if (complaint.citizen_id && complaint.citizen_id !== 'anonymous') {
        const cid = complaint.citizen_id;
        if (cid.includes('@') && !cid.endsWith('@c.us') && !cid.endsWith('@lid')) {
          recipientEmail = cid;
        } else if (cid.includes('@c.us') || cid.includes('@lid') || /^\+?\d+$/.test(cid.split('@')[0])) {
          recipientPhone = cid;
        }
      }

      // Also allow system-wide notifications if configured
      const adminEmail = process.env.EMAIL_USER;
      const adminPhone = process.env.SYSTEM_PHONE_NUMBER || process.env.TWILIO_PHONE;

      // Standard multi-channel notification (Email, SMS, WhatsApp)
      const { notifyCitizen, sendVoiceAlert } = require('../services/notificationService');
      
      // Notify the citizen
      if (recipientEmail || recipientPhone) {
        notifyCitizen('update', recipientEmail, recipientPhone, complaint).catch(err => {
          console.error("Citizen notification error:", err.message);
        });
      }

      // Notify the admin/system if it's an emergency or as a log
      if (is_emergency && adminPhone) {
        const sosText = `Emergency alert from Smart Governance System. A citizen has triggered an S.O.S. at location ${location || address}. Immediate response required.`;
        sendVoiceAlert(adminPhone, sosText).catch(err => {
          console.error("Background voice alert error:", err.message);
        });
      }
    }

    res.status(201).json({ 
      message: 'Complaint submitted successfully', 
      complaint: data[0],
      ai_analysis: aiResult 
    });
  } catch (error) {
    console.error('DETAILED ERROR submitting complaint:', error);
    res.status(500).json({ error: 'Failed to submit complaint', details: error.message });
  }
});

// Get all complaints
router.get('/', async (req, res) => {
  try {
    // console.log('Fetching complaints from Supabase...');
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Query Error:', error);
      throw error;
    }
    
    // console.log(`Found ${data ? data.length : 0} complaints.`);
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Get single complaint by ID (Public Tracking)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let queryId = id.toLowerCase().replace('sg-', '').trim();

    let result = null;
    
    // 1. Try exact match
    if (queryId.length === 36) {
      const { data } = await supabase.from('complaints').select('*').eq('id', queryId).limit(1);
      if (data && data[0]) result = data[0];
    }

    // 2. Try prefix match using range (GTE/LTE)
    if (!result && queryId.length >= 4) {
      const pad = (char) => {
        let s = queryId + char.repeat(Math.max(0, 32 - queryId.length));
        return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20,32)}`;
      };
      
      const { data } = await supabase.from('complaints')
        .select('*')
        .gte('id', pad('0'))
        .lte('id', pad('f'))
        .limit(1);
      if (data && data[0]) result = data[0];
    }

    if (!result) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error tracking complaint:', error);
    res.status(404).json({ error: 'Complaint not found' });
  }
});

// Update complaint status (Official)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    // First check if the complaint is already resolved
    const { data: currentComplaint, error: fetchError } = await supabase
      .from('complaints')
      .select('status')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;

    if (currentComplaint && (currentComplaint.status === 'Resolved' || currentComplaint.status === 'Solved')) {
      return res.status(400).json({ 
        error: 'Final State Enforced', 
        message: 'This complaint is already resolved and its status cannot be modified further.' 
      });
    }

    const { data, error } = await supabase
      .from('complaints')
      .update({ status })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    if (data && data[0] && status && (status.toLowerCase() === 'solved' || status.toLowerCase() === 'resolved')) {
      const complaint = data[0];
      const citizenId = complaint.citizen_id;
      
      console.log(`🔔 Resolution detected for complaint ${complaint.id}. Citizen ID: ${citizenId}`);
      
      const { notifyCitizen } = require('../services/notificationService');

      if (citizenId && citizenId !== 'anonymous') {
        const cleanCitizenId = citizenId.split('@')[0];
        
        if (citizenId.includes('@') && !citizenId.endsWith('@c.us') && !citizenId.endsWith('@lid')) {
          // It's likely an email (has @ but not a WA suffix)
          console.log(`📧 Sending resolution email to ${citizenId}`);
          notifyCitizen('update', citizenId, null, complaint).catch(err => {
            console.error('❌ Failed to send resolution email notification:', err.message);
          });
        } else if (/^\+?\d+$/.test(cleanCitizenId)) {
          // It's a phone number (WA/SMS)
          // Pass the FULL citizenId because it might have @lid suffix needed for WA
          console.log(`💬 Sending resolution WhatsApp/SMS to ${citizenId}`);
          notifyCitizen('update', null, citizenId, complaint).catch(err => {
            console.error('❌ Failed to send resolution WhatsApp notification:', err.message);
          });
        } else {
          console.log(`⚠️ Citizen ID "${citizenId}" did not match email or phone pattern.`);
        }
      } else {
        console.log(`ℹ️ Skipping notification: Citizen ID is ${citizenId}`);
      }
    }

    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Escalate complaint
router.put('/:id/escalate', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .update({ priority: 'Urgent', status: 'Escalated' })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json({ message: 'Complaint escalated to higher authority', complaint: data[0] });
  } catch (error) {
    res.status(500).json({ error: 'Escalation failed' });
  }
});

module.exports = router;
