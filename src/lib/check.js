// Nakijken van antwoorden.

// Vergelijkt tekst zonder hoofdletters, accenten of leestekens,
// zodat "Fotosynthése!" ook "fotosynthese" matcht.
function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkMultiple(question, chosenId) {
  return {
    correct: String(chosenId) === String(question.answer),
  };
}

export function checkOpen(question, text) {
  const normalized = ` ${normalizeText(text)} `;
  const found = [];
  const missing = [];
  for (const keyword of question.keywords) {
    if (normalized.includes(` ${normalizeText(keyword)} `)) {
      found.push(keyword);
    } else {
      missing.push(keyword);
    }
  }
  return {
    correct: missing.length === 0 && question.keywords.length > 0,
    found,
    missing,
  };
}
