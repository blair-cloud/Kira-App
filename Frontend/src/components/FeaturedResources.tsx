import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { BookOpen, Clock3 } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import type { Page, Resource } from '../services/api'
import { ResourceCartoon } from './ResourceCartoon'
import '../styles/featured-resources.css'

export function FeaturedResources() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [offset, setOffset] = useState(0)
  const { data, loading, error, reload } = useApi<Page<Resource>>(`/resources?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}&offset=${offset}&limit=12`)
  const resources = data?.items ?? []
  return <section className="featured-resources section-pad" aria-labelledby="featured-resources-heading"><div className="shell">
    <div className="featured-resources-header" data-reveal><div><h1 id="featured-resources-heading" className="section-title">Featured wellness resources</h1><p className="section-subtitle mt-3">Thoughtful starting points for the questions students often bring.</p></div></div>
    <div className="resource-filters"><label>Search resources<input value={query} onChange={event => { setQuery(event.target.value); setOffset(0) }} placeholder="Search wellness topics" /></label><label>Category<select value={category} onChange={event => { setCategory(event.target.value); setOffset(0) }}><option value="">All categories</option>{['Mental Health', 'Academic Stress', 'Healthy Relationships', 'Physical Wellbeing', 'Mental Wellbeing', 'Academic Wellbeing', 'Emotional Wellbeing', 'Physical Health', 'Self Care', 'Personal Development'].map(value => <option key={value}>{value}</option>)}</select></label></div>{loading && <p role="status">Loading resources…</p>}{error && <div role="alert"><p>{error}</p><button className="community-text-link" onClick={reload}>Try again</button></div>}{!loading && !error && !resources.length && <p>No published resources match your search.</p>}
    <div className="featured-resources-grid">{resources.map((resource,index) => <Link to={`/resources/${resource.slug}`} key={resource.slug} className={`featured-reading-card featured-reading-${resource.tone} ${index === 0 ? 'featured-reading-lead' : ''}`} data-reveal style={{ '--reveal-order': index } as CSSProperties}>
      <div className="featured-reading-art" aria-hidden="true"><span className="featured-reading-halo" /><ResourceCartoon topic={resource.slug} /></div>
      <div className="featured-reading-copy"><div className="featured-reading-meta"><span className="featured-reading-category">{resource.category}</span><span className="featured-reading-time"><Clock3 size={13} aria-hidden="true" />{resource.minutes} min read</span></div><h3>{resource.title}</h3><p>{resource.description}</p><span className="featured-reading-link"><BookOpen size={15} strokeWidth={1.7} aria-hidden="true" />Read article</span></div>
    </Link>)}</div>{data && data.total > 12 && <div className="resource-pagination"><button disabled={offset === 0} onClick={() => setOffset(value => value - 12)}>Previous</button><span>{offset + 1}–{Math.min(offset + 12, data.total)} of {data.total}</span><button disabled={offset + 12 >= data.total} onClick={() => setOffset(value => value + 12)}>Next</button></div>}
  </div></section>
}
