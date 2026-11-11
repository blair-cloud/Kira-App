import { useEffect, useState } from 'react'
import { ArrowRight, Heart, Sparkles, Sun } from 'lucide-react'
import type { WellnessCard } from '../data/wellness'
import { dailyCardIndex, getDailyWellnessCards, kigaliDateKey } from '../services/dailyWellness'

const dateFormatter = new Intl.DateTimeFormat('en', {
  timeZone: 'Africa/Kigali', weekday: 'long', month: 'long', day: 'numeric',
})

export function HeroDailyCard() {
  const [cards, setCards] = useState<WellnessCard[]>([])
  const [dateKey, setDateKey] = useState(kigaliDateKey)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => { void getDailyWellnessCards().then(setCards) }, [])
  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = kigaliDateKey()
      if (next !== dateKey) { setDateKey(next); setFlipped(false) }
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [dateKey])

  const card = cards[dailyCardIndex(cards)]
  return <aside className="hero-daily-card" aria-label="Today's wellness flash card">
    <div className="hero-daily-top"><span><Sparkles size={16} /> Daily wellness card</span><time dateTime={dateKey}>{dateFormatter.format(new Date())}</time></div>
    <div className="hero-daily-art" aria-hidden="true"><span className="hero-daily-orbit hero-daily-orbit-outer" /><span className="hero-daily-orbit hero-daily-orbit-inner" /><span className="hero-daily-center">{flipped ? <Heart size={45} strokeWidth={1.7} /> : <Sun size={45} strokeWidth={1.7} />}</span><i className="hero-daily-spark one">✦</i><i className="hero-daily-spark two">✦</i></div>
    <div className="hero-daily-copy" aria-live="polite"><span className="hero-daily-category">{card?.category ?? 'A moment for yourself'}</span><h2>{flipped ? 'A small step for today' : card?.title ?? 'A little pause can help.'}</h2><p>{flipped ? card?.action : card?.message ?? 'Your daily wellness card is on its way.'}</p></div>
    <div className="hero-daily-bottom"><button type="button" onClick={() => setFlipped(value => !value)} disabled={!card}>{flipped ? 'Back to reflection' : 'Try this today'} <ArrowRight size={18} /></button><span>New card each day</span></div>
  </aside>
}
