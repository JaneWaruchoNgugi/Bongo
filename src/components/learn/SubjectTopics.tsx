import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import {
  subscribeProgress,
  subscribeTopics,
  type ProgressDoc,
  type Topic,
} from '../../lib/learn';
import { useActiveProfile } from './useProfile';
import '../../styles/learn.css';

const SubjectTopics: React.FC = () => {
  const { subjectId = '' } = useParams();
  const navigate = useNavigate();
  const { accountId, profile } = useActiveProfile();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<ProgressDoc>({});

  useEffect(() => subscribeTopics(subjectId, setTopics), [subjectId]);
  useEffect(() => {
    if (!accountId || !profile) return;
    return subscribeProgress(accountId, profile.id, setProgress);
  }, [accountId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const subjectName = topics[0]?.subject ?? 'Subject';
  const gradeLabel = topics[0] ? `Grade ${String(topics[0].grade).replace(/\D/g, '')}` : '';
  const cleared = (tt: Topic) => progress.topics?.[tt.id]?.completed || (tt.questionCount ?? 0) === 0;

  return (
    <div className="toc-wrap">
      <div className="toc-bar">
        <button className="toc-back" onClick={() => navigate('/subjects')}><ArrowLeft size={18} /> Back</button>
        <h1 className="toc-subject">{subjectName}</h1>
        <span className="toc-bar-spacer" />
      </div>

      {gradeLabel && <div className="toc-grade-pill">{gradeLabel}</div>}

      <div className="toc-card">
        <h2 className="toc-title">TABLE OF CONTENTS</h2>
        <div className="toc-rule" />

        {topics.length === 0 ? (
          <p className="ln-empty">No topics published yet for this subject.</p>
        ) : (
          <ol className="toc-list">
            {topics.map((t, i) => {
              const p = progress.topics?.[t.id];
              const locked = i > 0 && !cleared(topics[i - 1]);
              const hasTest = (t.questionCount ?? 0) > 0;
              const right = p?.completed
                ? `${p.bestScore}/${p.total}`
                : hasTest ? `0/${t.questionCount}` : 'Lesson';

              const inner = (
                <>
                  <span className="toc-num">{i + 1}.</span>
                  <span className="toc-item-main">
                    <span className="toc-item-title">{t.title}</span>
                    {t.objective && <span className="toc-item-desc">{t.objective}</span>}
                  </span>
                  <span className="toc-leader" />
                  <span className={`toc-score ${p?.completed ? 'done' : ''}`}>
                    {locked ? <Lock size={15} /> : <>{right} {p?.completed && <CheckCircle2 size={16} />}</>}
                  </span>
                </>
              );

              return locked ? (
                <li key={t.id} className="toc-item is-locked" title={`Complete "${topics[i - 1].title}" first`}>{inner}</li>
              ) : (
                <li key={t.id} className="toc-item">
                  <Link to={`/learn/topic/${t.id}`} className="toc-item-link">{inner}</Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
};

export default SubjectTopics;
