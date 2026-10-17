# ADR-0004: Not legal advice; notice-period info is guidance only

**Date**: 2026-10-17 · **Status**: accepted

**Context**: A wrong deadline or a weak wording could cost a user money, and the product must not look like legal advice (liability, RDG).
**Decision**: Every screen of the app shows a disclaimer. The PDF does not, because it is the letter the provider receives (amended 2026-10-17). Notice-period info is general guidance and is never a calculated, binding date. The default termination wording is "zum nächstmöglichen Zeitpunkt". Disputes are referred to the Verbraucherzentrale.
**Alternatives**: Compute exact end dates from contract data. Rejected because contract terms vary and an exact date implies a guarantee.
**Consequences**:
- \+ Lower liability; the safe default wording works even when the user doesn't know the date.
- − Less precise for users who want an exact date.
- Revisit if the PRD's open question on date suggestions is decided differently.
