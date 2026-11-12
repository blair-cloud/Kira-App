const mode = import.meta.env.VITE_AUTH_MODE as string | undefined
export const localDemoEnabled = import.meta.env.DEV && mode !== 'supabase'
const key = 'kira-browser-mock-session-v1'
let memoryToken: string | null = null

export function localDemoToken() {
  if (!localDemoEnabled) return null
  try { return sessionStorage.getItem(key) || memoryToken } catch { return memoryToken }
}

export function saveLocalDemoToken(token: string | null) {
  if (!localDemoEnabled) return
  memoryToken = token
  try { if (token) sessionStorage.setItem(key, token); else sessionStorage.removeItem(key) } catch { /* In-memory access still works when browser storage is unavailable. */ }
}
