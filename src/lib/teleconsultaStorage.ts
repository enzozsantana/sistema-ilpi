import type {
  BloqueioAgenda,
  ConfiguracaoAgendaProfissional,
  ConsultaVirtual,
  DisponibilidadeSemanal,
  ProfissionalVirtual,
  SlotHorarioAgenda,
} from '../types/teleconsulta'
import { VALORES_PADRAO_CONSULTA } from '../types/teleconsulta'

export const PROFISSIONAIS_VIRTUAIS: ProfissionalVirtual[] = [
  {
    id: 'prof_dra_juliana',
    nome: 'Dra. Juliana Mendes',
    titulo: 'Médica Geriatra & Clínica Geral',
    especialidade: 'medica',
    especialidadeLabel: VALORES_PADRAO_CONSULTA.medica.rotulo,
    registro: 'CRM-SP 184.290 · RQE 92.104',
    clinica: 'Clínica Longevidade Ativa & Cuidados Integrados',
    foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    preco: VALORES_PADRAO_CONSULTA.medica.valor, // R$ 240,00
    duracaoMin: VALORES_PADRAO_CONSULTA.medica.duracaoMin,
    bio: 'Especialista em geriatria clínica pela SBGG e USP. Foco em polifarmácia, desprescrição, declínio cognitivo e acolhimento clínico de residentes em ILPIs.',
    diasAtendimento: [1, 3, 5], // Seg, Qua, Sex
    horariosPadrao: ['08:30', '10:00', '11:15', '14:00', '15:30', '17:00'],
  },
  {
    id: 'prof_enf_patricia',
    nome: 'Enfª. Patrícia Alencar',
    titulo: 'Enfermeira Estomaterapeuta (SOBEST)',
    especialidade: 'estomaterapia',
    especialidadeLabel: VALORES_PADRAO_CONSULTA.estomaterapia.rotulo,
    registro: 'COREN-SP 245.890 · Esp. Estomaterapia',
    clinica: 'Centro Avançado de Pele, Lesões e Estomas',
    foto: 'https://images.unsplash.com/photo-1594824813572-c0cb490ad01f?auto=format&fit=crop&q=80&w=300',
    preco: VALORES_PADRAO_CONSULTA.estomaterapia.valor, // R$ 180,00
    duracaoMin: VALORES_PADRAO_CONSULTA.estomaterapia.duracaoMin,
    bio: 'Membro titular da Associação Brasileira de Estomaterapia (SOBEST). Avaliação remota e prescrição de coberturas especiais para LPP (escaras), dermatites e estomas.',
    diasAtendimento: [2, 4, 6], // Ter, Qui, Sab
    horariosPadrao: ['09:00', '10:30', '13:30', '15:00', '16:30'],
  },
  {
    id: 'prof_nutr_camila',
    nome: 'Nutr. Camila Bittencourt',
    titulo: 'Nutricionista Clínica & Geriátrica',
    especialidade: 'nutricao',
    especialidadeLabel: VALORES_PADRAO_CONSULTA.nutricao.rotulo,
    registro: 'CRN-3 48.910',
    clinica: 'Instituto NutriSênior de Terapia Nutricional',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    preco: VALORES_PADRAO_CONSULTA.nutricao.valor, // R$ 160,00
    duracaoMin: VALORES_PADRAO_CONSULTA.nutricao.duracaoMin,
    bio: 'Pós-graduada em Nutrição no Envelhecimento. Ajuste de consistência para disfagia, plano para recuperação de peso, sarcopenia e prescrição de suplementos proteicos.',
    diasAtendimento: [1, 2, 4], // Seg, Ter, Qui
    horariosPadrao: ['08:00', '09:30', '11:00', '14:00', '16:00'],
  },
  {
    id: 'prof_psic_felipe',
    nome: 'Psic. Felipe Vasconcelos',
    titulo: 'Psicólogo Clínico & Neuropsicólogo',
    especialidade: 'psicologia',
    especialidadeLabel: VALORES_PADRAO_CONSULTA.psicologia.rotulo,
    registro: 'CRP 06/132.450',
    clinica: 'Espaço Viver Bem — Neurogerontologia',
    foto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    preco: VALORES_PADRAO_CONSULTA.psicologia.valor, // R$ 140,00
    duracaoMin: VALORES_PADRAO_CONSULTA.psicologia.duracaoMin,
    bio: 'Mestre em Neurociências e Comportamento. Apoio psicológico para residentes em adaptação institucional, manejo de sintomas comportamentais na demência e acolhimento familiar.',
    diasAtendimento: [2, 3, 5], // Ter, Qua, Sex
    horariosPadrao: ['09:00', '10:30', '14:00', '15:30', '17:00'],
  },
  {
    id: 'prof_fisio_marcelo',
    nome: 'Dr. Marcelo Rezende',
    titulo: 'Fisioterapeuta Geriátrico & Reabilitação',
    especialidade: 'fisioterapia',
    especialidadeLabel: VALORES_PADRAO_CONSULTA.fisioterapia.rotulo,
    registro: 'CREFITO-3 92.140-F',
    clinica: 'ReabSenior Reabilitação & Mobilidade Funcional',
    foto: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    preco: VALORES_PADRAO_CONSULTA.fisioterapia.valor, // R$ 130,00
    duracaoMin: VALORES_PADRAO_CONSULTA.fisioterapia.duracaoMin,
    bio: 'Especialista em fisioterapia motora e funcional geriátrica. Prevenção de quedas, plano de marcha assistida, treino respiratório e ergonomia para cuidadores.',
    diasAtendimento: [1, 3, 4], // Seg, Qua, Qui
    horariosPadrao: ['08:00', '09:30', '11:00', '14:30', '16:00'],
  },
]

const PROFS_STORAGE_KEY = 'senecurare_profissionais_virtuais'

export function obterProfissionaisVirtuais(): ProfissionalVirtual[] {
  if (typeof window === 'undefined') return PROFISSIONAIS_VIRTUAIS
  try {
    const raw = localStorage.getItem(PROFS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(PROFS_STORAGE_KEY, JSON.stringify(PROFISSIONAIS_VIRTUAIS))
      return PROFISSIONAIS_VIRTUAIS
    }
    const lista = JSON.parse(raw) as ProfissionalVirtual[]
    // Garante que os profissionais demo estejam presentes
    const ids = new Set(lista.map((p) => p.id))
    PROFISSIONAIS_VIRTUAIS.forEach((p) => {
      if (!ids.has(p.id)) lista.push(p)
    })
    return lista
  } catch {
    return PROFISSIONAIS_VIRTUAIS
  }
}

export function salvarProfissionalVirtual(novo: ProfissionalVirtual): void {
  if (typeof window === 'undefined') return
  try {
    const lista = obterProfissionaisVirtuais()
    const idx = lista.findIndex((p) => p.id === novo.id || (novo.email && p.email === novo.email))
    if (idx >= 0) {
      lista[idx] = { ...lista[idx], ...novo }
    } else {
      lista.unshift(novo)
    }
    localStorage.setItem(PROFS_STORAGE_KEY, JSON.stringify(lista))
  } catch (err) {
    console.error('Erro ao salvar profissional virtual:', err)
  }
}

const STORAGE_KEY = 'ilpi_consultas_virtuais'

// Provedor WebRTC P2P que permite incorporação segura em iframe sem bloqueio de moderação e sem 'conexão recusada'
export const WEBRTC_ROOM_BASE = 'https://p2p.mirotalk.com/join'
export const JITSI_ROOM_BASE = 'https://meet.jit.si'

/**
 * Constrói os parâmetros de URL hash para configurar o Jitsi Meet em PT-BR
 */
export function buildJitsiConfigHash(displayName?: string): string {
  const nome = displayName && displayName.trim() ? displayName.trim() : 'Participante'
  const params = [
    'config.defaultLanguage="ptBR"',
    'config.lang="ptBR"',
    'interfaceConfig.LANG_DETECTION=false',
    `userInfo.displayName="${nome}"`,
    'config.prejoinPageEnabled=false',
    'config.prejoinConfig.enabled=false',
    'config.requireDisplayName=false',
    'config.disableDeepLinking=true',
    'config.enableWelcomePage=false',
    'config.startWithAudioMuted=false',
    'config.startWithVideoMuted=false',
  ]

  return `#${params
    .map((p) => {
      const idx = p.indexOf('=')
      const k = p.slice(0, idx)
      const v = p.slice(idx + 1)
      return `${k}=${encodeURIComponent(v)}`
    })
    .join('&')}`
}

export function gerarLinkSalaJitsi(codigoSala: string, displayName?: string): string {
  const nomeParam = displayName ? `?name=${encodeURIComponent(displayName)}` : ''
  return `${WEBRTC_ROOM_BASE}/${codigoSala}${nomeParam}`
}

export function buildJitsiUrl(
  linkBase: string,
  displayName?: string,
  _options?: { audioMuted?: boolean; videoMuted?: boolean }
): string {
  const partes = linkBase.split('?')[0].split('#')[0].split('/')
  const codigoSala = partes[partes.length - 1] || 'senecurare-teleconsulta'
  const nomeFinal = displayName && displayName.trim() ? displayName.trim() : 'Participante'
  return `${WEBRTC_ROOM_BASE}/${codigoSala}?name=${encodeURIComponent(nomeFinal)}`
}

export function gerarLinkExternoJitsi(codigoSala: string, displayName?: string): string {
  return `${JITSI_ROOM_BASE}/${codigoSala}${buildJitsiConfigHash(displayName)}`
}

export function obterConsultasVirtuais(): ConsultaVirtual[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // Cria consultas iniciais de demonstração
      const iniciais: ConsultaVirtual[] = [
        {
          id: 'cv_exemplo_1',
          profissionalId: 'prof_dra_juliana',
          profissionalNome: 'Dra. Juliana Mendes',
          especialidade: 'Medicina Geriátrica',
          registro: 'CRM-SP 184.290',
          clinica: 'Clínica Longevidade Ativa & Cuidados Integrados',
          residenteId: 'r1',
          residenteNome: 'Sebastião Arruda',
          data: new Date().toISOString().split('T')[0],
          horario: '14:00',
          valor: 240,
          metodoPagamento: 'pix',
          pago: true,
          linkSala: gerarLinkSalaJitsi('senecurare-teleconsulta-arruda-14h'),
          codigoSala: 'senecurare-teleconsulta-arruda-14h',
          status: 'confirmada',
          motivo: 'Revisão periódica de polifarmácia e ajuste de anti-hipertensivo.',
          criadoEm: new Date().toISOString(),
        },
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(iniciais))
      return iniciais
    }
    const parsed = JSON.parse(raw) as ConsultaVirtual[]
    // Garante que links existentes sempre recebam os parâmetros e hashes em PT-BR
    return parsed.map((c) => ({
      ...c,
      linkSala: gerarLinkSalaJitsi(c.codigoSala || 'senecurare-teleconsulta'),
    }))
  } catch {
    return []
  }
}

export function salvarConsultaVirtual(consulta: ConsultaVirtual): void {
  if (typeof window === 'undefined') return
  try {
    const lista = obterConsultasVirtuais()
    const index = lista.findIndex((c) => c.id === consulta.id)
    if (index >= 0) {
      lista[index] = consulta
    } else {
      lista.unshift(consulta)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
  } catch (e) {
    console.error('Erro ao salvar teleconsulta:', e)
  }
}

export function atualizarStatusConsulta(id: string, status: ConsultaVirtual['status']): void {
  if (typeof window === 'undefined') return
  try {
    const lista = obterConsultasVirtuais()
    const item = lista.find((c) => c.id === id)
    if (item) {
      item.status = status
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
    }
  } catch (e) {
    console.error('Erro ao atualizar status:', e)
  }
}

export function marcarEvolucaoConsulta(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const lista = obterConsultasVirtuais()
    const item = lista.find((c) => c.id === id)
    if (item) {
      item.evolucaoRealizada = true
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
    }
  } catch (e) {
    console.error('Erro ao marcar evolução:', e)
  }
}

// -------------------------------------------------------------
// GESTÃO DE AGENDA, DISPONIBILIDADE E BLOQUEIOS DE TELECONSULTA
// -------------------------------------------------------------

const AGENDA_CONFIG_PREFIX = 'senecurare_agenda_config_'
const AGENDA_BLOQUEIOS_KEY = 'senecurare_agenda_bloqueios'

export const DIAS_SEMANA_NOMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

/**
 * Cria a configuração inicial de disponibilidade semanal de um profissional
 */
export function gerarConfiguracaoAgendaPadrao(prof: ProfissionalVirtual): ConfiguracaoAgendaProfissional {
  const diasAtendimento = new Set(prof.diasAtendimento || [1, 2, 3, 4, 5])
  const diasSemana: DisponibilidadeSemanal[] = [0, 1, 2, 3, 4, 5, 6].map((dia) => {
    const ativo = diasAtendimento.has(dia)
    return {
      diaSemana: dia,
      ativo,
      inicio: '08:00',
      fim: '18:00',
      intervaloInicio: '12:00',
      intervaloFim: '13:00',
      horarios: ativo ? [...(prof.horariosPadrao || ['08:30', '10:00', '14:00', '15:30', '17:00'])] : [],
    }
  })

  return {
    profissionalId: prof.id,
    duracaoSlotMin: prof.duracaoMin || 45,
    intervaloEntreSlotsMin: 15,
    diasSemana,
    bloqueios: [],
    limiteDiario: 10,
    aceitaEncaixe: true,
  }
}

/**
 * Obtém a configuração de agenda do profissional
 */
export function obterConfiguracaoAgenda(profissionalId: string): ConfiguracaoAgendaProfissional {
  const profs = obterProfissionaisVirtuais()
  const prof = profs.find((p) => p.id === profissionalId) || profs[0]

  if (typeof window === 'undefined') {
    return gerarConfiguracaoAgendaPadrao(prof)
  }

  try {
    const raw = localStorage.getItem(`${AGENDA_CONFIG_PREFIX}${profissionalId}`)
    if (raw) {
      const parsed = JSON.parse(raw) as ConfiguracaoAgendaProfissional
      // mescla com bloqueios globais
      const bloqueios = obterBloqueiosAgenda(profissionalId)
      return { ...parsed, bloqueios }
    }
  } catch (e) {
    console.error('Erro ao ler configuração de agenda:', e)
  }

  const def = gerarConfiguracaoAgendaPadrao(prof)
  def.bloqueios = obterBloqueiosAgenda(profissionalId)
  return def
}

/**
 * Salva a configuração de agenda do profissional
 */
export function salvarConfiguracaoAgenda(config: ConfiguracaoAgendaProfissional): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${AGENDA_CONFIG_PREFIX}${config.profissionalId}`, JSON.stringify(config))

    // Atualiza também os dias e horários no cadastro do profissional virtual
    const profs = obterProfissionaisVirtuais()
    const prof = profs.find((p) => p.id === config.profissionalId)
    if (prof) {
      prof.diasAtendimento = config.diasSemana.filter((d) => d.ativo).map((d) => d.diaSemana)
      // coleta horários padronizados dos dias ativos
      const horariosGerais = config.diasSemana.find((d) => d.ativo && d.horarios && d.horarios.length > 0)
      if (horariosGerais?.horarios) {
        prof.horariosPadrao = [...horariosGerais.horarios]
      }
      prof.duracaoMin = config.duracaoSlotMin
      salvarProfissionalVirtual(prof)
    }
  } catch (e) {
    console.error('Erro ao salvar configuração de agenda:', e)
  }
}

/**
 * Lista todos os bloqueios de agenda do profissional
 */
export function obterBloqueiosAgenda(profissionalId?: string): BloqueioAgenda[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(AGENDA_BLOQUEIOS_KEY)
    if (!raw) return []
    const todos = JSON.parse(raw) as BloqueioAgenda[]
    if (profissionalId) {
      return todos.filter((b) => b.profissionalId === profissionalId)
    }
    return todos
  } catch {
    return []
  }
}

/**
 * Adiciona um bloqueio de agenda (férias, atestado, feriado, reunião)
 */
export function adicionarBloqueioAgenda(
  bloqueio: Omit<BloqueioAgenda, 'id' | 'criadoEm'>,
): BloqueioAgenda {
  const novo: BloqueioAgenda = {
    ...bloqueio,
    id: `blq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    criadoEm: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      const lista = obterBloqueiosAgenda()
      lista.push(novo)
      localStorage.setItem(AGENDA_BLOQUEIOS_KEY, JSON.stringify(lista))
    } catch (e) {
      console.error('Erro ao salvar bloqueio:', e)
    }
  }

  return novo
}

/**
 * Remove um bloqueio de agenda por ID
 */
export function removerBloqueioAgenda(bloqueioId: string): void {
  if (typeof window === 'undefined') return
  try {
    const lista = obterBloqueiosAgenda()
    const filtrados = lista.filter((b) => b.id !== bloqueioId)
    localStorage.setItem(AGENDA_BLOQUEIOS_KEY, JSON.stringify(filtrados))
  } catch (e) {
    console.error('Erro ao remover bloqueio:', e)
  }
}

/**
 * Gera a grade de horários/slots para um profissional em um dia específico,
 * marcando se está vago, bloqueado ou ocupado por teleconsulta.
 */
export function obterSlotsDia(
  profissionalId: string,
  dataIso: string, // YYYY-MM-DD
  consultasParam?: ConsultaVirtual[],
): SlotHorarioAgenda[] {
  const config = obterConfiguracaoAgenda(profissionalId)
  const bloqueios = obterBloqueiosAgenda(profissionalId).filter((b) => b.data === dataIso)
  const consultas = (consultasParam || obterConsultasVirtuais()).filter(
    (c) =>
      c.profissionalId === profissionalId &&
      c.data === dataIso &&
      c.status !== 'cancelada',
  )

  // Determina dia da semana a partir da data (evitando problema de timezone)
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  const dataObj = new Date(ano, mes - 1, dia)
  const diaSemana = dataObj.getDay()

  const regraDia = config.diasSemana.find((d) => d.diaSemana === diaSemana)

  // Se o profissional não atende normalmente neste dia da semana
  if (!regraDia || !regraDia.ativo) {
    // Se houver consultas marcadas para o dia (ex: plantão ou encaixe), exibe-as
    if (consultas.length > 0) {
      return consultas
        .map((c) => ({
          horario: c.horario,
          disponivel: false,
          consulta: c,
        }))
        .sort((a, b) => a.horario.localeCompare(b.horario))
    }
    return []
  }

  // Monta lista de horários base
  let horariosBase = regraDia.horarios && regraDia.horarios.length > 0
    ? [...regraDia.horarios]
    : []

  if (horariosBase.length === 0) {
    // Gera horários baseados no início, fim e duração
    const inicioStr = regraDia.inicio || '08:00'
    const fimStr = regraDia.fim || '18:00'
    const [hIni, mIni] = inicioStr.split(':').map(Number)
    const [hFim, mFim] = fimStr.split(':').map(Number)

    let minutoAtual = hIni * 60 + mIni
    const minutoLimite = hFim * 60 + mFim
    const passo = (config.duracaoSlotMin || 45) + (config.intervaloEntreSlotsMin || 15)

    while (minutoAtual + (config.duracaoSlotMin || 45) <= minutoLimite) {
      const h = Math.floor(minutoAtual / 60)
      const m = minutoAtual % 60
      const hStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

      // Ignora se cair dentro do intervalo de almoço
      if (regraDia.intervaloInicio && regraDia.intervaloFim) {
        const [hIntIni, mIntIni] = regraDia.intervaloInicio.split(':').map(Number)
        const [hIntFim, mIntFim] = regraDia.intervaloFim.split(':').map(Number)
        const minIntIni = hIntIni * 60 + mIntIni
        const minIntFim = hIntFim * 60 + mIntFim
        if (minutoAtual >= minIntIni && minutoAtual < minIntFim) {
          minutoAtual += passo
          continue
        }
      }

      horariosBase.push(hStr)
      minutoAtual += passo
    }
  }

  // Inclui horários de consultas existentes que possam ter sido encaixes
  consultas.forEach((c) => {
    if (!horariosBase.includes(c.horario)) {
      horariosBase.push(c.horario)
    }
  })

  // Ordena horários cronologicamente
  horariosBase.sort((a, b) => a.localeCompare(b))

  // Verifica se o dia inteiro está bloqueado
  const bloqueioDiaInteiro = bloqueios.find((b) => b.diaInteiro || (!b.horarioInicio && !b.horarioFim))

  return horariosBase.map((horario) => {
    // 1. Verifica se há consulta marcada
    const consulta = consultas.find((c) => c.horario === horario)
    if (consulta) {
      return {
        horario,
        disponivel: false,
        consulta,
      }
    }

    // 2. Verifica se o dia inteiro está bloqueado
    if (bloqueioDiaInteiro) {
      return {
        horario,
        disponivel: false,
        bloqueado: true,
        motivoBloqueio: bloqueioDiaInteiro.motivo || 'Data bloqueada pelo profissional',
      }
    }

    // 3. Verifica bloqueio parcial de horário
    const bloqueioHorario = bloqueios.find((b) => {
      if (!b.horarioInicio || !b.horarioFim) return false
      return horario >= b.horarioInicio && horario < b.horarioFim
    })

    if (bloqueioHorario) {
      return {
        horario,
        disponivel: false,
        bloqueado: true,
        motivoBloqueio: bloqueioHorario.motivo || 'Horário bloqueado',
      }
    }

    return {
      horario,
      disponivel: true,
    }
  })
}

/**
 * Reagenda uma teleconsulta existente para nova data e horário
 */
export function reagendarConsulta(
  consultaId: string,
  novaData: string,
  novoHorario: string,
): boolean {
  if (typeof window === 'undefined') return false
  try {
    const lista = obterConsultasVirtuais()
    const idx = lista.findIndex((c) => c.id === consultaId)
    if (idx === -1) return false

    const consulta = lista[idx]
    const historico = consulta.historicoReagendamentos || []
    historico.push({
      dataAnterior: consulta.data,
      horarioAnterior: consulta.horario,
      dataAlteracao: new Date().toISOString(),
    })

    lista[idx] = {
      ...consulta,
      data: novaData,
      horario: novoHorario,
      status: 'confirmada',
      reagendadaDe: `${consulta.data} às ${consulta.horario}`,
      historicoReagendamentos: historico,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
    return true
  } catch (e) {
    console.error('Erro ao reagendar teleconsulta:', e)
    return false
  }
}

/**
 * Cancela uma teleconsulta com justificativa clínica/operacional registrada
 */
export function cancelarConsultaComJustificativa(
  consultaId: string,
  motivoCancelamento: string,
): boolean {
  if (typeof window === 'undefined') return false
  try {
    const lista = obterConsultasVirtuais()
    const idx = lista.findIndex((c) => c.id === consultaId)
    if (idx === -1) return false

    lista[idx] = {
      ...lista[idx],
      status: 'cancelada',
      motivoCancelamento: motivoCancelamento.trim(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
    return true
  } catch (e) {
    console.error('Erro ao cancelar teleconsulta:', e)
    return false
  }
}

/**
 * Salva anotações pré-consulta ou orientações adicionais
 */
export function salvarNotasConsulta(consultaId: string, notas: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const lista = obterConsultasVirtuais()
    const idx = lista.findIndex((c) => c.id === consultaId)
    if (idx === -1) return false

    lista[idx] = {
      ...lista[idx],
      notasPreConsulta: notas.trim(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
    return true
  } catch (e) {
    console.error('Erro ao salvar notas de teleconsulta:', e)
    return false
  }
}
