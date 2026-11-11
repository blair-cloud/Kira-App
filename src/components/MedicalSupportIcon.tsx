import type { LucideProps } from 'lucide-react'

// A clinician silhouette with a medical cross, cap, and uniform.
export function MedicalSupportIcon({ size = 24, strokeWidth = 1.8, ...props }: LucideProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 7V3.5A1.5 1.5 0 0 1 8.5 2h7A1.5 1.5 0 0 1 17 3.5V7H7Z" />
    <path d="M12 3.5v2M11 4.5h2M8.5 8.5v1a3.5 3.5 0 0 0 7 0v-1M9 15l3 4 3-4M12 19v3" />
    <path d="M4 22v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2M16 19v2M15 20h2" />
  </svg>
}
