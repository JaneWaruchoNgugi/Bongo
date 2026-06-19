import { useEffect, useRef, useState } from 'react';
import '../styles/WinnerMarquee.css';

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
};

type FirestoreFields = Record<string, FirestoreValue>;

interface FirestoreRunQueryRow {
  document?: {
    fields?: FirestoreFields;
  };
}

export interface Winner {
  rank: number;
  name: string;
  phone?: string;
  game: string;
  score: string;
  avatar: string;
  color: string;
}

interface WinnerCardProps {
  winner: Winner;
}

const RANK_ICONS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function WinnerCard({ winner }: WinnerCardProps) {
  const isTop3 = winner.rank <= 3;

  return (
    <div
      className="wm-card"
      style={{ '--wm-card-color': winner.color } as React.CSSProperties}
    >
      {/* Rank */}
      <div
        className="wm-rank"
        style={{ color: isTop3 ? winner.color : 'rgba(255,255,255,0.35)' }}
      >
        {isTop3 ? RANK_ICONS[winner.rank] : `#${winner.rank}`}
      </div>

      <div className="wm-divider" />

      {/* Avatar */}
      <div
        className="wm-avatar"
        style={{
          borderColor: winner.color,
          boxShadow: `0 0 10px ${winner.color}50`,
        }}
      >
        <span style={{ color: winner.color }}>{winner.avatar}</span>
        {isTop3 && (
          <div className="wm-avatar-ring" style={{ borderColor: winner.color }} />
        )}
      </div>

      {/* Name */}
      <span className="wm-name">
        {winner.name}
        {winner.phone && <span className="wm-phone">{winner.phone}</span>}
      </span>

      {/* Game pill */}
      <div
        className="wm-game-pill"
        style={{
          borderColor: `${winner.color}40`,
          background: `${winner.color}10`,
        }}
      >
        <span className="wm-game-dot" style={{ background: winner.color }} />
        <span className="wm-game-label">{winner.game}</span>
      </div>

      {/* Score */}
      <div className="wm-score" style={{ color: winner.color }}>
        <span className="wm-score-icon">⚡</span>
        <span>{winner.score}</span>
      </div>

      <div className="wm-sep">✦</div>
    </div>
  );
}

interface WinnerMarqueeProps {
  winners?: Winner[];
}

const DEFAULT_WINNERS: Winner[] = [
  { rank: 1, name: 'Grace', game: 'Bible Quiz', score: '12,450', avatar: 'G', color: '#00f5d4' },
  { rank: 2, name: 'Joyce', game: 'Bongo Quiz', score: '11,220', avatar: 'J', color: '#ff3cac' },
  { rank: 3, name: 'Annet', game: 'Sudoku', score: '9,730', avatar: 'A', color: '#2f9e6a' },
  { rank: 4, name: 'Kipkoech', game: 'Math Quiz', score: '9,210', avatar: 'K', color: '#f97316' },
];

const LEADERBOARD_ENDPOINT =
  'https://firestore.googleapis.com/v1/projects/bongoquiz-23ad4/databases/(default)/documents:runQuery?key=AIzaSyBETgk4L08AfM1vWQJWxvqGHkFv1Jof8HE';

const RANK_COLORS = ['#FFD700', '#00f5d4', '#ff3cac', '#2f9e6a', '#f97316', '#22d3ee', '#84cc16', '#fb7185'];

function readFirestoreString(fields: FirestoreFields | undefined, key: string): string {
  const value = fields?.[key];
  return value?.stringValue ?? '';
}

function readFirestoreNumber(fields: FirestoreFields | undefined, key: string): number {
  const value = fields?.[key];
  return Number(value?.integerValue ?? value?.doubleValue ?? 0);
}

function maskPhone(phone: string): string | undefined {
  if (!phone) return undefined;
  return phone.length > 3 ? `${phone.slice(0, 3)}******` : phone;
}

function initialsFor(name: string, phone?: string): string {
  const source = name || phone || 'Player';
  const words = source.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

async function fetchLeaderboardWinners(): Promise<Winner[]> {
  const response = await fetch(LEADERBOARD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'leaderboard' }],
        orderBy: [{ field: { fieldPath: 'score' }, direction: 'DESCENDING' }],
        limit: 50,
      },
    }),
  });

  if (!response.ok) throw new Error('Unable to load leaderboard data');

  const rows = await response.json() as FirestoreRunQueryRow[];

  const winners = rows
    .map((row) => row.document?.fields)
    .filter((fields): fields is FirestoreFields => Boolean(fields))
    .map((fields, index) => {
      const phone = readFirestoreString(fields, 'phone');
      const name = readFirestoreString(fields, 'name') || maskPhone(phone) || 'Player';
      const score = readFirestoreNumber(fields, 'score');

      return {
        rank: index + 1,
        name,
        phone: name === maskPhone(phone) ? undefined : maskPhone(phone),
        game: readFirestoreString(fields, 'game') || 'Bongo Quiz',
        score: score.toLocaleString(),
        avatar: initialsFor(name, phone),
        color: RANK_COLORS[index % RANK_COLORS.length],
      };
    });

  return winners.length > 0 ? winners : DEFAULT_WINNERS;
}

export default function WinnerMarquee({ winners }: WinnerMarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [liveWinners, setLiveWinners] = useState<Winner[]>(winners ?? DEFAULT_WINNERS);
  const activeWinners = winners ?? liveWinners;
  const doubled: Winner[] = [...activeWinners, ...activeWinners];

  useEffect(() => {
    if (winners) return;

    let cancelled = false;

    fetchLeaderboardWinners()
      .then(nextWinners => {
        if (!cancelled) setLiveWinners(nextWinners);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [winners]);

  return (
    <div className="wm-wrapper">
      {/* Header */}
      <div className="wm-header">
        <div className="wm-live">
          <div className="wm-live-dot" />
          Live
        </div>
        <div className="wm-header-line" />
        <span className="wm-header-title">Top Players</span>
      </div>

      {/* Rail */}
      <div
        className="wm-rail"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="wm-fade-left" />
        <div
          ref={trackRef}
          className={`wm-track${isPaused ? ' paused' : ''}`}
        >
          {doubled.map((winner, i) => (
            <WinnerCard key={`${winner.rank}-${winner.phone ?? winner.name}-${winner.score}-${i}`} winner={winner} />
          ))}
        </div>
        <div className="wm-fade-right" />
      </div>

      {/* Footer */}
      <div className="wm-footer">
        <span className="wm-footer-count">
          <strong>{activeWinners.length}</strong> players ranked today
        </span>
      </div>
    </div>
  );
}
