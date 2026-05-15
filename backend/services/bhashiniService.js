const axios = require('axios');
require('dotenv').config();

const BHASHINI_API_KEY = process.env.BHASHINI_API_KEY;
const BHASHINI_USER_ID = process.env.BHASHINI_USER_ID;

/**
 * Text-to-Speech (TTS) using Bhashini API
 * @param {string} text - Text to convert to speech
 * @param {string} langCode - Language code (e.g. 'te' for Telugu)
 * @returns {string} - Base64 encoded audio data
 */
async function tts(text, langCode = 'te') {
    try {
        if (!BHASHINI_API_KEY || !BHASHINI_USER_ID) {
            console.warn('Bhashini credentials missing, skipping TTS');
            return null;
        }

        // 1. Get Pipeline Config
        const configResponse = await axios.post(
            'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline',
            {
                "pipelineTasks": [{ "taskType": "tts" }],
                "pipelineRequestConfig": { "pipelineId": "64392f052528751f805a5078" }
            },
            { headers: { "userID": BHASHINI_USER_ID, "ulcaApiKey": BHASHINI_API_KEY } }
        );

        const ttsModel = configResponse.data.pipelineResponseConfig[0].config[0];
        const callbackUrl = configResponse.data.pipelineInferenceAPIEndPoint.callbackUrl;
        const inferenceKey = configResponse.data.pipelineInferenceAPIEndPoint.inferenceApiKey.value;

        // 2. Request Inference
        const inferenceResponse = await axios.post(
            callbackUrl,
            {
                "pipelineTasks": [
                    {
                        "taskType": "tts",
                        "config": {
                            "language": { "sourceLanguage": langCode },
                            "serviceId": ttsModel.serviceId,
                            "gender": "female"
                        }
                    }
                ],
                "inputData": { "input": [{ "source": text }] }
            },
            { headers: { "Authorization": inferenceKey } }
        );

        const audioBase64 = inferenceResponse.data.pipelineResponse[0].audio[0].audioContent;
        return audioBase64;
    } catch (error) {
        console.error('Bhashini TTS Error:', error.response?.data || error.message);
        return null;
    }
}

module.exports = { tts };
