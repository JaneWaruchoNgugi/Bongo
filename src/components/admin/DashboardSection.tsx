import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BookOpen, Eye, Package, ShieldCheck, UserPlus, Users } from 'lucide-react';
import {
  getDashboardCounts,
  subscribeAccounts,
  subscribeLeaderboard,
  type AdminAccount,
  type DashboardCounts,
  type LeaderboardEntry,
} from '../../lib/adminData';

const fmtDate = (ms?: number | null) =>
  ms ? new Date(ms).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—';

const DashboardSection: React.FC = () => {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [counts, setCounts] = useState<DashboardCounts>({ questions: 0, openChats: 0, staff: 0 });

  useEffect(() => subscribeAccounts(setAccounts), []);
  useEffect(() => subscribeLeaderboard(setScores), []);
  useEffect(() => { getDashboardCounts().then(setCounts).catch(() => {}); }, [accounts.length]);

  const totalStudents = useMemo(
    () => accounts.reduce((n, a) => n + (a.profiles?.length ?? 0), 0),
    [accounts]
  );

  const packageStats = useMemo(() => {
    const order = ['solo', 'trio', 'quad', 'family'];
    const tally: Record<string, number> = {};
    accounts.forEach(a => { const p = (a.package ?? 'solo').toLowerCase(); tally[p] = (tally[p] ?? 0) + 1; });
    const max = Math.max(1, ...Object.values(tally));
    return order.map(name => ({
      name,
      count: tally[name] ?? 0,
      percent: Math.round(((tally[name] ?? 0) / max) * 100),
    }));
  }, [accounts]);

  const stats = [
    { label: 'Students', value: totalStudents, sub: `${accounts.length} account${accounts.length === 1 ? '' : 's'}`, icon: Users },
    { label: 'Questions', value: counts.questions, sub: 'in question bank', icon: BookOpen },
    { label: 'Open chats', value: counts.openChats, sub: 'support conversations', icon: Activity },
    { label: 'Staff', value: counts.staff, sub: 'admins & support', icon: ShieldCheck },
  ];

  const topScores = scores.filter(s => !s.flagged).slice(0, 3);
  const recentSignups = accounts.slice(0, 4);

  return (
    <div className="admin-section-stack">
      <div className="admin-stats-grid">
        {stats.map(item => (
          <article className="admin-stat-card" key={item.label}>
            <div className="admin-stat-icon"><item.icon size={20} /></div>
            <p>{item.label}</p>
            <strong>{item.value.toLocaleString()}</strong>
            <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{item.sub}</span>
          </article>
        ))}
      </div>

      <div className="admin-dashboard-grid">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Top Scores</h2>
              <p>Highest scores from the live leaderboard.</p>
            </div>
            <Eye size={18} />
          </div>
          <div className="admin-score-list">
            {topScores.map((s, i) => (
              <div className="admin-score-row" key={s.id}>
                <span className="admin-rank">{i + 1}</span>
                <div>
                  <strong>{s.player ?? 'Unknown'}</strong>
                  <p>{[s.game, s.grade].filter(Boolean).join(' · ') || '—'}</p>
                </div>
                <b>{(s.score ?? 0).toLocaleString()}</b>
              </div>
            ))}
            {topScores.length === 0 && <p className="admin-chat-empty">No scores recorded yet.</p>}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Package Counts</h2>
              <p>Subscriptions by plan.</p>
            </div>
            <Package size={20} />
          </div>
          <div className="admin-package-bars">
            {packageStats.map(pkg => (
              <div className="admin-package-row" key={pkg.name}>
                <div><span style={{ textTransform: 'capitalize' }}>{pkg.name}</span><strong>{pkg.count}</strong></div>
                <div className="admin-progress-track"><span style={{ width: `${pkg.percent}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel admin-wide-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Recent Signups</h2>
              <p>Latest parent accounts and their active student.</p>
            </div>
            <UserPlus size={20} />
          </div>
          <div className="admin-mini-table">
            {recentSignups.map(a => {
              const active = a.profiles?.find(p => p.id === a.activeProfileId) ?? a.profiles?.[0];
              return (
                <div className="admin-mini-row" key={a.id}>
                  <span>{a.phone ?? a.id}</span>
                  <b>{active?.username ?? '—'}</b>
                  <em>{a.package ?? 'solo'}</em>
                  <small>{fmtDate(a.createdAt?.toMillis() ?? null)}</small>
                </div>
              );
            })}
            {recentSignups.length === 0 && (
              <p className="admin-chat-empty">
                No accounts yet. Students currently sign up on-device — connect signup to Firestore to populate this.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardSection;
