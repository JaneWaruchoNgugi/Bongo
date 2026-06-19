import React, { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Plus, ShieldCheck, UserCog, Headphones } from 'lucide-react';
import { db, functions } from '../../lib/firebase';
import type { StaffMember, StaffRole } from '../../lib/types';

const StaffSection: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'support' as StaffRole });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'staff'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setStaff(snap.docs.map(d => ({ uid: d.id, ...(d.data() as Omit<StaffMember, 'uid'>) })));
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || form.password.length < 6) {
      setMessage({ type: 'err', text: 'Name, email and a 6+ char password are required.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const createStaffUser = httpsCallable(functions, 'createStaffUser');
      await createStaffUser(form);
      setMessage({ type: 'ok', text: `${form.role === 'admin' ? 'Admin' : 'Support'} account created.` });
      setForm({ name: '', email: '', password: '', role: 'support' });
    } catch (err) {
      setMessage({ type: 'err', text: (err as { message?: string }).message ?? 'Could not create account.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-content-grid">
      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Staff Accounts</h2>
            <p>Admins manage content & billing. Support agents handle the chat.</p>
          </div>
          <ShieldCheck size={20} />
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.uid}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.email}</td>
                  <td>
                    <em className="admin-package-chip">
                      {s.role === 'admin' ? <UserCog size={14} /> : <Headphones size={14} />}
                      {s.role}
                    </em>
                  </td>
                  <td>
                    <span className={`admin-status ${s.disabled ? 'is-off' : 'is-live'}`}>
                      {s.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', opacity: 0.6 }}>No staff yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="admin-panel admin-editor-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Add Staff</h2>
            <p>Creates a Firebase Auth account and assigns the role.</p>
          </div>
          <Plus size={20} />
        </div>
        <form className="admin-question-form" onSubmit={handleCreate}>
          <label>
            Name
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="staff@bongo.com" />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
          </label>
          <label>
            Role
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as StaffRole })}>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          {message && (
            <p style={{ color: message.type === 'ok' ? '#10b981' : '#ef4444', fontSize: 13 }}>{message.text}</p>
          )}
          <div className="admin-form-actions">
            <button className="admin-primary-btn" type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
};

export default StaffSection;
