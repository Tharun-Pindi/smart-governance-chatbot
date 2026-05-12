const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const supabase = require('./supabaseService');
const { uploadBase64 } = require('./cloudinaryService');
const fs = require('fs');
const path = require('path');
const { info, success, error: logError, warn } = require('./logService');

// Constants for session management
const AUTH_PATH = path.join(__dirname, '../.wwebjs_auth');

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

let userState = {};

// 💬 Messages (EXACTLY AS REQUESTED BY USER)
const messages = {
  welcome: "👋 *Hello! Welcome to Smart Governance Portal.*\n👋 *నమస్తే! స్మార్ట్ గవర్నెన్స్ పోర్టల్‌కు స్వాగతం.*\n\nPlease choose an option / దయచేసి ఎంచుకోండి:\n1️⃣ Report an Issue / ఫిర్యాదు చేయండి\n2️⃣ Check Status / స్థితి తెలుసుకోండి\n3️⃣ Help / సహాయం\n\n*(Reply with 1, 2, or 3 / 1, 2, లేదా 3 అని రిప్లై ఇవ్వండి)*",
  
  askComplaint: "📝 *Please describe your issue in detail.*\n📝 *దయచేసి మీ సమస్యను వివరంగా చెప్పండి.*",
  
  askName: "👤 *Please enter your full name.*\n👤 *దయచేసి మీ పూర్తి పేరు నమోదు చేయండి.*",
  
  askLocation: "📍 *Please share the exact location.*\n📍 *దయచేసి సమస్య ఉన్న ఖచ్చితమైన లొకేషన్ పంపండి.*",
  
  askWard: "🏘️ *Please select your Ward Number.*\n🏘️ *దయచేసి మీ వార్డు నంబర్ ఎంచుకోండి.*",
  
  wardTextMenu: "🏘️ *Please select your Ward Number:*\n🏘️ *దయచేసి మీ వార్డు నంబర్ ఎంచుకోండి:*\n\n1️⃣ Ward 1\n2️⃣ Ward 2\n3️⃣ Ward 3\n4️⃣ Ward 4\n5️⃣ Ward 5\n6️⃣ Ward 6\n7️⃣ Ward 7\n8️⃣ Ward 8\n9️⃣ Ward 9\n🔟 Ward 10\n\n📌 *If your ward number is not listed above, please type your Ward Number manually.* \n📌 *మీ వార్డు నంబర్ పై లిస్ట్లో లేకపోతే, దయచేసి మీ వార్డు నంబర్ టైప్ చేయండి.*",
  
  askImage: "📸 *Please upload a photo of the issue.*\n📸 *దయచేసి సమస్యకు సంబంధించిన ఫోటో పంపండి.*",
  
  registered: (data) => `✅ *Complaint Registered! / ఫిర్యాదు నమోదైంది!*
---------------------------------------
🆔 *ID:* SG-${data.id}
👤 *Name:* ${data.name}
📂 *Category:* ${data.category}
🏘️ *Ward No:* ${data.ward}
📍 *Location:* ${data.address}
📊 *Status:* Pending / పెండింగ్లో ఉంది

We will update you soon. / త్వరలో మీకు అప్డేట్ అందిస్తాము.`,

  askStatusId: "🔍 *Please enter your Complaint ID (e.g., SG-1023).*\n🔍 *దయచేసి మీ ఫిర్యాదు ID ని నమోదు చేయండి (ఉదా: SG-1023).*",
  
  status: (data) => `📊 *Status for SG-${data.id}:*\n*Status:* ${data.status}\n*Last Updated:* ${data.time}`,

  invalidId: "❌ *Complaint ID not found.* / *ఫిర్యాదు ID కనుగొనబడలేదు.*\n\nPlease check the ID and try again, or type 'Hi' for menu.\nదయచేసి ID ని సరిచూసుకుని మళ్లీ ప్రయత్నికండి, లేదా మెనూ కోసం 'Hi' అని టైప్ చేయండి.",
  
  cancelled: "🚫 Cancelled.",
  
  processing: "⏳ Processing...",
  
  help: "💡 *How to use the Smart Governance Bot:* \n\n1️⃣ **Report an Issue**: Type '1' and follow prompts.\n2️⃣ **Check Status**: Type '2' and enter your ID.\n\n💡 *స్మార్ట్ గవర్నెన్స్ బాట్ ఎలా ఉపయోగించాలి:* \n\n1️⃣ **ఫిర్యాదు చేయండి**: '1' నొక్కండి.\n2️⃣ **స్థితి తెలుసుకోండి**: '2' నొక్కి మీ ID ఇవ్వండి."
};

client.on('qr', qr => {
    console.log('📱 Scan QR: http://localhost:5001/api/whatsapp/qr');
});

client.on('ready', () => {
    userState = {}; // CLEAR ALL MEMORY ON STARTUP
    success('WhatsApp: Bot is ONLINE (Simple Mode)');
});

const initializeWhatsAppBot = async () => {
    try { await client.initialize(); } catch (e) { setTimeout(initializeWhatsAppBot, 10000); }
};

const resetWhatsAppBot = async () => {
    try { await client.destroy(); } catch (e) {}
    userState = {};
    setTimeout(initializeWhatsAppBot, 3000);
};

// 💬 Main Message Logic
client.on('message', async msg => {
  try {
    if (msg.fromMe) return;
    const user = msg.from;
    const text = (msg.body || '').toUpperCase().trim();
    
    console.log(`📩 [MESSAGE] From: ${user.split('@')[0]} | Text: "${text}"`);
    
    if (['CANCEL', 'EXIT'].includes(text)) {
      delete userState[user];
      return msg.reply(messages.cancelled);
    }

    if (!userState[user]) userState[user] = { step: 'IDLE' };
    const state = userState[user];
    
    if (['HI', 'HELLO', 'MENU', 'నమస్తే'].includes(text)) {
        delete userState[user];
        return client.sendMessage(user, messages.welcome);
    }

    console.log(`🤖 [LOGIC] User: ${user.split('@')[0]} | Step: ${state.step} | Input: "${text}"`);

    if (state.step === 'IDLE') {
      if (text === '1') {
        state.step = 'AWAITING_DESCRIPTION';
        return client.sendMessage(user, messages.askComplaint);
      } else if (text === '2') {
        state.step = 'AWAITING_STATUS_ID';
        return client.sendMessage(user, messages.askStatusId);
      } else if (text === '3') {
        console.log("ℹ️ [HELP] Sending help message...");
        return client.sendMessage(user, messages.help);
      }
    }

    else if (state.step === 'AWAITING_DESCRIPTION') {
        state.description = msg.body;
        state.step = 'AWAITING_NAME';
        return client.sendMessage(user, messages.askName);
    }
    else if (state.step === 'AWAITING_NAME') {
        state.name = msg.body;
        state.step = 'AWAITING_LOCATION';
        return client.sendMessage(user, messages.askLocation);
    }
    else if (state.step === 'AWAITING_LOCATION') {
        if (msg.location) {
            state.lat = msg.location.latitude;
            state.lng = msg.location.longitude;
            state.step = 'AWAITING_WARD';
            return client.sendMessage(user, messages.wardTextMenu);
        }
        return msg.reply('Please send location.');
    }
    else if (state.step === 'AWAITING_WARD') {
        state.ward = text;
        state.step = 'AWAITING_IMAGE';
        return client.sendMessage(user, messages.askImage);
    }
    else if (state.step === 'AWAITING_IMAGE') {
      let finalMediaUrl = null;
      const isSkip = text === 'SKIP' || text === 'స్కిప్';

      if (msg.hasMedia) {
        try {
          const media = await msg.downloadMedia();
          if (media) {
            const base64Media = `data:${media.mimetype};base64,${media.data}`;
            await client.sendMessage(user, messages.processing);
            finalMediaUrl = await uploadBase64(base64Media);
          }
        } catch (e) {
            console.error("❌ [MEDIA ERROR]", e.message);
        }
      } else if (!isSkip) {
        return msg.reply(messages.imageError);
      }

      try {
        const payload = {
          description: state.description,
          citizen_id: user,
          citizen_name: state.name,
          ward: state.ward,
          media_url: finalMediaUrl
        };
        
        const res = await axios.post(`http://localhost:5001/api/complaints`, payload);
        const displayId = res.data.tracking_id || res.data.complaint.id.substring(0,8).toUpperCase();

        delete userState[user];
        return client.sendMessage(user, messages.registered({ 
            id: displayId,
            name: state.name,
            category: 'General',
            ward: state.ward,
            address: 'Stored in record'
        }));
      } catch (e) {
        delete userState[user];
        return msg.reply('Error saving.');
      }
    }
    else if (state.step === 'AWAITING_STATUS_ID') {
      const input = text.replace('SG-', '');
      const alphaQuery = input.replace(/[^A-Z0-9]/g, '');
      const rawPhone = user.split('@')[0];
      let result = null;

      if (alphaQuery.length < 3) return msg.reply(messages.invalidId);

      const searchSuffix = alphaQuery.slice(-4);
      const { data: candidates } = await supabase.from('complaints').select('*').ilike('title', `%${searchSuffix}%`).limit(20);

      if (candidates) {
          result = candidates.find(c => {
              const alphaTitle = c.title.toUpperCase().replace(/[^A-Z0-9]/g, '');
              return alphaTitle.includes(alphaQuery);
          });
      }

      if (!result) return msg.reply(messages.invalidId);

      delete userState[user];
      const match = result.title.match(/\[(.*?)\]/);
      let displayId = match ? match[1] : `SG-${result.id.substring(0,8).toUpperCase()}`;
      if (!displayId.startsWith('SG-')) displayId = `SG-${displayId}`;

      return msg.reply(`📊 *Status for ${displayId}:*\n*Status:* ${result.status}\n*Last Updated:* ${new Date(result.created_at).toLocaleString()}\n\n📊 *${displayId} యొక్క స్థితి:*\n*స్థితి:* ${result.status}\n*చివరి అప్‌డేట్:* ${new Date(result.created_at).toLocaleString()}`);
    }
  } catch (err) {}
});

module.exports = { client, initializeWhatsAppBot, resetWhatsAppBot };
