import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { QuizQuestion } from '../../lib/learn';
import SvgFigure from './SvgFigure';
import '../../styles/learn.css';

interface Props {
  title: string;
  subtitle?: string;
  questions: QuizQuestion[];
  durationMin?: number;
  onDone: (score: number, total: number, answers: Record<number, number>) => void;
}

const QuizRunner: React.FC<Props> = ({ title, subtitle = 'Test your knowledge', questions, durationMin, onDone }) => {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(durationMin ? durationMin * 60 : 0);

  const total = questions.length;
  const score = useMemo(
    () => questions.reduce((s, q, i) => s + (answers[i] === q.correctIndex ? 1 : 0), 0),
    [answers, questions]
  );

  useEffect(() => {
    if (!durationMin || submitted) return;
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { setSubmitted(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [durationMin, submitted]);

  if (total === 0) return <p className="ln-empty">No questions here yet.</p>;

  if (submitted) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="ln-results">
        <div className={`ln-score-ring ${pct >= 50 ? 'pass' : 'fail'}`}>
          <strong>{pct}%</strong>
          <span>{score}/{total}</span>
        </div>
        <h2 className="ln-results-title">{pct >= 50 ? '🎉 Well done!' : '💪 Keep practising!'}</h2>
        <div className="ln-review">
          {questions.map((q, i) => {
            const chosen = answers[i];
            const correct = chosen === q.correctIndex;
            return (
              <div key={q.id} className={`ln-review-item ${correct ? 'ok' : 'bad'}`}>
                <p className="ln-review-q">{i + 1}. {q.text}</p>
                <SvgFigure diagram={q.diagram} className="ln-figure-sm" />
                <ul>
                  {q.options.map((o, oi) => (
                    <li key={oi} className={oi === q.correctIndex ? 'correct' : oi === chosen ? 'wrong' : ''}>
                      {oi === q.correctIndex && <CheckCircle size={14} />}
                      {oi === chosen && oi !== q.correctIndex && <XCircle size={14} />}
                      {o}
                    </li>
                  ))}
                </ul>
                {q.explanation && <p className="ln-review-exp">💡 {q.explanation}</p>}
              </div>
            );
          })}
        </div>
        <button className="ln-btn ln-btn-primary" onClick={() => onDone(score, total, answers)}>Done</button>
      </div>
    );
  }

  const q = questions[idx];
  const chosen = answers[idx];
  const isLast = idx === total - 1;
  const answeredAll = Object.keys(answers).length >= total;

  return (
    <div className="ln-quiz">
      <div className="ln-quiz-head">
        <span className="ln-quiz-icon"><BookOpen size={22} /></span>
        <div className="ln-quiz-head-text">
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
        {durationMin ? (
          <span className={`ln-quiz-timer ${secondsLeft <= 30 ? 'low' : ''}`}>
            <Clock size={16} />
            {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
          </span>
        ) : null}
      </div>
      <div className="ln-progress"><span style={{ width: `${((idx + 1) / total) * 100}%` }} /></div>
      <p className="ln-qcount">Question {idx + 1} of {total}</p>
      <h3 className="ln-qtext">{q.text}</h3>
      <SvgFigure diagram={q.diagram} />
      <div className="ln-options">
        {q.options.map((o, oi) => (
          <button
            key={oi}
            className={`ln-option ${chosen === oi ? 'selected' : ''}`}
            onClick={() => setAnswers(a => ({ ...a, [idx]: oi }))}
          >
            <span className="ln-option-letter">{String.fromCharCode(65 + oi)}</span>
            <span className="ln-option-text">{o}</span>
          </button>
        ))}
      </div>
      <div className="ln-quiz-nav">
        <button className="ln-btn ln-quiz-back" onClick={() => setIdx(i => i - 1)} disabled={idx === 0}>
          <ArrowLeft size={16} /> Back
        </button>
        {!isLast ? (
          <button className="ln-btn ln-btn-primary ln-quiz-next" disabled={chosen === undefined} onClick={() => setIdx(i => i + 1)}>
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button className="ln-btn ln-btn-primary ln-quiz-next" disabled={!answeredAll} onClick={() => setSubmitted(true)}>
            Submit
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizRunner;
