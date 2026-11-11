import { useState } from 'react'
import { CalendarDays, Clock3, Heart, MessageCircle, ShieldCheck, UserRound } from 'lucide-react'
import { PageHero } from '../components/PageHero'

const services = [
  { title: 'Counselling session', description: 'A supportive conversation about your emotions, experiences, or challenges.', detail: 'In-person or virtual options', icon: MessageCircle, tone: 'lavender' },
  { title: 'Medical appointment', description: 'Connect with a healthcare professional for a health concern or question.', detail: 'Confidential care', icon: Heart, tone: 'teal' },
  { title: 'Follow-up support', description: 'Keep the conversation going and check in on your next steps.', detail: 'Ongoing support', icon: UserRound, tone: 'blue' },
] as const
const exampleTimes = ['Mon 10:00', 'Tue 14:00', 'Wed 11:30', 'Thu 09:00']

export function AppointmentsPage() {
  const [type, setType] = useState<string>(services[0].title)
  const [time, setTime] = useState('')
  const [feedback, setFeedback] = useState('')

  function continuePreview() {
    setFeedback(time ? `${type} at ${time} selected. Booking will become available when Kepler services are connected.` : 'Choose an example time to continue.')
  }

  return <>
    <PageHero eyebrow="Appointments" title="Make space for support" description="Explore the kind of appointment you need and see what a simple booking experience could look like." icon={CalendarDays} />
    <section className="section-pad bg-[#f8fbfd]"><div className="shell"><div><span className="eyebrow">Choose your support</span><h2 className="section-title mt-3">What would help right now?</h2></div>
      <div className="prototype-service-grid">{services.map(service => { const Icon = service.icon; return <article className="prototype-service-card" key={service.title}><span className={`service-icon service-icon-${service.tone}`}><Icon size={27} strokeWidth={1.8} /></span><h3>{service.title}</h3><p>{service.description}</p><span className="prototype-service-detail">{service.title === 'Counselling session' ? <Clock3 size={17} /> : service.title === 'Medical appointment' ? <ShieldCheck size={17} /> : <CalendarDays size={17} />}{service.detail}</span></article> })}</div>
      <div className="prototype-booking-panel"><div className="prototype-booking-intro"><span className="eyebrow">Booking preview</span><h2>Find a time that works for you.</h2><p>Select an example time to see the booking flow. Availability and requests will be connected when the service is ready.</p><div className="prototype-booking-decoration" aria-hidden="true"><CalendarDays size={65} strokeWidth={1.2} /></div></div><div className="prototype-booking-form"><label htmlFor="appointment-type">Appointment type</label><select id="appointment-type" value={type} onChange={event => { setType(event.target.value); setFeedback('') }}>{services.map(service => <option key={service.title}>{service.title}</option>)}</select><span className="prototype-field-label">Example times</span><div className="prototype-time-grid" role="group" aria-label="Example appointment times">{exampleTimes.map(slot => <button type="button" key={slot} className={time === slot ? 'selected' : ''} aria-pressed={time === slot} onClick={() => { setTime(slot); setFeedback('') }}>{slot}</button>)}</div><button type="button" className="btn btn-primary w-full" onClick={continuePreview}>Continue</button><div className="prototype-form-feedback" role="status">{feedback}</div></div></div>
      <p className="prototype-page-note">These times are examples. This preview does not request or confirm an appointment.</p>
    </div></section>
  </>
}
