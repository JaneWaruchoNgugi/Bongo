import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, CheckCircle, ChevronRight, ClipboardList, FileText, Layers,
  Save, Sparkles, Trash2, Wand2,
} from 'lucide-react';
import { GRADES, subjectsForGrade, bandForGrade, BAND_LABELS } from '../../lib/cbcSubjects';
import {
  deleteTopic, generateSyllabus, generateTopicLesson, saveSyllabus, saveTopicContent,
  subjectIdFor, subscribeSubjects, subscribeTopics, updateTopic,
  type Subject, type Topic,
} from '../../lib/curriculum';
import { generateQuestions, type GeneratedQuestion } from '../../lib/content';
import SvgFigure from '../learn/SvgFigure';
import {
  createExam, deleteExam, saveExamQuestions, subscribeExams, updateExam, type ExamMeta,
} from '../../lib/exams';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
const gradeNum = (g: string) => parseInt(g.replace(/\D/g, ''), 10) || 0;

type Msg = { type: 'ok' | 'err'; text: string } | null;

const CurriculumBrowser: React.FC = () => {
  // Navigation state — null grade = grades view, grade+null subject = subjects view, etc.
  const [grade, setGrade] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [tab, setTab] = useState<'topics' | 'exams'>('topics');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<ExamMeta[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);

  const subjectId = useMemo(
    () => (grade && subject ? subjectIdFor(grade, subject) : ''),
    [grade, subject],
  );

  useEffect(() => subscribeSubjects(setSubjects), []);
  useEffect(() => subscribeExams(setExams), []);
  useEffect(() => {
    if (!subjectId) { setTopics([]); return; }
    return subscribeTopics(subjectId, setTopics);
  }, [subjectId]);

  const note = (type: 'ok' | 'err', text: string) => setMsg({ type, text });
  const err = (e: unknown) => note('err', (e as { message?: string }).message ?? 'Something went wrong.');

  // Count of subjects that already have saved topics, per grade.
  const readySubjectsByGrade = useMemo(() => {
    const map: Record<string, number> = {};
    subjects.forEach(s => { if ((s.topicCount ?? 0) > 0) map[s.grade] = (map[s.grade] ?? 0) + 1; });
    return map;
  }, [subjects]);

  const subjectMeta = (g: string, name: string) =>
    subjects.find(s => s.id === subjectIdFor(g, name));

  const examsFor = (g: string, name: string) =>
    exams.filter(e => e.grade === g && e.subject === name);

  /* ── Generators ─────────────────────────────────────────── */
  const genSyllabus = async () => {
    if (!grade || !subject) return;
    setBusy('syllabus'); setMsg(null);
    try {
      const { topics: t } = await generateSyllabus({ grade, subject, count: 10 });
      await saveSyllabus(grade, subject, t);
      note('ok', `Generated and saved ${t.length} topics for ${subject}.`);
    } catch (e) { err(e); } finally { setBusy(null); }
  };

  const genMockExam = async () => {
    if (!grade || !subject) return;
    setBusy('exam'); setMsg(null);
    try {
      const title = `${subject} Mock Exam — ${grade}`;
      const id = await createExam({ grade, subject, title, durationMin: 40, difficulty: 'Medium', status: 'draft' });
      const { questions } = await generateQuestions({ grade, subject, count: 15, difficulty: 'Medium' });
      await saveExamQuestions(id, questions);
      await updateExam(id, { status: 'published' });
      note('ok', `Generated a ${questions.length}-question mock exam.`);
    } catch (e) { err(e); } finally { setBusy(null); }
  };

  /* ── Breadcrumbs ────────────────────────────────────────── */
  const crumbs = (
    <nav className="cur-crumbs" aria-label="Breadcrumb">
      <button className="cur-crumb" onClick={() => { setGrade(null); setSubject(null); setTopic(null); setMsg(null); }}>
        <Layers size={14} /> All grades
      </button>
      {grade && (
        <>
          <ChevronRight size={14} className="cur-crumb-sep" />
          <button className="cur-crumb" onClick={() => { setSubject(null); setTopic(null); setMsg(null); }}>{grade}</button>
        </>
      )}
      {grade && subject && (
        <>
          <ChevronRight size={14} className="cur-crumb-sep" />
          <button className="cur-crumb" onClick={() => { setTopic(null); setMsg(null); }}>{subject}</button>
        </>
      )}
      {topic && (
        <>
          <ChevronRight size={14} className="cur-crumb-sep" />
          <span className="cur-crumb is-current">{topic.title}</span>
        </>
      )}
    </nav>
  );

  return (
    <div className="cur-root">
      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Curriculum</h2>
            <p>Browse grades → subjects → topics. Generate anything that's missing.</p>
          </div>
          <Sparkles size={20} />
        </div>

        {crumbs}

        {/* ── Grades ── */}
        {!grade && (
          <div className="cur-grade-grid">
            {GRADES.map(g => {
              const all = subjectsForGrade(g).length;
              const ready = readySubjectsByGrade[g] ?? 0;
              return (
                <button key={g} className="cur-grade-card" onClick={() => { setGrade(g); setSubject(null); setTopic(null); }}>
                  <span className="cur-grade-num">{gradeNum(g)}</span>
                  <span className="cur-grade-name">{g}</span>
                  <span className="cur-grade-band">{BAND_LABELS[bandForGrade(g)].split(' (')[0]}</span>
                  <span className={`cur-grade-meta ${ready ? 'is-ready' : 'is-empty'}`}>
                    {ready ? `${ready}/${all} subjects ready` : `${all} subjects`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Subjects ── */}
        {grade && !subject && (
          <div className="cur-subject-grid">
            {subjectsForGrade(grade).map(name => {
              const meta = subjectMeta(grade, name);
              const tCount = meta?.topicCount ?? 0;
              const eCount = examsFor(grade, name).length;
              return (
                <button key={name} className="cur-subject-card" onClick={() => { setSubject(name); setTab('topics'); setTopic(null); setMsg(null); }}>
                  <div className="cur-subject-icon"><BookOpen size={18} /></div>
                  <div className="cur-subject-body">
                    <strong>{name}</strong>
                    <small>{tCount ? `${tCount} topics` : 'No topics yet'} · {eCount ? `${eCount} mock` : 'No mock exam'}</small>
                  </div>
                  <span className={`admin-status ${tCount ? 'is-live' : 'is-draft'}`}>{tCount ? 'Ready' : 'Empty'}</span>
                  <ChevronRight size={16} />
                </button>
              );
            })}
          </div>
        )}

        {/* ── Topics + Mock exams for a subject ── */}
        {grade && subject && !topic && (
          <>
            <div className="cur-tabs">
              <button className={`cur-tab ${tab === 'topics' ? 'is-active' : ''}`} onClick={() => setTab('topics')}>
                <FileText size={15} /> Topics
              </button>
              <button className={`cur-tab ${tab === 'exams' ? 'is-active' : ''}`} onClick={() => setTab('exams')}>
                <ClipboardList size={15} /> Mock exams
              </button>
            </div>

            {tab === 'topics' && (
              <>
                {topics.length === 0 ? (
                  <div className="cur-empty">
                    <BookOpen size={30} />
                    <p>No topics for {grade} · {subject} yet.</p>
                    <button className="admin-primary-btn" onClick={() => void genSyllabus()} disabled={busy === 'syllabus'}>
                      <Wand2 size={16} />{busy === 'syllabus' ? 'Generating syllabus…' : 'Generate syllabus'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="cur-toolbar">
                      <span className="cur-toolbar-label">{topics.length} topics</span>
                      <button className="admin-secondary-btn" onClick={() => void genSyllabus()} disabled={busy === 'syllabus'}>
                        <Wand2 size={16} />{busy === 'syllabus' ? 'Generating…' : 'Generate more'}
                      </button>
                    </div>
                    <ul className="admin-topic-list">
                      {topics.map(t => (
                        <li key={t.id}>
                          <button type="button" className="admin-topic-btn" onClick={() => { setTopic(t); setMsg(null); }}>
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
                    </ul>
                  </>
                )}
              </>
            )}

            {tab === 'exams' && (
              <>
                {examsFor(grade, subject).length === 0 ? (
                  <div className="cur-empty">
                    <ClipboardList size={30} />
                    <p>No mock exam for {grade} · {subject} yet.</p>
                    <button className="admin-primary-btn" onClick={() => void genMockExam()} disabled={busy === 'exam'}>
                      <Wand2 size={16} />{busy === 'exam' ? 'Generating mock exam…' : 'Generate mock exam'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="cur-toolbar">
                      <span className="cur-toolbar-label">{examsFor(grade, subject).length} mock exam(s)</span>
                      <button className="admin-secondary-btn" onClick={() => void genMockExam()} disabled={busy === 'exam'}>
                        <Wand2 size={16} />{busy === 'exam' ? 'Generating…' : 'Generate another'}
                      </button>
                    </div>
                    <ul className="admin-topic-list">
                      {examsFor(grade, subject).map(e => (
                        <li key={e.id}>
                          <div className="admin-topic-btn" style={{ cursor: 'default' }}>
                            <span className="admin-topic-order"><ClipboardList size={14} /></span>
                            <span className="admin-topic-main">
                              <strong>{e.title}</strong>
                              <small>{e.questionCount ?? 0} questions · {e.durationMin ?? 0} min</small>
                            </span>
                            <span className={`admin-status ${e.status === 'published' ? 'is-live' : 'is-draft'}`}>{e.status}</span>
                            <button type="button" className="admin-icon-btn" aria-label="Delete exam"
                              onClick={() => { if (window.confirm(`Delete "${e.title}"?`)) void deleteExam(e.id).catch(err); }}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── Single topic content editor ── */}
        {topic && grade && subject && (
          <TopicEditor
            grade={grade}
            subject={subject}
            topic={topic}
            onDeleted={() => setTopic(null)}
            note={note}
            err={err}
          />
        )}

        {msg && <p className={`cur-msg ${msg.type}`}>{msg.text}</p>}
      </section>
    </div>
  );
};

/* ── Topic content editor (lesson + summary + test) ─────────── */
const TopicEditor: React.FC<{
  grade: string;
  subject: string;
  topic: Topic;
  onDeleted: () => void;
  note: (t: 'ok' | 'err', s: string) => void;
  err: (e: unknown) => void;
}> = ({ grade, subject, topic, onDeleted, note, err }) => {
  const [desc, setDesc] = useState(topic.description ?? '');
  const [summary, setSummary] = useState(topic.summary ?? '');
  const [draftQ, setDraftQ] = useState<GeneratedQuestion[]>([]);
  const [qCount, setQCount] = useState('5');
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('Medium');
  const [busy, setBusy] = useState<'lesson' | 'save' | null>(null);

  useEffect(() => {
    setDesc(topic.description ?? '');
    setSummary(topic.summary ?? '');
    setDraftQ([]);
  }, [topic.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const genLesson = async () => {
    setBusy('lesson');
    try {
      const count = Math.max(1, parseInt(qCount, 10) || 5);
      const r = await generateTopicLesson({ grade, subject, topic: topic.title, count, difficulty });
      setDesc(r.description); setSummary(r.summary); setDraftQ(r.questions);
      note('ok', `Generated a lesson and ${r.questions.length} test questions — review and save.`);
    } catch (e) { err(e); } finally { setBusy(null); }
  };

  const save = async () => {
    setBusy('save');
    try {
      if (draftQ.length > 0) {
        await saveTopicContent(topic, { description: desc, summary }, draftQ);
        setDraftQ([]);
        note('ok', 'Lesson and test saved.');
      } else {
        await updateTopic(topic.id, { description: desc, summary, status: 'published' });
        note('ok', 'Lesson saved.');
      }
    } catch (e) { err(e); } finally { setBusy(null); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${topic.title}" and its questions?`)) return;
    await deleteTopic(topic).catch(err);
    onDeleted();
  };

  return (
    <div className="admin-question-form cur-topic-editor">
      <div className="cur-topic-head">
        <div>
          <h3>{topic.title}</h3>
          <p>{topic.objective || 'Write the lesson and test for this topic.'}</p>
        </div>
        <button className="admin-icon-btn" type="button" aria-label="Delete topic" onClick={() => void remove()}>
          <Trash2 size={16} />
        </button>
      </div>

      <div className="admin-form-row">
        <label>Questions
          <input type="number" min={1} value={qCount} onChange={e => setQCount(e.target.value)}
            placeholder="e.g. 20" />
        </label>
        <label>Difficulty
          <select value={difficulty} onChange={e => setDifficulty(e.target.value as typeof difficulty)}>
            {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
          </select>
        </label>
      </div>
      <button className="admin-secondary-btn" type="button" onClick={() => void genLesson()} disabled={busy === 'lesson'} style={{ width: '100%' }}>
        <Wand2 size={16} />{busy === 'lesson' ? 'Generating lesson + test…' : 'Generate lesson + test'}
      </button>

      <label>Lesson (what the learner reads)
        <textarea rows={8} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Generate or write the lesson…" />
      </label>
      <label>Summary
        <textarea rows={3} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Key points recap…" />
      </label>

      {draftQ.length > 0 ? (
        <div className="admin-ai-questions" style={{ maxHeight: 320 }}>
          {draftQ.map((q, i) => (
            <article className="admin-ai-question" key={i}>
              <header><strong>Q{i + 1}</strong><span className="admin-package-chip">{q.difficulty}</span></header>
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
      ) : (
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          {topic.questionCount ? `${topic.questionCount} test questions saved.` : 'No test yet — generate one above.'}
        </p>
      )}

      <div className="admin-form-actions">
        <button className="admin-primary-btn" type="button" onClick={() => void save()} disabled={busy === 'save' || !desc.trim()}>
          <Save size={16} />{busy === 'save' ? 'Saving…' : draftQ.length > 0 ? 'Save lesson + test' : 'Save lesson'}
        </button>
      </div>
    </div>
  );
};

export default CurriculumBrowser;
