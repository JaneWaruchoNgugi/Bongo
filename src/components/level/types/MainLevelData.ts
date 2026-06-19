
// Subject poster images per level
import lp_English        from '../SubjectsImg/Grade1-3/English.png';
import lp_Mathematics        from '../SubjectsImg/Grade1-3/Mathematics.png';
import lp_Kiswahili      from '../SubjectsImg/Grade1-3/Kiswahili.png';
import lp_Religious      from '../SubjectsImg/Grade1-3/Religious-ed.png';
import lp_Literacy       from '../SubjectsImg/Grade1-3/Literacy.png';
import lp_Movement       from '../SubjectsImg/Grade1-3/MovementCreative.png';
import lp_Environmental       from '../SubjectsImg/Grade1-3/Environmental.png';
import lp_Hygiene        from '../SubjectsImg/Grade1-3/HygieneNutrition.png';
import ms_Math           from '../SubjectsImg/Grade4-9/Math.png';
import ms_English        from '../SubjectsImg/Grade4-9/English.png';
import ms_Science        from '../SubjectsImg/Grade4-9/Science.png';
import ms_SocialStudies  from '../SubjectsImg/Grade4-9/SocialStudies.png';
import ms_CRE            from '../SubjectsImg/Grade4-9/CRE.png';
import ss_Mathematics    from '../SubjectsImg/grade10-12/Mathematics.png';
import ss_English        from '../SubjectsImg/grade10-12/English.png';
import ss_Kiswahili      from '../SubjectsImg/grade10-12/Kiswahili.png';
import ss_Biology        from '../SubjectsImg/grade10-12/Biology.png';
import ss_Chemistry      from '../SubjectsImg/grade10-12/Chemistry.png';
import ss_Physics        from '../SubjectsImg/grade10-12/Physics.png';
import ht_lp  from '../HotopicsIMG/grade1-3.png';
import ht_ms  from '../HotopicsIMG/grade4-9.png';
import ht_ss  from '../HotopicsIMG/grade10-12.png';
import type {EducationLevel} from "../../../store/useStore.ts";

export const HOT_TOPICS_BG: Record<EducationLevel, string> = {
    lower_primary: ht_lp,
    middle_school: ht_ms,
    senior_school: ht_ss,
};

export const SUBJECT_IMAGES: Record<EducationLevel, Record<string, string>> = {
    lower_primary: {
        'Literacy':            lp_Literacy,
        'Kiswahili':           lp_Kiswahili,
        'English':             lp_English,
        'Movement & Creative': lp_Movement,
        'Hygiene & Nutrition': lp_Hygiene,
        'Mathematics': lp_Mathematics,
        'Religious Ed':lp_Religious,
        'Environmental':lp_Environmental

    },
    middle_school: {
        'Mathematics':   ms_Math,
        'English':       ms_English,
        'Science':       ms_Science,
        'Social Studies':ms_SocialStudies,
        'CRE':           ms_CRE,
    },
    senior_school: {
        'Mathematics': ss_Mathematics,
        'English':     ss_English,
        'Kiswahili':   ss_Kiswahili,
        'Biology':     ss_Biology,
        'Chemistry':   ss_Chemistry,
        'Physics':     ss_Physics,
    },
};

export const LEVEL_SUBJECTS: Record<EducationLevel, { name: string; icon: string; grad: string; desc: string }[]> = {
    lower_primary: [
        { name: 'Literacy',            icon: '📚', grad: 'linear-gradient(135deg,#f97316,#fb923c)', desc: 'Reading & Writing' },
        { name: 'Kiswahili',           icon: '🗨️', grad: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', desc: 'Lugha ya Taifa' },
        { name: 'English',             icon: '📖', grad: 'linear-gradient(135deg,#10b981,#34d399)', desc: 'Language Skills' },
        { name: 'Mathematics',         icon: '➗', grad: 'linear-gradient(135deg,#e11d48,#fb7185)', desc: 'Numbers & Logic' },
        { name: 'Environmental',       icon: '🌍', grad: 'linear-gradient(135deg,#16a34a,#4ade80)', desc: 'Nature & Society' },
        { name: 'Hygiene & Nutrition', icon: '🍎', grad: 'linear-gradient(135deg,#0891b2,#22d3ee)', desc: 'Health & Food' },
        { name: 'Religious Ed',        icon: '🕊️', grad: 'linear-gradient(135deg,#d97706,#fbbf24)', desc: 'Values & Faith' },
        { name: 'Movement & Creative', icon: '🎭', grad: 'linear-gradient(135deg,#157347,#5fae84)', desc: 'Art, Music & PE' },
    ],

    middle_school: [
        { name: 'Mathematics',   icon: '📊', grad: 'linear-gradient(135deg,#e11d48,#fb7185)', desc: 'Numbers & Logic' },
        { name: 'English',       icon: '📝', grad: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', desc: 'Language Skills' },
        { name: 'Science',       icon: '🔬', grad: 'linear-gradient(135deg,#10b981,#34d399)', desc: 'Experiments & Facts' },
        { name: 'Social Studies',icon: '🗺️', grad: 'linear-gradient(135deg,#f97316,#fb923c)', desc: 'People & Places' },
        // { name: 'CRE',           icon: '⛪', grad: 'linear-gradient(135deg,#d97706,#fbbf24)', desc: 'Values & Faith' },
    ],

    senior_school: [
        { name: 'Mathematics', icon: '📈', grad: 'linear-gradient(135deg,#e11d48,#fb7185)', desc: 'Numbers & Logic' },
        { name: 'English',     icon: '📖', grad: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', desc: 'Language Skills' },
        { name: 'Physics',     icon: '🧲', grad: 'linear-gradient(135deg,#d97706,#fbbf24)', desc: 'Forces & Energy' },
        { name: 'Chemistry',   icon: '⚗️', grad: 'linear-gradient(135deg,#157347,#5fae84)', desc: 'Matter & Reactions' },
        { name: 'Biology',     icon: '🧬', grad: 'linear-gradient(135deg,#16a34a,#4ade80)', desc: 'Life Sciences' },
        { name: 'Kiswahili',   icon: '💬', grad: 'linear-gradient(135deg,#0891b2,#22d3ee)', desc: 'Lugha ya Taifa' },
    ],
};

export const HOT_TOPICS_BY_LEVEL: Record<EducationLevel, { title: string; emoji: string; grad: string; tag: string }[]> = {
    lower_primary: [
        { title: 'Listening & Speaking',     emoji: '🗣️', grad: 'linear-gradient(135deg,#f97316,#fb923c)', tag: 'Literacy' },
        { title: 'Letter Sounds & Alphabet', emoji: '🔤', grad: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', tag: 'Literacy' },
        { title: 'Counting Forward & Back',  emoji: '🔢', grad: 'linear-gradient(135deg,#e11d48,#fb7185)', tag: 'Maths' },
        { title: 'Addition & Subtraction',   emoji: '➕', grad: 'linear-gradient(135deg,#157347,#5fae84)', tag: 'Maths' },
        { title: 'My Family & Home',         emoji: '🏠', grad: 'linear-gradient(135deg,#16a34a,#4ade80)', tag: 'Environment' },
        { title: 'Plants & Animals',         emoji: '🌿', grad: 'linear-gradient(135deg,#0891b2,#22d3ee)', tag: 'Environment' },
        { title: 'Personal Cleanliness',     emoji: '🧼', grad: 'linear-gradient(135deg,#d97706,#fbbf24)', tag: 'Hygiene' },
        { title: 'Shapes & Patterns',        emoji: '🔷', grad: 'linear-gradient(135deg,#db2777,#f472b6)', tag: 'Maths' },
        { title: 'Storytelling',             emoji: '📖', grad: 'linear-gradient(135deg,#f97316,#fbbf24)', tag: 'English' },
        { title: 'Drawing & Crafts',         emoji: '🎨', grad: 'linear-gradient(135deg,#157347,#ec4899)', tag: 'Creative' },
    ],
    middle_school: [
        { title: 'Reading Comprehension',    emoji: '📘', grad: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', tag: 'English' },
        { title: 'Fractions & Decimals',     emoji: '➗', grad: 'linear-gradient(135deg,#e11d48,#fb7185)', tag: 'Maths' },
        { title: 'Human Body Systems',       emoji: '🫀', grad: 'linear-gradient(135deg,#10b981,#34d399)', tag: 'Science' },
        { title: 'Map Work & Counties',      emoji: '🗺️', grad: 'linear-gradient(135deg,#f97316,#fb923c)', tag: 'Social Studies' },
        { title: 'Algebra & Equations',      emoji: '📐', grad: 'linear-gradient(135deg,#157347,#5fae84)', tag: 'Maths' },
        { title: 'Matter: Solids & Liquids', emoji: '⚗️', grad: 'linear-gradient(135deg,#0891b2,#22d3ee)', tag: 'Science' },
        { title: 'Sarufi ya Kiswahili',      emoji: '📗', grad: 'linear-gradient(135deg,#16a34a,#4ade80)', tag: 'Kiswahili' },
        { title: 'Coding & Digital Safety',  emoji: '💻', grad: 'linear-gradient(135deg,#1e40af,#60a5fa)', tag: 'ICT' },
        { title: 'Entrepreneurship Basics',  emoji: '💼', grad: 'linear-gradient(135deg,#d97706,#fbbf24)', tag: 'Business' },
        { title: 'Statistics & Probability', emoji: '📊', grad: 'linear-gradient(135deg,#db2777,#f472b6)', tag: 'Maths' },
    ],
    senior_school: [
        { title: 'Differentiation',          emoji: '📈', grad: 'linear-gradient(135deg,#e11d48,#fb7185)', tag: 'Maths' },
        { title: 'Organic Chemistry',        emoji: '⚗️', grad: 'linear-gradient(135deg,#157347,#5fae84)', tag: 'Chemistry' },
        { title: 'Genetics & Evolution',     emoji: '🧬', grad: 'linear-gradient(135deg,#16a34a,#4ade80)', tag: 'Biology' },
        { title: 'Motion & Forces',          emoji: '🧲', grad: 'linear-gradient(135deg,#d97706,#fbbf24)', tag: 'Physics' },
        { title: 'Essay & Oral Skills',      emoji: '📝', grad: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', tag: 'English' },
        { title: 'Acids, Bases & Salts',     emoji: '🧪', grad: 'linear-gradient(135deg,#0891b2,#22d3ee)', tag: 'Chemistry' },
        { title: 'Electricity & Magnetism',  emoji: '⚡', grad: 'linear-gradient(135deg,#f97316,#fb923c)', tag: 'Physics' },
        { title: 'Human Physiology',         emoji: '🫁', grad: 'linear-gradient(135deg,#10b981,#34d399)', tag: 'Biology' },
        { title: 'Fasihi ya Kiswahili',      emoji: '📗', grad: 'linear-gradient(135deg,#16a34a,#4ade80)', tag: 'Kiswahili' },
        { title: 'Trigonometry',             emoji: '📐', grad: 'linear-gradient(135deg,#db2777,#f472b6)', tag: 'Maths' },
    ],
};

export const BONGO_BOOKS: Record<EducationLevel, { title: string; subject: string; grade: string; color: string; spine: string }[]> = {
    lower_primary: [
        { title: 'Literacy Activities',    subject: 'Literacy',     grade: 'Grade 1–3', color: '#f97316', spine: '#c2410c' },
        { title: 'Kiswahili Shughuli',     subject: 'Kiswahili',    grade: 'Grade 1–3', color: '#0ea5e9', spine: '#0369a1' },
        { title: 'Mathematics Fun',        subject: 'Mathematics',  grade: 'Grade 1–3', color: '#e11d48', spine: '#9f1239' },
        { title: 'Our Environment',        subject: 'Environmental',grade: 'Grade 1–3', color: '#16a34a', spine: '#14532d' },
        { title: 'Hygiene & Nutrition',    subject: 'Hygiene',      grade: 'Grade 1–3', color: '#0891b2', spine: '#155e75' },
        { title: 'Creative Activities',    subject: 'Creative',     grade: 'Grade 1–3', color: '#157347', spine: '#0b3d28' },
    ],
    middle_school: [
        { title: 'Mathematics',            subject: 'Mathematics',  grade: 'Grade 4–9', color: '#e11d48', spine: '#9f1239' },
        { title: 'English Language',       subject: 'English',      grade: 'Grade 4–9', color: '#0ea5e9', spine: '#0369a1' },
        { title: 'Integrated Science',     subject: 'Science',      grade: 'Grade 4–9', color: '#10b981', spine: '#065f46' },
        { title: 'Social Studies',         subject: 'Social Studies',grade: 'Grade 4–9',color: '#f97316', spine: '#c2410c' },
        { title: 'Kiswahili',              subject: 'Kiswahili',    grade: 'Grade 4–9', color: '#157347', spine: '#0b3d28' },
        { title: 'Business Studies',       subject: 'Business',     grade: 'Grade 7–9', color: '#d97706', spine: '#92400e' },
    ],
    senior_school: [
        { title: 'Mathematics',            subject: 'Mathematics',  grade: 'Grade 10–12', color: '#e11d48', spine: '#9f1239' },
        { title: 'English & Literature',   subject: 'English',      grade: 'Grade 10–12', color: '#0ea5e9', spine: '#0369a1' },
        { title: 'Physics',                subject: 'Physics',      grade: 'Grade 10–12', color: '#d97706', spine: '#92400e' },
        { title: 'Chemistry',              subject: 'Chemistry',    grade: 'Grade 10–12', color: '#157347', spine: '#0b3d28' },
        { title: 'Biology',                subject: 'Biology',      grade: 'Grade 10–12', color: '#16a34a', spine: '#14532d' },
        { title: 'Kiswahili',              subject: 'Kiswahili',    grade: 'Grade 10–12', color: '#0891b2', spine: '#155e75' },
    ],
};

export const LEVEL_BANNER: Record<EducationLevel, { emoji: string; title: string; desc: string; grad: string }> = {
    lower_primary: {
        emoji: '🌟', grad: 'linear-gradient(135deg,#f97316,#fb923c)',
        title: 'Keep Exploring, Young Learner!',
        desc: 'Every question you answer makes you smarter. You\'re doing amazing!',
    },
    middle_school: {
        emoji: '🚀', grad: 'linear-gradient(135deg,#6366f1,#5fae84)',
        title: 'Level Up Your Knowledge!',
        desc: 'Tackle topics, ace exams, and build skills that last a lifetime.',
    },
    senior_school: {
        emoji: '🎓', grad: 'linear-gradient(135deg,#0ea5e9,#157347)',
        title: 'Your Future Starts Here.',
        desc: 'Master your subjects, prepare for exams, and unlock your potential.',
    },
};
