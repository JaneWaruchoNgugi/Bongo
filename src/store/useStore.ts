import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { onAuthStateChanged, type Unsubscribe } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  loginAccount,
  logoutAccount,
  patchAccount,
  signupAccount,
  subscribeAccount,
  type AccountDoc,
} from '../lib/studentAuth';

/* ── Theme store ─────────────────────────────────────────── */
interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        set({ theme: next });
      },
    }),
    { name: 'gradeup-theme' }
  )
);

export type EducationLevel = 'lower_primary' | 'middle_school' | 'senior_school';
export type FamilyPackage = 'solo' | 'trio' | 'quad' | 'family';

export interface LevelSelections {
  lower_primary?: { grade: number };
  middle_school?: { level: string | null; className: string | null };
  senior_school?: { grade: string };
}

export interface StudentProfile {
  id: string;
  username: string;
  educationLevel: EducationLevel;
  grade: number;
  pin: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  points: number;
}

export interface StudentUser {
  type: 'student';
  phone: string;
  pin: string; // not used client-side (auth is server-side); kept for type compatibility
  package: FamilyPackage;
  profiles: StudentProfile[];
  activeProfileId: string | null;
}

export type AppUser = StudentUser;
export type Overlay = null | 'signup' | 'login' | 'profile-select';

interface AppState {
  overlay: Overlay;
  signupPackage: FamilyPackage | null;
  user: AppUser | null;
  isLoggedIn: boolean;
  authReady: boolean; // false until the first Firebase auth callback resolves
  accountId: string | null;
  levelSelections: LevelSelections;
  /** Learner sidebar drawer (mobile) — toggled from the top navbar. */
  learnerMenuOpen: boolean;

  setOverlay: (overlay: Overlay, pkg?: FamilyPackage | null) => void;
  setLearnerMenu: (open: boolean) => void;
  setLevelSelection: (level: keyof LevelSelections, value: LevelSelections[keyof LevelSelections]) => void;

  /** Wire up the Firebase auth listener (call once at app start). */
  bootstrap: () => void;
  signup: (phone: string, pin: string, pkg: FamilyPackage) => Promise<void>;
  signin: (phone: string, pin: string) => Promise<{ package: FamilyPackage; profiles: StudentProfile[] }>;
  logout: () => Promise<void>;
  setActiveProfile: (profileId: string) => void;
  updateUser: (updates: Partial<AppUser>) => void;
}

const accountToUser = (data: AccountDoc): AppUser => ({
  type: 'student',
  phone: data.phone,
  pin: '',
  package: data.package,
  profiles: data.profiles ?? [],
  activeProfileId: data.activeProfileId ?? null,
});

// Module-level subscriptions so bootstrap is idempotent.
let authUnsub: Unsubscribe | null = null;
let acctUnsub: Unsubscribe | null = null;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      overlay: null,
      signupPackage: null,
      user: null,
      isLoggedIn: false,
      authReady: false,
      accountId: null,
      levelSelections: {},
      learnerMenuOpen: false,

      setOverlay: (overlay, pkg = null) => set({ overlay, signupPackage: pkg }),
      setLearnerMenu: open => set({ learnerMenuOpen: open }),

      setLevelSelection: (level, value) =>
        set(state => ({ levelSelections: { ...state.levelSelections, [level]: value } })),

      bootstrap: () => {
        if (authUnsub) return; // already wired
        authUnsub = onAuthStateChanged(auth, current => {
          acctUnsub?.();
          acctUnsub = null;

          // Anonymous (chat) sessions and signed-out users are not students.
          if (!current || current.isAnonymous) {
            set({ user: null, isLoggedIn: false, accountId: null, authReady: true });
            return;
          }

          set({ accountId: current.uid });
          acctUnsub = subscribeAccount(current.uid, data => {
            if (data) set({ user: accountToUser(data), isLoggedIn: true, authReady: true });
            else set({ user: null, isLoggedIn: false, authReady: true }); // e.g. an admin session
          });
        });
      },

      signup: async (phone, pin, pkg) => {
        await signupAccount(phone, pin, pkg);
        // auth listener + account subscription populate `user`
      },

      signin: async (phone, pin) => {
        const { package: pkg, profiles } = await loginAccount(phone, pin);
        return { package: pkg, profiles };
      },

      logout: async () => {
        await logoutAccount();
        set({ user: null, isLoggedIn: false, accountId: null, overlay: null });
      },

      setActiveProfile: profileId => {
        const { user, accountId } = get();
        if (!user) return;
        set({ user: { ...user, activeProfileId: profileId } });
        if (accountId) patchAccount(accountId, { activeProfileId: profileId }).catch(() => {});
      },

      updateUser: updates => {
        const { user, accountId } = get();
        if (!user) return;
        const merged = { ...user, ...updates } as AppUser;
        set({ user: merged });
        if (accountId) {
          patchAccount(accountId, {
            profiles: merged.profiles,
            activeProfileId: merged.activeProfileId,
            package: merged.package,
          }).catch(() => {});
        }
      },
    }),
    {
      name: 'gradeup-v4',
      // Firebase is the source of truth for auth; only persist UI selections.
      partialize: state => ({ levelSelections: state.levelSelections }),
    }
  )
);
