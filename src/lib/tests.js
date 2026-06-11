// Laadt alle toetsen uit de map src/tests/.
// Een nieuw JSON-bestand in die map verschijnt na een refresh
// automatisch op de overzichtspagina.

const modules = import.meta.glob('../tests/*.json', { eager: true });

// Haalt een waarde op ongeacht hoofdletters (Id / id / ID).
function pick(obj, ...names) {
  if (!obj || typeof obj !== 'object') return undefined;
  const lower = {};
  for (const key of Object.keys(obj)) lower[key.toLowerCase()] = obj[key];
  for (const name of names) {
    const value = lower[name.toLowerCase()];
    if (value !== undefined) return value;
  }
  return undefined;
}

function normalizeQuestion(raw, index) {
  const id = pick(raw, 'id') ?? index + 1;
  const question = String(pick(raw, 'question', 'vraag') ?? '');

  const rawMultiple = pick(raw, 'multiple') ?? [];
  let answer = pick(raw, 'answer', 'correctAnswerMultiple');

  // Opties verzamelen. Het antwoord mag als { "answer": id }
  // tussen de opties staan of als apart veld naast "multiple".
  const options = [];
  if (Array.isArray(rawMultiple)) {
    for (const entry of rawMultiple) {
      const inlineAnswer = pick(entry, 'answer');
      if (inlineAnswer !== undefined && pick(entry, 'option') === undefined) {
        answer = inlineAnswer;
        continue;
      }
      const optionText = pick(entry, 'option', 'optie');
      if (optionText !== undefined) {
        options.push({
          id: pick(entry, 'id') ?? options.length + 1,
          option: String(optionText),
        });
      }
    }
  }

  const rawKeywords = pick(raw, 'AnswerKeywords', 'keywords') ?? [];
  const keywords = (Array.isArray(rawKeywords) ? rawKeywords : [])
    .map((entry) =>
      typeof entry === 'string' ? entry : pick(entry, 'keyword'),
    )
    .filter((keyword) => typeof keyword === 'string' && keyword.trim() !== '')
    .map((keyword) => keyword.trim());

  // rule: het juiste antwoord in woorden; wordt bij de verbetering
  // alleen getoond als de vraag fout beantwoord is.
  const rule = String(pick(raw, 'rule', 'regel') ?? '').trim();

  const isMultiple = options.length > 0;
  return {
    id,
    question,
    type: isMultiple ? 'multiple' : 'open',
    options,
    answer: isMultiple ? answer : undefined,
    keywords: isMultiple ? [] : keywords,
    rule,
  };
}

function normalizeTest(fileName, data) {
  // Zowel { course, questions: [...] } als een losse array van vragen
  // wordt geaccepteerd.
  const questionsRaw = Array.isArray(data)
    ? data
    : (pick(data, 'questions', 'vragen') ?? []);
  const course =
    (Array.isArray(data) ? pick(data[0], 'course') : pick(data, 'course')) ??
    'Algemeen';
  const title =
    (Array.isArray(data) ? undefined : pick(data, 'title', 'titel', 'name')) ??
    fileName
      .replace(/[-_]/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase());

  // gradeAtEnd: pas verbeteren nadat de hele toets is ingediend.
  // password: nodig om te mogen verbeteren (leeg = iedereen mag).
  const gradeAtEnd = Boolean(
    Array.isArray(data)
      ? false
      : (pick(data, 'gradeAtEnd', 'verbeterAchteraf') ?? false),
  );
  const password = Array.isArray(data)
    ? ''
    : String(pick(data, 'password', 'wachtwoord') ?? '');

  // emailTutor: na het indienen wordt het resultaat hierheen gemaild.
  const emailTutor = Array.isArray(data)
    ? ''
    : String(pick(data, 'emailTutor', 'tutorEmail') ?? '').trim();

  return {
    id: fileName,
    course: String(course),
    title: String(title),
    gradeAtEnd,
    password,
    emailTutor,
    questions: (Array.isArray(questionsRaw) ? questionsRaw : []).map(
      normalizeQuestion,
    ),
  };
}

export function loadTests() {
  const tests = [];
  for (const [path, mod] of Object.entries(modules)) {
    const fileName = path.split('/').pop().replace(/\.json$/i, '');
    try {
      const test = normalizeTest(fileName, mod.default ?? mod);
      if (test.questions.length > 0) tests.push(test);
    } catch (err) {
      console.error(`Toets "${fileName}" kon niet gelezen worden:`, err);
    }
  }
  tests.sort(
    (a, b) =>
      a.course.localeCompare(b.course) || a.title.localeCompare(b.title),
  );
  return tests;
}
