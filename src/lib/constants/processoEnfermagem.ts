export interface ItemProcessoEnfermagem {
  numero: number
  id: string
  diagnostico: string // NANDA / Necessidade Identificada
  meta: string // NOC / Meta Individual
  intervencoes: string // NIC / Intervenções de Enfermagem
}

/**
 * Catálogo Padronizado do Processo de Enfermagem (NANDA, NOC, NIC)
 * Extraído do protocolo assistencial da ILPI (Coren-SP / RDC 502).
 * Exclui a 4ª coluna (Critérios/Indicadores) conforme instrução.
 */
export const PROCESSO_ENFERMAGEM_PADRAO: ItemProcessoEnfermagem[] = [
  {
    numero: 1,
    id: 'nanda_1',
    diagnostico: 'Prevenção de quedas',
    meta: 'Manter a mobilidade com segurança e reduzir o risco de quedas.',
    intervencoes:
      'Avaliar histórico de quedas, marcha, equilíbrio, visão, calçados, medicamentos e ambiente; orientar equipe; supervisionar transferências conforme necessidade.',
  },
  {
    numero: 2,
    id: 'nanda_2',
    diagnostico: 'Integridade da pele',
    meta: 'Manter a pele íntegra ou favorecer a evolução da lesão existente.',
    intervencoes:
      'Avaliar pele e risco de lesão por pressão; inspecionar proeminências ósseas; implementar mudanças de posição individualizadas; controlar umidade e realizar curativos conforme prescrição e protocolo.',
  },
  {
    numero: 3,
    id: 'nanda_3',
    diagnostico: 'Alimentação e hidratação',
    meta: 'Manter ingestão alimentar e hídrica compatível com as necessidades individuais.',
    intervencoes:
      'Monitorar aceitação das refeições e ingestão de líquidos; acompanhar peso; observar sinais de desidratação, dificuldades de mastigação e deglutição; articular com nutricionista e equipe de saúde.',
  },
  {
    numero: 4,
    id: 'nanda_4',
    diagnostico: 'Eliminação intestinal e urinária',
    meta: 'Preservar o padrão de eliminação e prevenir complicações.',
    intervencoes:
      'Monitorar frequência e características das eliminações; observar constipação, diarreia, dor e alterações urinárias; estimular mobilidade e hidratação quando indicadas.',
  },
  {
    numero: 5,
    id: 'nanda_5',
    diagnostico: 'Administração de medicamentos',
    meta: 'Garantir uso seguro dos medicamentos prescritos.',
    intervencoes:
      'Conferir prescrição, identificação, dose, horário, via e registro; monitorar efeitos adversos e interações suspeitas; acompanhar adesão e comunicar alterações ao prescritor.',
  },
  {
    numero: 6,
    id: 'nanda_6',
    diagnostico: 'Mobilidade e funcionalidade',
    meta: 'Preservar ou melhorar a capacidade funcional possível.',
    intervencoes:
      'Avaliar atividades de vida diária; incentivar participação no banho, vestuário, alimentação e marcha conforme capacidade; articular exercícios com fisioterapia.',
  },
  {
    numero: 7,
    id: 'nanda_7',
    diagnostico: 'Cognição e orientação',
    meta: 'Preservar capacidades cognitivas e promover orientação e segurança.',
    intervencoes:
      'Observar mudanças cognitivas e comportamentais; utilizar comunicação simples, calendário, relógio e objetos familiares; investigar alterações agudas de consciência ou comportamento.',
  },
  {
    numero: 8,
    id: 'nanda_8',
    diagnostico: 'Sono e repouso',
    meta: 'Promover sono reparador e conforto.',
    intervencoes:
      'Investigar padrão de sono, dor, noctúria e fatores ambientais; favorecer rotina individualizada, conforto e atividades diurnas adequadas.',
  },
  {
    numero: 9,
    id: 'nanda_9',
    diagnostico: 'Saúde emocional e social',
    meta: 'Favorecer bem-estar emocional, vínculos e pertencimento.',
    intervencoes:
      'Investigar preferências, sentimentos e sinais de sofrimento; estimular contato com familiares, convivência, música, atividades significativas e participação voluntária.',
  },
  {
    numero: 10,
    id: 'nanda_10',
    diagnostico: 'Dor e conforto',
    meta: 'Manter dor controlada e conforto durante as atividades.',
    intervencoes:
      'Investigar localização, intensidade e características da dor; utilizar escala apropriada à capacidade de comunicação; executar medidas prescritas e reavaliar a resposta.',
  },
  {
    numero: 11,
    id: 'nanda_11',
    diagnostico: 'Higiene e autocuidado',
    meta: 'Manter higiene, conforto, privacidade e dignidade.',
    intervencoes:
      'Planejar banho e higiene conforme preferência e capacidade funcional; incentivar autonomia; observar alterações na pele, mucosas, cavidade oral e unhas.',
  },
  {
    numero: 12,
    id: 'nanda_12',
    diagnostico: 'Controle de doenças crônicas',
    meta: 'Manter estabilidade clínica e identificar precocemente descompensações.',
    intervencoes:
      'Monitorar sinais e sintomas relacionados às condições existentes; verificar sinais vitais conforme avaliação e protocolo; acompanhar consultas, exames e prescrições.',
  },
  {
    numero: 13,
    id: 'nanda_13',
    diagnostico: 'Saúde bucal e deglutição',
    meta: 'Preservar saúde oral e alimentação segura.',
    intervencoes:
      'Avaliar cavidade oral, próteses, higiene e dificuldades durante as refeições; comunicar sinais de engasgo, tosse ou alteração da deglutição e solicitar avaliação especializada quando indicada.',
  },
  {
    numero: 14,
    id: 'nanda_14',
    diagnostico: 'Prevenção de infecções',
    meta: 'Reduzir riscos de infecção e reconhecer sinais precoces.',
    intervencoes:
      'Promover higiene das mãos, cuidados conforme protocolos, vacinação recomendada e observação de sinais clínicos; comunicar suspeitas e seguir precauções indicadas.',
  },
  {
    numero: 15,
    id: 'nanda_15',
    diagnostico: 'Autonomia e direitos',
    meta: 'Garantir participação nas decisões e respeito à individualidade.',
    intervencoes:
      'Registrar preferências, hábitos, história de vida, valores e escolhas; explicar procedimentos; respeitar privacidade, consentimento e decisões da pessoa idosa.',
  },
]
