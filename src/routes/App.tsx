import { Route, Routes, useLocation } from 'react-router'
import { useEffect } from 'react'
import { PublicLayout } from '../components/PublicLayout'
import { LandingPage } from '../pages/LandingPage'
import { InfoPage, pageContent } from '../pages/InfoPage'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) window.requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export function App() {
  return <>
    <ScrollToTop />
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        {Object.keys(pageContent).map(path => <Route key={path} path={path} element={<InfoPage path={path} />} />)}
        <Route path="*" element={<InfoPage path="/not-found" />} />
      </Route>
    </Routes>
  </>
}
