import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import App from './App'
import { downloadPdf } from './pdf'

vi.mock('./pdf', () => ({ downloadPdf: vi.fn() }))

const preview = () => screen.getByRole('article', { name: 'Kündigungsschreiben' })

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Your name/), 'Jana Müller')
  await user.type(screen.getByLabelText(/^Your address/), 'Lindenstraße 5{enter}10115 Berlin')
  await user.type(screen.getByLabelText(/^Provider name/), 'Telefonica GmbH')
  await user.type(screen.getByLabelText(/^Provider address/), 'Postfach 1{enter}90345 Nürnberg')
  await user.type(screen.getByLabelText(/^Membership number/), 'K-123')
  await user.type(screen.getByLabelText(/^Place/), 'Berlin')
}

it('switches the UI language while the letter stays German', async () => {
  const user = userEvent.setup()
  render(<App />) // jsdom reports en-US, so the UI starts in English
  expect(screen.getByText('Not legal advice.')).toBeInTheDocument()
  expect(screen.getByText(/Einschreiben mit Rückschein/)).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Deutsch' }))
  expect(screen.getByText('Keine Rechtsberatung.')).toBeInTheDocument()
  expect(screen.getByLabelText(/^Mitgliedsnummer/)).toBeInTheDocument()
  expect(preview()).toHaveTextContent('Mit freundlichen Grüßen')
  await user.click(screen.getByRole('button', { name: 'English' }))
  expect(screen.getByLabelText(/^Membership number/)).toBeInTheDocument()
})

it('builds the letter from the form and downloads it', async () => {
  const user = userEvent.setup()
  render(<App />)
  await fillRequired(user)
  await user.selectOptions(screen.getByLabelText('Contract type'), 'Mobile phone')
  expect(preview()).toHaveTextContent('Kündigung Mobilfunkvertrag – Rufnummer/Kundennummer K-123')
  expect(preview()).toHaveTextContent('zum nächstmöglichen Termin')

  await user.click(screen.getByLabelText('Extraordinary / special right to cancel'))
  await user.selectOptions(screen.getByLabelText('Reason'), 'Moving house')
  expect(preview()).toHaveTextContent('Anlass der Kündigung ist mein Umzug.')

  await user.click(screen.getByLabelText('Revoke SEPA direct-debit mandate'))
  await user.click(screen.getByLabelText('Revoke consent to advertising and data use'))
  expect(preview()).not.toHaveTextContent('SEPA-Lastschriftmandat')
  expect(preview()).toHaveTextContent('Einwilligung')

  await user.click(screen.getByRole('button', { name: 'Download PDF' }))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  await vi.waitFor(() =>
    expect(downloadPdf).toHaveBeenCalledWith(expect.objectContaining({ recipient: ['Telefonica GmbH', 'Postfach 1', '90345 Nürnberg'] })),
  )
})

it('blocks an incomplete download with an announced message and focus on the first missing field', async () => {
  vi.mocked(downloadPdf).mockClear()
  const user = userEvent.setup()
  render(<App />)
  // no announcements while the user is still typing
  await user.type(screen.getByLabelText(/^Your name/), 'Jana')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()

  const button = screen.getByRole('button', { name: 'Download PDF' })
  expect(button).toBeEnabled() // stays in the tab order for keyboard and screen-reader users
  await user.click(button)
  expect(downloadPdf).not.toHaveBeenCalled()
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Still needed: Your address (street, postcode city), Provider name, Provider address, Membership number, Place (for the date line)',
  )
  const address = screen.getByLabelText(/^Your address/)
  expect(address).toHaveFocus()
  expect(address).toBeInvalid()
  expect(address).toHaveAccessibleDescription(/^Still needed:/)
  expect(screen.getByLabelText(/^Your name/)).not.toBeInvalid()

  await user.click(screen.getByRole('button', { name: 'Deutsch' }))
  expect(screen.getByRole('alert')).toHaveTextContent(/^Bitte noch ausfüllen: Ihre Adresse/)
  await user.click(screen.getByRole('button', { name: 'English' }))

  await user.type(screen.getByLabelText(/^Your address/), 'Lindenstraße 5')
  await user.type(screen.getByLabelText(/^Provider name/), 'FitWerk GmbH')
  await user.type(screen.getByLabelText(/^Provider address/), 'Sportweg 1')
  await user.type(screen.getByLabelText(/^Membership number/), '4711')
  expect(screen.getByRole('alert')).toHaveTextContent('Still needed: Place (for the date line)')

  // whitespace alone does not count as filled in
  await user.type(screen.getByLabelText(/^Place/), '   ')
  expect(screen.getByRole('alert')).toHaveTextContent('Place (for the date line)')
  await user.type(screen.getByLabelText(/^Place/), 'Berlin')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()

  await user.click(screen.getByLabelText('Extraordinary / special right to cancel'))
  await user.selectOptions(screen.getByLabelText('Reason'), 'Other reason')
  await user.click(button)
  expect(screen.getByRole('alert')).toHaveTextContent('Still needed: Reason in your own words (in German)')
  expect(screen.getByLabelText(/^Reason in your own words/)).toHaveFocus()
  expect(downloadPdf).not.toHaveBeenCalled()
})

it('marks required fields visually and names the new-tab link for screen readers', () => {
  render(<App />)
  expect(screen.getByText('* Required')).toHaveAttribute('aria-hidden', 'true')
  // the asterisk is aria-hidden, so the accessible name stays clean
  expect(screen.getByRole('textbox', { name: 'Your name' })).toBeRequired()
  expect(screen.getByRole('textbox', { name: 'Your name' })).toHaveAttribute('autocomplete', 'name')
  expect(screen.getByRole('link', { name: /Verbraucherzentrale .*\(opens in a new tab\)/ })).toHaveAttribute('target', '_blank')
})

it('dates the letter on the day of the download, even if the tab stayed open overnight', async () => {
  vi.mocked(downloadPdf).mockClear()
  vi.useFakeTimers({ toFake: ['Date'] }) // only the clock; userEvent keeps real timers
  vi.setSystemTime(new Date(2026, 9, 17, 23, 50))
  try {
    const user = userEvent.setup()
    render(<App />)
    await fillRequired(user)
    vi.setSystemTime(new Date(2026, 9, 18, 8, 0))
    await user.click(screen.getByRole('button', { name: 'Download PDF' }))
    await vi.waitFor(() => expect(downloadPdf).toHaveBeenCalledWith(expect.objectContaining({ dateLine: 'Berlin, 18.10.2026' })))
  } finally {
    vi.useRealTimers()
  }
})

it('names the contract number field after the contract type, in both languages', async () => {
  const user = userEvent.setup()
  render(<App />)
  expect(screen.getByRole('textbox', { name: 'Membership number' })).toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('Contract type'), 'Insurance')
  expect(screen.getByRole('textbox', { name: 'Policy number' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Deutsch' }))
  expect(screen.getByRole('textbox', { name: 'Versicherungsscheinnummer' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'PDF herunterladen' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Versicherungsscheinnummer')
})

it('fills the address when a known provider is picked, and keeps manual edits', async () => {
  const user = userEvent.setup()
  render(<App />)
  const name = screen.getByRole('combobox', { name: 'Provider name' })
  const address = screen.getByRole('textbox', { name: 'Provider address' })

  await user.type(name, 'Unbekannte GmbH')
  expect(address).toHaveValue('')

  await user.clear(name)
  await user.type(name, 'Vodafone GmbH') // what choosing the suggestion enters
  expect(address).toHaveValue('Kundenservice\n40875 Ratingen')
  expect(screen.getByText(/legal notice \(Impressum\), as of/)).toBeInTheDocument()
  expect(preview()).toHaveTextContent('Vodafone GmbH Kundenservice 40875 Ratingen')

  await user.type(address, '{enter}Postfach 1')
  expect(address).toHaveValue('Kundenservice\n40875 Ratingen\nPostfach 1')
  expect(screen.queryByText(/legal notice \(Impressum\)/)).not.toBeInTheDocument()
})

it('adds an optional drawn signature to the letter and can clear it', async () => {
  vi.mocked(downloadPdf).mockClear()
  const user = userEvent.setup()
  render(<App />)
  const clear = screen.getByRole('button', { name: 'Clear signature' })
  expect(clear).toBeDisabled()

  await user.pointer({ keys: '[MouseLeft]', target: screen.getByRole('img', { name: 'Signature pad' }) })
  expect(clear).toBeEnabled()
  expect(screen.getByRole('img', { name: 'Unterschrift' })).toBeInTheDocument()

  await fillRequired(user)
  await user.click(screen.getByRole('button', { name: 'Download PDF' }))
  await vi.waitFor(() =>
    expect(downloadPdf).toHaveBeenCalledWith(expect.objectContaining({ signature: expect.stringMatching(/^data:image\/png;base64,/) })),
  )

  await user.click(clear)
  expect(screen.queryByRole('img', { name: 'Unterschrift' })).not.toBeInTheDocument()
  expect(clear).toBeDisabled()
})
