# ADR-0003: Letter always in German; UI in German and English

**Date**: 2026-10-17 · **Status**: accepted

**Context**: German providers expect German letters. Many target users are expats with limited German.
**Decision**: Letter templates exist only in German. The UI text, field help and sending checklist exist in German and English, and the user can switch between them.
**Alternatives**:
- Letter in the user's language: rejected because providers may not process it.
- UI in German only: rejected because it excludes the expat users the app is for.
- More UI languages: deferred until there is evidence of demand.
**Consequences**:
- \+ One legally reviewed set of templates; the UI is accessible to expats.
- − Every UI string needs two languages; users may not understand the letter, so the preview can show an English gloss (UI only, never in the PDF).
