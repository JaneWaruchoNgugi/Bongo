import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, Download, GraduationCap } from 'lucide-react';
import { subscribeSubjectsByGrade, type Subject } from '../../lib/learn';
import { iconFor, PALETTE, themeFor } from './subjectVisuals';
import { useActiveProfile } from './useProfile';

const BooksPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useActiveProfile();
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (!profile) return;
    return subscribeSubjectsByGrade(profile.grade, setSubjects);
  }, [profile?.grade]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return null;

  return (
    <div className="lx-page">
      <header className="lx-page-head">
        <h1>HighScores Books</h1>
        <p>Read, explore and learn with our easy-to-use books.</p>
      </header>

      <div className="ln-book-row">
        {subjects.map((s, i) => {
          const t = themeFor(i);
          const Icon = iconFor(s.name);
          return (
            <div key={s.id} className="ln-book" style={{ '--c': t.accent, '--c2': t.deep } as React.CSSProperties}>
              <div className="ln-book-cover">
                <span className="ln-book-emoji"><Icon size={26} strokeWidth={2.2} /></span>
                <span className="ln-book-title">{s.name}</span>
                <span className="ln-book-grade">Grade {profile.grade}</span>
              </div>
              <Link to={`/book/${s.id}`} className="ln-book-cta"><BookOpen size={15} /> Read Book</Link>
            </div>
          );
        })}

        <div className="ln-book" style={{ '--c': PALETTE[5].accent, '--c2': PALETTE[5].deep } as React.CSSProperties}>
          <div className="ln-book-cover">
            <span className="ln-book-emoji"><GraduationCap size={26} strokeWidth={2.2} /></span>
            <span className="ln-book-title">Teacher&apos;s Guide</span>
            <span className="ln-book-grade">Grade {profile.grade}</span>
          </div>
          <button className="ln-book-cta" onClick={() => navigate('/subjects')}><Download size={15} /> Download</button>
        </div>

        <div className="ln-book" style={{ '--c': PALETTE[6].accent, '--c2': PALETTE[6].deep } as React.CSSProperties}>
          <div className="ln-book-cover">
            <span className="ln-book-emoji"><ClipboardList size={26} strokeWidth={2.2} /></span>
            <span className="ln-book-title">Revision &amp; Practice</span>
            <span className="ln-book-grade">Grade {profile.grade}</span>
          </div>
          <button className="ln-book-cta" onClick={() => navigate('/exams')}><Download size={15} /> Download</button>
        </div>
      </div>
    </div>
  );
};

export default BooksPage;
