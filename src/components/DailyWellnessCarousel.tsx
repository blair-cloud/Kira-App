import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { createPortal } from 'react-dom'
import { Bookmark, X } from 'lucide-react'
import { DailyWellnessIcon } from './DailyWellnessIcon'
import type { WellnessCard } from '../data/wellness'
import { dailyCardIndex, getDailyWellnessCards, kigaliDateKey } from '../services/dailyWellness'

const savedKey = 'kepler-wellness-saved-cards'

function readSaved(): string[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(savedKey) || '[]'); return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [] } catch { return [] }
}

function CardDetail({ card, onClose }: { card: WellnessCard; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') { event.preventDefault(); closeRef.current?.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previous?.focus() }
  }, [onClose])
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div role="dialog" aria-modal="true" aria-labelledby="card-detail-title" className="w-full max-w-lg rounded-[20px] bg-white p-7 shadow-2xl sm:p-9">
      <div className="flex items-start justify-between"><span className={`wellness-icon wellness-icon-${card.tone}`}><DailyWellnessIcon theme={card.icon} /></span><button ref={closeRef} type="button" aria-label="Close card details" className="icon-button" onClick={onClose}><X size={20} /></button></div>
      <span className="mt-6 block text-xs font-bold uppercase tracking-[.15em] text-trust">{card.category}</span><h3 id="card-detail-title" className="mt-2 text-xl font-semibold tracking-tight text-navy">{card.title}</h3><p className="mt-4 leading-7 text-secondary">{card.detail}</p>
      <div className="mt-7 rounded-xl bg-softsky p-5"><span className="text-xs font-bold uppercase tracking-[.13em] text-trust">A small action</span><p className="mt-2 text-sm font-medium text-main">{card.action}</p></div>
      <p className="mt-5 text-xs leading-5 text-secondary">General educational content. For personal health concerns, connect with a qualified professional.</p>
    </div>
  </div>
}

export function DailyWellnessCarousel({ compact = false }: { compact?: boolean }) {
  const [cards, setCards] = useState<WellnessCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saved, setSaved] = useState<string[]>(readSaved)
  const [active, setActive] = useState(0)
  const [snaps, setSnaps] = useState<number[]>([])
  const [detail, setDetail] = useState<WellnessCard | null>(null)
  const [dateKey, setDateKey] = useState(kigaliDateKey)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', slidesToScroll: 1 })

  const load = useCallback(async () => {
    setLoading(true); setError(false)
    try { setCards(await getDailyWellnessCards()) } catch { setError(true) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const timer = window.setInterval(() => { const next = kigaliDateKey(); if (next !== dateKey) setDateKey(next) }, 60_000)
    return () => window.clearInterval(timer)
  }, [dateKey])
  useEffect(() => { if (emblaApi && cards.length) { emblaApi.reInit(); emblaApi.scrollTo(dailyCardIndex(cards), true) } }, [emblaApi, cards, dateKey])
  useEffect(() => {
    if (!emblaApi) return
    const update = () => { setActive(emblaApi.selectedScrollSnap()); setSnaps(emblaApi.scrollSnapList()) }
    update(); emblaApi.on('select', update).on('reInit', update)
    return () => { emblaApi.off('select', update).off('reInit', update) }
  }, [emblaApi])
  function toggleSave(id: string) {
    const next = saved.includes(id) ? saved.filter(item => item !== id) : [...saved, id]
    setSaved(next)
    try { localStorage.setItem(savedKey, JSON.stringify(next)) } catch { /* UI still works if storage is unavailable. */ }
  }
  function handleKeys(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); emblaApi?.scrollPrev() }
    if (event.key === 'ArrowRight') { event.preventDefault(); emblaApi?.scrollNext() }
  }
  return <section className={`wellness-section ${compact ? 'wellness-section-compact' : ''}`} data-reveal aria-labelledby="daily-heading" onKeyDown={handleKeys}>
    <div className="shell">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="daily-heading" className="section-title">Your Daily Wellness Moment</h2><p className="section-subtitle mt-3">A little reminder, a helpful insight, and a moment for yourself.</p></div><div className="flex gap-2"><button type="button" className="carousel-control" onClick={() => emblaApi?.scrollPrev()} aria-label="Previous wellness card">Previous</button><button type="button" className="carousel-control" onClick={() => emblaApi?.scrollNext()} aria-label="Next wellness card">Next</button></div></div>
      {loading ? <div className="mt-9 grid gap-5 md:grid-cols-3" aria-live="polite">{[0,1,2].map(i => <div key={i} className="h-[330px] animate-pulse rounded-[20px] bg-[#e4f0f7]" />)}</div> : error ? <div className="mt-9 rounded-2xl border border-line bg-white p-8 text-center"><p className="text-main">Daily wellness cards could not be loaded.</p><button type="button" className="btn btn-primary mt-4" onClick={() => void load()}>Try again</button></div> : <>
        <div className="embla mt-9" ref={emblaRef} aria-roledescription="carousel" aria-label="Daily wellness cards"><div className="embla-container">{cards.map((card, index) => { const isSaved = saved.includes(card.id); return <div className="embla-slide" key={card.id} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${cards.length}`}><article className={`wellness-card wellness-card-${card.tone}`}><div className="flex items-start justify-between gap-4"><span className={`wellness-icon wellness-icon-${card.tone}`}><DailyWellnessIcon theme={card.icon} /></span><button type="button" className={`save-button ${isSaved ? 'save-button-active' : ''}`} onClick={() => toggleSave(card.id)} aria-label={`${isSaved ? 'Remove saved' : 'Save'} card: ${card.title}`} aria-pressed={isSaved}><Bookmark size={19} fill={isSaved ? 'currentColor' : 'none'} /></button></div><span className="mt-7 block text-[13px] font-extrabold uppercase tracking-[.15em] text-trust">{card.category}</span><h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight text-navy">{card.title}</h3><p className="mt-3 text-sm leading-6 text-secondary">{card.message}</p><div className="mt-auto border-t border-navy/10 pt-4"><p className="text-xs font-semibold leading-5 text-main"><span className="text-trust">Today’s step:</span> {card.action}</p><button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-trust hover:underline" onClick={() => setDetail(card)}>Read More</button></div></article></div> })}</div></div>
        <div className="mt-7 flex items-center justify-between gap-4"><div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Choose wellness card">{snaps.map((_, index) => <button key={index} type="button" className={`carousel-dot ${index === active ? 'carousel-dot-active' : ''}`} aria-label={`Go to wellness card ${index + 1}`} aria-selected={index === active} role="tab" onClick={() => emblaApi?.scrollTo(index)} />)}</div><span className="text-xs font-medium text-secondary">Featured card refreshes daily in Kigali</span></div>
      </>}
    </div>
    {detail && createPortal(<CardDetail card={detail} onClose={() => setDetail(null)} />, document.body)}
  </section>
}
