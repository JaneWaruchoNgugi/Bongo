import type {FamilyPackage} from "../store/useStore.ts";
import {Crown, Star, User, Users} from "lucide-react";
import  {type ElementType} from "react";

const DICEBEAR = (seed: string) =>
  seed.startsWith('data:') || seed.startsWith('blob:') || seed.startsWith('http')
    ? seed
    : `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seed}&mood=happy`;

export const AVATARS = [
  'Zara','Kofi','Amara','Jabari','Nia','Kwame','Aisha','Tendai',
  'Imani','Baraka','Zawadi','Chidi','Fatuma','Seun','Adaeze','Mwangi',
];

export const avatarUrl = (a: string) => DICEBEAR(a);

export const PACKAGES: {
    id: FamilyPackage; label: string; subtitle: string; price: string; period: string;
    icon: ElementType; color: string; popular?: boolean; features: string[];
}[] = [
    {
        id: 'solo', label: 'Solo', subtitle: '1 Student', price: 'KSh 240', period: '/month',
        icon: User, color: '#10b981',
        features: ['1 student profile', 'All subjects & levels', 'Mock exams & quizzes', 'Progress tracking'],
    },
    {
        id: 'trio', label: 'Duo', subtitle: '2 Students', price: 'KSh 360', period: '/month',
        icon: Users, color: '#7c3aed', popular: true,
        features: ['2 student profiles', 'All subjects & levels', 'Mock exams & quizzes', 'Progress tracking', 'Priority support'],
    },
    {
        id: 'quad', label: 'Trio', subtitle: '3 Students', price: 'KSh 480', period: '/month',
        icon: Crown, color: '#f59e0b',
        features: ['3 student profiles', 'All subjects & levels', 'Mock exams & quizzes', 'Progress tracking', 'Priority support'],
    },
    {
        id: 'family', label: 'Family', subtitle: '4+ Students', price: 'KSh 1,080', period: '/month',
        icon: Star, color: '#2f9e6a',
        features: ['Unlimited profiles', 'All subjects & levels', 'Mock exams & quizzes', 'Advanced analytics', 'Priority support', 'Early access to features'],
    },
];