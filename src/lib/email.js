// Mailt het resultaat naar de begeleider via formsubmit.co.
// Dat werkt zonder eigen mailserver of API-sleutel; de eerste mail
// vraagt de ontvanger wel eenmalig om het adres te activeren.

export async function sendResultEmail(test, results) {
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;

  const lines = results.map((r, i) => {
    const status = r.correct ? 'JUIST' : r.answered ? 'FOUT' : 'NIET INGEVULD';
    return `${i + 1}. [${status}] ${r.question}\n   Antwoord: ${
      r.answerText || '(geen)'
    }`;
  });

  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(test.emailTutor)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: `Resultaat ${test.course} – ${test.title}: ${correct}/${total}`,
        _template: 'box',
        toets: `${test.course} – ${test.title}`,
        score: `${correct} / ${total}`,
        details: lines.join('\n\n'),
      }),
    },
  );

  if (!response.ok) {
    throw new Error('failed');
  }
  const data = await response.json().catch(() => ({}));
  if (String(data.success) !== 'true') {
    // Bij de allereerste mail stuurt FormSubmit eerst een
    // activatiemail naar de ontvanger.
    const needsActivation = String(data.message ?? '')
      .toLowerCase()
      .includes('activation');
    throw new Error(needsActivation ? 'activation' : 'failed');
  }
}
