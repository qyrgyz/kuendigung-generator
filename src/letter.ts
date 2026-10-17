export const CONTRACT_TYPES = ['gym', 'mobile', 'internet', 'streaming', 'insurance', 'newspaper', 'electricity'] as const
export type ContractType = (typeof CONTRACT_TYPES)[number]
export type TerminationType = 'ordinary' | 'date' | 'extraordinary'
export type Reason = 'priceIncrease' | 'move' | 'other'

export type LetterData = {
  senderName: string
  senderAddress: string
  providerName: string
  providerAddress: string
  contractType: ContractType
  contractNumber: string
  terminationType: TerminationType
  /** YYYY-MM-DD from <input type="date">, used when terminationType is 'date' */
  endDate: string
  /** used when terminationType is 'extraordinary' */
  reason: Reason
  reasonText: string
  revokeSepa: boolean
  revokeConsent: boolean
  place: string
  /** PNG data URL from the optional signature pad; empty means sign the printout by hand */
  signature: string
}

export type Letter = {
  sender: string[]
  recipient: string[]
  dateLine: string
  subject: string
  paragraphs: string[]
  closing: string[]
  signature: string
}

export const EMPTY_LETTER_DATA: LetterData = {
  senderName: '',
  senderAddress: '',
  providerName: '',
  providerAddress: '',
  contractType: 'gym',
  contractNumber: '',
  terminationType: 'ordinary',
  endDate: '',
  reason: 'priceIncrease',
  reasonText: '',
  revokeSepa: true,
  revokeConsent: false,
  place: '',
  signature: '',
}

// nominative for the subject line, accusative for "hiermit kündige ich …", and the identifier the provider uses
const CONTRACT: Record<ContractType, { noun: string; acc: string; id: string }> = {
  gym: { noun: 'Mitgliedschaft', acc: 'meine Mitgliedschaft', id: 'Mitgliedsnummer' },
  mobile: { noun: 'Mobilfunkvertrag', acc: 'meinen Mobilfunkvertrag', id: 'Rufnummer/Kundennummer' },
  internet: { noun: 'Internetvertrag', acc: 'meinen Internetvertrag', id: 'Kundennummer' },
  streaming: { noun: 'Streaming-Abonnement', acc: 'mein Streaming-Abonnement', id: 'Kundennummer/E-Mail-Adresse des Kontos' },
  insurance: { noun: 'Versicherungsvertrag', acc: 'meinen Versicherungsvertrag', id: 'Versicherungsscheinnummer' },
  newspaper: { noun: 'Zeitungsabonnement', acc: 'mein Zeitungsabonnement', id: 'Abonnentennummer' },
  electricity: { noun: 'Stromliefervertrag', acc: 'meinen Stromliefervertrag', id: 'Kunden-/Vertragsnummer' },
}

// State the facts only: whether they create a special right to cancel depends on the contract and law
// (e.g. moving house generally does not for gyms, BGH XII ZR 62/15), so the letter must not claim one (ADR-0004).
const REASON: Record<Exclude<Reason, 'other'>, string> = {
  priceIncrease: 'Anlass der Kündigung ist die von Ihnen angekündigte Preiserhöhung.',
  move: 'Anlass der Kündigung ist mein Umzug.',
}

/** Local YYYY-MM-DD, the format <input type="date"> uses, so dates compare as strings. */
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Required fields that are blank; a fixed end date counts as missing unless it is after today. */
export function missingFields(d: LetterData, today = new Date()): (keyof LetterData)[] {
  const required: (keyof LetterData)[] = ['senderName', 'senderAddress', 'providerName', 'providerAddress', 'contractNumber', 'place']
  if (d.terminationType === 'date') required.push('endDate')
  if (d.terminationType === 'extraordinary' && d.reason === 'other') required.push('reasonText')
  return required.filter((k) => !String(d[k]).trim() || (k === 'endDate' && d.endDate <= isoDate(today)))
}

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)
const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
// parse as local date: new Date('YYYY-MM-DD') is UTC and can shift the day
const parseDate = (s: string) => {
  const [y, m, day] = s.split('-').map(Number)
  return new Date(y, m - 1, day)
}

/** Pure: form data -> German letter text. Shared by the preview and the PDF (ADR-0002). */
export function buildLetter(d: LetterData, today = new Date()): Letter {
  // '…' only shows in the live preview: the download stays blocked until these are filled in
  const nr = d.contractNumber.trim() || '…'
  const place = d.place.trim() || '…'
  const { noun, acc, id } = CONTRACT[d.contractType]
  const what = `hiermit kündige ich ${acc} (${id} ${nr})`
  // ADR-0004: always fall back to the next possible date instead of computing one
  const termination = {
    ordinary: `${what} ordentlich und fristgerecht zum nächstmöglichen Termin.`,
    date: `${what} ordentlich und fristgerecht zum ${d.endDate && formatDate(parseDate(d.endDate))}, hilfsweise zum nächstmöglichen Termin.`,
    extraordinary: `${what} außerordentlich zum frühestmöglichen Zeitpunkt, hilfsweise ordentlich zum nächstmöglichen Termin.`,
  }[d.terminationType === 'date' && !d.endDate ? 'ordinary' : d.terminationType] // no "zum ," while the date is blank
  const reason = d.reason === 'other' ? d.reasonText.trim() && `Grund der Kündigung: ${d.reasonText.trim()}` : REASON[d.reason]

  return {
    sender: [d.senderName.trim(), ...lines(d.senderAddress)],
    recipient: [d.providerName.trim(), ...lines(d.providerAddress)],
    dateLine: `${place}, ${formatDate(today)}`,
    subject: `Kündigung ${noun} – ${id} ${nr}`,
    paragraphs: [
      'Sehr geehrte Damen und Herren,',
      termination,
      ...(d.terminationType === 'extraordinary' && reason ? [reason] : []),
      ...(d.revokeSepa ? ['Das Ihnen erteilte SEPA-Lastschriftmandat widerrufe ich zum Zeitpunkt der Vertragsbeendigung.'] : []),
      ...(d.revokeConsent
        ? ['Zudem widerrufe ich mit sofortiger Wirkung meine Einwilligung zur Nutzung meiner Daten für Werbezwecke und zur Kontaktaufnahme zu Werbezwecken.']
        : []),
      'Bitte bestätigen Sie mir den Eingang dieser Kündigung und den Zeitpunkt, zu dem sie wirksam wird, schriftlich.',
    ],
    closing: ['Mit freundlichen Grüßen', '', '', '______________________________', d.senderName.trim()],
    signature: d.signature,
  }
}
