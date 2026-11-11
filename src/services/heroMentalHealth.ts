import { heroMentalHealthCards } from '../data/heroMentalHealth'
import { dailyContentIndex, kigaliDateKey } from './dailyWellness'

// Replace this mock adapter with scheduled content from the backend later.
// Today's featured theme sits in the middle of the seven-card fan.
export async function getHeroMentalHealthMoment(date = new Date()) {
  const featuredIndex = dailyContentIndex(heroMentalHealthCards.length, date)
  const cards = Array.from({ length: 7 }, (_, index) =>
    heroMentalHealthCards[(featuredIndex + index - 3 + heroMentalHealthCards.length) % heroMentalHealthCards.length],
  )
  return { cards, dateKey: kigaliDateKey(date), featuredId: heroMentalHealthCards[featuredIndex].id }
}
