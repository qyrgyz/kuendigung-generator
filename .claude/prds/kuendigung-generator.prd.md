# Kündigung Generator

## Problem
People in Germany, especially expats with limited German, struggle to cancel everyday consumer contracts. Their letters use unclear wording and leave out key details: customer or contract number, the termination date, and a request for written confirmation. They also miss notice periods or send the letter in a way they can't prove later. When that happens, the cancellation can be rejected or questioned, and the contract keeps billing them, often for months.

## Evidence
- Assumption — needs validation via user interviews (5–8 expats, e.g. recruited through expat forums or Facebook groups) and a review of common rejection reasons for cancellations.
- Assumption — existing generators are ad-heavy, German-only, or collect personal data. Needs validation via a competitor scan.

## Users
- **Primary**: A consumer living in Germany, often an expat with A1–B1 German, who wants to end a gym, mobile phone, internet, streaming, insurance, newspaper or electricity contract. The trigger is usually moving, switching provider or a price increase.
- **Not for**: Businesses (B2B), landlords or tenants (Miete), employers or employees (Arbeitsvertrag), or anyone who needs a lawyer's advice on a dispute.

## Hypothesis
We believe that **a guided, bilingual form that produces a complete German cancellation letter as a PDF** will **stop users from omitting details and using unclear wording** for **consumers in Germany cancelling everyday contracts**.
We'll know we're right when **≥90% of usability-test participants produce a complete, correct letter in under 5 minutes without outside help**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Task success (primary) | ≥90% finish a complete letter in under 5 min | Moderated usability test, n ≥ 10, at least half with limited German |
| Letter completeness | 100% of generated letters contain all required elements* | Checklist review of a test letter for each contract type |
| Perceived confidence | ≥4/5 "I'd send this as-is" | Post-test survey |
| Data leaving the device | 0 requests carrying form data | Network inspection during QA |

\*Required elements: sender and recipient address, date, customer or contract number, an unambiguous cancellation sentence, the termination date (fixed date or "zum nächstmöglichen Zeitpunkt"), a request for written confirmation of receipt and end date, and a signature line.

The app sends no data, so live usage analytics are not available by design. See Open Questions.

## Scope
**MVP**: The user picks one of 7 contract types, fills a short form with the UI in German or English, sees a live preview of the German letter, and downloads it as a PDF. Each field has help text, for example where to find the customer number. A short checklist explains how to send the letter: Einschreiben with Rückschein, or a dated fax or email for proof. Every screen shows a "not legal advice" notice. The PDF does not, because the provider receives it (see ADR-0004).

**Not legal advice (product stance)**: The app is a writing aid. It does not check whether a cancellation is valid, does not calculate binding deadlines, and does not replace a Verbraucherzentrale or a lawyer. The app says this plainly before the user downloads, and it links to the Verbraucherzentrale for disputes.

**Out of scope**
- Sending the letter (post, fax, email): needs a backend and creates liability.
- Legal advice or deadline guarantees: liability risk, and not the product's role.
- B2B, rental (Miete) and employment (Arbeitsvertrag) cancellations: different legal rules and higher stakes.
- Accounts, saved drafts, and storing or sending any data: privacy is a core promise.
- Letters in languages other than German: providers expect German.

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Letter core | A user can make a correct PDF for one contract type in German | in-progress | .claude/plans/kuendigung-generator.plan.md |
| 2 | All types + bilingual UI | All 7 types, with an English and German UI and field help | in-progress | — |
| 3 | Send-safely guidance + validation | Einschreiben checklist, legal notice, and usability test against the metrics | pending | — |

## Open Questions
- [ ] Should the app suggest an end date from the notice period (for example, one month once the minimum term is over, under the 2022 rules), or always default to "zum nächstmöglichen Zeitpunkt"? This affects liability.
- [ ] Should the app support Sonderkündigung (price increase, moving house) as a separate reason with its own wording?
- [ ] Do we need any post-launch metric, such as an opt-in feedback link or a privacy-friendly page-view counter, given that the app collects no data?
- [ ] Who reviews the letter templates for legal soundness before launch?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A template's wording is legally weak for a contract type | Med | High | External review of templates; default to "nächstmöglicher Zeitpunkt" |
| Users read the tool as legal advice | Med | Med | A visible notice before download, plus a Verbraucherzentrale link |
| Users miss their deadline anyway | Med | Med | Advise sending early, with proof of delivery |
| Without analytics we can't tell whether the tool helps | High | Low | Usability tests and an opt-in feedback channel |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
