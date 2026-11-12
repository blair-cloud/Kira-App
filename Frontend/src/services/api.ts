import { supabase } from './supabase'
import { localDemoEnabled, localDemoToken } from './localDemo'

const base = (import.meta.env.VITE_API_URL as string | undefined) || '/api/v1'
export type Page<T> = { items: T[]; total: number; offset: number; limit: number }
export type Role = 'student' | 'staff' | 'admin'
export type Profile = { id: string; email: string; full_name: string; role: Role; active: boolean; notification_preferences: Record<string, boolean>; privacy_settings: Record<string, boolean> }
export type Professional = { id: string; full_name: string; title: string; biography: string; contact_email: string; areas: string[] }
export type Slot = { id: string; staff_id: string; starts_at: string; ends_at: string }
export type Appointment = { id: string; student_id: string; staff_id: string; slot_id: string; appointment_type: string; status: string; starts_at: string; ends_at: string; professional_name: string; student_name?: string; follow_up?: string }
export type QuestionResponse = { id: string; body: string; private_note: boolean; created_at: string }
export type Question = { id: string; student_id?: string; student_name: string; body: string; category: string; anonymous: boolean; status: string; priority: string; assigned_staff_id: string | null; responses: QuestionResponse[] }
export type Checkin = { id: string; student_id: string; mood: string; score: number; reflection: string; shared_with_id: string | null; created_at: string }
export type Resource = { id: string; slug: string; title: string; description: string; category: string; body: string; status: string; featured: boolean; minutes: number; tone: 'blue' | 'teal' | 'lavender' | 'peach' }
export type Conversation = { id: string; student_id: string; staff_id: string | null; title: string; mode: 'professional' | 'ai'; status: string; unread?: number }
export type ChatMessage = { id: string; sender_id: string | null; body: string; kind: string; created_at: string }
export type Notification = { id: string; title: string; link: string; read: boolean; kind: string }
export type Goal = { id: string; title: string; completed: boolean }
export type Referral = { id: string; student_id: string; category: string; reason: string; status: string }
export type Report = { suppressed: boolean; items: { label: string; count: number }[]; minimum_group_size: number }
export type Dashboard = { profile: Profile; stats: Record<string, number>; appointments?: Appointment[]; questions?: Question[]; checkins?: Checkin[]; shared_checkins?: Checkin[]; conversations?: Conversation[]; resources?: Resource[]; notifications?: Notification[]; goals?: Goal[]; referrals?: Referral[]; reports?: Record<string, Report | string> }

export async function api<T>(path: string, options: RequestInit = {}, suppliedToken?: string): Promise<T> {
  if (localDemoEnabled) {
    const { mockRequest } = await import('./mockApi')
    return await mockRequest(path, options, suppliedToken ?? localDemoToken()) as T
  }
  const token = suppliedToken ?? localDemoToken() ?? (supabase ? (await supabase.auth.getSession()).data.session?.access_token : undefined)
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let response: Response
  try { response = await fetch(base + path, { ...options, headers, cache: 'no-store' }) }
  catch { throw new Error('Cannot reach Kira services. Check that the backend is running and try again.') }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof data?.detail === 'string' ? data.detail : Array.isArray(data?.detail) ? data.detail.map((item: { msg: string }) => item.msg).join('. ') : `Request failed (${response.status})`
    throw new Error(message)
  }
  return data as T
}

export const post = <T,>(path: string, body: unknown, token?: string) => api<T>(path, { method: 'POST', body: JSON.stringify(body) }, token)
export const patch = <T,>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
export const remove = <T,>(path: string) => api<T>(path, { method: 'DELETE' })
export const dashboardPath = (role: Role) => role === 'staff' ? '/professional/dashboard' : `/${role}/dashboard`
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.'
