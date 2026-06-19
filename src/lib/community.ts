// Community feed — a shared, public collection of short learner posts.
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export interface CommunityPost {
  id: string;
  authorName: string;
  grade?: string;
  avatar?: string;
  text: string;
  profileId?: string;
  createdAt?: Timestamp | null;
}

/** Live feed, newest first. */
export function subscribeCommunity(cb: (rows: CommunityPost[]) => void, max = 50): Unsubscribe {
  return onSnapshot(collection(db, 'community'), snap => {
    const rows = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<CommunityPost, 'id'>) }))
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      .slice(0, max);
    cb(rows);
  });
}

export async function createPost(post: {
  authorName: string;
  grade?: string;
  avatar?: string;
  text: string;
  profileId?: string;
}): Promise<void> {
  const text = post.text.trim().slice(0, 500);
  if (!text) return;
  await addDoc(collection(db, 'community'), {
    authorName: post.authorName,
    grade: post.grade ?? '',
    avatar: post.avatar ?? '',
    text,
    profileId: post.profileId ?? '',
    createdAt: serverTimestamp(),
  });
}
