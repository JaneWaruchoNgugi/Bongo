import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, RotateCcw } from 'lucide-react';
import {
  subscribeRevisionAttempts,
  subscribeSubjectsByGrade,
  type RevisionAttempt,
  type Subject,
} from '../../lib/learn';
import { iconFor, themeFor } from './subjectVisuals';
import { useActiveProfile } from './useProfile';

const RevisionPage: React.FC = () => {
  const { accountId, profile } = useActiveProfile();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attempts, setAttempts] = useState<Record<string, RevisionAttempt>>({});

  useEffect(() => {
    if (!profile) return;
    return subscribeSubjectsByGrade(profile.grade, setSubjects);
  }, [profile?.grade]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!accountId || !profile) return;
    return subscribeRevisionAttempts(accountId, profile.id, setAttempts);
  }, [accountId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return null;

  return (
    <div className="lx-page">
      <header className="lx-page-head">
        <h1>Revision</h1>
        <p>Sit a full revision paper drawn from every topic in a subject. One hour, all the questions.</p>
      </header>

      {subjects.length === 0 ? (
        <div className="ln-empty-card"><BookOpen size={36} /><p>No subjects published for Grade {profile.grade} yet.</p></div>
      ) : (
        <div className="lx-subject-row">
          {subjects.map((s, i) => {
            const t = themeFor(i);
            const Icon = iconFor(s.name);
            const attempt = attempts[s.id];
            const pct = attempt ? Math.round((attempt.score / Math.max(1, attempt.total)) * 100) : 0;
            return (
              <div key={s.id} className="lx-subject" style={{ '--c': t.accent, '--c2': t.deep, '--soft': t.soft } as React.CSSProperties}>
                <div className="lx-subject-top">
                  <span className="lx-subject-ic"><Icon size={20} strokeWidth={2.2} /></span>
                  <strong>{s.name}</strong>
                </div>
                <span className="lx-subject-meta">{attempt ? `Best ${attempt.score}/${attempt.total}` : 'Not attempted yet'}</span>
                <div className="ln-card-progress"><span style={{ width: `${pct}%` }} /></div>
                <span className="lx-subject-meta lx-muted">{pct}%</span>
                <div className="lx-rev-actions">
                  <Link to={`/revision/${s.id}`} state={{ subjectName: s.name }} className="lx-subject-cta">
                    <RotateCcw size={15} /> {attempt ? 'Retake' : 'Start Revision'}
                  </Link>
                  {attempt && (
                    <Link to={`/revision/${s.id}/review`} className="lx-rev-review-link">Review <ChevronRight size={14} /></Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RevisionPage;
