# Plan: Kündigung Generator — Letter core

**Source PRD**: .claude/prds/kuendigung-generator.prd.md
**Selected Milestone**: 1 — Letter core (correct German PDF for one contract type)
**Complexity**: Medium
**Decisions honoured**: docs/decisions/0001–0005

## Summary
Set up a Vite + React + TypeScript app that runs entirely in the browser. It has one contract type, Fitnessstudio. The user fills a form, sees a live preview of the German letter, and downloads it as a PDF. The preview and the PDF both come from one pure function, `buildLetter()`, so they can't drift apart (ADR-0002). The app deploys to GitHub Pages.

## Patterns to Mirror
The project has no code yet, so there are no patterns to copy. This milestone sets them:
| Category | Source | Pattern |
|---|---|---|
| Naming | Vite `react-ts` template | camelCase modules, PascalCase components |
| Errors | — | Form validation blocks the download; there is no I/O that could fail at runtime |
| Tests | Vitest + React Testing Library | `*.test.ts(x)` next to the source; query by label or role |

## PDF library choice
**jsPDF**. Its built-in Helvetica uses WinAnsi encoding, which covers ä ö ü Ä Ö Ü ß and €, so no font has to be embedded. That keeps the bundle small, and `splitTextToSize` handles line wrapping. The runner-up, pdf-lib, has no line wrapping and is no smaller for this use. jsPDF loads its optional dependencies (html2canvas, dompurify) only when `.html()` is called. We never call it, so they must not end up in the main bundle. Task 5 checks this.

## Files to Change
| File | Action | Why |
|---|---|---|
| scaffold (`package.json`, `vite.config.ts`, `index.html`, `tsconfig*`) | CREATE | `npm create vite@latest . -- --template react-ts`; set `base: './'` for Pages |
| `src/letter.ts` | CREATE | `buildLetter(data) → { sender, recipient, place, date, subject, paragraphs, closing }`, German text only |
| `src/letter.test.ts` | CREATE | Every required element from the PRD is present; fixed date vs. "nächstmöglicher Zeitpunkt"; umlauts kept |
| `src/pdf.ts` | CREATE | `downloadPdf(letter)` lays out a DIN 5008-style A4 page with jsPDF and saves it as `Kuendigung_<Anbieter>.pdf` |
| `src/pdf.test.ts` | CREATE | Smoke test: the output starts with `%PDF` and the text survives |
| `src/App.tsx` | REPLACE | Form, live preview, disclaimer, download button |
| `src/App.test.tsx` | CREATE | Download is disabled until required fields are filled; the preview updates as the user types |
| `.github/workflows/deploy.yml` | CREATE | Build, test, then deploy to GitHub Pages |

## Tasks
### Task 1: Scaffold
- **Action**: Run the Vite `react-ts` template, add `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom` and `jspdf`, and add `"test": "vitest run"`. Delete the template's demo assets.
- **Validate**: `npm run build && npm test`

### Task 2: `buildLetter` (test-first)
- **Action**: Write a pure function. Its fields are the sender's name and address, the gym's name and address, the member number, the termination type (`next` | a date), and the place. The letter contains:
  - the subject "Kündigung meiner Mitgliedschaft – Mitgliedsnr. X"
  - the sentence "hiermit kündige ich … fristgerecht zum nächstmöglichen Zeitpunkt" or "zum DD.MM.YYYY, hilfsweise zum nächstmöglichen Zeitpunkt"
  - a revocation of the SEPA direct debit as of the contract end
  - a request for written confirmation of receipt and of the end date
  - "Mit freundlichen Grüßen" and a signature line

  Dates are formatted with `Intl.DateTimeFormat('de-DE')`. The default is "nächstmöglicher Zeitpunkt" (ADR-0004).
- **Validate**: `npm test -- letter`

### Task 3: `downloadPdf`
- **Action**: Use jsPDF with A4, Helvetica, mm units and `splitTextToSize`. The layout puts the sender at the top, the recipient in the address-window area, then place and date, a bold subject, the body and the closing. It must not use `.html()`.
- **Validate**: `npm test -- pdf`, then open the PDF and check visually that ä/ö/ü/ß render.

### Task 4: `App`
- **Action**: A controlled form with a `<label>` on every input. Required fields block the download, and the button explains what's missing. The live preview renders `buildLetter()`. The "Keine Rechtsberatung" notice links to the Verbraucherzentrale. The UI is German only in this milestone; English comes in milestone 2. Form data is never written to localStorage and never sent anywhere (ADR-0001).
- **Validate**: `npm test -- App`

### Task 5: Deploy and privacy check
- **Action**: Add a GitHub Actions Pages workflow (`actions/deploy-pages`). Check that the main chunk in `dist/assets` doesn't contain html2canvas. In the browser DevTools Network tab, fill the form and download: there should be no requests after the page loads.
- **Validate**: `npm run build && ls -l dist/assets`, then the manual network check.

## Validation
```bash
npm test
npm run build
npm run lint
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| ADR-0004 puts a disclaimer in the PDF footer, so the provider would see it on the letter | High | Decided: the disclaimer is shown in the app only; ADR-0004 is amended |
| html2canvas gets bundled anyway and the bundle grows | Low | Task 5 size check; fall back to pdf-lib if it does |
| The letter wording isn't legally reviewed | Med | Wording follows the common Verbraucherzentrale templates; legal review is still an open question in the PRD |
| The folder isn't a git repo, so GitHub Pages has nothing to deploy | Certain | Run `git init` and add a GitHub remote before Task 5 |

## Acceptance
- [ ] All tasks complete
- [ ] Validation passes
- [ ] A downloaded PDF shows correct umlauts and every element the PRD requires
- [ ] No network requests carry form data
