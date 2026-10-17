import { expect, it, vi } from 'vitest'
import { buildLetter, EMPTY_LETTER_DATA, type LetterData } from './letter'
import { downloadPdf, letterPdf } from './pdf'
import { pdfText } from './test-pdf-text'

const text = async (d: Partial<LetterData>) =>
  pdfText(letterPdf(buildLetter({ ...EMPTY_LETTER_DATA, contractNumber: '4711', place: 'Berlin', ...d })).output('arraybuffer'))

it('produces a PDF whose extracted text keeps umlauts and ß', async () => {
  const out = await text({
    senderName: 'Jana Müller',
    senderAddress: 'Lindenstraße 5\n10115 Berlin',
    providerName: 'FitWerk GmbH',
    providerAddress: 'Sportweg 1\n10117 Berlin',
  })
  for (const s of ['Jana Müller', 'Lindenstraße 5', 'Vertragsnummer 4711', 'Kündigung Mitgliedschaft – Kunden-/Vertragsnummer 4711', 'Mit freundlichen Grüßen'])
    expect(out).toContain(s)
})

it('keeps names and addresses outside Latin-1 (Polish, Turkish, Czech, Romanian, Vietnamese)', async () => {
  const out = await text({
    senderName: 'Łukasz Wójcik',
    senderAddress: 'Křižíkova 5\n186 00 Praha',
    providerName: 'Şahin Enerji Ştefănescu SRL',
    providerAddress: 'Đường Nguyễn Huệ 1\nHồ Chí Minh',
  })
  for (const s of ['Łukasz Wójcik', 'Křižíkova 5', 'Şahin Enerji Ştefănescu SRL', 'Đường Nguyễn Huệ 1', 'Hồ Chí Minh']) expect(out).toContain(s)
})

it.each([
  ['Ökostrom Süd GmbH', 'Kuendigung_Oekostrom_Sued_GmbH.pdf'],
  ['Café Größe & Co.', 'Kuendigung_Cafe_Groesse_Co.pdf'],
  ['Łódź Telekom', 'Kuendigung_Lodz_Telekom.pdf'],
  ['株式会社', 'Kuendigung.pdf'],
])('names the downloaded file safely: %s', async (provider, file) => {
  URL.createObjectURL = vi.fn(() => 'blob:pdf')
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  downloadPdf(buildLetter({ ...EMPTY_LETTER_DATA, providerName: provider }))
  await vi.waitFor(() => expect((click.mock.contexts[0] as HTMLAnchorElement)?.download).toBe(file))
  click.mockRestore()
})
