import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Clock, ListChecks, Play, X } from 'lucide-react';
import {
  getSubjectQuestions,
  recordActivity,
  saveRevisionAttempt,
  subscribeSubjectsByGrade,
  type RevisionItem,
  type RevisionQuestion,
} from '../../lib/learn';
import { XP } from '../../lib/gamification';
import { bumpChallenge } from '../../lib/challenges';
import QuizRunner from './QuizRunner';
import { useActiveProfile } from './useProfile';
import '../../styles/learn.css';

const REVISION_MINUTES = 60;

const RevisionRunner: React.FC = () => {
  const { subjectId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { accountId, profile } = useActiveProfile();
  const [questions, setQuestions] = useState<RevisionQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [subjectName, setSubjectName] = useState<string>((location.state as { subjectName?: string })?.subjectName ?? 'Revision');

  useEffect(() => {
    getSubjectQuestions(subjectId).then(qs => { setQuestions(qs); setLoading(false); });
  }, [subjectId]);

  // Resolve subject name if it wasn't passed via navigation.
  useEffect(() => {
    if (!profile || (location.state as { subjectName?: string })?.subjectName) return;
    return subscribeSubjectsByGrade(profile.grade, rows => {
      const found = rows.find(r => r.id === subjectId);
      if (found) setSubjectName(found.name);
    });
  }, [profile?.grade, subjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDone = async (score: number, total: number, answers: Record<number, number>) => {
    if (accountId && profile) {
      const items: RevisionItem[] = questions.map((q, i) => ({
        q: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        chosenIndex: answers[i] ?? -1,
        topicTitle: q.topicTitle,
      }));
      await saveRevisionAttempt(accountId, profile.id, {
        subjectId, subjectName, score, total, at: Date.now(), items,
      }).catch(() => {});
      await recordActivity(accountId, profile.id, { xp: XP.completeExam }).catch(() => {});
      await bumpChallenge(accountId, profile.id, score).catch(() => {});
    }
    navigate(`/revision/${subjectId}/review`);
  };

  if (loading) return <div className="ln-page ln-center"><p>Preparing your revision paper…</p></div>;

  if (!started) {
    return (
      <div className="rv-intro-bg">
        <div className="rv-intro">
          <span className="rv-intro-icon"><BookOpen size={28} /></span>
          <h1 className="rv-intro-title">{subjectName} Revision</h1>
          <div className="rv-intro-stats">
            <div className="rv-stat"><Clock size={18} /><div><span>DURATION</span><strong>{REVISION_MINUTES} Minutes</strong></div></div>
            <div className="rv-stat"><ListChecks size={18} /><div><span>QUESTIONS</span><strong>{questions.length} Questions</strong></div></div>
          </div>
          <div className="rv-intro-instructions">
            <h3>Instructions</h3>
            <ul>
              <li>This paper covers every topic in {subjectName}.</li>
              <li>Do not refresh the page during the exam.</li>
              <li>The exam will auto-submit when the timer runs out.</li>
              <li>You can navigate between questions using Next and Back.</li>
            </ul>
          </div>
          <div className="rv-intro-actions">
            <button className="rv-cancel" onClick={() => navigate('/revision')}><X size={16} /> Cancel</button>
            <button className="rv-start" disabled={questions.length === 0} onClick={() => setStarted(true)}>
              <Play size={16} /> Start Exam
            </button>
          </div>
          {questions.length === 0 && <p className="ln-muted rv-empty-note">No questions available for this subject yet.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="ln-page">
      <QuizRunner title={`${subjectName} Revision`} questions={questions} durationMin={REVISION_MINUTES} onDone={handleDone} />
    </div>
  );
};

export default RevisionRunner;
