import React from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';

const AudioPlayer = ({ isMuted, toggleMute, onReplay, hasLastAudio }) => {
  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={toggleMute}
        className={`p-2 rounded-lg transition-colors ${isMuted ? 'text-slate-400 bg-slate-100' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      
      <button 
        onClick={onReplay}
        disabled={!hasLastAudio}
        className={`p-2 rounded-lg transition-colors ${!hasLastAudio ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
        title="Replay last response"
      >
        <RotateCcw size={18} />
      </button>
    </div>
  );
};

export default AudioPlayer;
