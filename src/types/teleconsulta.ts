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
  solicitanteId?: string
  solicitanteNome?: string
  solicitanteFuncao?: string
  responsavelFinanceiroResidente?: string
}
