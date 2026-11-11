import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CircleHelp, Sparkles } from 'lucide-react'
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
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const still = !!reduceMotion || open || !pageVisible
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function cancelClose() { if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null } }
  function closePanel() { cancelClose(); setOpen(false) }
  useEffect(() => () => { if (leaveTimer.current) clearTimeout(leaveTimer.current) }, [])
  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])
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
    onPointerLeave={event => { if (event.pointerType === 'mouse') { cancelClose(); leaveTimer.current = setTimeout(() => { if (!root.current?.contains(document.activeElement)) setOpen(false) }, 320) } }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) closePanel() }}>
    <AnimatePresence>{open && <motion.nav id="kira-chat-options" className="chat-launcher-orbit" aria-label="Chat support options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}>
      {features.map((feature,index) => { const Icon=feature.icon; const point=[{ x: -146, y: -2 }, { x: -108, y: -92 }, { x: -4, y: -164 }][index]; return <motion.div key={feature.to} className="chat-orbit-slot" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 0, y: 0, scale: .35 }} animate={{ opacity: 1, x: point.x, y: point.y, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 0, y: 0, scale: .35 }} transition={{ type: 'spring', stiffness: 230, damping: 22, delay: reduceMotion ? 0 : index * .065 }}><Link to={feature.to} className={`chat-launcher-feature ${feature.tone}`} aria-label={`${feature.title}. ${feature.description}`} onClick={closePanel}><Icon size={26} strokeWidth={1.9} aria-hidden="true" /><span>{feature.title}</span></Link></motion.div> })}
    </motion.nav>}</AnimatePresence>
    <motion.button ref={trigger} type="button" className="chat-launcher-button" aria-label={open ? 'Close Kira chat options' : 'Open Kira chat options'} aria-expanded={open} aria-controls={open ? 'kira-chat-options' : undefined} onClick={() => { cancelClose(); setOpen(value => !value) }} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); requestAnimationFrame(() => root.current?.querySelector<HTMLAnchorElement>('.chat-launcher-feature')?.focus()) } }}
      animate={still ? { x: 0, y: 0, rotate: 0, scale: 1 } : { x: [0,-3,3,-3,3,-2,2,0], rotate: [0,-7,7,-6,6,-3,3,0], y: [0,-5,0], scale: [1,1.045,1] }} transition={{ duration: 3.6, repeat: still ? 0 : Infinity, ease: 'easeInOut', x: { duration: still ? .15 : .65, repeat: still ? 0 : Infinity, repeatDelay: 7.35, delay: still ? 0 : 2.5, ease: 'easeInOut' }, rotate: { duration: still ? .15 : .65, repeat: still ? 0 : Infinity, repeatDelay: 7.35, delay: still ? 0 : 2.5, ease: 'easeInOut' } }} whileHover={reduceMotion ? undefined : { scale: 1.06 }} whileTap={reduceMotion ? undefined : { scale: .96 }}>
      <motion.span className="chat-launcher-pulse" aria-hidden="true" animate={still ? { opacity: 0, scale: 1 } : { opacity: [.4,0], scale: [1,1.65] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.1 }} />
      <HealthChatIcon still={still} />
    </motion.button>
  </motion.div>
}
