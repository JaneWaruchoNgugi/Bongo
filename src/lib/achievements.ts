// Achievement catalog + evaluation. Definitions live client-side; per-profile
// unlock state is stored in the progress doc (progress.achievements).
import type { ProgressDoc } from './learn';

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string;        // emoji badge
  color: string;       // accent for the badge
  goal: number;
  metric: keyof Stats; // which derived stat this measures
}

export interface Stats {
  topicsCompleted: number;
  perfectTopics: number;
  examsTaken: number;
  streak: number;
  xp: number;
  challengesDone: number;
}

export function deriveStats(p: ProgressDoc): Stats {
  const topics = Object.values(p.topics ?? {});
  const exams = Object.values(p.exams ?? {});
  return {
    topicsCompleted: topics.filter(t => t.completed).length,
    perfectTopics: topics.filter(t => t.total > 0 && t.bestScore >= t.total).length,
    examsTaken: exams.length,
    streak: p.streak ?? 0,
    xp: p.xp ?? 0,
    challengesDone: p.challenge?.claimed ? 1 : 0,
  };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-steps',   title: 'First Steps',     desc: 'Complete your first topic',        icon: '🌱', color: '#157347', goal: 1,    metric: 'topicsCompleted' },
  { id: 'getting-going', title: 'Getting Going',   desc: 'Complete 5 topics',                icon: '📚', color: '#2563eb', goal: 5,    metric: 'topicsCompleted' },
  { id: 'dedicated',     title: 'Dedicated',       desc: 'Complete 15 topics',               icon: '🎯', color: '#ea580c', goal: 15,   metric: 'topicsCompleted' },
  { id: 'scholar',       title: 'Scholar',         desc: 'Complete 30 topics',               icon: '🎓', color: '#7c3aed', goal: 30,   metric: 'topicsCompleted' },
  { id: 'perfectionist', title: 'Perfectionist',   desc: 'Get full marks on a topic',        icon: '⭐', color: '#d4a017', goal: 1,    metric: 'perfectTopics' },
  { id: 'sharp-shooter', title: 'Sharp Shooter',   desc: 'Full marks on 5 topics',           icon: '🏹', color: '#0d9488', goal: 5,    metric: 'perfectTopics' },
  { id: 'exam-ready',    title: 'Exam Ready',      desc: 'Finish your first mock exam',      icon: '📝', color: '#dc2626', goal: 1,    metric: 'examsTaken' },
  { id: 'exam-veteran',  title: 'Exam Veteran',    desc: 'Finish 5 mock exams',              icon: '🏆', color: '#a87d0e', goal: 5,    metric: 'examsTaken' },
  { id: 'on-fire',       title: 'On Fire',         desc: 'Reach a 3-day streak',             icon: '🔥', color: '#ea580c', goal: 3,    metric: 'streak' },
  { id: 'unstoppable',   title: 'Unstoppable',     desc: 'Reach a 7-day streak',             icon: '⚡', color: '#d4a017', goal: 7,    metric: 'streak' },
  { id: 'rising-star',   title: 'Rising Star',     desc: 'Earn 250 XP',                      icon: '✨', color: '#2563eb', goal: 250,  metric: 'xp' },
  { id: 'xp-master',     title: 'XP Master',       desc: 'Earn 1000 XP',                     icon: '👑', color: '#7c3aed', goal: 1000, metric: 'xp' },
  { id: 'challenger',    title: 'Challenger',      desc: 'Complete a daily challenge',       icon: '🎖️', color: '#157347', goal: 1,    metric: 'challengesDone' },
];

export interface AchievementView extends AchievementDef {
  current: number;
  unlocked: boolean;
  unlockedAt?: number;
  pct: number;
}

export function evaluateAchievements(p: ProgressDoc): AchievementView[] {
  const stats = deriveStats(p);
  const unlockedMap = p.achievements ?? {};
  return ACHIEVEMENTS.map(a => {
    const current = stats[a.metric];
    const unlocked = current >= a.goal || a.id in unlockedMap;
    return {
      ...a,
      current,
      unlocked,
      unlockedAt: unlockedMap[a.id],
      pct: Math.min(100, Math.round((current / a.goal) * 100)),
    };
  });
}

/** Ids that newly satisfy their goal but aren't recorded yet — call after activity. */
export function pendingUnlocks(p: ProgressDoc): string[] {
  const stats = deriveStats(p);
  const have = p.achievements ?? {};
  return ACHIEVEMENTS.filter(a => stats[a.metric] >= a.goal && !(a.id in have)).map(a => a.id);
}
