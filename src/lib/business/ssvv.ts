import { toNum } from './dates'
import type { Anotacao, FlagsSsvv } from '../../types/ilpi'

export function parsePA(pa?: string | null): [number, number] | null {
  const m = String(pa || '').match(/(\d{2,3})\D+(\d{2,3})/)
  return m ? [+m[1], +m[2]] : null
}

export function flags(a: Pick<Anotacao, 'pa' | 'pulso' | 'resp' | 'temp' | 'sat'>): FlagsSsvv {
  const f: FlagsSsvv = {}
  const pa = parsePA(a.pa)
  if (pa) {
    if (pa[0] >= 140 || pa[1] >= 90) f.pa = 'PA elevada'
    else if (pa[0] < 90 || pa[1] < 60) f.pa = 'PA baixa'
  }
  const p = toNum(a.pulso)
  const rr = toNum(a.resp)
  const t = toNum(a.temp)
  const s = toNum(a.sat)
  if (p != null && (p < 60 || p > 100)) f.pulso = p < 60 ? 'Bradicardia' : 'Taquicardia'
  if (rr != null && (rr < 12 || rr > 24)) f.resp = rr < 12 ? 'Bradipneia' : 'Taquipneia'
  if (t != null && (t < 35 || t >= 37.8)) f.temp = t < 35 ? 'Hipotermia' : 'Febre'
  if (s != null && s < 92) f.sat = 'Saturação baixa'
  return f
}

export function flagsValues(a: Pick<Anotacao, 'pa' | 'pulso' | 'resp' | 'temp' | 'sat'>): string[] {
  return Object.values(flags(a))
}