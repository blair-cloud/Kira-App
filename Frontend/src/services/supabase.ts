import { createClient } from '@supabase/supabase-js'
import { localDemoEnabled } from './localDemo'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
export const supabase = !localDemoEnabled && url && key ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
}) : null

export function requireSupabase() {
  if (!supabase) throw new Error('Sign-in needs Supabase configuration. Add the public project URL and publishable key to Frontend/.env and restart the frontend.')
  return supabase
}
