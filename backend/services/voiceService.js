const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PYTHON_PATH = 'python'; // Or path to your python executable
const WHISPER_SCRIPT = path.join(__dirname, '../scripts/whisperService.py');
const EXTRACTOR_SCRIPT = path.join(__dirname, '../scripts/teluguTextExtractor.py');

/**
 * Transcribes audio using local Whisper Python script
 */
async function transcribeAudio(audioPath) {
    return new Promise((resolve, reject) => {
        // Add local ffmpeg to PATH for the child process
        const env = { 
            ...process.env, 
            PATH: `${path.dirname(ffmpegPath)}${path.delimiter}${process.env.PATH}` 
        };
        
        const py = spawn(PYTHON_PATH, [WHISPER_SCRIPT, audioPath], { env });
        let dataString = '';

        py.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        py.stderr.on('data', (data) => {
            console.error(`Whisper Error: ${data}`);
        });

        py.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Whisper script exited with code ${code}`));
            }
            try {
                const result = JSON.parse(dataString);
                resolve(result);
            } catch (err) {
                reject(new Error('Failed to parse Whisper output: ' + dataString));
            }
        });
    });
}

/**
 * Extracts only Telugu text from a mixed string using Python regex
 */
async function extractTeluguText(text) {
    return new Promise((resolve, reject) => {
        const py = spawn(PYTHON_PATH, [EXTRACTOR_SCRIPT]);
        let dataString = '';

        py.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        py.stdin.write(JSON.stringify({ text }));
        py.stdin.end();

        py.on('close', (code) => {
            if (code !== 0) {
                return resolve(text); // Fallback to full text
            }
            try {
                const result = JSON.parse(dataString);
                resolve(result.teluguText || text);
            } catch (err) {
                resolve(text);
            }
        });
    });
}

module.exports = { transcribeAudio, extractTeluguText };
