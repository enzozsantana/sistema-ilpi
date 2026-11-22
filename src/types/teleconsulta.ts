export type EspecialidadeVirtual =
  | 'medica'
  | 'estomaterapia'
  | 'nutricao'
  | 'psicologia'
  | 'fisioterapia'

/** Tabela Padronizada Oficial de Teleconsultas (CFM / COFEN / Senecurare) */
export interface TabelaOficialItem {
  rotulo: string
  valor: number
  repasseEspecialista: number // 80% líquido
  taxaSenecurare: number // 20% retenção
  duracaoMin: number
}

export const VALORES_PADRAO_CONSULTA: Record<EspecialidadeVirtual, TabelaOficialItem> = {
  medica: {
    rotulo: 'Medicina Geriátrica & Clínica Geral',
    valor: 240,
    repasseEspecialista: 192,
    taxaSenecurare: 48,
    duracaoMin: 45,
  },
  estomaterapia: {
    rotulo: 'Estomaterapia & Manejo de Feridas/LPP',
    valor: 180,
    repasseEspecialista: 144,
    taxaSenecurare: 36,
    duracaoMin: 45,
  },
  nutricao: {
    rotulo: 'Nutrição Clínica & Geriátrica (Enteral)',
    valor: 160,
    repasseEspecialista: 128,
    taxaSenecurare: 32,
    duracaoMin: 40,
  },
  psicologia: {
    rotulo: 'Psicologia Clínica & Demências',
    valor: 140,
    repasseEspecialista: 112,
    taxaSenecurare: 28,
    duracaoMin: 50,
  },
  fisioterapia: {
    rotulo: 'Fisioterapia Geriátrica & Reabilitação',
    valor: 130,
    repasseEspecialista: 104,
    taxaSenecurare: 26,
    duracaoMin: 40,
  },
}

export function obterValorPadraoEspecialidade(esp: EspecialidadeVirtual): number {
  return VALORES_PADRAO_CONSULTA[esp]?.valor || 180
}

export interface ProfissionalVirtual {
  id: string
  nome: string
  titulo: string
  titulos?: string[]
  especialidade: EspecialidadeVirtual
  especialidades?: EspecialidadeVirtual[]
  especialidadeLabel: string
  especialidadesLabels?: string[]
  registro: string
  clinica: string
  foto: string
  preco: number
  duracaoMin: number
  bio: string
  diasAtendimento: number[] // 0 = Domingo, 1 = Segunda, etc.
  horariosPadrao: string[]
  email?: string
  isIndependente?: boolean
}

export interface CadastroEspecialistaInput {
  nome: string
  email: string
  senha?: string
  password?: string
  especialidade?: EspecialidadeVirtual
  especialidades?: EspecialidadeVirtual[]
  especialidadeLabel?: string
  especialidadesLabels?: string[]
  titulo?: string
  titulos?: string[]
  registro: string
  conselho?: string
  consultorio?: string
  clinica?: string
  preco: number
  duracaoMin?: number
  bio: string
  foto?: string
}

export type StatusConsulta =
  | 'pendente_pagamento'
  | 'agendada'
  | 'confirmada'
  | 'em_andamento'
  | 'concluida'
  | 'cancelada'
export type MetodoPagamento = 'pix' | 'cartao'

export interface ResponsavelFinanceiroFamiliar {
  nome: string
  cpf?: string
  email?: string
  telefone?: string
  parentesco?: string
}

export interface ConsultaVirtual {
  id: string
  profissionalId: string
  profissionalNome: string
  especialidade: string
  registro: string
  clinica: string
  residenteId: string
  residenteNome: string
  data: string // YYYY-MM-DD
  horario: string // HH:MM
  valor: number
  metodoPagamento: MetodoPagamento
  pago: boolean
  linkSala: string
  codigoSala: string
  status: StatusConsulta
  motivo?: string
  motivoCancelamento?: string
  notasPreConsulta?: string
  origemSolicitacao?: 'ilpi_direto' | 'familiar_portal' | 'equipe_indicacao'
  responsavelFinanceiroFamiliar?: ResponsavelFinanceiroFamiliar
  linkPagamentoFamiliar?: string
  reagendadaDe?: string
  historicoReagendamentos?: Array<{
    dataAnterior: string
    horarioAnterior: string
    dataAlteracao: string
  }>
  evolucaoRealizada?: boolean
  receitaEmitida?: boolean
  criadoEm: string
  solicitanteId?: string
  solicitanteNome?: string
  solicitanteFuncao?: string
  responsavelFinanceiroResidente?: string
}

export interface BloqueioAgenda {
  id: string
  profissionalId: string
  data: string // YYYY-MM-DD
  horarioInicio?: string // HH:MM
  horarioFim?: string // HH:MM
  diaInteiro?: boolean
  motivo: string
  criadoEm: string
}

export interface DisponibilidadeSemanal {
  diaSemana: number // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  ativo: boolean
  inicio: string // "08:00"
  fim: string // "18:00"
  intervaloInicio?: string // "12:00"
  intervaloFim?: string // "13:00"
  horarios?: string[]
}

export interface ConfiguracaoAgendaProfissional {
  profissionalId: string
  duracaoSlotMin: number
  intervaloEntreSlotsMin: number
  diasSemana: DisponibilidadeSemanal[]
  bloqueios: BloqueioAgenda[]
  limiteDiario?: number
  aceitaEncaixe?: boolean
}

export interface SlotHorarioAgenda {
  horario: string
  disponivel: boolean
  consulta?: ConsultaVirtual
  bloqueado?: boolean
  motivoBloqueio?: string
}

export type VisualizacaoAgenda = 'dia' | 'semana' | 'mes' | 'lista'
