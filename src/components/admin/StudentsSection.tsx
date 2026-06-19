import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChevronRight, Search, Users, XCircle } from 'lucide-react';
import { subscribeAccounts, type AdminAccount } from '../../lib/adminData';

const initial = (name?: string) => (name?.trim()?.[0] ?? '?').toUpperCase();

const StudentsSection: React.FC = () => {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => subscribeAccounts(setAccounts), []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return accounts;
    return accounts.filter(a =>
      (a.phone ?? '').toLowerCase().includes(term) ||
      (a.profiles ?? []).some(p => (p.username ?? '').toLowerCase().includes(term))
    );
  }, [accounts, search]);

  return (
    <section className="admin-panel">
      <div className="admin-panel-header admin-header-actions">
        <div>
          <h2>Students / Accounts</h2>
          <p>{accounts.length} registered account{accounts.length === 1 ? '' : 's'}, live from Firestore.</p>
        </div>
      </div>
      <div className="admin-toolbar">
        <label className="admin-search">
          <Search size={18} />
          <input placeholder="Search phone or profile name" value={search} onChange={e => setSearch(e.target.value)} />
        </label>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Phone</th>
              <th>Profiles</th>
              <th>Package</th>
              <th>Active student</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => {
              const profiles = a.profiles ?? [];
              const active = profiles.find(p => p.id === a.activeProfileId) ?? profiles[0];
              const enabled = (a.status ?? 'enabled').toLowerCase() !== 'disabled';
              const isOpen = expandedId === a.id;
              return (
                <React.Fragment key={a.id}>
                  <tr
                    className={`admin-acct-row ${isOpen ? 'is-open' : ''}`}
                    onClick={() => setExpandedId(isOpen ? null : a.id)}
                  >
                    <td>
                      <div className="admin-acct-phone">
                        <ChevronRight size={16} className="admin-acct-caret" />
                        <div>
                          <strong>{a.phone ?? '—'}</strong>
                          <span>{a.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>{profiles.length} profile{profiles.length === 1 ? '' : 's'}</td>
                    <td><em className="admin-package-chip">{a.package ?? 'solo'}</em></td>
                    <td>{active?.username ?? '—'}{active?.grade ? ` · Grade ${active.grade}` : ''}</td>
                    <td>
                      <span className={`admin-status ${enabled ? 'is-live' : 'is-off'}`}>
                        {enabled ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="admin-acct-detail">
                      <td colSpan={5}>
                        {profiles.length === 0 ? (
                          <p className="admin-acct-detail-empty">No profiles on this account yet.</p>
                        ) : (
                          <div className="admin-profile-grid">
                            {profiles.map((p, idx) => {
                              const isActive = !!p.id && p.id === a.activeProfileId;
                              return (
                                <div
                                  key={p.id ?? idx}
                                  className={`admin-profile-card ${isActive ? 'is-active' : ''}`}
                                >
                                  <span className="admin-profile-avatar">{initial(p.username)}</span>
                                  <div className="admin-profile-info">
                                    <strong>
                                      {p.username ?? 'Unnamed'}
                                      {isActive && <em className="admin-profile-active">active</em>}
                                    </strong>
                                    <span className="admin-profile-grade">
                                      {p.grade ? `Grade ${p.grade}` : p.educationLevel ?? '—'}
                                    </span>
                                    <div className="admin-profile-stats">
                                      <span>{p.xp ?? 0} XP</span>
                                      <span>{p.points ?? 0} pts</span>
                                      <span>🔥 {p.streak ?? 0}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="admin-table-empty">
                    <Users size={32} />
                    <p>
                      {accounts.length === 0
                        ? 'No accounts in Firestore yet. Students currently register on-device (localStorage).'
                        : 'No matches.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default StudentsSection;
