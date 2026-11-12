import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { useApi } from '../hooks/useApi'
import { errorMessage, post, type Professional, type Slot } from '../services/api'
import { CalendarDays, Clock3, Heart, MessageCircle, ShieldCheck, UserRound } from 'lucide-react'
import { PageHero } from '../components/PageHero'

const services = [
  { title: 'Counselling session', description: 'A supportive conversation about your emotions, experiences, or challenges.', detail: 'In-person or virtual options', icon: MessageCircle, tone: 'lavender' },
  { title: 'Medical appointment', description: 'Connect with a healthcare professional for a health concern or question.', detail: 'Confidential care', icon: Heart, tone: 'teal' },
  { title: 'Follow-up support', description: 'Keep the conversation going and check in on your next steps.', detail: 'Ongoing support', icon: UserRound, tone: 'blue' },
] as const


export function AppointmentsPage() {
  const [type, setType] = useState<string>(services[0].title)
  const [time, setTime] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const { profile } = useAuth()
  const professionals = useApi<Professional[]>('/professionals')
  const [professionalId, setProfessionalId] = useState('')
  const slots = useApi<Slot[]>(professionalId ? `/professionals/${professionalId}/availability` : null)
  useEffect(() => { setTime(''); setFeedback('') }, [professionalId])
  useEffect(() => { if (!professionalId && professionals.data?.length) setProfessionalId(professionals.data[0].id) }, [professionalId, professionals.data])

  async function requestAppointment() {
    if (!time) { setFeedback('Choose an available time to continue.'); return }
    setBusy(true)
    try { await post('/student/appointments', { slot_id: time, appointment_type: type }); setFeedback('Your appointment request has been sent. It is pending confirmation by the professional.'); setTime(''); slots.reload() }
    catch (reason) { setFeedback(errorMessage(reason)) }
    finally { setBusy(false) }
  }

  return <>
    <PageHero eyebrow="Appointments" title="Make space for support" description="Choose a wellness professional and request an available time for support." icon={CalendarDays} />
    <section className="section-pad bg-[#f8fbfd]"><div className="shell"><div><span className="eyebrow">Choose your support</span><h2 className="section-title mt-3">What would help right now?</h2></div>
      <div className="prototype-service-grid">{services.map(service => { const Icon = service.icon; return <article className="prototype-service-card" key={service.title}><span className={`service-icon service-icon-${service.tone}`}><Icon size={27} strokeWidth={1.8} /></span><h3>{service.title}</h3><p>{service.description}</p><span className="prototype-service-detail">{service.title === 'Counselling session' ? <Clock3 size={17} /> : service.title === 'Medical appointment' ? <ShieldCheck size={17} /> : <CalendarDays size={17} />}{service.detail}</span></article> })}</div>
      <div className="prototype-booking-panel"><div className="prototype-booking-intro"><span className="eyebrow">Request an appointment</span><h2>Find a time that works for you.</h2><p>Choose your support type, professional, and available time. The professional will review your request before confirming it.</p><div className="prototype-booking-decoration" aria-hidden="true"><CalendarDays size={65} strokeWidth={1.2} /></div></div><div className="prototype-booking-form"><label htmlFor="appointment-type">Appointment type</label><select id="appointment-type" value={type} onChange={event => { setType(event.target.value); setFeedback('') }}>{services.map(service => <option key={service.title}>{service.title}</option>)}</select><label htmlFor="appointment-professional">Wellness professional</label><select id="appointment-professional" value={professionalId} onChange={event => setProfessionalId(event.target.value)}><option value="">Choose a professional</option>{professionals.data?.map(person => <option key={person.id} value={person.id}>{person.full_name} · {person.title}</option>)}</select>{professionals.error && <p role="alert">{professionals.error}</p>}<span className="prototype-field-label">Available times · Africa/Kigali</span><div className="prototype-time-grid" role="group" aria-label="Available appointment times">{slots.data?.map(slot => <button type="button" key={slot.id} className={time === slot.id ? 'selected' : ''} aria-pressed={time === slot.id} onClick={() => { setTime(slot.id); setFeedback('') }}>{new Date(slot.starts_at).toLocaleString([], { timeZone: 'Africa/Kigali', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</button>)}</div>{slots.loading && <p role="status">Loading available times…</p>}{slots.error && <p role="alert">{slots.error}</p>}{slots.data && !slots.data.length && <p>No available times are listed for this professional. Contact the office for help.</p>}{profile?.role === 'student' ? <button type="button" className="btn btn-primary w-full" disabled={busy || !time} onClick={requestAppointment}>{busy ? 'Requesting…' : 'Request appointment'}</button> : <Link to={profile ? '/professional/dashboard' : '/login'} state={{ from: '/appointments' }} className="btn btn-primary w-full">{profile ? 'Open your workspace' : 'Log in to request an appointment'}</Link>}<div className="prototype-form-feedback" role="status">{feedback}</div></div></div>
      <p className="prototype-page-note">A request is not a confirmed booking. You can review its status in your dashboard. For urgent concerns, use Emergency support.</p>
    </div></section>
  </>
}
