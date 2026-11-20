export type EspecialidadeVirtual =
  | 'medica'
  | 'estomaterapia'
  | 'nutricao'
  | 'psicologia'
  | 'fisioterapia'

export interface ProfissionalVirtual {
  id: string
  nome: string
  titulo: string
  especialidade: EspecialidadeVirtual
  especialidadeLabel: string
  registro: string
  clinica: string
  foto: string
  preco: number
  duracaoMin: number
  bio: string
  diasAtendimento: number[] // 0 = Domingo, 1 = Segunda, etc.
  horariosPadrao: string[]
}

export type StatusConsulta = 'agendada' | 'confirmada' | 'em_andamento' | 'concluida' | 'cancelada'
export type MetodoPagamento = 'pix' | 'cartao'

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
  evolucaoRealizada?: boolean
  receitaEmitida?: boolean
  criadoEm: string
}
