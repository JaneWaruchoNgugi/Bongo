import { create } from 'zustand';
import Grade1Math from "../assets/Grade1-3/grade1-math.png"
import Grade2Math from "../assets/Grade1-3/grade2-math.png"
import Grade2English from "../assets/Grade1-3/grade2-english.png"
import Grade3Math from "../assets/Grade1-3/grade3-math.png"
import Grade4Math from "../assets/Grade4-6/grade4-math.png"
import Grade5Math from "../assets/Grade4-6/grade5-math.png"
import Grade5English from "../assets/Grade4-6/grade5-english.png"
import Grade6Math from "../assets/Grade4-6/grade6-math.png"
import Grade7Math from "../assets/Grade7-9/grade7-math.png"
import Grade8Math from "../assets/Grade7-9/grade8-math.png"
import Grade8English from "../assets/Grade7-9/grade8-english.png"
import Grade8SocialStudies from "../assets/Grade7-9/grade8socialstudies.png"
import Grade9Math from "../assets/Grade7-9/grade9-math.png"
import Grade9English from "../assets/Grade7-9/grade9-english.png"
import Grade9Kiswahili from "../assets/Grade7-9/grade9-kiswahili.png"
import Grade10Math from "../assets/grade10-12/grade10-math.png"
import Grade11Math from "../assets/grade10-12/grade11-math.png"
import Grade12Math from "../assets/grade10-12/grade12-math.png"
import Grade12Engineering from "../assets/grade10-12/grade12-engineering.png"
import Grade11ArtsSS from "../assets/grade10-12/grade11-ArtsSS.png"

// import KPSEA from "../assets/Papers/KPSEABooster.png"
// import KJSEA from "../assets/Papers/KJSEAbooster.png"
/* ─── Types ─────────────────────────────────────────────── */
export type GradeFilter = 'all' | 'grade1-3' | 'grade4-6' | 'grade7-9' | 'grade10-12';

export interface Exam {
    id: string;
    img:string;
    title: string;
    subject: string;
    grade: GradeFilter;          // which filter bucket this belongs to
    gradeLabel: string;          // display label e.g. "Grade 4–6"
    emoji: string;
    color: string;               // accent colour for the card
    questions: number;
    duration: number;            // minutes
    difficulty: 'Easy' | 'Medium' | 'Hard';
    isNew?: boolean;
    isHot?: boolean;
    completions: number;         // how many students have done it
}

interface ExamState {
    activeFilter: GradeFilter;
    setFilter: (f: GradeFilter) => void;
    exams: Exam[];
    filteredExams: () => Exam[];
}

/* ─── Exam data ─────────────────────────────────────────── */
const ALL_EXAMS: Exam[] = [
    /* ── Grade 1–3 ── */
    { id: 'e1', img:Grade1Math, title: 'Mathematics',           subject: 'Mathematics',                  grade: 'grade1-3',   gradeLabel: 'Grade 1–3',   emoji: '📖', color: '#157347', questions: 20, duration: 15, difficulty: 'Easy',   isNew: false, isHot: true,  completions: 3420 },
    { id: 'e2',  img:Grade2Math,  title: 'Mathematics',               subject: 'Mathematics',              grade: 'grade1-3',   gradeLabel: 'Grade 1–3',   emoji: '🔢', color: '#0891b2', questions: 20, duration: 15, difficulty: 'Easy',   isNew: false, isHot: false, completions: 2890 },
    { id: 'e3',  img:Grade2English,  title: 'English',               subject: 'English',              grade: 'grade1-3',   gradeLabel: 'Grade 1–3',   emoji: '🔢', color: '#0891b2', questions: 20, duration: 15, difficulty: 'Easy',   isNew: false, isHot: false, completions: 2890 },
    { id: 'e4',  img:Grade3Math,  title: 'Mathematics',           subject: 'Mathematics', grade: 'grade1-3',   gradeLabel: 'Grade 1–3',   emoji: '🌿', color: '#059669', questions: 15, duration: 12, difficulty: 'Easy',   isNew: true,  isHot: false, completions: 1230 },

    /* ── Grade 4–6 ── */
    { id: 'e4b',  img:Grade4Math,  title: 'Mathematics',         subject: 'Mathematics',                grade: 'grade4-6',   gradeLabel: 'Grade 1–3',   emoji: '🗣️', color: '#d97706', questions: 15, duration: 12, difficulty: 'Easy',   isNew: false, isHot: false, completions: 1980 },
    { id: 'e5',  img:Grade5Math,  title: 'Mathematics',       subject: 'Mathematics',                  grade: 'grade4-6',   gradeLabel: 'Grade 4–6',   emoji: '📝', color: '#157347', questions: 40, duration: 40, difficulty: 'Medium', isNew: false, isHot: true,  completions: 8710 },
    { id: 'e6', img:Grade6Math,   title: 'Mathematics',        subject: 'Mathematics',              grade: 'grade4-6',   gradeLabel: 'Grade 4–6',   emoji: '🧮', color: '#0891b2', questions: 40, duration: 40, difficulty: 'Medium', isNew: false, isHot: true,  completions: 9120 },
    { id: 'e6b', img:Grade5English,   title: 'English',        subject: 'English',              grade: 'grade4-6',   gradeLabel: 'Grade 4–6',   emoji: '🧮', color: '#0891b2', questions: 40, duration: 40, difficulty: 'Medium', isNew: false, isHot: true,  completions: 9120 },

    // { id: 'e7', img:KPSEA,   title: 'Science & Technology',     subject: 'Science & Technology',     grade: 'grade4-6',   gradeLabel: 'Grade 4–6',   emoji: '🔬', color: '#059669', questions: 30, duration: 30, difficulty: 'Medium', isNew: false, isHot: false, completions: 5430 },
    // { id: 'e8', img:KPSEA,   title: 'Social Studies Kenya',     subject: 'Social Studies',           grade: 'grade4-6',   gradeLabel: 'Grade 4–6',   emoji: '🌍', color: '#ea580c', questions: 30, duration: 30, difficulty: 'Medium', isNew: true,  isHot: false, completions: 3210 },
    // { id: 'e9', img:KPSEA,   title: 'Creative Arts',            subject: 'Creative Arts',            grade: 'grade4-6',   gradeLabel: 'Grade 4–6',   emoji: '🎨', color: '#d97706', questions: 25, duration: 25, difficulty: 'Easy',   isNew: true,  isHot: false, completions: 2100 },
    // { id: 'e10', img:KPSEA,  title: 'Agriculture & Nutrition',  subject: 'Agriculture & Nutrition',  grade: 'grade4-6',   gradeLabel: 'Grade 4–6',   emoji: '🌱', color: '#059669', questions: 25, duration: 25, difficulty: 'Medium', isNew: false, isHot: false, completions: 1870 },

    /* ── Grade 7–9 ── */
    { id: 'e11', img:Grade7Math,  title: 'Mathematics',          subject: 'Mathematics',       grade: 'grade7-9',   gradeLabel: 'Grade 7–9',   emoji: '⚗️', color: '#157347', questions: 50, duration: 60, difficulty: 'Hard',   isNew: false, isHot: true,  completions: 11200 },
    { id: 'e12', img:Grade8Math,  title: 'Mathematics',        subject: 'Mathematics',              grade: 'grade7-9',   gradeLabel: 'Grade 7–9',   emoji: '📐', color: '#0891b2', questions: 50, duration: 60, difficulty: 'Hard',   isNew: false, isHot: true,  completions: 13400 },
    { id: 'e12b', img:Grade8English,  title: 'English',        subject: 'English',              grade: 'grade7-9',   gradeLabel: 'Grade 7–9',   emoji: '📐', color: '#0891b2', questions: 50, duration: 60, difficulty: 'Hard',   isNew: false, isHot: true,  completions: 13400 },
    { id: 'e13', img:Grade8SocialStudies,  title: 'SocialStudies',        subject: 'SocialStudies',              grade: 'grade7-9',   gradeLabel: 'Grade 7–9',   emoji: '📐', color: '#0891b2', questions: 50, duration: 60, difficulty: 'Hard',   isNew: false, isHot: true,  completions: 13400 },
    { id: 'e14', img:Grade9Math,  title: 'Mathematics',  subject: 'Mathematics',                  grade: 'grade7-9',   gradeLabel: 'Grade 7–9',   emoji: '📚', color: '#157347', questions: 45, duration: 50, difficulty: 'Medium', isNew: false, isHot: false, completions: 7800 },
    { id: 'e15', img:Grade9English,  title: 'English',     subject: 'English',           grade: 'grade7-9',   gradeLabel: 'Grade 7–9',   emoji: '🗺️', color: '#ea580c', questions: 40, duration: 45, difficulty: 'Medium', isNew: true,  isHot: false, completions: 5600 },
    { id: 'e16', img:Grade9Kiswahili,  title: 'Kiswahili',    subject: 'Kiswahili',    grade: 'grade7-9',   gradeLabel: 'Grade 7–9',   emoji: '🔧', color: '#059669', questions: 35, duration: 40, difficulty: 'Medium', isNew: true,  isHot: false, completions: 3200 },
    // { id: 'e16', img:KJSEA,  title: 'Business Studies Basics',  subject: 'Business Studies',         grade: 'grade7-9',   gradeLabel: 'Grade 7–9',   emoji: '💼', color: '#d97706', questions: 35, duration: 40, difficulty: 'Medium', isNew: false, isHot: false, completions: 4100 },

    /* ── Grade 10–12 ── */
    { id: 'e17', img:Grade10Math,  title: 'Mathematics',        subject: 'Mathematics',                  grade: 'grade10-12', gradeLabel: 'Grade 10–12', emoji: '⚡', color: '#157347', questions: 60, duration: 90, difficulty: 'Hard',   isNew: false, isHot: true,  completions: 6700 },
    { id: 'e18', img:Grade11Math,  title: 'Mathematics',       subject: 'Mathematics',                grade: 'grade10-12', gradeLabel: 'Grade 10–12', emoji: '🧪', color: '#0891b2', questions: 60, duration: 90, difficulty: 'Hard',   isNew: false, isHot: true,  completions: 5900 },
    { id: 'e19', img:Grade12Math,  title: 'Mathematics',         subject: 'Mathematics',              grade: 'grade10-12', gradeLabel: 'Grade 10–12', emoji: '∫',  color: '#059669', questions: 60, duration: 90, difficulty: 'Hard',   isNew: false, isHot: true,  completions: 8800 },
    { id: 'e20', img:Grade12Engineering,  title: 'Engineering',  subject: 'Engineering',                  grade: 'grade10-12', gradeLabel: 'Grade 10–12', emoji: '🧬', color: '#dc2626', questions: 55, duration: 80, difficulty: 'Hard',   isNew: true,  isHot: false, completions: 4300 },
    { id: 'e21', img:Grade11ArtsSS,  title: 'Arts & Sport Science',         subject: 'Arts & Sport Science',         grade: 'grade10-12', gradeLabel: 'Grade 10–12', emoji: '💻', color: '#157347', questions: 50, duration: 70, difficulty: 'Hard',   isNew: true,  isHot: false, completions: 3100 },
    // { id: 'e22', img:KJSEA,  title: 'History & Government',     subject: 'History',                  grade: 'grade10-12', gradeLabel: 'Grade 10–12', emoji: '🏛️', color: '#d97706', questions: 50, duration: 70, difficulty: 'Medium', isNew: false, isHot: false, completions: 3800 },
    // { id: 'e23', img:KJSEA,  title: 'Geography Social Sci.',    subject: 'Geography',                grade: 'grade10-12', gradeLabel: 'Grade 10–12', emoji: '🌋', color: '#ea580c', questions: 50, duration: 70, difficulty: 'Medium', isNew: false, isHot: false, completions: 3500 },
    // { id: 'e24', img:KJSEA,  title: 'Business Studies Adv.',    subject: 'Business Studies',         grade: 'grade10-12', gradeLabel: 'Grade 10–12', emoji: '📊', color: '#059669', questions: 45, duration: 60, difficulty: 'Medium', isNew: true,  isHot: false, completions: 2900 },
];

export const useExamStore = create<ExamState>((set, get) => ({
    activeFilter: 'all',
    exams: ALL_EXAMS,

    setFilter: (f) => set({ activeFilter: f }),

    filteredExams: () => {
        const { activeFilter, exams } = get();
        if (activeFilter === 'all') return exams;
        return exams.filter(e => e.grade === activeFilter);
    },
}));