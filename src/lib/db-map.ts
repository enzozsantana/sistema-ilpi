import type {
  AgendaItem,
  Anotacao,
  ArquivoResidente,
  Assinatura,
  AvaliacaoEscala,
  Categoria,
  Cuidado,
  DocumentoInstituicao,
  EventoVigilancia,
  EscalaKey,
  Evolucao,
  ItemEstoque,
  Pia,
  PiaItemNanda,
  PopDocumento,
  Prescricao,
  Profissional,
  RegistroAdm,
  Residente,
  StatusAdm,
  SuspensaoPrescricao,
  TemperaturaGeladeira,
  TipoPrescricao,
  Treinamento,
} from '../types/ilpi'
import { doseKey, detectControlado } from './business/medication'

type DbTipoPresc = 'diario' | 'semanal' | 'intervalo' | 'sn'

function mapTipoPresc(tipo: DbTipoPresc): TipoPrescricao {
  if (tipo === 'diario') return 'fixo'
  return tipo
}

function asSig(raw: unknown): Assinatura {
  const s = (raw ?? {}) as Record<string, string>
  return { id: s.id ?? '', d: s.d ?? '', h: s.h ?? '' }
}

function str(d: string | null | undefined): string | undefined {
  return d ?? undefined
}

export function mapProfissional(row: {
  id: string
  nome: string
  categoria: Categoria
  funcao: string
  conselho?: string | null
  setor?: string | null
  area?: string | null
  carga?: string | null
  horario?: string | null
  foto?: string | null
  ativo?: boolean | null
}): Profissional {
  return {
    id: row.id,
    nome: row.nome,
    cat: row.categoria,
    funcao: row.funcao,
    conselho: row.conselho ?? undefined,
    setor: row.setor ?? undefined,
    area: row.area ?? undefined,
    carga: row.carga ?? undefined,
    horario: row.horario ?? undefined,
    foto: row.foto ?? undefined,
    ativo: row.ativo ?? true,
  }
}

export function mapItemEstoque(row: {
  id: string
  nome: string
  unidade: string
  quantidade: number
  minimo: number
  consumo_dia?: number | null
}): ItemEstoque {
  return {
    id: row.id,
    nome: row.nome,
    unid: row.unidade,
    qtd: Number(row.quantidade),
    min: Number(row.minimo),
    consumoDia: row.consumo_dia != null ? Number(row.consumo_dia) : undefined,
  }
}

export function mapPrescricao(row: {
  id: string
  medicamento: string
  dose?: string | null
  via?: string | null
  tipo: DbTipoPresc
  horarios: unknown
  dias: unknown
  intervalo?: number | null
  consumo: number
  item_estoque_id?: string | null
  inicio?: string | null
  fim?: string | null
  obs?: string | null
  prescritor_id?: string | null
  suspensa: boolean
  controlado?: boolean | null
  assinatura: unknown
  suspensao?: unknown
}): Prescricao {
  const sigRaw = (row.assinatura ?? {}) as Record<string, unknown>
  let isCtrl: boolean | undefined = undefined
  if (typeof row.controlado === 'boolean') {
    isCtrl = row.controlado
  } else if (typeof sigRaw.controlado === 'boolean') {
    isCtrl = sigRaw.controlado
  } else if (row.obs && /\[(CONTROLADO|PSICOTR[OÓ]PICO)\]/i.test(row.obs)) {
    isCtrl = true
  } else if (detectControlado(row.medicamento)) {
    isCtrl = true
  }

  let suspensao: SuspensaoPrescricao | undefined = undefined
  if (row.suspensao && typeof row.suspensao === 'object') {
    suspensao = row.suspensao as SuspensaoPrescricao
  } else if (sigRaw.suspensao && typeof sigRaw.suspensao === 'object') {
    suspensao = sigRaw.suspensao as SuspensaoPrescricao
  } else if (row.suspensa) {
    suspensao = {
      justificativa: row.obs && row.obs.includes('SUSPENS') ? row.obs : 'Suspensão clínica anterior',
      solicitadoPor: {
        id: row.prescritor_id || '',
        nome: 'Prescritor',
        d: row.fim || row.inicio || '',
        h: '',
      },
      status: 'validada',
    }
  }

  return {
    id: row.id,
    med: row.medicamento,
    dose: row.dose ?? '',
    via: row.via ?? '',
    tipo: mapTipoPresc(row.tipo),
    horarios: (row.horarios as string[]) ?? [],
    dias: (row.dias as number[]) ?? [],
    intervalo: row.intervalo ?? undefined,
    consumo: Number(row.consumo),
    estoqueId: row.item_estoque_id ?? null,
    inicio: row.inicio ?? '',
    fim: row.fim ?? undefined,
    obs: row.obs ?? undefined,
    prescritor: row.prescritor_id ?? undefined,
    suspensa: row.suspensa,
    suspensao,
    controlado: isCtrl,
    sig: asSig(row.assinatura),
  }
}

export function mapAvaliacao(row: {
  id: string
  escala: string
  data: string
  respostas: unknown
  assinatura: unknown
}): AvaliacaoEscala {
  return {
    id: row.id,
    esc: row.escala as EscalaKey,
    d: row.data,
    resp: (row.respostas as number[]) ?? [],
    sig: asSig(row.assinatura),
  }
}

import { PROCESSO_ENFERMAGEM_PADRAO } from './constants/processoEnfermagem'

export function mapPia(row: {
  id: string
  periodo?: string | null
  inicio?: string | null
  reavaliacao?: string | null
  necessidades: unknown
  itens_nanda?: unknown
  metas?: unknown
  intervencoes?: unknown
  obs?: string | null
  resultado?: string | null
  encaminhamentos?: string | null
  assinatura: unknown
}): Pia {
  let itensNanda: PiaItemNanda[] = []

  if (Array.isArray(row.itens_nanda) && row.itens_nanda.length > 0) {
    itensNanda = row.itens_nanda as PiaItemNanda[]
  } else if (Array.isArray(row.necessidades) && row.necessidades.length > 0) {
    if (typeof row.necessidades[0] === 'object' && row.necessidades[0] !== null) {
      itensNanda = row.necessidades as PiaItemNanda[]
    } else {
      const nomes = row.necessidades as string[]
      const metasObj = (row.metas as Record<string, string>) || {}
      const interObj = (row.intervencoes as Record<string, string>) || {}

      itensNanda = nomes.map((nome) => {
        const padrao = PROCESSO_ENFERMAGEM_PADRAO.find(
          (p) => p.diagnostico.toLowerCase() === nome.toLowerCase() || p.id === nome
        )
        return {
          id: padrao ? padrao.id : `diag_${nome}`,
          diagnostico: padrao ? padrao.diagnostico : nome,
          meta: metasObj[nome] || padrao?.meta || '',
          intervencoes: interObj[nome] || padrao?.intervencoes || '',
          resultado: row.resultado ?? undefined,
        }
      })
    }
  }

  const nomesNecessidades = Array.isArray(row.necessidades)
    ? typeof row.necessidades[0] === 'string'
      ? (row.necessidades as string[])
      : itensNanda.map((it) => it.diagnostico)
    : []

  return {
    id: row.id,
    periodo: row.periodo ?? undefined,
    inicio: row.inicio ?? '',
    reav: row.reavaliacao ?? undefined,
    necessidades: nomesNecessidades,
    itensNanda,
    metas: (row.metas as Record<string, string>) ?? undefined,
    intervencoes: (row.intervencoes as Record<string, string>) ?? undefined,
    obs: row.obs ?? undefined,
    resultado: row.resultado ?? undefined,
    encaminhamentos: row.encaminhamentos ?? undefined,
    sig: asSig(row.assinatura),
  }
}

export function mapCuidado(row: {
  id: string
  texto: string
  quem: 'todos' | 'enfermagem' | 'cuidador'
}): Cuidado {
  return { id: row.id, texto: row.texto, quem: row.quem }
}

export function mapAnotacao(row: {
  id: string
  pa?: string | null
  pulso?: string | null
  resp?: string | null
  temp?: string | null
  sat?: string | null
  dextro?: string | null
  evac?: string | null
  diurese?: string | null
  texto?: string | null
  fotos?: string[] | string | null
  assinatura: unknown
}): Anotacao {
  let fotos: string[] | undefined
  if (Array.isArray(row.fotos)) {
    fotos = row.fotos.filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
  } else if (typeof row.fotos === 'string' && row.fotos.trim()) {
    try {
      const parsed = JSON.parse(row.fotos)
      if (Array.isArray(parsed)) {
        fotos = parsed.filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
      } else {
        fotos = [row.fotos.trim()]
      }
    } catch {
      fotos = [row.fotos.trim()]
    }
  }

  return {
    id: row.id,
    pa: row.pa ?? undefined,
    pulso: row.pulso ?? undefined,
    resp: row.resp ?? undefined,
    temp: row.temp ?? undefined,
    sat: row.sat ?? undefined,
    dextro: row.dextro ?? undefined,
    evac: row.evac ?? undefined,
    diurese: row.diurese ?? undefined,
    texto: row.texto ?? '',
    fotos: fotos && fotos.length > 0 ? fotos : undefined,
    sig: asSig(row.assinatura),
  }
}

export function mapEvolucao(row: {
  id: string
  area: string
  texto?: string | null
  peso?: number | null
  assinatura: unknown
}): Evolucao {
  return {
    id: row.id,
    area: row.area,
    texto: row.texto ?? '',
    peso: row.peso != null ? Number(row.peso) : undefined,
    sig: asSig(row.assinatura),
  }
}

export function mapAgenda(row: {
  id: string
  area: string
  data: string
  atividade: string
  assinatura?: unknown | null
}): AgendaItem {
  const sig = row.assinatura
  return {
    id: row.id,
    area: row.area,
    d: row.data,
    atividade: row.atividade,
    sig: sig ? asSig(sig) : null,
  }
}

export function mapArquivo(row: {
  id: string
  nome: string
  categoria?: string | null
  data?: string | null
  tipo?: string | null
  area?: string | null
}): ArquivoResidente {
  return {
    id: row.id,
    nome: row.nome,
    cat: row.categoria ?? undefined,
    data: row.data ?? undefined,
    tipo: row.tipo ?? undefined,
    area: row.area ?? undefined,
  }
}

export function mapResidenteBase(row: {
  id: string
  nome: string
  sexo?: string | null
  nasc?: string | null
  quarto?: string | null
  admissao?: string | null
  escolaridade?: string | null
  estado_civil?: string | null
  filhos?: string | null
  profissao?: string | null
  convenio?: string | null
  alergias?: string | null
  doencas?: unknown
  outras?: string | null
  cirurgias?: string | null
  medico_id?: string | null
  status?: string | null
  obito_data?: string | null
  entrada?: string | null
  responsavel?: unknown
  contrato?: string | null
  docs?: unknown
  pref?: unknown
  foto?: string | null
}): Residente {
  const resp = (row.responsavel ?? {}) as Record<string, string>
  return {
    id: row.id,
    nome: row.nome,
    sexo: row.sexo ?? undefined,
    nasc: str(row.nasc),
    quarto: row.quarto ?? undefined,
    admissao: row.admissao ?? '',
    escolaridade: row.escolaridade ?? undefined,
    estadoCivil: row.estado_civil ?? undefined,
    filhos: row.filhos != null ? Number(row.filhos) || row.filhos : undefined,
    profissao: row.profissao ?? undefined,
    convenio: row.convenio ?? undefined,
    alergias: row.alergias ?? '',
    doencas: (row.doencas as string[]) ?? [],
    outras: row.outras ?? undefined,
    cirurgias: row.cirurgias ?? undefined,
    medico: row.medico_id ?? undefined,
    status: (row.status as Residente['status']) ?? 'ativo',
    obitoData: str(row.obito_data),
    entrada: row.entrada ?? undefined,
    responsavel: {
      nome: resp.nome,
      parentesco: resp.parentesco,
      tel: resp.tel,
    },
    contrato: row.contrato ?? undefined,
    docs: (row.docs as Record<string, boolean>) ?? {},
    pref: (row.pref as Record<string, string>) ?? {},
    foto: row.foto ?? undefined,
    presc: [],
    estoque: [],
    aval: [],
    pia: [],
    cuidados: [],
    anot: [],
    evol: [],
    agenda: [],
    arquivos: [],
  }
}

export function buildAdmMap(
  rows: {
    data: string
    residente_id: string
    prescricao_id: string
    horario: string
    status: StatusAdm
    motivo?: string | null
    assinatura: unknown
  }[],
): Record<string, Record<string, RegistroAdm>> {
  const adm: Record<string, Record<string, RegistroAdm>> = {}
  for (const row of rows) {
    const key = doseKey(row.residente_id, row.prescricao_id, row.horario)
    if (!adm[row.data]) adm[row.data] = {}
    adm[row.data][key] = {
      st: row.status,
      motivo: row.motivo ?? undefined,
      sig: asSig(row.assinatura),
    }
  }
  return adm
}

export function mapTemperatura(row: {
  id: string
  data: string
  turno: 'manha' | 'noite'
  hora?: string | null
  max?: number | null
  min?: number | null
  momento?: number | null
  ambiente?: number | null
  assinatura: unknown
}): TemperaturaGeladeira {
  return {
    id: row.id,
    d: row.data,
    turno: row.turno,
    h: row.hora ?? '',
    max: Number(row.max ?? 0),
    min: Number(row.min ?? 0),
    mom: Number(row.momento ?? 0),
    amb: Number(row.ambiente ?? 0),
    sig: asSig(row.assinatura),
  }
}

export function mapDocumentoInst(row: {
  id: string
  nome: string
  orgao?: string | null
  validade?: string | null
  arquivo_url?: string | null
  arquivo_nome?: string | null
  arquivo_tipo?: string | null
  arquivo_tamanho?: number | null
  arquivo_data?: string | null
}): DocumentoInstituicao {
  return {
    id: row.id,
    nome: row.nome,
    orgao: row.orgao ?? '',
    validade: row.validade ?? '',
    arquivo_url: row.arquivo_url ?? undefined,
    arquivo_nome: row.arquivo_nome ?? undefined,
    arquivo_tipo: row.arquivo_tipo ?? undefined,
    arquivo_tamanho: row.arquivo_tamanho ? Number(row.arquivo_tamanho) : undefined,
    arquivo_data: row.arquivo_data ?? undefined,
  }
}

export function mapPop(row: {
  id: string
  titulo: string
  tipo: string
  revisao?: string | null
  arquivo_url?: string | null
  arquivo_nome?: string | null
  arquivo_tipo?: string | null
  arquivo_tamanho?: number | null
  arquivo_data?: string | null
}): PopDocumento {
  return {
    id: row.id,
    titulo: row.titulo,
    tipo: row.tipo,
    revisao: row.revisao ?? '',
    arquivo_url: row.arquivo_url ?? undefined,
    arquivo_nome: row.arquivo_nome ?? undefined,
    arquivo_tipo: row.arquivo_tipo ?? undefined,
    arquivo_tamanho: row.arquivo_tamanho ? Number(row.arquivo_tamanho) : undefined,
    arquivo_data: row.arquivo_data ?? undefined,
  }
}

export function mapTreinamento(row: {
  id: string
  data: string
  tema: string
  presentes: unknown
}): Treinamento {
  return {
    id: row.id,
    data: row.data,
    tema: row.tema,
    presentes: (row.presentes as string[]) ?? [],
  }
}

export function mapEvento(row: {
  id: string
  residente_id: string
  tipo: string
  data: string
}): EventoVigilancia {
  return {
    id: row.id,
    resId: row.residente_id,
    tipo: row.tipo as EventoVigilancia['tipo'],
    data: row.data,
  }
}