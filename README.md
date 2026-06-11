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
      "answer": 2
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
  leerling géén directe feedback. Pas als alle vragen beantwoord zijn kan de
  toets ingediend worden, waarna de examinator hem verbetert.
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

## Voortgang wissen

Op de overzichtspagina staat per toets een knop **Opnieuw beginnen**. De
voortgang staat in de localStorage van de browser onder sleutels die beginnen
met `examen-prep:`.
