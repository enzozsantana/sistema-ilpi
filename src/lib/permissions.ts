import { NURSE } from './constants'
import type {
  AcaoPermissao,
  AbaResidente,
  Categoria,
  EscalaKey,
  NavView,
} from '../types/ilpi'

export const TODAS_CATEGORIAS_ILPI: Categoria[] = [
  'rt',
  'enf',
  'tec',
  'cuid',
  'estag',
  'med',
  'multi',
  'apoio',
  'gestao',
]

/** Matriz de ações (can no protótipo). */
export const CAN: Record<AcaoPermissao, Categoria[]> = {
  adm: [...NURSE, 'cuid'],
  anot: [...NURSE, 'cuid'],
  cuid: [...NURSE, 'cuid'],
  gerir: ['rt', 'enf', 'gestao'],
  presc: ['med', 'rt', 'enf', 'tele_especialista'],
  estoque: ['rt'],
  aval: ['rt', 'enf'],
  evol: ['rt', 'enf', 'med', 'multi', 'tele_especialista'],
  pop_ver: ['rt', 'enf', 'tec', 'estag', 'cuid', 'med', 'multi', 'apoio', 'gestao'],
  pop_editar: ['rt', 'enf', 'gestao'],
  alvara: ['rt', 'gestao'],
}

/** Acesso às views principais (NAV_ACESSO). */
export const NAV_ACESSO: Record<NavView, '*' | Categoria[]> = {
  equipe: [...NURSE, 'cuid', 'gestao'],
  estoque: ['rt'],
  gestao: ['rt', 'enf', 'gestao'],
  plantao: TODAS_CATEGORIAS_ILPI,
  residentes: [...NURSE, 'cuid', 'med', 'multi', 'gestao'],
  rotinas: TODAS_CATEGORIAS_ILPI,
  teleconsulta: '*',
  treinamentos: TODAS_CATEGORIAS_ILPI,
}

/** Acesso às abas do residente (TAB_ACESSO). */
export const TAB_ACESSO: Record<AbaResidente, '*' | Categoria[]> = {
  pasta: '*',
  ficha: '*',
  aval: ['rt', 'enf', 'tec', 'estag', 'med', 'multi'],
  pia: [...NURSE, 'med'],
  cuidados: [...NURSE, 'cuid'],
  presc: [...NURSE, 'med', 'cuid', 'tele_especialista'],
  anot: [...NURSE, 'med', 'cuid'],
  evol: ['rt', 'enf', 'med', 'multi', 'tele_especialista'],
  arquivos: ['rt', 'enf', 'tec', 'med', 'multi', 'gestao', 'tele_especialista'],
  estoque: ['rt'],
  tudo: ['rt', 'enf', 'med', 'gestao'],
}

/** Áreas multiprofissionais por escala clínica (ESCALA_AREA). */
export const ESCALA_AREA: Record<string, string[]> = {
  morse: ['Fisioterapia', 'Enfermagem'],
  mna: ['Nutrição'],
  braden: ['Enfermagem'],
  glasgow: ['Enfermagem', 'Médico'],
  fugulin: ['Enfermagem'],
  katz: ['Fisioterapia', 'Terapia Ocupacional', 'Enfermagem'],
  lawton: ['Terapia Ocupacional', 'Psicologia', 'Serviço Social', 'Enfermagem'],
  gds15: ['Psicologia', 'Médico', 'Enfermagem'],
  meem: ['Médico', 'Psicologia', 'Terapia Ocupacional', 'Enfermagem'],
  cdr: ['Médico', 'Psicologia', 'Enfermagem'],
  ohat: ['Odontologia'],
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

export function canAval(
  cat: Categoria,
  area: string | undefined,
  escala: string,
  customArea?: string,
): boolean {
  if (['rt', 'enf', 'med'].includes(cat)) return true
  if (cat === 'multi') {
    if (customArea) {
      return customArea === 'Geral' || customArea === (area ?? '')
    }
    return (ESCALA_AREA[escala] ?? []).includes(area ?? '')
  }
  return false
}

export const ESCALAS_PADRAO_KEYS: EscalaKey[] = [
  'fugulin',
  'katz',
  'lawton',
  'morse',
  'braden',
  'glasgow',
  'mna',
  'gds15',
  'meem',
  'cdr',
  'ohat',
]

export function escalasVisiveis(_cat?: Categoria, _area?: string): EscalaKey[] {
  return ['fugulin', 'morse', 'braden', 'glasgow', 'mna']
}

export function navVisivel(cat: Categoria): NavView[] {
  return (Object.keys(NAV_ACESSO) as NavView[]).filter((k) => canNav(cat, k))
}