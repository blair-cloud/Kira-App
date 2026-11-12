import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { dashboardPath, errorMessage } from '../services/api'
import { requireSupabase } from '../services/supabase'

export function AuthCallbackPage() {
  const [params] = useSearchParams()
  const { profile, loading, error } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8 || password !== confirm) { setMessage('Use at least eight characters and matching passwords.'); return }
    setBusy(true)
    try { const result = await requireSupabase().auth.updateUser({ password }); if (result.error) throw result.error; setPassword(''); setConfirm(''); setMessage('Your password was updated. You can return to your dashboard.') }
    catch (reason) { setMessage(errorMessage(reason)) }
    finally { setBusy(false) }
  }
  if (loading) return <div className="shell py-16" role="status">Confirming your account…</div>
  if (error || !profile) return <div className="shell py-16"><p role="alert">{error || params.get('error_description') || 'This link may have expired. Return to login to continue.'}</p><Link className="btn btn-primary mt-5" to="/login">Return to login</Link></div>
  if (!params.has('recovery')) return <Navigate to={dashboardPath(profile.role)} replace />
  return <div className="shell py-16"><div className="account-recovery"><h1 className="section-title">Choose a new password</h1><form className="auth-form mt-7" onSubmit={submit}><label>New password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} /></label><label>Confirm password<input type="password" autoComplete="new-password" required value={confirm} onChange={event => setConfirm(event.target.value)} /></label><button className="btn btn-primary" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button></form><p role="status">{message}</p><Link className="community-text-link" to={dashboardPath(profile.role)}>Return to dashboard</Link></div></div>
}
