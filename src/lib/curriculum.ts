// Curriculum engine: Grade → Subject → Topic (lesson + summary) → topic test.
// AI generation runs in Cloud Functions; this layer stores/reads the result.
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebase';
import type { GeneratedQuestion } from './content';

export interface Subject {
  id: string;
  grade: string;
  name: string;
  order?: number;
  topicCount?: number;
  createdAt?: Timestamp | null;
}

export interface Topic {
  id: string;
  subjectId: string;
  grade: string;
  subject: string;
  title: string;
  objective?: string;
  order: number;
  description?: string;
  summary?: string;
  status: 'draft' | 'published';
  questionCount?: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface SyllabusTopic {
  title: string;
  objective: string;
}

/** Deterministic subject id so the same grade+subject never duplicates. */
export function subjectIdFor(grade: string, name: string): string {
  return `${grade}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/* ── AI generation (Cloud Functions) ─────────────────────── */
export async function generateSyllabus(params: {
  grade: string;
  subject: string;
  count?: number;
}): Promise<{ topics: SyllabusTopic[] }> {
  const fn = httpsCallable<typeof params, { topics: SyllabusTopic[] }>(functions, 'generateSyllabus');
  return (await fn(params)).data;
}

export async function generateTopicLesson(params: {
  grade: string;
  subject: string;
  topic: string;
  count?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}): Promise<{ description: string; summary: string; questions: GeneratedQuestion[] }> {
  const fn = httpsCallable<typeof params, { description: string; summary: string; questions: GeneratedQuestion[] }>(
    functions,
    'generateTopicLesson'
  );
  return (await fn(params)).data;
}

/* ── Reads ───────────────────────────────────────────────── */
export function subscribeSubjects(cb: (rows: Subject[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'subjects'), snap => {
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Subject, 'id'>) }));
    rows.sort((a, b) => a.grade.localeCompare(b.grade) || a.name.localeCompare(b.name));
    cb(rows);
  });
}

export function subscribeTopics(subjectId: string, cb: (rows: Topic[]) => void): Unsubscribe {
  const q = query(collection(db, 'topics'), where('subjectId', '==', subjectId));
  return onSnapshot(q, snap => {
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Topic, 'id'>) }));
    rows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    cb(rows);
  });
}

/* ── Writes ──────────────────────────────────────────────── */
/** Create the subject (if new) and append the proposed topics as drafts. */
export async function saveSyllabus(
  grade: string,
  subject: string,
  topics: SyllabusTopic[]
): Promise<string> {
  const subjectId = subjectIdFor(grade, subject);
  await setDoc(
    doc(db, 'subjects', subjectId),
    { grade, name: subject, createdAt: serverTimestamp() },
    { merge: true }
  );

  // Continue numbering after any existing topics.
  const existing = await getDocs(query(collection(db, 'topics'), where('subjectId', '==', subjectId)));
  let order = existing.size;

  const batch = writeBatch(db);
  topics.forEach(t => {
    const ref = doc(collection(db, 'topics'));
    batch.set(ref, {
      subjectId,
      grade,
      subject,
      title: t.title,
      objective: t.objective ?? '',
      order: order++,
      status: 'draft',
      questionCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  batch.set(doc(db, 'subjects', subjectId), { topicCount: order }, { merge: true });
  await batch.commit();
  return subjectId;
}

/** Save a topic's lesson + summary and (re)write its test questions. */
export async function saveTopicContent(
  topic: Topic,
  lesson: { description: string; summary: string },
  questions: GeneratedQuestion[]
): Promise<void> {
  // Remove any previous questions for this topic so regenerating doesn't duplicate.
  const prev = await getDocs(query(collection(db, 'questions'), where('topicId', '==', topic.id)));
  const batch = writeBatch(db);
  prev.forEach(d => batch.delete(d.ref));

  questions.forEach(q => {
    const ref = doc(collection(db, 'questions'));
    batch.set(ref, {
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: q.difficulty,
      diagram: q.diagram ?? null,
      grade: topic.grade,
      subject: topic.subject,
      topic: topic.title,
      topicId: topic.id,
      subjectId: topic.subjectId,
      status: 'published',
      source: 'ai',
      createdBy: auth.currentUser?.uid ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  batch.update(doc(db, 'topics', topic.id), {
    description: lesson.description,
    summary: lesson.summary,
    status: 'published',
    questionCount: questions.length,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function updateTopic(id: string, fields: Partial<Omit<Topic, 'id'>>): Promise<void> {
  await updateDoc(doc(db, 'topics', id), { ...fields, updatedAt: serverTimestamp() });
}

/** Delete a topic and its questions. */
export async function deleteTopic(topic: Topic): Promise<void> {
  const qs = await getDocs(query(collection(db, 'questions'), where('topicId', '==', topic.id)));
  const batch = writeBatch(db);
  qs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, 'topics', topic.id));
  await batch.commit();
}
