const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseService');
const { classifyComplaint, checkDuplicateWithAI, analyzeAndCheckDuplicate } = require('../services/aiService');
const { notifyCitizen } = require('../services/notificationService');
const { uploadBase64 } = require('../services/cloudinaryService');
const { info, success, error: logError } = require('../services/logService');

// --- Helper: Generate Smart Readable ID ---
const generateSmartId = (data) => {
    const { address, ward, citizen_name, category } = data;
    
    // 1. City Prefix Mapping
    const cityMap = {
        'rajahmundry': 'RJY',
        'vizayawada': 'VJW',
        'vijayawada': 'VJW',
        'vizag': 'VZG',
        'visakhapatnam': 'VZG',
        'narsipatnam': 'NPT',
        'tuni': 'TNI',
        'annavaram': 'ANV',
        'hyderabad': 'HYD',
        'guntur': 'GNT',
        'kakinada': 'KKD',
        'nellore': 'NLR',
        'tirupati': 'TPT'
    };
    
    let cityPrefix = 'GEN';
    const locLower = (address || '').toLowerCase();
    for (const [city, prefix] of Object.entries(cityMap)) {
        if (locLower.includes(city)) {
            cityPrefix = prefix;
            break;
        }
    }
    
    // 2. Category Prefix (3 Letters)
    const catPrefix = (category || 'Other').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
    
    // 3. Ward Part (e.g. W12)
    const wardPart = ward ? `W${ward}` : 'WXX';
    
    // 4. Name Initials (2 Letters)
    const initials = (citizen_name || 'Anon')
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
        
    // 5. Random 4-digit Suffix
    const random = Math.floor(1000 + Math.random() * 9000);
    
    return `SG-${cityPrefix}-${catPrefix}-${wardPart}-${initials}-${random}`;
};

// Create a new complaint
router.post('/', async (req, res) => {
  try {
    const { title, description, citizen_id, citizen_name, ward, location, address, is_emergency, media_url, status, category } = req.body;

    // --- ENFORCE COMPLAINT QUOTA (Max 5 Active) ---
    if (citizen_id && citizen_id !== 'anonymous') {
      const { count, error: countError } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('citizen_id', citizen_id)
        .not('status', 'eq', 'Resolved')
        .not('status', 'eq', 'Solved');

      if (countError) {
        console.error('⚠️ [QUOTA] Error checking quota:', countError.message);
      } else if (count >= 5) {
        console.warn(`🚫 [QUOTA] User ${citizen_id} reached limit (${count} active)`);
        return res.status(400).json({ 
          error: 'Complaint Quota Reached', 
          message: 'You have reached the maximum limit of 5 active complaints. Please wait for an administrator to resolve your existing complaints.',
          telugu_message: 'మీరు 5 చురుకైన ఫిర్యాదుల గరిష్ట పరిమితిని చేరుకున్నారు. దయచేసి అడ్మినిస్ట్రేటర్ మీ ప్రస్తుత ఫిర్యాదులను పరిష్కరించే వరకు వేచి ఉండండి.'
        });
      }
    }

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    let finalMediaUrl = null;
    if (media_url) {
      if (media_url.startsWith('data:')) {
        info('📦 [MEDIA] Uploading base64 payload to Cloudinary...');
        try {
          const uploadedUrl = await uploadBase64(media_url);
          if (uploadedUrl) {
            finalMediaUrl = uploadedUrl;
            success('✅ [MEDIA] Cloudinary Upload Success: ' + finalMediaUrl);
          } else {
            warn('⚠️ [MEDIA] Cloudinary upload returned null, continuing without media.');
          }
        } catch (uploadErr) {
          logError('❌ [MEDIA] Cloudinary Error: ' + uploadErr.message);
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
    info('🧠 [AI] Analyzing complaint description for classification...');
    const aiResult = await analyzeAndCheckDuplicate({ description, address }, []);

    // 2.1 Early Keyword Detection (Failsafe for SOS/Urgent)
    const emergencyKeywords = ["urgent", "help", "sos", "emergency", "compulsary"];
    const hasEmergencyKeyword = emergencyKeywords.some(word => 
      description.toLowerCase().includes(word)
    );
    
    if (hasEmergencyKeyword) {
      aiResult.priority = "Urgent";
      info('🚨 [PRIORITY] Emergency keyword detected! Escalating to Urgent.');
    }


    // 2.2 Generate Smart Readable ID
    const smartId = generateSmartId({
        address,
        ward: ward || aiResult.ward,
        citizen_name: citizen_name || 'Citizen',
        category: category || aiResult.category
    });

    // 3. Save to Supabase (Robust Insert)
    const baseTitle = title || aiResult.title || (description.split(' ').slice(0, 3).join(' ') + (description.split(' ').length > 3 ? '...' : ''));
    
    let insertPayload = {
      tracking_id: smartId,
      title: `[${smartId}] ${baseTitle}`,
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

    info(`💾 [DB] Saving complaint ${smartId} to Supabase...`);
    let { data, error } = await supabase
      .from('complaints')
      .insert([insertPayload])
      .select();

    if (error) {
      warn('⚠️ [DB] Insert failed: ' + error.message);
      
      // Automatic Fallback: Identify missing column from various error formats
      const pgRegex = /column "(.+)" does not exist/;
      const restRegex = /Could not find the '(.+)' column/;
      
      const missingColumnMatch = error.message.match(pgRegex) || error.message.match(restRegex);
      
      if (missingColumnMatch) {
        const missingCol = missingColumnMatch[1];
        info(`🧹 Auto-healing: Removing missing column "${missingCol}" and retrying...`);
        
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
      }
    }

    if (error) {
      logError('Supabase Insert Error: ' + error.message, { error });
      throw error;
    }

    success(`🚀 SUCCESS: Complaint ${smartId} stored and classified as ${aiResult.category}`);

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
        info(`🔔 [NOTIFY] Dispatching updates to citizen ${recipientEmail || recipientPhone}`);
        notifyCitizen('update', recipientEmail, recipientPhone, complaint).catch(err => {
          logError("Citizen notification error: " + err.message);
        });
      }

      // Notify the admin/system if it's an emergency or as a log
      if (is_emergency && adminPhone) {
        info('🚨 [EMERGENCY] Triggering voice alert to system administrator...');
        const sosText = `Emergency alert from Smart Governance System. A citizen has triggered an S.O.S. at location ${location || address}. Immediate response required.`;
        sendVoiceAlert(adminPhone, sosText).catch(err => {
          logError("Background voice alert error: " + err.message);
        });
      }
    }

    res.status(201).json({ 
      message: 'Complaint submitted successfully', 
      complaint: data[0],
      tracking_id: smartId,
      ai_analysis: aiResult 
    });
  } catch (error) {
    logError('DETAILED ERROR submitting complaint: ' + error.message, { stack: error.stack });
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
    const { status, resolution_message, resolution_media_url } = req.body;

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

    let finalResolutionMediaUrl = null;
    if (resolution_media_url) {
      if (resolution_media_url.startsWith('data:')) {
        console.log('📦 [MEDIA] Uploading resolution base64 to Cloudinary...');
        try {
          const uploadedUrl = await uploadBase64(resolution_media_url);
          if (uploadedUrl) {
            finalResolutionMediaUrl = uploadedUrl;
            console.log('✅ [MEDIA] Cloudinary Upload Success:', finalResolutionMediaUrl);
          }
        } catch (uploadErr) {
          console.error('❌ [MEDIA] Cloudinary Error:', uploadErr.message);
        }
      } else {
        finalResolutionMediaUrl = resolution_media_url;
      }
    }

    const updatePayload = { status };
    if (status === 'Resolved' || status === 'Solved') {
        updatePayload.resolved_at = new Date().toISOString();
        if (finalResolutionMediaUrl) {
            updatePayload.resolution_media_url = finalResolutionMediaUrl;
        }
    }

    const { data, error } = await supabase
      .from('complaints')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    if (data && data[0] && status && (status.toLowerCase() === 'solved' || status.toLowerCase() === 'resolved')) {
      const complaint = data[0];
      const citizenId = complaint.citizen_id;
      
      console.log(`🔔 Resolution detected for complaint ${complaint.id}. Citizen ID: ${citizenId}`);
      
      const { notifyCitizen } = require('../services/notificationService');

      if (citizenId && citizenId !== 'anonymous') {
        // Pass resolution details to notification service (by adding them to complaint object dynamically)
        if (resolution_message) {
            complaint.resolution_message = resolution_message;
        }
        
        const cleanCitizenId = citizenId.split('@')[0];
        
        if (citizenId.includes('@') && !citizenId.endsWith('@c.us') && !citizenId.endsWith('@lid')) {
          // It's likely an email (has @ but not a WA suffix)
          console.log(`📧 Sending resolution email to ${citizenId}`);
          notifyCitizen('update', citizenId, null, complaint).catch(err => {
            console.error('❌ Failed to send resolution email notification:', err.message);
          });
        } else if (/^\+?\d+$/.test(cleanCitizenId)) {
          // It's a phone number (WA/SMS)
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
