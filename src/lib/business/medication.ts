import { diffDays, minAgora, minDe, parse } from './dates'
import type { DoseDia, Prescricao, RegistroAdm, Residente } from '../../types/ilpi'

export const DOSE_LATE_MINUTES = 30

export function presAtiva(p: Prescricao, dt: string): boolean {
  return !p.suspensa && p.inicio <= dt && (!p.fim || p.fim >= dt)
}

export function horariosNoDia(p: Prescricao, dt: string): string[] {
  if (!presAtiva(p, dt)) return []
  if (p.tipo === 'fixo') return p.horarios
  if (p.tipo === 'semanal') {
    const dias = p.dias ?? []
    return dias.includes(parse(dt).getDay()) ? p.horarios : []
  }
  if (p.tipo === 'intervalo') {
    const n = diffDays(dt, p.inicio)
    return n >= 0 && n % (p.intervalo || 1) === 0 ? p.horarios : []
  }
  return []
}

export function doseKey(resid: string, prescId: string, hora: string): string {
  return `${resid}|${prescId}|${hora}`
}

export function parseDoseKey(key: string): { resid: string; prescId: string; hora: string } {
  const [resid, prescId, hora] = key.split('|')
  return { resid, prescId, hora }
}

export function dosesDia(r: Residente, dt: string): DoseDia[] {
  const out: DoseDia[] = []
  r.presc.forEach((p) => {
    horariosNoDia(p, dt).forEach((h) => {
      out.push({
        key: doseKey(r.id, p.id, h),
        hora: h,
        resid: r.id,
        presc: p,
      })
    })
  })
  return out
}

export function regAdm(
  adm: Record<string, Record<string, RegistroAdm>>,
  key: string,
  dt: string,
): RegistroAdm | undefined {
  return adm[dt]?.[key]
}

export function isDoseLate(
  hora: string,
  registrada: boolean,
  agoraMinutos: number = minAgora(),
  limiteMinutos: number = DOSE_LATE_MINUTES,
): boolean {
  if (registrada) return false
  return agoraMinutos - minDe(hora) > limiteMinutos
}

export function freqTxt(
  p: Prescricao,
  diasSemana: readonly string[] = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
): string {
  if (p.tipo === 'sn') return `Se necessário${p.obs ? '. ' + p.obs : ''}`
  const h = p.horarios.join(', ')
  if (p.tipo === 'semanal') {
    const dias = (p.dias ?? []).map((i) => diasSemana[i]).join(' e ')
    return `${dias}, às ${h}`
  }
  if (p.tipo === 'intervalo') return `A cada ${p.intervalo} dias, às ${h}`
  return `Diário, às ${h}`
}

/**
 * Lista de substâncias, classes e nomes comerciais comuns de medicamentos
 * sujeitos a controle especial no Brasil (Portaria SVS/MS 344/98 e atualizações ANVISA:
 * listas A1/A2/A3, B1/B2 psicotrópicos, C1 outras substâncias, C2 retinóides).
 */
export const TERMOS_REMEDIOS_CONTROLADOS: readonly string[] = [
  // Benzodiazepínicos e hipnóticos / indutores do sono
  'clonazepam', 'rivotril',
  'diazepam', 'valium',
  'lorazepam', 'lorax',
  'alprazolam', 'frontal',
  'bromazepam', 'lexotan',
  'midazolam', 'dormonid',
  'zolpidem', 'stilnox',
  'estazolam', 'noan',
  'flurazepam', 'dalmadorm',
  'cloxazolam', 'olcadil',
  'nitrazepam', 'sonebon',

  // Antidepressivos sob controle especial (Portaria 344 Lista C1)
  'fluoxetina', 'prozac', 'daforin',
  'sertralina', 'zoloft', 'assert', 'tolrest',
  'escitalopram', 'lexapro', 'exodus', 'reconter',
  'citalopram', 'cipramil', 'procimax',
  'paroxetina', 'aropax', 'paxil', 'pondera',
  'venlafaxina', 'efexor', 'venlax', 'alenthus',
  'desvenlafaxina', 'pristiq', 'deller',
  'duloxetina', 'cymbalta', 'velija',
  'mirtazapina', 'remeron', 'menelat',
  'amitriptilina', 'tryptanol', 'amytril',
  'nortriptilina', 'pamelor',
  'imipramina', 'tofranil',
  'clomipramina', 'anafranil',
  'bupropiona', 'wellbutrin', 'bup', 'zetron',
  'trazodona', 'donaren',
  'vortioxetina', 'brintellix',

  // Antipsicóticos / Neurolépticos (Controle Especial)
  'quetiapina', 'seroquel', 'quetros',
  'risperidona', 'risperdal', 'zargus',
  'olanzapina', 'zyprexa',
  'haloperidol', 'haldol',
  'clorpromazina', 'amplictil',
  'levomepromazina', 'neozine',
  'aripiprazol', 'abilify', 'arizep',
  'clozapina', 'leponex',
  'ziprasidona', 'geodon',
  'sulpirida', 'equilid',
  'tiapridal', 'tiaprida',
  'pimozida', 'orap',

  // Anticonvulsivantes / Estabilizadores de Humor (Controle Especial)
  'carbamazepina', 'tegretol',
  'oxcarbazepina', 'trileptal',
  'valproato', 'divalproato', 'depakote', 'depakene', 'acido valproico',
  'fenobarbital', 'gardenal',
  'gabapentina', 'neurontin',
  'pregabalina', 'lyrica', 'prebictal',
  'lamotrigina', 'lamictal',
  'topiramato', 'topamax',
  'levetiracetam', 'keppra',
  'litio', 'carbolitium',

  // Opioides / Analgésicos Narcóticos
  'morfina', 'dimorf',
  'tramadol', 'tramal',
  'codeina', 'paco', 'tylex',
  'metadona', 'mytedom',
  'fentanil', 'fentanila', 'durogesic',
  'oxicodona', 'oxycontin',
  'buprenorfina', 'restiva',

  // Estimulantes / Outros sujeitos a receita retida
  'metilfenidato', 'ritalina', 'concerta',
  'lisdexanfetamina', 'venvanse',
  'modafinila', 'stavigile',
  'biperideno', 'akineton',
]

/**
 * Remove acentos e normaliza para minúsculas para comparação textual robusta.
 */
function normalizarTexto(txt: string): string {
  return txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Detecta automaticamente se o nome de um medicamento corresponde a uma substância
 * de controle especial (Portaria 344 / psicotrópico / tarja preta ou vermelha especial).
 */
export function detectControlado(nomeMedicamento: string): boolean {
  if (!nomeMedicamento) return false
  const norm = normalizarTexto(nomeMedicamento)
  return TERMOS_REMEDIOS_CONTROLADOS.some((termo) => {
    const termoNorm = normalizarTexto(termo)
    const regex = new RegExp(`(^|[^a-z0-9])${termoNorm}([^a-z0-9]|$)`, 'i')
    return regex.test(norm)
  })
}

/**
 * Determina se a prescrição é de remédio controlado.
 * Se o campo `controlado` foi definido explicitamente (true ou false), respeita a escolha.
 * Se indefinido, utiliza detecção automática baseada no nome do medicamento.
 */
export function isMedicamentoControlado(
  p?: { med?: string; controlado?: boolean } | null,
): boolean {
  if (!p) return false
  if (typeof p.controlado === 'boolean') {
    return p.controlado
  }
  return detectControlado(p.med ?? '')
}
