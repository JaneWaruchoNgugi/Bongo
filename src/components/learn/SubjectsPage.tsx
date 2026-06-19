import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import {
  subscribeProgress,
  subscribeSubjectsByGrade,
  type ProgressDoc,
  type Subject,
} from '../../lib/learn';
import { iconFor, themeFor } from './subjectVisuals';
import { useActiveProfile } from './useProfile';

const SubjectsPage: React.FC = () => {
  const { accountId, profile } = useActiveProfile();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progress, setProgress] = useState<ProgressDoc>({});

  useEffect(() => {
    if (!profile) return;
    return subscribeSubjectsByGrade(profile.grade, setSubjects);
  }, [profile?.grade]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!accountId || !profile) return;
    return subscribeProgress(accountId, profile.id, setProgress);
  }, [accountId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const completedFor = (id: string) =>
    Object.values(progress.topics ?? {}).filter(t => t.subjectId === id && t.completed).length;

  if (!profile) return null;

  return (
    <div className="lx-page">
      <header className="lx-page-head">
        <h1>Subjects</h1>
        <p>Grade {profile.grade} · pick a subject to learn and improve.</p>
      </header>

      {subjects.length === 0 ? (
        <div className="ln-empty-card"><BookOpen size={36} /><p>No subjects published for Grade {profile.grade} yet.</p></div>
      ) : (
        <div className="ln-subject-grid">
          {subjects.map((s, i) => {
            const t = themeFor(i);
            const Icon = iconFor(s.name);
            const total = s.topicCount ?? 0;
            const done = completedFor(s.id);
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div key={s.id} className="ln-subject" style={{ '--c': t.accent, '--c2': t.deep, '--soft': t.soft } as React.CSSProperties}>
                <span className="ln-subject-ic"><Icon size={26} strokeWidth={2.2} /></span>
                <strong className="ln-subject-name">{s.name}</strong>
                <span className="ln-subject-count">{total} Topic{total === 1 ? '' : 's'}</span>
                <div className="ln-card-progress"><span style={{ width: `${pct}%` }} /></div>
                <span className="ln-subject-count">Progress {pct}%</span>
                <Link to={`/learn/subject/${s.id}`} className="ln-subject-cta">Start Learning <ChevronRight size={16} /></Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubjectsPage;
