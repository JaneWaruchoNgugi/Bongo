import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Search, Star, Trash2, Trophy } from 'lucide-react';
import {
  deleteLeaderboardEntry,
  setLeaderboardFlags,
  subscribeLeaderboard,
  type LeaderboardEntry,
} from '../../lib/adminData';

const LeaderboardSection: React.FC = () => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => subscribeLeaderboard(setScores), []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return scores;
    return scores.filter(s =>
      (s.player ?? '').toLowerCase().includes(term) || (s.game ?? '').toLowerCase().includes(term)
    );
  }, [scores, search]);

  const toggleFeatured = (s: LeaderboardEntry) =>
    setLeaderboardFlags(s.id, { featured: !s.featured }).catch(() => {});

  const toggleFlagged = (s: LeaderboardEntry) =>
    setLeaderboardFlags(s.id, { flagged: !s.flagged }).catch(() => {});

  const remove = (s: LeaderboardEntry) => {
    if (window.confirm('Remove this score permanently?')) deleteLeaderboardEntry(s.id).catch(() => {});
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-header admin-header-actions">
        <div>
          <h2>Leaderboard</h2>
          <p>Live scores. Feature winners, flag suspicious entries, or remove invalid ones.</p>
        </div>
      </div>
      <div className="admin-toolbar">
        <label className="admin-search">
          <Search size={18} />
          <input placeholder="Search player or game" value={search} onChange={e => setSearch(e.target.value)} />
        </label>
        <button className="admin-secondary-btn" type="button" disabled>
          <Filter size={18} />
          Filter
        </button>
      </div>
      <div className="admin-leaderboard-list">
        {filtered.map((s, i) => (
          <article className={`admin-leaderboard-card ${s.flagged ? 'is-flagged' : ''}`} key={s.id}>
            <div className="admin-player-rank"><Trophy size={18} /></div>
            <div className="admin-player-main">
              <h3>{s.player ?? 'Unknown'} <span style={{ color: 'var(--muted)', fontWeight: 500 }}>#{i + 1}</span></h3>
              <p>{[s.game, s.grade].filter(Boolean).join(' · ') || '—'}</p>
            </div>
            <div className="admin-player-score">
              <strong>{(s.score ?? 0).toLocaleString()}</strong>
              <span>{s.points ?? 0} points</span>
            </div>
            <span className={`admin-status ${s.flagged ? 'is-off' : 'is-live'}`}>{s.flagged ? 'Flagged' : 'Valid'}</span>
            <div className="admin-row-actions">
              <button type="button" aria-label="Feature" onClick={() => toggleFeatured(s)} title="Feature in WinnerMarquee">
                <Star size={17} fill={s.featured ? 'currentColor' : 'none'} />
              </button>
              <button type="button" aria-label="Flag" onClick={() => toggleFlagged(s)} title="Flag / unflag">
                <Filter size={17} />
              </button>
              <button type="button" aria-label="Remove" onClick={() => remove(s)} title="Delete score">
                <Trash2 size={17} />
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="admin-chat-placeholder" style={{ minHeight: 180 }}>
            <Trophy size={34} />
            <p>{scores.length === 0 ? 'No scores recorded yet. Game scores will appear here once gameplay writes to the leaderboard.' : 'No matches.'}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default LeaderboardSection;
