# ADR-0001: Client-only app, no backend

**Date**: 2026-10-17 · **Status**: accepted · **Source**: .claude/prds/kuendigung-generator.prd.md

**Context**: The form collects names, addresses and customer numbers. The PRD promises that no data is stored or sent anywhere, and it rules out accounts.
**Decision**: The app is static files only. All logic runs in the browser. There are no API calls, accounts or analytics that carry form data.
**Alternatives**: A small backend for PDF generation or saved drafts. Rejected because it would take personal data off the device, bring GDPR duties, and need hosting and maintenance.
**Consequences**:
- \+ Strong privacy promise; free static hosting; nothing on a server to breach.
- − No usage analytics or saved drafts, so success is measured with usability tests.
- Risk: a third-party script could leak data. Mitigation: no third-party requests carry form data, checked by network inspection in QA.
