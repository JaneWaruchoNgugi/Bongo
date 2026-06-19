import {
  BookOpen,
  BookOpenText,
  Calculator,
  Church,
  type LucideIcon,
  MessagesSquare,
  Palette,
  PersonStanding,
  Sprout,
} from 'lucide-react';

/* Subject palette — Kenyan-flag inspired (green/gold/red) plus complements,
   so cards stay colourful while harmonising with the green brand. */
export const PALETTE = [
  { accent: '#157347', deep: '#0f5132', soft: '#e7f5ed' }, // green
  { accent: '#d4a017', deep: '#a87d0e', soft: '#fbf3dc' }, // gold
  { accent: '#dc2626', deep: '#b91c1c', soft: '#fdeaea' }, // red
  { accent: '#2563eb', deep: '#1d4ed8', soft: '#e8f0fe' }, // blue
  { accent: '#0d9488', deep: '#0f766e', soft: '#e3f7f4' }, // teal
  { accent: '#ea580c', deep: '#c2410c', soft: '#fdeee3' }, // orange
  { accent: '#4f46e5', deep: '#4338ca', soft: '#eaeafe' }, // indigo
];

export const themeFor = (i: number) => PALETTE[i % PALETTE.length];

/** Pick a lucide icon that matches the subject name. */
export function iconFor(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes('math')) return Calculator;
  if (n.includes('english') || n.includes('literacy') || n.includes('language')) return BookOpenText;
  if (n.includes('kiswahili') || n.includes('lugha')) return MessagesSquare;
  if (n.includes('environment') || n.includes('science') || n.includes('nature')) return Sprout;
  if (n.includes('reli') || n.includes('ire') || n.includes('hre') || n.includes('faith')) return Church;
  if (n.includes('creative') || n.includes('art') || n.includes('music') || n.includes('movement')) return Palette;
  if (n.includes('physical') || n.includes('health') || n.includes('sport') || n.includes('p.e')) return PersonStanding;
  return BookOpen;
}
