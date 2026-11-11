import { Activity, BookOpen, Brain, Heart, Leaf, Sparkles, Users, type LucideIcon } from 'lucide-react'
import type { WellnessCard } from '../data/wellness'

const topicIcons: Record<WellnessCard['icon'], LucideIcon> = {
  brain: Brain,
  book: BookOpen,
  heart: Heart,
  activity: Activity,
  users: Users,
  sparkles: Sparkles,
  growth: Leaf,
}

// Match the rounded Lucide line icons used throughout Kira App.
export function DailyWellnessIcon({ theme }: { theme: WellnessCard['icon'] }) {
  const Icon = topicIcons[theme]
  return <Icon size={32} strokeWidth={1.65} aria-hidden="true" />
}
