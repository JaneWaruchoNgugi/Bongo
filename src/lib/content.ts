// Admin content helpers: call the Claude generation function and save/manage
// approved questions in Firestore.
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebase';

/** Optional SVG figure attached to a question (geometry, graphs, number lines…). */
export interface QuestionDiagram {
  kind: 'svg';
  svg: string;
  alt: string;
}

export interface GeneratedQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  diagram?: QuestionDiagram | null;
}

/** A question as stored in Firestore (generated once, then edited in place). */
export interface SavedQuestion extends GeneratedQuestion {
  id: string;
  grade: string;
  subject: string;
  topic: string;
  status: 'published' | 'draft';
  source?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface GenerateParams {
  grade: string;
  subject: string;
  topic?: string;
  count?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  model?: string;
}

/** CBC-alignment feedback returned alongside the generated questions. */
export interface CbcReview {
  aligned: boolean;
  score: number;
  summary: string;
  questions: { index: number; aligned: boolean; strand: string; feedback: string }[];
}

export interface GenerateResult {
  questions: GeneratedQuestion[];
  cbcReview: CbcReview | null;
  meta: GenerateParams;
}

/** Ask the generateContent Cloud Function for grade-appropriate questions. */
export async function generateQuestions(params: GenerateParams): Promise<GenerateResult> {
  const fn = httpsCallable<GenerateParams, GenerateResult>(functions, 'generateContent');
  const res = await fn(params);
  return res.data;
}

export interface ScanParams {
  fileBase64: string;
  mimeType: string;
  grade?: string;
  subject?: string;
}

/** Read a File as a bare base64 string (no data: prefix). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

/** Scan an uploaded image/PDF and extract the multiple-choice questions in it. */
export async function extractQuestionsFromFile(
  file: File,
  ctx: { grade?: string; subject?: string } = {}
): Promise<{ questions: GeneratedQuestion[] }> {
  const fileBase64 = await fileToBase64(file);
  const fn = httpsCallable<ScanParams, { questions: GeneratedQuestion[] }>(functions, 'extractQuestions');
  const res = await fn({ fileBase64, mimeType: file.type, grade: ctx.grade, subject: ctx.subject });
  return res.data;
}

/** Persist approved questions to the `questions` collection. */
export async function saveQuestions(
  meta: GenerateParams,
  questions: GeneratedQuestion[]
): Promise<number> {
  const batch = writeBatch(db);
  questions.forEach(q => {
    const ref = doc(collection(db, 'questions'));
    batch.set(ref, {
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: q.difficulty,
      diagram: q.diagram ?? null,
      grade: meta.grade,
      subject: meta.subject,
      topic: meta.topic ?? '',
      status: 'published',
      source: 'ai',
      createdBy: auth.currentUser?.uid ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  return questions.length;
}

/** Live list of all saved questions, newest first. */
export function subscribeQuestions(cb: (rows: SavedQuestion[]) => void): Unsubscribe {
  const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<SavedQuestion, 'id'>) })));
  });
}

/** Update an existing saved question (edit instead of regenerate). */
export async function updateQuestion(
  id: string,
  fields: Partial<Omit<SavedQuestion, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, 'questions', id), { ...fields, updatedAt: serverTimestamp() });
}

export async function deleteQuestion(id: string): Promise<void> {
  await deleteDoc(doc(db, 'questions', id));
}
