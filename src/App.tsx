import { useState } from 'react'
import { buildLetter, missingFields, type LetterData } from './letter'

const FIELDS: { key: keyof LetterData; label: string; type?: 'textarea' | 'date' }[] = [
  { key: 'senderName', label: 'Ihr Name' },
  { key: 'senderAddress', label: 'Ihre Adresse (Straße, PLZ Ort)', type: 'textarea' },
  { key: 'providerName', label: 'Name des Fitnessstudios' },
  { key: 'providerAddress', label: 'Adresse des Fitnessstudios', type: 'textarea' },
  { key: 'memberNumber', label: 'Mitgliedsnummer' },
  { key: 'endDate', label: 'Kündigen zum (leer = nächstmöglicher Zeitpunkt)', type: 'date' },
  { key: 'place', label: 'Ort (für die Datumszeile)' },
]

const EMPTY: LetterData = {
  senderName: '',
  senderAddress: '',
  providerName: '',
  providerAddress: '',
  memberNumber: '',
  endDate: '',
  place: '',
}

// Form data lives only in React state: never stored or sent anywhere (ADR-0001)
export default function App() {
  const [data, setData] = useState(EMPTY)
  const letter = buildLetter(data)
  const missing = missingFields(data)
  const labelOf = (k: keyof LetterData) => FIELDS.find((f) => f.key === k)!.label

  return (
    <main>
      <h1>Kündigung Fitnessstudio</h1>
      <aside role="note" className="disclaimer">
        <strong>Keine Rechtsberatung.</strong> Dieses Tool hilft beim Formulieren eines Kündigungsschreibens. Es prüft
        nicht, ob Ihre Kündigung wirksam ist, und berechnet keine verbindlichen Fristen. Bei Streitfragen wenden Sie sich
        an die{' '}
        <a href="https://www.verbraucherzentrale.de/" target="_blank" rel="noopener noreferrer">
          Verbraucherzentrale
        </a>
        .
      </aside>

      <div className="layout">
        <form onSubmit={(e) => e.preventDefault()}>
          {FIELDS.map(({ key, label, type }) => {
            const props = {
              id: key,
              value: data[key],
              required: key !== 'endDate',
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setData({ ...data, [key]: e.target.value }),
            }
            return (
              <p key={key}>
                <label htmlFor={key}>{label}</label>
                {type === 'textarea' ? <textarea rows={2} {...props} /> : <input type={type ?? 'text'} {...props} />}
              </p>
            )
          })}
          <button type="button" disabled={missing.length > 0} aria-describedby="missing" onClick={async () => (await import('./pdf')).downloadPdf(letter)}>
            PDF herunterladen
          </button>
          <p id="missing" aria-live="polite">
            {missing.length > 0 && `Bitte noch ausfüllen: ${missing.map(labelOf).join(', ')}`}
          </p>
        </form>

        <article aria-label="Vorschau" className="preview" lang="de">
          <p>{letter.sender.join('\n')}</p>
          <p>{letter.recipient.join('\n')}</p>
          <p className="date">{letter.dateLine}</p>
          <p>
            <strong>{letter.subject}</strong>
          </p>
          {letter.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p>{letter.closing.join('\n')}</p>
        </article>
      </div>
    </main>
  )
}
