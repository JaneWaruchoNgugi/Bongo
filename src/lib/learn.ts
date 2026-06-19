// Student-facing reads + progress/score writes for the learning flow.
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Subject, Topic } from './curriculum';
import type { ExamMeta } from './exams';
import type { QuestionDiagram } from './content';
import { bumpStreak, dayKey } from './gamification';

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  diagram?: QuestionDiagram | null;
}

export interface TopicProgress {
  completed: boolean;
  bestScore: number;
  lastScore: number;
  total: number;
  attempts: number;
  subjectId?: string;
}

/** A subject/topic the learner recently touched — drives "Continue Learning". */
export interface RecentItem {
  subjectId: string;
  subjectName?: string;
  topicId?: string;
  topicTitle?: string;
  at: number; // epoch ms, for recency ordering
}

export interface ExamAttempt {
  examId: string;
  title?: string;
  subject?: string;
  bestScore: number;
  lastScore: number;
  total: number;
  attempts: number;
  at: number;
}

/** A daily challenge's progress for the active profile. */
export interface ChallengeState {
  date: string;        // 'YYYY-MM-DD'
  progress: number;    // e.g. correct answers so far
  completed: boolean;
  claimed: boolean;
}

export interface ScoreEntry {
  id: string;
  player?: string;
  game?: string;
  grade?: string;
  score?: number;
  points?: number;
  featured?: boolean;
  flagged?: boolean;
}
export interface ProgressDoc {
  topics?: Record<string, TopicProgress>;
  exams?: Record<string, ExamAttempt>;
  /** Lifetime XP for the active profile. */
  xp?: number;
  /** Consecutive-day streak. */
  streak?: number;
  /** Local 'YYYY-MM-DD' of the last day with any activity. */
  lastActiveDate?: string;
  /** Recent active day keys (kept trimmed) for the weekly streak widget. */
  activeDays?: string[];
  /** Most-recent-first list of touched subjects/topics. */
  recent?: RecentItem[];
  /** Unlocked achievement ids → epoch ms unlocked. */
  achievements?: Record<string, number>;
  /** Today's daily-challenge state. */
  challenge?: ChallengeState;
}

const gradeLabel = (grade: number | string) =>
  typeof grade === 'number' ? `Grade ${grade}` : grade;

/* ── Content reads ───────────────────────────────────────── */
export function subscribeSubjectsByGrade(grade: number | string, cb: (rows: Subject[]) => void): Unsubscribe {
  const q = query(collection(db, 'subjects'), where('grade', '==', gradeLabel(grade)));
  return onSnapshot(q, snap => {
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Subject, 'id'>) }));
    rows.sort((a, b) => a.name.localeCompare(b.name));
    cb(rows);
  });
}

export function subscribeTopics(subjectId: string, cb: (rows: Topic[]) => void): Unsubscribe {
  const q = query(collection(db, 'topics'), where('subjectId', '==', subjectId));
  return onSnapshot(q, snap => {
    const rows = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<Topic, 'id'>) }))
      .filter(t => t.status === 'published');
    rows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    cb(rows);
  });
}

export async function getTopic(topicId: string): Promise<Topic | null> {
  const snap = await getDoc(doc(db, 'topics', topicId));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Topic, 'id'>) }) : null;
}

export async function getTopicQuestions(topicId: string): Promise<QuizQuestion[]> {
  const snap = await getDocs(query(collection(db, 'questions'), where('topicId', '==', topicId)));
  return snap.docs
    .filter(d => (d.data().status ?? 'published') === 'published')
    .map(d => {
      const q = d.data();
      return { id: d.id, text: q.text, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, diagram: q.diagram ?? null };
    });
}

/* ── Exams ───────────────────────────────────────────────── */
export function subscribePublishedExams(grade: number | string, cb: (rows: ExamMeta[]) => void): Unsubscribe {
  const q = query(collection(db, 'exams'), where('grade', '==', gradeLabel(grade)));
  return onSnapshot(q, snap => {
    const rows = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<ExamMeta, 'id'>) }))
      .filter(e => e.status === 'published');
    rows.sort((a, b) => a.title.localeCompare(b.title));
    cb(rows);
  });
}

export async function getExam(examId: string): Promise<ExamMeta | null> {
  const snap = await getDoc(doc(db, 'exams', examId));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<ExamMeta, 'id'>) }) : null;
}

export async function getExamQuestions(examId: string): Promise<QuizQuestion[]> {
  const snap = await getDocs(collection(db, 'exams', examId, 'questions'));
  return snap.docs.map(d => {
    const q = d.data();
    return { id: d.id, text: q.text, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, diagram: q.diagram ?? null };
  });
}

/* ── Progress (per profile) ──────────────────────────────── */
export function subscribeProgress(
  accountId: string,
  profileId: string,
  cb: (data: ProgressDoc) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'accounts', accountId, 'progress', profileId), snap => {
    cb(snap.exists() ? (snap.data() as ProgressDoc) : {});
  });
}

const progressRef = (accountId: string, profileId: string) =>
  doc(db, 'accounts', accountId, 'progress', profileId);

/** One-shot read of the progress doc. */
export async function getProgress(accountId: string, profileId: string): Promise<ProgressDoc> {
  const snap = await getDoc(progressRef(accountId, profileId));
  return snap.exists() ? (snap.data() as ProgressDoc) : {};
}

const RECENT_MAX = 8;
const ACTIVE_DAYS_MAX = 21;

/**
 * Records learner activity in a single merge write: awards XP, advances the
 * daily streak, and (optionally) moves a subject/topic to the top of "recent".
 * Reads the current doc first so streak/recent math is correct.
 */
export async function recordActivity(
  accountId: string,
  profileId: string,
  opts: { xp?: number; recent?: RecentItem } = {}
): Promise<void> {
  const cur = await getProgress(accountId, profileId);
  const today = dayKey();
  const { streak, lastActiveDate } = bumpStreak(cur.lastActiveDate, cur.streak, today);

  const activeDays = Array.from(new Set([...(cur.activeDays ?? []), today])).slice(-ACTIVE_DAYS_MAX);

  let recent = cur.recent ?? [];
  if (opts.recent) {
    recent = [opts.recent, ...recent.filter(r => r.subjectId !== opts.recent!.subjectId)].slice(0, RECENT_MAX);
  }

  await setDoc(
    progressRef(accountId, profileId),
    {
      xp: (cur.xp ?? 0) + (opts.xp ?? 0),
      streak,
      lastActiveDate,
      activeDays,
      recent,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Persist a mock-exam attempt (best/last score, attempts) + recency. */
export async function recordExamResult(
  accountId: string,
  profileId: string,
  exam: { id: string; title?: string; subject?: string },
  result: { score: number; total: number; xp?: number }
): Promise<void> {
  const cur = await getProgress(accountId, profileId);
  const prev = cur.exams?.[exam.id];
  const attempt: ExamAttempt = {
    examId: exam.id,
    title: exam.title,
    subject: exam.subject,
    bestScore: Math.max(prev?.bestScore ?? 0, result.score),
    lastScore: result.score,
    total: result.total,
    attempts: (prev?.attempts ?? 0) + 1,
    at: Date.now(),
  };
  await setDoc(
    progressRef(accountId, profileId),
    { exams: { [exam.id]: attempt }, updatedAt: serverTimestamp() },
    { merge: true }
  );
  await recordActivity(accountId, profileId, { xp: result.xp ?? 0 });
}

/** Persist daily-challenge progress for the active profile. */
export async function saveChallengeState(
  accountId: string,
  profileId: string,
  state: ChallengeState
): Promise<void> {
  await setDoc(
    progressRef(accountId, profileId),
    { challenge: state, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Persist newly-unlocked achievements (id → unlockedAt). Merges, never clears. */
export async function unlockAchievements(
  accountId: string,
  profileId: string,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const now = Date.now();
  const patch: Record<string, number> = {};
  ids.forEach(id => { patch[id] = now; });
  await setDoc(
    progressRef(accountId, profileId),
    { achievements: patch, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function saveTopicProgress(
  accountId: string,
  profileId: string,
  topicId: string,
  result: { score: number; total: number; subjectId?: string; prevBest?: number; prevAttempts?: number }
): Promise<void> {
  const entry: TopicProgress = {
    completed: true,
    bestScore: Math.max(result.prevBest ?? 0, result.score),
    lastScore: result.score,
    total: result.total,
    attempts: (result.prevAttempts ?? 0) + 1,
    subjectId: result.subjectId,
  };
  await setDoc(
    doc(db, 'accounts', accountId, 'progress', profileId),
    { topics: { [topicId]: entry }, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/* ── Revision (whole-subject quiz from every topic) ──────── */
export interface RevisionQuestion extends QuizQuestion {
  topicId?: string;
  topicTitle?: string;
}

/** All published questions across every topic in a subject, tagged with their topic. */
export async function getSubjectQuestions(subjectId: string): Promise<RevisionQuestion[]> {
  const tsnap = await getDocs(query(collection(db, 'topics'), where('subjectId', '==', subjectId)));
  const topics = tsnap.docs
    .map(d => ({ id: d.id, ...(d.data() as Omit<Topic, 'id'>) }))
    .filter(t => t.status === 'published')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const all: RevisionQuestion[] = [];
  for (const t of topics) {
    const qs = await getTopicQuestions(t.id);
    qs.forEach(q => all.push({ ...q, topicId: t.id, topicTitle: t.title }));
  }
  return all;
}

export interface RevisionItem {
  q: string;
  options: string[];
  correctIndex: number;
  chosenIndex: number; // -1 if unanswered
  topicTitle?: string;
}

export interface RevisionAttempt {
  subjectId: string;
  subjectName?: string;
  score: number;
  total: number;
  at: number;
  items: RevisionItem[];
}

const revisionRef = (accountId: string, profileId: string, subjectId: string) =>
  doc(db, 'accounts', accountId, 'revisions', `${profileId}__${subjectId}`);

export async function saveRevisionAttempt(accountId: string, profileId: string, attempt: RevisionAttempt): Promise<void> {
  await setDoc(revisionRef(accountId, profileId, attempt.subjectId), { ...attempt, updatedAt: serverTimestamp() });
}

export async function getRevisionAttempt(accountId: string, profileId: string, subjectId: string): Promise<RevisionAttempt | null> {
  const snap = await getDoc(revisionRef(accountId, profileId, subjectId));
  return snap.exists() ? (snap.data() as RevisionAttempt) : null;
}

/** Live map of the profile's latest revision attempt per subject. */
export function subscribeRevisionAttempts(
  accountId: string,
  profileId: string,
  cb: (rows: Record<string, RevisionAttempt>) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'accounts', accountId, 'revisions'), snap => {
    const out: Record<string, RevisionAttempt> = {};
    snap.docs
      .filter(d => d.id.startsWith(`${profileId}__`))
      .forEach(d => { const a = d.data() as RevisionAttempt; out[a.subjectId] = a; });
    cb(out);
  });
}

/* ── Leaderboard ─────────────────────────────────────────── */
/** Public top scores, highest first (flagged entries hidden). */
export function subscribeTopScores(cb: (rows: ScoreEntry[]) => void, max = 50): Unsubscribe {
  return onSnapshot(collection(db, 'leaderboard'), snap => {
    const rows = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<ScoreEntry, 'id'>) }))
      .filter(r => !r.flagged)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, max);
    cb(rows);
  });
}

export async function submitScore(entry: {
  player: string;
  game: string;
  grade: string;
  score: number;
  points: number;
  profileId?: string;
}): Promise<void> {
  await addDoc(collection(db, 'leaderboard'), {
    ...entry,
    flagged: false,
    featured: false,
    createdAt: serverTimestamp(),
  });
}

export type { Subject, Topic } from './curriculum';
export type { ExamMeta } from './exams';
