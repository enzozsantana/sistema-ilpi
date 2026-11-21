export type CategoriaCursoTreinamento =
  | 'clinico'
  | 'seguranca'
  | 'rdc502'
  | 'cuidados'
  | 'etica'

export const CATEGORIAS_CURSO_LABELS: Record<CategoriaCursoTreinamento, string> = {
  clinico: 'Clínico & Enfermagem',
  seguranca: 'Segurança & NR-32',
  rdc502: 'Conformidade RDC 502/ANVISA',
  cuidados: 'Práticas do Cuidar',
  etica: 'Ética & Atendimento Humanizado',
}

export type StatusAtribuicaoTreinamento = 'pendente' | 'atrasado' | 'concluido'

export interface OpcaoQuiz {
  id: string
  texto: string
}

export interface PerguntaQuiz {
  id: string
  enunciado: string
  opcoes: OpcaoQuiz[]
  opcaoCorretaId: string
  explicacao?: string
}

export interface CursoTreinamento {
  id: string
  titulo: string
  descricao: string
  categoria: CategoriaCursoTreinamento
  duracaoEstimada: string // ex: "45 min" ou "1h 30min"
  videoUrl: string
  obrigatorio: boolean
  notaCorte: number // default 70
  perguntasQuiz: PerguntaQuiz[]
  ativo: boolean
  criadoEm?: string
  atualizadoEm?: string
}

export interface AtribuicaoTreinamento {
  id: string
  cursoId: string
  cursoTitulo: string
  cursoCategoria: CategoriaCursoTreinamento
  duracaoEstimada: string
  videoUrl: string
  perguntasQuiz: PerguntaQuiz[]
  notaCorte: number
  profissionalId: string
  profissionalNome: string
  profissionalCpf?: string
  profissionalCat: string
  prazo: string // YYYY-MM-DD
  status: StatusAtribuicaoTreinamento
  concluidoEm?: string // ISO string
  notaObtida?: number
  respostasQuiz?: Record<string, string>
}

export interface MetricasTreinamentos {
  totalAtribuicoes: number
  pendentes: number
  atrasados: number
  concluidos: number
  taxaConclusao: number // 0 a 100
  totalCursos: number
  colaboradoresEngajados: number
}
