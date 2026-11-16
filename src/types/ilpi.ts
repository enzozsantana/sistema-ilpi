/** Categorias profissionais (chave → rótulo em constants.CATS). */
export type Categoria =
  | 'rt'
  | 'enf'
  | 'tec'
  | 'cuid'
  | 'estag'
  | 'med'
  | 'multi'
  | 'apoio'

export type NavView =
  | 'plantao'
  | 'residentes'
  | 'estoque'
  | 'rotinas'
  | 'equipe'
  | 'gestao'

export type AbaResidente =
  | 'pasta'
  | 'ficha'
  | 'aval'
  | 'pia'
  | 'cuidados'
  | 'presc'
  | 'anot'
  | 'evol'
  | 'arquivos'
  | 'estoque'
  | 'tudo'

export type AcaoPermissao =
  | 'adm'
  | 'anot'
  | 'cuid'
  | 'gerir'
  | 'presc'
  | 'estoque'
  | 'aval'
  | 'evol'

export type TipoPrescricao = 'fixo' | 'semanal' | 'intervalo' | 'sn'

export type StatusResidente = 'ativo' | 'obito'

export type NivelBadge = 'ok' | 'warn' | 'danger'

export type StatusAdm = 'dado' | 'recusado' | 'nao'

export type EscalaKey = 'fugulin' | 'morse' | 'braden' | 'glasgow' | 'mna'

export type EventoTipo =
  | 'obito'
  | 'dda'
  | 'escabiose'
  | 'desidratacao'
  | 'lpp'
  | 'desnutricao'
  | 'queda'

export interface Assinatura {
  id: string
  d: string
  h: string
}

export interface Profissional {
  id: string
  nome: string
  cat: Categoria
  funcao: string
  conselho?: string
  setor?: string
  area?: string
  carga?: string
  horario?: string
  foto?: string
  ativo?: boolean
}

export interface ItemEstoque {
  id: string
  nome: string
  unid: string
  qtd: number
  min: number
  consumoDia?: number
}

export interface Prescricao {
  id: string
  med: string
  dose: string
  via: string
  tipo: TipoPrescricao
  inicio: string
  fim?: string
  horarios: string[]
  dias?: number[]
  intervalo?: number
  consumo: number
  estoqueId: string | null
  obs?: string
  prescritor?: string
  suspensa?: boolean
  controlado?: boolean
  sig?: Assinatura
}

export interface RegistroAdm {
  st: StatusAdm
  motivo?: string
  sig: Assinatura
}

export interface DoseDia {
  key: string
  hora: string
  resid: string
  presc: Prescricao
}

export interface AvaliacaoEscala {
  id: string
  esc: EscalaKey
  d: string
  resp: number[]
  sig: Assinatura
}

export interface Pia {
  id: string
  periodo?: string
  inicio: string
  reav?: string
  necessidades?: string[]
  obs?: string
  resultado?: string
  encaminhamentos?: string
  sig?: Assinatura
}

export interface Cuidado {
  id: string
  texto: string
  quem: 'todos' | 'enfermagem' | 'cuidador'
}

export interface Anotacao {
  id: string
  pa?: string
  pulso?: string | number
  resp?: string | number
  temp?: string | number
  sat?: string | number
  evac?: string
  diurese?: string
  texto: string
  sig: Assinatura
}

export interface Evolucao {
  id: string
  area: string
  texto: string
  peso?: number
  sig: Assinatura
}

export interface Responsavel {
  nome?: string
  parentesco?: string
  tel?: string
}

export interface Residente {
  id: string
  nome: string
  sexo?: 'M' | 'F' | string
  nasc?: string
  quarto?: string
  admissao: string
  obitoData?: string
  status?: StatusResidente
  alergias?: string
  doencas?: string[]
  presc: Prescricao[]
  estoque: ItemEstoque[]
  aval: AvaliacaoEscala[]
  pia: Pia[]
  cuidados: Cuidado[]
  anot: Anotacao[]
  evol: Evolucao[]
  responsavel?: Responsavel
  docs?: Record<string, boolean>
  agenda?: AgendaItem[]
  arquivos?: ArquivoResidente[]
  foto?: string
  [key: string]: unknown
}

export interface AgendaItem {
  id: string
  area: string
  d: string
  atividade: string
  sig?: Assinatura | null
}

export interface ArquivoResidente {
  id: string
  nome: string
  cat?: string
  [key: string]: unknown
}

export interface DocumentoInstituicao {
  id: string
  nome: string
  orgao: string
  validade: string
}

export interface PopDocumento {
  id: string
  titulo: string
  tipo: string
  revisao: string
}

export interface Treinamento {
  id: string
  data: string
  tema: string
  presentes: string[]
}

export interface TemperaturaGeladeira {
  id: string
  d: string
  turno: 'manha' | 'noite'
  h: string
  max: number
  min: number
  mom: number
  amb: number
  sig: Assinatura
}

export interface EventoVigilancia {
  id: string
  resId?: string
  tipo: EventoTipo
  data: string
}

export interface EscalaMes {
  [profId: string]: string[]
}

export interface EstadoIlpi {
  inst: string
  user: string
  equipe: Profissional[]
  residentes: Residente[]
  escalaMes: Record<string, EscalaMes>
  casa: ItemEstoque[]
  adm: Record<string, Record<string, RegistroAdm>>
  documentos: DocumentoInstituicao[]
  pops: PopDocumento[]
  treinamentos: Treinamento[]
  temperaturas: TemperaturaGeladeira[]
  eventos: EventoVigilancia[]
  [key: string]: unknown
}

export interface Alerta {
  n: NivelBadge
  t: string
  s: string
  go: string
}

export interface FlagsSsvv {
  pa?: string
  pulso?: string
  resp?: string
  temp?: string
  sat?: string
}

export interface ClassifEscala {
  txt: string
  nivel: NivelBadge
  grau?: number
}

export interface IndicadorLinha {
  tipo?: string
  n: string
  c: number
  taxa: number
}

export interface ResultadoCalcInd {
  den: number
  rows: IndicadorLinha[]
}

export interface DimensionamentoRdc502 {
  porGrau: { g1: number; g2: number; g3: number }
  req: { g1: number; g2: number; g3: number }
  porTurnoG23: number
  naEscala: { dia: number; noite: number }
  atende: boolean
}

export interface StampInfo {
  html?: string
  pre: string
  nomeProfissional: string
  conselho?: string
  cat?: Categoria
  data: string
  hora: string
}