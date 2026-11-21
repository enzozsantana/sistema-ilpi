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
  | 'gestao'
  | 'tele_especialista'

export type NavView =
  | 'plantao'
  | 'residentes'
  | 'estoque'
  | 'rotinas'
  | 'equipe'
  | 'gestao'
  | 'teleconsulta'
  | 'treinamentos'

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
  | 'pop_ver'
  | 'pop_editar'
  | 'alvara'
  | 'passar_plantao'
  | 'teleconsulta_solicitar'

export type TipoPrescricao = 'fixo' | 'semanal' | 'intervalo' | 'sn'

export type StatusResidente = 'ativo' | 'obito'

export type NivelBadge = 'ok' | 'warn' | 'danger'

export type StatusAdm = 'dado' | 'recusado' | 'nao'

export type EscalaKeyPadrao =
  | 'fugulin'
  | 'katz'
  | 'lawton'
  | 'morse'
  | 'braden'
  | 'glasgow'
  | 'mna'
  | 'gds15'
  | 'meem'
  | 'cdr'
  | 'ohat'

export type EscalaKey = EscalaKeyPadrao | (string & {})

export type EscalaCategoria =
  | 'dependencia'
  | 'risco'
  | 'cognicao'
  | 'humor'
  | 'nutricao'
  | 'odontologia'
  | 'personalizada'

export interface FaixaClassificacaoCustom {
  min: number
  max: number
  txt: string
  nivel: NivelBadge
  grau?: number
}

export interface EscalaCustomizada {
  id: string
  nome: string
  desc: string
  categoria: EscalaCategoria
  area?: string
  itens: [string, [string, number][]][]
  faixas: FaixaClassificacaoCustom[]
  criadaEm: string
  criadaPor?: string
}

export interface ConfiguracaoEscalas {
  escalasAtivas: string[]
  escalaDependenciaPadrao: 'fugulin' | 'katz'
  escalasCustomizadas: EscalaCustomizada[]
}

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
  userId?: string
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

export interface SuspensaoPrescricao {
  justificativa: string
  solicitadoPor: {
    id: string
    nome: string
    funcao?: string
    cat?: string
    conselho?: string
    d: string
    h: string
  }
  validadoPor?: {
    id: string
    nome: string
    funcao?: string
    cat?: string
    conselho?: string
    d: string
    h: string
  }
  status: 'pendente_enfermagem' | 'validada'
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
  suspensao?: SuspensaoPrescricao
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

export type PiaResultadoMeta = 'alcancado' | 'parcial' | 'nao_alcancado' | 'ajuste'

export interface PiaItemNanda {
  id: string
  diagnostico: string
  meta: string
  intervencoes: string
  resultado?: PiaResultadoMeta | string
}

export interface Pia {
  id: string
  periodo?: string
  inicio: string
  reav?: string
  necessidades?: string[]
  itensNanda?: PiaItemNanda[]
  metas?: Record<string, string>
  intervencoes?: Record<string, string>
  obs?: string
  resultado?: string
  encaminhamentos?: string
  sig?: Assinatura
}

export interface Cuidado {
  id: string
  texto: string
  quem: 'todos' | 'enfermagem' | 'cuidador'
  horarios?: string[]
}

export interface Anotacao {
  id: string
  pa?: string
  pulso?: string | number
  resp?: string | number
  temp?: string | number
  sat?: string | number
  dextro?: string | number
  evac?: string
  diurese?: string
  texto: string
  fotos?: string[]
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
  arquivo_url?: string
  arquivo_nome?: string
  arquivo_tipo?: string
  arquivo_tamanho?: number
  arquivo_data?: string
}

export interface PopDocumento {
  id: string
  titulo: string
  tipo: string
  revisao: string
  arquivo_url?: string
  arquivo_nome?: string
  arquivo_tipo?: string
  arquivo_tamanho?: number
  arquivo_data?: string
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

export type TurnoPlantao = 'manha' | 'tarde' | 'noite' | 'diurno' | 'noturno'

export interface PassagemPlantao {
  id: string
  data: string
  hora: string
  turno: TurnoPlantao
  passadoPor: { id: string; nome: string; cat?: string }
  recebidoPor?: { id: string; nome: string; cat?: string } | null
  relato: string
  pendencias?: string | null
  resumo: {
    dosesChecadas: number
    dosesTotal: number
    cuidadosChecados: number
    cuidadosTotal: number
    ocorrenciasHoje: number
    alertasCriticos?: string[]
  }
  createdAt?: string
}

export type PrioridadeAviso = 'geral' | 'importante' | 'urgente'

export interface AvisoRT {
  id: string
  data: string
  hora: string
  titulo: string
  mensagem: string
  prioridade: PrioridadeAviso
  autor: { id: string; nome: string; cat: string }
  ativo: boolean
  ciencias?: string[]
  createdAt?: string
}

export interface AlertaCriticoRT {
  id: string
  tipo: 'dose_atrasada' | 'intercorrencia' | 'ssvv_critico' | 'cuidado_pendente' | 'geladeira_fora' | 'suspensao_pendente'
  gravidade: 'alta' | 'critica'
  titulo: string
  descricao: string
  residenteId?: string
  residenteNome?: string
  horario?: string
  link?: string
}

export interface FlagsSsvv {
  pa?: string
  pulso?: string
  resp?: string
  temp?: string
  sat?: string
  dextro?: string
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