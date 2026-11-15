import { describe, it, expect } from 'vitest'
import { cn } from '../../lib/utils'

describe('cn utility (Tailwind Merge & Clsx)', () => {
  it('combina classes simples', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('ignora valores falsy, null ou undefined', () => {
    expect(cn('font-bold', false && 'text-red-500', null, undefined, 'text-sm')).toBe('font-bold text-sm')
  })

  it('resolve conflitos do Tailwind priorizando a classe final', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('bg-red-500', 'bg-emerald-600')).toBe('bg-emerald-600')
  })

  it('suporta objetos condicionais', () => {
    expect(cn('btn', { 'btn-active': true, 'btn-disabled': false })).toBe('btn btn-active')
  })
})
