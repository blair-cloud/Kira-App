import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { X } from 'lucide-react'
import type { MentalHealthCard } from '../data/heroMentalHealth'
import { getHeroMentalHealthMoment } from '../services/heroMentalHealth'
import { kigaliDateKey } from '../services/dailyWellness'
import { MentalHealthArtwork } from './MentalHealthArtwork'

type HeroMoment = Awaited<ReturnType<typeof getHeroMentalHealthMoment>>

function ReflectionDialog({ card, onClose }: { card: MentalHealthCard; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    close.current?.focus()
    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const buttons = panel.current?.querySelectorAll<HTMLElement>('button, a[href]')
      if (!buttons?.length) return
      const first = buttons[0], last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', handleKey); trigger?.focus() }
  }, [onClose])
  return createPortal(<div className="mental-reflection-overlay" onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={panel} className="mental-reflection-panel" role="dialog" aria-modal="true" aria-labelledby="reflection-title" aria-describedby="reflection-message" style={{ '--card-color': card.color, '--card-ink': card.ink } as CSSProperties}>
      <div className="mental-reflection-art"><span>{card.category}</span><button ref={close} type="button" aria-label="Close reflection" onClick={onClose}><X size={20} /></button><MentalHealthArtwork theme={card.id} /></div>
      <div className="mental-reflection-copy"><h2 id="reflection-title">{card.title}</h2><p id="reflection-message">{card.message}</p><div className="mental-reflection-prompt"><span>A moment for you</span><p>{card.reflection}</p></div><Link to="/ask" onClick={onClose} className="btn btn-primary">Explore support</Link><p className="mental-reflection-note">A general reflection for everyday wellbeing.</p></div>
    </div>
  </div>, document.body)
}

export function MentalHealthHero() {
  const [moment, setMoment] = useState<HeroMoment | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<MentalHealthCard | null>(null)
  const fan = useRef<HTMLDivElement>(null)
  const cardButtons = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    let active = true
    let loadedDate = ''
    async function load() {
      if (loadedDate === kigaliDateKey()) return
      try { const next = await getHeroMentalHealthMoment(); if (active) { setMoment(next); loadedDate = next.dateKey; setError(false) } }
      catch { if (active) setError(true) }
    }
    void load()
    const timer = window.setInterval(() => void load(), 60_000)
    const onVisible = () => { if (!document.hidden) void load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  useEffect(() => {
    if (!moment || !window.matchMedia('(max-width: 700px)').matches) return
    const middle = cardButtons.current[3], track = fan.current
    const slot = middle?.parentElement
    if (middle && slot && track) track.scrollTo({ left: slot.offsetLeft - (track.clientWidth - middle.clientWidth) / 2 })
  }, [moment])

  function navigateCards(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % 7 : event.key === 'ArrowLeft' ? (index + 6) % 7 : event.key === 'Home' ? 0 : event.key === 'End' ? 6 : null
    if (next === null) return
    event.preventDefault(); cardButtons.current[next]?.focus()
  }

  return <section className="mental-health-hero" data-animated-graphic aria-labelledby="mental-hero-title">
    <div className="mental-hero-intro shell"><span className="eyebrow">Your daily moment of care</span><h1 id="mental-hero-title">Your mind matters.<br /><span>Make space for yourself.</span></h1></div>
    <div className="mental-fan-stage" ref={fan} role="group" aria-label="Seven mental health flash cards. Use left and right arrow keys to explore." aria-busy={!moment && !error}>
      {moment ? moment.cards.map((card, index) => <div className="mental-fan-slot" key={card.id} style={{ '--card-position': index - 3, '--card-y': [32, 12, 0, -7, 0, 12, 32][index] + 'px', '--card-angle': [-15, -10, -5, 0, 5, 10, 15][index] + 'deg', '--card-delay': Math.abs(index - 3) * 90 + 'ms', '--card-layer': 7 - Math.abs(index - 3), '--card-color': card.color, '--card-ink': card.ink } as CSSProperties}>
        <button type="button" className="mental-flash-card" ref={button => { cardButtons.current[index] = button }} onClick={() => setSelected(card)} onKeyDown={event => navigateCards(event, index)} aria-label={`${card.category}: ${card.title}${card.id === moment.featuredId ? ' Featured today.' : ''} Open reflection.`}>
          <span className="mental-card-top"><span>{card.category}</span><span>{String(index + 1).padStart(2, '0')}</span></span>
          <MentalHealthArtwork theme={card.id} /><h2>{card.title}</h2><span className="mental-card-foot">{card.id === moment.featuredId ? "Today's reflection" : 'A moment for you'}<span aria-hidden="true">✦</span></span>
        </button>
      </div>) : error ? <p className="mental-hero-error" role="status">The reflections are unavailable right now. You can still explore our wellness resources below.</p> : Array.from({ length: 7 }, (_, index) => <div key={index} className="mental-fan-skeleton" aria-hidden="true" />)}
    </div>
    <div className="mental-hero-outro shell"><p>Seven small reminders to pause, reconnect, and care for your mental wellbeing.</p><div className="mental-hero-actions"><Link to="/register" className="btn btn-primary">Get Started</Link><Link to="/resources" className="btn btn-outline">Explore Wellness</Link></div><span className="mental-hero-hint"><span className="mental-desktop-hint">Choose a card for a gentle reflection.</span><span className="mental-mobile-hint">Swipe to explore. Tap a card to reflect.</span> A new featured card every day.</span></div>
    {selected && <ReflectionDialog card={selected} onClose={() => setSelected(null)} />}
  </section>
}
