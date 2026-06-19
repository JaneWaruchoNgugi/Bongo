import React, { useEffect, useState } from 'react';
import { subscribeProgress, type ProgressDoc } from '../../lib/learn';
import { evaluateAchievements } from '../../lib/achievements';
import { useActiveProfile } from './useProfile';

const AchievementsPage: React.FC = () => {
  const { accountId, profile } = useActiveProfile();
  const [progress, setProgress] = useState<ProgressDoc>({});

  useEffect(() => {
    if (!accountId || !profile) return;
    return subscribeProgress(accountId, profile.id, setProgress);
  }, [accountId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return null;

  const items = evaluateAchievements(progress);
  const unlocked = items.filter(a => a.unlocked).length;

  return (
    <div className="lx-page">
      <header className="lx-page-head">
        <h1>Achievements</h1>
        <p>{unlocked} of {items.length} unlocked — keep going to earn them all!</p>
      </header>

      <div className="lx-ach-grid">
        {items.map(a => (
          <div key={a.id} className={`lx-ach${a.unlocked ? ' unlocked' : ''}`} style={{ '--c': a.color } as React.CSSProperties}>
            <span className="lx-ach-badge">{a.icon}</span>
            <strong>{a.title}</strong>
            <span className="lx-ach-desc">{a.desc}</span>
            {a.unlocked ? (
              <span className="lx-ach-state">✓ Unlocked</span>
            ) : (
              <>
                <div className="ln-card-progress"><span style={{ width: `${a.pct}%` }} /></div>
                <span className="lx-ach-state">{Math.min(a.current, a.goal)}/{a.goal}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsPage;
