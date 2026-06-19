import React, { useEffect, useState } from 'react';
import { Send, Users } from 'lucide-react';
import { createPost, subscribeCommunity, type CommunityPost } from '../../lib/community';
import { useActiveProfile } from './useProfile';

const timeAgo = (ms?: number): string => {
  if (!ms) return 'just now';
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const CommunityPage: React.FC = () => {
  const { profile } = useActiveProfile();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => subscribeCommunity(setPosts), []);

  if (!profile) return null;

  const submit = async () => {
    const body = text.trim();
    if (!body || posting) return;
    setPosting(true);
    await createPost({
      authorName: profile.username,
      grade: `Grade ${profile.grade}`,
      text: body,
      profileId: profile.id,
    }).catch(() => {});
    setText('');
    setPosting(false);
  };

  return (
    <div className="lx-page">
      <header className="lx-page-head">
        <h1>Community</h1>
        <p>Share wins, ask questions and cheer each other on.</p>
      </header>

      <div className="lx-post-box">
        <span className="lx-avatar">{profile.username.charAt(0).toUpperCase()}</span>
        <textarea
          value={text}
          maxLength={500}
          placeholder="Share something with other learners…"
          onChange={e => setText(e.target.value)}
        />
        <button className="ln-btn ln-btn-primary" onClick={submit} disabled={!text.trim() || posting}>
          <Send size={16} /> Post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="ln-empty-card"><Users size={36} /><p>No posts yet. Be the first to say hello!</p></div>
      ) : (
        <div className="lx-feed">
          {posts.map(p => (
            <div key={p.id} className="lx-post">
              <span className="lx-avatar">{(p.authorName ?? '?').charAt(0).toUpperCase()}</span>
              <div className="lx-post-body">
                <div className="lx-post-meta">
                  <strong>{p.authorName}</strong>
                  {p.grade && <span className="lx-post-grade">{p.grade}</span>}
                  <span className="lx-post-time">{timeAgo(p.createdAt?.toMillis?.())}</span>
                </div>
                <p>{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
