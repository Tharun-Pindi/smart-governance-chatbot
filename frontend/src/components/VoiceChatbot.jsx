import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Modular Components
import VoiceRecorder from './VoiceRecorder';
import AudioPlayer from './AudioPlayer';
import ChatBubble from './ChatBubble';

const VoiceChatbot = () => {
  const [messages, setMessages] = useState([
    { role: 'bot', text: '👋 Hello! I am your Smart Governance Assistant. How can I help you today?\n👋 నమస్తే! నేను మీ స్మార్ట్ గవర్నెన్స్ అసిస్టెంట్‌ని. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId] = useState(() => `web-${Math.random().toString(36).substring(7)}`);
  const [lastAudio, setLastAudio] = useState(null);
  const [transcriptionPreview, setTranscriptionPreview] = useState(null);

  const messagesEndRef = useRef(null);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const playAudio = (base64Audio) => {
    if (isMuted || !base64Audio) return;

    const audioUrl = `data:audio/wav;base64,${base64Audio}`;
    audioRef.current.src = audioUrl;
    audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    setLastAudio(base64Audio);
  };

  const handleSendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);
    setTranscriptionPreview(null);

    try {
      const response = await axios.post('http://localhost:5001/api/chat', {
        userId,
        message: text
      });

      const { response: botText, audio: responseAudio } = response.data;
      const botMessage = { role: 'bot', text: botText, hasAudio: !!responseAudio };

      setMessages(prev => [...prev, botMessage]);
      if (responseAudio) {
        playAudio(responseAudio);
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I am having trouble connecting to the server.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceRecord = async (audioBlob) => {
    setIsProcessing(true);
    setTranscriptionPreview("Transcribing...");

    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice_note.webm');
    formData.append('userId', userId);

    try {
      const response = await axios.post('http://localhost:5001/api/chat/voice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { transcribedText, response: botText, audio: responseAudio } = response.data;

      setMessages(prev => [
        ...prev,
        { role: 'user', text: transcribedText, transcription: transcribedText },
        { role: 'bot', text: botText, hasAudio: !!responseAudio }
      ]);

      if (responseAudio) {
        playAudio(responseAudio);
      }
    } catch (error) {
      console.error('Voice Chat Error:', error);
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I could not process your voice note.' }]);
    } finally {
      setIsProcessing(false);
      setTranscriptionPreview(null);
    }
  };

  const replayLastMessage = () => {
    if (lastAudio) {
      playAudio(lastAudio);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-4 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
            <Sparkles className="text-yellow-300" size={24} />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Governance Assistant</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
              <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Local Whisper AI Active</span>
            </div>
          </div>
        </div>

        <AudioPlayer
          isMuted={isMuted}
          toggleMute={() => setIsMuted(!isMuted)}
          onReplay={replayLastMessage}
          hasLastAudio={!!lastAudio}
        />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <ChatBubble key={idx} message={msg} onReplay={() => playAudio(lastAudio)} />
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
              <div className="relative">
                <Loader2 size={18} className="animate-spin text-indigo-600" />
                <div className="absolute inset-0 animate-ping opacity-20 bg-indigo-600 rounded-full"></div>
              </div>
              <span className="text-sm text-slate-500 font-semibold italic">
                {transcriptionPreview || "Assistant is thinking..."}
              </span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-center gap-4 bg-slate-100/80 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white transition-all shadow-inner">
          <VoiceRecorder
            onRecordComplete={handleVoiceRecord}
            disabled={isProcessing}
          />

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message or hold mic..."
            className="flex-1 bg-transparent border-none focus:outline-none text-slate-700 font-medium placeholder:text-slate-400 py-2"
            disabled={isProcessing}
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isProcessing}
            className={`p-3 rounded-xl transition-all ${inputText.trim() && !isProcessing
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95'
                : 'text-slate-300'
              }`}
          >
            <Send size={20} />
          </button>
        </div>
        <div className="mt-3 flex justify-center items-center gap-2">
          <div className="h-[1px] w-8 bg-slate-200"></div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            Bilingual Voice Support Enabled
          </p>
          <div className="h-[1px] w-8 bg-slate-200"></div>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatbot;
