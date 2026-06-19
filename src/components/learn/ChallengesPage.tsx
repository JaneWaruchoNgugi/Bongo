import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';
import {
  recordActivity,
  saveChallengeState,
  subscribeProgress,
  type ProgressDoc,
} from '../../lib/learn';
import { currentState, todaysChallenge } from '../../lib/challenges';
import { useActiveProfile } from './useProfile';

const ChallengesPage: React.FC = () => {
  const navigate = useNavigate();
  const { accountId, profile } = useActiveProfile();
  const [progress, setProgress] = useState<ProgressDoc>({});
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!accountId || !profile) return;
    return subscribeProgress(accountId, profile.id, setProgress);
  }, [accountId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return null;

  const challenge = todaysChallenge();
  const state = currentState(progress.challenge);
  const pct = Math.min(100, Math.round((state.progress / challenge.goal) * 100));

  const claim = async () => {
    if (!accountId || !state.completed || state.claimed || claiming) return;
    setClaiming(true);
    await saveChallengeState(accountId, profile.id, { ...state, claimed: true }).catch(() => {});
    await recordActivity(accountId, profile.id, { xp: challenge.rewardXp }).catch(() => {});
    setClaiming(false);
  };

  return (
    <div className="lx-page">
      <header className="lx-page-head">
        <h1>Daily Challenges</h1>
        <p>A fresh goal every day. Answer questions correctly to complete it and earn XP.</p>
      </header>

      <div className="lx-challenge-card lx-challenge-lg">
        <div className="lx-challenge-icon"><Target size={26} /></div>
        <h2>{challenge.title}</h2>
        <p className="lx-challenge-desc">{challenge.desc}</p>

        <div className="ln-card-progress lx-challenge-bar"><span style={{ width: `${pct}%` }} /></div>
        <p className="lx-challenge-count">{state.progress} / {challenge.goal} correct</p>

        <div className="lx-challenge-reward">Reward <strong>⚡ {challenge.rewardXp} XP</strong></div>

        {state.claimed ? (
          <button className="ln-btn ln-btn-primary ln-btn-lg" disabled>Reward claimed ✓</button>
        ) : state.completed ? (
          <button className="ln-btn ln-btn-primary ln-btn-lg" onClick={claim} disabled={claiming}>
            {claiming ? 'Claiming…' : `Claim ${challenge.rewardXp} XP`}
          </button>
        ) : (
          <button className="ln-btn ln-btn-primary ln-btn-lg" onClick={() => navigate('/subjects')}>
            Start answering
          </button>
        )}
      </div>
    </div>
  );
};

export default ChallengesPage;
