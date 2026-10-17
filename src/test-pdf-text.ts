import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

/** Text of page 1 as a PDF reader extracts it, one line per text run. */
export async function pdfText(data: ArrayBuffer): Promise<string> {
  const doc = await getDocument({ data: new Uint8Array(data), verbosity: 0 }).promise
  const { items } = await (await doc.getPage(1)).getTextContent()
  return items.map((i) => ('str' in i ? i.str + (i.hasEOL ? '\n' : '') : '')).join('')
}
