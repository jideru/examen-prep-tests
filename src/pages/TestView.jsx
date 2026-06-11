import { useEffect, useState } from 'react';
import { loadProgress, saveProgress, resetProgress } from '../lib/storage.js';
import { checkMultiple, checkOpen } from '../lib/check.js';

function isAnswered(question, saved) {
  return question.type === 'multiple'
    ? saved?.value !== undefined
    : (saved?.value ?? '').trim() !== '';
}

// Verbeter-knop voor de examinator. Met een wachtwoord in de JSON
// moet dat eerst juist ingevuld worden; zonder wachtwoord mag
// er meteen verbeterd worden.
function GradeGate({ password, onGrade }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (!password) {
    return (
      <button type="button" className="button primary" onClick={onGrade}>
        Verbeter de toets
      </button>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="button primary"
        onClick={() => setOpen(true)}
      >
        Verbeter de toets
      </button>
    );
  }

  const submit = (event) => {
    event.preventDefault();
    if (input === password) {
      onGrade();
    } else {
      setError(true);
    }
  };

  return (
    <form className="grade-gate" onSubmit={submit}>
      <label htmlFor="grade-password">
        Wachtwoord van de examinator
      </label>
      <div className="grade-gate-row">
        <input
          id="grade-password"
          type="password"
          className="password-input"
          value={input}
          autoFocus
          onChange={(event) => {
            setInput(event.target.value);
            setError(false);
          }}
        />
        <button type="submit" className="button primary">
          Verbeter
        </button>
      </div>
      {error && (
        <p className="grade-error" role="alert">
          Dat wachtwoord klopt niet. Probeer opnieuw.
        </p>
      )}
    </form>
  );
}

export default function TestView({ test }) {
  const [progress, setProgress] = useState(() => {
    const saved = loadProgress(test.id);
    return {
      ...saved,
      currentIndex: Math.min(
        saved.currentIndex ?? 0,
        Math.max(test.questions.length - 1, 0),
      ),
    };
  });

  // Elke wijziging meteen bewaren zodat niets verloren gaat.
  useEffect(() => {
    saveProgress(test.id, progress);
  }, [test.id, progress]);

  const update = (patch) => setProgress((prev) => ({ ...prev, ...patch }));

  const setAnswer = (questionId, patch) =>
    setProgress((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: { ...prev.answers[questionId], ...patch },
      },
    }));

  const questions = test.questions;
  const index = progress.currentIndex;
  const question = questions[index];
  const saved = progress.answers[question?.id] ?? {};
  const answeredCount = questions.filter((q) =>
    isAnswered(q, progress.answers[q.id]),
  ).length;
  const checkedCount = questions.filter(
    (q) => progress.answers[q.id]?.checked,
  ).length;
  const correctCount = questions.filter(
    (q) => progress.answers[q.id]?.correct,
  ).length;

  const gradeAnswer = (q, savedAnswer) =>
    q.type === 'multiple'
      ? checkMultiple(q, savedAnswer?.value)
      : checkOpen(q, savedAnswer?.value ?? '');

  const handleCheck = () => {
    const result = gradeAnswer(question, saved);
    setAnswer(question.id, {
      checked: true,
      correct: result.correct,
      found: result.found,
      missing: result.missing,
    });
  };

  // Verbetert alle vragen in één keer (na het indienen).
  const handleGradeAll = () => {
    setProgress((prev) => {
      const answers = { ...prev.answers };
      for (const q of questions) {
        const result = gradeAnswer(q, answers[q.id]);
        answers[q.id] = {
          ...answers[q.id],
          checked: true,
          correct: result.correct,
          found: result.found,
          missing: result.missing,
        };
      }
      return { ...prev, answers, finished: true };
    });
  };

  const handleRestart = () => {
    if (window.confirm('Al je antwoorden van deze toets wissen?')) {
      resetProgress(test.id);
      setProgress({ answers: {}, currentIndex: 0, finished: false });
    }
  };

  if (progress.finished) {
    return (
      <div className="test-view">
        <div className="result-card">
          <h1>Goed gewerkt! 🎉</h1>
          <p className="score-line">
            Je score voor <strong>{test.title}</strong>:
          </p>
          <p className="score-big">
            {correctCount} / {questions.length}
          </p>
          <ul className="recap-list">
            {questions.map((q, i) => {
              const a = progress.answers[q.id] ?? {};
              return (
                <li key={q.id} className={a.correct ? 'is-correct' : 'is-wrong'}>
                  <span className="recap-icon" aria-hidden="true">
                    {a.correct ? '✓' : '✗'}
                  </span>
                  <button
                    type="button"
                    className="recap-link"
                    onClick={() =>
                      update({ finished: false, currentIndex: i })
                    }
                  >
                    {q.question}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="card-actions">
            <button type="button" className="button primary" onClick={handleRestart}>
              Opnieuw proberen
            </button>
            <a className="button ghost" href="#/">
              Terug naar het overzicht
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Ingediend, maar nog niet verbeterd: wachten op de examinator.
  if (test.gradeAtEnd && progress.submitted) {
    return (
      <div className="test-view">
        <div className="result-card">
          <h1>Je toets is ingediend 📬</h1>
          <p className="score-line">
            <strong>{test.title}</strong> wacht op verbetering door de
            examinator. Je antwoorden staan veilig bewaard.
          </p>
          <div className="card-actions submit-actions">
            <GradeGate password={test.password} onGrade={handleGradeAll} />
            <a className="button ghost" href="#/">
              Terug naar het overzicht
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="test-view">
        <p className="empty-state">Deze toets bevat geen vragen.</p>
        <a className="button ghost" href="#/">Terug naar het overzicht</a>
      </div>
    );
  }

  const isLast = index === questions.length - 1;
  const answered = isAnswered(question, saved);
  const allAnswered = answeredCount === questions.length;
  const progressDone = test.gradeAtEnd ? answeredCount : checkedCount;

  return (
    <div className="test-view">
      <div className="test-topbar">
        <a className="back-link" href="#/">← Overzicht</a>
        <span className="test-name">
          {test.course} · {test.title}
        </span>
      </div>

      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={progressDone}
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-label={`${progressDone} van ${questions.length} vragen beantwoord`}
      >
        <div
          className="progress-fill"
          style={{ width: `${(progressDone / questions.length) * 100}%` }}
        />
      </div>

      <article className="question-card">
        <p className="question-number">
          Vraag {index + 1} van {questions.length}
        </p>
        <h1 className="question-text">{question.question}</h1>

        {question.type === 'multiple' ? (
          <div className="options" role="radiogroup" aria-label="Antwoordopties">
            {question.options.map((option) => {
              const chosen = String(saved.value) === String(option.id);
              let className = 'option';
              if (chosen) className += ' is-chosen';
              if (saved.checked) {
                if (String(option.id) === String(question.answer)) {
                  className += ' is-answer';
                } else if (chosen) {
                  className += ' is-wrong';
                }
              }
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  className={className}
                  disabled={saved.checked}
                  onClick={() => setAnswer(question.id, { value: option.id })}
                >
                  {option.option}
                </button>
              );
            })}
          </div>
        ) : (
          <textarea
            className="open-answer"
            rows={5}
            placeholder="Typ hier je antwoord…"
            value={saved.value ?? ''}
            readOnly={saved.checked}
            onChange={(event) =>
              setAnswer(question.id, { value: event.target.value })
            }
          />
        )}

        {saved.checked && (
          <div
            className={`feedback ${saved.correct ? 'is-correct' : 'is-wrong'}`}
            role="status"
          >
            {question.type === 'multiple' ? (
              saved.correct ? (
                <p><strong>Juist!</strong> Goed gedaan.</p>
              ) : (
                <p>
                  <strong>Niet juist.</strong> Het goede antwoord is
                  gemarkeerd in het groen.
                </p>
              )
            ) : saved.correct ? (
              <p>
                <strong>Juist!</strong> Alle kernwoorden zitten in je
                antwoord: {saved.found?.join(', ')}.
              </p>
            ) : (
              <>
                <p>
                  <strong>Nog niet helemaal.</strong>
                  {saved.found?.length > 0 &&
                    ` Gevonden: ${saved.found.join(', ')}.`}
                </p>
                <p>
                  Deze kernwoorden ontbreken nog:{' '}
                  <strong>{saved.missing?.join(', ')}</strong>
                </p>
              </>
            )}
          </div>
        )}

        <div className="question-actions">
          <button
            type="button"
            className="button ghost"
            disabled={index === 0}
            onClick={() => update({ currentIndex: index - 1 })}
          >
            ← Vorige
          </button>

          {test.gradeAtEnd ? (
            // Achteraf verbeteren: geen "Kijk na", wel indienen op het einde.
            isLast ? (
              <button
                type="button"
                className="button primary"
                disabled={!allAnswered}
                title={
                  allAnswered
                    ? undefined
                    : 'Beantwoord eerst alle vragen'
                }
                onClick={() => update({ submitted: true })}
              >
                Dien je toets in
              </button>
            ) : (
              <button
                type="button"
                className="button primary"
                onClick={() => update({ currentIndex: index + 1 })}
              >
                Volgende →
              </button>
            )
          ) : !saved.checked ? (
            <button
              type="button"
              className="button primary"
              disabled={!answered}
              onClick={handleCheck}
            >
              Kijk na
            </button>
          ) : isLast ? (
            <button
              type="button"
              className="button primary"
              onClick={() => update({ finished: true })}
            >
              Bekijk je resultaat
            </button>
          ) : (
            <button
              type="button"
              className="button primary"
              onClick={() => update({ currentIndex: index + 1 })}
            >
              Volgende →
            </button>
          )}
        </div>

        {test.gradeAtEnd && isLast && !allAnswered && (
          <p className="submit-hint">
            Nog {questions.length - answeredCount}{' '}
            {questions.length - answeredCount === 1 ? 'vraag' : 'vragen'}{' '}
            onbeantwoord. Ga terug met ← Vorige om alles in te vullen.
          </p>
        )}
      </article>
    </div>
  );
}
