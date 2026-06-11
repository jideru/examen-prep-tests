# Examen Prep

Een oefen-app voor invultoetsen. Antwoorden worden automatisch bewaard in de
browser, dus de leerling kan altijd stoppen en later verdergaan.

## Starten

```bash
npm install
npm run dev
```

Open daarna de link die in de terminal verschijnt (meestal
http://localhost:5173).

## Een toets toevoegen

1. Zet een JSON-bestand in de map **`src/tests/`**.
2. Herlaad de pagina — de toets staat meteen op de overzichtspagina.

De bestandsnaam wordt de titel van de toets (tenzij je een `title`-veld
meegeeft).

> **Let op (online versie):** de toetsen worden tijdens het bouwen ingelezen.
> Lokaal volstaat een refresh, maar op de online (Vercel) versie moet je het
> JSON-bestand **committen en pushen** — Vercel bouwt dan automatisch opnieuw
> en de toets staat live. Zie hieronder.

## Deployen op Vercel

De app is een statische site (Vite + React) en heeft geen server nodig.

1. Push deze repo naar GitHub (al gebeurd).
2. Ga naar [vercel.com](https://vercel.com), kies **Add New → Project** en
   importeer de repo `examen-prep-tests`.
3. Vercel herkent Vite automatisch. Laat de instellingen staan:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Klik **Deploy**. Na ~1 minuut krijg je een `*.vercel.app`-link.

Daarna is alles automatisch: elke `git push` naar de hoofdbranch zet een
nieuwe versie live. Een nieuwe toets toevoegen = JSON committen + pushen.

Er is **geen `vercel.json` nodig**: de app gebruikt hash-routing (`#/...`),
dus de server hoeft maar één pagina te serveren en routes werken na een
refresh gewoon.

## Structuur van een toets-JSON

```json
{
  "course": "Biologie",
  "title": "Fotosynthese",
  "gradeAtEnd": false,
  "password": "",
  "questions": [
    {
      "Id": 1,
      "question": "Waar vindt fotosynthese plaats?",
      "multiple": [
        { "Id": 1, "option": "In de celkern" },
        { "Id": 2, "option": "In de bladgroenkorrels" }
      ],
      "answer": 2,
      "rule": "Fotosynthese gebeurt in de bladgroenkorrels, want daar zit het bladgroen."
    },
    {
      "Id": 2,
      "question": "Wat heeft een plant nodig voor fotosynthese?",
      "multiple": [],
      "AnswerKeywords": [
        { "keyword": "zonlicht" },
        { "keyword": "water" },
        { "keyword": "koolstofdioxide" }
      ]
    }
  ]
}
```

Regels:

- **`course`** — het vak; toetsen van hetzelfde vak staan bij elkaar in het
  overzicht.
- **`gradeAtEnd`** (optioneel, standaard `false`) — op `true` krijgt de
  leerling géén directe feedback. De toets wordt op het einde ingediend
  (dat kan ook met onbeantwoorde vragen — die tellen als fout), waarna de
  examinator hem verbetert. Bij de fouten op het resultaatscherm staat de
  `rule` van de vraag.
- **`emailTutor`** (optioneel) — e-mailadres van de begeleider. Zodra de
  toets ingediend (of bij directe feedback: afgerond) is, wordt het
  resultaat met alle antwoorden automatisch naar dit adres gemaild via
  [formsubmit.co](https://formsubmit.co). **Eenmalig:** bij de allereerste
  mail stuurt FormSubmit een activatiemail naar dit adres — klik daarin op
  de bevestigingsknop, anders komen er geen resultaten aan.
- **`password`** (optioneel) — wachtwoord dat de examinator moet invullen om
  een ingediende toets te verbeteren. Laat je dit weg (of leeg), dan mag er
  zonder wachtwoord verbeterd worden. Alleen zinvol samen met
  `"gradeAtEnd": true`.
- **`multiple` met opties** — meerkeuzevraag. Het juiste antwoord geef je op
  met `"answer": <Id van de juiste optie>`. Het antwoord mag ook als
  `{ "answer": 2 }` tussen de opties in `multiple` staan.
- **`multiple` leeg (`[]`)** — open vraag. De app kijkt na of alle
  kernwoorden uit `AnswerKeywords` in het antwoord voorkomen
  (hoofdletters, accenten en leestekens maken niet uit).
- **`rule`** (optioneel, per vraag) — het juiste antwoord in woorden. Wordt
  bij de verbetering alleen getoond als de vraag **fout** beantwoord is;
  bij een juist antwoord blijft de regel verborgen.

## Voortgang wissen

Op de overzichtspagina staat per toets een knop **Opnieuw beginnen**. De
voortgang staat in de localStorage van de browser onder sleutels die beginnen
met `examen-prep:`.
