import { create } from 'zustand';
import Mahjong from '../assets/Games/mahjong.png';
import GradeUp from '../assets/Games/bongoquiz.png';
import Sudoku from '../assets/Games/sodoku.png';
import MathQuiz from '../assets/Games/mathquiz.png';
import BibleQuiz from '../../../Documents/bongoquiz/src/assets/gamesposter/Bible-IMG.png';
import Checkers from '../assets/Games/checkers.png';
import TicTacToe from '../assets/Games/tictactoe.png';
import WordQuest from '../assets/Games/wordquest.png';
import KiswahiliQuiz from '../assets/Games/kiswahili.png';
import ConnectFour from '../assets/Games/connectfour.png';

export type GameTag = 'new' | 'popular' | 'hot' | 'coming_soon' | 'math' | 'english' | 'science' | 'puzzle' | 'kiswahili' | 'quiz';
export type FilterTag = 'all' |'arcade'|'puzzle'| 'quiz'|'timed' |'latest'| 'new' | 'popular' | 'hot' | 'coming_soon';

export interface Game {
  id: string;           // unique game ID e.g. "bq-math-001"
  name: string;
  // description: string;
  tags: GameTag[];
  image: string;        // image path / emoji placeholder
  emoji: string;        // fallback display emoji
  bgColor: string;      // card background gradient
  component?: string;   // route path when implemented e.g. "/games/math-blitz"
  minLevel?: number;
  xpReward: number;
  coinReward: number;
  players: number;      // how many students played
  rating: number;       // out of 5
  duration: string;     // e.g. "5–10 min"
  subject: string;
}

type GameState = {
  activeFilter: FilterTag;
  games: Game[];
  setFilter: (f: FilterTag) => void;
  filteredGames: () => Game[];
  getGameById: (id: string) => Game | undefined;
};

const ALL_GAMES: Game[] = [
  {
    id: 'mahjong',
    name: 'Mahjong',
    // description: 'Race against the clock solving arithmetic challenges!',
    tags: ['hot', 'popular', 'math'],
    image: Mahjong,
    emoji: '🧮',
    bgColor: 'linear-gradient(135deg, #157347 0%, #11825a 100%)',
    component: '/games/mahjong',
    xpReward: 120,
    coinReward: 50,
    players: 24300,
    rating: 4.8,
    duration: '3–5 min',
    subject: 'Mathematics',
  },
  {
    id: 'bongo-quiz',
    name: 'Bongo Quiz',
    // description: 'Build vocabulary and master spelling with fun word puzzles.',
    tags: ['popular', 'english', 'puzzle'],
    image: GradeUp,
    emoji: '📝',
    bgColor: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
    component: '/games/bongo-quiz',
    xpReward: 100,
    coinReward: 40,
    players: 19800,
    rating: 4.7,
    duration: '5–8 min',
    subject: 'English',
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    // description: 'Solve science riddles to escape the virtual laboratory!',
    tags: ['new', 'science', 'puzzle'],
    image: Sudoku,
    emoji: '🔬',
    bgColor: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    component: '/games/sudoku',
    xpReward: 150,
    coinReward: 60,
    players: 8400,
    rating: 4.9,
    duration: '8–12 min',
    subject: 'Science',
  },
  {
    id: 'math-quiz',
    name: 'Math Quiz',
    // description: 'Master Kiswahili vocabulary in fast-paced word battles.',
    tags: ['hot', 'kiswahili'],
    image: MathQuiz,
    emoji: '🗣️',
    bgColor: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
    component: '/games/math-quiz',
    xpReward: 110,
    coinReward: 45,
    players: 15200,
    rating: 4.6,
    duration: '4–6 min',
    subject: 'Kiswahili',
  },
  {
    id: 'bible-quiz',
    name: 'Bible Quiz',
    tags: ['popular', 'math'],
    image: BibleQuiz,
    emoji: '⚔️',
    bgColor: 'linear-gradient(135deg, #157347 0%, #2f9e6a 100%)',
    component: '/games/bible-quiz',
    xpReward: 130,
    coinReward: 55,
    players: 12100,
    rating: 4.5,
    duration: '5–10 min',
    subject: 'Mathematics',
  },
  {
    id: 'checkers',
    name: 'Checkers',
    tags: ['popular', 'quiz', 'hot'],
    image: Checkers,
    emoji: '🏆',
    bgColor: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
    component: '/games/checkers',
    xpReward: 200,
    coinReward: 80,
    players: 31000,
    rating: 4.9,
    duration: '10–15 min',
    subject: 'All Subjects',
  },
  {
    id: 'tictactoe',
    name: 'TicTac Toe',
    tags: ['new', 'english'],
    image: TicTacToe,
    emoji: '📚',
    bgColor: 'linear-gradient(135deg, #1d4ed8 0%, #157347 100%)',
    component: '/games/tictac-toe',
    xpReward: 90,
    coinReward: 35,
    players: 6700,
    rating: 4.4,
    duration: '6–9 min',
    subject: 'English',
  },
  {
    id: 'word-quest',
    name: 'WordQuest',
    tags: ['new', 'science'],
    image: WordQuest,
    emoji: '🚀',
    bgColor: 'linear-gradient(135deg, #111827 0%, #1e40af 100%)',
    component: '/games/word-quest',
    xpReward: 140,
    coinReward: 60,
    players: 9200,
    rating: 4.8,
    duration: '7–10 min',
    subject: 'Science',
  },
  {
    id: 'kiswahili-quiz',
    name: 'Kiswahili Quiz',
    tags: ['math', 'puzzle'],
    image: KiswahiliQuiz,
    emoji: '📐',
    bgColor: 'linear-gradient(135deg, #6d28d9 0%, #0f5132 100%)',
    component: '/games/kiswahili-quiz',
    xpReward: 110,
    coinReward: 45,
    players: 10500,
    rating: 4.3,
    duration: '5–8 min',
    subject: 'Mathematics',
  },
  {
    id: 'connect-four',
    name: 'Connect Four',
    // description: 'Mixed puzzle challenges that test all subjects at once.',
    tags: ['hot', 'puzzle', 'quiz'],
    image: ConnectFour,
    emoji: '🧠',
    bgColor: 'linear-gradient(135deg, #dc2626 0%, #15803d 100%)',
    component: '/games/connect-four',
    xpReward: 160,
    coinReward: 65,
    players: 17800,
    rating: 4.7,
    duration: '8–12 min',
    subject: 'Mixed',
  },
  {
    id: 'bq-cs-001',
    name: 'Code Breaker',
    // description: 'Decode messages and learn basic programming logic.',
    tags: ['coming_soon', 'puzzle'],
    image: '',
    emoji: '💻',
    bgColor: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
    component: '/games/code-breaker',
    xpReward: 180,
    coinReward: 75,
    players: 0,
    rating: 0,
    duration: '10–15 min',
    subject: 'Computer Science',
  },
  {
    id: 'bq-history-001',
    name: 'Kenya Chronicles',
    // description: 'Travel through Kenyan history and answer trivia questions.',
    tags: ['coming_soon'],
    image: '',
    emoji: '🗺️',
    bgColor: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
    component: '/games/kenya-chronicles',
    xpReward: 130,
    coinReward: 55,
    players: 0,
    rating: 0,
    duration: '8–12 min',
    subject: 'Social Studies',
  }
];

export const useGameStore = create<GameState>((set, get) => ({
  activeFilter: 'all',
  games: ALL_GAMES,

  setFilter: (f) => set({ activeFilter: f }),

  filteredGames: () => {
    const { activeFilter, games } = get();
    if (activeFilter === 'all') return games;
    return games.filter(g => g.tags.includes(activeFilter as GameTag));
  },

  getGameById: (id) => get().games.find(g => g.id === id),
}));
