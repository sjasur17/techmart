import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { reportsService } from '../api/services';
import { useAuthStore } from '../store/useAuthStore';
import { Send, Sparkles, User, Loader2, Trash2, Clock, History, X, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string | number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const LEGACY_STORAGE_KEY = 'techmart-ai-chat-history';

const makeStorageKey = (userId?: number) =>
  userId ? `techmart-ai-chat-history:${userId}` : `${LEGACY_STORAGE_KEY}:guest`;

const createMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const isValidMessage = (item: unknown): item is ChatMessage => {
  if (!item || typeof item !== 'object') return false;
  const msg = item as ChatMessage;
  return (
    (typeof msg.id === 'string' || typeof msg.id === 'number') &&
    (msg.role === 'user' || msg.role === 'assistant') &&
    typeof msg.content === 'string' &&
    typeof msg.timestamp === 'number'
  );
};

const loadHistory = (storageKey: string): ChatMessage[] => {
  try {
    const scoped = localStorage.getItem(storageKey);
    if (scoped) {
      const parsed = JSON.parse(scoped);
      if (Array.isArray(parsed)) {
        return parsed.filter(isValidMessage);
      }
    }

    // Backward-compatible fallback for older builds.
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (Array.isArray(parsedLegacy)) {
        return parsedLegacy.filter(isValidMessage);
      }
    }
  } catch {}
  return [];
};

const saveHistory = (storageKey: string, msgs: ChatMessage[]) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(msgs.slice(-100)));
  } catch {}
};

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDay = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

// Group messages by date
const groupByDay = (msgs: ChatMessage[]) => {
  const groups: { day: string; msgs: ChatMessage[] }[] = [];
  msgs.forEach((msg) => {
    const day = formatDay(msg.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.msgs.push(msg);
    else groups.push({ day, msgs: [msg] });
  });
  return groups;
};

// Extract the first user message of each day as a "session" title
const getSessionTitle = (msgs: ChatMessage[]) => {
  const userMsg = msgs.find(m => m.role === 'user');
  if (!userMsg) return 'New conversation';
  return userMsg.content.length > 50
    ? userMsg.content.slice(0, 47) + '...'
    : userMsg.content;
};

export const AIAssistant = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const storageKey = React.useMemo(() => makeStorageKey(user?.id), [user?.id]);
  const hydratedRef = useRef(false);
  const [showHistory, setShowHistory] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hist = loadHistory(storageKey);
    if (hist.length > 0) {
      setMessages(hist);
    } else {
      setMessages([
        {
          id: createMessageId(),
          role: 'assistant',
          content: t('ai.welcome').replace('<br/>', '\n'),
          timestamp: Date.now(),
        },
      ]);
    }
    hydratedRef.current = true;
  }, [storageKey, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    saveHistory(storageKey, messages);
  }, [messages, storageKey]);

  const chatMutation = useMutation({
    mutationFn: (message: string) => reportsService.askAssistant(message),
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: createMessageId(), role: 'assistant', content: data.reply, timestamp: Date.now(),
      }]);
    },
    onError: (error: any) => {
      setMessages(prev => [...prev, {
        id: createMessageId(),
        role: 'assistant',
        content: `Sorry, an error occurred: ${error.response?.data?.error || error.message}`,
        timestamp: Date.now(),
      }]);
    },
  });

  const handleClear = () => {
    const welcome: ChatMessage = {
      id: createMessageId(), role: 'assistant',
      content: t('ai.welcome').replace('<br/>', '\n'),
      timestamp: Date.now(),
    };
    setMessages([welcome]);
    localStorage.removeItem(storageKey);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: createMessageId(), role: 'user', content: userMsg, timestamp: Date.now() }]);
    chatMutation.mutate(userMsg);
  };

  const grouped = groupByDay(messages);

  // History sessions = one per day group
  const sessions = grouped.map(g => ({
    day: g.day,
    title: getSessionTitle(g.msgs),
    count: g.msgs.filter(m => m.role === 'user').length,
    timestamp: g.msgs[0].timestamp,
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-[linear-gradient(135deg,#000000,#434343)] p-3 rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.15)] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {t('ai.title')}
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {t('ai.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* History toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            title="Show conversation history"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
              showHistory
                ? 'bg-primary text-white border-primary'
                : 'text-textMain/60 border-borderBase hover:border-primary/40 hover:text-primary'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
          {/* Clear */}
          <button
            onClick={handleClear}
            title="Clear conversation"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-borderBase text-textMain/50 hover:text-red-500 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* History sidebar */}
        {showHistory && (
          <div
            className="w-72 shrink-0 rounded-2xl border flex flex-col overflow-hidden"
            style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }}
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Conversation History
              </span>
              <button onClick={() => setShowHistory(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-textMain/40">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto py-2">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-textMain/30 text-sm">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                  No history yet
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.day}
                    className="px-3 py-2"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-textMain/35 font-semibold px-2 mb-1">
                      {session.day}
                    </div>
                    <button
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-primary/5 transition-colors group"
                      onClick={() => {
                        // Scroll to the first message of that day
                        setShowHistory(false);
                      }}
                    >
                      <p className="text-sm font-medium text-textMain/80 truncate group-hover:text-primary transition-colors">
                        {session.title}
                      </p>
                      <p className="text-xs text-textMain/40 mt-0.5">
                        {session.count} message{session.count !== 1 ? 's' : ''}
                      </p>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-card border border-borderBase rounded-2xl overflow-hidden shadow-soft">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4"
            style={{ background: 'var(--color-page)' }}>
            {grouped.map(({ day, msgs }) => (
              <div key={day}>
                {/* Day separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-borderBase" />
                  <span className="flex items-center gap-1.5 text-xs text-textMain/40 font-medium px-3 py-1 bg-card rounded-full border border-borderBase">
                    <Clock className="w-3 h-3" />
                    {day}
                  </span>
                  <div className="flex-1 h-px bg-borderBase" />
                </div>

                <div className="space-y-6">
                  {msgs.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,#000000,#434343)] flex items-center justify-center shrink-0 shadow-md">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-5 py-3.5 text-[15px] leading-relaxed shadow-sm transition-all duration-300 ${
                          msg.role === 'assistant'
                            ? 'bg-white border border-gray-100 text-gray-800 rounded-3xl rounded-tl-sm shadow-[0_4px_16px_rgba(0,0,0,0.04)]'
                            : 'bg-gradient-to-tr from-[#007AFF] to-[#0056b3] text-white rounded-3xl rounded-tr-sm shadow-[0_4px_16px_rgba(0,122,255,0.2)]'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert
                              prose-headings:font-bold prose-headings:text-textMain prose-headings:mt-3 prose-headings:mb-1
                              prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
                              prose-p:my-1 prose-p:leading-relaxed
                              prose-strong:font-semibold prose-strong:text-textMain
                              prose-ul:my-2 prose-ul:pl-4 prose-li:my-0.5
                              prose-ol:my-2 prose-ol:pl-4
                              prose-hr:my-3 prose-hr:border-borderBase
                              prose-code:bg-primary/8 prose-code:text-primary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                            ">
                              <ReactMarkdown>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                        <span className={`text-[10px] text-gray-400 font-medium px-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex gap-3 animate-fade-in-up">
                <div className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,#000000,#434343)] flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-3xl rounded-tl-sm px-5 py-4 flex items-center gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 sm:p-6 bg-transparent">
            <form onSubmit={handleSubmit} className="relative flex items-center shadow-[0_4px_24px_rgba(0,0,0,0.06)] rounded-[32px] bg-white border border-gray-100 p-1.5 focus-within:shadow-[0_4px_24px_rgba(0,0,0,0.1)] focus-within:border-gray-200 transition-all duration-300">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('ai.placeholder')}
                disabled={chatMutation.isPending}
                className="flex-1 bg-transparent border-none px-6 py-3.5 focus:outline-none text-[15px] text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || chatMutation.isPending}
                className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors shadow-sm"
              >
                {chatMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </button>
            </form>
            <p className="text-center text-xs text-textMain/30 mt-3">{t('ai.disclaimer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
