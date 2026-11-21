import { describe, it, expect, beforeEach } from 'vitest'
import {
  gerarCodigoValidacao,
  gerarHashSha256Simulado,
  gerarQrCodeDataUrl,
  obterUrlValidacaoPublica,
  gerarMensagemWhatsAppFarmacia,
} from '../../lib/assinaturaDigitalService'
import {
  salvarPedidoLocal,
  buscarPedidoPorCodigoOuId,
  registrarDispensacaoFarmacia,
  type PedidoMedicoData,
} from '../../lib/business/pedidosMedicos'
import type { Residente } from '../../types/ilpi'

describe('Assinatura Digital ICP-Brasil & Validação Farmacêutica', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('gerarCodigoValidacao: gera código formatado com prefixo e ano corrente', () => {
    const cod = gerarCodigoValidacao('ILPI-REC')
    const anoAtual = new Date().getFullYear().toString()
    expect(cod).toContain('ILPI-REC')
    expect(cod).toContain(anoAtual)
    expect(cod.split('-').length).toBe(5) // ILPI, REC, 2026, XXXX, YYYY
  })

  it('gerarHashSha256Simulado: gera hash hexadecimal para o documento assinado', () => {
    const hash = gerarHashSha256Simulado('receita-conteudo-teste')
    expect(hash).toBeDefined()
    expect(hash.length).toBeGreaterThan(16)
  })

  it('gerarQrCodeDataUrl: gera data URL válida de imagem PNG para o QR Code', async () => {
    const qr = await gerarQrCodeDataUrl('https://sistema-ilpi.com.br/validar-receita/123')
    expect(qr).toContain('data:image/png;base64,')
  })

  it('obterUrlValidacaoPublica: formata link para a página pública de verificação da farmácia', () => {
    const url = obterUrlValidacaoPublica('ILPI-REC-2026-ABCD-1234')
    expect(url).toContain('/validar-receita/ILPI-REC-2026-ABCD-1234')
  })

  it('gerarMensagemWhatsAppFarmacia: gera texto formatado com medicamentos e link de validação', () => {
    const mockResidente: Partial<Residente> = {
      id: 'res_1',
      nome: 'Dona Neusa Garcia',
      cpf: '111.222.333-44',
      contato: '11999998888',
    }

    const mockPedido: PedidoMedicoData = {
      id: 'ped_1',
      residenteId: 'res_1',
      tipo: 'receituario',
      tipoReceita: 'controle_especial',
      data: '2026-11-21',
      hora: '17:00',
      prescritor: { id: 'm1', nome: 'Dra. Luiza Vianna', conselho: 'CRM/SP 98765', cat: 'med' },
      examesSelecionados: [],
      medicamentos: [
        { nome: 'Clonazepam', dose: '2mg', via: 'VO', posologia: '1 cp à noite', quantidade: '1 caixa' },
      ],
      codigoValidacao: 'ILPI-REC-2026-TEST-9999',
    }

    const msg = gerarMensagemWhatsAppFarmacia(
      mockResidente as Residente,
      mockPedido,
      'https://sistema-ilpi.com/validar-receita/ILPI-REC-2026-TEST-9999'
    )

    expect(msg).toContain('Dona Neusa Garcia')
    expect(msg).toContain('Dra. Luiza Vianna')
    expect(msg).toContain('Clonazepam')
    expect(msg).toContain('https://sistema-ilpi.com/validar-receita/ILPI-REC-2026-TEST-9999')
    expect(msg).toContain('Controle Especial')
  })

  it('buscarPedidoPorCodigoOuId e registrarDispensacaoFarmacia: permite à drogaria verificar e dar baixa', () => {
    const pedido: PedidoMedicoData = {
      id: 'ped_farm_100',
      residenteId: 'res_42',
      tipo: 'receituario',
      tipoReceita: 'controle_especial',
      data: '2026-11-21',
      hora: '17:30',
      prescritor: { id: 'm1', nome: 'Dr. Roberto', conselho: 'CRM/SP 55555', cat: 'med' },
      examesSelecionados: [],
      medicamentos: [{ nome: 'Quetiapina', dose: '25mg', via: 'VO', posologia: '1 cp ao deitar' }],
      codigoValidacao: 'ILPI-REC-2026-FARM-0001',
    }

    salvarPedidoLocal(pedido)

    // Busca pelo código
    const encontrado = buscarPedidoPorCodigoOuId('ILPI-REC-2026-FARM-0001')
    expect(encontrado).not.toBeNull()
    expect(encontrado?.pedido.prescritor.nome).toBe('Dr. Roberto')
    expect(encontrado?.residenteId).toBe('res_42')

    // Farmácia registra dispensação
    const dispensou = registrarDispensacaoFarmacia('ILPI-REC-2026-FARM-0001', {
      farmaciaNome: 'Droga Raia - Unidade Jardins',
      farmaceuticoNome: 'Carlos Eduardo',
      farmaceuticoCrf: 'CRF/SP 43210',
      farmaciaCidadeUf: 'São Paulo/SP',
    })
    expect(dispensou).toBe(true)

    // Reconsulta e verifica baixa
    const atualizado = buscarPedidoPorCodigoOuId('ILPI-REC-2026-FARM-0001')
    expect(atualizado?.pedido.dispensacao).toBeDefined()
    expect(atualizado?.pedido.dispensacao?.farmaciaNome).toBe('Droga Raia - Unidade Jardins')
    expect(atualizado?.pedido.dispensacao?.farmaceuticoCrf).toBe('CRF/SP 43210')
  })
})
