const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { handleUserInput } = require('../services/chatbotService');
const { tts } = require('../services/bhashiniService');
const { transcribeAudio, extractTeluguText } = require('../services/voiceService');

// Multer setup for voice uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Common handler for generating voice responses
 */
async function getVoiceResponse(botResponse) {
    try {
        // 1. Extract only Telugu text for TTS
        const teluguOnlyText = await extractTeluguText(botResponse);

        if (!teluguOnlyText) return null;

        // 2. Call Bhashini TTS
        const audioBase64 = await tts(teluguOnlyText, 'te');
        return audioBase64;
    } catch (err) {
        console.error('Voice Response Error:', err.message);
        return null;
    }
}

// 💬 Text Chat Endpoint
router.post('/', async (req, res) => {
    const { userId, message, type, metadata } = req.body;

    if (!userId || !message) {
        return res.status(400).json({ error: 'userId and message are required' });
    }

    try {
        const result = await handleUserInput(userId, message, type, metadata);

        // Auto-generate Telugu voice for every response
        const audio = await getVoiceResponse(result.response);

        res.json({
            ...result,
            audio: audio
        });
    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 🎤 Voice Chat Endpoint (Whisper + Chatbot + TTS)
router.post('/voice', upload.single('audio'), async (req, res) => {
    const { userId } = req.body;
    const audioFile = req.file;

    if (!userId || !audioFile) {
        return res.status(400).json({ error: 'userId and audio file are required' });
    }

    const tempPath = audioFile.path;

    try {
        // 1. Transcribe using local Whisper
        const sttResult = await transcribeAudio(tempPath);
        const transcription = sttResult.text;

        if (!transcription) {
            return res.status(400).json({ error: 'Could not transcribe audio' });
        }

        // 2. Pass to existing chatbot logic
        const result = await handleUserInput(userId, transcription);

        // 3. Generate Telugu voice response
        const audio = await getVoiceResponse(result.response);

        // 4. Cleanup temp file
        fs.unlinkSync(tempPath);

        res.json({
            ...result,
            transcribedText: transcription,
            audio: audio
        });
    } catch (error) {
        console.error('Voice Chat Error:', error);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

module.exports = router;
