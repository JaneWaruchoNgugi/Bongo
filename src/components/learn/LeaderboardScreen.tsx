import React, { useEffect, useState } from 'react';
import { Crown, Star, Trophy } from 'lucide-react';
import { subscribeTopScores, type ScoreEntry } from '../../lib/learn';
import { useActiveProfile } from './useProfile';

const medal = ['🥇', '🥈', '🥉'];

const LeaderboardScreen: React.FC = () => {
  const { profile } = useActiveProfile();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [scope, setScope] = useState<'all' | 'grade'>('all');

  useEffect(() => subscribeTopScores(setScores), []);

  const rows = scope === 'grade' && profile
    ? scores.filter(s => s.grade === `Grade ${profile.grade}`)
    : scores;

  return (
    <div className="lx-page">
      <div className="lx-list-head">
        <div className="lx-page-head">
          <h1>Top Learners 🏆</h1>
          <p>Earn points by completing topics and exams.</p>
        </div>
        <div className="ln-segment">
          <button className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>All grades</button>
          <button className={scope === 'grade' ? 'active' : ''} onClick={() => setScope('grade')} disabled={!profile}>
            My grade
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="ln-empty-card">
          <Trophy size={36} />
          <p>No scores yet — be the first on the board!</p>
        </div>
      ) : (
        <div className="ln-board">
          {rows.map((s, i) => (
            <div key={s.id} className={`ln-board-row ${i < 3 ? 'top' : ''} ${s.player === profile?.username ? 'me' : ''}`}>
              <span className="ln-board-rank">{i < 3 ? medal[i] : i + 1}</span>
              <span className="ln-board-main">
                <strong>
                  {s.player ?? 'Player'}
                  {s.featured && <Star size={13} className="ln-feat" fill="currentColor" />}
                  {s.player === profile?.username && <span className="ln-you">you</span>}
                </strong>
                <small>{[s.grade, s.game].filter(Boolean).join(' · ')}</small>
              </span>
              <span className="ln-board-pts">{(s.points ?? 0).toLocaleString()} <em>pts</em></span>
              {i === 0 && <Crown size={18} className="ln-crown" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardScreen;
