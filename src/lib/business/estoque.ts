import { presAtiva } from './medication'
import type { ItemEstoque, NivelBadge, Prescricao, Residente } from '../../types/ilpi'

/** Consumo médio diário do item conforme prescrições ativas (port de consumoDia). */
export function consumoDia(
  r: Residente,
  it: ItemEstoque,
  dataRef: string,
): number {
  let c = 0
  r.presc.forEach((p: Prescricao) => {
    if (p.estoqueId !== it.id || !presAtiva(p, dataRef) || p.tipo === 'sn') return
    const base = (p.consumo || 0) * p.horarios.length
    if (p.tipo === 'semanal') {
      c += (base * (p.dias?.length ?? 0)) / 7
    } else if (p.tipo === 'intervalo') {
      c += base / (p.intervalo || 1)
    } else {
      c += base
    }
  })
  return c
}

export function diasRest(consumo: number, qtd: number): number {
  return consumo > 0 ? qtd / consumo : Infinity
}

export function nivelEst(consumo: number, it: Pick<ItemEstoque, 'qtd' | 'min'>): NivelBadge {
  const d = diasRest(consumo, it.qtd)
  if (it.qtd <= 0 || d <= 3) return 'danger'
  if (d <= 7 || it.qtd < it.min) return 'warn'
  return 'ok'
}

/** Quantidade sugerida para 30 dias (port de compra30). */
export function qtdPedir(consumo: number, it: Pick<ItemEstoque, 'qtd' | 'min'>): number {
  return Math.max(0, Math.ceil(consumo * 30 + (it.min || 0) - it.qtd))
}