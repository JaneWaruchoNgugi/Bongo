// components/Confetti.tsx
import { useRef } from "react";

interface ConfettiPiece {
    id: number;
    left: number;
    delay: number;
    duration: number;
    size: number;
    color: string;
    char: string;
}

interface ConfettiProps {
    active: boolean;
}

const SHAPES: string[] = ["■", "●", "▲", "◆", "★", "✦", "♦"];
const SHADES: string[] = [
    "#6c3fc5", "#8b5cf6", "#5fae84", "#c4b5fd",
    "#ec4899", "#f59e0b", "#10b981", "#3b82f6",
    "#f472b6", "#fbbf24",
];

export default function Confetti({ active }: ConfettiProps) {
    const pieces = useRef<ConfettiPiece[]>([]);

    if (active && pieces.current.length === 0) {
        pieces.current = Array.from({ length: 45 }, (_, i): ConfettiPiece => ({
            id:       i,
            left:     Math.random() * 100,
            delay:    Math.random() * 2.2,
            duration: 2.2 + Math.random() * 2,
            size:     9 + Math.random() * 11,
            color:    SHADES[i % SHADES.length],
            char:     SHAPES[i % SHAPES.length],
        }));
    }

    if (!active) return null;

    return (
        <div
            style={{
                position:      "fixed",
                inset:         0,
                pointerEvents: "none",
                zIndex:        9999,
                overflow:      "hidden",
            }}
        >
            {pieces.current.map((p) => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left:              `${p.left}%`,
                        fontSize:           p.size,
                        color:              p.color,
                        animationDelay:    `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                >
                    {p.char}
                </div>
            ))}
        </div>
    );
}