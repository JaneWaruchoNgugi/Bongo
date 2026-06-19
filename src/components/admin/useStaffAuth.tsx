// Auth context for the admin panel. Staff (Admin / Support) sign in with
// Firebase Auth email+password. Their role comes from the staff/{uid} doc
// (and is mirrored into custom claims by the setStaffClaims Cloud Function,
// which is what the Firestore security rules actually enforce).
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import type { StaffMember, StaffRole } from '../../lib/types';

interface StaffAuthState {
  loading: boolean;
  user: User | null;
  staff: StaffMember | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutStaff: () => Promise<void>;
}

const StaffAuthContext = createContext<StaffAuthState | null>(null);

export const StaffAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async current => {
      setUser(current);
      // Anonymous users (frontend chat visitors) are never staff.
      if (!current || current.isAnonymous) {
        setStaff(null);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'staff', current.uid));
        if (snap.exists() && !snap.data().disabled) {
          const data = snap.data();
          setStaff({
            uid: current.uid,
            email: data.email ?? current.email ?? '',
            name: data.name ?? 'Staff',
            role: (data.role as StaffRole) ?? 'support',
          });
        } else {
          setStaff(null);
        }
      } catch {
        setStaff(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      setError(
        code.includes('invalid') || code.includes('wrong') || code.includes('not-found')
          ? 'Invalid email or password.'
          : 'Sign in failed. Please try again.'
      );
      throw e;
    }
  };

  const signOutStaff = async () => {
    await signOut(auth);
    setStaff(null);
  };

  return (
    <StaffAuthContext.Provider value={{ loading, user, staff, error, signIn, signOutStaff }}>
      {children}
    </StaffAuthContext.Provider>
  );
};

export function useStaffAuth(): StaffAuthState {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error('useStaffAuth must be used within StaffAuthProvider');
  return ctx;
}
