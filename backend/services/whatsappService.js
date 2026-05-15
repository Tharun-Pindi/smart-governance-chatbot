const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const supabase = require('./supabaseService');
const { info, success, error: logError, warn } = require('./logService');
const { uploadBase64 } = require('./cloudinaryService');
const { handleUserInput } = require('./chatbotService');
const { tts } = require('./bhashiniService');

// Constants for session management
const AUTH_PATH = path.join(__dirname, '../.wwebjs_auth');

let botStatus = {
    qr: null,
    ready: false,
    error: null
};

let ratingStates = {};

const setUserRatingState = (userId, complaintId) => {
    ratingStates[userId] = { complaintId };
};

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'smart-gov-bot',
    dataPath: AUTH_PATH
  }),
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1012170943-alpha.html',
  },
  puppeteer: {
      headless: true,
      args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-software-rasterizer'
      ]
  }
});

client.on('qr', qr => {
    botStatus.qr = qr;
    botStatus.ready = false;
    botStatus.error = null;
    // ONLY display the link for browser login as requested by user
    console.log('\n=========================================');
    console.log('🔗 WHATSAPP LOGIN LINK:');
    console.log('http://localhost:5001/api/whatsapp/qr');
    console.log('=========================================');
});

client.on('ready', () => {
    botStatus.qr = null;
    botStatus.ready = true;
    botStatus.error = null;
    success('WhatsApp: Bot is ONLINE & Ready for Voice/Text');
});

client.on('auth_failure', msg => {
    botStatus.error = 'Authentication failed: ' + msg;
    logError('WhatsApp Auth Failure:', msg);
});

client.on('disconnected', (reason) => {
    botStatus.ready = false;
    botStatus.error = 'Disconnected: ' + reason;
    warn('WhatsApp Disconnected:', reason);
});

// 💬 Main Message Logic
client.on('message', async msg => {
  try {
    if (msg.fromMe) return;
    const user = msg.from;
    
    // 💬 Handle Rating/Feedback Capture (1-5)
    if (ratingStates[user] && /^[1-5]$/.test(msg.body.trim())) {
        const { complaintId } = ratingStates[user];
        const rating = parseInt(msg.body.trim());
        
        try {
            await supabase.from('complaints').update({ rating }).eq('id', complaintId);
            delete ratingStates[user];
            await client.sendMessage(user, "🙏 Thank you! Your feedback helps us improve our service.\nమీ అమూల్యమైన ఫీడ్బ్యాక్ అందించినందుకు ధన్యవాదాలు.");
            success(`⭐ Rating ${rating} received for complaint ${complaintId}`);
            return;
        } catch (err) {
            logError('Rating Save Error:', err.message);
        }
    }
    
    let mediaUrl = null;
    let type = 'text';
    let input = msg.body;
    let metadata = {};

    // 🎙️ Handle Voice & Media Messages
    if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        if (media.mimetype.startsWith('audio/')) {
            type = 'voice';
            const tempDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
            
            const tempPath = path.join(tempDir, `voice_${Date.now()}.ogg`);
            fs.writeFileSync(tempPath, Buffer.from(media.data, 'base64'));
            
            try {
                const { transcribeAudio } = require('./voiceService');
                const sttResult = await transcribeAudio(tempPath);
                input = sttResult.text;
                success(`WhatsApp STT: "${input}"`);
                
                // Acknowledge transcription
                await client.sendMessage(user, `🎤 _Transcribed:_ "${input}"`);
            } catch (err) {
                logError('STT Error:', err);
            } finally {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }
        } 
        else if (media.mimetype.startsWith('image/')) {
            try {
                const base64Media = `data:${media.mimetype};base64,${media.data}`;
                mediaUrl = await uploadBase64(base64Media);
                metadata.mediaUrl = mediaUrl;
                // If there's no caption, don't treat binary data as text input
                if (input && input.length > 500) input = "";
            } catch (err) {
                logError('Image Upload Error:', err);
            }
        }
    }

    // 📍 Handle Location Pin
    if (msg.type === 'location' || msg.location) {
        type = 'location';
        metadata.location = {
            latitude: msg.location.latitude,
            longitude: msg.location.longitude,
            address: msg.body || 'Location Pin Shared'
        };
        success(`📍 WhatsApp Location received: ${metadata.location.latitude}, ${metadata.location.longitude}`);
    }

    // 🤖 Process via Unified Chatbot Service
    const result = await handleUserInput(user, input, type, metadata);

    // 📤 Send Text Response
    await client.sendMessage(user, result.response);

    // 🔊 Optional: Send Voice Response (TTS) if Bhashini is configured
    if (result.response && !result.response.includes('Welcome') && process.env.BHASHINI_API_KEY !== 'your_bhashini_api_key_here') {
        try {
            const { extractTeluguText } = require('./voiceService');
            const teluguText = await extractTeluguText(result.response);
            
            if (teluguText && teluguText.length > 5) {
                const audioBase64 = await tts(teluguText, 'te');
                if (audioBase64) {
                    const audioMedia = new MessageMedia('audio/mp3', audioBase64);
                    await client.sendMessage(user, audioMedia, { sendAudioAsVoice: true });
                }
            }
        } catch (err) {
            // Silently fail for TTS to not block text response
        }
    }
    
  } catch (err) {
    logError('WhatsApp Message handling error:', err);
  }
});

const sendWhatsAppMessage = async (to, message, mediaUrl = null) => {
    try {
        if (!client || !botStatus.ready) {
            throw new Error('WhatsApp client not ready');
        }
        
        // Handle phone number formatting if not a full ID
        let target = to;
        if (!to.includes('@')) {
            target = `${to.replace(/\s/g, '').replace('+', '')}@c.us`;
        }

        if (mediaUrl) {
            const media = await MessageMedia.fromUrl(mediaUrl);
            await client.sendMessage(target, media, { caption: message });
        } else {
            await client.sendMessage(target, message);
        }
        return true;
    } catch (err) {
        logError('Error sending WhatsApp message:', err.message);
        throw err;
    }
};

const initializeWhatsAppBot = async () => {
    info('⏳ Initializing WhatsApp connection... Please wait.');
    try { 
        await client.initialize(); 
    } catch (e) { 
        botStatus.error = e.message;
        setTimeout(initializeWhatsAppBot, 10000); 
    }
};

const resetWhatsAppBot = async () => {
    try { await client.destroy(); } catch (e) {}
    botStatus = { qr: null, ready: false, error: null };
    setTimeout(initializeWhatsAppBot, 3000);
};

const getWhatsAppStatus = () => botStatus;

module.exports = { 
    client, 
    initializeWhatsAppBot, 
    resetWhatsAppBot, 
    getWhatsAppStatus,
    sendWhatsAppMessage,
    setUserRatingState
};
