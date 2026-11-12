import { heroMentalHealthCards, type MentalHealthCard, type MentalHealthTheme } from '../data/heroMentalHealth'
import type { WellnessCard } from '../data/wellness'
import { api } from './api'

export async function getHeroMentalHealthMoment(_date = new Date()) {
  const result = await api<{ items: (WellnessCard & { illustration_url?: string })[]; date: string; featured_id: string | null }>('/daily-cards')
  if (!result.items.length) throw new Error('No daily cards are published')
  const themes: Record<WellnessCard['icon'], MentalHealthTheme> = { brain: 'breathe', book: 'study', heart: 'emotions', activity: 'rest', users: 'connection', sparkles: 'kindness', growth: 'growth' }
  const all = result.items.map(item => {
    const theme = themes[item.icon] ?? 'breathe'
    const palette = heroMentalHealthCards.find(card => card.theme === theme) ?? heroMentalHealthCards[0]
    return { ...palette, id: item.id, theme, category: item.category, title: item.title, message: item.message, reflection: item.detail || item.action, illustrationUrl: item.illustration_url || undefined } satisfies MentalHealthCard
  })
  const featuredIndex = Math.max(0, all.findIndex(card => card.id === result.featured_id))
  const count = Math.min(7, all.length)
  const center = Math.min(3, count - 1)
  const cards = Array.from({ length: count }, (_, index) => all[(featuredIndex + index - center + all.length) % all.length])
  return { cards, dateKey: result.date, featuredId: all[featuredIndex].id }
}
