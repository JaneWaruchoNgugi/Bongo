import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, GraduationCap, LogOut } from 'lucide-react';
import { subscribeTopics, type Topic } from '../../lib/learn';
import '../../styles/learn.css';

const BookReader: React.FC = () => {
  const { subjectId = '' } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [page, setPage] = useState(0);          // 0 = contents, 1..n = chapters
  const [dir, setDir] = useState<'next' | 'prev'>('next');

  useEffect(() => subscribeTopics(subjectId, setTopics), [subjectId]);

  const subjectName = topics[0]?.subject ?? 'Book';
  const gradeLabel = topics[0] ? `Grade ${String(topics[0].grade).replace(/\D/g, '')}` : '';
  const lastPage = topics.length; // contents (0) + n chapters → last index = topics.length

  const go = (target: number) => {
    const clamped = Math.max(0, Math.min(lastPage, target));
    if (clamped === page) return;
    setDir(clamped > page ? 'next' : 'prev');
    setPage(clamped);
  };

  // Keyboard page turning.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(page + 1);
      if (e.key === 'ArrowLeft') go(page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, lastPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const chapter = page > 0 ? topics[page - 1] : null;

  return (
    <div className="bk-wrap">
      <div className="bk-header">
        <div className="bk-bar">
          <button className="toc-back" onClick={() => navigate('/books')}><ArrowLeft size={18} /> Back</button>
          <h1 className="toc-subject">{subjectName}</h1>
          <span className="toc-bar-spacer" />
        </div>
        {gradeLabel && <div className="toc-grade-pill">{gradeLabel}</div>}
      </div>

      <div className="bk-stage">
        <button className="bk-arrow bk-arrow-prev" onClick={() => go(page - 1)} disabled={page === 0} aria-label="Previous page">
          <ChevronLeft size={22} />
        </button>

        <div className="bk-frame">
          <div key={page} className={`bk-page bk-page--${dir}`}>
            <div className="bk-page-inner">
              {page === 0 ? (
                <>
                  <h2 className="toc-title">TABLE OF CONTENTS</h2>
                  <div className="toc-rule" />
                  {topics.length === 0 ? (
                    <p className="ln-empty">This book has no chapters yet.</p>
                  ) : (
                    <ol className="toc-list">
                      {topics.map((t, i) => (
                        <li key={t.id} className="toc-item">
                          <button className="toc-item-link bk-toc-link" onClick={() => go(i + 1)}>
                            <span className="toc-num">{i + 1}.</span>
                            <span className="toc-item-main">
                              <span className="toc-item-title">{t.title}</span>
                              {t.objective && <span className="toc-item-desc">{t.objective}</span>}
                            </span>
                            <span className="toc-leader" />
                            <span className="toc-score">Read</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </>
              ) : chapter ? (
                <>
                  <p className="book-chapter-eyebrow">Chapter {page}</p>
                  <h2 className="book-chapter-title">{chapter.title}</h2>
                  {chapter.objective && <p className="book-chapter-objective">{chapter.objective}</p>}
                  <div className="lx-lesson-body">
                    {(chapter.description ?? '').trim()
                      ? (chapter.description ?? '').split(/\n{2,}/).map((para, p) => <p key={p}>{para}</p>)
                      : <p className="ln-muted">Notes for this chapter are coming soon.</p>}
                  </div>
                  {chapter.summary && (
                    <div className="lx-studynote">
                      <div className="lx-studynote-head"><BookOpen size={18} /> Study Note</div>
                      {chapter.summary.split(/\n+/).map((line, l) => <p key={l}>{line}</p>)}
                    </div>
                  )}

                  {page === lastPage && (
                    <div className="bk-end">
                      <span className="bk-end-emoji">🎉</span>
                      <h3>You&apos;ve reached the end of {subjectName}!</h3>
                      <p>Great work reading through every chapter. Ready to test what you&apos;ve learned?</p>
                      <div className="bk-end-actions">
                        <button className="ln-btn" onClick={() => navigate('/books')}>
                          <LogOut size={16} /> Exit
                        </button>
                        <button
                          className="ln-btn ln-btn-primary"
                          onClick={() => navigate(`/revision/${subjectId}`, { state: { subjectName } })}
                        >
                          <GraduationCap size={16} /> Take the {subjectName} Exam
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
            <span className="bk-page-no">{page === 0 ? 'Contents' : `Page ${page} of ${lastPage}`}</span>
          </div>
        </div>

        <button className="bk-arrow bk-arrow-next" onClick={() => go(page + 1)} disabled={page === lastPage} aria-label="Next page">
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="bk-controls">
        <button className="ln-btn" onClick={() => go(page - 1)} disabled={page === 0}><ChevronLeft size={16} /> Previous</button>
        <span className="bk-dots">
          {Array.from({ length: lastPage + 1 }).map((_, i) => (
            <span key={i} className={`bk-dot${i === page ? ' on' : ''}`} onClick={() => go(i)} />
          ))}
        </span>
        <button className="ln-btn ln-btn-primary" onClick={() => go(page + 1)} disabled={page === lastPage}>Next <ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

export default BookReader;
