import { BotMessageSquare, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import '../styles/chat-launcher.css'

export function ChatLauncher() {
  return <div className="chat-launcher">
    <Link to="/ai-assistant" className="chat-launcher-button" aria-label="Open Kira chatbot" aria-describedby="chat-launcher-hint">
      <span className="chat-launcher-hint" id="chat-launcher-hint">Chat with Kira</span>
      <span className="chat-launcher-halo" aria-hidden="true" />
      <span className="chat-launcher-symbol" aria-hidden="true"><BotMessageSquare size={28} strokeWidth={1.75} /></span>
      <span className="chat-launcher-spark" aria-hidden="true"><Sparkles size={12} strokeWidth={1.8} /></span>
    </Link>
  </div>
}
