import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { STRINGS, type Lang } from './i18n'
import providerData from './providers.json'
import { buildLetter, CONTRACT_TYPES, EMPTY_LETTER_DATA, isoDate, missingFields, type Letter, type LetterData } from './letter'

type TextKey = 'senderName' | 'senderAddress' | 'providerName' | 'providerAddress' | 'contractNumber' | 'place' | 'reasonText'

// WCAG 1.3.5: identify the purpose of fields about the user themselves
const AUTOCOMPLETE: Partial<Record<TextKey, string>> = { senderName: 'name', senderAddress: 'street-address', place: 'address-level2' }

const PROVIDERS = providerData.providers
// noon avoids a date shift west of UTC when the ISO date is read as UTC midnight
const PROVIDERS_CHECKED = new Date(`${providerData.checked}T12:00`)

// Form data lives only in React state: never stored or sent anywhere (ADR-0001)
export default function App() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('de') ? 'de' : 'en'))
  const [data, setData] = useState(EMPTY_LETTER_DATA)
  // errors show only after a download attempt, so typing is not interrupted by announcements
  const [attempted, setAttempted] = useState(false)
  const [downloadFailed, setDownloadFailed] = useState(false)
  const t = STRINGS[lang]
  const signaturePad = useRef<SignatureCanvas>(null)
  const fieldName = (k: keyof LetterData) => (k === 'contractNumber' ? t.idLabels[data.contractType] : t.fields[k])
  const letter = buildLetter(data)
  const missing = missingFields(data)
  const showErrors = attempted && missing.length > 0
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const set = <K extends keyof LetterData>(k: K, v: LetterData[K]) => setData((d) => ({ ...d, [k]: v }))
  // picking a known provider fills its address; the user can still edit both fields afterwards
  const setProvider = (name: string) => {
    const p = PROVIDERS.find((x) => x.name === name)
    setData((d) => ({ ...d, providerName: name, ...(p && { providerAddress: p.address.join('\n') }) }))
  }
  const knownProvider = PROVIDERS.some((p) => p.name === data.providerName && p.address.join('\n') === data.providerAddress)
  const errorProps = (k: keyof LetterData) =>
    showErrors && missing.includes(k) ? { 'aria-invalid': true, 'aria-describedby': 'missing' } : {}

  const download = async () => {
    // use the clock at click time: the tab may have stayed open past midnight since the last render
    const now = new Date()
    const missingNow = missingFields(data, now)
    if (missingNow.length > 0) {
      setAttempted(true)
      document.getElementById(missingNow[0])?.focus()
      return
    }
    try {
      setDownloadFailed(false)
      const { downloadPdf } = await import('./pdf')
      downloadPdf(buildLetter(data, now))
    } catch {
      // e.g. offline, or a stale chunk after a redeploy
      setDownloadFailed(true)
    }
  }

  const label = (k: keyof LetterData) => (
    <label htmlFor={k}>
      {fieldName(k)}
      <span aria-hidden="true"> *</span>
    </label>
  )

  const textField = (k: TextKey, rows?: number) => {
    const props = {
      id: k,
      required: true,
      value: data[k],
      autoComplete: AUTOCOMPLETE[k],
      list: k === 'providerName' ? 'providers' : undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        k === 'providerName' ? setProvider(e.target.value) : set(k, e.target.value),
      ...errorProps(k),
    }
    return (
      <p>
        {label(k)}
        {rows ? <textarea rows={rows} {...props} /> : <input {...props} />}
      </p>
    )
  }

  return (
    <main lang={lang}>
      <header>
        <div>
          <p className="brand">
            <Logo />
            Kündigung Generator
          </p>
          <h1>{t.title}</h1>
          <p className="lead">{t.subtitle}</p>
          <p className="badge">{t.privacy}</p>
        </div>
        <button
          type="button"
          className="secondary"
          lang={lang === 'de' ? 'en' : 'de'}
          onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
        >
          {t.switchLabel}
        </button>
      </header>

      <aside className="note warn">
        <strong>{t.disclaimerTitle}</strong> {t.disclaimer}{' '}
        <a href="https://www.verbraucherzentrale.de/" target="_blank" rel="noopener noreferrer">
          {t.consumerCentre}
          <span className="sr-only"> {t.newTab}</span>
        </a>
        .
      </aside>

      <div className="layout">
        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <p className="hint" aria-hidden="true">
            {t.requiredHint}
          </p>
          <fieldset>
            <legend>{t.sections.you}</legend>
            {textField('senderName')}
            {textField('senderAddress', 2)}
            {textField('place')}
          </fieldset>

          <fieldset>
            <legend>{t.sections.provider}</legend>
            {textField('providerName')}
            {textField('providerAddress', 2)}
            {knownProvider && <p className="hint provider-hint">{t.providerHint(new Intl.DateTimeFormat(lang).format(PROVIDERS_CHECKED))}</p>}
            <datalist id="providers">
              {PROVIDERS.map((p) => (
                <option key={p.name} value={p.name} label={p.brand} />
              ))}
            </datalist>
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
          </fieldset>

          <fieldset className="choices">
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
                {label('endDate')}
                <input
                  id="endDate"
                  type="date"
                  required
                  min={isoDate(tomorrow)}
                  value={data.endDate}
                  onChange={(e) => set('endDate', e.target.value)}
                  {...errorProps('endDate')}
                />
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

          <fieldset className="choices">
            <legend>{t.optional}</legend>
            {(['revokeSepa', 'revokeConsent'] as const).map((k) => (
              <label key={k} className="choice">
                <input type="checkbox" checked={data[k]} onChange={(e) => set(k, e.target.checked)} />
                {t.fields[k]}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>{t.fields.signature}</legend>
            <p className="hint" id="signature-hint">
              {t.signatureHint}
            </p>
            <SignatureCanvas
              ref={signaturePad}
              canvasProps={{ className: 'sig-pad', role: 'img', 'aria-label': t.signaturePad, 'aria-describedby': 'signature-hint' }}
              onEnd={() => set('signature', signaturePad.current?.toDataURL('image/png') ?? '')}
            />
            <button
              type="button"
              className="secondary"
              disabled={!data.signature}
              onClick={() => {
                signaturePad.current?.clear()
                set('signature', '')
              }}
            >
              {t.clearSignature}
            </button>
          </fieldset>

          <button type="button" className="primary" onClick={download}>
            {t.download}
          </button>
          {showErrors && (
            <p id="missing" role="alert">
              {t.missing} {missing.map(fieldName).join(', ')}
            </p>
          )}
          {downloadFailed && (
            <p className="error" role="alert">
              {t.downloadFailed}
            </p>
          )}
          <aside className="note">
            <strong>{t.tipTitle}</strong> {t.tip}
          </aside>
        </form>

        <section className="preview-pane" aria-labelledby="preview-title">
          <h2 id="preview-title">{t.preview}</h2>
          <p className="hint">{t.previewNote}</p>
          <Preview letter={letter} />
        </section>
      </div>

      <footer>
        <p>
          {t.footer} ·{' '}
          <a href="https://github.com/qyrgyz/kuendigung-generator" target="_blank" rel="noopener noreferrer">
            {t.sourceCode}
            <span className="sr-only"> {t.newTab}</span>
          </a>
        </p>
      </footer>
    </main>
  )
}

/** Envelope with a check: the letter is done. Same artwork as public/favicon.svg. */
function Logo() {
  return (
    <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1d4ed8" />
      <rect x="6" y="9" width="18" height="13" rx="2" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="m7 10 8 6 8-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="22" r="6" fill="#16a34a" stroke="#1d4ed8" strokeWidth="1.5" />
      <path d="m21.4 22 1.8 1.8 3.3-3.4" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
      {letter.signature ? (
        <p>
          {letter.closing[0]}
          <img className="sig" src={letter.signature} alt="Unterschrift" />
          {letter.closing.slice(3).join('\n')}
        </p>
      ) : (
        <p>{letter.closing.join('\n')}</p>
      )}
    </article>
  )
}
