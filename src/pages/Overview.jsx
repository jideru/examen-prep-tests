import { useState } from 'react';
import { loadProgress, resetProgress } from '../lib/storage.js';

function progressInfo(test) {
  const progress = loadProgress(test.id);
  const total = test.questions.length;
  const done = test.questions.filter((question) => {
    const saved = progress.answers[question.id];
    return question.type === 'multiple'
      ? saved?.value !== undefined
      : (saved?.value ?? '').trim() !== '';
  }).length;
  const correct = test.questions.filter(
    (question) => progress.answers[question.id]?.correct,
  ).length;
  return {
    done,
    total,
    correct,
    finished: progress.finished,
    submitted: Boolean(progress.submitted) && !progress.finished,
  };
}

function TestCard({ test, onReset }) {
  const { done, total, correct, finished, submitted } = progressInfo(test);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  let label = 'Start de toets';
  if (finished) label = 'Bekijk je resultaat';
  else if (submitted) label = 'Wacht op verbetering';
  else if (done > 0) label = 'Ga verder';

  return (
    <article className="test-card">
      <h3>{test.title}</h3>
      <p className="test-meta">
        {total} {total === 1 ? 'vraag' : 'vragen'}
        {done > 0 && !finished && !submitted && ` · ${done} beantwoord`}
        {submitted && ' · ingediend'}
        {finished && ` · score: ${correct}/${total}`}
      </p>
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Voortgang: ${percent}%`}
      >
        <div
          className={`progress-fill${finished ? ' is-finished' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="card-actions">
        <a className="button primary" href={`#/test/${encodeURIComponent(test.id)}`}>
          {label}
        </a>
        {done > 0 && (
          <button
            type="button"
            className="button ghost"
            onClick={() => onReset(test.id)}
          >
            Opnieuw beginnen
          </button>
        )}
      </div>
    </article>
  );
}

export default function Overview({ tests }) {
  // Alleen gebruikt om de pagina te verversen na een reset.
  const [, setVersion] = useState(0);

  const handleReset = (testId) => {
    if (window.confirm('Al je antwoorden van deze toets wissen?')) {
      resetProgress(testId);
      setVersion((v) => v + 1);
    }
  };

  const courses = [...new Set(tests.map((test) => test.course))];

  return (
    <div className="overview">
      <h1>Hoi! Waar wil je vandaag aan werken?</h1>
      <p className="subtitle">
        Kies een toets. Je antwoorden worden automatisch bewaard, dus je kan
        altijd stoppen en later verdergaan.
      </p>

      {tests.length === 0 && (
        <p className="empty-state">
          Er zijn nog geen toetsen. Zet een JSON-bestand in de map{' '}
          <code>src/tests/</code> en herlaad de pagina.
        </p>
      )}

      {courses.map((course) => (
        <section key={course} className="course-section">
          <h2>{course}</h2>
          <div className="card-grid">
            {tests
              .filter((test) => test.course === course)
              .map((test) => (
                <TestCard key={test.id} test={test} onReset={handleReset} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
