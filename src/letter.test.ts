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

describe('no empty lines or placeholders', () => {
  const minimal: LetterData = { ...data, revokeSepa: false, revokeConsent: false }
  const leaks = /undefined|null|NaN|\s,|:\s*$|\(\s|\s\)|\s{2,}/

  it.each([
    ['ordinary', {}],
    ['fixed date', { terminationType: 'date', endDate: '2027-01-31' }],
    ['extraordinary, preset reason', { terminationType: 'extraordinary', reason: 'priceIncrease' }],
    ['extraordinary, own reason', { terminationType: 'extraordinary', reason: 'other', reasonText: 'Studio geschlossen' }],
  ] as const)('%s with all optional clauses off', (_, d) => {
    const l = buildLetter({ ...minimal, ...d }, today)
    for (const line of [...l.sender, ...l.recipient, l.dateLine, l.subject, ...l.paragraphs]) {
      expect(line.trim()).not.toBe('')
      expect(line).not.toMatch(leaks)
    }
  })

  it('a fixed-date cancellation without a date yet does not render "zum ,"', () => {
    const l = buildLetter({ ...minimal, terminationType: 'date', endDate: '' }, today)
    expect(l.paragraphs.join('\n')).not.toMatch(leaks)
    expect(l.paragraphs[1]).toContain('zum nächstmöglichen Termin')
  })

  it('an own reason left blank adds no empty "Grund" line', () => {
    const l = buildLetter({ ...minimal, terminationType: 'extraordinary', reason: 'other', reasonText: '  ' }, today)
    expect(l.paragraphs.join('\n')).not.toContain('Grund')
    expect(l.paragraphs.every((p) => p.trim())).toBe(true)
  })

  it('keeps the signature gap only in the closing block', () => {
    const l = buildLetter(minimal, today)
    expect(l.closing).toEqual(['Mit freundlichen Grüßen', '', '', '______________________________', 'Jana Müller'])
  })
})

describe('umlauts and ß', () => {
  it('passes user input with ä ö ü Ä Ö Ü ß through unchanged', () => {
    const l = buildLetter(
      {
        ...data,
        senderName: 'Jürgen Weiß',
        senderAddress: 'Große Straße 3\n80331 München',
        providerName: 'Ökostrom Süd GmbH',
        providerAddress: 'Äußere Ringstraße 9\n70173 Stuttgart',
        contractNumber: 'ÜÄÖ-ß1',
        place: 'München',
        terminationType: 'extraordinary',
        reason: 'other',
        reasonText: 'Schließung der Filiale',
      },
      today,
    )
    expect(l.sender).toEqual(['Jürgen Weiß', 'Große Straße 3', '80331 München'])
    expect(l.recipient).toEqual(['Ökostrom Süd GmbH', 'Äußere Ringstraße 9', '70173 Stuttgart'])
    expect(l.dateLine).toBe('München, 17.10.2026')
    expect(l.subject).toContain('ÜÄÖ-ß1')
    expect(l.paragraphs).toContain('Grund der Kündigung: Schließung der Filiale')
    expect(l.closing.at(-1)).toBe('Jürgen Weiß')
  })
})
