import { Link } from 'react-router'
import { ArrowRight, BookOpen, Brain, CalendarDays, Check, ChevronRight, CircleHelp, Clock3, Heart, HeartHandshake, LockKeyhole, MessageCircle, ShieldCheck, Sparkles, Stethoscope, TrendingUp, UserRoundCheck, Users } from 'lucide-react'
import { DailyWellnessCarousel } from '../components/DailyWellnessCarousel'
import { HeroDailyCard } from '../components/HeroDailyCard'
import { resources } from '../data/wellness'

const services = [
  { label: 'INFORM', title: 'Explore Wellness', description: 'Discover reliable information about mental health, physical health, relationships, and general wellbeing.', to: '/resources', icon: BookOpen, tone: 'blue' },
  { label: 'ASK', title: 'Ask a Question', description: 'Share a confidential or anonymous question and find appropriate guidance.', to: '/ask', icon: CircleHelp, tone: 'lavender' },
  { label: 'CONNECT', title: 'Chat with a Professional', description: 'Find a private way to connect with authorized wellness professionals.', to: '/chat', icon: MessageCircle, tone: 'teal' },
  { label: 'SUPPORT', title: 'Book an Appointment', description: 'Explore counselling and medical consultation appointments.', to: '/appointments', icon: CalendarDays, tone: 'peach' },
]

const steps = [
  { label: 'INFORM', detail: 'Find trusted information', icon: BookOpen },
  { label: 'ASK', detail: 'Share a question', icon: CircleHelp },
  { label: 'CONNECT', detail: 'Reach a professional', icon: Users },
  { label: 'SUPPORT', detail: 'Choose a next step', icon: HeartHandshake },
  { label: 'MONITOR', detail: 'Check in with yourself', icon: Heart },
  { label: 'IMPROVE', detail: 'Shape better services', icon: TrendingUp },
]

const trust = [
  { icon: LockKeyhole, title: 'Confidential Support', text: 'Choose how to begin a conversation. Each service will explain how information is handled before you share it.' },
  { icon: ShieldCheck, title: 'Secure Access', text: 'Account and data controls will be designed around the privacy needs of the Kepler community.' },
  { icon: UserRoundCheck, title: 'Professional Guidance', text: 'Human support pathways connect students with authorized wellness staff when personal care is needed.' },
]

function Hero() {
  return <section className="prototype-hero">
    <div className="shell prototype-hero-grid">
      <div className="prototype-hero-content">
        <span className="prototype-hero-badge"><Heart size={16} fill="currentColor" /> Your wellbeing matters here</span>
        <h1>Feel better.<br /><span>Find your way.</span></h1>
        <p>Discover trusted wellness information, ask questions confidentially, and connect with professional support. Your journey towards a healthier and more supported university experience starts here.</p>
        <div className="prototype-hero-actions"><Link to="/register" className="btn btn-primary">Get Started <ArrowRight size={18} /></Link><Link to="/resources" className="btn btn-outline">Explore Wellness <BookOpen size={18} /></Link></div>
        <div className="prototype-hero-trust"><span><ShieldCheck size={18} /> Designed for privacy</span><span><Clock3 size={18} /> Here at your pace</span></div>
      </div>
      <HeroDailyCard />
    </div>
    <span className="prototype-hero-ring ring-one" aria-hidden="true" /><span className="prototype-hero-ring ring-two" aria-hidden="true" />
  </section>
}

function Services() {
  return <section className="section-pad bg-white" id="services"><div className="shell">
    <div className="text-center"><span className="eyebrow">A space built around you</span><h2 className="section-title mx-auto mt-3">Support, one step at a time</h2><p className="section-subtitle mx-auto mt-3 max-w-2xl">Whether you want to understand something, talk it through, or find care, there is a place to begin.</p></div>
    <div className="mt-11 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{services.map(service => { const Icon = service.icon; return <Link to={service.to} key={service.label} className="service-card group"><span className={`service-icon service-icon-${service.tone}`}><Icon size={27} strokeWidth={1.8} /></span><span className="mt-6 block text-[11px] font-extrabold tracking-[.15em] text-trust">{service.label}</span><h3 className="mt-2 text-[19px] font-extrabold tracking-tight text-navy">{service.title}</h3><p className="mt-3 text-sm leading-6 text-secondary">{service.description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-trust group-hover:gap-3">Learn More <ArrowRight size={16} /></span></Link> })}</div>
  </div></section>
}

function BeginWhereYouAre() {
  return <section className="prototype-feature-section"><div className="shell prototype-feature-grid">
    <div className="prototype-feature-visual" aria-hidden="true"><span className="feature-ring first" /><span className="feature-ring second" /><span className="feature-heart"><Heart size={54} strokeWidth={1.6} /><strong>Small steps.<br />Stronger wellbeing.</strong></span><span className="feature-note feature-note-top"><Sparkles size={18} /> Take a breath</span><span className="feature-note feature-note-bottom"><ShieldCheck size={18} /> You belong here</span></div>
    <div className="prototype-feature-copy"><span className="eyebrow">Care without pressure</span><h2>Begin wherever<br />you are today.</h2><p>Some days you need an answer. Other days you need a conversation. Wellness App brings information, connection, and care into one calm place.</p><div className="prototype-feature-points"><span><Check size={18} /> Youth-friendly and welcoming</span><span><Check size={18} /> Designed for privacy and trust</span><span><Check size={18} /> Grounded in reliable information</span></div><Link to="/check-in" className="btn btn-primary">Explore check-ins <ArrowRight size={18} /></Link></div>
  </div></section>
}

function Journey() {
  return <section className="section-pad bg-white" id="how-it-works"><div className="shell"><div className="text-center"><span className="eyebrow">A clear path to support</span><h2 className="section-title mx-auto mt-3">How it works</h2><p className="section-subtitle mx-auto mt-3 max-w-xl">Start wherever you are. Each step makes it easier to find the information and support you need.</p></div><div className="mt-12 grid gap-4 md:grid-cols-3 xl:grid-cols-6">{steps.map((step,index) => { const Icon = step.icon; return <div key={step.label} className="step-card"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-softsky text-trust"><Icon size={22} /></span>{index < steps.length - 1 && <ChevronRight size={18} className="hidden text-[#9eb8c9] xl:block" />}</div><span className="mt-5 block text-[11px] font-extrabold tracking-[.13em] text-trust">0{index + 1} / {step.label}</span><p className="mt-2 text-sm font-semibold leading-5 text-main">{step.detail}</p></div> })}</div></div></section>
}

function AiSection() {
  return <section className="section-pad bg-[#f4f8fc]"><div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-20"><div className="ai-visual"><div className="ai-glow" /><div className="ai-chat ai-chat-left"><span className="ai-avatar"><Brain size={19} /></span><p>What can I do when I feel overwhelmed by coursework?</p></div><div className="ai-chat ai-chat-right"><span className="ai-avatar ai-avatar-teal"><Sparkles size={19} /></span><p>We can explore a few small steps, or I can help you find human support.</p></div><div className="ai-status"><span className="h-2 w-2 rounded-full bg-teal" /> Educational guidance · AI assistant</div></div><div><span className="eyebrow">AI wellness assistant</span><h2 className="section-title mt-3">Wellness support, one question away.</h2><p className="section-subtitle mt-5">Explore everyday wellness questions and find relevant resources in a calm, conversational space.</p><div className="mt-6 space-y-3">{['How can I manage academic stress?', 'Where can I find support?', 'How do I prepare for a counselling session?'].map(question => <div key={question} className="flex items-center gap-3 text-sm text-main"><span className="grid h-7 w-7 place-items-center rounded-lg bg-softsky text-trust"><CircleHelp size={15} /></span>{question}</div>)}</div><p className="mt-7 max-w-lg text-xs leading-6 text-secondary">The AI assistant provides educational information and navigation help. It does not diagnose or treat health conditions. Qualified professionals are available for personal support.</p><Link to="/ai-assistant" className="btn btn-primary mt-7">Explore AI Assistant <ArrowRight size={17} /></Link></div></div></section>
}

function FeaturedResources() {
  return <section className="section-pad bg-white"><div className="shell"><div className="flex flex-wrap items-end justify-between gap-5"><div><span className="eyebrow">Explore and learn</span><h2 className="section-title mt-3">Featured wellness resources</h2><p className="section-subtitle mt-3">Thoughtful starting points for the questions students often bring.</p></div><Link to="/resources" className="inline-flex items-center gap-2 text-sm font-bold text-trust hover:underline">View all resources <ArrowRight size={17} /></Link></div><div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{resources.map((resource,index) => <Link to={`/resources/${resource.slug}`} key={resource.slug} className="resource-card group"><div className={`resource-art resource-art-${resource.tone}`}><span className="resource-art-circle" />{index === 0 ? <Brain size={47} /> : index === 1 ? <BookOpen size={47} /> : index === 2 ? <HeartHandshake size={47} /> : <Stethoscope size={47} />}</div><div className="p-5"><div className="flex items-center justify-between gap-2 text-[11px] font-bold text-secondary"><span className="uppercase tracking-[.1em] text-trust">{resource.category}</span><span>{resource.minutes} min read</span></div><h3 className="mt-3 min-h-[50px] text-base font-extrabold leading-6 text-navy">{resource.title}</h3><p className="mt-2 min-h-[68px] text-xs leading-5 text-secondary">{resource.description}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-trust group-hover:gap-3">Read More <ArrowRight size={16} /></span></div></Link>)}</div></div></section>
}

function TrustSection() {
  return <section className="section-pad bg-[#f4f8fc]"><div className="shell"><div className="max-w-2xl"><span className="eyebrow">Privacy and trust</span><h2 className="section-title mt-3">Your wellbeing deserves respect and privacy.</h2><p className="section-subtitle mt-4">Every interaction should make it clear what is shared, who can see it, and what happens next.</p></div><div className="mt-10 grid gap-5 md:grid-cols-3">{trust.map(item => { const Icon = item.icon; return <div key={item.title} className="trust-card"><span className="grid h-12 w-12 place-items-center rounded-xl bg-softsky text-trust"><Icon size={24} /></span><h3 className="mt-5 text-lg font-extrabold text-navy">{item.title}</h3><p className="mt-2 text-sm leading-6 text-secondary">{item.text}</p></div> })}</div></div></section>
}

function FinalCta() {
  return <section className="bg-white py-20"><div className="shell"><div className="final-cta"><div className="final-cta-decor" /><div className="relative z-10"><span className="text-xs font-bold uppercase tracking-[.16em] text-[#b9e4f7]">Your next step starts here</span><h2 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">Start taking care of your wellbeing today.</h2><p className="mt-4 text-sm text-white/75">Explore resources, ask questions, and find the support you need.</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/register" className="btn btn-white">Get Started <ArrowRight size={17} /></Link><Link to="/resources" className="btn btn-ghost">Explore Wellness</Link></div></div><div className="relative z-10 hidden h-40 w-40 flex-none items-center justify-center rounded-full border border-white/25 bg-white/10 lg:flex"><Heart size={67} className="text-white" strokeWidth={1.3} /></div></div></div></section>
}

export function LandingPage() {
  return <><Hero /><Services /><BeginWhereYouAre /><DailyWellnessCarousel /><Journey /><AiSection /><FeaturedResources /><TrustSection /><FinalCta /></>
}
