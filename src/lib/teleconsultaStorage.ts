import type { ConsultaVirtual, ProfissionalVirtual } from '../types/teleconsulta'

export const PROFISSIONAIS_VIRTUAIS: ProfissionalVirtual[] = [
  {
    id: 'prof_dra_juliana',
    nome: 'Dra. Juliana Mendes',
    titulo: 'Médica Geriatra & Clínica Geral',
    especialidade: 'medica',
    especialidadeLabel: 'Medicina Geriátrica',
    registro: 'CRM-SP 184.290 · RQE 92.104',
    clinica: 'Clínica Longevidade Ativa & Cuidados Integrados',
    foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    preco: 220,
    duracaoMin: 45,
    bio: 'Especialista em geriatria clínica pela SBGG e USP. Foco em polifarmácia, desprescrição, declínio cognitivo e acolhimento clínico de residentes em ILPIs.',
    diasAtendimento: [1, 3, 5], // Seg, Qua, Sex
    horariosPadrao: ['08:30', '10:00', '11:15', '14:00', '15:30', '17:00'],
  },
  {
    id: 'prof_enf_patricia',
    nome: 'Enfª. Patrícia Alencar',
    titulo: 'Enfermeira Estomaterapeuta (SOBEST)',
    especialidade: 'estomaterapia',
    especialidadeLabel: 'Estomaterapia & Feridas',
    registro: 'COREN-SP 245.890 · Esp. Estomaterapia',
    clinica: 'Centro Avançado de Pele, Lesões e Estomas',
    foto: 'https://images.unsplash.com/photo-1594824813572-c0cb490ad01f?auto=format&fit=crop&q=80&w=300',
    preco: 160,
    duracaoMin: 45,
    bio: 'Membro titular da Associação Brasileira de Estomaterapia (SOBEST). Avaliação remota e prescrição de coberturas especiais para LPP (escaras), dermatites e estomas.',
    diasAtendimento: [2, 4, 6], // Ter, Qui, Sab
    horariosPadrao: ['09:00', '10:30', '13:30', '15:00', '16:30'],
  },
  {
    id: 'prof_nutr_camila',
    nome: 'Nutr. Camila Bittencourt',
    titulo: 'Nutricionista Clínica & Geriátrica',
    especialidade: 'nutricao',
    especialidadeLabel: 'Nutrição Clínica & Enteral',
    registro: 'CRN-3 48.910',
    clinica: 'Instituto NutriSênior de Terapia Nutricional',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    preco: 150,
    duracaoMin: 40,
    bio: 'Pós-graduada em Nutrição no Envelhecimento. Ajuste de consistência para disfagia, plano para recuperação de peso, sarcopenia e prescrição de suplementos proteicos.',
    diasAtendimento: [1, 2, 4], // Seg, Ter, Qui
    horariosPadrao: ['08:00', '09:30', '11:00', '14:00', '16:00'],
  },
  {
    id: 'prof_psic_felipe',
    nome: 'Psic. Felipe Vasconcelos',
    titulo: 'Psicólogo Clínico & Neuropsicólogo',
    especialidade: 'psicologia',
    especialidadeLabel: 'Psicologia & Neurogerontologia',
    registro: 'CRP 06/132.450',
    clinica: 'Espaço Viver Bem — Neurogerontologia',
    foto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    preco: 170,
    duracaoMin: 50,
    bio: 'Mestre em Neurociências e Comportamento. Apoio psicológico para residentes em adaptação institucional, manejo de sintomas comportamentais na demência e acolhimento familiar.',
    diasAtendimento: [2, 3, 5], // Ter, Qua, Sex
    horariosPadrao: ['09:00', '10:30', '14:00', '15:30', '17:00'],
  },
]

const STORAGE_KEY = 'ilpi_consultas_virtuais'

export function gerarLinkSalaJitsi(codigoSala: string): string {
  // Jitsi Meet é 100% gratuito, open source e não requer login
  return `https://meet.jit.si/${codigoSala}`
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
          valor: 220,
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
    return JSON.parse(raw) as ConsultaVirtual[]
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
