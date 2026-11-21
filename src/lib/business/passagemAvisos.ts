import type {
  AlertaCriticoRT,
  AvisoRT,
  PassagemPlantao,
  RegistroAdm,
  Residente,
  TurnoPlantao,
} from '../../types/ilpi'
import { dosesDia, regAdm } from './medication'
import { minAgora, minDe, primeiro } from './dates'
import { flagsValues } from './ssvv'
import { extrairHorariosCuidado } from './cuidados'

export const TURNOS_PLANTAO: { key: TurnoPlantao; label: string; horario: string }[] = [
  { key: 'manha', label: 'Manhã', horario: '07:00 – 13:00' },
  { key: 'tarde', label: 'Tarde', horario: '13:00 – 19:00' },
  { key: 'noite', label: 'Noite', horario: '19:00 – 07:00' },
  { key: 'diurno', label: 'Diurno (12h)', horario: '07:00 – 19:00' },
  { key: 'noturno', label: 'Noturno (12h)', horario: '19:00 – 07:00' },
]

export const MODELOS_PASSAGEM = [
  'Turno tranquilo, todos os residentes alimentados sem engasgos ou queixas.',
  'Mudanças de decúbito realizadas pontualmente a cada 2h; peles íntegras.',
  'Todas as medicações do horário administradas e checadas sem recusas.',
  'Curativos e trocas de coberturas realizados conforme prescrição.',
  'Residente agitado no final do período; comunicado à equipe de enfermagem.',
  'Higiene, banhos e trocas de fralda concluídos sem intercorrências.',
  'Atenção ao residente com sonda/curativo no próximo turno.',
]

const STORAGE_PASSAGENS = 'ilpi-passagens-plantao-v1'
const STORAGE_AVISOS = 'ilpi-avisos-rt-v1'

const AVISO_SEED_INICIAL: AvisoRT = {
  id: 'aviso_init_1',
  data: new Date().toISOString().split('T')[0],
  hora: '08:00',
  titulo: 'Aviso da RT: Protocolos de Decúbito & Hidratação',
  mensagem:
    'Atenção equipe de cuidadores e enfermagem: manter rigor na mudança de decúbito a cada 2h e registrar fotos de comprovação no prontuário. Reforçar oferta hídrica a todos os residentes.',
  prioridade: 'importante',
  autor: { id: 's1', nome: 'Egle (RT)', cat: 'rt' },
  ativo: true,
  ciencias: [],
}

/** Recupera passagens de plantão do cache local */
export function getPassagensLocais(): PassagemPlantao[] {
  try {
    const raw = localStorage.getItem(STORAGE_PASSAGENS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Salva passagens de plantão no cache local */
export function setPassagensLocais(lista: PassagemPlantao[]): void {
  try {
    localStorage.setItem(STORAGE_PASSAGENS, JSON.stringify(lista.slice(0, 50)))
  } catch {
    // ignora erro de quota
  }
}

/** Recupera avisos da RT do cache local */
export function getAvisosLocais(): AvisoRT[] {
  try {
    const raw = localStorage.getItem(STORAGE_AVISOS)
    if (!raw) {
      setAvisosLocais([AVISO_SEED_INICIAL])
      return [AVISO_SEED_INICIAL]
    }
    return JSON.parse(raw)
  } catch {
    return [AVISO_SEED_INICIAL]
  }
}

/** Salva avisos da RT no cache local */
export function setAvisosLocais(lista: AvisoRT[]): void {
  try {
    localStorage.setItem(STORAGE_AVISOS, JSON.stringify(lista.slice(0, 30)))
  } catch {
    // ignora erro de quota
  }
}

/**
 * Computa o resumo quantitativo automático do plantão de hoje para
 * alimentar a passagem de plantão com dados reais.
 */
export function computarResumoPlantao({
  residentes,
  adm,
  checagensCuidado,
  eventos,
  hoje,
}: {
  residentes: Residente[]
  adm: Record<string, Record<string, RegistroAdm>>
  checagensCuidado: Record<string, Record<string, { id: string }>>
  eventos: { data: string; descricao?: string; tipo?: string }[]
  hoje: string
}) {
  let dosesTotal = 0
  let dosesChecadas = 0

  residentes.forEach((r) => {
    const ds = dosesDia(r, hoje)
    dosesTotal += ds.length
    ds.forEach((d) => {
      const g = regAdm(adm, d.key, hoje)
      if (g) dosesChecadas++
    })
  })

  let cuidadosTotal = 0
  let cuidadosChecados = 0
  const chkHoje = checagensCuidado[hoje] ?? {}

  residentes.forEach((r) => {
    const cs = r.cuidados ?? []
    cs.forEach((c) => {
      const hors = extrairHorariosCuidado(c)
      cuidadosTotal += hors.length
      hors.forEach((h) => {
        if (chkHoje[`${r.id}|${c.id}|${h}`] || chkHoje[`${r.id}|${c.id}`]) {
          cuidadosChecados++
        }
      })
    })
  })

  const ocorrenciasHoje = eventos.filter((e) => e.data === hoje).length

  return {
    dosesTotal,
    dosesChecadas,
    cuidadosTotal,
    cuidadosChecados,
    ocorrenciasHoje,
  }
}

/**
 * Identifica alertas críticos do plantão que demandam notificação urgente
 * para a Responsável Técnica (RT - Egle) e enfermeiros supervisores.
 */
export function extrairAlertasCriticosRT({
  residentes,
  adm,
  checagensCuidado,
  eventos,
  temperaturas,
  hoje,
}: {
  residentes: Residente[]
  adm: Record<string, Record<string, RegistroAdm>>
  checagensCuidado: Record<string, Record<string, { id: string }>>
  eventos: { id?: string; data: string; descricao?: string; tipo?: string; residente_id?: string }[]
  temperaturas: { d: string; mom?: number; min?: number; max?: number; h?: string }[]
  hoje: string
}): AlertaCriticoRT[] {
  const criticos: AlertaCriticoRT[] = []
  const minutos = minAgora(new Date())

  // 1. Doses de medicamentos com atraso crítico (> 30 min sem checagem) ou recusadas
  residentes.forEach((r) => {
    dosesDia(r, hoje).forEach((d) => {
      const reg = regAdm(adm, d.key, hoje)
      if (!reg && minutos - minDe(d.hora) > 30) {
        criticos.push({
          id: `dose_late_${d.key}`,
          tipo: 'dose_atrasada',
          gravidade: 'alta',
          titulo: `Dose atrasada: ${d.presc.med}`,
          descricao: `${primeiro(r.nome)} (Quarto ${r.quarto}) — prevista para as ${d.hora} e ainda não administrada.`,
          residenteId: r.id,
          residenteNome: r.nome,
          horario: d.hora,
          link: `/plantao`,
        })
      } else if (reg && (reg.st === 'recusado' || reg.st === 'nao')) {
        criticos.push({
          id: `dose_recusa_${d.key}`,
          tipo: 'dose_atrasada',
          gravidade: 'critica',
          titulo: `Medicamento NÃO administrado: ${d.presc.med}`,
          descricao: `${primeiro(r.nome)} — status registrado como ${reg.st}. Motivo requer avaliação técnica.`,
          residenteId: r.id,
          residenteNome: r.nome,
          horario: d.hora,
          link: `/plantao`,
        })
      }
    })
  })

  // 2. Intercorrências sanitárias ocorridas hoje (quedas, engasgos, febre)
  eventos
    .filter((e) => e.data === hoje)
    .forEach((e, idx) => {
      const res = residentes.find((r) => r.id === e.residente_id)
      criticos.push({
        id: `oco_${e.id || idx}`,
        tipo: 'intercorrencia',
        gravidade: 'critica',
        titulo: `Intercorrência sanitária: ${(e.tipo || 'Ocorrência').toUpperCase()}`,
        descricao: `${res ? `${primeiro(res.nome)} (Q.${res.quarto}): ` : ''}${e.descricao || 'Registrada no plantão de hoje.'}`,
        residenteId: res?.id,
        residenteNome: res?.nome,
        link: `/plantao`,
      })
    })

  // 3. Sinais vitais alterados gravemente (PA elevada, hipo/hiperglicemia severa, saturação baixa)
  residentes.forEach((r) => {
    const anotsHoje = (r.anot ?? []).filter((a) => a.sig.d === hoje)
    const ultAnot = anotsHoje[anotsHoje.length - 1]
    if (ultAnot) {
      const f = flagsValues(ultAnot)
      if (f.length > 0) {
        const flagStr = f.join(', ')
        criticos.push({
          id: `ssvv_${ultAnot.id}`,
          tipo: 'ssvv_critico',
          gravidade: 'alta',
          titulo: `Sinal vital alterado: ${primeiro(r.nome)}`,
          descricao: `Quarto ${r.quarto}: ${flagStr} às ${ultAnot.sig.h}. Relatado por equipe.`,
          residenteId: r.id,
          residenteNome: r.nome,
          horario: ultAnot.sig.h,
          link: `/residentes/${r.id}/anot`,
        })
      }
    }
  })

  // 4. Cuidados prioritários de LPP não checados
  const chkHoje = checagensCuidado[hoje] ?? {}
  residentes.forEach((r) => {
    const cuidadosLpp = (r.cuidados ?? []).filter(
      (c) => /lpp|dec[uú]bito|les[aã]o|curativo/i.test(c.texto),
    )
    cuidadosLpp.forEach((c) => {
      if (!chkHoje[`${r.id}|${c.id}`] && minutos > minDe('12:00')) {
        criticos.push({
          id: `cuid_${r.id}_${c.id}`,
          tipo: 'cuidado_pendente',
          gravidade: 'alta',
          titulo: `Cuidado LPP pendente: ${primeiro(r.nome)}`,
          descricao: `Quarto ${r.quarto} — ${c.texto.slice(0, 60)}... sem checagem registrada.`,
          residenteId: r.id,
          residenteNome: r.nome,
          link: `/plantao`,
        })
      }
    })
  })

  // 5. Geladeira de medicamentos fora da faixa normativa (2 a 8 °C)
  const ultTemp = temperaturas[temperaturas.length - 1]
  if (ultTemp && [ultTemp.mom, ultTemp.min, ultTemp.max].some((v) => v != null && (v < 2 || v > 8))) {
    criticos.push({
      id: `geladeira_fora`,
      tipo: 'geladeira_fora',
      gravidade: 'critica',
      titulo: 'Temperatura da geladeira fora do padrão (2–8 °C)',
      descricao: `Último registro indica desvio térmico. Risco para termolábeis e insulinas.`,
      horario: ultTemp.h,
      link: `/rotinas`,
    })
  }

  // 6. Suspensões de medicamentos aguardando validação técnica da Enfermagem
  residentes.forEach((r) => {
    (r.presc ?? []).forEach((p) => {
      if (p.suspensao?.status === 'pendente_enfermagem') {
        criticos.push({
          id: `susp_pendente_${p.id}`,
          tipo: 'suspensao_pendente',
          gravidade: 'alta',
          titulo: `Suspensão a validar: ${p.med}`,
          descricao: `${primeiro(r.nome)} (Q.${r.quarto}) — solicitada por ${p.suspensao.solicitadoPor?.nome || 'Médico'}. Justificativa: ${p.suspensao.justificativa}`,
          residenteId: r.id,
          residenteNome: r.nome,
          link: `/residentes/${r.id}?tab=presc`,
        })
      }
    })
  })

  return criticos
}
