// Deterministic daily challenge: everyone on a given date gets the same goal.
// Progress is tracked per-profile in progress.challenge.
import { dayKey } from './gamification';
import { getProgress, saveChallengeState, type ChallengeState } from './learn';

export interface DailyChallenge {
  id: string;        // = date key
  date: string;
  title: string;
  desc: string;
  goal: number;      // questions to answer correctly
  rewardXp: number;
}

const GOALS = [10, 12, 15, 20];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function todaysChallenge(date: string = dayKey()): DailyChallenge {
  const goal = GOALS[hash(date) % GOALS.length];
  return {
    id: date,
    date,
    title: "Today's Challenge",
    desc: `Answer ${goal} questions correctly in any subject.`,
    goal,
    rewardXp: 50,
  };
}

export function freshState(date: string = dayKey()): ChallengeState {
  return { date, progress: 0, completed: false, claimed: false };
}

/** Returns today's challenge state, resetting if the stored one is from another day. */
export function currentState(stored: ChallengeState | undefined, date: string = dayKey()): ChallengeState {
  if (!stored || stored.date !== date) return freshState(date);
  return stored;
}

/** Add correctly-answered questions toward today's challenge. */
export function addCorrect(
  state: ChallengeState,
  challenge: DailyChallenge,
  correct: number
): ChallengeState {
  const progress = Math.min(challenge.goal, state.progress + Math.max(0, correct));
  return { ...state, progress, completed: progress >= challenge.goal };
}

/** Reads progress, adds correct answers to today's challenge, and persists. */
export async function bumpChallenge(accountId: string, profileId: string, correct: number): Promise<void> {
  if (correct <= 0) return;
  const p = await getProgress(accountId, profileId);
  const ch = todaysChallenge();
  const state = addCorrect(currentState(p.challenge), ch, correct);
  await saveChallengeState(accountId, profileId, state);
}
