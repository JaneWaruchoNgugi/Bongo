import React from 'react';
import { useStore } from '../store/useStore';
import { Target, BookOpen, TrendingUp, Users, CheckCircle, Shield, Flame, Trophy } from 'lucide-react';
import '../styles/about.css';

const FEATURES = [
  { icon: Target,    title: 'CBC Aligned',       desc: 'Every question follows the official Kenyan CBC curriculum from Grade 1 to 12.', color: '#10b981' },
  { icon: BookOpen,  title: 'Interactive Quizzes',desc: 'Engaging quizzes with instant feedback that make learning stick.',               color: '#3b82f6' },
  { icon: TrendingUp,title: 'Track Progress',     desc: 'Monitor your improvement with detailed analytics and performance graphs.',       color: '#8b5cf6' },
  { icon: Users,     title: 'All Grades',         desc: 'From Grade 1 through Grade 12 — every student is covered.',                     color: '#f59e0b' },
  { icon: Flame,     title: 'Streak System',      desc: 'Stay motivated with daily streaks, XP points and level rewards.',               color: '#ef4444' },
  { icon: Shield,    title: 'Safe & Secure',       desc: 'Parent-controlled accounts keep students focused and safe.',                   color: '#0891b2' },
];

const STEPS = [
  { n: 1, icon: CheckCircle, title: 'Choose Your Level', desc: 'Select your class and focus area.', color: '#10b981' },
  { n: 2, icon: BookOpen,    title: 'Take Quizzes',      desc: 'Answer interactive questions with instant feedback.', color: '#3b82f6' },
  { n: 3, icon: TrendingUp,  title: 'Track Progress',    desc: 'See your improvement over time.', color: '#2f9e6a' },
];

const AboutPage: React.FC = () => {
  const { isLoggedIn, user } = useStore();

  return (
    <div className="ab-root">
      {/* Header */}
      <div className="ab-hero">
        <div className="ab-hero-bg" />
        <div className="ab-hero-content">
          {isLoggedIn && user && (
            <div className="ab-user-chip">
              <span>{user.profiles[0]?.avatar || '🧒🏿'}</span>
              <span>{user.profiles.find(p => p.id === user.activeProfileId)?.username ?? user.profiles[0]?.username}</span>
            </div>
          )}
          <h1 className="ab-hero-title">About <span>GradeUp</span></h1>
          <p className="ab-hero-sub">
            Kenya's #1 CBC revision platform — helping 50,000+ students learn smarter, score higher, and enjoy the journey.
          </p>

          <div className="ab-hero-stats">
            {[
              { icon: <Users size={18} />, val: '50K+', lbl: 'Students' },
              { icon: <BookOpen size={18} />, val: '24K+', lbl: 'Quizzes' },
              { icon: <Trophy size={18} />, val: '87%', lbl: 'Pass Rate' },
              { icon: <Flame size={18} />, val: '4.9★', lbl: 'Rating' },
            ].map(s => (
              <div key={s.lbl} className="ab-hero-stat">
                {s.icon}
                <span className="ab-stat-val">{s.val}</span>
                <span className="ab-stat-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works (non-logged-in) or features (logged-in) */}
      {!isLoggedIn ? (
        <section className="ab-section">
          <div className="ab-section-header">
            <span className="ab-badge">Simple Process</span>
            <h2>Start Learning in <span>3 Easy Steps</span></h2>
          </div>
          <div className="ab-steps">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.n}>
                <div className="ab-step-card">
                  <div className="ab-step-num" style={{ background: s.color }}>{s.n}</div>
                  <s.icon size={28} color={s.color} />
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && <div className="ab-step-connector" />}
              </React.Fragment>
            ))}
          </div>
        </section>
      ) : (
        <section className="ab-section">
          <div className="ab-section-header">
            <span className="ab-badge">Why Choose Us</span>
            <h2>Everything You Need to <span>Succeed</span></h2>
            <p className="ab-section-sub">Built specifically for Kenyan CBC students, teachers, and parents.</p>
          </div>
          <div className="ab-features-grid">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="ab-feature-card">
                <div className="ab-feature-icon" style={{ background: `${color}15`, color }}>
                  <Icon size={26} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mission */}
      <section className="ab-mission">
        <div className="ab-mission-inner">
          <span className="ab-badge ab-badge-light">Our Mission</span>
          <h2>Making Quality Education <span>Accessible to All</span></h2>
          <p>
            GradeUp was founded in Nairobi with a simple belief: every Kenyan student deserves access to high-quality revision tools, regardless of their background or location. We combine CBC curriculum expertise with modern gamification to make studying genuinely enjoyable.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
