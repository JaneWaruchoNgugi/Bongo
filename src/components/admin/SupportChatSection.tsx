import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckCheck, MessageCircle, Search, Send } from 'lucide-react';
import {
  markReadForSupport,
  sendSupportMessage,
  setConversationStatus,
  subscribeConversations,
  subscribeMessages,
} from '../../lib/support';
import type { Conversation, Message } from '../../lib/types';
import { useStaffAuth } from './useStaffAuth';

const fmtClock = (ms: number | null) =>
  ms ? new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

// WhatsApp-style list timestamp: time if today, otherwise short date.
const fmtListTime = (ms: number | null) => {
  if (!ms) return '';
  const d = new Date(ms);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// Date divider label for the message thread.
const fmtDay = (ms: number | null) => {
  if (!ms) return '';
  const d = new Date(ms);
  const now = new Date();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const initials = (name: string) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const SupportChatSection: React.FC = () => {
  const { staff } = useStaffAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  // Live conversation list.
  useEffect(() => subscribeConversations(setConversations), []);

  // Live messages for the selected conversation + clear support unread.
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    markReadForSupport(activeId).catch(() => {});
    return subscribeMessages(activeId, setMessages);
  }, [activeId]);

  // Auto-scroll to newest message.
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      c =>
        c.profileName.toLowerCase().includes(q) ||
        c.accountPhone.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const active = conversations.find(c => c.id === activeId) ?? null;

  const handleSend = async () => {
    if (!activeId || !draft.trim() || !staff) return;
    setSending(true);
    try {
      await sendSupportMessage(activeId, draft, { uid: staff.uid, name: staff.name });
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="admin-panel admin-chat-panel">
      <div className="admin-panel-header admin-header-actions">
        <div>
          <h2>Support Chat</h2>
          <p>Live conversations from students using the in-app chat widget.</p>
        </div>
        <span className="admin-status is-live">
          <MessageCircle size={15} />
          {conversations.filter(c => c.status === 'open').length} open
        </span>
      </div>

      <div className="wa">
        {/* Conversation list */}
        <aside className="wa-side">
          <div className="wa-search">
            <Search size={16} />
            <input
              placeholder="Search or start a new chat"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="wa-list">
            {filtered.length === 0 && <p className="wa-list-empty">No conversations yet.</p>}
            {filtered.map(c => {
              const last = c.lastMessageAt?.toMillis() ?? null;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`wa-row ${c.id === activeId ? 'is-active' : ''}`}
                  onClick={() => setActiveId(c.id)}
                >
                  <span className="wa-avatar">{initials(c.profileName)}</span>
                  <div className="wa-row-body">
                    <div className="wa-row-top">
                      <span className="wa-row-name">{c.profileName}</span>
                      <span className={`wa-row-time ${c.unreadForSupport > 0 ? 'is-unread' : ''}`}>
                        {fmtListTime(last)}
                      </span>
                    </div>
                    <div className="wa-row-bottom">
                      <span className="wa-row-preview">
                        {c.status === 'closed' && <span className="wa-row-resolved">✓ resolved · </span>}
                        {c.lastMessage || 'No messages yet'}
                      </span>
                      {c.unreadForSupport > 0 && (
                        <span className="wa-unread">{c.unreadForSupport}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Message thread */}
        <div className="wa-main">
          {!active ? (
            <div className="wa-empty">
              <MessageCircle size={56} strokeWidth={1.25} />
              <p className="wa-empty-title">Support Chat</p>
              <p className="wa-empty-sub">Select a conversation to read and reply.</p>
            </div>
          ) : (
            <>
              <header className="wa-header">
                <span className="wa-avatar">{initials(active.profileName)}</span>
                <div className="wa-header-info">
                  <strong>{active.profileName}</strong>
                  <span>{active.accountPhone || 'Guest'}</span>
                </div>
                <button
                  type="button"
                  className="wa-resolve"
                  onClick={() =>
                    setConversationStatus(active.id, active.status === 'open' ? 'closed' : 'open')
                  }
                >
                  <Check size={15} />
                  {active.status === 'open' ? 'Mark resolved' : 'Reopen'}
                </button>
              </header>

              <div className="wa-messages" ref={threadRef}>
                {(() => {
                  // The trailing `unreadForUser` support messages haven't been read
                  // by the student yet → gray ticks; earlier ones → blue (read).
                  const unread = active.unreadForUser ?? 0;
                  const supportIds = messages.filter(m => m.senderType === 'support').map(m => m.id);
                  const unreadIds = new Set(unread > 0 ? supportIds.slice(-unread) : []);
                  return messages.map((m, i) => {
                    const ms = m.createdAt?.toMillis() ?? null;
                    const prevMs = i > 0 ? messages[i - 1].createdAt?.toMillis() ?? null : null;
                    const showDay =
                      i === 0 ||
                      (ms && prevMs && new Date(ms).toDateString() !== new Date(prevMs).toDateString());
                    const out = m.senderType === 'support';
                    const read = out && !unreadIds.has(m.id);
                    return (
                      <React.Fragment key={m.id}>
                        {showDay && (
                          <div className="wa-day">
                            <span>{fmtDay(ms)}</span>
                          </div>
                        )}
                        <div className={`wa-bubble ${out ? 'out' : 'in'}`}>
                          <span className="wa-bubble-text">{m.text}</span>
                          <span className="wa-bubble-meta">
                            {fmtClock(ms)}
                            {out && <CheckCheck size={14} className={`wa-tick ${read ? 'read' : ''}`} />}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  });
                })()}
              </div>

              <div className="wa-composer">
                <textarea
                  rows={1}
                  className="wa-input"
                  placeholder="Type a message"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <button
                  type="button"
                  className="wa-send"
                  onClick={() => void handleSend()}
                  disabled={sending || !draft.trim()}
                  aria-label="Send"
                >
                  <Send size={20} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default SupportChatSection;
