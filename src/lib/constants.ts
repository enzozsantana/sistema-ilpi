import type { Categoria } from '../types/ilpi'

export const CATS: Record<Categoria, string> = {
  rt: 'Responsável técnica',
  gestao: 'Gestão / Administração (Diretoria)',
  enf: 'Enfermeiro(a)',
  tec: 'Técnico(a) ou auxiliar de enfermagem',
  cuid: 'Cuidador(a)',
  estag: 'Estagiário(a) de enfermagem',
  med: 'Médico(a)',
  multi: 'Equipe multiprofissional',
  apoio: 'Apoio (cozinha, limpeza, lavanderia)',
  tele_especialista: 'Especialista Teleconsulta (Independente)',
}

export const NURSE: Categoria[] = ['rt', 'enf', 'tec', 'estag']

export const CATS_ARQ = [
  'Documento pessoal',
  'Exame',
  'Laudo',
  'Outro',
  'Pedido Médico',
  'Receita',
  'Termo assinado',
] as const

export const SETORES = [
  'Diurno 12h',
  'Enfermeiros',
  'Estágio',
  'Noturno 12h',
  'Responsável técnica',
] as const

export const AREAS = [
  'Enfermagem',
  'Fisioterapia',
  'Medicina',
  'Musicoterapia',
  'Nutrição',
  'Psicologia',
  'Serviço social',
  'Terapia ocupacional',
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
  'Casado(a)',
  'Divorciado(a)',
  'Solteiro(a)',
  'União estável',
  'Viúvo(a)',
] as const

export const DOENCAS = [
  'AVE',
  'Demência',
  'Depressão',
  'Diabetes',
  'DPOC',
  'HAS',
  'Hepatites',
  'Hiper/Hipotireoidismo',
  'HIV',
  'IRC',
] as const

export const ENTRADA = [
  'Assistência social',
  'Família',
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
  'EV',
  'IM',
  'Inalatória',
  'Ocular',
  'Retal',
  'SC',
  'SL',
  'SNE',
  'Tópica',
  'VO',
] as const

export const TIPOS_PRESC = {
  fixo: 'Todos os dias',
  semanal: 'Dias da semana',
  intervalo: 'A cada N dias',
  sn: 'Se necessário (SN)',
} as const

export const EVENTOS: Record<string, string> = {
  dda: 'Doença diarreica aguda',
  desidratacao: 'Desidratação',
  desnutricao: 'Desnutrição',
  escabiose: 'Escabiose',
  lpp: 'Lesão por pressão',
  obito: 'Óbito',
  queda: 'Queda',
}

export const TIPOS_DOC = ['Fluxograma', 'Manual', 'POP', 'Protocolo'] as const

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