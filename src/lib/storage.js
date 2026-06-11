// Bewaart de voortgang per toets in localStorage zodat
// antwoorden nooit verloren gaan, ook niet na een refresh.

const PREFIX = 'examen-prep:';

export function loadProgress(testId) {
  try {
    const raw = localStorage.getItem(PREFIX + testId);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Voortgang kon niet gelezen worden:', err);
  }
  return { answers: {}, currentIndex: 0, finished: false };
}

export function saveProgress(testId, progress) {
  try {
    localStorage.setItem(
      PREFIX + testId,
      JSON.stringify({ ...progress, updatedAt: Date.now() }),
    );
  } catch (err) {
    console.error('Voortgang kon niet bewaard worden:', err);
  }
}

export function resetProgress(testId) {
  localStorage.removeItem(PREFIX + testId);
}
