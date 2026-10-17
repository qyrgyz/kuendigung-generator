import { describe, expect, it } from 'vitest'
import { buildLetter, missingFields, type LetterData } from './letter'

const data: LetterData = {
  senderName: 'Jana Müller',
  senderAddress: 'Lindenstraße 5\n10115 Berlin',
  providerName: 'FitWerk GmbH',
  providerAddress: 'Sportweg 1\n10117 Berlin',
  memberNumber: '4711',
  endDate: '',
  place: 'Berlin',
}
const today = new Date(2026, 9, 17)
const text = (l: ReturnType<typeof buildLetter>) =>
  [...l.sender, ...l.recipient, l.dateLine, l.subject, ...l.paragraphs, ...l.closing].join('\n')

describe('buildLetter', () => {
  it('contains every element the PRD requires', () => {
    const t = text(buildLetter(data, today))
    expect(t).toContain('Jana Müller')
    expect(t).toContain('Lindenstraße 5')
    expect(t).toContain('FitWerk GmbH')
    expect(t).toContain('Sportweg 1')
    expect(t).toContain('Berlin, 17.10.2026')
    expect(t).toContain('Mitgliedsnummer 4711')
    expect(t).toContain('hiermit kündige ich')
    expect(t).toContain('bestätigen Sie mir den Eingang')
    expect(t).toContain('Vertragsende')
    expect(t).toContain('Mit freundlichen Grüßen')
  })

  it('defaults to the next possible date', () => {
    const t = text(buildLetter(data, today))
    expect(t).toContain('fristgerecht zum nächstmöglichen Zeitpunkt.')
    expect(t).not.toContain('hilfsweise')
  })

  it('uses a fixed date with the next possible date as fallback', () => {
    const t = text(buildLetter({ ...data, endDate: '2027-01-31' }, today))
    expect(t).toContain('zum 31.01.2027, hilfsweise zum nächstmöglichen Zeitpunkt.')
  })

  it('splits addresses into trimmed, non-empty lines', () => {
    const l = buildLetter({ ...data, senderAddress: ' Lindenstraße 5 \n\n10115 Berlin ' }, today)
    expect(l.sender).toEqual(['Jana Müller', 'Lindenstraße 5', '10115 Berlin'])
  })
})

describe('missingFields', () => {
  it('lists blank required fields and ignores the optional end date', () => {
    expect(missingFields(data)).toEqual([])
    expect(missingFields({ ...data, memberNumber: '  ', place: '' })).toEqual(['memberNumber', 'place'])
  })
})
