import { fmt, iso } from './dates'
import type { Residente } from '../../types/ilpi'

export type TipoPedido = 'exames' | 'receituario' | 'encaminhamento'

export interface ItemExameDef {
  id: string
  nome: string
  grupo: 'bioquimica' | 'lipideos_metabolismo' | 'urina_fezes' | 'imagem_cardio'
  grupoLabel: string
}

export const GRUPOS_EXAMES = [
  { id: 'bioquimica', label: 'Hematologia & Bioquímica' },
  { id: 'lipideos_metabolismo', label: 'Metabolismo, Vitaminas & Lipídios' },
  { id: 'urina_fezes', label: 'Urina & Fezes' },
  { id: 'imagem_cardio', label: 'Imagem & Cardiorrespiratório' },
] as const

export const EXAMES_PREDEFINIDOS: ItemExameDef[] = [
  // Hematologia & Bioquímica
  { id: 'hemograma', nome: 'Hemograma Completo com Plaquetas', grupo: 'bioquimica', grupoLabel: 'Hematologia & Bioquímica' },
  { id: 'glicemia', nome: 'Glicemia de Jejum', grupo: 'bioquimica', grupoLabel: 'Hematologia & Bioquímica' },
  { id: 'hba1c', nome: 'Hemoglobina Glicada (HbA1c)', grupo: 'bioquimica', grupoLabel: 'Hematologia & Bioquímica' },
  { id: 'ureia', nome: 'Ureia', grupo: 'bioquimica', grupoLabel: 'Hematologia & Bioquímica' },
  { id: 'creatinina', nome: 'Creatinina Sérica (com estimativa de TFG)', grupo: 'bioquimica', grupoLabel: 'Hematologia & Bioquímica' },
  { id: 'sodio_potassio', nome: 'Eletrólitos: Sódio (Na) e Potássio (K)', grupo: 'bioquimica', grupoLabel: 'Hematologia & Bioquímica' },
  { id: 'tgo_tgp', nome: 'Transaminases: TGO (AST) e TGP (ALT)', grupo: 'bioquimica', grupoLabel: 'Hematologia & Bioquímica' },
  { id: 'gama_gt_fa', nome: 'Gama-GT e Fosfatase Alcalina', grupo: 'bioquimica', grupoLabel: 'Hematologia & Bioquímica' },
  { id: 'pcr', nome: 'Proteína C Reativa (PCR ultrassensível)', grupo: 'bioquimica', grupoLabel: 'Hematologia & Bioquímica' },
  { id: 'vhs', nome: 'Velocidade de Hemossedimentação (VHS)', grupo: 'bioquimica', grupoLabel: 'Hematologia & Bioquímica' },

  // Metabolismo, Vitaminas & Lipídios
  { id: 'lipidograma', nome: 'Perfil Lipídico (CT, HDL, LDL, VLDL, Triglicérides)', grupo: 'lipideos_metabolismo', grupoLabel: 'Metabolismo, Vitaminas & Lipídios' },
  { id: 'vit_b12', nome: 'Vitamina B12 (Cobalamina)', grupo: 'lipideos_metabolismo', grupoLabel: 'Metabolismo, Vitaminas & Lipídios' },
  { id: 'vit_d', nome: 'Vitamina D (25-Hidroxivitamina D)', grupo: 'lipideos_metabolismo', grupoLabel: 'Metabolismo, Vitaminas & Lipídios' },
  { id: 'acido_urico', nome: 'Ácido Úrico', grupo: 'lipideos_metabolismo', grupoLabel: 'Metabolismo, Vitaminas & Lipídios' },
  { id: 'calcio', nome: 'Cálcio Total e Iônico', grupo: 'lipideos_metabolismo', grupoLabel: 'Metabolismo, Vitaminas & Lipídios' },
  { id: 'tsh_t4', nome: 'Função Tireoidiana: TSH e T4 Livre', grupo: 'lipideos_metabolismo', grupoLabel: 'Metabolismo, Vitaminas & Lipídios' },
  { id: 'albumina', nome: 'Albumina e Proteínas Totais / Frações', grupo: 'lipideos_metabolismo', grupoLabel: 'Metabolismo, Vitaminas & Lipídios' },
  { id: 'ferritina', nome: 'Ferritina e Cinética de Ferro', grupo: 'lipideos_metabolismo', grupoLabel: 'Metabolismo, Vitaminas & Lipídios' },

  // Urina & Fezes
  { id: 'eas', nome: 'Urina Tipo 1 (EAS / Sedimentoscopia)', grupo: 'urina_fezes', grupoLabel: 'Urina & Fezes' },
  { id: 'urocultura', nome: 'Urocultura com Antibiograma (TSA)', grupo: 'urina_fezes', grupoLabel: 'Urina & Fezes' },
  { id: 'sangue_oculto', nome: 'Pesquisa de Sangue Oculto nas Fezes', grupo: 'urina_fezes', grupoLabel: 'Urina & Fezes' },
  { id: 'parasitologico', nome: 'Parasitológico de Fezes (EPF)', grupo: 'urina_fezes', grupoLabel: 'Urina & Fezes' },

  // Imagem & Cardiorrespiratório
  { id: 'rx_torax', nome: 'Radiografia de Tórax (PA e Perfil)', grupo: 'imagem_cardio', grupoLabel: 'Imagem & Cardiorrespiratório' },
  { id: 'ecg', nome: 'Eletrocardiograma de Repouso (ECG 12 derivações)', grupo: 'imagem_cardio', grupoLabel: 'Imagem & Cardiorrespiratório' },
  { id: 'usg_abdome', nome: 'Ultrassonografia de Abdome Total', grupo: 'imagem_cardio', grupoLabel: 'Imagem & Cardiorrespiratório' },
  { id: 'ecocardiograma', nome: 'Ecocardiograma Transtorácico com Doppler', grupo: 'imagem_cardio', grupoLabel: 'Imagem & Cardiorrespiratório' },
]

export const PRESETS_INDICACAO_CLINICA = [
  'Avaliação clínica periódica de rotina geriátrica na ILPI',
  'Suspeita de Infecção do Trato Urinário (ITU)',
  'Investigação de síndrome consumptiva / astenia / anemia',
  'Controle e monitoramento de Diabetes Mellitus e Hipertensão',
  'Monitoramento de função renal e equilíbrio eletrolítico',
  'Suspeita de infecção respiratória / febre a esclarecer',
  'Investigação pós-queda / dor lombar ou torácica',
  'Avaliação clínica pré-procedimento / risco cirúrgico',
]

export const PRESETS_ORIENTACOES_COLETA = [
  'Coleta em domicílio / no leito na ILPI',
  'Jejum de 8 a 12 horas obrigatório (água permitida com moderação)',
  'Manter medicações habituais de uso contínuo, salvo orientação em contrário',
  'Higienização prévia rigorosa para coleta de urina',
]

export const CIDS_COMUNS_GERIATRIA = [
  { codigo: 'I10', descricao: 'Hipertensão Essencial (Primária)' },
  { codigo: 'E11.9', descricao: 'Diabetes Mellitus Tipo 2' },
  { codigo: 'G30.9', descricao: 'Doença de Alzheimer' },
  { codigo: 'F03', descricao: 'Demência Não Especificada' },
  { codigo: 'F32.9', descricao: 'Transtorno Depressivo' },
  { codigo: 'F41.9', descricao: 'Transtorno de Ansiedade' },
  { codigo: 'M81.9', descricao: 'Osteoporose' },
  { codigo: 'I50.9', descricao: 'Insuficiência Cardíaca' },
  { codigo: 'J44.9', descricao: 'Doença Pulmonar Obstrutiva Crônica (DPOC)' },
  { codigo: 'N39.0', descricao: 'Infecção do Trato Urinário (ITU)' },
]

export interface MedicamentoReceita {
  nome: string
  dose: string
  posologia: string
  via: string
  quantidade?: string
  usoContinuo?: boolean
}

export interface PedidoMedicoData {
  id: string
  residenteId: string
  tipo: TipoPedido
  data: string
  hora: string
  prescritor: {
    id: string
    nome: string
    funcao?: string
    conselho?: string
    cat: string
  }
  // Exames
  examesSelecionados: string[]
  examesLivres?: string
  indicacaoClinica?: string
  cid10?: string
  observacoesColeta?: string
  // Receita
  tipoReceita?: 'simples' | 'controle_especial'
  medicamentos?: MedicamentoReceita[]
  orientacoesGerais?: string
  // Encaminhamento
  especialidadeDestino?: string
  motivoEncaminhamento?: string
  resumoClinico?: string
  // Memed / Receita Digital ICP-Brasil
  memedPrescriptionId?: string
  memedPrescriptionUrl?: string
  memedValidadoIcp?: boolean
  // Validação Digital Própria e ICP-Brasil
  codigoValidacao?: string
  validadeDias?: number
  assinaturaDigital?: {
    assinadoPor: string
    cpfPrescritor: string
    conselho: string
    dataHora: string
    algoritmo: string
    hashSha256: string
    autoridadeCertificadora: string
    certificadoTipo: string
    status: 'valido' | 'revogado'
  }
  dispensacao?: {
    dispensadoEm: string
    farmaciaNome: string
    farmaciaCnpj?: string
    farmaceuticoNome: string
    farmaceuticoCrf: string
    farmaciaCidadeUf?: string
    observacoes?: string
  }
}

const STORAGE_KEY_PREFIX = 'ilpi_pedidos_medicos_'

export function buscarPedidoPorCodigoOuId(codigoOuId: string): { pedido: PedidoMedicoData; residenteId: string } | null {
  try {
    const buscado = codigoOuId.trim().toUpperCase()
    // Varre as chaves do localStorage com prefixo
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const raw = localStorage.getItem(key)
        if (raw) {
          const lista: PedidoMedicoData[] = JSON.parse(raw)
          if (Array.isArray(lista)) {
            const encontrado = lista.find(
              (p) =>
                p.id.toUpperCase() === buscado ||
                (p.codigoValidacao && p.codigoValidacao.toUpperCase() === buscado)
            )
            if (encontrado) {
              const resId = key.replace(STORAGE_KEY_PREFIX, '')
              return { pedido: encontrado, residenteId: resId }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Erro ao buscar pedido por código de validação:', err)
  }
  return null
}

export function registrarDispensacaoFarmacia(
  codigoOuId: string,
  dispensacao: {
    farmaciaNome: string
    farmaceuticoNome: string
    farmaceuticoCrf: string
    farmaciaCnpj?: string
    farmaciaCidadeUf?: string
    observacoes?: string
  }
): boolean {
  try {
    const resultado = buscarPedidoPorCodigoOuId(codigoOuId)
    if (!resultado) return false

    const { pedido } = resultado
    const pedidoAtualizado: PedidoMedicoData = {
      ...pedido,
      dispensacao: {
        ...dispensacao,
        dispensadoEm: new Date().toISOString(),
      },
    }
    salvarPedidoLocal(pedidoAtualizado)
    return true
  } catch (err) {
    console.error('Erro ao registrar dispensação na farmácia:', err)
    return false
  }
}

export function getPedidosLocais(residenteId: string): PedidoMedicoData[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${residenteId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function salvarPedidoLocal(pedido: PedidoMedicoData): void {
  try {
    const lista = getPedidosLocais(pedido.residenteId)
    const semEsse = lista.filter((p) => p.id !== pedido.id)
    const atualizada = [pedido, ...semEsse]
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${pedido.residenteId}`, JSON.stringify(atualizada))
  } catch (err) {
    console.error('Erro ao salvar pedido médico localmente:', err)
  }
}

export function removerPedidoLocal(residenteId: string, pedidoId: string): void {
  try {
    const lista = getPedidosLocais(residenteId)
    const atualizada = lista.filter((p) => p.id !== pedidoId)
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${residenteId}`, JSON.stringify(atualizada))
  } catch (err) {
    console.error('Erro ao remover pedido médico:', err)
  }
}

export function gerarTituloResumo(pedido: PedidoMedicoData): string {
  if (pedido.tipo === 'exames') {
    const total = pedido.examesSelecionados.length + (pedido.examesLivres?.trim() ? 1 : 0)
    const primeiros = pedido.examesSelecionados.slice(0, 3).join(', ')
    return `Pedido de Exames (${total}): ${primeiros}${pedido.examesSelecionados.length > 3 ? '...' : ''}`
  }
  if (pedido.tipo === 'receituario') {
    const meds = pedido.medicamentos?.map((m) => m.nome).slice(0, 3).join(', ') ?? ''
    const tipo = pedido.tipoReceita === 'controle_especial' ? 'Controle Especial' : 'Simples'
    return `Receituário Médico (${tipo}): ${meds}`
  }
  return `Guia de Encaminhamento: ${pedido.especialidadeDestino || 'Especialista'}`
}

export function converterPrescricoesParaReceita(r: Residente): MedicamentoReceita[] {
  const ativas = r.presc?.filter((p) => !p.suspensa && p.suspensao?.status !== 'pendente_enfermagem') ?? []
  return ativas.map((p) => ({
    nome: p.med,
    dose: p.dose,
    posologia: p.tipo === 'fixo' || (p.tipo as string) === 'diario' 
      ? (p.horarios?.length ? `Tomar às ${p.horarios.join(', ')}` : 'Uso contínuo conforme horários')
      : p.tipo === 'sn' 
      ? `Tomar se necessário (${p.obs || 'conforme orientação'})` 
      : `Tomar a cada ${p.intervalo ?? 1} dia(s)`,
    via: p.via || 'VO',
    quantidade: '1 cx',
    usoContinuo: true,
  }))
}

export function formatarDataExtenso(dataIso: string = iso(new Date())): string {
  try {
    const [ano, mes, dia] = dataIso.split('-').map(Number)
    const data = new Date(ano, mes - 1, dia)
    return data.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return fmt(dataIso)
  }
}
