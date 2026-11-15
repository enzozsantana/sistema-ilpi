export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'ilpi-theme'

export function getStoredTheme(): ThemeMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignore */
  }
  return null
}

export function resolveTheme(stored: ThemeMode | null = getStoredTheme()): ThemeMode {
  if (stored) return stored
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  root.setAttribute('data-theme', mode)
  root.classList.toggle('dark', mode === 'dark')
}

export function setTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
  applyTheme(mode)
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode = resolveTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}
