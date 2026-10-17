import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import App from './App'
import { downloadPdf } from './pdf'

vi.mock('./pdf', () => ({ downloadPdf: vi.fn() }))

it('enables the download only when required fields are filled, and the preview follows the form', async () => {
  const user = userEvent.setup()
  render(<App />)
  const button = screen.getByRole('button', { name: 'PDF herunterladen' })
  expect(button).toBeDisabled()
  expect(screen.getByRole('note')).toHaveTextContent('Keine Rechtsberatung')

  await user.type(screen.getByLabelText('Ihr Name'), 'Jana Müller')
  await user.type(screen.getByLabelText('Ihre Adresse (Straße, PLZ Ort)'), 'Lindenstraße 5{enter}10115 Berlin')
  await user.type(screen.getByLabelText('Name des Fitnessstudios'), 'FitWerk GmbH')
  await user.type(screen.getByLabelText('Adresse des Fitnessstudios'), 'Sportweg 1{enter}10117 Berlin')
  await user.type(screen.getByLabelText('Mitgliedsnummer'), '4711')
  expect(button).toBeDisabled()
  expect(screen.getByText(/Bitte noch ausfüllen/)).toHaveTextContent('Ort (für die Datumszeile)')

  await user.type(screen.getByLabelText('Ort (für die Datumszeile)'), 'Berlin')
  expect(button).toBeEnabled()
  expect(screen.getByRole('article', { name: 'Vorschau' })).toHaveTextContent('Mitgliedsnummer 4711')

  await user.click(button)
  await vi.waitFor(() => expect(downloadPdf).toHaveBeenCalledWith(expect.objectContaining({ recipient: ['FitWerk GmbH', 'Sportweg 1', '10117 Berlin'] })))
})
