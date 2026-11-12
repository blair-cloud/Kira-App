import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { X } from 'lucide-react'
import type { MentalHealthCard } from '../data/heroMentalHealth'
import { getHeroMentalHealthMoment } from '../services/heroMentalHealth'
import { kigaliDateKey } from '../services/dailyWellness'
import { MentalHealthArtwork, MentalHealthBadge } from './MentalHealthArtwork'

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
    <div ref={panel} className="mental-reflection-panel" role="dialog" aria-modal="true" aria-labelledby="reflection-title" aria-describedby="reflection-message" style={{ '--card-color': card.color, '--card-end': card.colorEnd, '--card-accent': card.accent, '--card-ink': card.ink } as CSSProperties}>
      <div className="mental-reflection-art"><span>{card.category}</span><button ref={close} type="button" aria-label="Close reflection" onClick={onClose}><X size={20} /></button><MentalHealthArtwork theme={card.theme} src={card.illustrationUrl} /></div>
      <div className="mental-reflection-copy"><h2 id="reflection-title">{card.title}</h2><p id="reflection-message">{card.message}</p><div className="mental-reflection-prompt"><span>A moment for you</span><p>{card.reflection}</p></div><Link to="/ask" onClick={onClose} className="btn btn-primary">Explore support</Link><p className="mental-reflection-note">A general reflection for everyday wellbeing.</p></div>
    </div>
  </div>, document.body)
}

export function MentalHealthHero() {
  const [moment, setMoment] = useState<HeroMoment | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<MentalHealthCard | null>(null)
  const [activeIndex, setActiveIndex] = useState(3)
  const touchStart = useRef<number | null>(null)
  const hero = useRef<HTMLElement>(null)
  const cardButtons = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    let active = true
    let loadedDate = ''
    async function load() {
      if (loadedDate === kigaliDateKey()) return
      try { const next = await getHeroMentalHealthMoment(); if (active) { setMoment(next); setActiveIndex(Math.max(0, next.cards.findIndex(card => card.id === next.featuredId))); loadedDate = next.dateKey; setError(false) } }
      catch { if (active) setError(true) }
    }
    void load()
    const timer = window.setInterval(() => void load(), 60_000)
    const onVisible = () => { if (!document.hidden) void load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  useEffect(() => {
    if (!moment || selected) return
    const timer = window.setInterval(() => {
      const section = hero.current
      if (!section || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      if (section.closest('[data-motion]')?.getAttribute('data-motion') === 'paused' || section.dataset.graphicActive === 'false') return
      setActiveIndex(index => (index + 1) % moment.cards.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [moment, selected])

  function navigateCards(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = moment?.cards.length ?? 0
    if (!count) return
    const next = event.key === 'ArrowRight' ? (index + 1) % count : event.key === 'ArrowLeft' ? (index + count - 1) % count : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : null
    if (next === null) return
    event.preventDefault(); setActiveIndex(next); cardButtons.current[next]?.focus()
  }

  return <section ref={hero} className="mental-health-hero" data-animated-graphic aria-labelledby="mental-hero-title">
    <div className="mental-hero-intro shell"><h1 id="mental-hero-title">Your mind matters.<br /><span>Make space for yourself.</span></h1></div>
    <div className="mental-fan-stage mental-card-cycle" role="region" aria-roledescription="carousel" aria-label="Mental health reflections" aria-busy={!moment && !error}
      onTouchStart={event => { touchStart.current = event.touches[0].clientX }} onTouchEnd={event => { const start = touchStart.current; touchStart.current = null; if (start !== null && Math.abs(event.changedTouches[0].clientX - start) > 35) setActiveIndex(index => (index + (event.changedTouches[0].clientX < start ? 1 : 6)) % 7) }}>
      {moment ? moment.cards.map((card, index) => <div className="mental-fan-slot" key={card.id} data-active={index === activeIndex} style={{ '--cycle-x': [0, 140, 240, 325, -325, -240, -140][(index - activeIndex + 7) % 7] + 'px', '--cycle-angle': [0, 7, 12, 16, -16, -12, -7][(index - activeIndex + 7) % 7] + 'deg', '--card-layer': index === activeIndex ? 10 : 7 - ((index - activeIndex + 7) % 7), '--card-color': card.color, '--card-end': card.colorEnd, '--card-accent': card.accent, '--card-ink': card.ink } as CSSProperties}>
        <button type="button" className="mental-flash-card" ref={button => { cardButtons.current[index] = button }} tabIndex={index === activeIndex ? 0 : -1} onClick={() => { if (index === activeIndex) setSelected(card); else setActiveIndex(index) }} onKeyDown={event => navigateCards(event, index)} aria-label={`${card.category}: ${card.title}${card.id === moment.featuredId ? ' Featured today.' : ''} Open reflection.`}>
          <MentalHealthBadge theme={card.theme} category={card.category} /><h2>{card.title}</h2><p className="mental-card-message">{card.message}</p><MentalHealthArtwork theme={card.theme} src={card.illustrationUrl} />
        </button>
      </div>) : error ? <p className="mental-hero-error" role="status">The reflections are unavailable right now. You can still explore our wellness resources below.</p> : Array.from({ length: 7 }, (_, index) => <div key={index} className="mental-fan-skeleton" aria-hidden="true" />)}
    </div>
    {moment && <div className="mental-cycle-controls" role="group" aria-label="Choose a reflection">

      <div className="mental-cycle-dots">{moment.cards.map((card, index) => <button key={card.id} type="button" className="mental-cycle-dot" aria-label={`Show reflection ${index + 1}: ${card.title}`} aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)} />)}</div>

    </div>}
    <div className="mental-hero-outro shell"><p>Seven small reminders to pause, reconnect, and care for your mental wellbeing.</p><div className="mental-hero-actions"><Link to="/register" className="btn btn-primary">Get Started</Link><Link to="/resources" className="btn btn-outline">Explore Wellness</Link></div></div>
    {selected && <ReflectionDialog card={selected} onClose={() => setSelected(null)} />}
  </section>
}
