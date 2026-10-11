import React, { useState, useEffect, useRef } from 'react';
import { 
  FiCpu as FiBot, 
  FiX, 
  FiSend, 
  FiMaximize2, 
  FiMinimize2, 
  FiRefreshCw, 
  FiCopy, 
  FiCheck,
  FiShield,
  FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AiChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Welcome to **CivicEvidence AI Forensic Assistant**. How can I assist your investigation today?\n\nTry asking about **live evidence statistics**, **recent uploads**, **audit logs**, or **NIST forensic compliance guidelines**.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatEndRef = useRef(null);

  const quickPrompts = [
    "📊 Show live system stats",
    "🔍 Recent evidence uploads",
    "📜 Recent audit trail",
    "🛡️ NIST forensic guidelines",
    "🔐 How does SHA-256 work?"
  ];

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSendPrompt = async (promptToSend) => {
    const text = promptToSend || inputPrompt;
    if (!text.trim() || loading) return;

    const userMsg = {
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!promptToSend) setInputPrompt('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { prompt: text });
      const data = res.data;

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: data.reply,
          source: data.source,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('AI Chat Request Error:', err);
      const errMsg = err.response?.data?.message || err.message || "Unable to reach CivicEvidence AI service.";
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `⚠️ **Network Error**: ${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Response copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="ai-assistant-wrapper">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button 
          className="ai-trigger-btn animate-bounce-subtle"
          onClick={() => setIsOpen(true)}
          title="Open AI Forensic Assistant"
        >
          <div className="ai-icon-glow">
            <FiBot className="ai-btn-icon" />
          </div>
          <span className="ai-btn-label">AI Assistant</span>
          <span className="ai-online-dot"></span>
        </button>
      )}

      {/* AI Chat Drawer / Window */}
      {isOpen && (
        <div className={`ai-chat-window ${isExpanded ? 'expanded' : ''} animate-fade-in`}>
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-avatar">
                <FiBot />
              </div>
              <div>
                <h4 className="ai-title">CivicEvidence AI</h4>
                <div className="ai-status">
                  <span className="status-dot"></span>
                  <span className="status-text">Forensic Intelligence Engine</span>
                </div>
              </div>
            </div>
            <div className="ai-header-actions">
              <button 
                className="ai-action-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
              </button>
              <button 
                className="ai-action-btn close"
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="ai-quick-prompts">
            {quickPrompts.map((qp, idx) => (
              <button 
                key={idx} 
                className="quick-chip"
                onClick={() => handleSendPrompt(qp.replace(/^[^\w\s]+/, '').trim())}
                disabled={loading}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message-row ${msg.sender}`}>
                {msg.sender === 'ai' && (
                  <div className="msg-avatar">
                    <FiBot />
                  </div>
                )}
                <div className="msg-bubble">
                  <div className="msg-text">
                    {msg.text.split('\n').map((line, lIdx) => {
                      // Basic Markdown formatting
                      if (line.startsWith('### ')) {
                        return <h5 key={lIdx} className="msg-h3">{line.replace('### ', '')}</h5>;
                      }
                      if (line.startsWith('- ')) {
                        return <li key={lIdx} className="msg-li">{line.replace('- ', '')}</li>;
                      }
                      if (line.startsWith('> ')) {
                        return <div key={lIdx} className="msg-quote">{line.replace('> ', '')}</div>;
                      }
                      return <p key={lIdx}>{line}</p>;
                    })}
                  </div>

                  <div className="msg-footer">
                    <span className="msg-time">{msg.timestamp}</span>
                    {msg.sender === 'ai' && (
                      <button 
                        className="copy-btn" 
                        onClick={() => handleCopyText(msg.text, index)}
                        title="Copy Response"
                      >
                        {copiedIndex === index ? <FiCheck className="copied" /> : <FiCopy />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-row ai">
                <div className="msg-avatar">
                  <FiBot />
                </div>
                <div className="msg-bubble loading">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="loading-text">Analyzing evidence database...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <form 
            className="ai-chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
          >
            <input 
              type="text"
              className="ai-input"
              placeholder="Ask AI about evidence, cases, audit logs..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="ai-send-btn"
              disabled={!inputPrompt.trim() || loading}
            >
              <FiSend />
            </button>
          </form>
        </div>
      )}

      {/* Styled JSX */}
      <style dangerouslySetInnerHTML={{ __html: `
        .ai-assistant-wrapper {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .ai-trigger-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50px;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(79, 70, 229, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ai-trigger-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 30px rgba(79, 70, 229, 0.6);
        }

        .ai-icon-glow {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .ai-btn-label {
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.3px;
        }

        .ai-online-dot {
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
        }

        /* Chat Window Container */
        .ai-chat-window {
          width: 380px;
          height: 540px;
          background: var(--bg-secondary, #1e293b);
          border: 1px solid var(--card-border, rgba(255, 255, 255, 0.1));
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .ai-chat-window.expanded {
          width: 580px;
          height: 680px;
        }

        /* Header */
        .ai-chat-header {
          padding: 14px 18px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.05) 100%);
          border-bottom: 1px solid var(--card-border, rgba(255, 255, 255, 0.1));
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ai-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ai-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .ai-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary, #f8fafc);
        }

        .ai-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-secondary, #94a3b8);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
        }

        .ai-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ai-action-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary, #94a3b8);
          font-size: 16px;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .ai-action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary, #fff);
        }

        .ai-action-btn.close:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        /* Quick Prompts Bar */
        .ai-quick-prompts {
          padding: 8px 12px;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          background: var(--bg-tertiary, rgba(15, 23, 42, 0.4));
          border-bottom: 1px solid var(--card-border, rgba(255, 255, 255, 0.05));
          scrollbar-width: none;
        }

        .ai-quick-prompts::-webkit-scrollbar {
          display: none;
        }

        .quick-chip {
          white-space: nowrap;
          font-size: 11px;
          padding: 5px 10px;
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-chip:hover {
          background: rgba(99, 102, 241, 0.25);
          color: #a5b4fc;
          border-color: rgba(99, 102, 241, 0.4);
        }

        /* Chat Body */
        .ai-chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .message-row {
          display: flex;
          gap: 10px;
          max-width: 88%;
        }

        .message-row.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-row.ai {
          align-self: flex-start;
        }

        .msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 14px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .msg-bubble {
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
          position: relative;
        }

        .message-row.user .msg-bubble {
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
          color: #ffffff;
          border-bottom-right-radius: 2px;
        }

        .message-row.ai .msg-bubble {
          background: var(--bg-tertiary, #0f172a);
          color: var(--text-primary, #e2e8f0);
          border: 1px solid var(--card-border, rgba(255, 255, 255, 0.08));
          border-bottom-left-radius: 2px;
        }

        .msg-text p {
          margin: 0 0 6px 0;
        }

        .msg-text p:last-child {
          margin-bottom: 0;
        }

        .msg-h3 {
          margin: 6px 0 8px 0;
          font-weight: 700;
          color: #818cf8;
          font-size: 13px;
        }

        .msg-li {
          margin-left: 14px;
          list-style-type: disc;
          margin-bottom: 4px;
        }

        .msg-quote {
          border-left: 3px solid #6366f1;
          padding-left: 8px;
          margin: 6px 0;
          font-style: italic;
          color: #94a3b8;
          background: rgba(99, 102, 241, 0.08);
          border-radius: 0 4px 4px 0;
        }

        .msg-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 6px;
          padding-top: 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .msg-time {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
        }

        .copy-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          font-size: 12px;
          padding: 2px;
          transition: color 0.2s;
        }

        .copy-btn:hover {
          color: #fff;
        }

        .copy-btn .copied {
          color: #10b981;
        }

        /* Loading Dots */
        .msg-bubble.loading {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
        }

        .typing-dots span {
          width: 6px;
          height: 6px;
          background: #818cf8;
          border-radius: 50%;
          animation: blink 1.4s infinite both;
        }

        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }

        .loading-text {
          font-size: 12px;
          color: #94a3b8;
        }

        /* Input Form */
        .ai-chat-input-form {
          padding: 12px;
          background: var(--bg-secondary, #1e293b);
          border-top: 1px solid var(--card-border, rgba(255, 255, 255, 0.1));
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-input {
          flex: 1;
          background: var(--bg-tertiary, #0f172a);
          border: 1px solid var(--card-border, rgba(255, 255, 255, 0.15));
          border-radius: 20px;
          padding: 10px 16px;
          color: var(--text-primary, #fff);
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }

        .ai-input:focus {
          border-color: #6366f1;
        }

        .ai-send-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: transform 0.2s, opacity 0.2s;
        }

        .ai-send-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .ai-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}} />
    </div>
  );
};

export default AiChatAssistant;
