import { describe, it, expect, beforeEach } from 'vitest'
import {
  calcularSplit,
  gerarLinkAutorizacaoOAuth,
  trocarCodePorToken,
  obterContaProfissional,
  desconectarContaProfissional,
  atualizarTaxaComissao,
  gerarPixCopiaECola,
  processarPagamentoSplit,
  listarTransacoesSplit,
  normalizarChavePix,
  formatarChavePixParaExibicao,
  obterChavePixConfigurada,
  salvarChavePixConfigurada,
  MP_CONFIG,
} from '../../lib/mercadopagoService'

describe('mercadopagoService - Marketplace & Split de Pagamentos', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('calcula o split corretamente com a taxa padrão de 10%', () => {
    const split = calcularSplit(220)
    expect(split.valorTotal).toBe(220)
    expect(split.taxaComissaoPercentual).toBe(10)
    expect(split.valorComissaoSaaS).toBe(22.0)
    expect(split.valorLiquidoProfissional).toBe(198.0)
  })

  it('calcula o split com taxa customizada (ex: 15% e 0%)', () => {
    const split15 = calcularSplit(300, 15)
    expect(split15.valorComissaoSaaS).toBe(45.0)
    expect(split15.valorLiquidoProfissional).toBe(255.0)

    const split0 = calcularSplit(150, 0)
    expect(split0.valorComissaoSaaS).toBe(0)
    expect(split0.valorLiquidoProfissional).toBe(150)
  })

  it('gera link oficial de autorização OAuth 2.0 com parâmetros esperados', () => {
    const link = gerarLinkAutorizacaoOAuth('prof_dra_juliana', 'https://meusaas.com/oauth')
    expect(link).toContain(MP_CONFIG.oauthAuthUrl)
    expect(link).toContain('client_id=')
    expect(link).toContain('response_type=code')
    expect(link).toContain('state=prof_dra_juliana')
    expect(link).toContain('redirect_uri=https%3A%2F%2Fmeusaas.com%2Foauth')
  })

  it('troca o authorization code pelo token OAuth e persiste a conta do vendedor', async () => {
    const conta = await trocarCodePorToken('TG-CODE-123456', 'prof_psic_felipe', 12.5)

    expect(conta.profissionalId).toBe('prof_psic_felipe')
    expect(conta.accessToken).toBeDefined()
    expect(conta.mpUserId).toBeDefined()
    expect(conta.taxaComissaoPercentual).toBe(12.5)
    expect(conta.expiresAt).toBeDefined()

    // Recupera a conta
    const contaRecuperada = await obterContaProfissional('prof_psic_felipe')
    expect(contaRecuperada).not.toBeNull()
    expect(contaRecuperada?.profissionalId).toBe('prof_psic_felipe')
    expect(contaRecuperada?.taxaComissaoPercentual).toBe(12.5)
  })

  it('atualiza a taxa de comissão e permite desconectar a conta do especialista', async () => {
    await trocarCodePorToken('TG-CODE-ABC', 'prof_nutr_camila', 10.0)

    await atualizarTaxaComissao('prof_nutr_camila', 8.0)
    const contaAtualizada = await obterContaProfissional('prof_nutr_camila')
    expect(contaAtualizada?.taxaComissaoPercentual).toBe(8.0)

    await desconectarContaProfissional('prof_nutr_camila')
    const contaDesconectada = await obterContaProfissional('prof_nutr_camila')
    expect(contaDesconectada).toBeNull()
  })

  it('gera payload válido de PIX Copia e Cola com CNPJ e normalização Bacen', () => {
    // Normalização da chave informada pelo usuário
    const cnpjComMascara = '63.283.783/0001-88'
    const cnpjNormalizado = normalizarChavePix(cnpjComMascara)
    expect(cnpjNormalizado).toBe('63283783000188')
    expect(formatarChavePixParaExibicao(cnpjNormalizado)).toBe('63.283.783/0001-88')

    // Geração do código EMV PIX com CODAGEM
    const pix = gerarPixCopiaECola('tx_12345', 250.0, 'CODAGEM', cnpjComMascara)
    expect(pix).toContain('br.gov.bcb.pix')
    expect(pix).toContain('63283783000188')
    expect(pix).toContain('250.00')
    expect(pix).toContain('CODAGEM')
    // Verifica tag 63 do CRC16
    expect(pix).toMatch(/6304[A-F0-9]{4}$/)
  })

  it('salva e recupera a chave PIX configurada', () => {
    salvarChavePixConfigurada('63.283.783/0001-88')
    expect(obterChavePixConfigurada()).toBe('63283783000188')
  })

  it('processa pagamento com split registrando histórico e dados de repasse', async () => {
    const res = await processarPagamentoSplit({
      profissionalId: 'prof_dra_juliana',
      residenteId: 'res_123',
      residenteNome: 'Sebastião Arruda',
      consultaId: 'cons_999',
      especialidade: 'Medicina Geriátrica',
      valorTotal: 220,
      metodoPagamento: 'pix',
      pagadorNome: 'Família Arruda',
      pagadorEmail: 'familia@arruda.com',
    })

    expect(res.status).toBe('approved')
    expect(res.valorTotal).toBe(220)
    expect(res.valorComissaoSaaS).toBe(22)
    expect(res.valorLiquidoProfissional).toBe(198)
    expect(res.pixCopiaECola).toBeDefined()

    const transacoes = listarTransacoesSplit()
    expect(transacoes.length).toBeGreaterThan(0)
    expect(transacoes[0].residenteNome).toBe('Sebastião Arruda')
    expect(transacoes[0].valorComissaoSaaS).toBe(22)
  })
})
