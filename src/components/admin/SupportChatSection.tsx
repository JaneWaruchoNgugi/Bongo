import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, MessageCircle, Search, Send } from 'lucide-react';
import {
  markReadForSupport,
  sendSupportMessage,
  setConversationStatus,
  subscribeConversations,
  subscribeMessages,
} from '../../lib/support';
import type { Conversation, Message } from '../../lib/types';
import { useStaffAuth } from './useStaffAuth';

const fmtTime = (ms: number | null) =>
  ms ? new Date(ms).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

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

      <div className="admin-chat-layout">
        {/* Conversation list */}
        <aside className="admin-chat-list">
          <label className="admin-search">
            <Search size={18} />
            <input
              placeholder="Search name, phone, message"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </label>

          <div className="admin-chat-threads">
            {filtered.length === 0 && <p className="admin-chat-empty">No conversations yet.</p>}
            {filtered.map(c => (
              <button
                key={c.id}
                type="button"
                className={`admin-chat-thread ${c.id === activeId ? 'is-active' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                <div className="admin-chat-thread-top">
                  <strong>{c.profileName}</strong>
                  {c.unreadForSupport > 0 && <span className="admin-chat-badge">{c.unreadForSupport}</span>}
                </div>
                <p>{c.lastMessage || 'No messages yet'}</p>
                <small>
                  {c.accountPhone || 'Guest'} · {fmtTime(c.lastMessageAt?.toMillis() ?? null)}
                  {c.status === 'closed' && ' · closed'}
                </small>
              </button>
            ))}
          </div>
        </aside>

        {/* Message thread */}
        <div className="admin-chat-thread-view">
          {!active ? (
            <div className="admin-chat-placeholder">
              <MessageCircle size={40} />
              <p>Select a conversation to reply.</p>
            </div>
          ) : (
            <>
              <header className="admin-chat-thread-header">
                <div>
                  <strong>{active.profileName}</strong>
                  <span>{active.accountPhone || 'Guest'}</span>
                </div>
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() =>
                    setConversationStatus(active.id, active.status === 'open' ? 'closed' : 'open')
                  }
                >
                  <CheckCircle size={16} />
                  {active.status === 'open' ? 'Mark resolved' : 'Reopen'}
                </button>
              </header>

              <div className="admin-chat-messages" ref={threadRef}>
                {messages.map(m => (
                  <div
                    key={m.id}
                    className={`admin-chat-bubble ${m.senderType === 'support' ? 'is-support' : 'is-user'}`}
                  >
                    <p>{m.text}</p>
                    <small>
                      {m.senderName} · {fmtTime(m.createdAt?.toMillis() ?? null)}
                    </small>
                  </div>
                ))}
              </div>

              <div className="admin-chat-composer">
                <textarea
                  rows={2}
                  placeholder="Type a reply…"
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
                  className="admin-primary-btn"
                  onClick={() => void handleSend()}
                  disabled={sending || !draft.trim()}
                >
                  <Send size={18} />
                  Send
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
