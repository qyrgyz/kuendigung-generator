import { describe, expect, it } from 'vitest'
import { buildLetter, EMPTY_LETTER_DATA, missingFields, type LetterData } from './letter'

const data: LetterData = {
  ...EMPTY_LETTER_DATA,
  senderName: 'Jana Müller',
  senderAddress: 'Lindenstraße 5\n10115 Berlin',
  providerName: 'FitWerk GmbH',
  providerAddress: 'Sportweg 1\n10117 Berlin',
  contractNumber: '4711',
  place: 'Berlin',
}
const today = new Date(2026, 9, 17)
const text = (d: Partial<LetterData> = {}) => {
  const l = buildLetter({ ...data, ...d }, today)
  return [...l.sender, ...l.recipient, l.dateLine, l.subject, ...l.paragraphs, ...l.closing].join('\n')
}

describe('buildLetter', () => {
  it('contains every required element', () => {
    const t = text()
    for (const s of [
      'Jana Müller\nLindenstraße 5\n10115 Berlin',
      'FitWerk GmbH\nSportweg 1\n10117 Berlin',
      'Berlin, 17.10.2026',
      'Kündigung Mitgliedschaft – Kunden-/Vertragsnummer 4711',
      'Bitte bestätigen Sie mir den Eingang dieser Kündigung und den Zeitpunkt, zu dem sie wirksam wird, schriftlich.',
      'Mit freundlichen Grüßen',
      '______________________________\nJana Müller',
    ])
      expect(t).toContain(s)
  })

  it('names the contract type in subject and termination sentence', () => {
    const t = text({ contractType: 'mobile' })
    expect(t).toContain('Kündigung Mobilfunkvertrag – Kunden-/Vertragsnummer 4711')
    expect(t).toContain('hiermit kündige ich meinen Mobilfunkvertrag (Kunden-/Vertragsnummer 4711)')
  })

  it('ordinary: next possible date', () => {
    expect(text()).toContain('ordentlich und fristgerecht zum nächstmöglichen Termin.')
  })

  it('fixed date: formatted German date with fallback', () => {
    expect(text({ terminationType: 'date', endDate: '2027-01-31' })).toContain(
      'fristgerecht zum 31.01.2027, hilfsweise zum nächstmöglichen Termin.',
    )
  })

  it('extraordinary: preset or free-text reason, with ordinary fallback', () => {
    const price = text({ terminationType: 'extraordinary', reason: 'priceIncrease' })
    expect(price).toContain('außerordentlich zum frühestmöglichen Zeitpunkt, hilfsweise ordentlich zum nächstmöglichen Termin.')
    expect(price).toContain('Preiserhöhung')
    expect(text({ terminationType: 'extraordinary', reason: 'move' })).toContain('Sonderkündigungsrecht wegen Umzugs')
    expect(text({ terminationType: 'extraordinary', reason: 'other', reasonText: ' Studio geschlossen ' })).toContain(
      'Grund der Kündigung: Studio geschlossen',
    )
    expect(text()).not.toContain('Grund')
  })

  it('includes optional clauses only when chosen', () => {
    expect(text({ revokeSepa: true })).toContain('SEPA-Lastschriftmandat')
    expect(text({ revokeSepa: false })).not.toContain('SEPA-Lastschriftmandat')
    expect(text({ revokeConsent: true })).toContain('Einwilligung')
    expect(text({ revokeConsent: false })).not.toContain('Einwilligung')
  })

  it('splits addresses into trimmed, non-empty lines', () => {
    const l = buildLetter({ ...data, senderAddress: ' Lindenstraße 5 \n\n10115 Berlin ' }, today)
    expect(l.sender).toEqual(['Jana Müller', 'Lindenstraße 5', '10115 Berlin'])
  })
})

describe('missingFields', () => {
  it('lists blank required fields', () => {
    expect(missingFields(data)).toEqual([])
    expect(missingFields({ ...data, contractNumber: '  ', place: '' })).toEqual(['contractNumber', 'place'])
  })

  it('requires the date or reason text only when relevant', () => {
    expect(missingFields({ ...data, terminationType: 'date' })).toEqual(['endDate'])
    expect(missingFields({ ...data, terminationType: 'extraordinary', reason: 'other' })).toEqual(['reasonText'])
    expect(missingFields({ ...data, terminationType: 'extraordinary', reason: 'move' })).toEqual([])
  })
})
