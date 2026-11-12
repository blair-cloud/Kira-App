import { useEffect, useRef, useState, type ReactNode } from 'react'

export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
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
    // Resources and daily cards arrive after the initial API request. Register
    // those new elements too, otherwise reveal styling would keep them hidden.
    const registerTree = (node: Node, added: boolean) => {
      if (!(node instanceof HTMLElement)) return
      const elements = [...(node.matches('[data-reveal], [data-animated-graphic]') ? [node] : []), ...node.querySelectorAll<HTMLElement>('[data-reveal], [data-animated-graphic]')]
      elements.forEach(element => added ? observer.observe(element) : observer.unobserve(element))
    }
    const mutations = new MutationObserver(records => {
      records.forEach(record => {
        record.removedNodes.forEach(node => registerTree(node, false))
        record.addedNodes.forEach(node => registerTree(node, true))
      })
    })
    mutations.observe(container, { childList: true, subtree: true })
    container.classList.add('motion-enhanced')
    return () => { observer.disconnect(); mutations.disconnect() }
  }, [])

  function revealFocusedContent(target: EventTarget) {
    if (!(target instanceof HTMLElement)) return
    let parent: HTMLElement | null = target
    while (parent && parent !== root.current) {
      if (parent.hasAttribute('data-reveal')) parent.dataset.revealed = 'true'
      parent = parent.parentElement
    }
  }

  return <div ref={root} className="landing-motion" data-motion={!reducedMotion && pageVisible ? 'running' : 'paused'} onFocusCapture={event => revealFocusedContent(event.target)}>
    {children}
  </div>
}
