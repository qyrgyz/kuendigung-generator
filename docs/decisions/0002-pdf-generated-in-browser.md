# ADR-0002: Generate the PDF in the browser

**Date**: 2026-10-17 · **Status**: accepted · **Depends on**: ADR-0001

**Context**: Users need a downloadable PDF letter, and ADR-0001 rules out a server.
**Decision**: The PDF is built client-side from the same letter data the preview shows, then offered as a download.
**Alternatives**:
- Server-side rendering: rejected because of ADR-0001.
- Browser "Print to PDF" only: zero dependencies, but layout and filename vary by browser and the steps confuse non-technical users. Kept as a fallback.
**Consequences**:
- \+ Works offline; preview and PDF come from one source.
- − Adds a PDF library to the bundle; umlauts and ß need a font that has them.
- Risk: the PDF drifts from the preview. Mitigation: a test that compares the PDF text with the preview.
