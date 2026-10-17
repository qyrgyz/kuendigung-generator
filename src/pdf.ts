import { jsPDF } from 'jspdf'
import bold from './fonts/NotoSans-Bold.ttf?inline'
import regular from './fonts/NotoSans-Regular.ttf?inline'
import type { Letter } from './letter'

// DIN 5008 (Form B) positions in mm
const LEFT = 25
const RIGHT = 190
const WIDTH = RIGHT - LEFT
const LINE = 5
const TOP = 20
const BOTTOM = 277 // 20 mm bottom margin on 297 mm A4
// Noto Sans subset (Latin, Latin Extended A/B and Additional, see src/fonts): built-in Helvetica only covers
// WinAnsi, so names like Łukasz or Şahin came out garbled. Inlined here, so it ships only in this lazy chunk.
const FONT = 'NotoSans'
const base64 = (dataUrl: string) => dataUrl.slice(dataUrl.indexOf(',') + 1)

export function letterPdf(l: Letter): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.addFileToVFS('NotoSans-Regular.ttf', base64(regular))
  doc.addFont('NotoSans-Regular.ttf', FONT, 'normal')
  doc.addFileToVFS('NotoSans-Bold.ttf', base64(bold))
  doc.addFont('NotoSans-Bold.ttf', FONT, 'bold')
  doc.setFont(FONT, 'normal')
  doc.setFontSize(11)

  doc.text(l.sender, LEFT, TOP, { lineHeightFactor: 1.3 })
  doc.text(l.recipient, LEFT, 50, { lineHeightFactor: 1.3 }) // inside the envelope window
  doc.text(l.dateLine, RIGHT, 100, { align: 'right' })

  doc.setFont(FONT, 'bold')
  doc.text(l.subject, LEFT, 112, { maxWidth: WIDTH })
  doc.setFont(FONT, 'normal')

  // long letters (e.g. a long own reason) continue on a new page instead of running off the bottom
  let y = 125
  const newPageIfBelow = (bottom: number) => {
    if (bottom > BOTTOM) {
      doc.addPage()
      y = TOP
    }
  }
  for (const p of l.paragraphs) {
    for (const line of doc.splitTextToSize(p, WIDTH) as string[]) {
      newPageIfBelow(y)
      doc.text(line, LEFT, y)
      y += LINE
    }
    y += LINE
  }
  newPageIfBelow(y + (l.closing.length - 1) * LINE) // keep greeting and signature on one page
  for (const c of l.closing) {
    doc.text(c, LEFT, y)
    y += LINE
  }
  return doc
}

// letters NFKD does not split into base letter + accent
const ASCII: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss', ł: 'l', Ł: 'L', đ: 'd', Đ: 'D', ø: 'o', Ø: 'O' }
const fileSafe = (s: string) =>
  s
    .replace(/[äöüÄÖÜßłŁđĐøØ]/g, (c) => ASCII[c])
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // é -> e
    .replace(/[^A-Za-z0-9-]+/g, '_')
    .replace(/^_+|_+$/g, '')

// Own <a download> instead of jsPDF's save(): that no-ops under jsdom and writes to disk under its Node build
export function downloadPdf(l: Letter): void {
  const name = fileSafe(l.recipient[0])
  const a = document.createElement('a')
  a.href = URL.createObjectURL(letterPdf(l).output('blob'))
  a.download = `Kuendigung${name && `_${name}`}.pdf`
  a.rel = 'noopener'
  setTimeout(() => a.click(), 0) // deferred like jsPDF/FileSaver; a synchronous click() downloaded ~45 s late in the embedded browser
  setTimeout(() => URL.revokeObjectURL(a.href), 40_000) // some browsers read the blob after click() returns
}
