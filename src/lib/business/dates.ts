import { DIAS, MESES } from '../constants'
import type { Assinatura, Profissional, StampInfo } from '../../types/ilpi'

export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addD(d: Date | string, n: number): Date {
  const base = typeof d === 'string' ? parse(d) : new Date(d)
  const x = new Date(base)
  x.setDate(x.getDate() + n)
  return x
}

export function parse(s: string | Date): Date {
  if (s instanceof Date) return s
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function diffDays(a: string, b: string): number {
  return Math.round((parse(a).getTime() - parse(b).getTime()) / 864e5)
}

export function fmt(s?: string | null): string {
  if (!s) return '–'
  const d = parse(s)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function fmtDM(s: string | Date): string {
  const d = typeof s === 'string' ? parse(s) : s
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}

export function mesKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function diasNoMes(mk: string): number {
  const [y, m] = mk.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function agoraHM(ref: Date = new Date()): string {
  return `${pad(ref.getHours())}:${pad(ref.getMinutes())}`
}

export function minDe(h: string): number {
  const [a, b] = String(h).split(':').map(Number)
  return a * 60 + (b || 0)
}

export function minAgora(ref: Date = new Date()): number {
  return ref.getHours() * 60 + ref.getMinutes()
}

export function primeiro(n?: string): string {
  return String(n || '')
    .replace(/^(Dra?\.)\s+/i, '')
    .split(' ')[0]
}

export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function idade(nasc: string | undefined, ref: Date = new Date()): number | null {
  if (!nasc) return null
  const n = parse(nasc)
  let a = ref.getFullYear() - n.getFullYear()
  if (ref < new Date(ref.getFullYear(), n.getMonth(), n.getDate())) a--
  return a
}

export function num(v: number): string {
  return String(Math.round(v * 10) / 10).replace('.', ',')
}

export function toNum(v: string | number | null | undefined): number | null {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return Number.isNaN(n) ? null : n
}

export function iniciais(n?: string): string {
  const parts = String(n || '')
    .replace(/^(Dra?\.)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
  return parts
    .map((x) => x[0])
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .join('')
    .toUpperCase()
}

export function nomeMes(indiceMes: number): string {
  return MESES[indiceMes] ?? ''
}

export function nomeDia(indiceDia: number): string {
  return DIAS[indiceDia] ?? ''
}

/** Dados estruturados para exibir carimbo de assinatura (equivalente a stamp no HTML). */
export function stampData(
  sig: Assinatura | null | undefined,
  prof: Pick<Profissional, 'nome' | 'conselho' | 'cat'> | undefined,
  pre = 'Assinado por',
): StampInfo | null {
  if (!sig || !prof) return null
  return {
    pre,
    nomeProfissional: prof.nome,
    conselho: prof.conselho,
    cat: prof.cat,
    data: fmt(sig.d),
    hora: sig.h,
  }
}

export function sigCurta(sig: Assinatura | null | undefined, nomeProf?: string): string {
  if (!sig) return ''
  const nome = nomeProf ? primeiro(nomeProf) : ''
  return `${nome} ${sig.h}`.trim()
}