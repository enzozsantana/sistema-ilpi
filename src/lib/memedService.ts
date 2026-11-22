import type { Residente } from '../types/ilpi'

export interface MemedConfig {
  partnerKey: string
  doctorToken?: string
  ambiente: 'sandbox' | 'producao'
  ativo: boolean
}

export interface ReceitaDigitalMemed {
  id: string
  residenteId: string
  prescricaoId?: string
  urlReceita?: string
  codigoValidacao?: string
  data: string
  hora: string
  prescritorNome?: string
  prescritorConselho?: string
  medicamentosResumo?: string
  tipo: 'memed' | 'cfm' | 'outro'
}

const STORAGE_KEY_CONFIG = 'ilpi_memed_config'
const STORAGE_KEY_RECEITAS_PREFIX = 'ilpi_receitas_digitais_'

export function obterConfigMemed(): MemedConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        partnerKey: parsed.partnerKey || (import.meta.env.VITE_MEMED_PARTNER_KEY as string) || '',
        doctorToken: parsed.doctorToken || '',
        ambiente: parsed.ambiente === 'producao' ? 'producao' : 'sandbox',
        ativo: Boolean(parsed.ativo || parsed.partnerKey),
      }
    }
  } catch {
    // fallback
  }

  const envKey = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_MEMED_PARTNER_KEY as string)) || ''
  return {
    partnerKey: envKey,
    doctorToken: '',
    ambiente: 'sandbox',
    ativo: Boolean(envKey),
  }
}

export function salvarConfigMemed(config: Partial<MemedConfig>): void {
  try {
    const atual = obterConfigMemed()
    const nova: MemedConfig = {
      ...atual,
      ...config,
      ativo: Boolean(config.partnerKey ?? atual.partnerKey),
    }
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(nova))
  } catch (err) {
    console.error('Erro ao salvar configuração do Memed:', err)
  }
}

export function prepararDadosPacienteMemed(residente: Residente) {
  const cpfRaw = (residente as any).cpf
  const contatoRaw = (residente as any).contato
  return {
    nome: residente.nome,
    cpf: cpfRaw ? String(cpfRaw).replace(/\D/g, '') : '',
    data_nascimento: residente.nasc || '',
    telefone: contatoRaw ? String(contatoRaw) : '',
    alergias: residente.alergias || '',
    quarto: residente.quarto || '',
    convenio: (residente as any).convenio || 'Particular',
  }
}

export function gerarTextoCopiaPrescricao(residente: Residente, medicamentosPrescritos?: any[]): string {
  const meds = Array.isArray(medicamentosPrescritos) ? medicamentosPrescritos : (residente.presc || [])
  const vigentes = meds.filter((p: any) => !p.suspensa)

  const linhasMeds = vigentes.length > 0
    ? vigentes.map((m: any, idx: number) => {
        const nomeDose = m.med || m.nome || 'Medicamento'
        const posol = m.posologia || (m.horarios?.length ? `Horários: ${m.horarios.join(', ')}` : 'Conforme prescrição')
        const via = m.via ? ` (${m.via})` : ''
        return `${idx + 1}. ${nomeDose}${via} — ${posol}`
      }).join('\n')
    : 'Nenhum medicamento ativo registrado.'

  return `========================================
DADOS DO PACIENTE PARA PRESCRIÇÃO DIGITAL
========================================
Nome: ${residente.nome}
Nascimento: ${residente.nasc || 'Não informado'}
CPF: ${residente.cpf || 'Não informado'}
Contato / ILPI: ${residente.contato || 'Não informado'}
Acomodação: Quarto ${residente.quarto || '–'}
Alergias Relatadas: ${residente.alergias || 'Nenhuma alergia conhecida'}

MEDICAMENTOS ATIVOS (ILPI):
${linhasMeds}
========================================`
}

export function obterReceitasDigitaisLocais(residenteId: string): ReceitaDigitalMemed[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_RECEITAS_PREFIX}${residenteId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function salvarReceitaDigitalLocal(residenteId: string, receita: ReceitaDigitalMemed): void {
  try {
    const lista = obterReceitasDigitaisLocais(residenteId)
    const semEssa = lista.filter((r) => r.id !== receita.id)
    const atualizada = [receita, ...semEssa]
    localStorage.setItem(`${STORAGE_KEY_RECEITAS_PREFIX}${residenteId}`, JSON.stringify(atualizada))
  } catch (err) {
    console.error('Erro ao salvar receita digital local:', err)
  }
}

export function removerReceitaDigitalLocal(residenteId: string, receitaId: string): void {
  try {
    const lista = obterReceitasDigitaisLocais(residenteId)
    const atualizada = lista.filter((r) => r.id !== receitaId)
    localStorage.setItem(`${STORAGE_KEY_RECEITAS_PREFIX}${residenteId}`, JSON.stringify(atualizada))
  } catch (err) {
    console.error('Erro ao remover receita digital:', err)
  }
}

export const LINKS_OFICIAIS_PRESCRICAO = {
  cfmPrescricao: 'https://prescricaoeletronica.cfm.org.br',
  memedWeb: 'https://prescricao.memed.com.br',
  receitaDigital: 'https://receitadigital.com',
  nexodata: 'https://nexodata.com.br',
  memedPortalParceiros: 'https://integrations.memed.com.br',
  validadorIti: 'https://assinaturadigital.iti.gov.br',
} as const

export type TipoPlataformaPrescricao = 'cfm' | 'memed' | 'receita_digital' | 'nexodata'

export interface PlataformaPrescricaoInfo {
  id: TipoPlataformaPrescricao
  nome: string
  subtitulo: string
  url: string
  badge: string
  corBadge: string
}

export const PLATAFORMAS_PRESCRICAO: PlataformaPrescricaoInfo[] = [
  {
    id: 'cfm',
    nome: 'CFM Prescrição Eletrônica',
    subtitulo: 'Portal oficial gratuito do Conselho Federal de Medicina (Login CRM)',
    url: 'https://prescricaoeletronica.cfm.org.br',
    badge: 'Oficial CFM',
    corBadge: 'border-blue-500/50 text-blue-700 bg-blue-500/10',
  },
  {
    id: 'memed',
    nome: 'Memed Prescrição Web',
    subtitulo: 'Plataforma líder · Aceita em 100% das drogarias',
    url: 'https://prescricao.memed.com.br',
    badge: 'Mais Usado',
    corBadge: 'bg-emerald-500/10 text-emerald-700',
  },
  {
    id: 'receita_digital',
    nome: 'Receita Digital',
    subtitulo: 'Plataforma ágil e integrada para telemedicina',
    url: 'https://receitadigital.com',
    badge: 'Telemedicina',
    corBadge: 'border-teal-500/50 text-teal-700 bg-teal-500/10',
  },
  {
    id: 'nexodata',
    nome: 'Nexodata Prescrição',
    subtitulo: 'Forte presença em redes farmacêuticas e hospitais',
    url: 'https://nexodata.com.br',
    badge: 'Redes de Farmácias',
    corBadge: 'border-indigo-500/50 text-indigo-700 bg-indigo-500/10',
  },
]

const STORAGE_KEY_PLATAFORMA_PREFIX = 'ilpi_prescritor_plataforma_'

export function obterPlataformaPreferida(profissionalId?: string): TipoPlataformaPrescricao {
  try {
    const key = `${STORAGE_KEY_PLATAFORMA_PREFIX}${profissionalId || 'padrao'}`
    const salva = localStorage.getItem(key)
    if (salva && ['cfm', 'memed', 'receita_digital', 'nexodata'].includes(salva)) {
      return salva as TipoPlataformaPrescricao
    }
  } catch {
    // fallback
  }
  return 'cfm'
}

export function salvarPlataformaPreferida(plataforma: TipoPlataformaPrescricao, profissionalId?: string): void {
  try {
    const key = `${STORAGE_KEY_PLATAFORMA_PREFIX}${profissionalId || 'padrao'}`
    localStorage.setItem(key, plataforma)
  } catch (err) {
    console.error('Erro ao salvar plataforma preferida:', err)
  }
}
