import { NURSE } from './constants'
import type {
  AcaoPermissao,
  AbaResidente,
  Categoria,
  EscalaKey,
  NavView,
} from '../types/ilpi'

/** Matriz de ações (can no protótipo). */
export const CAN: Record<AcaoPermissao, Categoria[]> = {
  adm: [...NURSE],
  anot: [...NURSE],
  cuid: [...NURSE, 'cuid'],
  gerir: ['rt', 'enf'],
  presc: ['med', 'rt', 'enf'],
  estoque: ['rt', 'enf', 'tec'],
  aval: ['rt', 'enf'],
  evol: ['rt', 'enf', 'med', 'multi'],
}

/** Acesso às views principais (NAV_ACESSO). */
export const NAV_ACESSO: Record<NavView, '*' | Categoria[]> = {
  plantao: '*',
  residentes: [...NURSE, 'cuid', 'med', 'multi'],
  estoque: ['rt', 'enf', 'tec'],
  rotinas: [...NURSE, 'cuid', 'apoio'],
  equipe: [...NURSE, 'cuid'],
  gestao: ['rt', 'enf'],
}

/** Acesso às abas do residente (TAB_ACESSO). */
export const TAB_ACESSO: Record<AbaResidente, '*' | Categoria[]> = {
  pasta: '*',
  ficha: '*',
  aval: ['rt', 'enf', 'tec', 'estag', 'med', 'multi'],
  pia: [...NURSE, 'med'],
  cuidados: [...NURSE, 'cuid'],
  presc: [...NURSE, 'med'],
  anot: [...NURSE, 'med'],
  evol: ['rt', 'enf', 'med', 'multi'],
  arquivos: ['rt', 'enf', 'tec', 'med', 'multi'],
  estoque: ['rt', 'enf', 'tec'],
  tudo: ['rt', 'enf', 'med'],
}

/** Áreas multiprofissionais por escala clínica (ESCALA_AREA). */
export const ESCALA_AREA: Record<EscalaKey, string[]> = {
  morse: ['Fisioterapia'],
  mna: ['Nutrição'],
  braden: [],
  glasgow: [],
  fugulin: [],
}

function pode(mapa: Record<string, '*' | Categoria[]>, chave: string, cat: Categoria): boolean {
  const regra = mapa[chave]
  return regra === '*' || (regra ?? []).includes(cat)
}

export function can(cat: Categoria, action: AcaoPermissao): boolean {
  return CAN[action].includes(cat)
}

export function canNav(cat: Categoria, view: NavView): boolean {
  return pode(NAV_ACESSO, view, cat)
}

export function canTab(cat: Categoria, tab: AbaResidente): boolean {
  return pode(TAB_ACESSO, tab, cat)
}

export function canAval(cat: Categoria, area: string | undefined, escala: EscalaKey): boolean {
  if (['rt', 'enf'].includes(cat)) return true
  if (cat === 'multi') return (ESCALA_AREA[escala] ?? []).includes(area ?? '')
  return false
}

export function escalasVisiveis(_cat?: Categoria, _area?: string): EscalaKey[] {
  return ['fugulin', 'morse', 'braden', 'glasgow', 'mna']
}

export function navVisivel(cat: Categoria): NavView[] {
  return (Object.keys(NAV_ACESSO) as NavView[]).filter((k) => canNav(cat, k))
}