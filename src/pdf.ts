import { jsPDF } from 'jspdf'
import type { Letter } from './letter'

// DIN 5008 (Form B) positions in mm; built-in Helvetica uses WinAnsi, which covers ä ö ü ß
const LEFT = 25
const RIGHT = 190
const WIDTH = RIGHT - LEFT
const LINE = 5

export function letterPdf(l: Letter): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)

  doc.text(l.sender, LEFT, 20, { lineHeightFactor: 1.3 })
  doc.text(l.recipient, LEFT, 50, { lineHeightFactor: 1.3 }) // inside the envelope window
  doc.text(l.dateLine, RIGHT, 100, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.text(l.subject, LEFT, 112, { maxWidth: WIDTH })
  doc.setFont('helvetica', 'normal')

  let y = 125
  for (const p of l.paragraphs) {
    const wrapped: string[] = doc.splitTextToSize(p, WIDTH)
    doc.text(wrapped, LEFT, y)
    y += wrapped.length * LINE + LINE
  }
  for (const c of l.closing) {
    doc.text(c, LEFT, y)
    y += LINE
  }
  return doc
}

const UMLAUT: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss' }
const fileSafe = (s: string) =>
  s
    .replace(/[äöüÄÖÜß]/g, (c) => UMLAUT[c])
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
