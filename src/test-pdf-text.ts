import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

/** Text of each page as a PDF reader extracts it, one line per text run. */
export async function pdfPages(data: ArrayBuffer): Promise<string[]> {
  const doc = await getDocument({ data: new Uint8Array(data), verbosity: 0 }).promise
  const pages: string[] = []
  for (let n = 1; n <= doc.numPages; n++) {
    const { items } = await (await doc.getPage(n)).getTextContent()
    pages.push(items.map((i) => ('str' in i ? i.str + (i.hasEOL ? '\n' : '') : '')).join(''))
  }
  return pages
}

export const pdfText = async (data: ArrayBuffer) => (await pdfPages(data)).join('\n')
