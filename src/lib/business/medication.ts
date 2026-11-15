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