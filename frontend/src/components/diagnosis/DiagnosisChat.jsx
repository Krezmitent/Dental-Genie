import React, { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';

const DiagnosisChat = ({ reportId }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm your AI Dental Assistant. I've analyzed your diagnosis report. Do you have any questions about the findings or what they mean?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    
    const newMessages = [...messages, { id: Date.now().toString(), role: 'user', text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Exclude the welcome message from history to save tokens and keep it clean, or keep it.
      const history = messages.slice(1).map(m => ({ role: m.role, text: m.text }));
      
      const res = await api.post(`/diagnose/reports/${reportId}/chat`, {
        message: userText,
        history
      });

      if (res.data.success) {
        setMessages([...newMessages, { id: Date.now().toString(), role: 'model', text: res.data.data.text }]);
      } else {
        setMessages([...newMessages, { id: Date.now().toString(), role: 'model', text: 'Sorry, I encountered an error. Please try again later.', isError: true }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { id: Date.now().toString(), role: 'model', text: 'Connection error. Please ensure the AI service is online.', isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/30 overflow-hidden flex flex-col h-[500px]">
      <div className="bg-surface-container-high border-b border-outline-variant/30 p-4 flex items-center">
        <span className="material-symbols-outlined text-primary mr-3 text-[24px]">smart_toy</span>
        <h3 className="font-display font-semibold text-on-surface">Medical Assistant</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-primary-container text-on-primary-container rounded-tr-none' 
                  : msg.isError 
                    ? 'bg-error-container/20 text-error border border-error/50 rounded-tl-none'
                    : 'bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-tl-none'
              }`}
            >
              <p className="text-sm font-body leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface-container-highest border border-outline-variant/30 p-4 rounded-2xl rounded-tl-none flex space-x-2">
              <div className="w-2 h-2 bg-on-surface-variant/50 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-on-surface-variant/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-on-surface-variant/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your diagnosis..."
            disabled={isLoading}
            className="w-full bg-surface-container border border-outline-variant rounded-full py-3 pl-4 pr-12 text-on-surface font-body placeholder:text-on-surface-variant/50 input-glow focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px] ml-0.5 mt-0.5">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default DiagnosisChat;
