import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Search, Users, XCircle } from 'lucide-react';
import { subscribeAccounts, type AdminAccount } from '../../lib/adminData';

const StudentsSection: React.FC = () => {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [search, setSearch] = useState('');

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
              const active = a.profiles?.find(p => p.id === a.activeProfileId) ?? a.profiles?.[0];
              const enabled = (a.status ?? 'enabled').toLowerCase() !== 'disabled';
              return (
                <tr key={a.id}>
                  <td>
                    <strong>{a.phone ?? '—'}</strong>
                    <span>{a.id}</span>
                  </td>
                  <td>{a.profiles?.length ?? 0} profile{(a.profiles?.length ?? 0) === 1 ? '' : 's'}</td>
                  <td><em className="admin-package-chip">{a.package ?? 'solo'}</em></td>
                  <td>{active?.username ?? '—'}{active?.grade ? ` · Grade ${active.grade}` : ''}</td>
                  <td>
                    <span className={`admin-status ${enabled ? 'is-live' : 'is-off'}`}>
                      {enabled ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="admin-chat-placeholder" style={{ minHeight: 160 }}>
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
