import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  getTopic,
  getTopicQuestions,
  recordActivity,
  saveTopicProgress,
  submitScore,
  subscribeProgress,
  type ProgressDoc,
  type QuizQuestion,
  type Topic,
} from '../../lib/learn';
import { XP } from '../../lib/gamification';
import { bumpChallenge } from '../../lib/challenges';
import { useActiveProfile } from './useProfile';
import QuizRunner from './QuizRunner';
import '../../styles/learn.css';

const TopicTest: React.FC = () => {
  const { topicId = '' } = useParams();
  const navigate = useNavigate();
  const { accountId, profile } = useActiveProfile();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const progressRef = useRef<ProgressDoc>({});

  useEffect(() => {
    Promise.all([getTopic(topicId), getTopicQuestions(topicId)]).then(([t, qs]) => {
      setTopic(t); setQuestions(qs); setLoading(false);
    });
  }, [topicId]);

  useEffect(() => {
    if (!accountId || !profile) return;
    return subscribeProgress(accountId, profile.id, d => { progressRef.current = d; });
  }, [accountId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDone = async (score: number, total: number) => {
    if (topic && accountId && profile) {
      const prev = progressRef.current.topics?.[topic.id];
      const firstClear = !prev?.completed;
      await saveTopicProgress(accountId, profile.id, topic.id, {
        score, total, subjectId: topic.subjectId, prevBest: prev?.bestScore, prevAttempts: prev?.attempts,
      }).catch(() => {});
      // Award XP (full marks earns a bonus) + advance streak/recency, only on first clear.
      const xp = firstClear ? XP.completeTopic + (score >= total ? XP.perfectTopic : 0) : 0;
      await recordActivity(accountId, profile.id, {
        xp,
        recent: { subjectId: topic.subjectId, subjectName: topic.subject, topicId: topic.id, topicTitle: topic.title, at: Date.now() },
      }).catch(() => {});
      await bumpChallenge(accountId, profile.id, score).catch(() => {});
      await submitScore({
        player: profile.username,
        game: `Topic: ${topic.title}`,
        grade: `Grade ${profile.grade}`,
        score,
        points: score * 10,
        profileId: profile.id,
      }).catch(() => {});
      navigate(`/learn/subject/${topic.subjectId}`);
    } else {
      navigate('/learn');
    }
  };

  if (loading) return <div className="ln-page ln-center"><p>Loading test…</p></div>;
  if (!topic) return <div className="ln-page ln-center"><p>Topic not found.</p></div>;

  return (
    <div className="ln-page">
      <button className="ln-back" onClick={() => navigate(`/learn/topic/${topic.id}`)}>
        <ArrowLeft size={16} /> Back to lesson
      </button>
      <QuizRunner title={`${topic.title} — Test`} questions={questions} onDone={handleDone} />
    </div>
  );
};

export default TopicTest;
