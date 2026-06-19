// hooks/useGame.ts
// Utility hook for linking game cards to game components
// Usage: const { launchGame, getGame, isComingSoon } = useGame()

import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useGameStore, type Game } from '../store/useGameStore';

interface UseGameReturn {
  launchGame: (gameId: string) => void;
  getGame: (gameId: string) => Game | undefined;
  isComingSoon: (game: Game) => boolean;
  isNew: (game: Game) => boolean;
  isHot: (game: Game) => boolean;
  formatPlayers: (count: number) => string;
  getTagLabel: (tag: string) => { label: string; color: string; bg: string };
}

export const useGame = (): UseGameReturn => {
  const navigate = useNavigate();
  const { isLoggedIn, setOverlay } = useStore();
  const { getGameById } = useGameStore();

  const launchGame = (gameId: string) => {
    if (!isLoggedIn) {
      setOverlay('signup');
      return;
    }

    const game = getGameById(gameId);
    if (!game) return;

    if (game.tags.includes('coming_soon')) {
      // Show coming soon toast/modal instead of navigating
      return;
    }

    if (game.component) {
      navigate(game.component);
    }
  };

  const getGame = (gameId: string) => getGameById(gameId);

  const isComingSoon = (game: Game) => game.tags.includes('coming_soon');
  const isNew = (game: Game) => game.tags.includes('new');
  const isHot = (game: Game) => game.tags.includes('hot');

  const formatPlayers = (count: number): string => {
    if (count === 0) return 'Coming Soon';
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const getTagLabel = (tag: string): { label: string; color: string; bg: string } => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      new:          { label: 'NEW',          color: '#fff',    bg: '#10b981' },
      popular:      { label: 'POPULAR',      color: '#fff',    bg: '#3b82f6' },
      hot:          { label: '🔥 HOT',       color: '#fff',    bg: '#ef4444' },
      coming_soon:  { label: 'COMING SOON',  color: '#fff',    bg: '#6b7280' },
      math:         { label: 'MATH',         color: '#fff',    bg: '#157347' },
      english:      { label: 'ENGLISH',      color: '#fff',    bg: '#2563eb' },
      science:      { label: 'SCIENCE',      color: '#fff',    bg: '#059669' },
      puzzle:       { label: 'PUZZLE',       color: '#fff',    bg: '#d97706' },
      kiswahili:    { label: 'KISWAHILI',    color: '#fff',    bg: '#ea580c' },
      quiz:         { label: 'QUIZ',         color: '#fff',    bg: '#b45309' },
    };
    return map[tag] ?? { label: tag.toUpperCase(), color: '#fff', bg: '#6b7280' };
  };

  return { launchGame, getGame, isComingSoon, isNew, isHot, formatPlayers, getTagLabel };
};
