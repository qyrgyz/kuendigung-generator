import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import App from './App'

// No mock of ./pdf here: the real jsPDF code runs and hands a Blob to the browser download
afterEach(() => vi.restoreAllMocks())

it('clicking the download button produces a PDF file named after the provider', async () => {
  const blobs: Blob[] = []
  URL.createObjectURL = vi.fn((b: Blob) => (blobs.push(b), 'blob:pdf'))
  URL.revokeObjectURL = vi.fn()
  const clicked: HTMLAnchorElement[] = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    clicked.push(this)

  })

  const user = userEvent.setup()
  render(<App />)
  await user.type(screen.getByLabelText('Your name'), 'Jürgen Weiß')
  await user.type(screen.getByLabelText('Your address (street, postcode city)'), 'Große Straße 3{enter}80331 München')
  await user.type(screen.getByLabelText('Provider name'), 'Ökostrom Süd GmbH')
  await user.type(screen.getByLabelText('Provider address'), 'Äußere Ringstraße 9{enter}70173 Stuttgart')
  await user.type(screen.getByLabelText('Customer or contract number'), 'K-123')
  await user.type(screen.getByLabelText('Place (for the date line)'), 'München')
  await user.click(screen.getByRole('button', { name: 'Download PDF' }))

  await vi.waitFor(() => expect(blobs).toHaveLength(1), { timeout: 5000 })
  // jsdom's Blob has no arrayBuffer(); a binary string keeps the WinAnsi bytes as Latin-1 chars
  const pdf = await new Promise<string>((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.readAsBinaryString(blobs[0])
  })
  expect(blobs[0].type).toBe('application/pdf')
  expect(pdf.startsWith('%PDF')).toBe(true)
  for (const s of ['Jürgen Weiß', 'Große Straße 3', 'Ökostrom Süd GmbH', 'Äußere Ringstraße 9', 'Mit freundlichen Grüßen'])
    expect(pdf).toContain(s)
  expect(clicked.at(-1)?.download).toBe('Kuendigung_Oekostrom_Sued_GmbH.pdf')
}, 20_000)
