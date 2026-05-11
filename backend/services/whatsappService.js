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

// 💬 Messages (Fully Bilingual - Restored to Original Style)
const messages = {
  welcome: "👋 *Hello! Welcome to Smart Governance Portal.*\n👋 *నమస్తే! స్మార్ట్ గవర్నెన్స్ పోర్టల్‌కు స్వాగతం.*\n\nPlease choose an option / దయచేసి ఎంచుకోండి:\n1️⃣ Report an Issue / ఫిర్యాదు చేయండి\n2️⃣ Check Status / స్థితి తెలుసుకోండి\n3️⃣ Help / సహాయం\n\n*(Reply with 1, 2, or 3 / 1, 2, లేదా 3 అని రిప్లై ఇవ్వండి)*",
  
  askComplaint: "📝 *Please describe your issue in detail.*\n📝 *దయచేసి మీ సమస్యను వివరంగా చెప్పండి.*\n\n(e.g., Water pipe broken on Main Road / ఉదా: ప్రధాన రహదారిపై నీటి పైపు పగిలింది)",
  
  askName: "👤 *Please enter your full name.*\n👤 *దయచేసి మీ పూర్తి పేరు నమోదు చేయండి.*",
  
  askLocation: "📍 *Please share the exact location.*\n📍 *దయచేసి సమస్య ఉన్న ఖచ్చితమైన లొకేషన్ పంపండి.*\n\n*(Tap attach 📎 → Location / Attach 📎 → Location నొక్కండి)*",
  
  askWard: "🏘️ *Please select your Ward Number.*\n🏘️ *దయచేసి మీ వార్డు నంబర్ ఎంచుకోండి.*",
  
  wardList: () => messages.wardTextMenu,

  wardTextMenu: "🏘️ *Please select your Ward Number:*\n🏘️ *దయచేసి మీ వార్డు నంబర్ ఎంచుకోండి:*\n\n1️⃣ Ward 1\n2️⃣ Ward 2\n3️⃣ Ward 3\n4️⃣ Ward 4\n5️⃣ Ward 5\n6️⃣ Ward 6\n7️⃣ Ward 7\n8️⃣ Ward 8\n9️⃣ Ward 9\n🔟 Ward 10\n\n📌 *If your ward number is not listed above, please type your Ward Number manually.* \n📌 *మీ వార్డు నంబర్ పై లిస్ట్లో లేకపోతే, దయచేసి మీ వార్డు నంబర్ టైప్ చేయండి.*",
  
  askImage: "📸 *Please upload a photo of the issue.*\n📸 *దయచేసి సమస్యకు సంబంధించిన ఫోటో పంపండి.*\n\n*(Type 'skip' if you don't have one / ఫోటో లేకపోతే 'skip' అని టైప్ చేయండి)*",
  
  locationError: "❗ Please send a valid location or address. / దయచేసి సరైన లొకేషన్ పంపండి.",
  
  imageError: "❗ Please upload an image or type 'skip'. / దయచేసి ఫోటో పంపండి లేదా 'skip' అని టైప్ చేయండి.",
  
  registered: (data) => `✅ *Complaint Registered! / ఫిర్యాదు నమోదైంది!*
---------------------------------------
🆔 *ID:* SG-${data.id}
👤 *Name:* ${data.name}
📂 *Category:* ${data.category}
🏘️ *Ward No:* ${data.ward}
📍 *Location:* ${data.address}
📊 *Status:* Pending / పెండింగ్‌లో ఉంది

We will update you soon. / త్వరలో మీకు అప్‌డేట్ అందిస్తాము.`,

  registrationError: "❌ Unable to register complaint currently.\n❌ ప్రస్తుతం ఫిర్యాదు నమోదు కాలేదు.\n\nPlease try again later.\nదయచేసి కొంతసేపటి తర్వాత ప్రయత్నించండి.",

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
    
    // Robust Lockfile Cleanup
    const sessionPath = path.join(AUTH_PATH, 'session-smart-gov-bot');
    const lockfile = path.join(sessionPath, 'lockfile');
    
    if (fs.existsSync(lockfile)) {
        try { fs.unlinkSync(lockfile); } catch (e) {
            if (process.platform === 'win32') {
                try { require('child_process').execSync('taskkill /F /IM chrome.exe /T', { stdio: 'ignore' }); } catch (err) {}
            }
        }
    }

    try {
        isInitializing = true;
        await client.initialize();
    } catch (error) {
        isInitializing = false;
        setTimeout(initializeWhatsAppBot, 10000);
    }
};

const resetWhatsAppBot = async () => {
    try { await client.destroy(); } catch (e) {}
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
    
    // Global Cancel
    if (['cancel', 'రద్దు', 'exit', 'stop'].includes(text)) {
      delete userState[user];
      return msg.reply(messages.cancelled);
    }

    // Helper: Simulated Delay with Fallback
    const sendWithDelay = async (content, delay = 300) => {
        try {
            if (!isBotReady) {
                console.warn('⚠️ Bot not ready, skipping message send.');
                return null;
            }
            await new Promise(r => setTimeout(r, delay));
            return await client.sendMessage(user, content);
        } catch (e) {
            console.error('⚠️ Send Error (Detailed):', {
                message: e.message,
                stack: e.stack,
                content: typeof content === 'string' ? content : 'non-string content'
            });
            return null;
        }
    };

    // --- RESET / RESTART LOGIC ---
    // Only reset if the message IS exactly a greeting, not if it contains one (to avoid resetting on names like 'Nithin')
    const greetings = ['hi', 'hello', 'start', 'menu', 'నమస్తే', 'restart'];
    if (greetings.includes(text)) {
        delete userState[user];
        return sendWithDelay(messages.welcome);
    }

    if (!userState[user]) userState[user] = { step: 'IDLE' };
    const state = userState[user];

    // --- STATE MACHINE ---

    // 1. IDLE / MENU
    if (state.step === 'IDLE') {
      if (text === '1') {
        state.step = 'AWAITING_DESCRIPTION';
        return sendWithDelay(messages.askComplaint);
      } else if (text === '2') {
        state.step = 'AWAITING_STATUS_ID';
        return sendWithDelay(messages.askStatusId);
      } else if (text === '3') {
        return sendWithDelay(messages.help);
      } else {
        return msg.reply(messages.unknown);
      }
    }

    // 2. REPORT FLOW - STEP 1: DESCRIPTION
    else if (state.step === 'AWAITING_DESCRIPTION') {
        state.description = msg.body;
        state.category = classify(msg.body);
        state.step = 'AWAITING_NAME';
        return sendWithDelay(messages.askName);
    }

    // 3. REPORT FLOW - STEP 2: NAME
    else if (state.step === 'AWAITING_NAME') {
        state.name = msg.body;
        state.step = 'AWAITING_LOCATION';
        return sendWithDelay(messages.askLocation);
    }

    // 4. REPORT FLOW - STEP 3: LOCATION
    else if (state.step === 'AWAITING_LOCATION') {
        if (msg.location) {
            state.lat = msg.location.latitude;
            state.lng = msg.location.longitude;
            state.address = await getAddress(state.lat, state.lng);
            state.step = 'AWAITING_WARD';
            return sendWithDelay(messages.wardTextMenu);
        }
        return msg.reply(messages.locationError);
    }

    // 5. REPORT FLOW - STEP 4: WARD
    else if (state.step === 'AWAITING_WARD') {
        if (msg.type === 'list_response') {
            state.ward = msg.selectedRowId.replace('ward_', '');
            state.step = 'AWAITING_IMAGE';
            return sendWithDelay(messages.askImage);
        }
        
        // Handle manual entry (e.g., "25", "Ward 25", "వార్డు 25")
        const wardMatch = text.match(/\d+/);
        if (wardMatch) {
            state.ward = wardMatch[0];
            state.step = 'AWAITING_IMAGE';
            return sendWithDelay(messages.askImage);
        }

        return msg.reply(messages.wardTextMenu);
    }

    // 6. REPORT FLOW - STEP 5: IMAGE & FINISH
    else if (state.step === 'AWAITING_IMAGE') {
      let base64Media = null;
      const isSkip = text === 'skip' || text === 'స్కిప్';

      if (msg.hasMedia) {
        try {
          const media = await msg.downloadMedia();
          if (media) base64Media = `data:${media.mimetype};base64,${media.data}`;
        } catch (mediaErr) {
          console.error("Media Download Error:", mediaErr.message);
        }
      } else if (!isSkip) {
        return msg.reply(messages.imageError);
      }

      await sendWithDelay(messages.processing);

      try {
        const payload = {
          description: state.description,
          citizen_id: user,
          citizen_name: state.name,
          ward: state.ward,
          category: state.category,
          location: state.lat ? `${state.lat}, ${state.lng}` : null,
          address: state.address,
          media_url: base64Media
        };
        
        const res = await axios.post(`http://localhost:${process.env.PORT || 5001}/api/complaints`, payload);
        
        const complaintData = {
            id: res.data.complaint.id.substring(0,8).toUpperCase(),
            name: state.name,
            category: state.category,
            ward: state.ward,
            address: state.address
        };

        // SUCCESS: Clear session and send card
        delete userState[user];
        return client.sendMessage(user, messages.registered(complaintData));
        
      } catch (e) {
        console.error("Submission Error:", e.message);
        // FAILURE: Clear session and send bilingual error
        delete userState[user];
        return msg.reply(messages.registrationError);
      }
    }

    // 7. STATUS CHECK FLOW
    else if (state.step === 'AWAITING_STATUS_ID') {
      const cleanId = text.replace('sg-', '').trim();
      let result = null;

      const { data: phoneData } = await supabase.from('complaints').select('*').eq('citizen_id', user).order('created_at', { ascending: false }).limit(1);
      if (phoneData && phoneData[0] && (cleanId === 'status' || cleanId === 'స్థితి')) {
          result = phoneData[0];
      }

      if (!result && cleanId.length >= 4) {
          const prefix = cleanId.toLowerCase();
          const pad = (char) => {
              let s = prefix + char.repeat(Math.max(0, 32 - prefix.length));
              return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20,32)}`;
          };
          
          try {
            const { data: rangeData } = await supabase.from('complaints').select('*').gte('id', pad('0')).lte('id', pad('f')).limit(1);
            if (rangeData && rangeData[0]) result = rangeData[0];
          } catch (e) {}
      }

      if (!result) return msg.reply(messages.invalidId);
      
      delete userState[user];
      return msg.reply(messages.status({ 
        id: result.id.substring(0,8).toUpperCase(), 
        status: result.status, 
        time: new Date(result.created_at).toLocaleString() 
      }));
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
