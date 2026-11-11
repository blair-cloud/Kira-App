import type { LucideIcon } from 'lucide-react'

type PageHeroProps = { eyebrow: string; title: string; description: string; icon: LucideIcon }

export function PageHero({ eyebrow, title, description, icon: Icon }: PageHeroProps) {
  return <section className="prototype-page-hero"><div className="shell prototype-page-hero-inner"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><div className="prototype-page-hero-art" aria-hidden="true"><span className="prototype-page-hero-ring" /><span className="prototype-page-hero-icon"><Icon size={54} strokeWidth={1.6} /></span></div></div></section>
}
