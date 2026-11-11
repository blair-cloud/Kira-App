import type { WellnessCard } from '../data/wellness'

// A consistent, unfilled line illustration for each daily wellness topic.
export function DailyWellnessIcon({ theme }: { theme: WellnessCard['icon'] }) {
  return <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {theme === 'brain' && <><path d="M24 37V13c-3-7-13-4-13 2-6 1-7 9-3 12-2 7 6 12 11 8M24 13c3-7 13-4 13 2 6 1 7 9 3 12 2 7-6 12-11 8" /><path d="M15 16c-1 4 1 6 4 6m-8 5c5-2 8 0 8 4m14-15c1 4-1 6-4 6m8 5c-5-2-8 0-8 4" /><path d="M20 42h8" stroke="#2585c5" /></>}
    {theme === 'book' && <><path d="M24 15c-5-4-11-5-18-3v25c7-2 13-1 18 3 5-4 11-5 18-3V12c-7-2-13-1-18 3Zm0 0v25" /><path d="m12 20 6 1m-6 6 6 1m12-7 6-1m-6 8 6-1" stroke="#2585c5" /><path d="m19 6 5-3 5 3" /></>}
    {theme === 'heart' && <><path d="M24 33S9 25 9 16c0-7 10-10 15-3 5-7 15-4 15 3 0 9-15 17-15 17Z" /><path d="m6 34 7 6h16l10-8c3-3-1-6-4-4l-7 5H18" /><path d="M24 5V2m18 9 3-2M6 11 3 9" stroke="#2585c5" /></>}
    {theme === 'activity' && <><path d="M5 26h10l5-15 8 27 5-15h10" /><path d="M9 16c3-7 10-11 17-10m13 26c-3 7-10 11-17 10" stroke="#2585c5" /><path d="m23 3 4 3-4 3m2 30-4 3 4 3" stroke="#2585c5" /></>}
    {theme === 'users' && <><circle cx="16" cy="15" r="6" /><circle cx="35" cy="18" r="5" /><path d="M4 36v-3c0-10 24-10 24 0v3m5-8c6-1 11 2 11 7v3M10 41h12" /><path d="M29 7V3m9 7 3-3" stroke="#2585c5" /></>}
    {theme === 'sparkles' && <><path d="M31 8c-4 1-7 5-7 10 0 7 6 12 12 11-2 7-11 11-18 7S9 23 13 17c3-5 10-8 18-9Z" /><path d="m36 5 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5ZM7 7v6m-3-3h6m29 27v6m-3-3h6" stroke="#2585c5" /></>}
    {theme === 'growth' && <><path d="M24 41V23c0-10 7-16 17-16 1 11-5 19-17 19M24 32C13 33 7 27 7 17c10-1 17 5 17 15Z" /><path d="m24 26 9-10M24 33l-9-8M14 42h20" stroke="#2585c5" /><path d="M12 8V4m-2 2h4" /></>}
  </svg>
}
