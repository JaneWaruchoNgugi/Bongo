import React, {type FC, useRef, useState} from 'react';
import { Zap } from 'lucide-react';
import { type GradeFilter, useExamStore } from '../store/useExamStore.ts';
import { useStore } from '../store/useStore';
import "../styles/exambrowser.css";

const GRADE_SECTIONS: { id: GradeFilter; label: string; emoji: string }[] = [
    { id: 'grade1-3',   label: 'Grade 1–3',   emoji: '🧒' },
    { id: 'grade4-6',   label: 'Grade 4–6',   emoji: '📗' },
    { id: 'grade7-9',   label: 'Grade 7–9',   emoji: '🧠' },
    { id: 'grade10-12', label: 'Grade 10–12', emoji: '🎓' },
];

const GradeRow: React.FC<{
    section: typeof GRADE_SECTIONS[number];
    onCardClick: () => void;
}> = ({ section, onCardClick }) => {
    const { exams } = useExamStore();
    const [expanded, setExpanded] = useState(false);
    const rowRef = useRef<HTMLDivElement>(null);

    const gradeExams = exams.filter(e => e.grade === section.id);
    const PREVIEW_COUNT = 8;
    const visible = expanded ? gradeExams : gradeExams.slice(0, PREVIEW_COUNT);

    return (
        <div className="lpeb-row-section">
            <div className="lpeb-row-header">
                <h3 className="lpeb-row-title">
                    <span className="lpeb-row-emoji">{section.emoji}</span>
                    {section.label}
                    <span className="lpeb-row-count">{gradeExams.length}</span>
                </h3>
                <button
                    className="lpeb-show-all-btn"
                    onClick={() => setExpanded(prev => !prev)}
                >
                    {expanded ? 'Show less' : 'Show all'}
                </button>
            </div>

            <div className="lpeb-card-track-wrap">
                <div
                    className={`lpeb-card-track ${expanded ? 'lpeb-card-track--expanded' : ''}`}
                    ref={rowRef}
                >
                    {visible.map(exam => (
                        <div
                            key={exam.id}
                            className="lpeb-exam-card"
                            onClick={onCardClick}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && onCardClick()}
                        >
                            <div className="lpeb-exam-card-inner">
                                <img
                                    className="lpeb-exam-image"
                                    src={exam.img}
                                    alt={exam.title}
                                />
                                <div className="lpeb-exam-overlay">
                                    <div className="lpeb-overlay-content">
                                        <span className="lpeb-exam-title">{exam.title}</span>
                                        <button className="lpeb-cta-btn">
                                            Try Test
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const ExamBrowser: FC = () => {
    const { setOverlay } = useStore();
    const { exams } = useExamStore();

    return (
        <section className="lpeb-section">
            <div className="lpeb-section-head">
                <span className="lpeb-section-badge">📚 Exam Library</span>
                <h2 className="lpeb-section-title">Browse exams by grade</h2>
                <p className="lpeb-section-sub">
                    CBC-aligned assessments for every level — from Grade 1 to Grade 12.
                </p>
            </div>
            <div className="lpeb-grid">
                {GRADE_SECTIONS.map(section => (
                    <GradeRow
                        key={section.id}
                        section={section}
                        onCardClick={() => setOverlay('signup')}
                    />
                ))}
            </div>
            <div className="lpeb-unlock">
                <button className="lpeb-unlock-btn" onClick={() => setOverlay('signup')}>
                    <Zap size={16} /> Sign up to unlock all {exams.length} exams free
                </button>
            </div>
        </section>
    );
};
