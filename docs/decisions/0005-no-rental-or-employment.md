# ADR-0005: Rental and employment contracts are out of scope

**Date**: 2026-10-17 · **Status**: accepted

**Context**: Ending a rental contract (§568 BGB) or an employment contract (§623 BGB) legally requires written form with a handwritten signature. Email or a PDF alone is not enough, and the stakes and edge cases are much higher than for consumer contracts.
**Decision**: The app supports only everyday consumer contracts (gym, mobile, internet, streaming, insurance, newspaper, electricity). There is no Miete, Arbeitsvertrag or B2B option.
**Alternatives**: Support them with extra warnings. Rejected because one mistake can invalidate the cancellation, and the guidance needed comes close to legal advice (see ADR-0004).
**Consequences**:
- \+ Smaller, safer template set; the product stays focused.
- − Users with those needs must go elsewhere. The app can point them to the Mieterverein, a lawyer or the Verbraucherzentrale.
