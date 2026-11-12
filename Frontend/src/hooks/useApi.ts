import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { api, errorMessage } from '../services/api'
import { useAuth } from '../auth/AuthProvider'

export function useApi<T>(path: string | null, interval = 0) {
  const { profile } = useAuth()
  const accountId = profile?.id
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!!path)
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision(value => value + 1), [])
  useLayoutEffect(() => { setData(null); setError(''); setLoading(!!path) }, [path, accountId])
  useEffect(() => {
    if (!path) { setData(null); setLoading(false); setError(''); return }
    const controller = new AbortController()
    let active = true
    setLoading(true)
    void api<T>(path, { signal: controller.signal }).then(value => { if (active) { setData(value); setError('') } }).catch(reason => { if (active) setError(errorMessage(reason)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [path, revision, accountId])
  useEffect(() => {
    if (!interval || !path) return
    const timer = setInterval(() => { if (!document.hidden) reload() }, interval)
    return () => clearInterval(timer)
  }, [interval, path, reload])
  return { data, error, loading, reload }
}
