// Pure helpers for XP, levels and streaks. No Firebase here — easy to reason about/test.

/* ── XP & levels ─────────────────────────────────────────────
   Each level needs a bit more XP than the last:
     need(L) = 300 + (L-1) * 100   (L1:300, L2:400, L3:500 …)
   `xp` is the lifetime total. */
const BASE = 300;
const STEP = 100;

export const xpNeededForLevel = (level: number): number => BASE + (level - 1) * STEP;

export interface LevelInfo {
  level: number;     // current level (1-based)
  inLevel: number;   // XP earned within the current level
  need: number;      // XP required to finish the current level
  pct: number;       // 0–100 progress through the current level
  totalXp: number;   // lifetime XP
}

export function levelInfo(xp: number): LevelInfo {
  const total = Math.max(0, Math.floor(xp || 0));
  let level = 1;
  let rem = total;
  while (rem >= xpNeededForLevel(level)) {
    rem -= xpNeededForLevel(level);
    level += 1;
  }
  const need = xpNeededForLevel(level);
  return { level, inLevel: rem, need, pct: Math.round((rem / need) * 100), totalXp: total };
}

/* XP awards for various actions. */
export const XP = {
  openLesson: 5,
  completeTopic: 25,
  perfectTopic: 15,   // bonus for full marks
  completeExam: 40,
  challenge: 50,
} as const;

/* ── Dates & streaks ─────────────────────────────────────────
   Keys are local 'YYYY-MM-DD' so a learner's "day" matches their timezone. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return dayKey(dt);
}

/** Given the last active day + current streak, compute the streak after activity today. */
export function bumpStreak(
  lastActiveDate: string | undefined,
  streak: number | undefined,
  today: string = dayKey()
): { streak: number; lastActiveDate: string; isNewDay: boolean } {
  const prev = streak ?? 0;
  if (lastActiveDate === today) return { streak: Math.max(prev, 1), lastActiveDate: today, isNewDay: false };
  if (lastActiveDate && addDays(lastActiveDate, 1) === today) {
    return { streak: prev + 1, lastActiveDate: today, isNewDay: true }; // consecutive day
  }
  return { streak: 1, lastActiveDate: today, isNewDay: true }; // first day or streak broken
}

/* ── Current-week view (Mon→Sun) for the Daily Streak widget ── */
export interface WeekDay { label: string; key: string; active: boolean; isToday: boolean }

export function weekDays(activeDays: string[] = [], today: string = dayKey()): WeekDay[] {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [y, m, d] = today.split('-').map(Number);
  const todayDate = new Date(y, m - 1, d);
  const dow = (todayDate.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(y, m - 1, d - dow);
  const set = new Set(activeDays);
  return labels.map((label, i) => {
    const key = dayKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
    return { label, key, active: set.has(key), isToday: key === today };
  });
}
