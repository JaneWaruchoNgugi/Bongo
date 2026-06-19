import React, { useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  Database,
  Headphones,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import '../../styles/admin.css';
import { StaffAuthProvider, useStaffAuth } from './useStaffAuth';
import SupportChatSection from './SupportChatSection';
import StaffSection from './StaffSection';
import CurriculumBrowser from './CurriculumBrowser';
import QuestionsSection from './QuestionsSection';
import DashboardSection from './DashboardSection';
import StudentsSection from './StudentsSection';
import LeaderboardSection from './LeaderboardSection';
import ExamsSection from './ExamsSection';
import type { StaffRole } from '../../lib/types';

type AdminSection =
  | 'dashboard'
  | 'users'
  | 'questions'
  | 'generate'
  | 'exams'
  | 'leaderboard'
  | 'support'
  | 'staff';

const adminSections: Array<{
  id: AdminSection;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: StaffRole[]; // which staff roles may see this section
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'support'] },
  { id: 'support', label: 'Support Chat', icon: MessageCircle, roles: ['admin', 'support'] },
  { id: 'users', label: 'Students', icon: Users, roles: ['admin', 'support'] },
  { id: 'questions', label: 'Questions', icon: BookOpen, roles: ['admin'] },
  { id: 'generate', label: 'Curriculum', icon: Sparkles, roles: ['admin'] },
  { id: 'exams', label: 'Mock Exams', icon: ClipboardList, roles: ['admin'] },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, roles: ['admin'] },
  { id: 'staff', label: 'Staff', icon: UserCog, roles: ['admin'] },
];

const firestoreCollections = [
  'subjects/{subjectId}',
  'topics/{topicId}',
  'questions/{questionId}',
  'exams/{examId}',
  '  └─ questions/{questionId}',
  'accounts/{accountId}',
  'leaderboard/{scoreId}',
  'staff/{uid}',
  'conversations/{conversationId}',
];

const getInitialSection = (pathname: string): AdminSection => {
  const section = pathname.split('/')[2];
  return adminSections.some(item => item.id === section) ? (section as AdminSection) : 'dashboard';
};

const AdminLogin: React.FC = () => {
  const { signIn, signOutStaff, error, user } = useStaffAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [bootstrapMsg, setBootstrapMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signIn(email, password);
    } catch {
      /* error surfaced via context */
    } finally {
      setBusy(false);
    }
  };

  const handleClaimFirstAdmin = async () => {
    setBusy(true);
    setBootstrapMsg(null);
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../../lib/firebase');
      await httpsCallable(functions, 'claimFirstAdmin')();
      await user?.getIdToken(true);
      window.location.reload();
    } catch (err) {
      setBootstrapMsg((err as { message?: string }).message ?? 'Could not claim admin.');
    } finally {
      setBusy(false);
    }
  };

  // A non-staff Firebase user is signed in (e.g. a logged-in student sharing
  // the same auth session). Let them sign in as staff or sign out — don't push
  // the first-admin bootstrap, which only matters on a brand-new project.
  const authedButNotStaff = !!user && !user.isAnonymous;

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <span className="admin-brand-mark">
            <ShieldCheck size={28} />
          </span>
          <div>
            <p>HighScores Admin</p>
            <span>Admin & Support access</span>
          </div>
        </div>

        <div className="admin-login-copy">
          <h1>Staff Login</h1>
          <p>Sign in with your Firebase Auth staff account. Access is gated by your role (Admin or Support).</p>
        </div>

        {authedButNotStaff && (
          <div className="admin-login-note" style={{ marginBottom: 14 }}>
            <span>
              You're signed in{user?.email ? ` as ${user.email}` : ''}, which isn't a staff account.
              Sign in below as staff, or{' '}
              <button
                type="button"
                onClick={() => void signOutStaff()}
                style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}
              >
                sign out
              </button>
              .
            </span>
          </div>
        )}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <span>
              <Mail size={18} />
              <input
                type="email"
                placeholder="staff@bongo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
              />
            </span>
          </label>
          <label>
            Password
            <span>
              <Lock size={18} />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </span>
          </label>
          {error && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={busy}>
            <KeyRound size={18} />
            {busy ? 'Signing in…' : 'Sign in with Firebase'}
          </button>
        </form>

        <div className="admin-login-note">
          <Database size={17} />
          <span>
            Roles live in staff/{'{uid}'}: <b>admin</b> or <b>support</b>.
            {authedButNotStaff && (
              <>
                {' '}First-time setup?{' '}
                <button
                  type="button"
                  onClick={() => void handleClaimFirstAdmin()}
                  disabled={busy}
                  style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}
                >
                  Claim first admin
                </button>
                .
              </>
            )}
          </span>
        </div>
        {bootstrapMsg && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{bootstrapMsg}</p>}
      </section>
    </main>
  );
};

const AdminContent: React.FC<{ section: AdminSection; role: StaffRole }> = ({ section, role }) => {
  // Support agents are restricted to chat + read-only sections.
  if (section === 'support') return <SupportChatSection />;
  if (section === 'staff') return role === 'admin' ? <StaffSection /> : <AccessDenied />;
  if (section === 'users') return <StudentsSection />;
  if (section === 'questions') return role === 'admin' ? <QuestionsSection /> : <AccessDenied />;
  if (section === 'generate') return role === 'admin' ? <CurriculumBrowser /> : <AccessDenied />;
  if (section === 'exams') return role === 'admin' ? <ExamsSection /> : <AccessDenied />;
  if (section === 'leaderboard') return role === 'admin' ? <LeaderboardSection /> : <AccessDenied />;
  return <DashboardSection />;
};

const AccessDenied: React.FC = () => (
  <section className="admin-panel">
    <div className="admin-panel-header">
      <div>
        <h2>No access</h2>
        <p>Your role doesn't have permission to view this section.</p>
      </div>
      <Lock size={20} />
    </div>
  </section>
);

const AdminPanelInner: React.FC = () => {
  const location = useLocation();
  const { loading, staff, signOutStaff } = useStaffAuth();
  const requestedSection = useMemo(() => getInitialSection(location.pathname), [location.pathname]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (location.pathname === '/admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Still resolving the Firebase auth state.
  if (loading) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-card" style={{ alignItems: 'center', textAlign: 'center' }}>
          <Loader2 size={32} className="admin-spin" />
          <p>Checking access…</p>
        </div>
      </main>
    );
  }

  // Not signed in (or not a staff member) → login screen.
  if (!staff) {
    return <AdminLogin />;
  }

  // Sections this staff role may see.
  const visibleSections = adminSections.filter(item => item.roles.includes(staff.role));
  const allowed = visibleSections.some(item => item.id === requestedSection);
  const section: AdminSection = allowed ? requestedSection : visibleSections[0].id;
  if (!allowed) {
    return <Navigate to={`/admin/${section}`} replace />;
  }
  const activeSection = adminSections.find(item => item.id === section) ?? visibleSections[0];

  return (
    <main className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-brand">
          <span className="admin-brand-mark">
            <ShieldCheck size={24} />
          </span>
          <div>
            <strong>HighScores Admin</strong>
            <p>{staff.role === 'admin' ? 'Administrator' : 'Support agent'}</p>
          </div>
          <button className="admin-mobile-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          {visibleSections.map(item => (
            <Link
              key={item.id}
              to={`/admin/${item.id}`}
              className={item.id === section ? 'is-active' : ''}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={19} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="admin-collections">
          <div>
            <Database size={18} />
            <strong>Firestore shape</strong>
          </div>
          {firestoreCollections.map(col => (
            <code key={col}>{col}</code>
          ))}
        </div>

        <div className="admin-sidebar-footer">
          <button type="button" onClick={() => void signOutStaff()}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && <button className="admin-scrim" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}

      <section className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-btn" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div>
            <span>{activeSection.label}</span>
            <h1>{activeSection.label === 'Dashboard' ? 'Dashboard Overview' : activeSection.label}</h1>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-status is-live">
              {staff.role === 'admin' ? <UserCog size={15} /> : <Headphones size={15} />}
              {staff.name}
            </span>
          </div>
        </header>

        <AdminContent section={section} role={staff.role} />
      </section>
    </main>
  );
};

const AdminPanel: React.FC = () => (
  <StaffAuthProvider>
    <AdminPanelInner />
  </StaffAuthProvider>
);

export default AdminPanel;
