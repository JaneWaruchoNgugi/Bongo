import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Award,
  BookMarked,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  RotateCcw,
  Settings,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { subscribeProgress, type ProgressDoc } from '../../lib/learn';
import { levelInfo } from '../../lib/gamification';
import { useStore } from '../../store/useStore';
import { useActiveProfile } from './useProfile';
import '../../styles/dashboard-learner.css';

const NAV = [
  { to: '/home',         label: 'Dashboard',       icon: LayoutDashboard, end: true },
  { to: '/subjects',     label: 'Subjects',        icon: BookOpen },
  { to: '/exams',        label: 'Mock Exams',      icon: ClipboardList },
  { to: '/revision',     label: 'Revision',        icon: RotateCcw },
  { to: '/books',        label: 'Books',           icon: BookMarked },
  { to: '/leaderboard',  label: 'Leaderboard',     icon: Trophy },
  { to: '/achievements', label: 'Achievements',    icon: Award },
  { to: '/challenges',   label: 'Daily Challenges', icon: Target },
  { to: '/community',    label: 'Community',        icon: Users },
  { to: '/settings',     label: 'Settings',         icon: Settings },
];

const DashboardLayout: React.FC = () => {
  const { accountId, profile } = useActiveProfile();
  const { learnerMenuOpen, setLearnerMenu } = useStore();
  const [progress, setProgress] = useState<ProgressDoc>({});
  const location = useLocation();

  useEffect(() => {
    if (!accountId || !profile) return;
    return subscribeProgress(accountId, profile.id, setProgress);
  }, [accountId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close the mobile drawer on navigation.
  useEffect(() => { setLearnerMenu(false); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const lvl = levelInfo(progress.xp ?? 0);
  const initial = (profile?.username ?? '?').charAt(0).toUpperCase();

  return (
    <div className="lx-shell">
      {learnerMenuOpen && <div className="lx-drawer-overlay" onClick={() => setLearnerMenu(false)} />}
      <aside className={`lx-sidebar${learnerMenuOpen ? ' open' : ''}`}>
        <nav className="lx-nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `lx-nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {profile && (
          <div className="lx-side-profile">
            <div className="lx-side-profile-top">
              <span className="lx-avatar">{initial}</span>
              <div>
                <strong>{profile.username}</strong>
                <span>Grade {profile.grade}</span>
              </div>
            </div>
            <div className="lx-side-xp">⚡ {lvl.totalXp} XP</div>
            <div className="lx-side-level">
              <span>Level {lvl.level}</span>
              <span>{lvl.pct}%</span>
            </div>
            <div className="lx-bar"><span style={{ width: `${lvl.pct}%` }} /></div>
            <div className="lx-side-note">Keep learning, keep growing 🌱</div>
          </div>
        )}
      </aside>

      <main className="lx-main">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
