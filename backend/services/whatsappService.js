const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const supabase = require('./supabaseService');
const { uploadBase64 } = require('./cloudinaryService');
const fs = require('fs');
const path = require('path');

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
      ],
      handleSIGINT: false, 
  }
});

process.on('unhandledRejection', (reason, promise) => {
    // Silently handle errors to prevent terminal scrolling
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let userState = {};

// 💬 Messages (Fully Bilingual - Combined English & Telugu)
const messages = {
  welcome: "👋 *Hello! Welcome to Smart Governance Portal.*\n👋 *నమస్తే! స్మార్ట్ గవర్నెన్స్ పోర్టల్‌కు స్వాగతం.*\n\nPlease choose an option / దయచేసి ఎంచుకోండి:\n1️⃣ Report an Issue / ఫిర్యాదు చేయండి\n2️⃣ Check Status / స్థితి తెలుసుకోండి\n3️⃣ Help / సహాయం\n\n*(Reply with 1, 2, or 3 / 1, 2, లేదా 3 అని రిప్లై ఇవ్వండి)*",
  askComplaint: "📝 *Please describe your issue in detail.*\n📝 *దయచేసి మీ సమస్యను వివరంగా చెప్పండి.*\n\n(e.g., Water pipe broken on Main Road / ఉదా: ప్రధాన రహదారిపై నీటి పైపు పగిలింది)",
  askLocation: "📍 *Please share the exact location.*\n📍 *దయచేసి సమస్య ఉన్న ఖచ్చితమైన లొకేషన్ పంపండి.*\n\n*(Tap attach 📎 → Location / Attach 📎 → Location నొక్కండి)*",
  askImage: "📸 *Please upload a photo of the issue.*\n📸 *దయచేసి సమస్యకు సంబంధించిన ఫోటో పంపండి.*\n\n*(Type 'skip' if you don't have one / ఫోటో లేకపోతే 'skip' అని టైప్ చేయండి)*",
  locationError: "❗ Please send a valid location or address. / దయచేసి సరైన లొకేషన్ పంపండి.",
  imageError: "❗ Please upload an image or type 'skip'. / దయచేసి ఫోటో పంపండి లేదా 'skip' అని టైప్ చేయండి.",
  registered: (data) => `✅ *Complaint Registered! / ఫిర్యాదు నమోదైంది!*
---------------------------------------
🆔 *ID:* SG-${data.id}
📂 *Category / వర్గం:* ${data.category}
📍 *Location / స్థలం:* ${data.address}
📊 *Status / స్థితి:* Pending / పెండింగ్‌లో ఉంది

We will update you soon. / త్వరలో మీకు అప్‌డేట్ అందిస్తాము.`,
  askStatusId: "🔍 *Please enter your Complaint ID (e.g., SG-1023).*\n🔍 *దయచేసి మీ ఫిర్యాదు ID ని నమోదు చేయండి (ఉదా: SG-1023).*",
  status: (data) => `📊 *Status for SG-${data.id}:*
*Status:* ${data.status}
*Last Updated:* ${data.time}

📊 *SG-${data.id} యొక్క స్థితి:*
*స్థితి:* ${data.status}
*చివరి అప్‌డేట్:* ${data.time}`,
  invalidOption: "❌ Invalid option. Please reply with 1, 2, or 3. / తప్పు ఎంపిక. దయచేసి 1, 2, లేదా 3 అని రిప్లై ఇవ్వండి.",
  invalidId: "❌ *Complaint ID not found.* / *ఫిర్యాదు ID కనుగొనబడలేదు.*\n\nPlease check the ID and try again, or type 'Hi' for menu.\nదయచేసి ID ని సరిచూసుకుని మళ్లీ ప్రయత్నికండి, లేదా మెనూ కోసం 'Hi' అని టైప్ చేయండి.",
  cancelled: "🚫 Process cancelled. Send 'Hi' to start over. / ప్రక్రియ రద్దు చేయబడింది. మళ్లీ ప్రారంభించడానికి 'Hi' అని పంపండి.",
  duplicate: (id) => `⚠️ *Already Reported / ఇప్పటికే నమోదైంది:*\nThis issue has been noted (ID: SG-${id}). Our team is already working on it!\nఈ సమస్య ఇప్పటికే గుర్తించబడింది (ID: SG-${id}). మా బృందం దీనిపై పని చేస్తోంది!`,
  processing: "⏳ *Processing your request... / ప్రాసెస్ చేస్తున్నాము...*",
  help: "💡 *How to use the Smart Governance Bot:* \n\n1️⃣ **Report an Issue**: Type '1' and follow prompts.\n2️⃣ **Check Status**: Type '2' and enter your ID.\n\n💡 *స్మార్ట్ గవర్నెన్స్ బాట్ ఎలా ఉపయోగించాలి:* \n\n1️⃣ **ఫిర్యాదు చేయండి**: '1' నొక్కండి.\n2️⃣ **స్థితి తెలుసుకోండి**: '2' నొక్కి మీ ID ఇవ్వండి.",
  unknown: "🤔 *I didn't quite catch that.* \n*క్షమించండి, అది నాకు అర్థం కాలేదు.*\n\nType **'Hi'** to see the menu / మెనూ కోసం **'Hi'** అని టైప్ చేయండి."
};

// 🧠 Category Detection
function classify(text) {
  text = text.toLowerCase();
  if (text.includes("water") || text.includes("నీరు") || text.includes("leak")) return "Water & Sewage";
  if (text.includes("road") || text.includes("రోడ్") || text.includes("pothole")) return "Infrastructure";
  if (text.includes("garbage") || text.includes("చెత్త") || text.includes("clean")) return "Sanitation";
  if (text.includes("light") || text.includes("కరెంట్") || text.includes("power")) return "Electricity";
  return "General";
}

// 🌍 Reverse Geocoding
async function getAddress(lat, lng) {
  try {
    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'User-Agent': 'SmartGovernanceApp/1.0' }
    });
    return res.data.display_name;
  } catch {
    return "Unknown Location";
  }
}

// 🔐 WhatsApp Bot Lifecycle
let latestQR = null;
let qrSent = 0;
let isBotReady = false;
let isInitializing = false;
let authError = null;

client.on('qr', qr => {
    latestQR = qr;
    qrSent++;
    authError = null;
    if (qrSent % 5 === 1) {
        console.log(`\n📱 [ACTION REQUIRED] Scan the QR code: http://localhost:5001/api/whatsapp/qr`);
    }
});

client.on('authenticated', () => {
    console.log('✅ WhatsApp Authenticated');
    latestQR = null;
});

client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp Authentication Failed:', msg);
    authError = msg;
    latestQR = null;
});

client.on('ready', () => {
    isBotReady = true;
    isInitializing = false;
    latestQR = null;
    authError = null;
    console.log('\n🟢 WHATSAPP BOT IS LIVE\n');
});

client.on('disconnected', async (reason) => {
    console.log('❌ WhatsApp Disconnected:', reason);
    isBotReady = false;
    isInitializing = false;
    latestQR = null;
    
    if (reason === 'LOGOUT') {
        clearSession();
    }

    setTimeout(() => {
        initializeWhatsAppBot();
    }, 10000);
});

const clearSession = () => {
    try {
        if (fs.existsSync(AUTH_PATH)) {
            // On Windows, the lockfile often prevents deletion. We try to remove it specifically first.
            const sessionPath = path.join(AUTH_PATH, 'session-smart-gov-bot');
            const lockfile = path.join(sessionPath, 'lockfile');
            
            if (fs.existsSync(lockfile)) {
                try { fs.unlinkSync(lockfile); } catch (e) {}
            }

            fs.rmSync(AUTH_PATH, { recursive: true, force: true });
            console.log('🧹 Session cleared.');
        }
    } catch (e) {
        console.error('⚠️ Failed to clear session (likely still locked):', e.message);
    }
};

const initializeWhatsAppBot = async () => {
    if (isBotReady || isInitializing) return;
    
    // Pre-check for lockfile which causes the "browser already running" error
    const lockfile = path.join(AUTH_PATH, 'session-smart-gov-bot', 'lockfile');
    if (fs.existsSync(lockfile)) {
        console.log('🧹 Removing stale WhatsApp lockfile...');
        try { fs.unlinkSync(lockfile); } catch (e) {}
    }

    try {
        console.log('🔄 Initializing WhatsApp Client...');
        isInitializing = true;
        authError = null;
        await client.initialize();
    } catch (error) {
        isInitializing = false;
        console.error("❌ WhatsApp Bot Initialization Failed:", error.message);
        authError = error.message;
        
        // If it failed due to EBUSY or "already running", try one more time after a delay
        if (error.message.includes('EBUSY') || error.message.includes('already running')) {
            console.log('⏳ Retrying initialization in 5 seconds...');
            setTimeout(initializeWhatsAppBot, 5000);
        }
    }
};

const resetWhatsAppBot = async () => {
    console.log('♻️ Resetting WhatsApp Bot...');
    try {
        await client.destroy();
    } catch (e) {
        console.error('Error destroying client:', e.message);
    }
    isBotReady = false;
    isInitializing = false;
    latestQR = null;
    clearSession();
    setTimeout(initializeWhatsAppBot, 3000);
};

// 💬 Main Message Logic
client.on('message', async msg => {
  try {
    if (msg.fromMe) return;
    const user = msg.from;
    const text = (msg.body || '').toLowerCase().trim();
    
    if (['cancel', 'రద్దు', 'exit', 'stop'].includes(text)) {
      delete userState[user];
      return msg.reply(messages.cancelled);
    }

    if (!userState[user]) userState[user] = { step: 'IDLE' };
    const state = userState[user];

    // Menu Logic
    if (state.step === 'IDLE') {
      if (text === '1') {
        state.step = 'AWAITING_COMPLAINT';
        return msg.reply(messages.askComplaint);
      } else if (text === '2') {
        state.step = 'AWAITING_STATUS_ID';
        return msg.reply(messages.askStatusId);
      } else if (text === '3') {
        return msg.reply(messages.help);
      } else if (['hi', 'hello', 'start', 'menu'].some(t => text.includes(t))) {
        return msg.reply(messages.welcome);
      } else {
        return msg.reply(messages.unknown);
      }
    }

    // Status Check
    if (state.step === 'AWAITING_STATUS_ID') {
      const cleanId = text.replace('sg-', '').trim();
      let result = null;

      // 1. Try search by phone number/citizen_id
      const { data: phoneData } = await supabase.from('complaints').select('*').eq('citizen_id', user).order('created_at', { ascending: false }).limit(1);
      if (phoneData && phoneData[0] && (cleanId === 'status' || cleanId === 'స్థితి')) {
          result = phoneData[0];
      }

      // 2. Try search by UUID prefix (Robust Range Search)
      if (!result && cleanId.length >= 4) {
          const prefix = cleanId.toLowerCase();
          const pad = (char) => {
              let s = prefix + char.repeat(Math.max(0, 32 - prefix.length));
              // Format as UUID: 8-4-4-4-12
              return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20,32)}`;
          };
          
          try {
            const { data: rangeData } = await supabase.from('complaints')
              .select('*')
              .gte('id', pad('0'))
              .lte('id', pad('f'))
              .limit(1);
            if (rangeData && rangeData[0]) result = rangeData[0];
          } catch (e) {
            console.error("Range search error:", e.message);
          }
      }

      // 3. Fallback to exact match if it looks like a full UUID
      if (!result && cleanId.length === 36) {
        const { data: exactData } = await supabase.from('complaints').select('*').eq('id', cleanId).limit(1);
        if (exactData && exactData[0]) result = exactData[0];
      }
      
      if (!result) return msg.reply(messages.invalidId);
      
      delete userState[user];
      return msg.reply(messages.status({ 
        id: result.id.substring(0,8).toUpperCase(), 
        status: result.status, 
        time: new Date(result.created_at).toLocaleString() 
      }));
    }

    // Report Logic
    if (state.step === 'AWAITING_COMPLAINT') {
      state.text = msg.body;
      state.category = classify(msg.body);
      state.step = 'AWAITING_LOCATION';
      return msg.reply(messages.askLocation);
    }

    if (state.step === 'AWAITING_LOCATION') {
      if (msg.location) {
        state.lat = msg.location.latitude;
        state.lng = msg.location.longitude;
        state.address = await getAddress(state.lat, state.lng);
        state.step = 'AWAITING_IMAGE';
        return msg.reply(messages.askImage);
      } else {
        return msg.reply(messages.locationError);
      }
    }

    if (state.step === 'AWAITING_IMAGE') {
      let base64Media = null;
      if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        if (media) base64Media = `data:${media.mimetype};base64,${media.data}`;
      } else if (text !== 'skip' && text !== 'స్కిప్') {
        return msg.reply(messages.imageError);
      }

      try {
        const payload = {
          description: state.text,
          citizen_id: user,
          location: state.lat ? `${state.lat}, ${state.lng}` : null,
          address: state.address,
          media_url: base64Media
        };
        const res = await axios.post(`http://localhost:${process.env.PORT || 5001}/api/complaints`, payload);
        const isDuplicate = res.data.ai_analysis && res.data.ai_analysis.isDuplicate;
        
        delete userState[user];
        
        if (isDuplicate) {
          const duplicateId = res.data.ai_analysis.duplicateId ? res.data.ai_analysis.duplicateId.substring(0, 8) : 'EXISTING';
          return msg.reply(`✅ *Complaint Registered! / ఫిర్యాదు నమోదైంది!*
---------------------------------------
🆔 *Your ID:* SG-${res.data.complaint.id.substring(0,8)}
🚀 *Note:* This issue was already reported. We've added your report to escalate its priority!
గమనిక: ఈ సమస్య ఇప్పటికే నమోదైంది. మీ ఫిర్యాదు ఆధారంగా దీని ప్రాధాన్యతను పెంచాము!`);
        }

        return msg.reply(messages.registered({ 
          id: res.data.complaint.id.substring(0,8), 
          category: state.category, 
          address: state.address 
        }));
      } catch (e) {
        console.error("Submission Error:", e.message);
        msg.reply("❌ *Failed to save complaint.*\nIf you uploaded a large photo, try sending 'skip' to report without the photo.");
      }
    }
  } catch (err) {
    console.error("Bot Error:", err.message);
  }
});

const getWhatsAppStatus = () => ({
    ready: isBotReady,
    initializing: isInitializing,
    qr: latestQR,
    error: authError
});

const sendWhatsAppMessage = async (toId, text) => {
    if (!isBotReady) return;
    try {
        let chatId = toId.includes('@') ? toId : `${toId.replace(/\D/g, '')}@c.us`;
        await client.sendMessage(chatId, text);
    } catch (e) {
        console.error('WhatsApp Send Error:', e.message);
    }
};

module.exports = { client, initializeWhatsAppBot, resetWhatsAppBot, sendWhatsAppMessage, getWhatsAppStatus };
