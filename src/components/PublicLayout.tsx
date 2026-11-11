import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { ChevronDown, HeartPulse, LifeBuoy, Menu, X } from 'lucide-react'

const nav = [
  { to: '/resources', label: 'Learn' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/check-in', label: 'Check-in' },
]
const supportLinks = [
  { to: '/ask', label: 'Ask a Question', detail: 'Share a concern confidentially' },
  { to: '/chat', label: 'Chat with a Professional', detail: 'Explore human support' },
  { to: '/ai-assistant', label: 'Ask AI Assistant', detail: 'Educational guidance' },
]

function Brand({ inverse = false }: { inverse?: boolean }) {
  return <Link to="/" className={`inline-flex items-center gap-3 ${inverse ? 'text-white' : 'text-navy'}`} aria-label="Wellness App, Kepler College home">
    <span className={`grid h-11 w-11 place-items-center rounded-[14px] ${inverse ? 'bg-white/15' : 'bg-trust'} text-white`}><HeartPulse size={25} strokeWidth={2.1} /></span>
    <span className="flex flex-col leading-none"><strong className="text-[19px] font-extrabold tracking-[.06em]">WELLNESS</strong><small className={`mt-1 text-[9px] font-bold tracking-[.23em] ${inverse ? 'text-white/85' : 'text-muted'}`}>KEPLER COLLEGE</small></span>
  </Link>
}

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  useEffect(() => { setMobileOpen(false); setSupportOpen(false) }, [location.pathname])
  useEffect(() => {
    function closeOnOutside(event: MouseEvent) { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setSupportOpen(false) }
    function closeOnEscape(event: KeyboardEvent) { if (event.key === 'Escape') { setSupportOpen(false); setMobileOpen(false) } }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => { document.removeEventListener('pointerdown', closeOnOutside); document.removeEventListener('keydown', closeOnEscape) }
  }, [])
  return <header className="sticky top-0 z-50 border-b border-[#e2edf5] bg-white/95 backdrop-blur-xl">
    <div className="shell flex h-[78px] items-center justify-between gap-5">
      <Brand />
      <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
        <NavLink to="/resources" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>Learn</NavLink>
        <div className="relative" ref={dropdownRef}>
          <button type="button" className={`nav-link flex items-center gap-1.5 ${supportOpen || ['/ask','/chat','/ai-assistant'].includes(location.pathname) ? 'nav-link-active' : ''}`} aria-expanded={supportOpen} aria-haspopup="menu" onClick={() => setSupportOpen(v => !v)}>Ask & connect <ChevronDown size={15} className={`transition-transform ${supportOpen ? 'rotate-180' : ''}`} /></button>
          {supportOpen && <div className="absolute left-1/2 top-[calc(100%+22px)] w-72 -translate-x-1/2 rounded-2xl border border-line bg-white p-2.5 shadow-panel" role="menu">{supportLinks.map(item => <Link key={item.to} to={item.to} role="menuitem" className="block rounded-xl px-3 py-3 transition hover:bg-softsky"><span className="block text-sm font-bold text-navy">{item.label}</span><span className="mt-0.5 block text-xs text-muted">{item.detail}</span></Link>)}</div>}
        </div>
        {nav.slice(1).map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>{item.label}</NavLink>)}
      </nav>
      <div className="hidden items-center gap-3 lg:flex"><Link to="/login" className="px-4 py-2.5 text-sm font-bold text-navy hover:text-trust">Login</Link><Link to="/register" className="btn btn-primary !min-h-[43px] !px-5">Get Started</Link></div>
      <div className="flex items-center gap-2 lg:hidden"><Link to="/emergency" className="grid h-11 w-11 place-items-center rounded-xl border border-[#f3d3d3] bg-[#fff7f7] text-[#c74747]" aria-label="Emergency support"><LifeBuoy size={21} /></Link><button type="button" className="grid h-11 w-11 place-items-center rounded-xl border border-line text-navy" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="mobile-nav" onClick={() => setMobileOpen(v => !v)}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
    </div>
    {mobileOpen && <nav id="mobile-nav" className="max-h-[calc(100dvh-78px)] overflow-y-auto border-t border-line bg-white px-5 pb-6 pt-3 lg:hidden" aria-label="Mobile navigation">
      <div className="mx-auto max-w-2xl">{[{ to: '/resources', label: 'Learn' }, ...supportLinks, ...nav.slice(1), { to: '/emergency', label: 'Emergency support' }].map(item => <Link key={item.to} to={item.to} className="block border-b border-line py-3 text-sm font-semibold text-navy">{item.label}</Link>)}<div className="mt-5 flex gap-3"><Link to="/login" className="btn btn-outline flex-1">Login</Link><Link to="/register" className="btn btn-primary flex-1">Get Started</Link></div></div>
    </nav>}
  </header>
}

function Footer() {
  const groups = [
    { title: 'Quick links', links: [['About','/about'],['Explore wellness','/resources'],['Daily wellness','/daily-wellness'],['Services','/#services']] },
    { title: 'Wellness services', links: [['Ask a question','/ask'],['Chat with a professional','/chat'],['AI assistant','/ai-assistant'],['Appointments','/appointments']] },
    { title: 'Information', links: [['Emergency support','/emergency'],['Privacy policy','/privacy'],['Terms of service','/terms'],['Contact','/contact']] },
  ]
  return <footer className="bg-navy text-white">
    <div className="shell grid gap-10 py-16 md:grid-cols-[1.5fr_1fr_1fr] xl:grid-cols-[1.7fr_1fr_1fr_1fr]">
      <div><Brand inverse /><p className="mt-6 max-w-xs text-sm leading-7 text-white/85">A welcoming space for the Kepler College community to learn, connect, and find wellbeing support.</p><Link to="/emergency" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white hover:underline"><LifeBuoy size={17} /> Emergency support</Link></div>
      {groups.map(group => <div key={group.title}><h2 className="text-sm font-bold">{group.title}</h2><ul className="mt-5 space-y-3">{group.links.map(([label,to]) => <li key={to}><Link to={to} className="text-sm text-white/85 transition hover:text-white">{label}</Link></li>)}</ul></div>)}
    </div>
    <div className="border-t border-white/15"><div className="shell flex flex-col gap-2 py-5 text-xs text-white/80 sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} Wellness App — Kepler College</span><span>Contact information will be added after institutional approval.</span></div></div>
  </footer>
}

export function PublicLayout() { return <><a href="#main-content" className="skip-link">Skip to content</a><Header /><main id="main-content"><Outlet /></main><Footer /></> }
