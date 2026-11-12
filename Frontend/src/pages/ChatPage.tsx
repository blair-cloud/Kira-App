import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, NavLink } from 'react-router'
import { CalendarDays, Check, ChevronDown, CircleHelp, Heart, Siren, LockKeyhole, MessageCircle, Moon, PanelLeftClose, PanelLeftOpen, Plus, Send, ShieldCheck, Sparkles, Sun, X } from 'lucide-react'
import { MedicalSupportIcon } from '../components/MedicalSupportIcon'
import '../styles/chat.css'
import { localDemoEnabled } from '../services/localDemo'
import { useAuth } from '../auth/AuthProvider'
import { useApi } from '../hooks/useApi'
import { api, dashboardPath, errorMessage, post, type ChatMessage, type Conversation as RemoteConversation, type Page, type Professional, type Question } from '../services/api'
import { useNavigate } from 'react-router'

export type ChatMode = 'ask' | 'professional' | 'ai'
type Message = { id: string; role: 'user' | 'assistant'; text: string; time: string }
type Conversation = { id: string; remoteId?: string; title: string; messages: Message[]; pending: boolean }
const modes = {
  ask: { path: '/ask', label: 'Ask a Question', short: 'Confidential questions', icon: CircleHelp, title: 'A question is a good place to start.', description: 'Share what’s on your mind, at your own pace.', placeholder: 'What would you like to ask?', prompts: ['How can I find the right support?', 'Can I ask a question anonymously?', 'What happens in a counselling session?'] },
  professional: { path: '/chat', label: 'Chat with a Professional', short: 'Professional support', icon: MedicalSupportIcon, title: 'Make room for a conversation.', description: 'Explore a conversation with the wellness team.', placeholder: 'Write a message to the wellness team…', prompts: ['I would like to talk to someone.', 'How do I prepare for my first session?', 'I have a question about appointments.'] },
  ai: { path: '/ai-assistant', label: 'Ask AI Assistant', short: 'Kira AI assistant', icon: Sparkles, title: 'A little clarity, one question at a time.', description: 'Explore wellness topics and find your next step.', placeholder: 'Ask Kira about wellness or finding support…', prompts: ['Help me explore academic balance.', 'Where can I learn about wellbeing?', 'Help me find professional support.'] },
} as const

function createConversation(): Conversation { return { id: crypto.randomUUID(), title: 'New conversation', messages: [], pending: false } }
function mapQuestion(question: Question): Conversation {
  const replies = question.responses as (Question['responses'][number] & { sender_role?: string })[]
  return { id: question.id, remoteId: question.id, title: question.body.slice(0, 44), pending: false, messages: [{ id: question.id, role: 'user', text: question.body, time: (question as Question & { created_at: string }).created_at }, ...replies.map(item => ({ id: item.id, role: item.sender_role === 'student' ? 'user' as const : 'assistant' as const, text: item.body, time: item.created_at }))] }
}
function mapMessages(items: ChatMessage[], userId: string): Message[] { return items.map(item => ({ id: item.id, role: item.sender_id === userId ? 'user' : 'assistant', text: item.body, time: item.created_at })) }

export function ChatPage({ mode }: { mode: ChatMode }) {
  const config = modes[mode]
  const { profile } = useAuth()
  const navigate = useNavigate()
  const professionals = useApi<Professional[]>('/professionals')
  const [professionalId, setProfessionalId] = useState('')
  const [serviceError, setServiceError] = useState('')
  const [historyLoading, setHistoryLoading] = useState(false)
  useEffect(() => { if (!professionalId && professionals.data?.length) setProfessionalId(professionals.data[0].id) }, [professionalId, professionals.data])
  const Icon = config.icon
  const [conversations, setConversations] = useState<Record<ChatMode, Conversation[]>>(() => ({ ask: [createConversation()], professional: [createConversation()], ai: [createConversation()] }))
  const [selectedIds, setSelectedIds] = useState<Partial<Record<ChatMode, string>>>({})
  const [drafts, setDrafts] = useState<Record<ChatMode, string>>({ ask: '', professional: '', ai: '' })
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { const saved = localStorage.getItem('kira-chat-theme'); if (saved === 'light' || saved === 'dark') return saved } catch { /* Use system preference when storage is unavailable. */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [anonymous, setAnonymous] = useState(true)
  const [topic, setTopic] = useState('General wellbeing')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const followResponse = useRef(true)
  const viewport = useRef<HTMLElement>(null)
  const messageList = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)
  const conversation = conversations[mode].find(item => item.id === selectedIds[mode]) ?? conversations[mode][0]
  const draft = drafts[mode]

  useEffect(() => { setSidebarOpen(false) }, [mode])
  useLayoutEffect(() => { setConversations({ ask: [createConversation()], professional: [createConversation()], ai: [createConversation()] }); setSelectedIds({}); setDrafts({ ask: '', professional: '', ai: '' }) }, [profile?.id])
  useEffect(() => { try { localStorage.setItem('kira-chat-theme', theme) } catch { /* Theme still works without storage. */ } }, [theme])
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
  useLayoutEffect(() => {
    const list = messageList.current
    if (list && followResponse.current) list.scrollTo({ top: list.scrollHeight, behavior: 'instant' })
  }, [conversation.id, conversation.messages, conversation.pending, mode])
  useEffect(() => { followResponse.current = true; setShowScrollToBottom(false) }, [conversation.id, mode])

  useLayoutEffect(() => {
    const input = composer.current
    if (!input) return
    const resize = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(input).lineHeight) || 24
      input.style.height = lineHeight + 'px'
      const contentHeight = input.scrollHeight
      const maximumHeight = lineHeight * 5
      input.style.height = Math.min(contentHeight, maximumHeight) + 'px'
      input.style.overflowY = contentHeight > maximumHeight ? 'auto' : 'hidden'
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [draft, mode, conversation.id, conversation.messages.length, sidebarCollapsed])

  useEffect(() => {
    let active = true
    setServiceError('')
    setConversations(previous => ({ ...previous, [mode]: [createConversation()] }))
    setSelectedIds(previous => ({ ...previous, [mode]: undefined }))
    if (!profile || profile.role !== 'student') return
    setHistoryLoading(true)
    const request = mode === 'ask' ? api<Page<Question>>('/student/questions').then(result => result.items.map(mapQuestion)) : api<Page<RemoteConversation>>('/conversations').then(result => result.items.filter(item => item.mode === (mode === 'ai' ? 'ai' : 'professional')).map(item => ({ id: item.id, remoteId: item.id, title: item.title, messages: [] as Message[], pending: false })))
    void request.then(items => { if (active) { setConversations(previous => ({ ...previous, [mode]: items.length ? items : [createConversation()] })); setSelectedIds(previous => ({ ...previous, [mode]: items[0]?.id })) } }).catch(reason => { if (active) setServiceError(errorMessage(reason)) }).finally(() => { if (active) setHistoryLoading(false) })
    return () => { active = false }
  }, [profile?.id, mode])
  useEffect(() => {
    const remoteId = conversation.remoteId
    if (!remoteId || !profile || conversation.pending) return
    let active = true
    const update = async () => {
      try {
        if (mode === 'ask') {
          const result = await api<Question>(`/student/questions/${remoteId}`)
          if (active) setConversations(previous => ({ ...previous, [mode]: previous[mode].map(item => item.remoteId === remoteId && !item.pending ? { ...mapQuestion(result), id: item.id } : item) }))
        } else {
          const result = await api<Page<ChatMessage>>(`/conversations/${remoteId}/messages`)
          if (active) setConversations(previous => ({ ...previous, [mode]: previous[mode].map(item => item.remoteId === remoteId && !item.pending ? { ...item, messages: mapMessages(result.items, profile.id) } : item) }))
          await post(`/conversations/${remoteId}/read`, {})
        }
      } catch (reason) { if (active) setServiceError(errorMessage(reason)) }
    }
    void update()
    const timer = setInterval(() => { if (!document.hidden) void update() }, 5000)
    return () => { active = false; clearInterval(timer) }
  }, [conversation.remoteId, conversation.pending, profile?.id, mode])

  function newConversation() {
    if (!conversation.messages.length) { composer.current?.focus(); setSidebarOpen(false); return }
    const next = createConversation()
    setConversations(previous => ({ ...previous, [mode]: [next, ...previous[mode]] }))
    setSelectedIds(previous => ({ ...previous, [mode]: next.id }))
    setDrafts(previous => ({ ...previous, [mode]: '' }))
    setSidebarOpen(false)
    followResponse.current = true
    requestAnimationFrame(() => composer.current?.focus({ preventScroll: true }))
  }
  async function sendMessage(value = draft) {
    const text = value.trim()
    if (!text || conversation.pending) return
    if (!profile) { navigate('/login', { state: { from: modes[mode].path } }); return }
    if (profile.role !== 'student') { navigate(dashboardPath(profile.role)); return }
    const targetMode = mode, targetId = conversation.id
    const optimisticId = crypto.randomUUID()
    const message: Message = { id: optimisticId, role: 'user', text, time: new Date().toISOString() }
    setServiceError('')
    setConversations(previous => ({ ...previous, [targetMode]: previous[targetMode].map(item => item.id === targetId ? { ...item, messages: [...item.messages, message], pending: true } : item) }))
    setDrafts(previous => ({ ...previous, [targetMode]: '' }))
    followResponse.current = true
    try {
      let remoteId = conversation.remoteId
      if (targetMode === 'ask') {
        const result = remoteId ? await post<Question>(`/student/questions/${remoteId}/respond`, { body: text, private_note: false }) : await post<Question>('/student/questions', { body: text, category: topic, anonymous, professional_id: professionalId || null })
        const next = mapQuestion(result)
        setConversations(previous => ({ ...previous, [targetMode]: previous[targetMode].map(item => item.id === targetId ? { ...next, id: targetId } : item) }))
      } else {
        if (!remoteId) {
          if (targetMode === 'professional' && !professionalId) throw new Error('No wellness professional is listed yet. Use Contact to reach the office.')
          const created = await post<RemoteConversation>('/conversations', { mode: targetMode === 'ai' ? 'ai' : 'professional', professional_id: targetMode === 'professional' ? professionalId : null })
          remoteId = created.id
          setConversations(previous => ({ ...previous, [targetMode]: previous[targetMode].map(item => item.id === targetId ? { ...item, remoteId } : item) }))
        }
        await post(`/conversations/${remoteId}/messages`, { body: text })
        const result = await api<Page<ChatMessage>>(`/conversations/${remoteId}/messages`)
        const savedId = remoteId
        setConversations(previous => ({ ...previous, [targetMode]: previous[targetMode].map(item => item.id === targetId ? { ...item, remoteId: savedId, title: item.title === 'New conversation' ? text.slice(0, 44) : item.title, pending: false, messages: mapMessages(result.items, profile.id) } : item) }))
      }
    } catch (reason) {
      setServiceError(errorMessage(reason))
      setDrafts(previous => ({ ...previous, [targetMode]: text }))
      setConversations(previous => ({ ...previous, [targetMode]: previous[targetMode].map(item => item.id === targetId ? { ...item, pending: false, messages: item.messages.filter(message => message.id !== optimisticId) } : item) }))
    }
    requestAnimationFrame(() => composer.current?.focus({ preventScroll: true }))
  }
  function trackMessageScroll() {
    const list = messageList.current
    if (!list) return
    const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80
    followResponse.current = atBottom
    setShowScrollToBottom(!atBottom)
  }
  function scrollToLatest() {
    followResponse.current = true
    setShowScrollToBottom(false)
    messageList.current?.scrollTo({ top: messageList.current.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  function submit(event: FormEvent) { event.preventDefault(); sendMessage() }
  function handleComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && !window.matchMedia('(max-width: 700px)').matches) { event.preventDefault(); sendMessage() }
  }

  const composerPanel = <div className="chat-composer-area"><form className="chat-composer" onSubmit={submit}><label className="sr-only" htmlFor="chat-message">Your message</label><textarea ref={composer} id="chat-message" rows={1} value={draft} onChange={event => setDrafts(previous => ({ ...previous, [mode]: event.target.value }))} onKeyDown={handleComposerKey} /><div className="chat-composer-bottom">{conversation.pending ? <button type="button" className="chat-send chat-stop" aria-label="Sending message" disabled><Send size={17} /></button> : <button type="submit" className="chat-send" disabled={!draft.trim()} aria-label="Send message"><Send size={17} strokeWidth={1.7} /></button>}</div></form><div className="chat-composer-note"><span><LockKeyhole size={12} />{localDemoEnabled ? 'Browser preview · messages stay in this tab' : profile ? 'Saved to your private account' : 'Log in to send a private message'}</span>{mode === 'ai' && <span>AI information does not replace professional care.</span>}</div></div>

  return <main ref={viewport} className={`chat-page chat-mode-${mode}`} data-theme={theme} aria-label={config.label}>
    <div className="shell">
      <div className={`chat-workspace ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
        <button type="button" className="chat-mobile-sidebar" aria-expanded={sidebarOpen} aria-controls="chat-sidebar" onClick={() => setSidebarOpen(open => !open)}>{sidebarOpen ? <X size={18} /> : <MessageCircle size={18} />}Conversations<ChevronDown size={15} /></button>
        {sidebarOpen && <button type="button" className="chat-sidebar-backdrop" aria-label="Close conversations" onClick={() => setSidebarOpen(false)} />}
        <aside id="chat-sidebar" className={`chat-sidebar ${sidebarOpen ? 'chat-sidebar-open' : ''}`} aria-label="Chat navigation">
          <Link to="/" className="chat-sidebar-brand" aria-label="Kira App home"><span><img src="/images/kira-brain-health-logo-outline-blue-deep-green.png" alt="" width={32} height={32} /></span><div><strong>Kira support</strong><small>A place to begin</small></div></Link>
          <nav className="chat-mode-nav" aria-label="Choose support type">{(Object.keys(modes) as ChatMode[]).map(key => { const ModeIcon = modes[key].icon; return <NavLink key={key} to={modes[key].path} className={`chat-mode-link ${mode === key ? 'is-active' : ''}`} title={modes[key].label} aria-label={modes[key].label}><ModeIcon size={18} strokeWidth={1.7} /><span>{modes[key].label}</span></NavLink> })}</nav>
          <button type="button" className="chat-new-button" onClick={newConversation} aria-label="New conversation" title="New conversation"><Plus size={18} /><span>New conversation</span></button>
          <div className="chat-history-heading">THIS VISIT<span>{conversations[mode].length}</span></div>
          <div className="chat-history">{conversations[mode].map(item => <button type="button" key={item.id} aria-current={conversation.id === item.id ? 'true' : undefined} className={`chat-history-item ${conversation.id === item.id ? 'is-active' : ''}`} onClick={() => { followResponse.current = true; setSelectedIds(previous => ({ ...previous, [mode]: item.id })); setSidebarOpen(false) }}><MessageCircle size={15} /><span>{item.title}</span></button>)}</div>
          <div className="chat-sidebar-note"><ShieldCheck size={19} /><p>Preview conversations stay in this visit and clear when you refresh.</p></div>
          <Link to="/privacy" className="chat-urgent-link" aria-label="About confidentiality" title="About confidentiality"><LockKeyhole size={17} /><span>About confidentiality</span></Link>
          <Link to="/emergency" className="chat-urgent-link" aria-label="Need urgent support?" title="Need urgent support?"><Siren size={17} /><span>Need urgent support?</span></Link>
        </aside>
        <div className={`chat-main ${!conversation.messages.length ? 'is-new-chat' : ''}`}>
          <header className="chat-conversation-header"><div className="chat-header-leading"><button type="button" className="chat-sidebar-toggle" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!sidebarCollapsed} aria-controls="chat-sidebar" onClick={() => setSidebarCollapsed(value => !value)}>{sidebarCollapsed ? <PanelLeftOpen size={21} strokeWidth={1.7} /> : <PanelLeftClose size={21} strokeWidth={1.7} />}</button><div className="chat-agent"><span className="chat-agent-avatar"><Icon size={23} strokeWidth={1.65} /></span><div><h1>{config.short}</h1><span className="chat-agent-status"><span />{mode === 'ai' ? 'Knowledge assistant · educational guidance' : mode === 'professional' ? 'Messages to your selected professional' : 'Confidential support questions'}</span></div></div></div><button type="button" className="chat-theme-toggle" aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} aria-pressed={theme === 'dark'} onClick={() => setTheme(value => value === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={19} strokeWidth={1.7} /> : <Sun size={19} strokeWidth={1.7} />}</button></header>
          {mode === 'ask' && <div className="chat-options"><label>Topic<select value={topic} onChange={event => setTopic(event.target.value)}>{['General wellbeing', 'Academic balance', 'Relationships', 'Accessing services'].map(item => <option key={item}>{item}</option>)}</select></label><label className="chat-anonymous"><input type="checkbox" checked={anonymous} onChange={event => setAnonymous(event.target.checked)} /><span className="chat-switch" aria-hidden="true" /><span>Ask anonymously</span></label></div>}
          {serviceError && <p className="chat-service-feedback" role="alert">{serviceError}</p>}{historyLoading && <p className="chat-service-feedback" role="status">Loading your history…</p>}{!conversation.remoteId && mode !== 'ai' && professionals.data && professionals.data.length > 0 && <div className="chat-professional-choice" role="group" aria-label="Choose wellness professional">{professionals.data.map(person => <button type="button" key={person.id} aria-pressed={professionalId === person.id} className={professionalId === person.id ? 'selected' : ''} onClick={() => setProfessionalId(person.id)}><MedicalSupportIcon size={18} /><span>{person.full_name}</span></button>)}</div>}{mode === 'ask' && anonymous && <p className="chat-anonymity-note">Your identity is hidden from the assigned professional. Anonymous questions may limit follow-up support.</p>}
          <div className="chat-log-region"><div className="chat-message-list" ref={messageList} onScroll={trackMessageScroll} role="log" aria-label="Conversation messages" aria-live="polite" aria-relevant="additions text">
            {!conversation.messages.length ? <div className="chat-empty"><div className="chat-welcome-art" aria-hidden="true"><span className="chat-welcome-ring" /><span className="chat-welcome-icon"><Icon size={43} strokeWidth={1.5} /></span><span className="chat-welcome-heart"><Heart size={16} /></span></div><h2>{config.title}</h2><p>{config.description}</p>{composerPanel}<div className="chat-prompts">{config.prompts.map(prompt => <button type="button" key={prompt} onClick={() => sendMessage(prompt)}><MessageCircle size={15} strokeWidth={1.6} /><span>{prompt}</span></button>)}</div></div> : <><div className="chat-day-label">Your conversation</div>{conversation.messages.map(message => <div key={message.id} className={`chat-message chat-message-${message.role}`}>{message.role === 'assistant' && <span className="chat-message-avatar"><Icon size={17} strokeWidth={1.7} /></span>}<div className="chat-message-content"><span className="chat-message-name">{message.role === 'user' ? mode === 'ask' && anonymous ? 'You · anonymous' : 'You' : mode === 'ai' ? 'Kira knowledge assistant' : 'Wellness professional'}</span><div className="chat-bubble"><p>{message.text}</p></div><span className="chat-message-time">{new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{message.role === 'user' && <><Check size={12} />{localDemoEnabled ? 'Preview' : 'Sent'}</>}</span></div></div>)}{conversation.pending && conversation.messages.at(-1)?.role !== 'assistant' && <div className="chat-pending" role="status"><span /><span /><span /><span className="sr-only">Sending your message</span></div>}{mode !== 'ai' && !conversation.pending && <Link to="/appointments" className="chat-appointment-link"><CalendarDays size={15} />Explore appointment options</Link>}</>}
          </div>{showScrollToBottom && !!conversation.messages.length && <button type="button" className="chat-scroll-bottom" aria-label="Scroll to latest message" onClick={scrollToLatest}><ChevronDown size={18} /></button>}</div>
          {!!conversation.messages.length && composerPanel}
        </div>
      </div>
    </div>
  </main>
}
