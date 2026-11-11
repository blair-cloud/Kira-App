import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { BookOpen, Clock3 } from 'lucide-react'
import { resources } from '../data/wellness'
import { ResourceCartoon } from './ResourceCartoon'
import '../styles/featured-resources.css'

export function FeaturedResources() {
  return <section className="featured-resources section-pad" aria-labelledby="featured-resources-heading"><div className="shell">
    <div className="featured-resources-header" data-reveal><div><h1 id="featured-resources-heading" className="section-title">Featured wellness resources</h1><p className="section-subtitle mt-3">Thoughtful starting points for the questions students often bring.</p></div></div>
    <div className="featured-resources-grid">{resources.map((resource,index) => <Link to={`/resources/${resource.slug}`} key={resource.slug} className={`featured-reading-card featured-reading-${resource.tone} ${index === 0 ? 'featured-reading-lead' : ''}`} data-reveal style={{ '--reveal-order': index } as CSSProperties}>
      <div className="featured-reading-art" aria-hidden="true"><span className="featured-reading-halo" /><ResourceCartoon topic={resource.slug} /></div>
      <div className="featured-reading-copy"><div className="featured-reading-meta"><span className="featured-reading-category">{resource.category}</span><span className="featured-reading-time"><Clock3 size={13} aria-hidden="true" />{resource.minutes} min read</span></div><h3>{resource.title}</h3><p>{resource.description}</p><span className="featured-reading-link"><BookOpen size={15} strokeWidth={1.7} aria-hidden="true" />Read article</span></div>
    </Link>)}</div>
  </div></section>
}
