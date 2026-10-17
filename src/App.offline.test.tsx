import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import App from './App'

// simulates the lazily loaded PDF chunk failing (offline, or stale after a redeploy)
vi.mock('./pdf', () => {
  throw new Error('chunk failed to load')
})

it('tells the user when the PDF cannot be created', async () => {
  const user = userEvent.setup()
  render(<App />)
  for (const [name, value] of [
    ['Your name', 'Jana Müller'],
    ['Your address (street, postcode city)', 'Lindenstraße 5'],
    ['Provider name', 'FitWerk GmbH'],
    ['Provider address', 'Sportweg 1'],
    ['Customer or contract number', '4711'],
    ['Place (for the date line)', 'Berlin'],
  ])
    await user.type(screen.getByRole('textbox', { name }), value)
  await user.click(screen.getByRole('button', { name: 'Download PDF' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('The PDF could not be created. Please reload the page and try again.')
})
