import QRCode from 'qrcode'
import type { PedidoMedicoData } from './business/pedidosMedicos'
import type { Residente } from '../types/ilpi'

export interface AssinaturaDigitalData {
  assinadoPor: string
  cpfPrescritor: string
  conselho: string
  dataHora: string
  algoritmo: 'SHA256withRSA' | 'ICP-Brasil PAdES'
  hashSha256: string
  autoridadeCertificadora: string
  certificadoTipo: 'nuvem_birdid' | 'nuvem_vidaas' | 'nuvem_safeid' | 'nuvem_cfm' | 'a1' | 'a3'
  status: 'valido' | 'revogado'
}

export interface DispensacaoFarmaciaData {
  dispensadoEm: string
  farmaciaNome: string
  farmaciaCnpj?: string
  farmaceuticoNome: string
  farmaceuticoCrf: string
  farmaciaCidadeUf?: string
  observacoes?: string
}

export function gerarCodigoValidacao(prefixo: string = 'ILPI-REC'): string {
  const ano = new Date().getFullYear()
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()
  const randomChars2 = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefixo}-${ano}-${randomChars}-${randomChars2}`
}

export function gerarHashSha256Simulado(conteudo: string): string {
  let hash = 0
  for (let i = 0; i < conteudo.length; i++) {
    const char = conteudo.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  const timestamp = Date.now().toString(16)
  return `${hex}e4b789a1c${timestamp}7f3d902a`.substring(0, 64)
}

export async function gerarQrCodeDataUrl(texto: string): Promise<string> {
  try {
    return await QRCode.toDataURL(texto, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 180,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
  } catch (err) {
    console.error('Erro ao gerar QR Code:', err)
    return ''
  }
}

export function obterUrlValidacaoPublica(codigoValidacao: string): string {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://sistema-ilpi.com.br'
  return `${origin}/validar-receita/${codigoValidacao}`
}

export function gerarMensagemWhatsAppFarmacia(
  residente: Residente,
  pedido: PedidoMedicoData,
  urlValidacao: string
): string {
  const meds = pedido.medicamentos?.map((m, i) => `${i + 1}. ${m.nome} (${m.dose}) - Qtd: ${m.quantidade || '1 cx'}`).join('\n') || ''

  return `*RECEITA MÉDICA DIGITAL - ILPI* 🩺
*Paciente:* ${residente.nome} (CPF: ${residente.cpf || 'Cadastrado no prontuário'})
*Médica Prescritora:* ${pedido.prescritor.nome} (${pedido.prescritor.conselho})
*Data de Emissão:* ${pedido.data}
*Tipo de Receituário:* ${pedido.tipoReceita === 'controle_especial' ? 'Controle Especial (2 Vias)' : 'Receituário Simples'}

*MEDICAMENTOS:*
${meds}

🔒 *AUTENTICIDADE ICP-BRASIL & DISPENSAÇÃO FARMACÊUTICA:*
Acesse a via oficial da receita com carimbo e validação no link abaixo:
👉 ${urlValidacao}

_Documento com validade de 30 dias em todo o território nacional conforme Portaria SVS/MS nº 344/98 e Resolução CFM nº 2.299/2021._`
}
