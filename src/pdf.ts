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

export function downloadPdf(l: Letter): void {
  const name = l.recipient[0].replace(/[^A-Za-z0-9-]+/g, '_')
  letterPdf(l).save(`Kuendigung_${name}.pdf`)
}
