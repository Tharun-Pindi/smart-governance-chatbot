require('dotenv').config();
const twilio = require('twilio');

async function testTwilio() {
    console.log("Testing Twilio Credentials...");
    console.log("SID:", process.env.TWILIO_SID);
    console.log("Phone:", process.env.TWILIO_PHONE);

    try {
        const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        const account = await client.api.v2010.accounts(process.env.TWILIO_SID).fetch();
        console.log("SUCCESS! Connected to Twilio Account:", account.friendlyName);
    } catch (error) {
        console.error("FAILURE! Twilio Error:", error.message);
    }
}

testTwilio();
