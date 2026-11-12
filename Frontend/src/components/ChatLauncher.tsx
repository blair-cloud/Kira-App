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
  return <span className="health-chat-icon" aria-hidden="true">
    <svg className="health-chat-bubble" viewBox="0 0 48 48" fill="none"><path d="M12 5h24a7 7 0 0 1 7 7v21a7 7 0 0 1-7 7H22l-11 6v-6a7 7 0 0 1-7-7V12a7 7 0 0 1 8-7Z" stroke="white" strokeWidth="2" strokeLinejoin="round" /></svg>
    <motion.img className="health-chat-brain" src="/images/kira-brain-health-logo-outline-blue-deep-green.png" alt="" width={31} height={31}
      animate={still ? { scale: 1, y: 0 } : { scale: [1, 1.12, 1], y: [0, -1, 0] }} transition={{ duration: 2, repeat: still ? 0 : Infinity, repeatDelay: .6, ease: 'easeInOut' }} />
  </span>
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
