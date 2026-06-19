import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Sparkles } from 'lucide-react';
import '../styles/games.css';

const GamesPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="gp-soon">
      <div className="gp-soon-card">
        <span className="gp-soon-icon"><Gamepad2 size={44} /></span>
        <span className="gp-soon-badge"><Sparkles size={14} /> Coming Soon</span>
        <h1>Games are on the way!</h1>
        <p>
          We&apos;re building fun, CBC-aligned learning games where you&apos;ll earn XP,
          climb the leaderboard and unlock badges. Check back soon! 🎮
        </p>
        <button className="gp-soon-btn" onClick={() => navigate('/home')}>Back to Dashboard</button>
      </div>
    </div>
  );
};

export default GamesPage;
