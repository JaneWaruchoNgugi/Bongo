import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { subscribePublishedExams, type ExamMeta } from '../../lib/learn';
import { themeFor } from './subjectVisuals';
import { useActiveProfile } from './useProfile';

const ExamsList: React.FC = () => {
  const { profile } = useActiveProfile();
  const [exams, setExams] = useState<ExamMeta[]>([]);

  useEffect(() => {
    if (!profile) return;
    return subscribePublishedExams(profile.grade, setExams);
  }, [profile?.grade]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return null;

  return (
    <div className="lx-page">
      <header className="lx-page-head">
        <h1>Mock Exams</h1>
        <p>Grade {profile.grade} · timed practice papers. Do your best!</p>
      </header>

      {exams.length === 0 ? (
        <div className="ln-empty-card"><ClipboardList size={36} /><p>No mock exams published for Grade {profile.grade} yet.</p></div>
      ) : (
        <div className="lx-exam-grid">
          {exams.map((ex, i) => {
            const t = themeFor(i);
            return (
              <div key={ex.id} className="lx-exam" style={{ '--c': t.accent, '--c2': t.deep, '--soft': t.soft } as React.CSSProperties}>
                <div className="lx-exam-top">
                  <span className="lx-exam-ic"><ClipboardList size={18} /></span>
                  <strong>{ex.title}</strong>
                </div>
                <div className="lx-exam-meta">
                  <span>📋 {ex.questionCount ?? 0} Questions</span>
                  <span>⏱ {ex.durationMin ?? 0} min</span>
                  <span>⭐ {ex.difficulty ?? 'Medium'}</span>
                </div>
                <Link to={`/exams/${ex.id}`} className="lx-exam-cta">Start Exam</Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExamsList;
