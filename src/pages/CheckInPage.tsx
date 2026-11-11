import { useState } from 'react'
import { ArrowRight, Cloud, Heart, Leaf, MessageCircle, Smile, Sparkles, Sun, Waves } from 'lucide-react'
import { Link } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import { PageHero } from '../components/PageHero'

type Mood = 'Great' | 'Okay' | 'Low' | 'Anxious' | 'Not sure'
const moods: { label: Mood; icon: LucideIcon }[] = [
  { label: 'Great', icon: Sun }, { label: 'Okay', icon: Smile }, { label: 'Low', icon: Cloud }, { label: 'Anxious', icon: Waves }, { label: 'Not sure', icon: Sparkles },
]
const suggestions: Record<Mood, string> = {
  Great: 'It is good to notice moments that feel positive. What helped today? Consider making a little space for it again.',
  Okay: 'An ordinary day counts, too. A short break or a check-in with someone could help you stay connected to yourself.',
  Low: 'You deserve support on difficult days. Consider reaching out to someone you trust or exploring the support options here.',
  Anxious: 'Try placing both feet on the floor and taking a slow breath. If the feeling continues or feels hard to manage, support is available.',
  'Not sure': 'That is okay. You do not need to name a feeling perfectly. Start by noticing your energy or what you need next.',
}

export function CheckInPage() {
  const [mood, setMood] = useState<Mood | null>(null)

  return <>
    <PageHero eyebrow="Check-in" title="A moment to notice how you feel" description="A gentle pause can help you understand what you need today. Choose a feeling to see a supportive next step." icon={Heart} />
    <section className="section-pad bg-[#f8fbfd]"><div className="shell prototype-checkin-grid"><div className="prototype-checkin-panel"><span className="eyebrow">Today's check-in</span><h2>How are you feeling right now?</h2><p>There is no right answer. This check-in stays on this page and is not saved.</p><div className="prototype-mood-grid" role="group" aria-label="Choose how you feel">{moods.map(item => { const Icon = item.icon; return <button key={item.label} type="button" className={mood === item.label ? 'selected' : ''} aria-pressed={mood === item.label} onClick={() => setMood(item.label)}><Icon size={29} strokeWidth={1.7} /><span>{item.label}</span></button> })}</div><div className="prototype-mood-result" role="status">{mood ? <><Sparkles size={22} /><strong>Thank you for checking in.</strong><p>{suggestions[mood]}</p><Link to="/ask">Explore support <ArrowRight size={16} /></Link></> : <span className="prototype-mood-placeholder">Choose a feeling to see a gentle suggestion.</span>}</div></div><aside className="prototype-checkin-side"><div className="prototype-side-card"><span className="service-icon service-icon-teal"><Leaf size={25} /></span><h3>Pause and breathe</h3><p>Take one slow breath. Notice where you are and what feels most important right now.</p></div><div className="prototype-side-card"><span className="service-icon service-icon-lavender"><MessageCircle size={25} /></span><h3>Need to talk?</h3><p>You can explore ways to ask a question or connect with support.</p><Link to="/ask">Explore support <ArrowRight size={16} /></Link></div></aside></div></section>
  </>
}
