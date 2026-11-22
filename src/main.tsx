import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import './index.css'
import App from './App.tsx'
import { applyTheme, resolveTheme } from './lib/theme'

applyTheme(resolveTheme())

// Em produção registra o Service Worker PWA; em desenvolvimento, desregistra para não corromper o Vite HMR nem misturar instâncias do React
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Registro do Service Worker ignorado:', err)
      })
    })
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister()
      }
    })
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          if (key.startsWith('senecurare-')) caches.delete(key)
        }
      })
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
