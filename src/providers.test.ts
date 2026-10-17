import { expect, it } from 'vitest'
import providerData from './providers.json'

it('lists 10 distinct providers, each with a legal name, an address and an official source', () => {
  const { providers, checked } = providerData
  expect(providers).toHaveLength(10)
  expect(checked).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  expect(new Set(providers.map((p) => p.name)).size).toBe(providers.length)
  for (const p of providers) {
    expect(p.brand.trim()).not.toBe('')
    expect(p.name.trim()).not.toBe('')
    expect(p.address.length).toBeGreaterThan(0)
    expect(p.address.at(-1)).toMatch(/\d{4,5} \S|^Schweden$/) // ends with a postcode line (or the country)
    expect(p.source).toMatch(/^https:\/\//)
  }
})
