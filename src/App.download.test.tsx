import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import App from './App'
import { pdfText } from './test-pdf-text'

// No mock of ./pdf here: the real jsPDF code runs and hands a Blob to the browser download
afterEach(() => vi.restoreAllMocks())

it('clicking the download button produces a PDF file, without sending or storing anything', async () => {
  const blobs: Blob[] = []
  // privacy (ADR-0001): filling in the form and downloading sends nothing and stores nothing
  const fetchSpy = vi.spyOn(globalThis, 'fetch')
  const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, 'open')
  const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
  URL.createObjectURL = vi.fn((b: Blob) => (blobs.push(b), 'blob:pdf'))
  URL.revokeObjectURL = vi.fn()
  const clicked: HTMLAnchorElement[] = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    clicked.push(this)

  })

  const user = userEvent.setup()
  render(<App />)
  await user.type(screen.getByRole('textbox', { name: 'Your name' }), 'Jürgen Weiß')
  await user.type(screen.getByRole('textbox', { name: 'Your address (street, postcode city)' }), 'Große Straße 3{enter}80331 München')
  await user.type(screen.getByRole('combobox', { name: 'Provider name' }), 'Ökostrom Süd GmbH')
  await user.type(screen.getByRole('textbox', { name: 'Provider address' }), 'Äußere Ringstraße 9{enter}70173 Stuttgart')
  await user.type(screen.getByRole('textbox', { name: 'Membership number' }), 'K-123')
  await user.type(screen.getByRole('textbox', { name: 'Place (for the date line)' }), 'München')
  await user.click(screen.getByRole('button', { name: 'Download PDF' }))

  await vi.waitFor(() => expect(blobs).toHaveLength(1), { timeout: 5000 })
  expect(fetchSpy).not.toHaveBeenCalled()
  expect(xhrSpy).not.toHaveBeenCalled()
  expect(storageSpy).not.toHaveBeenCalled()
  expect(document.cookie).toBe('')

  // jsdom's Blob has no arrayBuffer(), so read it with FileReader
  const bytes = await new Promise<ArrayBuffer>((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as ArrayBuffer)
    r.readAsArrayBuffer(blobs[0])
  })
  expect(blobs[0].type).toBe('application/pdf')
  const pdf = await pdfText(bytes)
  for (const s of ['Jürgen Weiß', 'Große Straße 3', 'Ökostrom Süd GmbH', 'Äußere Ringstraße 9', 'Mit freundlichen Grüßen'])
    expect(pdf).toContain(s)
  expect(clicked.at(-1)?.download).toBe('Kuendigung_Oekostrom_Sued_GmbH.pdf')
}, 20_000)
