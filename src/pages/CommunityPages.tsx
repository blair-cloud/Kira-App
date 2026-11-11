import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Ambulance, Brain, Stethoscope, Check, ChevronDown, ExternalLink, FileText, GraduationCap, HeartHandshake, LockKeyhole, Mail, MapPin, Phone, ShieldCheck, Siren } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import '../styles/community-pages.css'

export const communityPaths = ['/emergency', '/privacy', '/terms', '/contact'] as const
type CommunityPath = typeof communityPaths[number]
const collegeSupport = 'https://keplercollege.ac.rw/support-guidance/'
const governmentEmergency = 'https://www.gov.rw/emergency'

function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return <a className="community-source" href={href} target="_blank" rel="noopener noreferrer">{children}<ExternalLink size={13} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
}

function Hero({ eyebrow, title, description, icon: Icon, tone = 'blue' }: { eyebrow: string; title: string; description: string; icon: LucideIcon; tone?: string }) {
  return <section className={`community-hero community-tone-${tone}`}><div className="shell community-hero-inner"><div><span className="community-eyebrow">KIRA APP · KEPLER COLLEGE</span><p className="community-page-label">{eyebrow}</p><h1>{title}</h1><p className="community-hero-description">{description}</p></div><div className="community-hero-art" aria-hidden="true"><span /><Icon size={68} strokeWidth={1.4} /><i><Check size={20} /></i></div></div></section>
}

function Notice({ children, urgent = false }: { children: ReactNode; urgent?: boolean }) {
  return <div className={`community-notice ${urgent ? 'community-notice-urgent' : ''}`}><ShieldCheck size={20} aria-hidden="true" /><div>{children}</div></div>
}

function EmergencyPage() {
  return <div className="community-page">
    <Hero eyebrow="Emergency support" title="When it is urgent, reach out now." description="For Kepler students, staff, or anyone supporting a community member. If someone is in immediate danger, use emergency services rather than Kira chat or email." icon={Siren} tone="coral" />
    <div className="shell community-body">
      <div className="community-emergency-grid">
        {[{ title: 'Rwanda emergency services', number: '112', description: 'For an emergency or immediate danger.', icon: Siren }, { title: 'Ambulance', number: '912', description: 'For urgent medical assistance in Rwanda.', icon: Ambulance }].map(item => <article className="community-emergency-card" key={item.number}><item.icon size={29} strokeWidth={1.7} aria-hidden="true" /><h2>{item.title}</h2><p>{item.description}</p><a href={`tel:${item.number}`} className="community-call" aria-label={`Call ${item.title}, ${item.number}`}><Phone size={19} aria-hidden="true" />Call {item.number}</a></article>)}
      </div>
      <p className="community-source-note">Numbers apply in Rwanda. Outside Rwanda, use the emergency number for your location. <SourceLink href={governmentEmergency}>Government emergency directory</SourceLink></p>
      <div className="community-two-column">
        <section className="community-panel"><span className="community-overline">ON CAMPUS</span><h2>Help someone reach support.</h2><ol className="community-steps"><li><span>1</span><div><h3>Contact emergency services.</h3><p>Tell the operator your location and what has happened. Follow their instructions.</p></div></li><li><span>2</span><div><h3>Ask someone nearby for help.</h3><p>If safe, alert campus security or a staff member and ask them to help emergency responders find you.</p></div></li><li><span>3</span><div><h3>Use a direct route to care.</h3><p>If you cannot reach emergency services, seek help at the nearest emergency department. Do not wait for an app response.</p></div></li></ol></section>
        <aside className="community-panel community-soft-panel"><HeartHandshake size={32} aria-hidden="true" /><h2>Support that can wait for a reply</h2><p>For a non-urgent concern, Student Affairs can help you find the appropriate campus support route.</p><a className="community-email" href="mailto:studentsaffairs@keplercollege.ac.rw">studentsaffairs@keplercollege.ac.rw</a><p className="community-small">This is a general student support contact, not an emergency line. Use the Contact page for nurse and counsellor office emails. Confirm service hours with the office directly.</p><Link className="btn btn-outline" to="/contact">View campus contacts</Link><SourceLink href={collegeSupport}>Kepler support and guidance</SourceLink></aside>
      </div>
    </div>
  </div>
}

type PolicySection = { id: string; title: string; content: ReactNode }
const privacySections: PolicySection[] = [
  { id: 'current-data', title: 'What this version does with your information', content: <><p>This frontend preview lets the Kepler community explore wellness resources and try sample interactions. Account forms, appointment selections, check-ins, and chat messages are not submitted to a Kira backend, an AI provider, or a professional.</p><p>Chat messages remain in the current chat session. Check-ins and form entries are temporary page state. Refreshing or leaving these pages can clear that information; this is not a secure record-keeping service.</p></> },
  { id: 'browser-storage', title: 'What stays in your browser', content: <><p>Kira stores saved wellness card identifiers and your chat theme preference in this browser’s local storage. These settings can remain after closing the tab, and other people using the same browser profile may see them.</p><p>You can unsave cards in Learn or remove Kira’s stored site data in your browser settings. Clearing site data removes saved preferences. Avoid entering personal health information on a shared device.</p></> },
  { id: 'external-services', title: 'External links and technical information', content: <><p>Opening the app involves requests to its hosting server. Open Sans is loaded from Google Fonts, which receives the technical information needed for that request. External websites, your email app, and telephone services handle information under their own policies when you choose those links.</p><p>Kira’s current source does not include an analytics or advertising integration. Hosting logs and any production service providers must be reviewed and disclosed before launch.</p></> },
  { id: 'confidentiality', title: 'Confidentiality in future care services', content: <><p>The intended live service will explain what you share, who can access it, and why. Access should be limited to authorized staff who need the information to provide support. An anonymous option must explain any technical identifiers that are still collected.</p><p>Confidentiality cannot be promised without limits. Before care begins, the approved policy must explain any safety or legal circumstances that may require disclosure, who makes that decision, and how the student is informed.</p></> },
  { id: 'security', title: 'Safeguards required before launch', content: <><p>Live services need verified authentication, encrypted connections and storage, staff access controls, retention and deletion rules, and a process for responding to security incidents. These are requirements for the connected service, not claims that this preview already implements them.</p><p>Kepler must confirm the responsible organization, privacy contact, service providers, and applicable requirements before collecting student health information through Kira.</p></> },
  { id: 'privacy-requests', title: 'Questions and privacy requests', content: <><p>For help finding the appropriate college contact, email <a href="mailto:info@keplercollege.ac.rw">info@keplercollege.ac.rw</a>. This is Kepler’s published general enquiry address, not a confirmed Kira data protection contact.</p><p>Describe the request briefly without including passwords, medical records, or sensitive details about another person. The live policy must provide a dedicated route for access, correction, deletion, consent, and complaints.</p></> },
]
const termsSections: PolicySection[] = [
  { id: 'purpose', title: 'A wellness space for the Kepler community', content: <p>Kira is being developed to help Kepler College students and staff find wellness information and support routes. These draft terms describe the current preview and do not replace the college’s existing policies, student procedures, or professional care agreements.</p> },
  { id: 'preview', title: 'What you can use today', content: <><p>You can explore sample resources, save wellness cards in your browser, try a check-in, and view demonstrations of chat, appointments, and account forms.</p><p>Submitting a preview form does not create an account or book a session. Chat replies are examples; no clinician or live AI service is connected. Use the published campus contacts when you need a real response.</p></> },
  { id: 'care', title: 'Information and professional care', content: <><p>Wellness resources and AI demonstrations provide general educational information. They do not diagnose conditions, prescribe treatment, or replace advice from a qualified professional. Individual care requires an appropriate professional consultation.</p><p>Kira does not monitor emergencies. For immediate danger, use the <Link to="/emergency">Emergency support page</Link> and contact emergency services directly.</p></> },
  { id: 'respect', title: 'Respectful and responsible use', content: <><p>Help keep this a welcoming space for a diverse college community. Do not use Kira to harass, discriminate, impersonate someone, or share another person’s private information without permission.</p><p>Do not attempt to bypass security controls or disrupt the service. For a concern involving another student, request an appropriate support route without posting their health details in a public or shared space.</p></> },
  { id: 'accounts', title: 'Future accounts and appointments', content: <p>Before live services begin, approved terms must explain eligibility, account security, appointment availability, cancellations, professional responsibilities, and response times. A booking will only be confirmed when the connected service explicitly confirms it.</p> },
  { id: 'questions', title: 'Privacy, changes, and questions', content: <><p>Read the <Link to="/privacy">Privacy policy</Link> for the current handling of browser preferences and preview entries. Third-party websites and services have their own terms.</p><p>These draft terms need institutional and legal review before publication as binding service terms. The approved version must identify the service operator, effective date, applicable rules, and how users will be notified of changes. For now, use <Link to="/contact">Contact</Link> to find a published college contact.</p></> },
]

function PolicyPage({ privacy }: { privacy: boolean }) {
  const sections = privacy ? privacySections : termsSections
  return <div className="community-page">
    <Hero eyebrow={privacy ? 'Privacy policy' : 'Terms of service'} title={privacy ? 'Your information deserves care.' : 'A shared understanding, a safer space.'} description={privacy ? 'A clear view of what this Kira preview stores, what remains on your device, and the safeguards needed for live student services.' : 'Clear expectations for using Kira with care, respect, and consideration for the Kepler College community.'} icon={privacy ? LockKeyhole : FileText} tone={privacy ? 'green' : 'blue'} />
    <div className="shell community-body"><Notice><strong>Draft for institutional review</strong><p>{privacy ? 'This notice describes the current preview. It is not an approved Kepler College privacy policy for live health services.' : 'These are proposed service terms for the Kira preview, not institution-approved or binding terms for a live service.'}</p></Notice>
      <div className="community-policy-layout"><nav className="community-contents" aria-label="On this page"><span className="community-overline">ON THIS PAGE</span>{sections.map(section => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}<Link to={privacy ? '/terms' : '/privacy'}>{privacy ? 'Read terms of service' : 'Read the privacy policy'}</Link></nav><article className="community-policy-content">{sections.map(section => <section id={section.id} className="community-policy-section" key={section.id}><div><h2>{section.title}</h2>{section.content}</div></section>)}</article></div>
    </div>
  </div>
}

const contacts = [
  { title: 'Nurse Office', label: 'PHYSICAL HEALTH', description: 'Contact the Nurse Office for campus nursing support and physical health concerns.', emails: ['beata@keplercollege.ac.rw'], icon: Stethoscope, tone: 'green' },
  { title: 'Counsellor Office', label: 'MENTAL HEALTH & WELLBEING', description: 'Contact the Counsellor Office for support with emotional wellbeing, stress, or personal concerns.', emails: ['counselor@keplercollege.ac.rw', 'esperance.n@keplercollege.ac.rw'], icon: Brain, tone: 'blue' },
  { title: 'Student Affairs', label: 'STUDENT LIFE & WELLBEING', description: 'Ask where to find campus care, student support, or accessibility assistance.', emails: ['studentsaffairs@keplercollege.ac.rw'], icon: HeartHandshake, tone: 'green' },
  { title: 'Academic support', label: 'LEARNING & STUDY', description: 'Find the right route for questions about studies or academic guidance.', emails: ['faculty@keplercollege.ac.rw'], icon: GraduationCap, tone: 'blue' },
]

function ContactPage() {
  return <div className="community-page">
    <Hero eyebrow="Contact" title="The right people, a little closer." description="Find a starting point for support at Kepler College. Explore nurse and counsellor office support, or contact a college department directly." icon={Phone} />
    <div className="shell community-body"><div className="community-contact-grid">{contacts.map(item => <article className={`community-contact-card community-tone-${item.tone}`} key={item.title}><span className="community-card-icon"><item.icon size={28} strokeWidth={1.65} aria-hidden="true" /></span><span className="community-overline">{item.label}</span><h2>{item.title}</h2><p>{item.description}</p><div className="community-contact-route">{item.emails.map(email => <a className="community-email" href={`mailto:${email}`} key={email}>{email}</a>)}</div><a className="community-text-link" href={`mailto:${item.emails[0]}`}><Mail size={15} aria-hidden="true" />Open email</a></article>)}</div>
      <p className="community-source-note">Contact the offices directly to confirm their location and opening hours. Other department contacts are listed in <SourceLink href={collegeSupport}>Kepler College support and guidance</SourceLink></p>
      <div className="community-two-column"><section className="community-panel community-soft-panel"><MapPin size={29} aria-hidden="true" /><h2>Find the college</h2><p>KG 29 Ave 16, Kinyinya, Gasabo District<br />Kigali, Rwanda</p><a className="community-email" href="tel:+250782637318"><Phone size={16} aria-hidden="true" />+250 782 637 318</a><p className="community-small">General college telephone. This is not a dedicated Kira support or emergency line. Ask the college to confirm office locations and service hours before visiting.</p><SourceLink href="https://www.google.com/maps/search/?api=1&query=Kepler+College+KG+29+Ave+16+Kigali">View location on Maps</SourceLink></section>
      <section className="community-panel"><h2>Before you get in touch</h2><div className="community-faq"><details><summary>What should I include in an email?<ChevronDown size={17} /></summary><p>Briefly explain the kind of help you need and how you prefer to be contacted. Avoid sending medical records, passwords, or another person’s personal information to a general inbox.</p></details><details><summary>Can I reach a counsellor through Kira?<ChevronDown size={17} /></summary><p>The Kira chat and appointment screens are previews. Email the Counsellor Office using either address above to ask about accessing support; do not rely on a preview message to request care.</p></details><details><summary>How soon will someone reply?<ChevronDown size={17} /></summary><p>Response times and service hours have not been confirmed for these contacts. For an emergency, use emergency services rather than waiting for email.</p></details></div></section></div>
      <div className="community-help-strip"><div><Siren size={25} aria-hidden="true" /><div><h2>Need urgent help?</h2><p>Email and Kira chat are not emergency services.</p></div></div><Link className="btn btn-outline" to="/emergency">Emergency support</Link></div>
    </div>
  </div>
}

export function CommunityPage({ path }: { path: CommunityPath }) {
  if (path === '/emergency') return <EmergencyPage />
  if (path === '/contact') return <ContactPage />
  return <PolicyPage privacy={path === '/privacy'} />
}
