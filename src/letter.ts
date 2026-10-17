export type LetterData = {
  senderName: string
  senderAddress: string
  providerName: string
  providerAddress: string
  memberNumber: string
  /** YYYY-MM-DD from <input type="date">; empty means "nächstmöglicher Zeitpunkt" (ADR-0004) */
  endDate: string
  place: string
}

export type Letter = {
  sender: string[]
  recipient: string[]
  dateLine: string
  subject: string
  paragraphs: string[]
  closing: string[]
}

const OPTIONAL: (keyof LetterData)[] = ['endDate']

export function missingFields(d: LetterData): (keyof LetterData)[] {
  return (Object.keys(d) as (keyof LetterData)[]).filter((k) => !OPTIONAL.includes(k) && !d[k].trim())
}

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)
const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)

export function buildLetter(d: LetterData, today = new Date()): Letter {
  const nr = d.memberNumber.trim()
  // parse as local date: new Date('YYYY-MM-DD') is UTC and can shift the day
  const [y, m, day] = d.endDate.split('-').map(Number)
  const when = d.endDate
    ? `zum ${formatDate(new Date(y, m - 1, day))}, hilfsweise zum nächstmöglichen Zeitpunkt`
    : 'zum nächstmöglichen Zeitpunkt'
  return {
    sender: [d.senderName.trim(), ...lines(d.senderAddress)],
    recipient: [d.providerName.trim(), ...lines(d.providerAddress)],
    dateLine: `${d.place.trim()}, ${formatDate(today)}`,
    subject: `Kündigung meiner Mitgliedschaft – Mitgliedsnummer ${nr}`,
    paragraphs: [
      'Sehr geehrte Damen und Herren,',
      `hiermit kündige ich meine Mitgliedschaft (Mitgliedsnummer ${nr}) fristgerecht ${when}.`,
      'Das Ihnen erteilte SEPA-Lastschriftmandat widerrufe ich zum Vertragsende.',
      'Bitte bestätigen Sie mir den Eingang dieser Kündigung sowie das genaue Vertragsende schriftlich.',
    ],
    closing: ['Mit freundlichen Grüßen', '', '', '______________________________', d.senderName.trim()],
  }
}
