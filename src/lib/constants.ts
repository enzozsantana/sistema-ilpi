import type { Categoria } from '../types/ilpi'

export const CATS: Record<Categoria, string> = {
  rt: 'Responsável técnica',
  enf: 'Enfermeiro(a)',
  tec: 'Técnico(a) ou auxiliar de enfermagem',
  cuid: 'Cuidador(a)',
  estag: 'Estagiário(a) de enfermagem',
  med: 'Médico(a)',
  multi: 'Equipe multiprofissional',
  apoio: 'Apoio (cozinha, limpeza, lavanderia)',
}

export const NURSE: Categoria[] = ['rt', 'enf', 'tec', 'estag']

export const CATS_ARQ = [
  'Exame',
  'Pedido Médico',
  'Laudo',
  'Receita',
  'Documento pessoal',
  'Termo assinado',
  'Outro',
] as const

export const SETORES = [
  'Responsável técnica',
  'Enfermeiros',
  'Diurno 12h',
  'Noturno 12h',
  'Estágio',
] as const

export const AREAS = [
  'Enfermagem',
  'Medicina',
  'Nutrição',
  'Fisioterapia',
  'Psicologia',
  'Terapia ocupacional',
  'Musicoterapia',
  'Serviço social',
] as const

export const COD: Record<string, string> = {
  D: 'Plantão dia 12h',
  N: 'Noite 12h',
  M: 'Manhã',
  T: 'Tarde',
  F: 'Folga',
  FE: 'Férias',
  L: 'Licença (atestado)',
  H: 'Hospitalização',
  EX: 'Extra',
}

export const ESCOL = [
  'Não alfabetizado(a)',
  'Fundamental incompleto',
  'Fundamental completo',
  'Médio incompleto',
  'Médio completo',
  'Superior incompleto',
  'Superior completo',
  'Pós-graduação',
] as const

export const CIVIL = [
  'Solteiro(a)',
  'Casado(a)',
  'União estável',
  'Divorciado(a)',
  'Viúvo(a)',
] as const

export const DOENCAS = [
  'HAS',
  'Diabetes',
  'HIV',
  'IRC',
  'Hiper/Hipotireoidismo',
  'Hepatites',
  'AVE',
  'Demência',
  'DPOC',
  'Depressão',
] as const

export const ENTRADA = [
  'Família',
  'Assistência social',
  'Ministério Público',
  'Poder Judiciário',
] as const

export const DOCS: [string, string][] = [
  ['vacina', 'Cartão de vacina'],
  ['rg', 'Carteira de identidade'],
  ['cpf', 'CPF'],
  ['sus', 'Cartão do SUS'],
  ['convenio', 'Carteirinha do convênio'],
  ['contrato', 'Contrato assinado'],
  ['funerario', 'Plano funerário'],
  ['obito', 'Atestado de óbito'],
]

export const VIAS = [
  'VO',
  'SL',
  'Ocular',
  'Tópica',
  'SC',
  'IM',
  'EV',
  'Inalatória',
  'SNE',
  'Retal',
] as const

export const TIPOS_PRESC = {
  fixo: 'Todos os dias',
  semanal: 'Dias da semana',
  intervalo: 'A cada N dias',
  sn: 'Se necessário (SN)',
} as const

export const EVENTOS: Record<string, string> = {
  obito: 'Óbito',
  dda: 'Doença diarreica aguda',
  escabiose: 'Escabiose',
  desidratacao: 'Desidratação',
  lpp: 'Lesão por pressão',
  desnutricao: 'Desnutrição',
  queda: 'Queda',
}

export const TIPOS_DOC = ['POP', 'Protocolo', 'Manual', 'Fluxograma'] as const

export const MODELOS_ANOT = [
  'Residente calmo(a), comunicativo(a), orientado(a).',
  'Mudança de decúbito realizada conforme protocolo (pele íntegra).',
  'Curativo realizado conforme prescrição de enfermagem.',
  'Higiene e troca de fralda realizadas sem intercorrências.',
  'Deambula sem auxílio.',
  'Deambula com auxílio.',
  'Aceitou medicações VO conforme prescrição médica.',
  'Aceitou refeições VO.',
  'Sem queixas álgicas.',
  'SSVV e dextro aferidos dentro dos padrões.',
  'Segue aos cuidados de enfermagem.',
  'Em repouso no leito.',
  'Recusou atividade em grupo.',
] as const

export const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

export const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const