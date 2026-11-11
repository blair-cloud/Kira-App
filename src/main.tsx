import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './routes/App'
import './styles.css'
import './styles/landing-motion.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter><App /></BrowserRouter>
  </React.StrictMode>,
)
