import { expect, it } from 'vitest'
import { buildLetter } from './letter'
import { letterPdf } from './pdf'

it('produces a PDF that keeps the letter text, umlauts included', () => {
  const letter = buildLetter({
    senderName: 'Jana Müller',
    senderAddress: 'Lindenstraße 5\n10115 Berlin',
    providerName: 'FitWerk GmbH',
    providerAddress: 'Sportweg 1\n10117 Berlin',
    memberNumber: '4711',
    endDate: '',
    place: 'Berlin',
  })
  const out = letterPdf(letter).output()
  expect(out.startsWith('%PDF')).toBe(true)
  expect(out).toContain('Mitgliedsnummer 4711')
  expect(out).toContain('Jana Müller')
  expect(out).toContain('Mit freundlichen Grüßen')
})
