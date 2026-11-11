import { wellnessCards, type WellnessCard } from '../data/wellness'

const kigaliDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Kigali', year: 'numeric', month: '2-digit', day: '2-digit',
})

export function kigaliDateKey(date = new Date()): string {
  const parts = kigaliDateFormatter.formatToParts(date)
  const value = (type: string) => parts.find(part => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function dailyCardIndex(cards: readonly WellnessCard[], date = new Date()): number {
  if (cards.length === 0) return 0
  const [year, month, day] = kigaliDateKey(date).split('-').map(Number)
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
  return dayNumber % cards.length
}

// This seam can become a Supabase/FastAPI request without changing carousel UI.
export async function getDailyWellnessCards(): Promise<WellnessCard[]> {
  return wellnessCards
}
