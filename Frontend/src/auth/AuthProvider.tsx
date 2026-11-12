import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Navigate, Outlet, useLocation } from 'react-router'
import { api, dashboardPath, errorMessage, post, type Profile, type Role } from '../services/api'
import { requireSupabase, supabase } from '../services/supabase'

type Auth = { profile: Profile | null; loading: boolean; error: string; signIn: (email: string, password: string) => Promise<Profile>; signOut: () => Promise<void>; refresh: () => Promise<void> }
const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(!!supabase)
  const [error, setError] = useState('')
  const currentToken = useRef<string | null>(null)
  const pending = useRef<{ token: string; request: Promise<Profile> } | null>(null)
  const loadProfile = useCallback((session: Session) => {
    if (pending.current?.token === session.access_token) return pending.current.request
    const request = post<Profile>('/auth/sync-profile', { full_name: session.user.user_metadata.full_name || '' }, session.access_token)
    pending.current = { token: session.access_token, request }
    return request
  }, [])
  useEffect(() => {
    if (!supabase) return
    let active = true
    const update = (session: Session | null) => {
      currentToken.current = session?.access_token ?? null
      if (!session) { if (active) { setProfile(null); setLoading(false); setError('') }; pending.current = null; return }
      if (active) setLoading(true)
      void loadProfile(session).then(next => { if (active && currentToken.current === session.access_token) { setProfile(next); setError('') } }).catch(reason => { if (active && currentToken.current === session.access_token) { setProfile(null); setError(errorMessage(reason)); pending.current = null } }).finally(() => { if (active && currentToken.current === session.access_token) setLoading(false) })
    }
    void supabase.auth.getSession().then(({ data }) => update(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { update(session) })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [loadProfile])
  async function signIn(email: string, password: string) {
    setError('')
    const { data, error: authError } = await requireSupabase().auth.signInWithPassword({ email, password })
    if (authError || !data.session) throw new Error(authError?.message || 'Sign-in did not return a session')
    const next = await loadProfile(data.session)
    setProfile(next)
    return next
  }
  async function signOut() {
    const result = await requireSupabase().auth.signOut()
    if (result.error) throw result.error
    setProfile(null)
    pending.current = null
  }
  async function refresh() { const next = await api<Profile>('/users/me'); setProfile(next) }
  return <AuthContext.Provider value={{ profile, loading, error, signIn, signOut, refresh }}>{children}</AuthContext.Provider>
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider is required'); return value }

export function RequireRole({ role }: { role: Role }) {
  const { profile, loading, error } = useAuth()
  const location = useLocation()
  if (loading) return <div className="shell py-16" role="status">Loading your account…</div>
  if (error) return <div className="shell py-16" role="alert"><p>{error}</p><a className="btn btn-outline mt-5" href="/login">Return to login</a></div>
  if (!profile) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (profile.role !== role) return <Navigate to={dashboardPath(profile.role)} replace />
  return <Outlet />
}
