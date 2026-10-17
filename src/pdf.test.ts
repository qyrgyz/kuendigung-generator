import { expect, it, vi } from 'vitest'
import { buildLetter, EMPTY_LETTER_DATA } from './letter'
import { downloadPdf, letterPdf } from './pdf'

it('produces a PDF that keeps the letter text, umlauts included', () => {
  const letter = buildLetter({
    ...EMPTY_LETTER_DATA,
    senderName: 'Jana Müller',
    senderAddress: 'Lindenstraße 5\n10115 Berlin',
    providerName: 'FitWerk GmbH',
    providerAddress: 'Sportweg 1\n10117 Berlin',
    contractNumber: '4711',
    place: 'Berlin',
  })
  const out = letterPdf(letter).output()
  expect(out.startsWith('%PDF')).toBe(true)
  expect(out).toContain('Vertragsnummer 4711')
  expect(out).toContain('Jana Müller')
  expect(out).toContain('Mit freundlichen Grüßen')
})

it.each([
  ['Ökostrom Süd GmbH', 'Kuendigung_Oekostrom_Sued_GmbH.pdf'],
  ['Café Größe & Co.', 'Kuendigung_Cafe_Groesse_Co.pdf'],
  ['株式会社', 'Kuendigung.pdf'],
])('names the downloaded file safely: %s', async (provider, file) => {
  URL.createObjectURL = vi.fn(() => 'blob:pdf')
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  downloadPdf(buildLetter({ ...EMPTY_LETTER_DATA, providerName: provider }))
  await vi.waitFor(() => expect((click.mock.contexts[0] as HTMLAnchorElement)?.download).toBe(file))
  click.mockRestore()
})
