export type PlanoId = 'compacto' | 'clinico' | 'avancado' | 'enterprise'

export type FeatureKey =
  | 'plantao'
  | 'residentes'
  | 'prescricoes'
  | 'estoque'
  | 'pops'
  | 'lpp_mapa'
  | 'treinamentos'
  | 'teleconsulta'
  | 'multi_turnos'
  | 'multi_unidades'

export interface PlanoConfig {
  id: PlanoId
  nome: string
  subtitulo: string
  porte: string
  precoMensal: number
  precoAnualMensal: number // Valor por mês quando faturado anualmente (-15%)
  destaque?: boolean
  limiteResidentes: number // -1 ou 99999 para ilimitado
  recursos: string[]
  naoInclui?: string[]
  diferenciais: string[]
  botaoTexto: string
}

export const PLANOS: Record<PlanoId, PlanoConfig> = {
  compacto: {
    id: 'compacto',
    nome: 'Plano Compacto',
    subtitulo: 'Casas familiares e pequeno porte',
    porte: 'Até 15 residentes',
    precoMensal: 450,
    precoAnualMensal: 382.5,
    limiteResidentes: 15,
    recursos: [
      'Até 15 residentes ativos cadastrados',
      'Prontuário multiprofissional unificado',
      'Checagem e aprazamento de medicações com alertas de horário',
      'Passagem de plantão digital e livro de ocorrências',
      'Sinais vitais com curva gráfica e alertas de hiper/hipo',
      'Usuários profissionais 100% ilimitados e sem cobrança por login',
      'PWA instalável em smartphones e tablets com modo offline',
    ],
    naoInclui: [
      'Controle de estoque individual e almoxarifado por residente',
      'POPs com carimbo de auditoria COREN / RDC 502',
      'Mapa de feridas (LPP) com fotos e régua de cicatrização',
      'LMS de Treinamentos com certificação obrigatória Art. 38',
      'Consultório virtual de telemedicina e especialistas credenciados',
    ],
    diferenciais: [
      'Entrada acessível para lares de pequeno porte',
      'Zero taxa de implantação',
      'Backup diário em nuvem',
    ],
    botaoTexto: 'Assinar Plano Compacto',
  },
  clinico: {
    id: 'clinico',
    nome: 'Clínico & Compliance',
    subtitulo: 'O mais vendido · Médio porte com blindagem sanitária',
    porte: '16 a 35 residentes',
    precoMensal: 890,
    precoAnualMensal: 756.5,
    destaque: true,
    limiteResidentes: 35,
    recursos: [
      'Até 35 residentes ativos cadastrados',
      'Tudo incluído no Plano Compacto',
      'Estoque individual e controle de almoxarifado por residente',
      'POPs e Protocolos Sanitários com carimbo de fiscalização COREN / ANVISA',
      'Mapa anatômico de Lesões por Pressão (LPP) com evolução fotográfica',
      'Termômetro digital de geladeira e cadeia de frio de termolábeis',
      'Auditoria de enfermagem completa e dossiê sanitário RDC 502',
      'Prevenção de multas de até R$ 50.000,00 da Vigilância Sanitária',
      'Usuários profissionais 100% ilimitados',
    ],
    naoInclui: [
      'LMS de Treinamentos & Educação Permanente Art. 38',
      'Consultório virtual de telemedicina integrado',
    ],
    diferenciais: [
      'Blindagem sanitária total perante o COREN',
      'O sweet spot de custo-benefício para 90% das ILPIs privadas',
      'Suporte prioritário via WhatsApp',
    ],
    botaoTexto: 'Assinar Plano Clínico & Compliance',
  },
  avancado: {
    id: 'avancado',
    nome: 'Plano Avançado',
    subtitulo: 'Grande porte com Educação Permanente & Telemedicina',
    porte: '36 a 60 residentes',
    precoMensal: 1390,
    precoAnualMensal: 1181.5,
    limiteResidentes: 60,
    recursos: [
      'Até 60 residentes ativos cadastrados',
      'Tudo incluído no Plano Clínico & Compliance',
      'LMS de Treinamentos com certificação obrigatória Art. 38 RDC 502',
      'Consultório Virtual & Teleconsulta integrada com split automático',
      'Especialistas virtuais credenciados (Geriatria, Estomaterapia, Nutrição)',
      'Escalas de enfermagem complexas e gestão de múltiplos turnos 12×36',
      'Exportação de Dossiê Executivo completo em PDF para fiscalização',
      'Suporte VIP via WhatsApp com resposta garantida',
    ],
    naoInclui: [
      'Painel executivo multi-unidades / redes multicentro',
    ],
    diferenciais: [
      'Educação Permanente e capacitação contínua inclusa',
      'Telemedicina sem custo fixo de contratação médica',
      'Atende lares de grande porte com alta complexidade clínica',
    ],
    botaoTexto: 'Assinar Plano Avançado',
  },
  enterprise: {
    id: 'enterprise',
    nome: 'Redes & Enterprise',
    subtitulo: 'Redes de ILPIs, hospitais de transição e grupos geriátricos',
    porte: '60+ residentes ou redes',
    precoMensal: 1990,
    precoAnualMensal: 1691.5,
    limiteResidentes: 99999,
    recursos: [
      'Residentes e filiais 100% ilimitados',
      'Todos os recursos de todos os planos liberados',
      'Painel corporativo consolidado para grupos de ILPIs',
      'SLA de atendimento dedicado 24/7 com gerente de contas',
      'Treinamento e onboarding presencial ou assistido para toda a equipe',
      'Mentoria regulatória mensal com especialista em fiscalização COREN',
      'Customização de relatórios e exportações sob medida',
    ],
    diferenciais: [
      'Solução corporativa sob medida para grupos e redes',
      'Gestão multi-filial unificada com visão consolidada',
      'SLA crítico de atendimento 24/7',
    ],
    botaoTexto: 'Falar com Consultor Enterprise',
  },
}

export const PLANO_HIERARQUIA: Record<PlanoId, number> = {
  compacto: 1,
  clinico: 2,
  avancado: 3,
  enterprise: 4,
}

export const RECURSO_PLANO_MINIMO: Record<FeatureKey, PlanoId> = {
  plantao: 'compacto',
  residentes: 'compacto',
  prescricoes: 'compacto',
  estoque: 'clinico',
  pops: 'clinico',
  lpp_mapa: 'clinico',
  treinamentos: 'avancado',
  teleconsulta: 'avancado',
  multi_turnos: 'avancado',
  multi_unidades: 'enterprise',
}

export const RECURSO_NOMES: Record<FeatureKey, string> = {
  plantao: 'Painel de Plantão e Ocorrências',
  residentes: 'Prontuário Multiprofissional',
  prescricoes: 'Checagem e Aprazamento de Medicações',
  estoque: 'Controle de Estoque & Almoxarifado Individual',
  pops: 'POPs e Protocolos Sanitários RDC 502',
  lpp_mapa: 'Mapa Anatômico de Lesões por Pressão (LPP)',
  treinamentos: 'Plataforma LMS & Educação Permanente (Art. 38)',
  teleconsulta: 'Consultório Virtual & Telemedicina',
  multi_turnos: 'Gestão de Múltiplos Turnos e Escalas 12×36',
  multi_unidades: 'Gestão Multi-unidades e Redes Corporativas',
}

const STORAGE_KEY_PLANO = 'senecurare_plano_ativo'

export function obterPlanoAtivo(): PlanoId {
  if (typeof window === 'undefined') return 'clinico'
  try {
    const salvo = localStorage.getItem(STORAGE_KEY_PLANO) as PlanoId | null
    if (salvo && PLANOS[salvo]) return salvo
    // Padrão do sistema: Plano Clínico & Compliance (o mais vendido)
    return 'clinico'
  } catch {
    return 'clinico'
  }
}

export function definirPlanoAtivo(plano: PlanoId): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_PLANO, plano)
    // Dispara evento customizado para sincronizar componentes em tempo real
    window.dispatchEvent(new CustomEvent('senecurare_plano_alterado', { detail: plano }))
  } catch (err) {
    console.error('Erro ao salvar plano:', err)
  }
}

export function isFeatureDisponivel(feature: FeatureKey, planoAtual?: PlanoId): boolean {
  const plano = planoAtual || obterPlanoAtivo()
  const nivelAtual = PLANO_HIERARQUIA[plano] || 1
  const planoMinimo = RECURSO_PLANO_MINIMO[feature]
  const nivelMinimo = PLANO_HIERARQUIA[planoMinimo] || 1
  return nivelAtual >= nivelMinimo
}

export function obterPlanoMinimoFeature(feature: FeatureKey): PlanoConfig {
  const idMinimo = RECURSO_PLANO_MINIMO[feature]
  return PLANOS[idMinimo]
}

export function verificarLimiteResidentes(
  totalResidentes: number,
  planoAtual?: PlanoId,
): { atingiu: boolean; limite: number; restantes: number; plano: PlanoConfig } {
  const planoId = planoAtual || obterPlanoAtivo()
  const plano = PLANOS[planoId]
  const limite = plano.limiteResidentes
  if (limite <= 0 || limite >= 9999) {
    return { atingiu: false, limite: 99999, restantes: 99999, plano }
  }
  const atingiu = totalResidentes >= limite
  const restantes = Math.max(0, limite - totalResidentes)
  return { atingiu, limite, restantes, plano }
}
