import { DOCS, MESES } from '../constants'
import { diffDays, iso, mesKey, parse } from './dates'
import { grau, totalEsc, ultAval } from './escalas'
import { presAtiva } from './medication'
import type {
  DimensionamentoRdc502,
  EscalaMes,
  EventoVigilancia,
  Profissional,
  Residente,
  ResultadoCalcInd,
} from '../../types/ilpi'

const INDICADORES_VIGILANCIA: [string, string][] = [
  ['obito', 'Taxa de mortalidade'],
  ['dda', 'Incidência de doença diarreica aguda'],
  ['escabiose', 'Incidência de escabiose'],
  ['desidratacao', 'Incidência de desidratação'],
  ['lpp', 'Prevalência de lesão por pressão'],
  ['desnutricao', 'Prevalência de desnutrição'],
]

export function ativos(residentes: Residente[]): Residente[] {
  return residentes.filter((r) => r.status !== 'obito')
}

export function codigoHoje(
  escalaMes: Record<string, EscalaMes>,
  profId: string,
  dt: string,
): string {
  const m = escalaMes[dt.slice(0, 7)]
  const a = m?.[profId]
  if (!a) return ''
  return a[parse(dt).getDate() - 1] || ''
}

export function calcInd(
  mk: string,
  residentes: Residente[],
  eventos: EventoVigilancia[],
): ResultadoCalcInd {
  const [y, m] = mk.split('-').map(Number)
  const ini = iso(new Date(y, m - 1, 1))
  const fim = iso(new Date(y, m, 0))
  const den = residentes.filter(
    (r) => r.admissao <= fim && (!r.obitoData || r.obitoData >= ini),
  ).length
  const ev = eventos.filter((e) => e.data >= ini && e.data <= fim)
  const rows = INDICADORES_VIGILANCIA.map(([k, n]) => {
    const prevalencia = k === 'lpp' || k === 'desnutricao'
    const c = prevalencia
      ? new Set(ev.filter((e) => e.tipo === k).map((e) => e.resId)).size
      : ev.filter((e) => e.tipo === k).length
    return { n, c, taxa: den ? (c / den) * 100 : 0 }
  })
  return { den, rows }
}

export interface LinhaDependencia {
  r: Residente
  total: number | null
  grau: number | null
}

export function tabelaFugulin(residentes: Residente[]): LinhaDependencia[] {
  return ativos(residentes).map((r) => {
    const a = ultAval(r, 'fugulin')
    const t = a ? totalEsc('fugulin', a.resp) : null
    return { r, total: t, grau: grau(r) }
  })
}

/** Dimensionamento de cuidadores conforme RDC 502/2021 (proporção do protótipo). */
export function dimensionamento(
  residentes: Residente[],
  equipe: Profissional[],
  escalaMes: Record<string, EscalaMes>,
  dataRef: string,
): DimensionamentoRdc502 {
  const rs = tabelaFugulin(residentes)
  const cnt = (g: number) => rs.filter((x) => x.grau === g).length
  const porGrau = { g1: cnt(1), g2: cnt(2), g3: cnt(3) }
  const req = {
    g1: Math.ceil(porGrau.g1 / 20),
    g2: Math.ceil(porGrau.g2 / 10),
    g3: Math.ceil(porGrau.g3 / 6),
  }
  const nurse = equipe.filter((p) => ['cuid', 'tec'].includes(p.cat))
  const dia = nurse.filter((p) =>
    ['D', 'M', 'T'].includes(codigoHoje(escalaMes, p.id, dataRef)),
  ).length
  const noite = nurse.filter(
    (p) => codigoHoje(escalaMes, p.id, dataRef) === 'N',
  ).length
  const porTurnoG23 = req.g2 + req.g3
  return {
    porGrau,
    req,
    porTurnoG23,
    naEscala: { dia, noite },
    atende: noite >= porTurnoG23 && dia >= porTurnoG23,
  }
}

export function variacaoPeso(r: Residente) {
  const ps = r.evol
    .filter((e) => e.peso != null)
    .sort((a, b) => a.sig.d.localeCompare(b.sig.d))
  if (ps.length < 2) return null
  const last = ps[ps.length - 1]
  const ref =
    [...ps].reverse().find((e) => diffDays(last.sig.d, e.sig.d) >= 80) ?? ps[0]
  const pesoRef = ref.peso!
  const pesoLast = last.peso!
  return {
    pct: ((pesoLast - pesoRef) / pesoRef) * 100,
    de: ref,
    ate: last,
  }
}

export function docsPend(r: Residente): [string, string][] {
  return DOCS.filter(
    ([k]) => k !== 'obito' && k !== 'convenio' && !(r.docs || {})[k],
  )
}

export function sugestoesPia(r: Residente, dataRef: string): Record<string, string> {
  const s: Record<string, string> = {}
  const sc = (k: 'morse' | 'braden' | 'mna' | 'glasgow') => {
    const a = ultAval(r, k)
    return a ? totalEsc(k, a.resp) : null
  }
  const m = sc('morse')
  const b = sc('braden')
  const n = sc('mna')
  const g = sc('glasgow')
  const gr = grau(r)
  if (m != null && m >= 25) s.quedas = `Morse ${m}`
  if (b != null && b <= 18) s.pele = `Braden ${b}`
  if (n != null && n <= 11) s.alimentacao = `MNA ${n}`
  const vp = variacaoPeso(r)
  if (vp && Math.abs(vp.pct) >= 5) s.alimentacao = `Variação de peso de ${vp.pct.toFixed(1).replace('.', ',')}%`
  if (g != null && g < 15) s.cognicao = `Glasgow ${g}`
  if ((r.doencas || []).includes('Demência')) s.cognicao = 'Demência'
  if (gr && gr >= 2) {
    s.mobilidade = `Grau ${gr} de dependência`
    s.higiene = `Grau ${gr} de dependência`
  }
  const nMed = r.presc.filter((p) => presAtiva(p, dataRef) && p.estoqueId).length
  if (nMed >= 5) s.medicamentos = `Polifarmácia (${nMed} medicamentos)`
  if ((r.doencas || []).some((x) => ['HAS', 'Diabetes', 'IRC', 'DPOC', 'AVE'].includes(x))) {
    s.cronicas = (r.doencas || []).join(', ')
  }
  s.autonomia = s.autonomia || 'Recomendado para todos'
  return s
}

export function treinamentoPendente(
  treinamentos: { data: string }[],
  ref: Date,
): string {
  const mk = mesKey(ref)
  if (treinamentos.some((t) => t.data.startsWith(mk))) return ''
  return `Treinamento de ${MESES[ref.getMonth()]} ainda não registrado`
}
