# Kündigung Generator

A small web app that helps people in Germany, including expats with limited German, write a correctly
structured cancellation letter (*Kündigungsschreiben*) for everyday consumer contracts and download it as a PDF.

**Not legal advice.** The app helps with wording. It does not check whether a cancellation is valid and never
calculates binding deadlines; by default it cancels "zum nächstmöglichen Termin".

## Features

- Gym, mobile phone, internet, streaming, insurance, newspaper and electricity contracts
- Ordinary cancellation (next possible date or a fixed future date) or extraordinary cancellation
  (price increase, moving house, own reason), each with an ordinary fallback
- Optional clauses: revoke the SEPA direct-debit mandate, revoke consent to advertising and data use
- Live preview; the letter is always German, the interface is German or English
- PDF with an embedded Noto Sans subset, so names like Łukasz, Şahin or Nguyễn render correctly
- Accessible form: labelled fields, keyboard reachable, errors announced to screen readers, WCAG AA contrast

## Privacy

Everything runs in the browser. There is no backend, no account, no analytics, and nothing is stored or
sent: form data lives only in memory and is gone when the tab closes. A test fills in the form, downloads the
PDF, and asserts that no network request or storage write happened.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest + React Testing Library
npm run coverage   # with thresholds, as in CI
npm run lint
npm run build
```

Vite 6 and oxlint 1.30 are pinned so the project runs on Node 22.11; with Node 22.12+ they can be upgraded.
Pushing to `main` deploys to GitHub Pages (see `.github/workflows/deploy.yml`).

## Structure

| Path | Purpose |
|---|---|
| `src/letter.ts` | Pure function: form data → German letter text, plus validation |
| `src/pdf.ts` | PDF layout (DIN 5008) with jsPDF, loaded only when downloading |
| `src/App.tsx` | Form, live preview, language toggle |
| `src/i18n.ts` | German and English UI strings |
| `docs/decisions/` | Architecture decision records |
| `.claude/` | Product requirements and implementation plan |

## Licences

The bundled Noto Sans subset is licensed under the SIL Open Font License 1.1 (`src/fonts/OFL.txt`).
