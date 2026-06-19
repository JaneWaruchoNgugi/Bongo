import React, { useEffect, useRef, useState } from 'react';
import type { Unsubscribe } from 'firebase/firestore';
import { Headphones, Send, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  getOrCreateConversation,
  markReadForUser,
  sendUserMessage,
  subscribeMessages,
  subscribeMyConversation,
} from '../lib/support';
import type { Conversation, Message } from '../lib/types';
import '../styles/support-chat.css';

const fmtTime = (ms: number | null) =>
  ms ? new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

const SupportChatWidget: React.FC = () => {
  const user = useStore(s => s.user);
  const profileName =
    user?.profiles.find(p => p.id === user.activeProfileId)?.username ??
    user?.profiles[0]?.username ??
    'Guest';
  const accountPhone = user?.phone ?? '';

  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  // Track this visitor's conversation (created lazily on first message).
  useEffect(() => {
    let unsub: Unsubscribe | undefined;
    subscribeMyConversation(setConversation)
      .then(u => {
        unsub = u;
      })
      .catch(err => {
        // Most likely Anonymous auth isn't enabled yet — fail quietly.
        console.warn('[support-chat] could not initialize:', err?.code ?? err);
      });
    return () => unsub?.();
  }, []);

  // Stream messages for the conversation once it exists.
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }
    return subscribeMessages(conversation.id, setMessages);
  }, [conversation?.id]);

  // Clear unread badge while the panel is open.
  useEffect(() => {
    if (open && conversation && conversation.unreadForUser > 0) {
      markReadForUser(conversation.id).catch(() => {});
    }
  }, [open, conversation?.id, conversation?.unreadForUser]);

  // Auto-scroll to newest.
  useEffect(() => {
    if (open) threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages, open]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      let id = conversation?.id;
      if (!id) id = await getOrCreateConversation({ accountPhone, profileName });
      await sendUserMessage(id, text, profileName);
      setDraft('');
    } catch (err) {
      console.error('[support-chat] failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const unread = !open && conversation ? conversation.unreadForUser : 0;

  return (
    <>
      <button
        type="button"
        className={`support-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        {open ? <X size={22} /> : <Headphones size={22} />}
        {unread > 0 && <span className="support-fab-badge">{unread}</span>}
      </button>

      {open && (
        <section className="support-panel" role="dialog" aria-label="Support chat">
          <header className="support-panel-header">
            <span className="support-head-avatar">
              <Headphones size={18} />
            </span>
            <div className="support-head-info">
              <strong>HighScores Support</strong>
              <span>We usually reply within a few minutes</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close">
              <X size={18} />
            </button>
          </header>

          <div className="support-messages" ref={threadRef}>
            {messages.length === 0 && (
              <p className="support-welcome">
                👋 Hi {profileName}! Send us a message and our support team will get back to you.
              </p>
            )}
            {messages.map(m => (
              <div
                key={m.id}
                className={`support-bubble ${m.senderType === 'user' ? 'is-user' : 'is-support'}`}
              >
                <span className="support-bubble-text">{m.text}</span>
                <span className="support-bubble-time">{fmtTime(m.createdAt?.toMillis() ?? null)}</span>
              </div>
            ))}
          </div>

          <div className="support-composer">
            <textarea
              rows={1}
              placeholder="Type your message…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <button type="button" onClick={() => void handleSend()} disabled={sending || !draft.trim()} aria-label="Send">
              <Send size={18} />
            </button>
          </div>
        </section>
      )}
    </>
  );
};

export default SupportChatWidget;
