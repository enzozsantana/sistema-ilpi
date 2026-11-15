import { describe, it, expect, beforeEach } from 'vitest'
import {
  getStoredTheme,
  resolveTheme,
  applyTheme,
  setTheme,
  toggleTheme,
} from '../../lib/theme'

describe('Theme Management (Senecurare Light / Dark Mode)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
  })

  it('getStoredTheme: recupera o tema salvo no localStorage', () => {
    expect(getStoredTheme()).toBeNull()
    localStorage.setItem('ilpi-theme', 'dark')
    expect(getStoredTheme()).toBe('dark')
    localStorage.setItem('ilpi-theme', 'light')
    expect(getStoredTheme()).toBe('light')
  })

  it('resolveTheme: retorna o tema armazenado ou fallback padrão light', () => {
    expect(resolveTheme(null)).toBe('light')
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('applyTheme: define o atributo data-theme e classe dark no elemento raiz', () => {
    applyTheme('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    applyTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setTheme: persiste no localStorage e aplica no DOM', () => {
    setTheme('dark')
    expect(localStorage.getItem('ilpi-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggleTheme: alterna entre light e dark mode', () => {
    setTheme('light')
    const novo = toggleTheme()
    expect(novo).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    const voltando = toggleTheme()
    expect(voltando).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
