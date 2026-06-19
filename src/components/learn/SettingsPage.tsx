import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun, Users } from 'lucide-react';
import { useStore, useThemeStore } from '../../store/useStore';
import { useActiveProfile } from './useProfile';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useActiveProfile();
  const { theme, toggleTheme } = useThemeStore();
  const { setOverlay, logout } = useStore();

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="lx-page">
      <header className="lx-page-head">
        <h1>Settings</h1>
        <p>Manage your experience.</p>
      </header>

      <div className="lx-settings">
        <div className="lx-setting-row">
          <div>
            <strong>Appearance</strong>
            <span>Switch between light and dark mode.</span>
          </div>
          <button className="ln-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <><Sun size={16} /> Light mode</> : <><Moon size={16} /> Dark mode</>}
          </button>
        </div>

        <div className="lx-setting-row">
          <div>
            <strong>Active profile</strong>
            <span>{profile ? `${profile.username} · Grade ${profile.grade}` : 'No profile selected'}</span>
          </div>
          <button className="ln-btn" onClick={() => setOverlay('profile-select')}>
            <Users size={16} /> Switch profile
          </button>
        </div>

        <div className="lx-setting-row">
          <div>
            <strong>Sign out</strong>
            <span>Log out of this account on this device.</span>
          </div>
          <button className="ln-btn lx-danger" onClick={handleLogout}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
