import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle, Pencil, Save, Search, Trash2, X } from 'lucide-react';
import {
  deleteQuestion,
  subscribeQuestions,
  updateQuestion,
  type SavedQuestion,
} from '../../lib/content';

const DIFFICULTIES: SavedQuestion['difficulty'][] = ['Easy', 'Medium', 'Hard'];

const QuestionsSection: React.FC = () => {
  const [questions, setQuestions] = useState<SavedQuestion[]>([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [editing, setEditing] = useState<SavedQuestion | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeQuestions(setQuestions), []);

  const grades = useMemo(
    () => Array.from(new Set(questions.map(q => q.grade).filter(Boolean))).sort(),
    [questions]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter(q => {
      if (gradeFilter !== 'all' && q.grade !== gradeFilter) return false;
      if (!term) return true;
      return (
        q.text.toLowerCase().includes(term) ||
        q.subject.toLowerCase().includes(term) ||
        (q.topic ?? '').toLowerCase().includes(term)
      );
    });
  }, [questions, search, gradeFilter]);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateQuestion(editing.id, {
        text: editing.text,
        options: editing.options,
        correctIndex: editing.correctIndex,
        explanation: editing.explanation,
        difficulty: editing.difficulty,
        grade: editing.grade,
        subject: editing.subject,
        topic: editing.topic,
        status: editing.status,
      });
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q: SavedQuestion) => {
    if (!window.confirm('Delete this question permanently?')) return;
    if (editing?.id === q.id) setEditing(null);
    await deleteQuestion(q.id);
  };

  const setOption = (i: number, value: string) => {
    if (!editing) return;
    const options = [...editing.options];
    options[i] = value;
    setEditing({ ...editing, options });
  };

  return (
    <div className="admin-content-grid">
      {/* List */}
      <section className="admin-panel">
        <div className="admin-panel-header admin-header-actions">
          <div>
            <h2>Questions</h2>
            <p>{questions.length} saved question{questions.length === 1 ? '' : 's'}. Edit here — no need to regenerate.</p>
          </div>
        </div>
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={18} />
            <input placeholder="Search text, subject, topic" value={search} onChange={e => setSearch(e.target.value)} />
          </label>
          <select className="admin-secondary-btn" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
            <option value="all">All grades</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Grade</th>
                <th>Subject</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} className={editing?.id === q.id ? 'is-active-row' : ''}>
                  <td>
                    <strong>{q.text.length > 70 ? `${q.text.slice(0, 70)}…` : q.text}</strong>
                    <span>{q.topic || '—'}</span>
                  </td>
                  <td>{q.grade}</td>
                  <td>{q.subject}</td>
                  <td><em className="admin-package-chip">{q.difficulty}</em></td>
                  <td>
                    <span className={`admin-status ${q.status === 'published' ? 'is-live' : 'is-draft'}`}>
                      {q.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" aria-label="Edit" onClick={() => setEditing({ ...q })}><Pencil size={17} /></button>
                      <button type="button" aria-label="Delete" onClick={() => void handleDelete(q)}><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', opacity: 0.6, padding: 24 }}>
                  {questions.length === 0 ? 'No questions yet — generate some in AI Content.' : 'No matches.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Editor */}
      <aside className="admin-panel admin-editor-panel">
        <div className="admin-panel-header">
          <div>
            <h2>{editing ? 'Edit Question' : 'Editor'}</h2>
            <p>{editing ? 'Update and save — changes persist in Firebase.' : 'Select a question to edit.'}</p>
          </div>
          {editing ? (
            <button className="admin-icon-btn" type="button" aria-label="Close" onClick={() => setEditing(null)}><X size={18} /></button>
          ) : <BookOpen size={20} />}
        </div>

        {!editing ? (
          <div className="admin-chat-placeholder" style={{ minHeight: 220 }}>
            <Pencil size={34} />
            <p>Pick a question from the list to edit it.</p>
          </div>
        ) : (
          <form className="admin-question-form" onSubmit={e => { e.preventDefault(); void handleSave(); }}>
            <label>
              Question text
              <textarea rows={3} value={editing.text} onChange={e => setEditing({ ...editing, text: e.target.value })} />
            </label>
            <label>Options (select the correct one)</label>
            {editing.options.map((opt, i) => (
              <div key={i} className="admin-option-row">
                <input
                  type="radio"
                  name="correct"
                  checked={editing.correctIndex === i}
                  onChange={() => setEditing({ ...editing, correctIndex: i })}
                  aria-label={`Mark option ${i + 1} correct`}
                />
                <input value={opt} onChange={e => setOption(i, e.target.value)} placeholder={`Option ${i + 1}`} />
                {editing.correctIndex === i && <CheckCircle size={16} color="#10b981" />}
              </div>
            ))}
            <label>
              Explanation
              <textarea rows={2} value={editing.explanation} onChange={e => setEditing({ ...editing, explanation: e.target.value })} />
            </label>
            <div className="admin-form-row">
              <label>
                Subject
                <input value={editing.subject} onChange={e => setEditing({ ...editing, subject: e.target.value })} />
              </label>
              <label>
                Topic
                <input value={editing.topic} onChange={e => setEditing({ ...editing, topic: e.target.value })} />
              </label>
            </div>
            <div className="admin-form-row">
              <label>
                Grade
                <input value={editing.grade} onChange={e => setEditing({ ...editing, grade: e.target.value })} />
              </label>
              <label>
                Difficulty
                <select value={editing.difficulty} onChange={e => setEditing({ ...editing, difficulty: e.target.value as SavedQuestion['difficulty'] })}>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </label>
            </div>
            <label>
              Status
              <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as SavedQuestion['status'] })}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
            <div className="admin-form-actions">
              <button className="admin-secondary-btn" type="button" onClick={() => setEditing(null)}>Cancel</button>
              <button className="admin-primary-btn" type="submit" disabled={saving}>
                <Save size={18} />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
};

export default QuestionsSection;
