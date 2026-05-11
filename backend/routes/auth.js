const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// In-memory OTP storage (In production, use Redis)
const otpStore = new Map();

router.post('/send-otp', async (req, res) => {
  const { phone, name } = req.body;
  if (!phone || !name) return res.status(400).json({ error: 'Name and Phone are required' });

  try {
    // 1. Verify if phone number and name belong to an admin in Supabase
    let admin = null;
    const { data: admins, error } = await supabase.from('admins').select('*').eq('phone', phone).single();
    
    if (error || !admins) {
      // Fallback mocks for testing if table isn't created yet
      if (phone === '+919876543210' || phone === '9876543210') {
        admin = { name: 'Tharun Pindi', phone, role: 'super_admin', ward_number: null };
      } else if (phone === '+919876543211' || phone === '9876543211') {
        admin = { name: 'Ward Admin', phone, role: 'ward_admin', ward_number: '5' };
      } else {
        return res.status(401).json({ error: 'Unregistered details. Access denied.' });
      }
    } else {
      admin = admins;
    }

    // Verify Name (Case-insensitive check for better UX)
    if (admin.name.toLowerCase() !== name.toLowerCase()) {
       return res.status(401).json({ error: 'Name does not match our records for this number.' });
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 5-minute expiry, tied to the admin profile
    otpStore.set(phone, { otp, expires: Date.now() + 5 * 60000, admin });

    // 3. Send via Twilio
    if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE) {
      const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: `Your Smart Governance Admin OTP is: ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE,
        to: phone.startsWith('+') ? phone : `+91${phone}` // Assume India +91 if no code provided
      });
      console.log(`[Twilio] Sent OTP ${otp} to ${phone}`);
    } else {
      console.log(`[Mock Twilio] OTP for ${phone} is: ${otp}`);
    }

    res.json({ success: true, message: 'OTP sent successfully' });

  } catch (error) {
    console.error('OTP Send Error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

  const record = otpStore.get(phone);
  if (!record) {
    return res.status(401).json({ error: 'OTP expired or not requested' });
  }

  if (Date.now() > record.expires) {
    otpStore.delete(phone);
    return res.status(401).json({ error: 'OTP has expired' });
  }

  // Secure OTP verification (Bypass removed for production)
  if (record.otp === otp) {
    otpStore.delete(phone); // Clear OTP on success
    res.json({ 
      success: true, 
      user: {
        name: record.admin.name,
        role: record.admin.role,
        wardNumber: record.admin.ward_number,
        photo_url: record.admin.photo_url
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid OTP' });
  }
});

router.post('/update-profile', async (req, res) => {
  const { phone, name, photo } = req.body;
  console.log(`[AUTH] Updating profile for ${phone}...`);
  
  if (!phone || !name) return res.status(400).json({ error: 'Phone and Name are required' });

  try {
    let photo_url = null;

    // If a new photo is provided (base64 string), upload to Cloudinary
    if (photo && photo.startsWith('data:image')) {
      console.log(`[CLOUDINARY] Uploading new photo...`);
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });

      const uploadRes = await cloudinary.uploader.upload(photo, {
        folder: 'admin_profiles'
      });
      photo_url = uploadRes.secure_url;
      console.log(`[CLOUDINARY] Success: ${photo_url}`);
    }

    const updateData = { name: name };
    if (photo_url) updateData.photo_url = photo_url;

    const { data, error } = await supabase
      .from('admins')
      .update(updateData)
      .eq('phone', phone)
      .select();

    if (error) {
      console.error('[SUPABASE ERROR]', error);
      throw error;
    }

    console.log(`[SUPABASE] Profile updated successfully for ${phone}. Rows affected: ${data?.length}`);
    res.json({ success: true, message: 'Profile updated successfully', photo_url: photo_url || photo });
  } catch (error) {
    console.error('[UPDATE ERROR]', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
