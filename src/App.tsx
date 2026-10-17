import { useState } from 'react'
import { STRINGS, type Lang } from './i18n'
import { buildLetter, CONTRACT_TYPES, EMPTY_LETTER_DATA, missingFields, type Letter, type LetterData } from './letter'

type TextKey = 'senderName' | 'senderAddress' | 'providerName' | 'providerAddress' | 'contractNumber' | 'place' | 'reasonText'

// Form data lives only in React state: never stored or sent anywhere (ADR-0001)
export default function App() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('de') ? 'de' : 'en'))
  const [data, setData] = useState(EMPTY_LETTER_DATA)
  const t = STRINGS[lang]
  const letter = buildLetter(data)
  const missing = missingFields(data)
  const set = <K extends keyof LetterData>(k: K, v: LetterData[K]) => setData((d) => ({ ...d, [k]: v }))

  const textField = (k: TextKey, rows?: number) => (
    <p>
      <label htmlFor={k}>{t.fields[k]}</label>
      {rows ? (
        <textarea id={k} rows={rows} required value={data[k]} onChange={(e) => set(k, e.target.value)} />
      ) : (
        <input id={k} required value={data[k]} onChange={(e) => set(k, e.target.value)} />
      )}
    </p>
  )

  return (
    <main lang={lang}>
      <header>
        <h1>{t.title}</h1>
        <button type="button" lang={lang === 'de' ? 'en' : 'de'} onClick={() => setLang(lang === 'de' ? 'en' : 'de')}>
          {t.switchLabel}
        </button>
      </header>

      <aside className="note warn">
        <strong>{t.disclaimerTitle}</strong> {t.disclaimer}{' '}
        <a href="https://www.verbraucherzentrale.de/" target="_blank" rel="noopener noreferrer">
          {t.consumerCentre}
        </a>
        .
      </aside>

      <div className="layout">
        <form onSubmit={(e) => e.preventDefault()}>
          {textField('senderName')}
          {textField('senderAddress', 2)}
          {textField('providerName')}
          {textField('providerAddress', 2)}
          <p>
            <label htmlFor="contractType">{t.fields.contractType}</label>
            <select
              id="contractType"
              value={data.contractType}
              onChange={(e) => set('contractType', e.target.value as LetterData['contractType'])}
            >
              {CONTRACT_TYPES.map((c) => (
                <option key={c} value={c}>
                  {t.contractTypes[c]}
                </option>
              ))}
            </select>
          </p>
          {textField('contractNumber')}

          <fieldset>
            <legend>{t.fields.terminationType}</legend>
            {(['ordinary', 'date', 'extraordinary'] as const).map((tt) => (
              <label key={tt} className="choice">
                <input
                  type="radio"
                  name="terminationType"
                  checked={data.terminationType === tt}
                  onChange={() => set('terminationType', tt)}
                />
                {t.terminationTypes[tt]}
              </label>
            ))}
            {data.terminationType === 'date' && (
              <p>
                <label htmlFor="endDate">{t.fields.endDate}</label>
                <input id="endDate" type="date" required value={data.endDate} onChange={(e) => set('endDate', e.target.value)} />
              </p>
            )}
            {data.terminationType === 'extraordinary' && (
              <>
                <p>
                  <label htmlFor="reason">{t.fields.reason}</label>
                  <select id="reason" value={data.reason} onChange={(e) => set('reason', e.target.value as LetterData['reason'])}>
                    {(['priceIncrease', 'move', 'other'] as const).map((r) => (
                      <option key={r} value={r}>
                        {t.reasons[r]}
                      </option>
                    ))}
                  </select>
                </p>
                {data.reason === 'other' && textField('reasonText', 2)}
              </>
            )}
          </fieldset>

          <fieldset>
            <legend>{t.optional}</legend>
            {(['revokeSepa', 'revokeConsent'] as const).map((k) => (
              <label key={k} className="choice">
                <input type="checkbox" checked={data[k]} onChange={(e) => set(k, e.target.checked)} />
                {t.fields[k]}
              </label>
            ))}
          </fieldset>

          {textField('place')}

          <button type="button" disabled={missing.length > 0} aria-describedby="missing" onClick={async () => (await import('./pdf')).downloadPdf(letter)}>
            {t.download}
          </button>
          <p id="missing" aria-live="polite">
            {missing.length > 0 && `${t.missing} ${missing.map((k) => t.fields[k]).join(', ')}`}
          </p>
          <aside className="note">
            <strong>{t.tipTitle}</strong> {t.tip}
          </aside>
        </form>

        <section aria-labelledby="preview-title">
          <h2 id="preview-title">{t.preview}</h2>
          <p className="hint">{t.previewNote}</p>
          <Preview letter={letter} />
        </section>
      </div>
    </main>
  )
}

function Preview({ letter }: { letter: Letter }) {
  return (
    <article className="preview" lang="de" aria-label="Kündigungsschreiben">
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
  )
}
