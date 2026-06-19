import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Send, Facebook, Twitter, Instagram, Youtube, ArrowUpRight } from 'lucide-react';
import '../styles/footer.css';

const SOCIALS = [
  { icon: Facebook,  label: 'Facebook',  href: 'https://facebook.com/gradeup',  color: '#1877F2' },
  { icon: Twitter,   label: 'Twitter/X', href: 'https://twitter.com/gradeup',   color: '#1DA1F2' },
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/gradeup', color: '#E1306C' },
  { icon: Youtube,   label: 'YouTube',   href: 'https://youtube.com/@gradeup',  color: '#FF0000' },
  { icon: Send,      label: 'Telegram',  href: 'https://t.me/gradeup',          color: '#229ED9' },
];

const LINKS = [
  { label: 'Home',        path: '/' },
  { label: 'Games',       path: '/games' },
  { label: 'About Us',    path: '/about' },
  { label: 'Dashboard',   path: '/dashboard' },
  { label: 'Profile',     path: '/profile' },
];

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="ft-root">
      <div className="ft-wave"><svg viewBox="0 0 1440 60" preserveAspectRatio="none"><path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="currentColor"/></svg></div>

      <div className="ft-body">
        <div className="ft-grid">
          {/* Brand */}
          <div className="ft-col ft-brand">
            <button className="ft-logo" onClick={() => navigate('/')}>
              <div className="ft-logo-icon"><GraduationCap size={20} color="#fff" /></div>
              <span>High<strong>Scores</strong></span>
            </button>
            <p className="ft-tagline">Kenya's #1 CBC revision platform — making learning engaging, effective, and fun for every student.</p>
            <div className="ft-socials">
              {SOCIALS.map(({ icon: Icon, label, href, color }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                   className="ft-social-btn" style={{ '--c': color } as React.CSSProperties}>
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="ft-col">
            <h4 className="ft-col-title">Quick Links</h4>
            <ul className="ft-link-list">
              {LINKS.map(({ label, path }) => (
                <li key={label}>
                  <button className="ft-nav-link" onClick={() => navigate(path)}>
                    <ArrowUpRight size={13} />{label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="ft-bottom">
          <p>© {year} HighScores. All rights reserved. Built with ❤️ in Kenya.</p>
          <div className="ft-legal">
            <button onClick={() => navigate('/privacy')}>Privacy Policy</button>
            <span>·</span>
            <button onClick={() => navigate('/terms')}>Terms of Use</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
