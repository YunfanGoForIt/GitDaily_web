import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, X, MessageSquareQuote } from 'lucide-react';

interface CommitMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
  title: string;
}

const CommitMessageModal: React.FC<CommitMessageModalProps> = ({ isOpen, onClose, onConfirm, title }) => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setIsListening(false);
    } else {
        stopListening();
    }
  }, [isOpen]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'zh-CN'; // Defaulting to Chinese based on requirement, or 'en-US'

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
          setMessage(prev => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleConfirm = () => {
      if (!message.trim()) return;
      onConfirm(message);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      <div className="relative z-10 bg-white w-full sm:w-[500px] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl pointer-events-auto transform transition-transform duration-300 animate-in slide-in-from-bottom-10">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-blue-600">
                <MessageSquareQuote size={24} className="mr-2" />
                <h2 className="text-xl font-bold">Commit Message</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
            </button>
        </div>

        <p className="text-sm text-gray-500 mb-4 font-medium">
            {title}
        </p>

        <div className="relative mb-6">
            <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message (Situation / Experience / Reflection / Plan)..."
                rows={5}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                autoFocus
            />
            
            <button 
                onClick={toggleListening}
                className={`absolute bottom-3 right-3 p-2 rounded-full shadow-sm transition-all duration-300 ${isListening ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
                title="Voice Input"
            >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
        </div>

        <button 
            onClick={handleConfirm}
            disabled={!message.trim()}
            className={`w-full py-4 rounded-full font-bold text-lg shadow-lg flex items-center justify-center transition-all active:scale-95 ${!message.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700'}`}
        >
            <Check size={24} className="mr-2" />
            Commit & Complete
        </button>
      </div>
    </div>
  );
};

export default CommitMessageModal;