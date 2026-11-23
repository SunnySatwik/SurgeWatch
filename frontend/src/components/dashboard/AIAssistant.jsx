import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bot, Send, Sparkles, Trash2, X } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What is the current overall surge risk?',
  'Which department is closest to capacity?',
  'Summarize the active alerts',
  'What does the latest 7-day forecast indicate?',
];

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setMessage('');
    setLoading(true);

    try {
      const history = [...messages, { role: 'user', content: trimmed }]
        .slice(-10)
        .map(item => ({ role: item.role, content: item.content }));
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history, hospitalId: 1 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Assistant request failed');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        facts: data.facts,
        recommendations: data.recommendations,
        toolsUsed: data.toolsUsed,
        confidence: data.confidence,
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I couldn't complete that request. ${error.message}`,
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className="fixed bottom-24 right-4 z-[80] w-[calc(100vw-2rem)] sm:w-[390px] h-[min(620px,calc(100vh-7rem))] rounded-[2rem] overflow-hidden bg-white/95 border border-white shadow-2xl shadow-slate-900/20 backdrop-blur-2xl flex flex-col"
          >
            <header className="px-5 py-4 border-b border-slate-200/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <Sparkles size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800">SurgeWatch Assistant</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Grounded data mode</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  aria-label="Clear chat"
                  onClick={() => setMessages([])}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  aria-label="Close assistant"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div>
                  <div className="mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <p className="text-sm font-bold text-slate-700">Ask about real operational data</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      The assistant reads hospital records and forecasts, but cannot perform database changes.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {SUGGESTED_QUESTIONS.map(question => (
                      <button
                        key={question}
                        onClick={() => sendMessage(question)}
                        className="w-full text-left px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-700 hover:bg-indigo-50/40 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((item, index) => (
                <div key={`${item.role}-${index}`} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                    item.role === 'user'
                      ? 'bg-slate-900 text-white rounded-br-md'
                      : item.error
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : 'bg-slate-50 text-slate-700 border border-slate-200/70 rounded-bl-md'
                  }`}>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{item.content}</p>
                    {item.facts?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/70">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Verified facts</p>
                        <ul className="space-y-1">
                          {item.facts.slice(0, 5).map((fact, factIndex) => (
                            <li key={factIndex} className="text-[10px] leading-relaxed">• {fact}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.recommendations?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/70">
                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 mb-1.5">AI recommendations</p>
                        <ul className="space-y-1">
                          {item.recommendations.slice(0, 4).map((recommendation, recommendationIndex) => (
                            <li key={recommendationIndex} className="text-[10px] leading-relaxed">• {recommendation}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.toolsUsed?.length > 0 && (
                      <p className="mt-2 text-[9px] font-bold text-slate-400">
                        Sources: {item.toolsUsed.join(', ')} · Confidence: {item.confidence}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:120ms]" />
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:240ms]" />
                      <span className="text-xs font-bold text-slate-400 ml-1">Retrieving and analyzing</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(message);
              }}
              className="p-3 border-t border-slate-200/70 bg-white/80"
            >
              <div className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-300 focus-within:bg-white transition-colors">
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={1500}
                  placeholder="Ask about current operations..."
                  className="min-w-0 flex-1 bg-transparent outline-none text-xs text-slate-700 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || loading}
                  aria-label="Send message"
                  className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(prev => !prev)}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        className="fixed bottom-5 right-5 z-[79] w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center"
      >
        {open ? <X size={21} /> : <Bot size={22} />}
      </motion.button>
    </>
  );
};

export default AIAssistant;
