import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import App from './App'
import { downloadPdf } from './pdf'

vi.mock('./pdf', () => ({ downloadPdf: vi.fn() }))

const preview = () => screen.getByRole('article', { name: 'Kündigungsschreiben' })

it('switches the UI language while the letter stays German', async () => {
  const user = userEvent.setup()
  render(<App />) // jsdom reports en-US, so the UI starts in English
  expect(screen.getByText('Not legal advice.')).toBeInTheDocument()
  expect(screen.getByText(/Einschreiben mit Rückschein/)).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Deutsch' }))
  expect(screen.getByText('Keine Rechtsberatung.')).toBeInTheDocument()
  expect(screen.getByLabelText('Kunden- oder Vertragsnummer')).toBeInTheDocument()
  expect(preview()).toHaveTextContent('Mit freundlichen Grüßen')
  await user.click(screen.getByRole('button', { name: 'English' }))
  expect(screen.getByLabelText('Customer or contract number')).toBeInTheDocument()
})

it('builds the letter from the form and enables download once complete', async () => {
  const user = userEvent.setup()
  render(<App />)
  const button = screen.getByRole('button', { name: 'Download PDF' })
  expect(button).toBeDisabled()

  await user.type(screen.getByLabelText('Your name'), 'Jana Müller')
  await user.type(screen.getByLabelText('Your address (street, postcode city)'), 'Lindenstraße 5{enter}10115 Berlin')
  await user.type(screen.getByLabelText('Provider name'), 'Telefonica GmbH')
  await user.type(screen.getByLabelText('Provider address'), 'Postfach 1{enter}90345 Nürnberg')
  await user.selectOptions(screen.getByLabelText('Contract type'), 'Mobile phone')
  await user.type(screen.getByLabelText('Customer or contract number'), 'K-123')
  await user.type(screen.getByLabelText('Place (for the date line)'), 'Berlin')
  expect(button).toBeEnabled()
  expect(preview()).toHaveTextContent('Kündigung Mobilfunkvertrag – Kunden-/Vertragsnummer K-123')
  expect(preview()).toHaveTextContent('zum nächstmöglichen Termin')

  await user.click(screen.getByLabelText('On a specific date'))
  expect(button).toBeDisabled()
  expect(screen.getByText(/Still needed:/)).toHaveTextContent('Cancel on')

  await user.click(screen.getByLabelText('Extraordinary / special right to cancel'))
  await user.selectOptions(screen.getByLabelText('Reason'), 'Moving house')
  expect(preview()).toHaveTextContent('Sonderkündigungsrecht wegen Umzugs')

  await user.click(screen.getByLabelText('Revoke SEPA direct-debit mandate'))
  await user.click(screen.getByLabelText('Revoke consent to advertising and data use'))
  expect(preview()).not.toHaveTextContent('SEPA-Lastschriftmandat')
  expect(preview()).toHaveTextContent('Einwilligung')

  await user.click(button)
  await vi.waitFor(() =>
    expect(downloadPdf).toHaveBeenCalledWith(expect.objectContaining({ recipient: ['Telefonica GmbH', 'Postfach 1', '90345 Nürnberg'] })),
  )
})

it('blocks the download and names every missing required field, in the UI language', async () => {
  const user = userEvent.setup()
  render(<App />)
  const button = screen.getByRole('button', { name: 'Download PDF' })
  expect(button).toBeDisabled()
  expect(button).toHaveAccessibleDescription(
    'Still needed: Your name, Your address (street, postcode city), Provider name, Provider address, Customer or contract number, Place (for the date line)',
  )

  await user.click(screen.getByRole('button', { name: 'Deutsch' }))
  expect(screen.getByRole('button', { name: 'PDF herunterladen' })).toHaveAccessibleDescription(/^Bitte noch ausfüllen: Ihr Name, /)
  await user.click(screen.getByRole('button', { name: 'English' }))

  await user.type(screen.getByLabelText('Your name'), 'Jana Müller')
  await user.type(screen.getByLabelText('Your address (street, postcode city)'), 'Lindenstraße 5')
  await user.type(screen.getByLabelText('Provider name'), 'FitWerk GmbH')
  await user.type(screen.getByLabelText('Provider address'), 'Sportweg 1')
  await user.type(screen.getByLabelText('Customer or contract number'), '4711')
  expect(button).toHaveAccessibleDescription('Still needed: Place (for the date line)')

  // whitespace alone does not count as filled in
  await user.type(screen.getByLabelText('Place (for the date line)'), '   ')
  expect(button).toBeDisabled()
  await user.type(screen.getByLabelText('Place (for the date line)'), 'Berlin')
  expect(button).toBeEnabled()
  expect(button).toHaveAccessibleDescription('')

  await user.click(screen.getByLabelText('Extraordinary / special right to cancel'))
  await user.selectOptions(screen.getByLabelText('Reason'), 'Other reason')
  expect(button).toBeDisabled()
  expect(button).toHaveAccessibleDescription('Still needed: Reason in your own words (in German)')
})
