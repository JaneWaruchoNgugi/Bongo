import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Brain } from 'lucide-react';
import { getTopic, recordActivity, type Topic } from '../../lib/learn';
import { useActiveProfile } from './useProfile';
import '../../styles/learn.css';

const TopicLesson: React.FC = () => {
  const { topicId = '' } = useParams();
  const navigate = useNavigate();
  const { accountId, profile } = useActiveProfile();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopic(topicId).then(t => { setTopic(t); setLoading(false); });
  }, [topicId]);

  // Track recency + daily streak when a lesson is opened (no XP, to avoid farming).
  useEffect(() => {
    if (!topic || !accountId || !profile) return;
    recordActivity(accountId, profile.id, {
      recent: { subjectId: topic.subjectId, subjectName: topic.subject, topicId: topic.id, topicTitle: topic.title, at: Date.now() },
    }).catch(() => {});
  }, [topic?.id, accountId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="ln-page ln-center"><p>Loading…</p></div>;
  if (!topic) return <div className="ln-page ln-center"><p>Topic not found.</p></div>;

  const hasTest = (topic.questionCount ?? 0) > 0;

  return (
    <div className="lx-lesson-wrap">
      <button className="ln-back" onClick={() => navigate(`/learn/subject/${topic.subjectId}`)}>
        <ArrowLeft size={16} /> {topic.subject}
      </button>

      <article className="lx-lesson">
        <h1>{topic.title}</h1>
        {topic.objective && <p className="lx-lesson-objective">{topic.objective}</p>}

        <div className="lx-lesson-body">
          {(topic.description ?? '').split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
        </div>

        <div className="lx-studynote">
          <div className="lx-studynote-head"><BookOpen size={18} /> Study Note</div>
          {topic.summary
            ? topic.summary.split(/\n+/).map((line, i) => <p key={i}>{line}</p>)
            : <p>Read the text above carefully. All the questions in the revision quiz are directly based on the facts provided in these notes.</p>}
        </div>
      </article>

      <div className="lx-lesson-foot">
        {hasTest ? (
          <button className="lx-revquiz-btn" onClick={() => navigate(`/learn/topic/${topic.id}/test`)}>
            <Brain size={18} /> Take Revision Quiz
          </button>
        ) : (
          <p className="ln-muted">No quiz for this topic yet.</p>
        )}
      </div>
    </div>
  );
};

export default TopicLesson;
