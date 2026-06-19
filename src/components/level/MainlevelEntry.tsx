import {useState} from 'react';
import {useStore} from '../../store/useStore';
import {LowerPrimaryDashboard} from './LowerPrimaryDashboard';
import {MiddleSchoolDashboard} from './MiddleSchoolDashboard';
import {SeniorSchoolDashboard} from './SeniorSchoolDashboard';
import {TopicsView} from './TopicsView';
import {getTopicsForGrade, searchAllTopics} from './data/topicsData';
import type {SubjectTopics} from './data/topicsData';
import type {EducationLevel} from '../../store/useStore';
import type {Subject as MiddleSubject} from './MiddleSchool/types';
import Lvl4to9SubjectsView from './Subjects/lvl4-9sub/Lvl4to9SubjectsView';
import "../../styles/mainlvl.css"
import {TriangleBackground} from '../TriangleBackground';
import {
    BONGO_BOOKS,
    HOT_TOPICS_BG,
    HOT_TOPICS_BY_LEVEL,
    LEVEL_BANNER,
    LEVEL_SUBJECTS,
    SUBJECT_IMAGES
} from "./types/MainLevelData.ts";

export const MainLevelEntry = () => {
    const {user, setLevelSelection} = useStore();
    const [inExam, setInExam] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [topicsView, setTopicsView] = useState<SubjectTopics | null>(null);
    const [query, setQuery] = useState('');
    const [lvl4to9Subject, setLvl4to9Subject] = useState<string | null>(null);

    const activeProfile = user?.profiles.find(p => p.id === user.activeProfileId);
    const level: EducationLevel = activeProfile?.educationLevel ?? 'middle_school';
    const grade = activeProfile?.grade ?? 5;
    const subjects = LEVEL_SUBJECTS[level];
    const browseTopics = subjects.map(sub => {
        // find topics for this subject in the grade's data, or nearest grade
        const gradeData = getTopicsForGrade(level, grade);
        const found = gradeData.find(st => st.subject === sub.name);
        if (found) return { subject: sub.name, topics: found.topics };
        // fallback: search other grades in same level for this subject
        for (let g = 1; g <= 12; g++) {
            const fallback = getTopicsForGrade(level, g).find(st => st.subject === sub.name);
            if (fallback) return { subject: sub.name, topics: fallback.topics };
        }
        return { subject: sub.name, topics: [] };
    });
    const searchResults = searchAllTopics(query, level, grade);
    const myResults = searchResults.filter(r => !r.isOtherGrade);
    const otherResults = searchResults.filter(r => r.isOtherGrade);

    if (inExam) {
        return (
            <div>
                <button className="mle-back-btn" onClick={() => { setInExam(false); setSelectedSubject(null); }}>
                    ← Back to Home
                </button>
                {level === 'lower_primary' && <LowerPrimaryDashboard initialSubject={selectedSubject as string } />}
                {level === 'middle_school' && <MiddleSchoolDashboard initialSubject={selectedSubject as MiddleSubject} />}
                {level === 'senior_school' && <SeniorSchoolDashboard initialSubject={selectedSubject as string } />}
            </div>
        );
    }

    if (topicsView) {
        return <TopicsView subjectData={topicsView} onBack={() => setTopicsView(null)} />;
    }

    if (lvl4to9Subject !== null) {
        return (
            <Lvl4to9SubjectsView
                grade={grade}
                initialSubjectTitle={lvl4to9Subject}
                onBack={() => setLvl4to9Subject(null)}
            />
        );
    }

    return (
        <>
        <TriangleBackground />
        <div className="Main-lvl-Container">
            <div className="Main-lvl-Container-section">
                {/* ── Search ── */}
                <div className="mle-search-overlay-wrap">
                    <div className="mle-search-wrap">
                        {/*<span className="mle-search-icon">🔍</span>*/}
                        <input
                            className="mle-search-input"
                            placeholder="Search subjects or topics…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        {query
                            ? <button className="mle-search-clear" onClick={() => setQuery('')}>✕</button>
                            : <button className="mle-search-btn" aria-label="Search">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                              </button>
                        }
                    </div>

                    {/* ── Search Results ── */}
                    {query.trim() && (
                        <section className="mle-search-results">
                            {myResults.length === 0 && otherResults.length === 0 && (
                                <p className="mle-no-results">No results for "{query}"</p>
                            )}
                            {myResults.length > 0 && (
                                <>
                                    <p className="mle-results-label">Your Grade</p>
                                    {myResults.map((r, i) => (
                                        <div key={i} className="mle-result-row">
                                            <span className="mle-result-emoji">{r.topic.emoji}</span>
                                            <div className="mle-result-text">
                                                <span className="mle-result-title">{r.topic.title}</span>
                                                <span className="mle-result-meta">{r.subject} · {r.topic.desc}</span>
                                            </div>
                                            <span className="mle-result-arrow">›</span>
                                        </div>
                                    ))}
                                </>
                            )}
                            {otherResults.length > 0 && (
                                <>
                                    <p className="mle-results-label mle-results-label--other">Other Grades</p>
                                    {otherResults.map((r, i) => (
                                        <div key={i} className="mle-result-row mle-result-row--other">
                                            <span className="mle-result-emoji">{r.topic.emoji}</span>
                                            <div className="mle-result-text">
                                                <span className="mle-result-title">{r.topic.title}</span>
                                                <span className="mle-result-meta">{r.subject} · Grade {r.grade} · {r.topic.desc}</span>
                                            </div>
                                            <span className="mle-result-arrow">›</span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </section>
                    )}
                </div>
                <div className="mle-top-row">
                {/* ── Streak / XP strip ── */}
                {/*<div className="mle-xp-strip reveal">*/}
                {/*    <div className="mle-xp-streak">*/}
                {/*        <span className="mle-xp-fire">🔥</span>*/}
                {/*        <span className="mle-xp-streak-val">{activeProfile?.streak ?? 0}</span>*/}
                {/*        <span className="mle-xp-streak-lbl">Day Streak</span>*/}
                {/*    </div>*/}
                {/*    <div className="mle-xp-center">*/}
                {/*        <p className="mle-xp-msg">Keep going! You're doing great!</p>*/}
                {/*        <div className="mle-xp-bar-track">*/}
                {/*            <div className="mle-xp-bar-fill" style={{ width: `${Math.min(((activeProfile?.xp ?? 0) % 1000) / 10, 100)}%` }} />*/}
                {/*        </div>*/}
                {/*        <span className="mle-xp-label">{(activeProfile?.xp ?? 0) % 1000} / 1000 XP</span>*/}
                {/*    </div>*/}
                {/*    <div className="mle-xp-badges">*/}
                {/*        <span className="mle-xp-trophy">🏆</span>*/}
                {/*        <span className="mle-xp-badge-val">2</span>*/}
                {/*        <span className="mle-xp-badge-lbl">Badges</span>*/}
                {/*    </div>*/}
                {/*</div>*/}

                {/* ── Continue Learning ── */}
                <div className="mle-continue-card reveal">
                    <div className="mle-continue-header">
                        <span className="mle-continue-title">Continue Learning</span>
                        <button className="mle-continue-view-all" onClick={() => {}}>View all ›</button>
                    </div>
                    <div className="mle-continue-body">
                        <div className="mle-continue-thumb">📐</div>
                        <div className="mle-continue-info">
                            <span className="mle-continue-topic">Fractions &amp; Decimals</span>
                            <span className="mle-continue-meta">Mathematics · Grade {activeProfile?.grade ?? grade}</span>
                            <div className="mle-continue-bar-wrap">
                                <div className="mle-continue-bar-track">
                                    <div className="mle-continue-bar-fill" style={{ width: '60%' }} />
                                </div>
                                <span className="mle-continue-pct">60% complete</span>
                            </div>
                        </div>
                        <button className="mle-continue-resume" onClick={() => setInExam(true)}>▶ Resume</button>
                    </div>
                </div>

                </div>{/* end mle-top-row */}

                {/* ── Hot Topics ── */}
                <section className="hot-topics-container reveal">
                    <h2 className="mle-section-heading">🔥 Hot Topics This Week</h2>
                    <div className="main-lvl-hot-topics-container">
                        <div className="hot-topics-track">
                            {HOT_TOPICS_BY_LEVEL[level].map((t, i) => (
                                <div className="hot-topics-div" key={`${t.title}-${i}`}
                                    style={{
                                        backgroundImage: `url(${HOT_TOPICS_BG[level]})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    } as React.CSSProperties}>
                                    <span className="hot-topic-emoji">{t.emoji}</span>
                                    <span className="hot-topic-tag">{t.tag}</span>
                                    <p className="hot-topic-title">{t.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Browse by Subject ── */}
                <section className="mle-browse-section reveal">
                    <h2 className="mle-section-heading">📖 Browse by Subject</h2>
                    <div className="mle-browse-grid">
                        {browseTopics.map((st, i) => {
                            const meta = subjects.find(s => s.name === st.subject);
                            return (
                                <button
                                    key={st.subject}
                                    className="mle-browse-card"
                                    style={{'--card-grad': meta?.grad ?? 'linear-gradient(135deg,#6366f1,#5fae84)', animationDelay: `${i * 0.05}s`} as React.CSSProperties}
                                    onClick={() => {
                                        if (level === 'middle_school' && grade >= 4 && grade <= 9) {
                                            setLvl4to9Subject(st.subject);
                                        } else {
                                            setTopicsView(st);
                                        }
                                    }}
                                >
                                    <span className="mle-browse-card-icon">{meta?.icon ?? '📚'}</span>
                                    <span className="mle-browse-card-name">{st.subject}</span>
                                    <span className="mle-browse-card-desc">{meta?.desc ?? ''}</span>
                                    <div className="mle-browse-card-progress">
                                        <div className="mle-browse-card-progress-fill" style={{ width: `${[60,40,75,50,30,45,80][i % 7]}%` }} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ── Revision ── */}
                <section className="mle-revision-section reveal">
                    <div className="mle-section-row">
                        <h2 className="mle-section-heading">📚 Revision</h2>
                        <button className="mle-see-all">See all ›</button>
                    </div>
                    <div className="mle-revision-grid">
                        {browseTopics.map((st, i) => {
                            const meta = subjects.find(s => s.name === st.subject);
                            const img = SUBJECT_IMAGES[level]?.[st.subject];
                            const mockProgress = [60, 40, 75, 50, 30, 45, 80][i % 7];
                            const handleRevisionClick = () => {
                                if (level === 'middle_school') {
                                    const schoolLevel = grade <= 6 ? 'Upper Primary' : 'Junior Secondary School';
                                    setLevelSelection('middle_school', { level: schoolLevel, className: `Grade ${grade}` as any });
                                } else if (level === 'senior_school') {
                                    setLevelSelection('senior_school', { grade: String(grade) as any });
                                } else {
                                    setLevelSelection('lower_primary', { grade });
                                }
                                setSelectedSubject(st.subject);
                                setInExam(true);
                            };
                            return (
                                <div key={st.subject} className="mle-revision-item" onClick={handleRevisionClick}
                                    style={{ animationDelay: `${i * 0.06}s` }}>
                                    <div className="mle-subject-card"
                                        style={{'--grad': meta?.grad} as React.CSSProperties}>
                                        {img
                                            ? <img src={img} alt={st.subject} className="mle-card-poster" />
                                            : <span className="mle-card-icon">{meta?.icon ?? '📚'}</span>
                                        }
                                    </div>
                                    <div className="mle-revision-progress">
                                        <div className="mle-rev-bar-track">
                                            <div className="mle-rev-bar-fill" style={{ width: `${mockProgress}%` }} />
                                        </div>
                                        <span className="mle-rev-pct">{mockProgress}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── Bongo Books ── */}
                <section className="mle-books-section reveal">
                    <h2 className="mle-section-heading">📗 Bongo Books</h2>
                    <div className="mle-books-grid">
                        {BONGO_BOOKS[level].map((book, i) => (
                            <div key={book.title} className="mle-book-card"
                                style={{'--book-color': book.color, '--book-spine': book.spine, animationDelay: `${i * 0.07}s`} as React.CSSProperties}>
                                <div className="mle-book-spine" />
                                <div className="mle-book-cover">
                                    <div className="mle-book-cover-band" />
                                    <span className="mle-book-subject">{book.subject}</span>
                                    <span className="mle-book-title">{book.title}</span>
                                    <span className="mle-book-grade">{book.grade}</span>
                                    <span className="mle-book-logo">GradeUp</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Level Banner ── */}
                <section className="mle-level-banner reveal"
                    style={{'--banner-grad': LEVEL_BANNER[level].grad} as React.CSSProperties}>
                    <span className="mle-banner-emoji">{LEVEL_BANNER[level].emoji}</span>
                    <div>
                        <p className="mle-banner-title">{LEVEL_BANNER[level].title}</p>
                        <p className="mle-banner-desc">{LEVEL_BANNER[level].desc}</p>
                    </div>
                </section>

            </div>
        </div>
        </>
    );
};
