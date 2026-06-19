import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, CheckCircle, ChevronRight, FileText, Save, Sparkles, Trash2, Wand2,
} from 'lucide-react';
import type { GeneratedQuestion } from '../../lib/content';
import { GRADES, subjectsForGrade } from '../../lib/cbcSubjects';
import {
  deleteTopic,
  generateSyllabus,
  generateTopicLesson,
  saveSyllabus,
  saveTopicContent,
  subjectIdFor,
  subscribeTopics,
  updateTopic,
  type SyllabusTopic,
  type Topic,
} from '../../lib/curriculum';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

const AiContentSection: React.FC = () => {
  const [grade, setGrade] = useState('Grade 4');
  const [subject, setSubject] = useState('Mathematics');
  const subjects = useMemo(() => subjectsForGrade(grade), [grade]);
  const subjectId = useMemo(() => subjectIdFor(grade, subject), [grade, subject]);

  // When the grade changes, keep the subject valid for that grade band.
  useEffect(() => {
    if (!subjects.includes(subject)) setSubject(subjects[0]);
  }, [subjects]); // eslint-disable-line react-hooks/exhaustive-deps

  const [topics, setTopics] = useState<Topic[]>([]);
  const [proposed, setProposed] = useState<SyllabusTopic[] | null>(null);
  const [selected, setSelected] = useState<Topic | null>(null);

  const [desc, setDesc] = useState('');
  const [summary, setSummary] = useState('');
  const [draftQ, setDraftQ] = useState<GeneratedQuestion[]>([]);

  const [syllabusCount, setSyllabusCount] = useState(10);
  const [qCount, setQCount] = useState(5);
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('Medium');
  const [busy, setBusy] = useState<'syllabus' | 'lesson' | 'save' | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => subscribeTopics(subjectId, setTopics), [subjectId]);
  useEffect(() => { setSelected(null); setProposed(null); setMsg(null); }, [subjectId]);
  useEffect(() => {
    setDraftQ([]);
    setDesc(selected?.description ?? '');
    setSummary(selected?.summary ?? '');
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const note = (type: 'ok' | 'err', text: string) => setMsg({ type, text });
  const err = (e: unknown) => note('err', (e as { message?: string }).message ?? 'Something went wrong.');

  const handleGenSyllabus = async () => {
    setBusy('syllabus'); setMsg(null);
    try {
      const { topics: t } = await generateSyllabus({ grade, subject, count: syllabusCount });
      setProposed(t);
    } catch (e) { err(e); } finally { setBusy(null); }
  };

  const handleSaveSyllabus = async () => {
    if (!proposed) return;
    setBusy('save'); setMsg(null);
    try {
      await saveSyllabus(grade, subject, proposed);
      setProposed(null);
      note('ok', `Saved ${proposed.length} topics.`);
    } catch (e) { err(e); } finally { setBusy(null); }
  };

  const handleGenLesson = async () => {
    if (!selected) return;
    setBusy('lesson'); setMsg(null);
    try {
      const r = await generateTopicLesson({ grade, subject, topic: selected.title, count: qCount, difficulty });
      setDesc(r.description); setSummary(r.summary); setDraftQ(r.questions);
      note('ok', `Generated a lesson and ${r.questions.length} test questions — review and save.`);
    } catch (e) { err(e); } finally { setBusy(null); }
  };

  const handleSave = async () => {
    if (!selected) return;
    setBusy('save'); setMsg(null);
    try {
      if (draftQ.length > 0) {
        await saveTopicContent(selected, { description: desc, summary }, draftQ);
        setDraftQ([]);
        note('ok', 'Lesson and test saved.');
      } else {
        await updateTopic(selected.id, { description: desc, summary, status: 'published' });
        note('ok', 'Lesson saved.');
      }
    } catch (e) { err(e); } finally { setBusy(null); }
  };

  const handleDeleteTopic = async () => {
    if (!selected || !window.confirm(`Delete "${selected.title}" and its questions?`)) return;
    await deleteTopic(selected).catch(err);
    setSelected(null);
  };

  return (
    <div className="admin-content-grid">
      {/* Left — subject + topics */}
      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Curriculum</h2>
            <p>Generate the syllabus, then a lesson + test per topic.</p>
          </div>
          <Sparkles size={20} />
        </div>

        <div className="admin-form-row">
          <label>
            Grade
            <select value={grade} onChange={e => setGrade(e.target.value)}>
              {GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
          </label>
          <label>
            Subject
            <select value={subject} onChange={e => setSubject(e.target.value)}>
              {subjects.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>

        {/* Proposed (unsaved) syllabus */}
        {proposed ? (
          <div style={{ marginTop: 16 }}>
            <div className="admin-toolbar">
              <strong style={{ fontSize: '0.9rem' }}>{proposed.length} proposed topics</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-secondary-btn" type="button" onClick={() => setProposed(null)}>Discard</button>
                <button className="admin-primary-btn" type="button" onClick={() => void handleSaveSyllabus()} disabled={busy === 'save'}>
                  <Save size={16} />{busy === 'save' ? 'Saving…' : 'Save syllabus'}
                </button>
              </div>
            </div>
            <ol className="admin-topic-list">
              {proposed.map((t, i) => (
                <li key={i}><strong>{t.title}</strong><span>{t.objective}</span></li>
              ))}
            </ol>
          </div>
        ) : (
          <>
            <div className="admin-toolbar" style={{ marginTop: 16 }}>
              <label className="admin-syllabus-count">
                Topics
                <input type="number" min={4} max={24} value={syllabusCount}
                  onChange={e => setSyllabusCount(Number(e.target.value))} />
              </label>
              <button className="admin-primary-btn" type="button" onClick={() => void handleGenSyllabus()} disabled={busy === 'syllabus'}>
                <Wand2 size={16} />{busy === 'syllabus' ? 'Generating…' : topics.length ? 'Generate more' : 'Generate syllabus'}
              </button>
            </div>

            <ul className="admin-topic-list">
              {topics.map(t => (
                <li key={t.id}>
                  <button type="button" className={`admin-topic-btn ${selected?.id === t.id ? 'is-active' : ''}`} onClick={() => setSelected(t)}>
                    <span className="admin-topic-order">{t.order + 1}</span>
                    <span className="admin-topic-main">
                      <strong>{t.title}</strong>
                      <small>{t.questionCount ? `${t.questionCount} questions` : 'no test yet'}</small>
                    </span>
                    <span className={`admin-status ${t.status === 'published' ? 'is-live' : 'is-draft'}`}>{t.status}</span>
                    <ChevronRight size={16} />
                  </button>
                </li>
              ))}
              {topics.length === 0 && (
                <p className="admin-chat-empty">No topics yet for {grade} · {subject}. Generate a syllabus to begin.</p>
              )}
            </ul>
          </>
        )}
        {msg && <p style={{ color: msg.type === 'ok' ? '#067647' : '#b42318', fontSize: 13, marginTop: 12 }}>{msg.text}</p>}
      </section>

      {/* Right — topic editor */}
      <aside className="admin-panel admin-editor-panel">
        <div className="admin-panel-header">
          <div>
            <h2>{selected ? selected.title : 'Topic'}</h2>
            <p>{selected ? selected.objective || 'Lesson, summary and test.' : 'Select a topic to write its lesson and test.'}</p>
          </div>
          {selected
            ? <button className="admin-icon-btn" type="button" aria-label="Delete topic" onClick={() => void handleDeleteTopic()}><Trash2 size={16} /></button>
            : <FileText size={20} />}
        </div>

        {!selected ? (
          <div className="admin-chat-placeholder" style={{ minHeight: 220 }}>
            <BookOpen size={34} />
            <p>Pick a topic from the list.</p>
          </div>
        ) : (
          <div className="admin-question-form">
            <div className="admin-form-row">
              <label>
                Questions
                <input type="number" min={3} max={15} value={qCount} onChange={e => setQCount(Number(e.target.value))} />
              </label>
              <label>
                Difficulty
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as typeof difficulty)}>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </label>
            </div>
            <button className="admin-secondary-btn" type="button" onClick={() => void handleGenLesson()} disabled={busy === 'lesson'} style={{ width: '100%' }}>
              <Wand2 size={16} />{busy === 'lesson' ? 'Generating lesson + test…' : 'Generate lesson + test'}
            </button>

            <label>
              Lesson (what the learner reads)
              <textarea rows={8} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Generate or write the lesson…" />
            </label>
            <label>
              Summary
              <textarea rows={3} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Key points recap…" />
            </label>

            {draftQ.length > 0 ? (
              <div className="admin-ai-questions" style={{ maxHeight: 320 }}>
                {draftQ.map((q, i) => (
                  <article className="admin-ai-question" key={i}>
                    <header><strong>Q{i + 1}</strong><span className="admin-package-chip">{q.difficulty}</span></header>
                    <p className="admin-ai-qtext">{q.text}</p>
                    <ul>
                      {q.options.map((opt, oi) => (
                        <li key={oi} className={oi === q.correctIndex ? 'is-correct' : ''}>
                          {oi === q.correctIndex && <CheckCircle size={14} />}{opt}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                {selected.questionCount ? `${selected.questionCount} test questions saved — edit them in the Questions section.` : 'No test yet — generate one above.'}
              </p>
            )}

            <div className="admin-form-actions">
              <button className="admin-primary-btn" type="button" onClick={() => void handleSave()} disabled={busy === 'save' || !desc.trim()}>
                <Save size={16} />
                {busy === 'save' ? 'Saving…' : draftQ.length > 0 ? 'Save lesson + test' : 'Save lesson'}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default AiContentSection;
