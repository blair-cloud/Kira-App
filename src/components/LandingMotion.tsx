import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Pause, Play } from 'lucide-react'

export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    const updateVisibility = () => setPageVisible(!document.hidden)
    preference.addEventListener('change', updatePreference)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      preference.removeEventListener('change', updatePreference)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  useEffect(() => {
    const container = root.current
    if (!container) return
    const targets = container.querySelectorAll<HTMLElement>('[data-reveal], [data-animated-graphic]')
    if (!('IntersectionObserver' in window)) {
      targets.forEach(target => { target.dataset.revealed = 'true' })
      return
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const target = entry.target as HTMLElement
        if (entry.isIntersecting) target.dataset.revealed = 'true'
        if (target.hasAttribute('data-animated-graphic')) target.dataset.graphicActive = String(entry.isIntersecting)
        else if (entry.isIntersecting) observer.unobserve(target)
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -24px 0px' })
    targets.forEach(target => observer.observe(target))
    container.classList.add('motion-enhanced')
    return () => observer.disconnect()
  }, [])

  function revealFocusedContent(target: EventTarget) {
    if (!(target instanceof HTMLElement)) return
    let parent: HTMLElement | null = target
    while (parent && parent !== root.current) {
      if (parent.hasAttribute('data-reveal')) parent.dataset.revealed = 'true'
      parent = parent.parentElement
    }
  }

  return <div ref={root} className="landing-motion" data-motion={!paused && !reducedMotion && pageVisible ? 'running' : 'paused'} onFocusCapture={event => revealFocusedContent(event.target)}>
    {children}
    <div className="motion-preference shell"><button type="button" className="motion-toggle" aria-pressed={paused} disabled={reducedMotion} onClick={() => setPaused(value => !value)}>
      {paused || reducedMotion ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
      {reducedMotion ? 'Reduced motion enabled' : paused ? 'Resume animations' : 'Pause animations'}
    </button></div>
  </div>
}
