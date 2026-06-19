import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  Flame,
  GraduationCap,
  Rocket,
  Star,
  Target,
  Trophy,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  subscribeProgress,
  subscribePublishedExams,
  subscribeSubjectsByGrade,
  subscribeTopScores,
  unlockAchievements,
  type ExamMeta,
  type ProgressDoc,
  type ScoreEntry,
  type Subject,
} from '../../lib/learn';
import { dayKey, levelInfo, weekDays } from '../../lib/gamification';
import { currentState, todaysChallenge } from '../../lib/challenges';
import { pendingUnlocks } from '../../lib/achievements';
import { iconFor, PALETTE, themeFor } from './subjectVisuals';
import { useActiveProfile } from './useProfile';
import heroImg from '../../assets/hero-learner.png';
import '../../styles/dashboard-learner.css';

const LearnHome: React.FC = () => {
  const { accountId, profile } = useActiveProfile();
  const setOverlay = useStore(s => s.setOverlay);
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progress, setProgress] = useState<ProgressDoc>({});
  const [exams, setExams] = useState<ExamMeta[]>([]);
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    if (!profile) return;
    return subscribeSubjectsByGrade(profile.grade, setSubjects);
  }, [profile?.grade]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile) return;
    return subscribePublishedExams(profile.grade, setExams);
  }, [profile?.grade]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!accountId || !profile) return;
    return subscribeProgress(accountId, profile.id, setProgress);
  }, [accountId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => subscribeTopScores(setScores, 100), []);

  // Passively unlock any achievements whose goals are now met.
  useEffect(() => {
    if (!accountId || !profile) return;
    const pending = pendingUnlocks(progress);
    if (pending.length) unlockAchievements(accountId, profile.id, pending).catch(() => {});
  }, [accountId, profile?.id, progress]); // eslint-disable-line react-hooks/exhaustive-deps

  const completedFor = (id: string) =>
    Object.values(progress.topics ?? {}).filter(t => t.subjectId === id && t.completed).length;

  /* Continue Learning: in-progress subjects, most-recent first. */
  const continueById = new Map(subjects.map(s => [s.id, s]));
  const continueSeen = new Set<string>();
  const continueItems: { subject: Subject; done: number; total: number }[] = [];
  const pushContinue = (id: string) => {
    const s = continueById.get(id);
    if (!s || continueSeen.has(id)) return;
    const total = s.topicCount ?? 0;
    const done = completedFor(id);
    if (total > 0 && done < total && done > 0) { continueItems.push({ subject: s, done, total }); continueSeen.add(id); }
  };
  (progress.recent ?? []).forEach(r => pushContinue(r.subjectId));
  subjects.forEach(s => pushContinue(s.id)); // fill with any other started subjects
  const continueTop = continueItems.slice(0, 3);

  /* Hot Topics: recently-touched topics the student still needs to work on. */
  const hotTopics = (progress.recent ?? [])
    .filter(r => r.topicId)
    .map(r => {
      const tp = progress.topics?.[r.topicId!];
      const needsWork = !tp?.completed || (tp.total > 0 && tp.bestScore / tp.total < 0.6);
      return { ...r, needsWork };
    })
    .filter(r => r.needsWork)
    .slice(0, 10);

  const lvl = levelInfo(progress.xp ?? 0);
  const week = weekDays(progress.activeDays, dayKey());
  const challenge = todaysChallenge();
  const chState = currentState(progress.challenge);

  /* Top learners: aggregate leaderboard points by player. */
  const learnerTotals = new Map<string, number>();
  scores.forEach(s => learnerTotals.set(s.player ?? 'Anonymous', (learnerTotals.get(s.player ?? 'Anonymous') ?? 0) + (s.points ?? s.score ?? 0)));
  const topLearners = [...learnerTotals.entries()]
    .map(([name, xp]) => ({ name, xp }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);

  if (!profile) {
    return (
      <div className="ln-page ln-center">
        <GraduationCap size={40} />
        <p>Pick a profile to start learning.</p>
        <button className="ln-btn ln-btn-primary" onClick={() => setOverlay('profile-select')}>Choose profile</button>
      </div>
    );
  }

  const resumeFirst = () => navigate(continueTop[0] ? `/learn/subject/${continueTop[0].subject.id}` : '/subjects');

  return (
    <div className="lx-dash">
      <div className="lx-dash-main">
        {/* ── Hero ── */}
        <section className="lx-hero">
          <div className="lx-hero-text">
            <h1>Hi <span className="lx-hero-name">{profile.username}</span> 👋</h1>
            <p className="lx-hero-sub">Ready to learn today?</p>
            <div className="lx-hero-stats">
              <span><Flame size={18} className="lx-i-fire" /> <strong>{progress.streak ?? 0}</strong> Day Streak</span>
              <span><Star size={18} className="lx-i-gold" /> <strong>{progress.xp ?? 0}</strong> Total XP</span>
              <span><BookOpen size={18} className="lx-i-blue" /> <strong>{subjects.length}</strong> Subjects</span>
            </div>
            <div className="lx-hero-actions">
              <button className="ln-btn ln-btn-primary" onClick={resumeFirst}>Continue Learning <ChevronRight size={16} /></button>
              <button className="ln-btn lx-btn-ghost" onClick={() => navigate('/exams')}>Take Mock Exam</button>
            </div>
          </div>
          <div className="lx-hero-art" style={{ backgroundImage: `url(${heroImg})` }} />
        </section>

        {/* ── Hot Topics (what to work on) ── */}
        {hotTopics.length > 0 && (
          <section className="lx-block">
            <div className="lx-block-head"><h2>🔥 Hot Topics This Week</h2></div>
            <div className="lx-hot-row">
              {hotTopics.map((h, i) => {
                const t = themeFor(i);
                return (
                  <Link
                    key={h.topicId}
                    to={`/learn/topic/${h.topicId}`}
                    className="lx-hot"
                    style={{ '--c': t.accent, '--c2': t.deep } as React.CSSProperties}
                  >
                    <span className="lx-hot-tag">{h.subjectName ?? 'Topic'}</span>
                    <span className="lx-hot-title">{h.topicTitle}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Continue Learning ── */}
        {continueTop.length > 0 && (
          <section className="lx-block">
            <div className="lx-block-head">
              <h2>Continue Learning</h2>
              <Link to="/subjects" className="lx-view-all">View all <ChevronRight size={15} /></Link>
            </div>
            <div className="lx-continue-row">
              {continueTop.map(({ subject, done, total }, i) => {
                const t = themeFor(i);
                const Icon = iconFor(subject.name);
                const pct = Math.round((done / total) * 100);
                return (
                  <div key={subject.id} className="lx-continue" style={{ '--c': t.accent, '--c2': t.deep, '--soft': t.soft } as React.CSSProperties}>
                    <div className="lx-continue-top">
                      <span className="lx-continue-ic"><Icon size={22} strokeWidth={2.2} /></span>
                      <div>
                        <strong>{subject.name}</strong>
                        <span>Topic {Math.min(done + 1, total)} / {total}</span>
                      </div>
                    </div>
                    <div className="ln-card-progress"><span style={{ width: `${pct}%` }} /></div>
                    <Link to={`/learn/subject/${subject.id}`} className="lx-continue-cta">Resume <ChevronRight size={15} /></Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Subjects ── */}
        <section className="lx-block">
          <div className="lx-block-head">
            <h2>Subjects</h2>
            <Link to="/subjects" className="lx-view-all">View all <ChevronRight size={15} /></Link>
          </div>
          {subjects.length === 0 ? (
            <div className="ln-empty-card"><BookOpen size={36} /><p>No subjects published for Grade {profile.grade} yet.</p></div>
          ) : (
            <div className="lx-hscroll">
              {subjects.map((s, i) => {
                const t = themeFor(i);
                const Icon = iconFor(s.name);
                const total = s.topicCount ?? 0;
                const done = completedFor(s.id);
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={s.id} className="lx-subject" style={{ '--c': t.accent, '--c2': t.deep, '--soft': t.soft } as React.CSSProperties}>
                    <div className="lx-subject-top">
                      <span className="lx-subject-ic"><Icon size={20} strokeWidth={2.2} /></span>
                      <strong>{s.name}</strong>
                    </div>
                    <span className="lx-subject-meta">{total} Topics</span>
                    <span className="lx-subject-meta lx-muted">Progress {pct}%</span>
                    <div className="ln-card-progress"><span style={{ width: `${pct}%` }} /></div>
                    <Link to={`/learn/subject/${s.id}`} className="lx-subject-cta">Start Learning <ChevronRight size={15} /></Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Mock Exams ── */}
        <section className="lx-block">
          <div className="lx-block-head">
            <h2>Mock Exams</h2>
            {exams.length > 0 && <Link to="/exams" className="lx-view-all">View all <ChevronRight size={15} /></Link>}
          </div>
          {exams.length === 0 ? (
            <div className="ln-empty-card"><ClipboardList size={36} /><p>No mock exams published for Grade {profile.grade} yet.</p></div>
          ) : (
            <div className="lx-hscroll">
              {exams.map((ex, i) => {
                const t = themeFor(i + 1);
                return (
                  <div key={ex.id} className="lx-exam" style={{ '--c': t.accent, '--c2': t.deep, '--soft': t.soft } as React.CSSProperties}>
                    <div className="lx-exam-top">
                      <span className="lx-exam-ic"><ClipboardList size={18} /></span>
                      <strong>{ex.title} — Grade {profile.grade}</strong>
                    </div>
                    <div className="lx-exam-meta">
                      <span>📋 {ex.questionCount ?? 0} Questions</span>
                      <span>⏱ {ex.durationMin ?? 0} Minutes</span>
                      <span>⭐ {ex.difficulty ?? 'Medium'}</span>
                    </div>
                    <Link to={`/exams/${ex.id}`} className="lx-exam-cta">Start Exam</Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Books ── */}
        {subjects.length > 0 && (
          <section className="lx-block">
            <div className="lx-block-head">
              <h2>HighScores Books</h2>
              <Link to="/books" className="lx-view-all">View all books <ChevronRight size={15} /></Link>
            </div>
            <div className="lx-hscroll">
              {subjects.slice(0, 6).map((s, i) => {
                const t = themeFor(i);
                const Icon = iconFor(s.name);
                return (
                  <div key={s.id} className="ln-book" style={{ '--c': t.accent, '--c2': t.deep } as React.CSSProperties}>
                    <div className="ln-book-cover">
                      <span className="ln-book-emoji"><Icon size={24} strokeWidth={2.2} /></span>
                      <span className="ln-book-title">{s.name}</span>
                      <span className="ln-book-grade">Grade {profile.grade}</span>
                    </div>
                    <Link to={`/book/${s.id}`} className="ln-book-cta"><BookOpen size={15} /> Read Book</Link>
                  </div>
                );
              })}
              <div className="ln-book" style={{ '--c': PALETTE[6].accent, '--c2': PALETTE[6].deep } as React.CSSProperties}>
                <div className="ln-book-cover">
                  <span className="ln-book-emoji"><ClipboardList size={24} strokeWidth={2.2} /></span>
                  <span className="ln-book-title">Revision &amp; Practice</span>
                  <span className="ln-book-grade">Grade {profile.grade}</span>
                </div>
                <Link to="/books" className="ln-book-cta"><BookOpen size={15} /> View</Link>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ── Right rail ── */}
      <aside className="lx-rail">
        {/* Daily Streak */}
        <div className="lx-widget">
          <div className="lx-widget-head"><Flame size={18} className="lx-i-fire" /> <strong>Daily Streak</strong></div>
          <div className="lx-week">
            {week.map(d => (
              <div key={d.key} className={`lx-day${d.active ? ' on' : ''}${d.isToday ? ' today' : ''}`}>
                <span className="lx-day-dot">{d.active ? <Check size={14} /> : ''}</span>
                <span className="lx-day-lbl">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* XP Progress */}
        <div className="lx-widget">
          <div className="lx-widget-head"><Star size={18} className="lx-i-gold" /> <strong>XP Progress</strong></div>
          <div className="lx-xp-row">
            <div className="lx-xp-big">{lvl.inLevel}<span> / {lvl.need} XP</span></div>
            <Rocket size={26} className="lx-i-rocket" />
          </div>
          <div className="ln-card-progress"><span style={{ width: `${lvl.pct}%` }} /></div>
          <div className="lx-xp-foot"><span>Level {lvl.level}</span><span>{lvl.pct}%</span></div>
        </div>

        {/* Top Learners */}
        <div className="lx-widget">
          <div className="lx-widget-head"><Trophy size={18} className="lx-i-gold" /> <strong>Top Learners</strong>
            <Link to="/leaderboard" className="lx-view-all lx-right">View all</Link>
          </div>
          {topLearners.length === 0 ? (
            <p className="lx-muted lx-pad">No scores yet.</p>
          ) : (
            <ol className="lx-learners">
              {topLearners.map((l, i) => (
                <li key={l.name} className={l.name === profile.username ? 'me' : ''}>
                  <span className={`lx-rank r${i + 1}`}>{i + 1}</span>
                  <span className="lx-learner-name">{l.name}</span>
                  <span className="lx-learner-xp">{l.xp} XP</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Upcoming / Available Exams */}
        <div className="lx-widget">
          <div className="lx-widget-head"><Calendar size={18} className="lx-i-red" /> <strong>Available Exams</strong></div>
          {exams.length === 0 ? (
            <p className="lx-muted lx-pad">No exams yet.</p>
          ) : (
            exams.slice(0, 2).map(ex => (
              <Link key={ex.id} to={`/exams/${ex.id}`} className="lx-upcoming">
                <span className="lx-upcoming-ic"><ClipboardList size={16} /></span>
                <div>
                  <strong>{ex.title}</strong>
                  <span>{ex.subject} · {ex.questionCount ?? 0} questions</span>
                </div>
                <ChevronRight size={16} />
              </Link>
            ))
          )}
        </div>

        {/* Today's Challenge */}
        <div className="lx-widget lx-widget-challenge">
          <div className="lx-widget-head"><Target size={18} /> <strong>Today&apos;s Challenge</strong></div>
          <p className="lx-challenge-desc">{challenge.desc}</p>
          <div className="ln-card-progress"><span style={{ width: `${Math.round((chState.progress / challenge.goal) * 100)}%` }} /></div>
          <div className="lx-challenge-reward">Reward <strong>⚡ {challenge.rewardXp} XP</strong></div>
          <button className="ln-btn ln-btn-primary lx-full" onClick={() => navigate('/challenges')}>
            {chState.claimed ? 'Completed ✓' : chState.completed ? 'Claim reward' : 'Start Challenge'}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default LearnHome;
