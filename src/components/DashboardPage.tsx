import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, type StudentProfile } from '../store/useStore';
import {
     Target, Zap, CheckCircle, ArrowLeft, ChevronRight,
    BarChart3, Users,  Star, TrendingUp,
    Flame, Award,
} from 'lucide-react';
import '../styles/dashboard.css';
import { avatarUrl } from '../hooks/Packages.ts';

/* SHARED CONSTANTS */
const LEVEL_META: Record<string, { label: string; grades: string; emoji: string; color: string }> = {
    lower_primary: { label: 'Lower Primary', grades: 'Grade 1–3',   emoji: '🧒', color: '#10b981' },
    middle_school:  { label: 'Middle School',  grades: 'Grade 4–9',   emoji: '🧠', color: '#3b82f6' },
    senior_school:  { label: 'Senior School',  grades: 'Grade 10–12', emoji: '🎓', color: '#2f9e6a' },
};
//
// const LEVEL_ROUTE: Record<string, string> = {
//     lower_primary: '/level/lower-primary',
//     middle_school: '/level/middle-school',
//     senior_school: '/level/senior-school',
// };

/** Deterministic "subject performance" derived from profile data so it's stable per profile */
const getSubjectScores = (profile: StudentProfile) => {
    const seed = profile.username.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const subjectMap: Record<string, string[]> = {
        lower_primary: ['Mathematics', 'English', 'Kiswahili'],
        middle_school: ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies'],
        senior_school: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'],
    };
    const emojis: Record<string, string> = {
        Mathematics: '🧮', English: '📖', Kiswahili: '🗣️',
        Science: '🔬', 'Social Studies': '🌍', Physics: '⚡',
        Chemistry: '⚗️', Biology: '🧬',
    };
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];
    return (subjectMap[profile.educationLevel] ?? subjectMap.middle_school).map((name, i) => ({
        name,
        emoji: emojis[name] ?? '📚',
        score: Math.min(97, Math.max(42, 52 + ((seed * (i + 3)) % 43))),
        color: colors[i % colors.length],
    }));
};

/* STUDENT DETAIL VIEW */
const StudentDetail: React.FC<{
    profile: StudentProfile;
    onBack: () => void;
}> = ({ profile, onBack }) => {
    const levelMeta = LEVEL_META[profile.educationLevel];
    const subjects = getSubjectScores(profile);
    const xpProgress = Math.min(100, ((profile.xp % 500) / 500) * 100);
    const avgScore = Math.round(subjects.reduce((a, s) => a + s.score, 0) / subjects.length);

    return (
        <div className="db-root">
            <div className="db-header">
                <button className="db-back" onClick={onBack}>
                    <ArrowLeft size={18} /> All Profiles
                </button>
                <div>
                    <h1><img src={avatarUrl(profile.avatar)} alt="avatar" width={32} height={32} style={{borderRadius:'50%',verticalAlign:'middle',marginRight:'0.4rem'}} />{profile.username}</h1>
                    <p>
                        <span style={{ color: levelMeta.color, fontWeight: 600 }}>
                            {levelMeta.emoji} {levelMeta.label}
                        </span>
                        &nbsp;·&nbsp;{levelMeta.grades}
                    </p>
                </div>
            </div>

            <div className="db-stats-grid">
                {[
                    { icon: Target, color: '#2f9e6a', bg: '#eef7f1', val: `${avgScore}%`,        lbl: 'Avg Score' },
                    { icon: Zap,    color: '#10b981', bg: '#f0fdf4', val: `${profile.xp} XP`,    lbl: 'Total XP' },
                    { icon: Flame,  color: '#ef4444', bg: '#fef2f2', val: `${profile.streak}d`,  lbl: 'Streak' },
                    { icon: Award,  color: '#f59e0b', bg: '#fffbeb', val: `Lv. ${profile.level}`, lbl: 'Level' },
                ].map(({ icon: Icon, color, bg, val, lbl }) => (
                    <div key={lbl} className="db-stat-card">
                        <div className="db-stat-icon" style={{ background: bg }}><Icon size={22} color={color} /></div>
                        <div><span className="db-stat-val">{val}</span><span className="db-stat-lbl">{lbl}</span></div>
                    </div>
                ))}
            </div>

            <div className="db-chart-card" style={{ marginBottom: '1.5rem' }}>
                <div className="db-card-header">
                    <h2><Star size={16} /> Level Progress</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {profile.xp % 500} / 500 XP to next level
                    </span>
                </div>
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                    <div style={{ height: 12, background: '#f0fdf4', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', width: `${xpProgress}%`,
                            background: 'linear-gradient(90deg, #10b981, #059669)',
                            borderRadius: 999, transition: 'width 0.8s ease',
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        <span>Level {profile.level}</span>
                        <span>Level {profile.level + 1}</span>
                    </div>
                </div>
            </div>

            <div className="db-subjects-header">
                <h2>Subject Performance</h2>
                <p>Estimated based on quiz activity</p>
            </div>
            <div className="db-subjects-grid">
                {subjects.map(s => (
                    <div key={s.name} className="db-subject-card">
                        <div className="db-subject-top">
                            <div className="db-subject-icon" style={{ background: `${s.color}18` }}>
                                <span style={{ fontSize: '1.5rem' }}>{s.emoji}</span>
                            </div>
                            <div className="db-subject-title">
                                <h3>{s.name}</h3>
                                <span className="db-subject-score" style={{ background: s.color }}>{s.score}%</span>
                            </div>
                        </div>
                        <div className="db-subject-progress">
                            <div className="db-progress-row"><span>Score</span><span>{s.score}%</span></div>
                            <div className="db-progress-track">
                                <div className="db-progress-fill" style={{ width: `${s.score}%`, background: s.color }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* PROFILE CARD  (grid card in multi-profile dashboard) */
const ProfileCard: React.FC<{
    profile: StudentProfile;
    onSelect: (p: StudentProfile) => void;
}> = ({ profile, onSelect }) => {
    const meta = LEVEL_META[profile.educationLevel];
    const subjects = getSubjectScores(profile);
    const avgScore = Math.round(subjects.reduce((a, s) => a + s.score, 0) / subjects.length);
    const xpProgress = Math.min(100, ((profile.xp % 500) / 500) * 100);

    return (
        <div className="db-subject-card" style={{ cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s' }}
            onClick={() => onSelect(profile)}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1rem' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={avatarUrl(profile.avatar)} alt="avatar" width={44} height={44} style={{borderRadius:'50%'}} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{profile.username}</h3>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: 999, background: `${meta.color}18`, color: meta.color, marginTop: '0.2rem' }}>
                        {meta.emoji} {meta.label}
                    </span>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                    { icon: '⚡', val: profile.xp,   lbl: 'XP' },
                    { icon: '🏅', val: `Lv.${profile.level}`, lbl: 'Level' },
                    { icon: '🔥', val: `${profile.streak}d`, lbl: 'Streak' },
                ].map(stat => (
                    <div key={stat.lbl} style={{ textAlign: 'center', padding: '0.5rem 0.3rem', background: 'var(--bg-soft)', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ fontSize: '1rem' }}>{stat.icon}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>{stat.val}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{stat.lbl}</div>
                    </div>
                ))}
            </div>
            <div className="db-subject-progress" style={{ marginBottom: '0.9rem' }}>
                <div className="db-progress-row"><span>Avg Score</span><span style={{ color: meta.color, fontWeight: 700 }}>{avgScore}%</span></div>
                <div className="db-progress-track"><div className="db-progress-fill" style={{ width: `${avgScore}%`, background: meta.color }} /></div>
            </div>
            <div className="db-subject-progress" style={{ marginBottom: '1rem' }}>
                <div className="db-progress-row"><span>XP to next level</span><span>{profile.xp % 500}/500</span></div>
                <div className="db-progress-track"><div className="db-progress-fill" style={{ width: `${xpProgress}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }} /></div>
            </div>
            <button className="db-view-btn" style={{ color: meta.color }}>View Analytics <ChevronRight size={16} /></button>
        </div>
    );
};


/* STUDENT DASHBOARD  (single active profile) */
const SUBJECT_MOCK = [
    { id: 'math',      subject: 'Mathematics',    score: 85, progress: 75, color: '#10b981', emoji: '🧮', quizzes: 24, timeSpent: '8.5 hrs', lastActive: '2 hours ago' },
    { id: 'english',   subject: 'English',        score: 78, progress: 70, color: '#3b82f6', emoji: '📖', quizzes: 18, timeSpent: '6.2 hrs', lastActive: 'Yesterday' },
    { id: 'kiswahili', subject: 'Kiswahili',      score: 82, progress: 65, color: '#8b5cf6', emoji: '🗣️', quizzes: 15, timeSpent: '5.0 hrs', lastActive: '2 days ago' },
    { id: 'science',   subject: 'Science',        score: 71, progress: 60, color: '#f59e0b', emoji: '🔬', quizzes: 12, timeSpent: '4.3 hrs', lastActive: '3 days ago' },
    { id: 'social',    subject: 'Social Studies', score: 88, progress: 80, color: '#ec4899', emoji: '🌍', quizzes: 20, timeSpent: '7.0 hrs', lastActive: '1 day ago' },
    { id: 'cre',       subject: 'CRE',            score: 92, progress: 85, color: '#14b8a6', emoji: '✝️', quizzes: 16, timeSpent: '5.5 hrs', lastActive: '5 hours ago' },
];

const WEEK_BARS = [70, 85, 60, 95, 75, 80, 65];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const StudentDashboard: React.FC<{ profile: StudentProfile }> = ({ profile }) => {
    const navigate = useNavigate();
    const avgScore = Math.round(SUBJECT_MOCK.reduce((a, s) => a + s.score, 0) / SUBJECT_MOCK.length);
    const totalQ   = SUBJECT_MOCK.reduce((a, s) => a + s.quizzes, 0);

    return (
        <div className="db-root">
            <div className="db-header">
                <button className="db-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div>
                    <h1><img src={avatarUrl(profile.avatar)} alt="avatar" width={32} height={32} style={{borderRadius:'50%',verticalAlign:'middle',marginRight:'0.4rem'}} />{profile.username}'s Dashboard</h1>
                    <p>
                        {LEVEL_META[profile.educationLevel]?.emoji}&nbsp;
                        {LEVEL_META[profile.educationLevel]?.label} · Track your progress across all subjects
                    </p>
                </div>
            </div>

            <div className="db-stats-grid">
                {[
                    { icon: Target,      color: '#2f9e6a', bg: '#eef7f1', val: `${avgScore}%`,        lbl: 'Avg Score' },
                    { icon: CheckCircle, color: '#10b981', bg: '#f0fdf4', val: totalQ,                lbl: 'Quizzes Taken' },
                    { icon: Flame,       color: '#ef4444', bg: '#fef2f2', val: `${profile.streak} days`, lbl: 'Streak' },
                    { icon: Zap,         color: '#8b5cf6', bg: '#eef7f1', val: `${profile.xp} XP`,    lbl: 'Total XP' },
                ].map(({ icon: Icon, color, bg, val, lbl }) => (
                    <div key={lbl} className="db-stat-card">
                        <div className="db-stat-icon" style={{ background: bg }}><Icon size={22} color={color} /></div>
                        <div><span className="db-stat-val">{val}</span><span className="db-stat-lbl">{lbl}</span></div>
                    </div>
                ))}
            </div>

            <div className="db-chart-card">
                <div className="db-card-header"><h2><BarChart3 size={18} /> Weekly Performance</h2></div>
                <div className="db-chart-bars">
                    {WEEK_BARS.map((h, i) => (
                        <div key={i} className="db-bar-col">
                            <div className="db-bar" style={{ height: `${h}%` }} />
                            <span>{DAYS[i]}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="db-subjects-header">
                <h2>Subject Breakdown</h2>
                <p>Detailed performance by subject</p>
            </div>
            <div className="db-subjects-grid">
                {SUBJECT_MOCK.map(s => (
                    <div key={s.id} className="db-subject-card" onClick={() => navigate('/games')}>
                        <div className="db-subject-top">
                            <div className="db-subject-icon" style={{ background: `${s.color}18` }}>
                                <span style={{ fontSize: '1.5rem' }}>{s.emoji}</span>
                            </div>
                            <div className="db-subject-title">
                                <h3>{s.subject}</h3>
                                <span className="db-subject-score" style={{ background: s.color }}>{s.score}%</span>
                            </div>
                        </div>
                        <div className="db-subject-progress">
                            <div className="db-progress-row"><span>Progress</span><span>{s.progress}%</span></div>
                            <div className="db-progress-track">
                                <div className="db-progress-fill" style={{ width: `${s.progress}%`, background: s.color }} />
                            </div>
                        </div>
                        <div className="db-subject-metrics">
                            {([['Quizzes', s.quizzes], ['Time', s.timeSpent], ['Last Active', s.lastActive]] as const).map(([k, v]) => (
                                <div key={k} className="db-metric">
                                    <span className="db-metric-lbl">{k}</span>
                                    <span className="db-metric-val">{v}</span>
                                </div>
                            ))}
                        </div>
                        <button className="db-view-btn" style={{ color: s.color }}>View Details <ChevronRight size={16} /></button>
                    </div>
                ))}
            </div>

            <div className="db-recs-header"><h2>Recommended for You</h2></div>
            <div className="db-recs-grid">
                {[
                    { emoji: '🧮', name: 'Algebra Fundamentals',  sub: 'Mathematics · 5 quizzes', color: '#10b981' },
                    { emoji: '📖', name: 'Reading Comprehension', sub: 'English.png · 3 quizzes',     color: '#3b82f6' },
                    { emoji: '🗣️', name: 'Ngeli za Kiswahili',     sub: 'Kiswahili · 4 quizzes',  color: '#8b5cf6' },
                ].map(r => (
                    <div key={r.name} className="db-rec-card" onClick={() => navigate('/games')}>
                        <div className="db-rec-icon" style={{ background: `${r.color}18` }}>
                            <span style={{ fontSize: '1.5rem' }}>{r.emoji}</span>
                        </div>
                        <div className="db-rec-info"><h4>{r.name}</h4><p>{r.sub}</p></div>
                        <button className="db-rec-btn" style={{ background: r.color }}>Start</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* MULTI-PROFILE DASHBOARD  (for trio/quad/family packages) */
const MultiProfileDashboard: React.FC<{ profiles: StudentProfile[] }> = ({ profiles }) => {
    const navigate = useNavigate();
    const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);

    if (selectedProfile) {
        return <StudentDetail profile={selectedProfile} onBack={() => setSelectedProfile(null)} />;
    }

    const totalXP = profiles.reduce((a, p) => a + p.xp, 0);
    const activeStreaks = profiles.filter(p => p.streak > 0).length;
    const avgLevel = profiles.length
        ? (profiles.reduce((a, p) => a + p.level, 0) / profiles.length).toFixed(1)
        : '—';

    return (
        <div className="db-root">
            <div className="db-header">
                <button className="db-back" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <div>
                    <h1>📊 Family Dashboard</h1>
                    <p>Tracking {profiles.length} student{profiles.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            <div className="db-stats-grid">
                {[
                    { icon: Users,      color: '#157347', bg: '#eef7f1', val: profiles.length,   lbl: 'Students' },
                    { icon: Zap,        color: '#10b981', bg: '#f0fdf4', val: totalXP,           lbl: 'Total XP' },
                    { icon: Flame,      color: '#ef4444', bg: '#fef2f2', val: activeStreaks,      lbl: 'Active Streaks' },
                    { icon: TrendingUp, color: '#f59e0b', bg: '#fffbeb', val: `Lv. ${avgLevel}`, lbl: 'Avg Level' },
                ].map(({ icon: Icon, color, bg, val, lbl }) => (
                    <div key={lbl} className="db-stat-card">
                        <div className="db-stat-icon" style={{ background: bg }}><Icon size={22} color={color} /></div>
                        <div><span className="db-stat-val">{val}</span><span className="db-stat-lbl">{lbl}</span></div>
                    </div>
                ))}
            </div>

            <div className="db-subjects-header">
                <h2>Student Profiles</h2>
                <p>Click a card to see full analytics</p>
            </div>
            <div className="db-subjects-grid">
                {profiles.map(p => (
                    <ProfileCard key={p.id} profile={p} onSelect={setSelectedProfile} />
                ))}
            </div>
        </div>
    );
};

/* ROOT */
const DashboardPage: React.FC = () => {
    const { user } = useStore();
    const navigate = useNavigate();

    if (!user) {
        return (
            <div className="db-root" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                <h2>Please log in to view your dashboard</h2>
                <button className="db-back" style={{ margin: '1rem auto', display: 'inline-flex' }} onClick={() => navigate('/')}>
                    <ArrowLeft size={18} /> Go Home
                </button>
            </div>
        );
    }

    const activeProfile = user.profiles.find(p => p.id === user.activeProfileId) ?? user.profiles[0];

    if (user.profiles.length > 1) {
        return <MultiProfileDashboard profiles={user.profiles} />;
    }

    return activeProfile ? <StudentDashboard profile={activeProfile} /> : null;
};

export default DashboardPage;