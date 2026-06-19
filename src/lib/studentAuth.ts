// Student auth: phone + PIN via Firebase custom tokens (verified server-side).
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebase';
import type { FamilyPackage, StudentProfile } from '../store/useStore';

export interface AccountDoc {
  phone: string;
  package: FamilyPackage;
  profiles: StudentProfile[];
  activeProfileId: string | null;
}

/** Create an account (server hashes the PIN) and sign in. */
export async function signupAccount(phone: string, pin: string, pkg: FamilyPackage): Promise<string> {
  const fn = httpsCallable<{ phone: string; pin: string; package: FamilyPackage }, { token: string; accountId: string }>(
    functions,
    'studentSignup'
  );
  const { token, accountId } = (await fn({ phone, pin, package: pkg })).data;
  await signInWithCustomToken(auth, token);
  return accountId;
}

/** Verify phone + PIN server-side and sign in. Returns routing info. */
export async function loginAccount(
  phone: string,
  pin: string
): Promise<{ accountId: string; package: FamilyPackage; profiles: StudentProfile[] }> {
  const fn = httpsCallable<{ phone: string; pin: string }, { token: string; accountId: string; package: FamilyPackage; profiles: StudentProfile[] }>(
    functions,
    'studentLogin'
  );
  const res = (await fn({ phone, pin })).data;
  await signInWithCustomToken(auth, res.token);
  return { accountId: res.accountId, package: res.package, profiles: res.profiles ?? [] };
}

export async function logoutAccount(): Promise<void> {
  await signOut(auth);
}

/** Live subscription to the signed-in account's document. */
export function subscribeAccount(accountId: string, cb: (data: AccountDoc | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'accounts', accountId), snap => {
    cb(snap.exists() ? (snap.data() as AccountDoc) : null);
  });
}

/** Persist profile / active-profile / package changes for the owner. */
export async function patchAccount(
  accountId: string,
  fields: Partial<Pick<AccountDoc, 'profiles' | 'activeProfileId' | 'package'>>
): Promise<void> {
  await updateDoc(doc(db, 'accounts', accountId), { ...fields, updatedAt: serverTimestamp() });
}
