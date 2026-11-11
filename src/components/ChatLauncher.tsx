import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CircleHelp, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router'
import { MedicalSupportIcon } from './MedicalSupportIcon'
import '../styles/chat-launcher.css'

const features = [
  { to: '/ask', title: 'Ask a Question', description: 'Share a concern confidentially', icon: CircleHelp, tone: 'blue' },
  { to: '/chat', title: 'Chat with a Professional', description: 'Explore human support', icon: MedicalSupportIcon, tone: 'teal' },
  { to: '/ai-assistant', title: 'Ask AI Assistant', description: 'Educational guidance', icon: Sparkles, tone: 'violet' },
]

function HealthChatIcon({ still }: { still: boolean }) {
  return <svg className="health-chat-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path d="M15 10h32a9 9 0 0 1 9 9v25a9 9 0 0 1-9 9H28L15 60v-7a9 9 0 0 1-9-9V19a9 9 0 0 1 9-9Z" stroke="white" strokeWidth="2.4" strokeLinejoin="round" opacity=".9" />
    <motion.g style={{ transformOrigin: '32px 33px' }} animate={still ? { scale: 1 } : { scale: [1, 1.12, 1, 1.07, 1] }} transition={{ duration: 1.45, repeat: Infinity, repeatDelay: 2.1, times: [0,.2,.4,.6,1] }}>
      <path d="M32 46S16 37 16 27c0-9 11-12 16-4 5-8 16-5 16 4 0 10-16 19-16 19Z" fill="white" />
      <motion.path d="M19 32h8l3-7 5 14 3-7h7" stroke="#2585c5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" initial={false} animate={still ? { pathLength: 1 } : { pathLength: [0,1,1] }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.75, times: [0,.65,1] }} />
    </motion.g>
    <circle cx="52" cy="12" r="9" fill="#249f97" stroke="white" strokeWidth="2.5" />
    <path d="M52 8v8m-4-4h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
}

export function ChatLauncher() {
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function cancelClose() { if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null } }
  function closePanel() { cancelClose(); setOpen(false) }
  useEffect(() => () => { if (leaveTimer.current) clearTimeout(leaveTimer.current) }, [])
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])
  return <motion.div ref={root} className="chat-launcher" initial={reduceMotion ? false : { opacity: 0, y: 22, scale: .8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 22, delay: .4 }}
    onPointerEnter={event => { if (event.pointerType === 'mouse') { cancelClose(); setOpen(true) } }}
    onPointerLeave={event => { if (event.pointerType === 'mouse') { cancelClose(); leaveTimer.current = setTimeout(() => { if (!root.current?.contains(document.activeElement)) setOpen(false) }, 220) } }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) closePanel() }}>
    <AnimatePresence>{open && <motion.nav id="kira-chat-options" className="chat-launcher-panel" aria-label="Chat support options" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: .96 }} transition={{ duration: .22, ease: [.22,1,.36,1] }}>
      <div className="chat-launcher-panel-heading"><div><span className="chat-launcher-kicker">KIRA SUPPORT</span><h2>How can we help?</h2><p>Choose a way to start a conversation.</p></div><button type="button" className="chat-launcher-close" aria-label="Close chat options" onClick={() => { closePanel(); trigger.current?.focus() }}><X size={17} /></button></div>
      <div className="chat-launcher-features">{features.map((feature,index) => { const Icon=feature.icon; return <motion.div key={feature.to} initial={reduceMotion ? false : { opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .25, delay: index * .05 }}><Link to={feature.to} className="chat-launcher-feature" onClick={closePanel}><span className={`chat-launcher-feature-icon ${feature.tone}`}><Icon size={23} strokeWidth={1.7} aria-hidden="true" /></span><span><strong>{feature.title}</strong><small>{feature.description}</small></span></Link></motion.div> })}</div>
    </motion.nav>}</AnimatePresence>
    <motion.button ref={trigger} type="button" className="chat-launcher-button" aria-label={open ? 'Close Kira chat options' : 'Open Kira chat options'} aria-expanded={open} aria-controls={open ? 'kira-chat-options' : undefined} onClick={() => { cancelClose(); setOpen(value => !value) }} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); requestAnimationFrame(() => root.current?.querySelector<HTMLAnchorElement>('.chat-launcher-feature')?.focus()) } }}
      animate={reduceMotion || open ? { y: 0, scale: 1 } : { y: [0,-5,0], scale: [1,1.045,1] }} transition={{ duration: 3.6, repeat: reduceMotion || open ? 0 : Infinity, ease: 'easeInOut' }} whileHover={reduceMotion ? undefined : { scale: 1.06 }} whileTap={reduceMotion ? undefined : { scale: .96 }}>
      <motion.span className="chat-launcher-pulse" aria-hidden="true" animate={reduceMotion || open ? { opacity: 0, scale: 1 } : { opacity: [.4,0], scale: [1,1.65] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.1 }} />
      <HealthChatIcon still={!!reduceMotion || open} />
    </motion.button>
  </motion.div>
}
