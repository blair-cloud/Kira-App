import { Brain, GraduationCap, Heart, Moon, Rocket, Smile, Users } from 'lucide-react'
import type { MentalHealthTheme } from '../data/heroMentalHealth'

const themeIcons = { breathe: Brain, kindness: Heart, study: GraduationCap, emotions: Smile, rest: Moon, connection: Users, growth: Rocket }

export function MentalHealthBadge({ theme, category }: { theme: MentalHealthTheme; category: string }) {
  const Icon = themeIcons[theme]
  return <span className="mental-theme-badge"><span><Icon size={15} strokeWidth={2} aria-hidden="true" /></span>{category}</span>
}

export function MentalHealthArtwork({ theme, src }: { theme: MentalHealthTheme; src?: string }) {
  return <span className={`mental-card-illustration mental-card-illustration-${theme}`} aria-hidden="true"><img src={src || `/images/hero-wellness/${theme}.png`} alt="" width="512" height="512" decoding="async" className="mental-card-art" /></span>
}
