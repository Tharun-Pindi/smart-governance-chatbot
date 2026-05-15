const supabase = require('./supabaseService');
const axios = require('axios');
const { info, success, error: logError, warn } = require('./logService');
const { analyzeAndCheckDuplicate } = require('./aiService');

// 💬 Messages (EXACT OLD STYLE)
const messages = {
  welcome: "👋 *Hello! Welcome to Smart Governance Portal.*\n👋 *నమస్తే! స్మార్ట్ గవర్నెన్స్ పోర్టల్‌కు స్వాగతం.*\n\nPlease choose an option / దయచేసి ఎంచుకోండి:\n1️⃣ Report an Issue / ఫిర్యాదు చేయండి\n2️⃣ Check Status / స్థితి తెలుసుకోండి\n3️⃣ Help / సహాయం\n\n*(Reply with 1, 2, or 3 / 1, 2, లేదా 3 అని రిప్లై ఇవ్వండి)*",
  
  askComplaint: "📝 *Please describe your issue in detail.*\n📝 *దయచేసి మీ సమస్యను వివరంగా చెప్పండి.*",
  
  askName: "👤 *Please enter your full name.*\n👤 *దయచేసి మీ పూర్తి పేరు నమోదు చేయండి.*",
  
  askLocation: "📍 *Please share the exact location.*\n📍 *దయచేసి సమస్య ఉన్న ఖచ్చితమైన లొకేషన్ పంపండి.*",
  
  askWard: "🏘️ *Please select your Ward Number:*\n🏘️ *దయచేసి మీ వార్డు నంబర్ ఎంచుకోండి:*\n\n1️⃣ Ward 1\n2️⃣ Ward 2\n3️⃣ Ward 3\n4️⃣ Ward 4\n5️⃣ Ward 5\n6️⃣ Ward 6\n7️⃣ Ward 7\n8️⃣ Ward 8\n9️⃣ Ward 9\n🔟 Ward 10\n\n📌 *If your ward number is not listed above, please type your Ward Number manually.* \n📌 *మీ వార్డు నంబర్ పై లిస్ట్లో లేకపోతే, దయచేసి మీ వార్డు నంబర్ టైప్ చేయండి.*",
  
  askImage: "📸 *Please upload a photo or video of the issue.*\n📸 *దయచేసి సమస్యకు సంబంధించిన ఫోటో లేదా వీడియో పంపండి.*",
  
  processing: "⏳ Processing...",
  
  registered: (data) => `✅ *Complaint Registered! / ఫిర్యాదు నమోదైంది!*
---------------------------------------
🆔 *ID:* ${data.id}
👤 *Name:* ${data.name}
📂 *Category:* ${data.category}
🏘️ *Ward No:* ${data.ward}
📍 *Location:* ${data.address}
📊 *Status:* Pending / పెండింగ్లో ఉంది

We will update you soon. / త్వరలో మీకు అప్డేట్ అందిస్తాము.

SmartGov Update: Your complaint regarding "[${data.id}] ${data.title}" is now "Pending". Dept: Municipal Corporation (GHMC/GVMC).

స్మార్ట్ గవర్నెన్స్ అప్డేట్: మీ ఫిర్యాదు "[${data.id}] ${data.title}" ఇప్పుడు "Pending" స్థితిలో ఉంది. విభాగం: Municipal Corporation (GHMC/GVMC).`,

  invalidId: "❌ *Complaint ID not found.* / *ఫిర్యాదు ID కనుగొనబడలేదు.*\n\nPlease check the ID and try again, or type 'Hi' for menu.\nదయచేసి ID ని సరిచూసుకుని మళ్లీ ప్రయత్నికండి, లేదా మెనూ కోసం 'Hi' అని టైప్ చేయండి.",
  
  cancelled: "🚫 Cancelled.",
  
  help: "💡 *How to use the Smart Governance Bot:* \n\n1️⃣ **Report an Issue**: Type '1' and follow prompts.\n2️⃣ **Check Status**: Type '2' and enter your ID.\n\n💡 *స్మార్ట్ గవర్నెన్స్ బాట్ ఎలా ఉపయోగించాలి:* \n\n1️⃣ **ఫిర్యాదు చేయండి**: '1' నొక్కండి.\n2️⃣ **స్థితి తెలుసుకోండి**: '2' నొక్కి మీ ID ఇవ్వండి.",

  thankYou: "🙏 Thank you! Your feedback helps us improve our service.\nమీ అమూల్యమైన ఫీడ్బ్యాక్ అందించినందుకు ధన్యవాదాలు."
};

// Internal memory for user states
let userStates = {};

/**
 * Main handler for all user inputs (WhatsApp or Web)
 */
async function handleUserInput(userId, input, type = 'text', metadata = {}) {
    try {
        // Clean input: remove punctuation like dots from STT, trim, and uppercase
        const rawText = (input || '').toString().trim().toUpperCase();
        const text = rawText.replace(/[.,!?;:]/g, ''); // Strip common punctuation
        
        console.log(`🤖 [LOGIC] User: ${userId} | Input: "${input}" -> Cleaned: "${text}"`);
        
        // Universal cancel
        if (['CANCEL', 'EXIT', 'STOP', 'రద్దు'].includes(text)) {
            delete userStates[userId];
            return { response: messages.cancelled, state: 'IDLE' };
        }

        // Initialize state if not exists
        if (!userStates[userId]) {
            userStates[userId] = { step: 'IDLE' };
        }

        const state = userStates[userId];

        // Welcome / Menu logic
        const isMenuTrigger = ['HI', 'HELLO', 'MENU', 'నమస్తే', 'START'].includes(text);
        const isOptionSelection = ['1', '2', '3', 'ONE', 'TWO', 'THREE', '౧', '౨', '౩'].includes(text);

        if (isMenuTrigger || (state.step === 'IDLE' && !isOptionSelection)) {
            state.step = 'IDLE';
            return { response: messages.welcome, state: 'IDLE' };
        }

        // Logic based on current step
        switch (state.step) {
            case 'IDLE':
                if (text === '1' || text === 'ONE' || text === '౧') {
                    state.step = 'AWAITING_DESCRIPTION';
                    return { response: messages.askComplaint, state: 'AWAITING_DESCRIPTION' };
                } else if (text === '2' || text === 'TWO' || text === '౨') {
                    state.step = 'AWAITING_STATUS_ID';
                    return { response: "🔍 *Please enter your Complaint ID (e.g., SG-GEN-SAN-W2-V-1735).*", state: 'AWAITING_STATUS_ID' };
                } else if (text === '3' || text === 'THREE' || text === '౩') {
                    return { response: messages.help, state: 'IDLE' };
                }
                break;

            case 'AWAITING_DESCRIPTION':
                state.description = input;
                state.step = 'AWAITING_NAME';
                return { response: messages.askName, state: 'AWAITING_NAME' };

            case 'AWAITING_NAME':
                state.name = input;
                state.step = 'AWAITING_LOCATION';
                return { response: messages.askLocation, state: 'AWAITING_LOCATION' };

            case 'AWAITING_LOCATION':
                if (metadata.location) {
                    state.lat = metadata.location.latitude;
                    state.lng = metadata.location.longitude;
                    state.address = metadata.location.address || 'Location Shared';
                    state.step = 'AWAITING_WARD';
                    return { response: messages.askWard, state: 'AWAITING_WARD' };
                }
                state.address = input;
                state.step = 'AWAITING_WARD';
                return { response: messages.askWard, state: 'AWAITING_WARD' };

            case 'AWAITING_WARD':
                let wardNum = text.replace('WARD', '').trim();
                // Map word numbers to digits
                const wordMap = { 'ONE': '1', 'TWO': '2', 'THREE': '3', 'FOUR': '4', 'FIVE': '5', 'SIX': '6', 'SEVEN': '7', 'EIGHT': '8', 'NINE': '9', 'TEN': '10' };
                state.ward = wordMap[wardNum] || wardNum;
                state.step = 'AWAITING_IMAGE';
                return { response: messages.askImage, state: 'AWAITING_IMAGE' };

            case 'AWAITING_IMAGE':
                let mediaUrl = metadata.mediaUrl || null;
                const isSkip = ['SKIP', 'స్కిప్'].includes(text);

                if (!mediaUrl && !isSkip) {
                    return { response: "📸 Please upload a photo or type 'SKIP'.", state: 'AWAITING_IMAGE' };
                }

                // AI Processing & Saving
                try {
                    const aiResult = await analyzeAndCheckDuplicate({
                        description: state.description,
                        address: state.address
                    }, []);

                    // Use established Smart ID logic
                    const catPrefix = (aiResult.category || 'Other').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
                    const initials = (state.name || 'Anon').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                    const random = Math.floor(1000 + Math.random() * 9000);
                    const trackingId = `SG-GEN-${catPrefix}-W${state.ward}-${initials}-${random}`;

                    const payload = {
                        tracking_id: trackingId,
                        title: `[${trackingId}] ${aiResult.title || 'Complaint'}`,
                        description: state.description,
                        citizen_id: userId,
                        citizen_name: state.name,
                        ward: state.ward,
                        media_url: mediaUrl,
                        category: aiResult.category || 'General',
                        priority: aiResult.priority || 'Medium',
                        department: aiResult.department || 'Other',
                        address: state.address
                    };

                    const { data, error } = await supabase.from('complaints').insert([payload]).select().single();
                    if (error) throw error;

                    delete userStates[userId];

                    return { 
                        response: messages.registered({
                            id: trackingId,
                            name: state.name,
                            category: payload.category,
                            ward: state.ward,
                            address: state.address || 'Location Shared'
                        }),
                        state: 'IDLE',
                        complaintId: data.id
                    };
                } catch (err) {
                    logError('Chatbot Save Error:', err);
                    return { response: "❌ Error saving your complaint. Please try again later.", state: 'IDLE' };
                }

            case 'AWAITING_STATUS_ID':
                try {
                    const searchId = text.trim();
                    info(`🔍 [SEARCH] Looking for ID: ${searchId}`);
                    
                    const { data: complaint, error } = await supabase
                        .from('complaints')
                        .select('*')
                        .ilike('tracking_id', searchId)
                        .order('created_at', { ascending: false })
                        .limit(1);

                    if (error || !complaint || complaint.length === 0) {
                        return { response: messages.invalidId, state: 'AWAITING_STATUS_ID' };
                    }

                    const found = complaint[0];
                    delete userStates[userId];
                    
                    return { 
                        response: `📊 *Status Details / స్థితి వివరాలు:*
---------------------------------------
🆔 *ID:* ${found.tracking_id}
📂 *Category / విభాగం:* ${found.category}
🏘️ *Ward No / వార్డు:* ${found.ward}
📊 *Status / స్థితి:* ${found.status}
🕒 *Updated / అప్డేట్:* ${new Date(found.updated_at || found.created_at).toLocaleString()}

Reply with 'Hi' to return to menu.
మెనూకు తిరిగి వెళ్లడానికి 'Hi' అని రిప్లై ఇవ్వండి.`,
                        state: 'IDLE'
                    };
                } catch (err) {
                    return { response: messages.invalidId, state: 'AWAITING_STATUS_ID' };
                }
        }

        return { response: messages.welcome, state: 'IDLE' };
    } catch (err) {
        logError('Chatbot Error:', err);
        return { response: "Sorry, I encountered an error. Please type 'Hi' to restart.", state: 'IDLE' };
    }
}

module.exports = { handleUserInput };
