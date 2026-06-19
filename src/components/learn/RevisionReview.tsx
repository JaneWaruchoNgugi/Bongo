import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle, RotateCcw, XCircle } from 'lucide-react';
import { getRevisionAttempt, type RevisionAttempt } from '../../lib/learn';
import { useActiveProfile } from './useProfile';

const RevisionReview: React.FC = () => {
  const { subjectId = '' } = useParams();
  const { accountId, profile } = useActiveProfile();
  const [attempt, setAttempt] = useState<RevisionAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId || !profile) return;
    getRevisionAttempt(accountId, profile.id, subjectId).then(a => { setAttempt(a); setLoading(false); });
  }, [accountId, profile?.id, subjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="ln-page ln-center"><p>Loading your results…</p></div>;
  if (!attempt) {
    return (
      <div className="lx-page">
        <header className="lx-page-head"><h1>Revision Review</h1><p>You haven&apos;t completed this revision yet.</p></header>
        <Link to={`/revision/${subjectId}`} className="ln-btn ln-btn-primary">Start revision</Link>
      </div>
    );
  }

  const pct = Math.round((attempt.score / Math.max(1, attempt.total)) * 100);

  // "What to work on": topics where the learner missed questions, with miss counts.
  const weak = new Map<string, number>();
  attempt.items.forEach(it => {
    if (it.chosenIndex !== it.correctIndex) {
      const key = it.topicTitle ?? 'General';
      weak.set(key, (weak.get(key) ?? 0) + 1);
    }
  });
  const weakList = [...weak.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="lx-page lx-review-page">
      <header className="lx-page-head">
        <h1>{attempt.subjectName ?? 'Revision'} — Review</h1>
        <p>Here is the full paper with your answers and the correct ones.</p>
      </header>

      <div className="lx-review-top">
        <div className={`ln-score-ring ${pct >= 50 ? 'pass' : 'fail'}`}>
          <strong>{pct}%</strong>
          <span>{attempt.score}/{attempt.total}</span>
        </div>

        <div className="lx-worklist">
          <h3><AlertTriangle size={16} /> What to work on</h3>
          {weakList.length === 0 ? (
            <p className="lx-muted">Brilliant — you got everything right! 🎉</p>
          ) : (
            <ul>
              {weakList.map(([topic, misses]) => (
                <li key={topic}><span>{topic}</span><em>{misses} to review</em></li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="ln-review lx-review-list">
        {attempt.items.map((it, i) => {
          const correct = it.chosenIndex === it.correctIndex;
          return (
            <div key={i} className={`ln-review-item ${correct ? 'ok' : 'bad'}`}>
              <p className="ln-review-q">{i + 1}. {it.q} {it.topicTitle && <span className="lx-review-topic">{it.topicTitle}</span>}</p>
              <ul>
                {it.options.map((o, oi) => (
                  <li key={oi} className={oi === it.correctIndex ? 'correct' : oi === it.chosenIndex ? 'wrong' : ''}>
                    {oi === it.correctIndex && <CheckCircle size={14} />}
                    {oi === it.chosenIndex && oi !== it.correctIndex && <XCircle size={14} />}
                    {o}
                  </li>
                ))}
              </ul>
              {it.chosenIndex === -1 && <p className="ln-review-exp">You did not answer this question.</p>}
            </div>
          );
        })}
      </div>

      <Link to={`/revision/${subjectId}`} className="ln-btn ln-btn-primary ln-btn-lg lx-retake">
        <RotateCcw size={18} /> Retake revision
      </Link>
    </div>
  );
};

export default RevisionReview;
