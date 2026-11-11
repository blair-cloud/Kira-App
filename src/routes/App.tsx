import { Route, Routes, useLocation } from 'react-router'
import { useEffect } from 'react'
import { PublicLayout } from '../components/PublicLayout'
import { LandingPage } from '../pages/LandingPage'
import { InfoPage, pageContent } from '../pages/InfoPage'
import { AppointmentsPage } from '../pages/AppointmentsPage'
import { CheckInPage } from '../pages/CheckInPage'
import { ChatPage } from '../pages/ChatPage'
import { AuthPage } from '../pages/AuthPage'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) window.requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
    else window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

export function App() {
  return <>
    <ScrollToTop />
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/forgot-password" element={<AuthPage mode="recover" />} />
      <Route path="/ask" element={<ChatPage mode="ask" />} />
      <Route path="/chat" element={<ChatPage mode="professional" />} />
      <Route path="/ai-assistant" element={<ChatPage mode="ai" />} />
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/check-in" element={<CheckInPage />} />
        {Object.keys(pageContent).filter(path => !['/ask', '/chat', '/ai-assistant', '/login', '/register', '/forgot-password'].includes(path)).map(path => <Route key={path} path={path} element={<InfoPage path={path} />} />)}
        <Route path="*" element={<InfoPage path="/not-found" />} />
      </Route>
    </Routes>
  </>
}
