import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, NavLink } from 'react-router'
import { CalendarDays, Check, ChevronDown, CircleHelp, Heart, LifeBuoy, LockKeyhole, MessageCircle, Plus, Send, ShieldCheck, Sparkles, X } from 'lucide-react'
import { MedicalSupportIcon } from '../components/MedicalSupportIcon'
import '../styles/chat.css'

export type ChatMode = 'ask' | 'professional' | 'ai'
type Message = { id: string; role: 'user' | 'assistant'; text: string; time: string }
type Conversation = { id: string; title: string; messages: Message[]; pending: boolean }
const modes = {
  ask: { path: '/ask', label: 'Ask a Question', short: 'Confidential questions', icon: CircleHelp, title: 'A question is a good place to start.', description: 'Share what’s on your mind, at your own pace.', placeholder: 'What would you like to ask?', prompts: ['How can I find the right support?', 'Can I ask a question anonymously?', 'What happens in a counselling session?'] },
  professional: { path: '/chat', label: 'Chat with a Professional', short: 'Professional support', icon: MedicalSupportIcon, title: 'Make room for a conversation.', description: 'Explore a conversation with the wellness team.', placeholder: 'Write a message to the wellness team…', prompts: ['I would like to talk to someone.', 'How do I prepare for my first session?', 'I have a question about appointments.'] },
  ai: { path: '/ai-assistant', label: 'Ask AI Assistant', short: 'Kira AI assistant', icon: Sparkles, title: 'A little clarity, one question at a time.', description: 'Explore wellness topics and find your next step.', placeholder: 'Ask Kira about wellness or finding support…', prompts: ['Help me explore academic balance.', 'Where can I learn about wellbeing?', 'Help me find professional support.'] },
} as const

function createConversation(): Conversation { return { id: crypto.randomUUID(), title: 'New conversation', messages: [], pending: false } }
function previewReply(mode: ChatMode, text: string, anonymous: boolean, topic: string) {
  if (mode === 'professional') return `This is a preview of your message to ${topic.toLowerCase()}. No professional is connected and your message has not been sent. When live support is available, this space will show the team’s replies. You can explore appointment options in the meantime.`
  if (mode === 'ask') return `Your ${anonymous ? 'anonymous' : 'identified'} question is shown in this preview only; it has not been submitted. In the connected service, the wellness team will review your question about ${topic.toLowerCase()} and explain the next steps here.`
  if (/professional|appointment|session|someone|support/i.test(text)) return 'You can explore professional support through “Chat with a Professional” or see counselling and medical appointment options on the Appointments page. This is an example response; a live AI service is not connected yet.'
  if (/academic|study|course|balance|stress/i.test(text)) return 'The Learn tab has a resource on academic balance and a guide to understanding stress. They can be a useful place to begin exploring this topic. This is an example response; a live AI service is not connected yet.'
  return 'The Learn tab brings together resources about mental wellbeing, relationships, academic balance, and everyday movement. You can also choose professional support for a personal conversation. This is an example response; a live AI service is not connected yet.'
}

export function ChatPage({ mode }: { mode: ChatMode }) {
  const config = modes[mode]
  const Icon = config.icon
  const [conversations, setConversations] = useState<Record<ChatMode, Conversation[]>>(() => ({ ask: [createConversation()], professional: [createConversation()], ai: [createConversation()] }))
  const [selectedIds, setSelectedIds] = useState<Partial<Record<ChatMode, string>>>({})
  const [drafts, setDrafts] = useState<Record<ChatMode, string>>({ ask: '', professional: '', ai: '' })
  const [anonymous, setAnonymous] = useState(true)
  const [topic, setTopic] = useState('General wellbeing')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const viewport = useRef<HTMLElement>(null)
  const messageList = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const conversation = conversations[mode].find(item => item.id === selectedIds[mode]) ?? conversations[mode][0]
  const draft = drafts[mode]

  useEffect(() => { setSidebarOpen(false) }, [mode])
  useEffect(() => {
    const updateHeight = () => {
      const visual = window.visualViewport
      const height = visual && visual.scale === 1 ? visual.height : window.innerHeight
      viewport.current?.style.setProperty('--chat-viewport-height', height + 'px')
    }
    updateHeight()
    window.visualViewport?.addEventListener('resize', updateHeight)
    window.addEventListener('resize', updateHeight)
    return () => { window.visualViewport?.removeEventListener('resize', updateHeight); window.removeEventListener('resize', updateHeight) }
  }, [])
  useEffect(() => {
    const list = messageList.current
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'instant' })
  }, [conversation.id, conversation.messages.length, conversation.pending, mode])
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  function newConversation() {
    if (!conversation.messages.length) { composer.current?.focus(); setSidebarOpen(false); return }
    const next = createConversation()
    setConversations(previous => ({ ...previous, [mode]: [next, ...previous[mode]] }))
    setSelectedIds(previous => ({ ...previous, [mode]: next.id }))
    setDrafts(previous => ({ ...previous, [mode]: '' }))
    setSidebarOpen(false)
    composer.current?.focus()
  }
  function sendMessage(value = draft) {
    const text = value.trim()
    if (!text || conversation.pending || text.length > 2000) return
    const targetMode = mode, targetId = conversation.id
    const time = new Date().toISOString()
    const message: Message = { id: crypto.randomUUID(), role: 'user', text, time }
    const reply = previewReply(mode, text, anonymous, mode === 'ask' ? topic : 'Wellness team')
    setConversations(previous => ({ ...previous, [targetMode]: previous[targetMode].map(item => item.id === targetId ? { ...item, title: item.messages.length ? item.title : text.slice(0, 44), messages: [...item.messages, message], pending: true } : item) }))
    setDrafts(previous => ({ ...previous, [targetMode]: '' }))
    const timer = setTimeout(() => {
      setConversations(previous => ({ ...previous, [targetMode]: previous[targetMode].map(item => item.id === targetId ? { ...item, pending: false, messages: [...item.messages, { id: crypto.randomUUID(), role: 'assistant', text: reply, time: new Date().toISOString() }] } : item) }))
      timers.current.delete(timer)
    }, 650)
    timers.current.add(timer)
  }
  function submit(event: FormEvent) { event.preventDefault(); sendMessage() }
  function handleComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && !window.matchMedia('(max-width: 700px)').matches) { event.preventDefault(); sendMessage() }
  }

  return <main ref={viewport} className={`chat-page chat-mode-${mode}`} aria-label={config.label}>
    <div className="shell">
      <div className="chat-workspace">
        <button type="button" className="chat-mobile-sidebar" aria-expanded={sidebarOpen} aria-controls="chat-sidebar" onClick={() => setSidebarOpen(open => !open)}>{sidebarOpen ? <X size={18} /> : <MessageCircle size={18} />}Conversations<ChevronDown size={15} /></button>
        {sidebarOpen && <button type="button" className="chat-sidebar-backdrop" aria-label="Close conversations" onClick={() => setSidebarOpen(false)} />}
        <aside id="chat-sidebar" className={`chat-sidebar ${sidebarOpen ? 'chat-sidebar-open' : ''}`} aria-label="Chat navigation">
          <Link to="/" className="chat-sidebar-brand" aria-label="Kira App home"><span><Heart size={20} strokeWidth={1.7} /></span><div><strong>Kira support</strong><small>A place to begin</small></div></Link>
          <nav className="chat-mode-nav" aria-label="Choose support type">{(Object.keys(modes) as ChatMode[]).map(key => { const ModeIcon = modes[key].icon; return <NavLink key={key} to={modes[key].path} className={`chat-mode-link ${mode === key ? 'is-active' : ''}`}><ModeIcon size={18} strokeWidth={1.7} /><span>{modes[key].label}</span></NavLink> })}</nav>
          <button type="button" className="chat-new-button" onClick={newConversation}><Plus size={17} />New conversation</button>
          <div className="chat-history-heading">THIS VISIT<span>{conversations[mode].length}</span></div>
          <div className="chat-history">{conversations[mode].map(item => <button type="button" key={item.id} aria-current={conversation.id === item.id ? 'true' : undefined} className={`chat-history-item ${conversation.id === item.id ? 'is-active' : ''}`} onClick={() => { setSelectedIds(previous => ({ ...previous, [mode]: item.id })); setSidebarOpen(false) }}><MessageCircle size={15} /><span>{item.title}</span></button>)}</div>
          <div className="chat-sidebar-note"><ShieldCheck size={19} /><p>Preview conversations stay in this visit and clear when you refresh.</p></div>
          <Link to="/privacy" className="chat-urgent-link"><LockKeyhole size={16} />About confidentiality</Link>
          <Link to="/emergency" className="chat-urgent-link"><LifeBuoy size={16} />Need urgent support?</Link>
        </aside>
        <div className="chat-main">
          <header className="chat-conversation-header"><div className="chat-agent"><span className="chat-agent-avatar"><Icon size={23} strokeWidth={1.65} /></span><div><h1>{config.short}</h1><span className="chat-agent-status"><span />{mode === 'ai' ? 'AI preview · educational guidance' : mode === 'professional' ? 'Preview · no professional connected' : 'Preview · no questions submitted'}</span></div></div></header>
          {mode === 'ask' && <div className="chat-options"><label>Topic<select value={topic} onChange={event => setTopic(event.target.value)}>{['General wellbeing', 'Academic balance', 'Relationships', 'Accessing services'].map(item => <option key={item}>{item}</option>)}</select></label><label className="chat-anonymous"><input type="checkbox" checked={anonymous} onChange={event => setAnonymous(event.target.checked)} /><span className="chat-switch" aria-hidden="true" /><span>Ask anonymously</span></label></div>}
          <div className="chat-message-list" ref={messageList} role="log" aria-label="Conversation messages" aria-live="polite" aria-relevant="additions text">
            {!conversation.messages.length ? <div className="chat-empty"><div className="chat-welcome-art" aria-hidden="true"><span className="chat-welcome-ring" /><span className="chat-welcome-icon"><Icon size={43} strokeWidth={1.5} /></span><span className="chat-welcome-heart"><Heart size={16} /></span></div><h2>{config.title}</h2><p>{config.description}</p><div className="chat-prompts">{config.prompts.map(prompt => <button type="button" key={prompt} onClick={() => sendMessage(prompt)}><MessageCircle size={15} strokeWidth={1.6} /><span>{prompt}</span></button>)}</div><span className="chat-empty-note">Start with a suggestion, or write in your own words.</span></div> : <><div className="chat-day-label">Today · preview conversation</div>{conversation.messages.map(message => <div key={message.id} className={`chat-message chat-message-${message.role}`}>{message.role === 'assistant' && <span className="chat-message-avatar"><Icon size={17} strokeWidth={1.7} /></span>}<div className="chat-message-content"><span className="chat-message-name">{message.role === 'user' ? mode === 'ask' && anonymous ? 'You · anonymous' : 'You' : mode === 'ai' ? 'Kira · example response' : 'Preview assistant'}</span><div className="chat-bubble"><p>{message.text}</p></div><span className="chat-message-time">{new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{message.role === 'user' && <><Check size={12} />Preview only</>}</span></div></div>)}{conversation.pending && <div className="chat-pending" role="status"><span /><span /><span /><span className="sr-only">Preparing a preview response</span></div>}{mode !== 'ai' && !conversation.pending && <Link to="/appointments" className="chat-appointment-link"><CalendarDays size={15} />Explore appointment options</Link>}</>}
          </div>
          <div className="chat-composer-area"><form className="chat-composer" onSubmit={submit}><label className="sr-only" htmlFor="chat-message">Your message</label><textarea ref={composer} id="chat-message" rows={2} maxLength={2000} value={draft} placeholder={config.placeholder} onChange={event => setDrafts(previous => ({ ...previous, [mode]: event.target.value }))} onKeyDown={handleComposerKey} /><div className="chat-composer-bottom"><span>{draft.length ? `${draft.length}/2000` : 'Your words. Your pace.'}</span><button type="submit" className="chat-send" disabled={!draft.trim() || conversation.pending} aria-label="Send preview message"><span>Send</span><Send size={15} strokeWidth={1.7} /></button></div></form><div className="chat-composer-note"><span><LockKeyhole size={12} />Preview only · not saved after refresh</span>{mode === 'ai' && <span>AI information does not replace professional care.</span>}</div></div>
        </div>
      </div>
    </div>
  </main>
}
