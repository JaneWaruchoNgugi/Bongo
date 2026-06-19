import type { Timestamp } from 'firebase/firestore';

/* ── Staff (admin panel users) ───────────────────────────── */
export type StaffRole = 'admin' | 'support';

export interface StaffMember {
  uid: string;
  email: string;
  name: string;
  role: StaffRole;
  disabled?: boolean;
  createdAt?: Timestamp | null;
}

/* ── Support chat ────────────────────────────────────────── */
export type ConversationStatus = 'open' | 'closed';
export type SenderType = 'user' | 'support';

export interface Conversation {
  id: string;
  userUid: string;            // anonymous-auth uid of the student's device
  accountPhone: string;       // account phone if the student is logged in ('' otherwise)
  profileName: string;        // active student profile name (or 'Guest')
  status: ConversationStatus;
  assignedTo: string | null;  // staff uid handling this chat
  lastMessage: string;
  lastSenderType: SenderType;
  unreadForSupport: number;
  unreadForUser: number;
  lastMessageAt: Timestamp | null;
  createdAt: Timestamp | null;
}

export interface Message {
  id: string;
  senderType: SenderType;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Timestamp | null;
}
