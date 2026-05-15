import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Volume2, Waves } from 'lucide-react';

const ChatBubble = ({ message, onReplay }) => {
  const isBot = message.role === 'bot';
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
          isUser ? 'bg-indigo-600' : 'bg-white border border-slate-200'
        }`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-indigo-600" />}
        </div>

        {/* Bubble Content */}
        <div className="flex flex-col gap-1">
          {/* Transcription Preview (if any) */}
          {message.transcription && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full w-fit text-slate-500 text-[11px] font-medium italic border border-slate-200 ml-1">
              <Waves size={12} className="text-indigo-400" />
              <span>Transcribed: "{message.transcription}"</span>
            </div>
          )}

          <div className={`p-4 rounded-2xl shadow-sm relative group ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
          }`}>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
              {message.text.split('\n').map((line, i) => (
                <span key={i}>
                  {line.split(/(\*.*?\*)/).map((part, j) => {
                    if (part.startsWith('*') && part.endsWith('*')) {
                      return <strong key={j} className="font-bold text-indigo-900">{part.slice(1, -1)}</strong>;
                    }
                    return part;
                  })}
                  <br />
                </span>
              ))}
            </p>

            {/* Replay button on bot bubble */}
            {isBot && message.hasAudio && (
              <button 
                onClick={onReplay}
                className="absolute -right-10 top-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 rounded-full text-indigo-600 hover:bg-indigo-50 shadow-sm"
                title="Replay audio"
              >
                <Volume2 size={14} />
              </button>
            )}
          </div>
          
          <span className={`text-[10px] text-slate-400 font-medium px-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatBubble;
