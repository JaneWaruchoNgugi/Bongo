// Live admin data from Firestore (replaces the old hard-coded mock arrays).
import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  onSnapshot,
  query,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

/* ── Student accounts ────────────────────────────────────── */
export interface AdminProfile {
  id?: string;
  username?: string;
  grade?: number;
  educationLevel?: string;
  xp?: number;
  points?: number;
  streak?: number;
}
export interface AdminAccount {
  id: string;
  phone?: string;
  package?: string;
  profiles?: AdminProfile[];
  activeProfileId?: string | null;
  status?: string;
  createdAt?: Timestamp | null;
}

/** Live list of student accounts (newest first). */
export function subscribeAccounts(cb: (rows: AdminAccount[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'accounts'), snap => {
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AdminAccount, 'id'>) }));
    rows.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
    cb(rows);
  });
}

/* ── Leaderboard ─────────────────────────────────────────── */
export interface LeaderboardEntry {
  id: string;
  player?: string;
  game?: string;
  grade?: string;
  score?: number;
  points?: number;
  flagged?: boolean;
  featured?: boolean;
  createdAt?: Timestamp | null;
}

/** Live leaderboard, highest score first. */
export function subscribeLeaderboard(cb: (rows: LeaderboardEntry[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'leaderboard'), snap => {
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<LeaderboardEntry, 'id'>) }));
    rows.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    cb(rows);
  });
}

export async function setLeaderboardFlags(
  id: string,
  fields: Partial<Pick<LeaderboardEntry, 'flagged' | 'featured'>>
): Promise<void> {
  await updateDoc(doc(db, 'leaderboard', id), fields);
}

export async function deleteLeaderboardEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, 'leaderboard', id));
}

/* ── Dashboard counts ────────────────────────────────────── */
export interface DashboardCounts {
  questions: number;
  openChats: number;
  staff: number;
}

/** One-shot counts that don't need a live list (efficient — counts only). */
export async function getDashboardCounts(): Promise<DashboardCounts> {
  const [questions, openChats, staff] = await Promise.all([
    getCountFromServer(collection(db, 'questions')),
    getCountFromServer(query(collection(db, 'conversations'), where('status', '==', 'open'))),
    getCountFromServer(collection(db, 'staff')),
  ]);
  return {
    questions: questions.data().count,
    openChats: openChats.data().count,
    staff: staff.data().count,
  };
}
