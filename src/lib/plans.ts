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

export const STORAGE_KEY_PLANO = 'senecurare_plano_ativo'
export const STORAGE_KEY_ASSINATURA = 'senecurare_assinatura'
export const STORAGE_KEY_VITALICIO = 'senecurare_plano_vitalicio'
export const STORAGE_KEY_VITALICIO_MOTIVO = 'senecurare_plano_vitalicio_motivo'

export type StatusAssinatura = 'ativo' | 'inativo' | 'vencido' | 'cancelado' | 'vitalicio'

export interface CobrancaRecorrente {
  id: string
  data: string // ISO string
  valor: number
  metodo: 'pix' | 'cartao'
  status: 'pago' | 'pendente' | 'vencido' | 'falha'
  descricao: string
  comprovante?: string
  pixCopiaECola?: string
}

export interface AssinaturaILPI {
  id: string
  planoId: PlanoId
  status: StatusAssinatura
  ciclo: 'mensal' | 'anual'
  valorMensal: number
  metodo: 'pix' | 'cartao'
  dataInicio: string // ISO
  proximaCobranca: string // ISO
  ultimoPagamentoEm: string // ISO
  canceladoEm?: string | null
  cartao?: {
    ultimosDigitos: string
    titular: string
    validade: string
  }
  cobrancas: CobrancaRecorrente[]
}

export const EMAILS_DEMO_HOMOLOGADOS = [
  's1@ilpi.demo',
  's5@ilpi.demo',
  's9@ilpi.demo',
  's10@ilpi.demo',
]

/**
 * Verifica se um email pertence a uma conta de demonstração/homologação
 */
export function isEmailDemo(email?: string | null): boolean {
  if (!email) return false
  const e = email.toLowerCase().trim()
  return (
    e.endsWith('@ilpi.demo') ||
    e.includes('.demo') ||
    e.includes('demo@') ||
    e.includes('teste@') ||
    EMAILS_DEMO_HOMOLOGADOS.includes(e)
  )
}

/**
 * Retorna true se a instituição possui licença vitalícia ativa
 */
export function isPlanoVitalicio(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const salvo = localStorage.getItem(STORAGE_KEY_VITALICIO)
    if (salvo !== null) {
      return salvo === 'true'
    }
    return false
  } catch {
    return false
  }
}

/**
 * Ativa o Plano Vitalício permanente (Enterprise por padrão)
 */
export function ativarPlanoVitalicio(
  plano: PlanoId = 'enterprise',
  motivo: string = 'Demonstração Homologada & Acesso Vitalício',
): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_PLANO, plano)
    localStorage.setItem(STORAGE_KEY_VITALICIO, 'true')
    localStorage.setItem(STORAGE_KEY_VITALICIO_MOTIVO, motivo)
    window.dispatchEvent(
      new CustomEvent('senecurare_plano_alterado', {
        detail: { plano, vitalicio: true, motivo },
      }),
    )
  } catch (err) {
    console.error('Erro ao ativar plano vitalício:', err)
  }
}

/**
 * Desativa a flag de vitalício (caso o usuário queira simular ambiente comercial padrão)
 */
export function desativarPlanoVitalicio(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_VITALICIO, 'false')
    window.dispatchEvent(new CustomEvent('senecurare_plano_alterado', { detail: obterPlanoAtivo() }))
  } catch (err) {
    console.error('Erro ao desativar plano vitalício:', err)
  }
}

/**
 * Obtém a assinatura recorrente atual
 */
export function obterAssinatura(): AssinaturaILPI | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASSINATURA)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Salva a assinatura e notifica os ouvintes da aplicação
 */
export function salvarAssinatura(assinatura: AssinaturaILPI): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_ASSINATURA, JSON.stringify(assinatura))
    if (assinatura.status === 'ativo' || assinatura.status === 'vitalicio') {
      localStorage.setItem(STORAGE_KEY_PLANO, assinatura.planoId)
    }
    window.dispatchEvent(new CustomEvent('senecurare_assinatura_alterada', { detail: assinatura }))
    window.dispatchEvent(new CustomEvent('senecurare_plano_alterado', { detail: assinatura.planoId }))
  } catch (err) {
    console.error('Erro ao salvar assinatura:', err)
  }
}

/**
 * Verifica se a assinatura atual é válida e está com pagamentos regulares
 */
export function isAssinaturaValida(): boolean {
  if (isPlanoVitalicio()) return true

  const assinatura = obterAssinatura()
  if (!assinatura) {
    // Se não há assinatura estruturada registrada, verifica se há plano salvo diretamente
    const salvo = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_PLANO) : null
    return Boolean(salvo && PLANOS[salvo as PlanoId])
  }

  if (assinatura.status === 'inativo' || assinatura.status === 'vencido') {
    return false
  }

  if (assinatura.status === 'cancelado') {
    return new Date() <= new Date(assinatura.proximaCobranca)
  }

  return assinatura.status === 'ativo'
}

/**
 * Cria ou renova a assinatura recorrente
 */
export function criarOuRenovarAssinatura(
  planoId: PlanoId,
  metodo: 'pix' | 'cartao',
  ciclo: 'mensal' | 'anual' = 'mensal',
  dadosCartao?: {
    numero?: string
    titular?: string
    validade?: string
    ultimosDigitos?: string
  }
): AssinaturaILPI {
  const agora = new Date()
  const plano = PLANOS[planoId]
  const valor = ciclo === 'anual' ? plano.precoAnualMensal : plano.precoMensal

  const proxima = new Date(agora)
  if (ciclo === 'anual') {
    proxima.setFullYear(proxima.getFullYear() + 1)
  } else {
    proxima.setDate(proxima.getDate() + 30)
  }

  const cobrancaInicial: CobrancaRecorrente = {
    id: `cob_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    data: agora.toISOString(),
    valor,
    metodo,
    status: 'pago',
    descricao: `Assinatura ${plano.nome} (${ciclo === 'anual' ? 'Compromisso Anual' : 'Cobrança Mensal'}) - 1ª Mensalidade`,
    comprovante: `COMP-${metodo === 'pix' ? 'PIX' : 'CARD'}-${Date.now().toString(36).toUpperCase()}`,
  }

  const novaAssinatura: AssinaturaILPI = {
    id: `sub_${Date.now()}`,
    planoId,
    status: 'ativo',
    ciclo,
    valorMensal: valor,
    metodo,
    dataInicio: agora.toISOString(),
    proximaCobranca: proxima.toISOString(),
    ultimoPagamentoEm: agora.toISOString(),
    cartao:
      metodo === 'cartao' && dadosCartao
        ? {
            ultimosDigitos:
              dadosCartao.ultimosDigitos ||
              (dadosCartao.numero || '').replace(/\D/g, '').slice(-4) ||
              '4242',
            titular: dadosCartao.titular || 'CLIENTE ILPI',
            validade: dadosCartao.validade || '12/28',
          }
        : undefined,
    cobrancas: [cobrancaInicial],
  }

  salvarAssinatura(novaAssinatura)
  definirPlanoAtivo(planoId)
  return novaAssinatura
}

/**
 * Processador de cobranças recorrentes automáticas
 */
export function processarCobrancaRecorrente(): {
  executou: boolean
  status: StatusAssinatura
  mensagem: string
} {
  if (isPlanoVitalicio()) {
    return { executou: false, status: 'vitalicio', mensagem: 'Licença vitalícia ativa' }
  }

  const assinatura = obterAssinatura()
  if (!assinatura) {
    return { executou: false, status: 'inativo', mensagem: 'Nenhuma assinatura registrada' }
  }

  const agora = new Date()
  const dataProxima = new Date(assinatura.proximaCobranca)

  // Assinatura cancelada
  if (assinatura.status === 'cancelado') {
    if (agora > dataProxima) {
      assinatura.status = 'inativo'
      salvarAssinatura(assinatura)
      return { executou: true, status: 'inativo', mensagem: 'Período pago expirado. Acesso aos recursos suspensos.' }
    }
    return { executou: false, status: 'cancelado', mensagem: 'Assinatura cancelada, acesso válido até o fim do ciclo pago.' }
  }

  // Ainda não atingiu a data de cobrança
  if (agora < dataProxima) {
    return { executou: false, status: assinatura.status, mensagem: 'Cobrança mensal em dia.' }
  }

  // A data de cobrança chegou!
  if (assinatura.metodo === 'cartao') {
    // Débito automático mensal no cartão de crédito
    const plano = PLANOS[assinatura.planoId]
    const valor = assinatura.ciclo === 'anual' ? plano.precoAnualMensal : plano.precoMensal
    const novaProxima = new Date(agora)
    novaProxima.setDate(novaProxima.getDate() + 30)

    const novaCobranca: CobrancaRecorrente = {
      id: `cob_rec_${Date.now()}`,
      data: agora.toISOString(),
      valor,
      metodo: 'cartao',
      status: 'pago',
      descricao: `Débito Automático Mensal - ${plano.nome} (Cartão final ${assinatura.cartao?.ultimosDigitos || '••••'})`,
      comprovante: `AUTODEP-${Date.now().toString(36).toUpperCase()}`,
    }

    assinatura.proximaCobranca = novaProxima.toISOString()
    assinatura.ultimoPagamentoEm = agora.toISOString()
    assinatura.status = 'ativo'
    assinatura.cobrancas.unshift(novaCobranca)
    salvarAssinatura(assinatura)

    return {
      executou: true,
      status: 'ativo',
      mensagem: `Débito automático mensal de R$ ${valor.toFixed(2)} processado no cartão.`,
    }
  }

  // Método PIX: verificar tolerância de 3 dias
  const diasAtraso = Math.floor((agora.getTime() - dataProxima.getTime()) / (1000 * 60 * 60 * 24))
  if (diasAtraso > 3) {
    assinatura.status = 'vencido'
    salvarAssinatura(assinatura)
    return {
      executou: true,
      status: 'vencido',
      mensagem: 'Fatura mensal de PIX vencida. Acesso às funcionalidades suspenso.',
    }
  }

  return {
    executou: false,
    status: assinatura.status,
    mensagem: 'Fatura de renovação mensal via PIX aguardando quitação.',
  }
}

/**
 * Cancela a assinatura recorrente
 */
export function cancelarAssinatura(): void {
  const assinatura = obterAssinatura()
  if (!assinatura) return
  assinatura.status = 'cancelado'
  assinatura.canceladoEm = new Date().toISOString()
  salvarAssinatura(assinatura)
}

/**
 * Reativa a assinatura
 */
export function reativarAssinatura(): void {
  const assinatura = obterAssinatura()
  if (!assinatura) return
  assinatura.status = 'ativo'
  assinatura.canceladoEm = null
  salvarAssinatura(assinatura)
}

/**
 * Simula o avanço do ciclo mensal para fins de testes e homologação
 */
export function simularAvancoCicloMensal(): { cobranca: CobrancaRecorrente; novaData: string } | null {
  const assinatura = obterAssinatura()
  if (!assinatura) return null

  const agora = new Date()
  const plano = PLANOS[assinatura.planoId]
  const valor = assinatura.ciclo === 'anual' ? plano.precoAnualMensal : plano.precoMensal
  const novaProxima = new Date(agora)
  novaProxima.setDate(novaProxima.getDate() + 30)

  const novaCobranca: CobrancaRecorrente = {
    id: `cob_sim_${Date.now()}`,
    data: agora.toISOString(),
    valor,
    metodo: assinatura.metodo,
    status: 'pago',
    descricao: `Cobrança Recorrente Mensal - ${plano.nome}`,
    comprovante: `SIM-${Date.now().toString(36).toUpperCase()}`,
  }

  assinatura.proximaCobranca = novaProxima.toISOString()
  assinatura.ultimoPagamentoEm = agora.toISOString()
  assinatura.status = 'ativo'
  assinatura.cobrancas.unshift(novaCobranca)
  salvarAssinatura(assinatura)

  return { cobranca: novaCobranca, novaData: novaProxima.toISOString() }
}

/**
 * Retorna o plano atualmente ativo da instituição
 */
export function obterPlanoAtivo(): PlanoId {
  if (typeof window === 'undefined') return 'clinico'
  try {
    const assinatura = obterAssinatura()
    if (assinatura && (assinatura.status === 'ativo' || assinatura.status === 'vitalicio')) {
      return assinatura.planoId
    }

    const salvo = localStorage.getItem(STORAGE_KEY_PLANO) as PlanoId | null
    if (salvo && PLANOS[salvo]) return salvo

    if (isPlanoVitalicio()) {
      return 'enterprise'
    }

    return 'clinico'
  } catch {
    return 'clinico'
  }
}

/**
 * Define o plano ativo e notifica os componentes
 */
export function definirPlanoAtivo(plano: PlanoId): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_PLANO, plano)
    const assinatura = obterAssinatura()
    if (assinatura) {
      assinatura.planoId = plano
      salvarAssinatura(assinatura)
    }
    window.dispatchEvent(new CustomEvent('senecurare_plano_alterado', { detail: plano }))
  } catch (err) {
    console.error('Erro ao salvar plano:', err)
  }
}

/**
 * Verifica se um recurso está liberado no plano
 */
export function isFeatureDisponivel(feature: FeatureKey, planoAtual?: PlanoId): boolean {
  // Se passou planoAtual explicitamente (usado em verificações parametrizadas):
  if (planoAtual) {
    const nivelAtual = PLANO_HIERARQUIA[planoAtual] || 1
    const planoMinimo = RECURSO_PLANO_MINIMO[feature]
    const nivelMinimo = PLANO_HIERARQUIA[planoMinimo] || 1
    return nivelAtual >= nivelMinimo
  }

  // Contas com plano vitalício têm 100% dos recursos liberados
  if (isPlanoVitalicio()) {
    return true
  }

  // Sem assinatura ativa válida (ex: suspensa, vencida ou inativa) -> SEM ACESSO!
  if (!isAssinaturaValida()) {
    return false
  }

  const plano = obterPlanoAtivo()
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
  // Contas com plano vitalício têm residentes ilimitados
  if (!planoAtual && isPlanoVitalicio()) {
    const plano = PLANOS.enterprise
    return { atingiu: false, limite: 99999, restantes: 99999, plano }
  }

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

/**
 * Helper para ativar o plano vitalício para usuários demo
 */
export function verificarEAtivarDemoVitalicio(email?: string | null): boolean {
  if (isEmailDemo(email)) {
    ativarPlanoVitalicio('enterprise', `Demonstração Homologada (${email})`)
    return true
  }
  return false
}
