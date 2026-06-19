import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Clock, ListChecks, Play, X } from 'lucide-react';
import {
  getExam,
  getExamQuestions,
  recordExamResult,
  submitScore,
  type ExamMeta,
  type QuizQuestion,
} from '../../lib/learn';
import { XP } from '../../lib/gamification';
import { bumpChallenge } from '../../lib/challenges';
import { useActiveProfile } from './useProfile';
import QuizRunner from './QuizRunner';
import '../../styles/learn.css';

const ExamRunner: React.FC = () => {
  const { examId = '' } = useParams();
  const navigate = useNavigate();
  const { accountId, profile } = useActiveProfile();
  const [exam, setExam] = useState<ExamMeta | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    Promise.all([getExam(examId), getExamQuestions(examId)]).then(([e, qs]) => {
      setExam(e); setQuestions(qs); setLoading(false);
    });
  }, [examId]);

  const handleDone = async (score: number) => {
    if (exam && profile) {
      if (accountId) {
        await recordExamResult(accountId, profile.id, { id: exam.id, title: exam.title, subject: exam.subject }, {
          score, total: questions.length, xp: XP.completeExam,
        }).catch(() => {});
        await bumpChallenge(accountId, profile.id, score).catch(() => {});
      }
      await submitScore({
        player: profile.username,
        game: exam.title,
        grade: `Grade ${profile.grade}`,
        score,
        points: score * 10,
        profileId: profile.id,
      }).catch(() => {});
    }
    navigate('/exams');
  };

  if (loading) return <div className="ln-page ln-center"><p>Loading exam…</p></div>;
  if (!exam) return <div className="ln-page ln-center"><p>Exam not found.</p></div>;

  if (!started) {
    return (
      <div className="rv-intro-bg">
        <div className="rv-intro">
          <span className="rv-intro-icon"><BookOpen size={28} /></span>
          <h1 className="rv-intro-title">{exam.title}</h1>
          <div className="rv-intro-stats">
            <div className="rv-stat"><Clock size={18} /><div><span>DURATION</span><strong>{exam.durationMin ?? 0} Minutes</strong></div></div>
            <div className="rv-stat"><ListChecks size={18} /><div><span>QUESTIONS</span><strong>{questions.length} Questions</strong></div></div>
          </div>
          <div className="rv-intro-instructions">
            <h3>Instructions</h3>
            <ul>
              <li>Ensure you have a stable internet connection.</li>
              <li>Do not refresh the page during the exam.</li>
              <li>The exam will auto-submit when the timer runs out.</li>
              <li>You can navigate between questions using Next and Back.</li>
            </ul>
          </div>
          <div className="rv-intro-actions">
            <button className="rv-cancel" onClick={() => navigate('/exams')}><X size={16} /> Cancel</button>
            <button className="rv-start" disabled={questions.length === 0} onClick={() => setStarted(true)}>
              <Play size={16} /> Start Exam
            </button>
          </div>
          {questions.length === 0 && <p className="ln-muted rv-empty-note">No questions available for this exam yet.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="ln-page">
      <QuizRunner title={exam.title} subtitle={`${exam.subject} · Test your knowledge`} questions={questions} durationMin={exam.durationMin} onDone={handleDone} />
    </div>
  );
};

export default ExamRunner;
