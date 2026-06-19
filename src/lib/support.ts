// Support-chat data layer shared by the frontend widget and the admin panel.
// Conversation metadata (lastMessage, unread counts, status) is maintained
// server-side by the onMessageCreated Cloud Function — clients only create
// the conversation doc and append messages.
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, db } from './firebase';
import type { Conversation, Message, StaffMember } from './types';

const CONVERSATIONS = 'conversations';

/* ── Auth helpers ────────────────────────────────────────── */

// Resolves once Firebase has restored any persisted session (the first
// onAuthStateChanged tick). Without this gate, callers run before a
// signed-in student is restored and get the wrong uid.
let authReady: Promise<void> | null = null;
function waitForAuthReady(): Promise<void> {
  if (!authReady) {
    authReady = new Promise(resolve => {
      const unsub = onAuthStateChanged(auth, () => {
        unsub();
        resolve();
      });
    });
  }
  return authReady;
}

/** The current chat uid: the signed-in student if present, else an anonymous one. */
export async function ensureAnonAuth(): Promise<string> {
  await waitForAuthReady();
  if (auth.currentUser) return auth.currentUser.uid;
  const cred = await signInAnonymously(auth);
  return cred.user.uid;
}

/* ── Frontend (student) side ─────────────────────────────── */

/** Find this device's existing conversation, or create a fresh one. */
export async function getOrCreateConversation(meta: {
  accountPhone: string;
  profileName: string;
}): Promise<string> {
  const uid = await ensureAnonAuth();

  const existing = await getDocs(
    query(collection(db, CONVERSATIONS), where('userUid', '==', uid), limit(1))
  );
  if (!existing.empty) return existing.docs[0].id;

  const ref = await addDoc(collection(db, CONVERSATIONS), {
    userUid: uid,
    accountPhone: meta.accountPhone,
    profileName: meta.profileName || 'Guest',
    status: 'open',
    assignedTo: null,
    lastMessage: '',
    lastSenderType: 'user',
    unreadForSupport: 0,
    unreadForUser: 0,
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Live subscription to this visitor's own conversation (for unread badge + thread). */
export async function subscribeMyConversation(
  cb: (conversation: Conversation | null) => void
): Promise<Unsubscribe> {
  const uid = await ensureAnonAuth();
  const q = query(collection(db, CONVERSATIONS), where('userUid', '==', uid), limit(1));
  return onSnapshot(
    q,
    snap => {
      if (snap.empty) cb(null);
      else cb({ id: snap.docs[0].id, ...(snap.docs[0].data() as Omit<Conversation, 'id'>) });
    },
    err => console.error('[support-chat] conversation subscription failed:', err.code, err)
  );
}

/** Append a message from the student. */
export async function sendUserMessage(
  conversationId: string,
  text: string,
  senderName: string
): Promise<void> {
  const uid = await ensureAnonAuth();
  await addDoc(collection(db, CONVERSATIONS, conversationId, 'messages'), {
    senderType: 'user',
    senderId: uid,
    senderName: senderName || 'Guest',
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
}

/** The student has the chat panel open — clear their unread badge. */
export async function markReadForUser(conversationId: string): Promise<void> {
  await updateDoc(doc(db, CONVERSATIONS, conversationId), { unreadForUser: 0 });
}

/* ── Admin / Support side ────────────────────────────────── */

/** Live list of all conversations, most-recently-active first. */
export function subscribeConversations(cb: (rows: Conversation[]) => void): Unsubscribe {
  const q = query(collection(db, CONVERSATIONS), orderBy('lastMessageAt', 'desc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Conversation, 'id'>) })));
  });
}

/** Live message stream for one conversation (oldest first). */
export function subscribeMessages(
  conversationId: string,
  cb: (rows: Message[]) => void
): Unsubscribe {
  const q = query(
    collection(db, CONVERSATIONS, conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(
    q,
    snap => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Message, 'id'>) }))),
    err => console.error('[support-chat] message subscription failed:', err.code, err)
  );
}

/** Append a reply from a staff member and assign the chat to them. */
export async function sendSupportMessage(
  conversationId: string,
  text: string,
  staff: Pick<StaffMember, 'uid' | 'name'>
): Promise<void> {
  await addDoc(collection(db, CONVERSATIONS, conversationId, 'messages'), {
    senderType: 'support',
    senderId: staff.uid,
    senderName: staff.name || 'Support',
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, CONVERSATIONS, conversationId), {
    assignedTo: staff.uid,
    unreadForSupport: 0,
  });
}

/** Support opened a conversation — clear the support unread badge. */
export async function markReadForSupport(conversationId: string): Promise<void> {
  await updateDoc(doc(db, CONVERSATIONS, conversationId), { unreadForSupport: 0 });
}

export async function setConversationStatus(
  conversationId: string,
  status: Conversation['status']
): Promise<void> {
  await updateDoc(doc(db, CONVERSATIONS, conversationId), { status });
}

/** Used by the bootstrap script / function when seeding a staff doc by uid. */
export async function upsertStaffDoc(member: StaffMember): Promise<void> {
  await setDoc(
    doc(db, 'staff', member.uid),
    {
      email: member.email,
      name: member.name,
      role: member.role,
      disabled: member.disabled ?? false,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}
