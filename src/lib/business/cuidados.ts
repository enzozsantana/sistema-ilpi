import type { Cuidado, Residente } from '../../types/ilpi'

export type TipoCuidadoCategoria = 'lpp' | 'curativo' | 'geral'

export interface DadosPrescricaoCurativo {
  cobertura: string
  localizacao: string
  grauLesao?: string
  frequencia: string
  instrucoes?: string
  quem: 'todos' | 'enfermagem' | 'cuidador'
}

export interface DadosMudancaDecubito {
  intervaloHoras: number | string
  periodo: '24h' | 'noturno' | 'diurno'
  sequenciaDecubito?: string
  alertaLppAtivo: boolean
  quem: 'todos' | 'enfermagem' | 'cuidador'
}

export const COBERTURAS_CURATIVO = [
  'Alginato de Cálcio',
  'Bota de Unna',
  'Colagenase',
  'Curativo Simples (SF 0,9% + Gaze Estéril)',
  'Espuma de Poliuretano / Silicone',
  'Hidrogel com Alginato',
  'Óleo Cicatrizante (AGE)',
  'Outra Cobertura / Especial',
  'Película / Filme Transparente',
  'Placa de Hidrocolóide',
  'Sulfadiazina de Prata 1%',
] as const

export const LOCAIS_ANATOMICOS = [
  'Calcâneo Direito',
  'Calcâneo Esquerdo',
  'Escápulas / Ombros',
  'Glúteos / Região Isquiática',
  'Maléolo Lateral / Medial',
  'Membros Inferiores (MMII)',
  'Outro Local',
  'Região Occipital',
  'Região Sacra / Cóccix',
  'Trocânter Direito',
  'Trocânter Esquerdo',
] as const

export const GRAUS_LESAO_LPP = [
  'Grau 1 (Eritema não branqueável / Pele íntegra)',
  'Grau 2 (Perda parcial da pele / Bolha ou úlcera rasa)',
  'Grau 3 (Perda total da pele / Subcutâneo visível)',
  'Grau 4 (Perda total com exposição de músculo/osso)',
  'Não Classificável (Base com necrose ou esfacelo)',
  'Lesão por Fricção / Cisalhamento (Skin Tear)',
  'Dermatite Associada à Incontinência (DAI/MASD)',
] as const

export const FREQUENCIAS_CURATIVO = [
  '1x ao dia (no banho)',
  '2x ao dia (manhã e tarde)',
  'A cada 48h a 72h ou se saturar/vazar',
  'A cada troca de fralda se houver sujidade',
  'Avaliação a cada plantão',
  'Em dias alternados',
] as const

export const PALAVRAS_CHAVE_LPP = [
  'decúbito',
  'decubito',
  'mudança de decúbito',
  'mudanca de decubito',
  'lesão por pressão',
  'lesao por pressao',
  'lpp',
  'úlcera por pressão',
  'ulcera por pressao',
  'escara',
  'pele íntegra',
  'hidratar a pele com age',
  'proeminências ósseas',
  'proeminencias osseas',
  'fricção',
  'friccao',
  'cisalhamento',
  'trocânter',
  'trocanter',
  'calcâneo',
  'calcaneo',
]

export const PALAVRAS_CHAVE_CURATIVO = [
  'curativo',
  'cobertura',
  'hidrocolóide',
  'hidrocoloide',
  'sulfadiazina',
  'alginato',
  'hidrogel',
  'espuma de poliuretano',
  'silicone',
  'bota de unna',
  'colagenase',
  'sf 0,9%',
  'soro fisiológico',
  'soro fisiologico',
  'gaze estéril',
  'gaze esteril',
  'desbridamento',
]

/**
 * Detecta se o cuidado está relacionado à Lesão por Pressão (LPP) ou prevenção ativa / decúbito.
 */
export function isCuidadoLpp(cuidado: Cuidado | string, residente?: Residente): boolean {
  const texto = typeof cuidado === 'string' ? cuidado : cuidado.texto
  const t = texto.toLowerCase()

  if (t.includes('[lpp]') || t.includes('[lesão por pressão]') || t.includes('[lesao por pressao]')) {
    return true
  }

  // Verifica palavras-chave diretas
  const matchKeyword = PALAVRAS_CHAVE_LPP.some((kw) => t.includes(kw.toLowerCase()))
  if (matchKeyword) return true

  // Se o residente tem Braden com alto risco e o cuidado envolve pele/movimentação
  if (residente?.aval?.some((a) => a.esc === 'braden')) {
    const braden = residente.aval.filter((a) => a.esc === 'braden').slice(-1)[0]
    const soma = braden.resp.reduce((acc: number, val: number) => acc + val, 0)
    // Braden <= 14 é risco moderado/alto/muito alto
    if (soma <= 14 && (t.includes('pele') || t.includes('posicionar') || t.includes('leito') || t.includes('coxim'))) {
      return true
    }
  }

  return false
}

/**
 * Detecta se o cuidado é uma Prescrição de Enfermagem para Curativo.
 */
export function isCuidadoCurativo(cuidado: Cuidado | string): boolean {
  const texto = typeof cuidado === 'string' ? cuidado : cuidado.texto
  const t = texto.toLowerCase()

  if (t.includes('[curativo') || t.includes('prescrição de curativo') || t.includes('prescricao de curativo')) {
    return true
  }

  return PALAVRAS_CHAVE_CURATIVO.some((kw) => t.includes(kw.toLowerCase()))
}

export interface CuidadoClassificado {
  tipo: TipoCuidadoCategoria
  badgeTexto: string
  corTema: 'amber' | 'purple' | 'slate'
  isLpp: boolean
  isCurativo: boolean
  isDecubito: boolean
  tituloPrincipal: string
  instrucoes?: string
  dadosCurativo?: {
    cobertura?: string
    local?: string
    grau?: string
    frequencia?: string
  }
}

/**
 * Analisa e classifica o cuidado retornando tema de cor, badges e orientações para cuidadores/auxiliares.
 * NUNCA utiliza vermelho (reservado no sistema para atrasado/não feito/recusa).
 */
export function classificarCuidado(cuidado: Cuidado, residente?: Residente): CuidadoClassificado {
  const texto = cuidado.texto
  const lpp = isCuidadoLpp(cuidado, residente)
  const curativo = isCuidadoCurativo(cuidado)
  const decubito = texto.toLowerCase().includes('decúbito') || texto.toLowerCase().includes('decubito')

  // Se for Curativo (Prescrição de Enfermagem)
  if (curativo) {
    // Tenta extrair detalhes se foram serializados ou descritos
    let instrucoes: string | undefined
    if (texto.includes('Orientações:') || texto.includes('Orientacoes:')) {
      const parts = texto.split(/Orientações:|Orientacoes:/i)
      instrucoes = parts[1]?.trim()
    } else if (texto.includes('Instruções:') || texto.includes('Instrucoes:')) {
      const parts = texto.split(/Instruções:|Instrucoes:/i)
      instrucoes = parts[1]?.trim()
    }

    // Identifica cobertura
    const cobEncontrada = COBERTURAS_CURATIVO.find((c) => texto.toLowerCase().includes(c.toLowerCase()))
    const localEncontrado = LOCAIS_ANATOMICOS.find((l) => texto.toLowerCase().includes(l.toLowerCase().split('/')[0].trim()))

    return {
      tipo: 'curativo',
      badgeTexto: lpp ? 'Curativo • LPP Ativa' : 'Prescrição de Curativo',
      corTema: lpp ? 'amber' : 'purple',
      isLpp: lpp,
      isCurativo: true,
      isDecubito: false,
      tituloPrincipal: texto.replace(/^\[.*?\]\s*/, ''),
      instrucoes,
      dadosCurativo: {
        cobertura: cobEncontrada,
        local: localEncontrado,
      },
    }
  }

  // Se for Mudança de Decúbito ou Lesão por Pressão (LPP)
  if (lpp || decubito) {
    return {
      tipo: 'lpp',
      badgeTexto: decubito ? 'Alerta LPP • Mudança de Decúbito' : 'Atenção Especial • Protocolo LPP',
      corTema: 'amber',
      isLpp: true,
      isCurativo: false,
      isDecubito: decubito,
      tituloPrincipal: texto.replace(/^\[.*?\]\s*/, ''),
    }
  }

  // Cuidado de rotina / geral
  return {
    tipo: 'geral',
    badgeTexto: 'Rotina Geral',
    corTema: 'slate',
    isLpp: false,
    isCurativo: false,
    isDecubito: false,
    tituloPrincipal: texto.replace(/^\[.*?\]\s*/, ''),
  }
}

/**
 * Formata os dados de um novo curativo em texto padronizado para o plano de cuidados.
 */
export function formatarTextoCurativo(dados: DadosPrescricaoCurativo): string {
  const prefixo = dados.grauLesao ? `[CURATIVO LPP - ${dados.grauLesao}]` : '[CURATIVO]'
  let txt = `${prefixo} ${dados.localizacao}: ${dados.cobertura}. Frequência: ${dados.frequencia}.`
  if (dados.instrucoes?.trim()) {
    txt += ` Instruções: ${dados.instrucoes.trim()}`
  }
  return txt
}

/**
 * Formata os dados de mudança de decúbito com destaque para LPP.
 */
export function formatarTextoDecubito(dados: DadosMudancaDecubito): string {
  const tag = dados.alertaLppAtivo ? '[LPP] ' : ''
  const seq = dados.sequenciaDecubito ? ` (Sequência: ${dados.sequenciaDecubito})` : ''
  const per = dados.periodo === 'noturno' ? ' no período noturno' : dados.periodo === 'diurno' ? ' no período diurno' : ''
  return `${tag}Mudança de decúbito a cada ${dados.intervaloHoras} horas${per}${seq}`
}

export const PRESETS_HORARIOS_CUIDADO = [
  { label: 'A cada 2h (Diurno)', horarios: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'] },
  { label: 'A cada 2h (24 horas)', horarios: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00', '02:00', '04:00', '06:00'] },
  { label: 'A cada 2h (Noturno)', horarios: ['20:00', '22:00', '00:00', '02:00', '04:00', '06:00'] },
  { label: 'De 1 em 1h (Hidratação)', horarios: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'] },
  { label: 'A cada 3 horas', horarios: ['09:00', '12:00', '15:00', '18:00', '21:00', '00:00', '03:00', '06:00'] },
  { label: 'A cada 4 horas', horarios: ['08:00', '12:00', '16:00', '20:00', '00:00', '04:00'] },
  { label: '1x ao dia (09:00 - Banho)', horarios: ['09:00'] },
  { label: '2x ao dia (08:00 e 16:00)', horarios: ['08:00', '16:00'] },
  { label: '3x ao dia (08:00, 14:00 e 20:00)', horarios: ['08:00', '14:00', '20:00'] },
]

/**
 * Extrai ou infere os horários de checagem de um cuidado.
 * Se o cuidado já possuir array de horários explícito, utiliza-o.
 * Caso contrário, infere inteligentemente do texto (ex: "a cada 2 horas", "a cada 1 hora", "após o banho", horários explícitos no texto, etc.).
 */
export function extrairHorariosCuidado(cuidado: Cuidado | string): string[] {
  if (typeof cuidado !== 'string' && Array.isArray(cuidado.horarios) && cuidado.horarios.length > 0) {
    return cuidado.horarios
  }

  const texto = typeof cuidado === 'string' ? cuidado : cuidado.texto
  const t = texto.toLowerCase()

  // 1. Procura horários explícitos no texto (ex: "08:00, 14:00, 20:00" ou "às 09:00 e 17:00")
  const matches = texto.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g)
  if (matches && matches.length > 0) {
    const unicos = [...new Set(matches.map((m) => (m.length === 4 ? `0${m}` : m)))].sort()
    return unicos
  }

  // 2. Mudança de decúbito a cada 2h / 2 horas
  if (
    t.includes('a cada 2 horas') ||
    t.includes('a cada 2h') ||
    t.includes('cada 2 horas') ||
    t.includes('cada 2h') ||
    t.includes('2 em 2 horas') ||
    t.includes('2 em 2h')
  ) {
    if (t.includes('noturno')) {
      return ['20:00', '22:00', '00:00', '02:00', '04:00', '06:00']
    }
    if (t.includes('diurno')) {
      return ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
    }
    return [
      '08:00',
      '10:00',
      '12:00',
      '14:00',
      '16:00',
      '18:00',
      '20:00',
      '22:00',
      '00:00',
      '02:00',
      '04:00',
      '06:00',
    ]
  }

  // 3. Mudança a cada 3h
  if (
    t.includes('a cada 3 horas') ||
    t.includes('a cada 3h') ||
    t.includes('3 em 3 horas') ||
    t.includes('3 em 3h')
  ) {
    return ['09:00', '12:00', '15:00', '18:00', '21:00', '00:00', '03:00', '06:00']
  }

  // 4. Mudança a cada 4h
  if (
    t.includes('a cada 4 horas') ||
    t.includes('a cada 4h') ||
    t.includes('4 em 4 horas') ||
    t.includes('4 em 4h')
  ) {
    return ['08:00', '12:00', '16:00', '20:00', '00:00', '04:00']
  }

  // 5. De 1 em 1 hora (ex: hidratação / oferecer água)
  if (
    t.includes('1 em 1 hora') ||
    t.includes('a cada 1 hora') ||
    t.includes('a cada 1h') ||
    t.includes('1h em 1h')
  ) {
    return [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
    ]
  }

  // 6. Ingestão hídrica / hidratação frequente
  if (
    t.includes('ingestão hídrica') ||
    t.includes('ingestao hidrica') ||
    t.includes('oferecer água') ||
    t.includes('oferecer agua')
  ) {
    return ['09:00', '11:00', '14:00', '16:00', '18:00']
  }

  // 7. 3x ao dia
  if (t.includes('3x ao dia') || t.includes('3 vezes ao dia')) {
    return ['08:00', '14:00', '20:00']
  }

  // 8. 2x ao dia
  if (t.includes('2x ao dia') || t.includes('2 vezes ao dia')) {
    return ['08:00', '16:00']
  }

  // 9. Deambulação / caminhada / fisioterapia / atividades
  if (
    t.includes('deambulação') ||
    t.includes('deambulacao') ||
    t.includes('atividades') ||
    t.includes('caminhar')
  ) {
    return ['10:00', '16:00']
  }

  // 10. Banho / pele após banho / 1x ao dia
  if (
    t.includes('após o banho') ||
    t.includes('apos o banho') ||
    t.includes('no banho') ||
    t.includes('1x ao dia') ||
    t.includes('uma vez ao dia')
  ) {
    return ['09:00']
  }

  // Fallback padrão se não especificado (horários diurnos essenciais)
  return ['09:00', '15:00', '21:00']
}
