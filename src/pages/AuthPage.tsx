import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { BookOpen, Check, CircleCheck, Eye, EyeOff, Heart, HeartPulse, LockKeyhole, Mail, MessageCircle, UserRound } from 'lucide-react'
import '../styles/auth.css'

type AuthMode = 'login' | 'register' | 'recover'
type Fields = { name: string; email: string; password: string; confirm: string }
const copy = {
  login: { title: 'Welcome back.', description: 'A little time for you. Log in to your Kira account.', action: 'Log in', imageTitle: 'Your wellbeing belongs here.', imageDescription: 'A welcoming space to learn, connect, and take your next step.' },
  register: { title: 'Make space for yourself.', description: 'Create your account and begin your wellbeing journey.', action: 'Create account', imageTitle: 'Good things begin with connection.', imageDescription: 'Join a community where questions are welcome and support is within reach.' },
  recover: { title: 'Let’s get you back in.', description: 'Enter your account email to begin resetting your password.', action: 'Reset password', imageTitle: 'There is always a way forward.', imageDescription: 'Take your time. Your space for wellbeing will be here.' },
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const config = copy[mode]
  const [fields, setFields] = useState<Fields>({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Partial<Fields>>({})
  const [visible, setVisible] = useState({ password: false, confirm: false })
  const [checked, setChecked] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  const status = useRef<HTMLDivElement>(null)
  useEffect(() => { setFields({ name: '', email: '', password: '', confirm: '' }); setErrors({}); setChecked(false); setVisible({ password: false, confirm: false }) }, [mode])

  function update(field: keyof Fields, value: string) {
    setFields(previous => ({ ...previous, [field]: value }))
    setErrors(previous => ({ ...previous, [field]: undefined }))
    setChecked(false)
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    const next: Partial<Fields> = {}
    if (mode === 'register' && fields.name.trim().length < 2) next.name = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) next.email = 'Enter a valid email address.'
    if (mode !== 'recover' && !fields.password) next.password = 'Enter your password.'
    if (mode === 'register') {
      if (fields.password.length < 8) next.password = 'Use at least 8 characters.'
      if (!fields.confirm) next.confirm = 'Confirm your password.'
      else if (fields.confirm !== fields.password) next.confirm = 'Your passwords do not match.'
    }
    setErrors(next)
    if (Object.keys(next).length) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus())
      return
    }
    setChecked(true)
    setFields(previous => ({ ...previous, password: '', confirm: '' }))
    requestAnimationFrame(() => status.current?.focus())
  }

  const passwordStrength = Number(fields.password.length >= 8) + Number(/[A-Z]/.test(fields.password) && /[a-z]/.test(fields.password)) + Number(/\d|[^A-Za-z]/.test(fields.password))
  function passwordInput(field: 'password' | 'confirm', label: string) {
    return <div className="auth-field"><label htmlFor={`auth-${field}`}>{label}</label><div className={`auth-input ${errors[field] ? 'has-error' : ''}`}><LockKeyhole size={17} aria-hidden="true" /><input id={`auth-${field}`} name={field} type={visible[field] ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required value={fields[field]} onChange={event => update(field, event.target.value)} aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `auth-${field}-error` : mode === 'register' && field === 'password' ? 'auth-password-help' : undefined} /><button type="button" className="auth-password-toggle" aria-label={`${visible[field] ? 'Hide' : 'Show'} ${field === 'confirm' ? 'confirmation password' : 'password'}`} aria-pressed={visible[field]} onClick={() => setVisible(previous => ({ ...previous, [field]: !previous[field] }))}>{visible[field] ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors[field] && <p id={`auth-${field}-error`} className="auth-error">{errors[field]}</p>}</div>
  }

  return <main className={`auth-page auth-mode-${mode}`}>
    <aside className="auth-image-panel" aria-label="Welcome to Kira"><Link to="/" className="auth-brand" aria-label="Kira App home"><span><HeartPulse size={25} strokeWidth={1.9} /></span><strong>KIRA APP</strong></Link><div className="auth-image-content"><span className="auth-image-kicker"><Heart size={15} />A LITTLE CARE, EVERY DAY</span><h2>{config.imageTitle}</h2><p>{config.imageDescription}</p><div className="auth-photo"><img src="/images/groupPhoto.jpg" alt="Kepler community members spending time together around a board game" width={799} height={533} /></div><div className="auth-image-values"><span><BookOpen size={16} />Learn</span><span><MessageCircle size={16} />Connect</span><span><Heart size={16} />Feel supported</span></div></div><span className="auth-image-bottom">One small step can make a difference.</span></aside>
    <section className="auth-form-panel" aria-labelledby="auth-heading"><div className="auth-switch-link">{mode === 'register' ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New to Kira? <Link to="/register">Get started</Link></>}</div><div className="auth-form-content"><div className="auth-form-mark" aria-hidden="true"><HeartPulse size={28} strokeWidth={1.6} /></div><h1 id="auth-heading">{config.title}</h1><p className="auth-intro">{config.description}</p>
      <form ref={form} className="auth-form" noValidate onSubmit={submit}>
        {mode === 'register' && <div className="auth-field"><label htmlFor="auth-name">Full name</label><div className={`auth-input ${errors.name ? 'has-error' : ''}`}><UserRound size={17} aria-hidden="true" /><input id="auth-name" name="name" type="text" autoComplete="name" required value={fields.name} onChange={event => update('name', event.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'auth-name-error' : undefined} /></div>{errors.name && <p className="auth-error" id="auth-name-error">{errors.name}</p>}</div>}
        <div className="auth-field"><label htmlFor="auth-email">Email address</label><div className={`auth-input ${errors.email ? 'has-error' : ''}`}><Mail size={17} aria-hidden="true" /><input id="auth-email" name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required value={fields.email} onChange={event => update('email', event.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'auth-email-error' : undefined} /></div>{errors.email && <p className="auth-error" id="auth-email-error">{errors.email}</p>}</div>
        {mode !== 'recover' && passwordInput('password', 'Password')}
        {mode === 'register' && <><div className="auth-password-help" id="auth-password-help"><div className="auth-strength" aria-hidden="true">{[1,2,3].map(level => <span key={level} className={fields.password && passwordStrength >= level ? `is-filled strength-${passwordStrength}` : ''} />)}</div><span>{fields.password ? ['Use at least 8 characters.', 'Make it stronger with a mix of characters.', 'Good start. Try adding more variety.', 'Strong password.'][passwordStrength] : 'Use at least 8 characters. A mix of characters is better.'}</span></div>{passwordInput('confirm', 'Confirm password')}</>}
        {mode === 'login' && <div className="auth-forgot"><Link to="/forgot-password">Forgot password?</Link></div>}
        <button type="submit" className="btn btn-primary auth-submit">{config.action}</button>
      </form>
      {checked && <div ref={status} tabIndex={-1} className="auth-result" role="status"><CircleCheck size={20} /><div><strong>{mode === 'recover' ? 'Reset form checked' : 'Your form is ready'}</strong><p>{mode === 'register' ? 'Your details pass validation. Account creation is not connected yet; no account has been created.' : mode === 'recover' ? 'Password recovery is not connected yet. No email has been sent.' : 'Sign-in is not connected yet. This preview has not signed you in.'}</p><Link to="/resources">Continue exploring</Link></div></div>}
      <div className="auth-preview-note"><Check size={14} /><span>Form preview · account services are not connected yet.</span></div>
      {mode === 'recover' && <Link className="auth-back-login" to="/login">Back to log in</Link>}
      <p className="auth-policy">Read our <Link to="/privacy">Privacy policy</Link> and <Link to="/terms">Terms of service</Link>.</p>
    </div><div className="auth-footer"><span>© {new Date().getFullYear()} Kira App</span><Link to="/">Back to Home</Link></div></section>
  </main>
}
