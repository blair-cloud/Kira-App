import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { BookOpen, CalendarDays, Check, CircleHelp, Heart, LockKeyhole, MessageCircle, ShieldCheck } from 'lucide-react'
import { MentalHealthHero } from '../components/MentalHealthHero'
import { LandingMotion } from '../components/LandingMotion'
import { WellnessIllustration } from '../components/WellnessIllustration'
import '../styles/support-section.css'

const services = [
  { label: 'INFORM', title: 'Explore Wellness', description: 'Discover reliable information about mental health, physical health, relationships, and general wellbeing.', to: '/resources', icon: BookOpen, tone: 'blue' },
  { label: 'ASK', title: 'Ask a Question', description: 'Share a confidential or anonymous question and find appropriate guidance.', to: '/ask', icon: CircleHelp, tone: 'lavender' },
  { label: 'CONNECT', title: 'Chat with a Professional', description: 'Find a private way to connect with authorized wellness professionals.', to: '/chat', icon: MessageCircle, tone: 'teal' },
  { label: 'SUPPORT', title: 'Book an Appointment', description: 'Explore counselling and medical consultation appointments.', to: '/appointments', icon: CalendarDays, tone: 'peach' },
]

function Services() {
  return <section className="support-section section-pad" id="services" aria-labelledby="support-heading"><div className="shell">
    <div className="support-section-intro">
      <div data-reveal><h2 id="support-heading" className="section-title">Support, one step at a time</h2><p className="section-subtitle mt-4">Whether you want to understand something, talk it through, or find care, there is a place to begin.</p></div>
      <div className="support-section-art" data-reveal data-animated-graphic><WellnessIllustration /></div>
    </div>
    <div className="support-card-grid">{services.map((service, index) => { const Icon = service.icon; return <Link to={service.to} key={service.label} className={`support-path-card support-path-${service.tone}`} data-reveal style={{ '--reveal-order': index } as CSSProperties}>
      <div className="support-card-art" aria-hidden="true" data-animated-graphic>
        <span className="support-art-orbit support-art-orbit-outer" /><span className="support-art-orbit support-art-orbit-inner" />
        <span className="support-icon-tile"><Icon size={36} strokeWidth={1.65} /></span>
        <span className="support-icon-badge"><Heart size={14} strokeWidth={1.8} /></span>
        <svg className="support-art-wave" viewBox="0 0 280 70" fill="none"><path d="M-20 50C30 50 30 10 80 10S130 60 180 40s70-40 120-20" stroke="currentColor" strokeWidth="1.2" /><path d="M-20 65C30 65 30 25 80 25s50 50 100 30 70-40 120-20" stroke="currentColor" strokeWidth="1.2" /></svg>
        <span className="support-art-dot first" /><span className="support-art-dot second" />
      </div>
      <div className="support-card-copy"><span className="support-card-label">{service.label}</span><h3>{service.title}</h3><p>{service.description}</p></div>
    </Link> })}</div>
  </div></section>
}

function BeginWhereYouAre() {
  return <section className="prototype-feature-section"><div className="shell prototype-feature-grid">
    <div className="prototype-feature-visual home-photo-panel" data-reveal><img src="/images/groupPhoto.jpg" alt="Kepler community members gathered around a table playing a board game" width={799} height={533} loading="lazy" decoding="async" /></div>
    <div className="prototype-feature-copy" data-reveal><span className="eyebrow">Care without pressure</span><h2>Begin wherever<br />you are today.</h2><p>Some days you need an answer. Other days you need a conversation. Kira App brings information, connection, and care into one calm place.</p><div className="prototype-feature-points"><span><Check size={18} /> Youth-friendly and welcoming</span><span><Check size={18} /> Grounded in reliable information</span></div><Link to="/check-in" className="btn btn-primary">Explore check-ins</Link></div>
  </div></section>
}

function AiSection() {
  return <section className="section-pad bg-[#f8fbfe]"><div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-20"><div data-reveal><h2 className="section-title">Wellness support, one question away.</h2><p className="section-subtitle mt-5">Explore everyday wellness questions and find relevant resources in a calm, conversational space.</p><div className="mt-6 space-y-3">{['How can I manage academic stress?', 'Where can I find support?', 'How do I prepare for a counselling session?'].map(question => <div key={question} className="flex items-center gap-3 text-sm text-main"><span className="grid h-7 w-7 place-items-center rounded-lg bg-softsky text-trust"><CircleHelp size={15} /></span>{question}</div>)}</div><p className="mt-7 max-w-lg text-xs leading-6 text-secondary">The AI assistant provides educational information and navigation help. It does not diagnose or treat health conditions. Qualified professionals are available for personal support.</p><Link to="/ai-assistant" className="btn btn-primary mt-7">Explore AI Assistant</Link></div><div className="ai-visual home-photo-panel" data-reveal><img src="/images/counselors.jpg" alt="Two people smiling with a Kepler World Mental Health Day frame" width={799} height={533} loading="lazy" decoding="async" /></div></div></section>
}


function TrustSection() {
  return <section className="confidentiality-section" aria-labelledby="confidentiality-heading"><div className="shell">
    <div className="confidentiality-panel" data-reveal>
      <div className="confidentiality-graphic" aria-hidden="true"><span className="confidentiality-ring" /><ShieldCheck size={88} strokeWidth={1.5} /><span className="confidentiality-lock"><LockKeyhole size={20} strokeWidth={1.8} /></span></div>
      <div className="confidentiality-copy"><h2 id="confidentiality-heading">Your privacy matters.</h2><p>Understand how your information is handled before you share.</p></div>
      <Link to="/privacy" className="confidentiality-link">About confidentiality</Link>
    </div>
  </div></section>
}

function FinalCta() {
  return <section className="bg-white py-20"><div className="shell"><div className="final-cta" data-reveal><div className="final-cta-decor" /><div className="relative z-10"><span className="text-xs font-bold uppercase tracking-[.16em] text-white/95">Your next step starts here</span><h2 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">Start taking care of your wellbeing today.</h2><p className="mt-4 text-sm text-white/90">Explore resources, ask questions, and find the support you need.</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/register" className="btn btn-white">Get Started</Link><Link to="/resources" className="btn btn-ghost">Explore Wellness</Link></div></div><div className="relative z-10 hidden h-40 w-40 flex-none items-center justify-center rounded-full border border-white/25 bg-white/10 lg:flex"><Heart size={67} className="text-white" strokeWidth={1.3} /></div></div></div></section>
}

export function LandingPage() {
  return <LandingMotion><MentalHealthHero /><Services /><BeginWhereYouAre /><AiSection /><TrustSection /><FinalCta /></LandingMotion>
}
