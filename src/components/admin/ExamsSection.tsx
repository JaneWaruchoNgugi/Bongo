import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, ClipboardList, Clock, Plus, Save, ScanLine, Trash2, Wand2, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { GRADES, subjectsForGrade } from '../../lib/cbcSubjects';
import { generateQuestions, extractQuestionsFromFile, type GeneratedQuestion, type CbcReview } from '../../lib/content';
import SvgFigure from '../learn/SvgFigure';
import {
  createExam,
  deleteExam,
  getExamQuestions,
  saveExamQuestions,
  subscribeExams,
  updateExam,
  type ExamMeta,
} from '../../lib/exams';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

const ExamsSection: React.FC = () => {
  const [exams, setExams] = useState<ExamMeta[]>([]);
  const [selected, setSelected] = useState<ExamMeta | null>(null);
  const [draft, setDraft] = useState<GeneratedQuestion[]>([]);
  const [cbcReview, setCbcReview] = useState<CbcReview | null>(null);
  const [busy, setBusy] = useState<'create' | 'gen' | 'save' | 'scan' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // New-exam form
  const [grade, setGrade] = useState('Grade 6');
  const subjects = useMemo(() => subjectsForGrade(grade), [grade]);
  const [subject, setSubject] = useState('Mathematics');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(40);
  const [count, setCount] = useState<number | ''>(15);
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('Medium');

  useEffect(() => subscribeExams(setExams), []);
  useEffect(() => { if (!subjects.includes(subject)) setSubject(subjects[0]); }, [subjects]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load an exam's questions into the editable draft when selected.
  useEffect(() => {
    setCbcReview(null);
    if (!selected) { setDraft([]); return; }
    getExamQuestions(selected.id).then(setDraft).catch(() => setDraft([]));
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const note = (type: 'ok' | 'err', text: string) => setMsg({ type, text });
  const err = (e: unknown) => note('err', (e as { message?: string }).message ?? 'Something went wrong.');

  const handleCreate = async () => {
    setBusy('create'); setMsg(null);
    try {
      const examTitle = title.trim() || `${subject} Mock Exam — ${grade}`;
      const id = await createExam({ grade, subject, title: examTitle, durationMin: duration, difficulty, status: 'draft' });
      setTitle('');
      setSelected({ id, grade, subject, title: examTitle, durationMin: duration, difficulty, status: 'draft' });
      note('ok', 'Exam created. Generate its questions.');
    } catch (e) { err(e); } finally { setBusy(null); }
  };

  const handleGenerate = async (append: boolean) => {
    if (!selected) return;
    setBusy('gen'); setMsg(null);
    try {
      const { questions, cbcReview: review } = await generateQuestions({
        grade: selected.grade, subject: selected.subject, count: Math.max(1, Number(count) || 15), difficulty: selected.difficulty,
      });
      setDraft(prev => (append ? [...prev, ...questions] : questions));
      setCbcReview(review);
      const cbcNote = review ? ` CBC alignment: ${review.score}/100 (${review.aligned ? 'aligned' : 'needs review'}).` : '';
      note('ok', `Generated ${questions.length} questions.${cbcNote}`);
    } catch (e) { err(e); } finally { setBusy(null); }
  };

  const handleScan = async (file: File) => {
    if (!selected) return;
    if (file.size > 7 * 1024 * 1024) { note('err', 'File is too large. Use a file under 7MB.'); return; }
    setBusy('scan'); setMsg(null); setCbcReview(null);
    try {
      const { questions } = await extractQuestionsFromFile(file, {
        grade: selected.grade, subject: selected.subject,
      });
      setDraft(prev => [...prev, ...questions]);
      note('ok', `Scanned ${questions.length} question${questions.length === 1 ? '' : 's'} from the upload — review and save.`);
    } catch (e) { err(e); } finally { setBusy(null); }
  };

  const handleSave = async (publish: boolean) => {
    if (!selected) return;
    setBusy('save'); setMsg(null);
    try {
      await saveExamQuestions(selected.id, draft);
      await updateExam(selected.id, { status: publish ? 'published' : 'draft' });
      setSelected({ ...selected, status: publish ? 'published' : 'draft', questionCount: draft.length });
      note('ok', publish ? 'Exam saved & published.' : 'Draft saved.');
    } catch (e) { err(e); } finally { setBusy(null); }
  };

  const handleDelete = async (exam: ExamMeta) => {
    if (!window.confirm(`Delete "${exam.title}" and its questions?`)) return;
    if (selected?.id === exam.id) setSelected(null);
    await deleteExam(exam.id).catch(err);
  };

  return (
    <div className="admin-content-grid">
      {/* Left — exam list + create */}
      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Mock Exams</h2>
            <p>Create a timed exam, then generate its questions with Claude.</p>
          </div>
          <ClipboardList size={20} />
        </div>

        <div className="admin-question-form" style={{ marginBottom: 16 }}>
          <div className="admin-form-row">
            <label>Grade
              <select value={grade} onChange={e => setGrade(e.target.value)}>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </label>
            <label>Subject
              <select value={subject} onChange={e => setSubject(e.target.value)}>
                {subjects.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <label>Title (optional)
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={`${subject} Mock Exam — ${grade}`} />
          </label>
          <div className="admin-form-row">
            <label>Duration (min)
              <input type="number" min={5} max={180} value={duration} onChange={e => setDuration(Number(e.target.value))} />
            </label>
            <label>Difficulty
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as typeof difficulty)}>
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </select>
            </label>
          </div>
          <div className="admin-form-actions">
            <button className="admin-primary-btn" type="button" onClick={() => void handleCreate()} disabled={busy === 'create'}>
              <Plus size={16} />{busy === 'create' ? 'Creating…' : 'Create exam'}
            </button>
          </div>
        </div>

        <div className="admin-topic-list">
          {exams.map(ex => (
            <div key={ex.id} className={`admin-topic-btn ${selected?.id === ex.id ? 'is-active' : ''}`} style={{ cursor: 'default' }}>
              <button type="button" className="admin-topic-main" style={{ background: 'none', border: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit' }} onClick={() => setSelected(ex)}>
                <strong>{ex.title}</strong>
                <small>{ex.grade} · {ex.subject} · {ex.questionCount ?? 0} Qs · {ex.durationMin ?? 0} min</small>
              </button>
              <span className={`admin-status ${ex.status === 'published' ? 'is-live' : 'is-draft'}`}>{ex.status}</span>
              <button type="button" className="admin-row-actions" aria-label="Delete" onClick={() => void handleDelete(ex)} style={{ border: 0, background: 'none', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {exams.length === 0 && <p className="admin-chat-empty">No exams yet. Create one above.</p>}
        </div>
        {msg && <p style={{ color: msg.type === 'ok' ? '#067647' : '#b42318', fontSize: 13, marginTop: 12 }}>{msg.text}</p>}
      </section>

      {/* Right — exam editor */}
      <aside className="admin-panel admin-editor-panel">
        <div className="admin-panel-header">
          <div>
            <h2>{selected ? selected.title : 'Exam'}</h2>
            <p>{selected ? `${selected.grade} · ${selected.subject}` : 'Select or create an exam.'}</p>
          </div>
          {selected ? <span className="admin-status is-live"><Clock size={14} />{selected.durationMin ?? 0}m</span> : <ClipboardList size={20} />}
        </div>

        {!selected ? (
          <div className="admin-chat-placeholder" style={{ minHeight: 220 }}>
            <ClipboardList size={34} />
            <p>Create an exam, then generate its questions.</p>
          </div>
        ) : (
          <div className="admin-question-form">
            <div className="admin-form-row">
              <label>Questions / batch
                <input type="number" min={1} value={count}
                  onChange={e => setCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 20" />
              </label>
              <label>&nbsp;
                <button className="admin-secondary-btn" type="button" onClick={() => void handleGenerate(false)} disabled={busy != null}>
                  <Wand2 size={16} />{busy === 'gen' ? 'Generating…' : 'Generate'}
                </button>
              </label>
            </div>
            {draft.length > 0 && (
              <button className="admin-secondary-btn" type="button" onClick={() => void handleGenerate(true)} disabled={busy != null} style={{ width: '100%' }}>
                <Plus size={16} /> Generate more (append)
              </button>
            )}

            {/* AI scanner — extract questions from an uploaded image or PDF */}
            <div className="exam-scan">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) void handleScan(f);
                  e.target.value = '';
                }}
              />
              <button className="admin-secondary-btn exam-scan-btn" type="button"
                onClick={() => fileInputRef.current?.click()} disabled={busy != null} style={{ width: '100%' }}>
                <ScanLine size={16} />{busy === 'scan' ? 'Scanning upload…' : 'Scan image / PDF for questions'}
              </button>
              <p className="exam-scan-hint">Upload a past paper, worksheet, or photo — AI extracts the questions. PNG, JPG, WebP, or PDF up to 7MB.</p>
            </div>

            <p style={{ fontSize: 13, color: 'var(--muted)' }}>{draft.length} question{draft.length === 1 ? '' : 's'} in this exam.</p>

            {cbcReview && (
              <div className={`admin-cbc-review ${cbcReview.aligned ? 'is-aligned' : 'is-warn'}`}>
                <div className="admin-cbc-head">
                  {cbcReview.aligned ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                  <strong>CBC alignment: {cbcReview.score}/100</strong>
                  <span>{cbcReview.aligned ? 'Aligned' : 'Needs review'}</span>
                </div>
                <p className="admin-cbc-summary">{cbcReview.summary}</p>
                {cbcReview.questions.some(q => !q.aligned) && (
                  <ul className="admin-cbc-flags">
                    {cbcReview.questions.filter(q => !q.aligned).map(q => (
                      <li key={q.index}><strong>Q{q.index + 1}:</strong> {q.feedback}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="admin-ai-questions" style={{ maxHeight: 360 }}>
              {draft.map((q, i) => (
                <article className="admin-ai-question" key={i}>
                  <header>
                    <strong>Q{i + 1}</strong>
                    <span className="admin-package-chip">{q.difficulty}</span>
                    <button type="button" aria-label="Remove" onClick={() => setDraft(d => d.filter((_, idx) => idx !== i))}><X size={15} /></button>
                  </header>
                  <p className="admin-ai-qtext">{q.text}</p>
                  <SvgFigure diagram={q.diagram} className="ln-figure-sm" />
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

            <div className="admin-form-actions">
              <button className="admin-secondary-btn" type="button" onClick={() => void handleSave(false)} disabled={busy === 'save' || draft.length === 0}>
                <Save size={16} /> Save draft
              </button>
              <button className="admin-primary-btn" type="button" onClick={() => void handleSave(true)} disabled={busy === 'save' || draft.length === 0}>
                <CheckCircle size={16} />{busy === 'save' ? 'Saving…' : 'Save & publish'}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default ExamsSection;
