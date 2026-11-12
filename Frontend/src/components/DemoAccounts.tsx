import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { api, dashboardPath, errorMessage } from '../services/api'

const accounts = [
  { label: 'Student', email: 'student@wellness.test', password: 'Student@123' },
  { label: 'Staff', email: 'staff@wellness.test', password: 'Staff@123' },
  { label: 'Admin', email: 'admin@wellness.test', password: 'Admin@123' },
]
export default function DemoAccounts() {
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { void api<{ demo_accounts_enabled: boolean; authentication_configured: boolean }>('/health').then(health => setEnabled(health.demo_accounts_enabled && health.authentication_configured)).catch(() => setEnabled(false)) }, [])
  if (!enabled) return null
  return <section className="auth-demo"><h2>Development demo accounts</h2><p>Local testing only. These accounts must be seeded in your development Supabase project.</p>{accounts.map(account => <div key={account.label}><span>{account.email} · {account.password}</span><button type="button" disabled={busy} onClick={() => { setBusy(true); setError(''); void signIn(account.email, account.password).then(profile => navigate(dashboardPath(profile.role), { replace: true })).catch(reason => setError(errorMessage(reason))).finally(() => setBusy(false)) }}>Continue as {account.label}</button></div>)}{error && <p role="alert">{error}</p>}</section>
}
