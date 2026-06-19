// Mock exams: exams/{examId} with a questions subcollection.
// Question generation reuses the deployed generateContent Cloud Function.
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { GeneratedQuestion } from './content';

export interface ExamMeta {
  id: string;
  grade: string;
  subject: string;
  title: string;
  durationMin?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  questionCount?: number;
  status: 'draft' | 'published';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ExamQuestion extends GeneratedQuestion {
  id: string;
}

/** Live list of exams, newest first. */
export function subscribeExams(cb: (rows: ExamMeta[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'exams'), snap => {
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ExamMeta, 'id'>) }));
    rows.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
    cb(rows);
  });
}

export async function createExam(meta: Omit<ExamMeta, 'id' | 'createdAt' | 'updatedAt' | 'questionCount'>): Promise<string> {
  const ref = await addDoc(collection(db, 'exams'), {
    ...meta,
    questionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateExam(id: string, fields: Partial<Omit<ExamMeta, 'id'>>): Promise<void> {
  await updateDoc(doc(db, 'exams', id), { ...fields, updatedAt: serverTimestamp() });
}

/** One-shot fetch of an exam's questions (for the editor). */
export async function getExamQuestions(examId: string): Promise<ExamQuestion[]> {
  const snap = await getDocs(collection(db, 'exams', examId, 'questions'));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ExamQuestion, 'id'>) }));
}

/** Replace an exam's questions with the given set and update its count. */
export async function saveExamQuestions(examId: string, questions: GeneratedQuestion[]): Promise<void> {
  const existing = await getDocs(collection(db, 'exams', examId, 'questions'));
  const batch = writeBatch(db);
  existing.forEach(d => batch.delete(d.ref));
  questions.forEach(q => {
    const ref = doc(collection(db, 'exams', examId, 'questions'));
    batch.set(ref, {
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: q.difficulty,
      diagram: q.diagram ?? null,
    });
  });
  batch.update(doc(db, 'exams', examId), {
    questionCount: questions.length,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function deleteExam(examId: string): Promise<void> {
  const existing = await getDocs(collection(db, 'exams', examId, 'questions'));
  const batch = writeBatch(db);
  existing.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, 'exams', examId));
  await batch.commit();
}
