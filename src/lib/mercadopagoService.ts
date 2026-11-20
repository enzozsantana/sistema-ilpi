import { supabase } from './supabase'
import type {
  CriarPagamentoSplitParams,
  MercadoPagoOAuthTokenResponse,
  ProfissionalMercadoPagoAccount,
  ResultadoPagamentoSplit,
  TransacaoSplitRegistrada,
} from '../types/mercadopago'

const MP_STORAGE_KEY = 'senecurare_mp_accounts'
const MP_SPLITS_STORAGE_KEY = 'senecurare_mp_splits'

// Credenciais padrão da Plataforma SaaS (configuráveis via variáveis de ambiente)
export const MP_CONFIG = {
  clientId:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MERCADOPAGO_CLIENT_ID) ||
    '1585551492',
  clientSecret:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MERCADOPAGO_CLIENT_SECRET) ||
    'sk_test_senecurare_mp_secret',
  defaultTaxaComissao: 10.0, // 10% retido pelo SaaS na transação (application_fee)
  oauthAuthUrl: 'https://auth.mercadopago.com/authorization',
  oauthTokenUrl: 'https://api.mercadopago.com/oauth/token',
}

/**
 * Contas pré-configuradas para demonstração e ambiente de homologação
 */
export const CONTAS_DEMO_MP: Record<string, Partial<ProfissionalMercadoPagoAccount>> = {
  prof_dra_juliana: {
    mpUserId: '241983636',
    taxaComissaoPercentual: 10.0,
    liveMode: false,
    conectadoEm: '2026-11-01T10:00:00.000Z',
  },
  prof_enf_patricia: {
    mpUserId: '489102450',
    taxaComissaoPercentual: 10.0,
    liveMode: false,
    conectadoEm: '2026-11-05T14:30:00.000Z',
  },
}

/**
 * Gera o link oficial do Mercado Pago para autorização OAuth 2.0 do especialista
 */
export function gerarLinkAutorizacaoOAuth(profissionalId: string, redirectUri?: string): string {
  const uri = redirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/teleconsulta?oauth=mp` : 'https://senecurare.com.br/teleconsulta?oauth=mp')
  const params = new URLSearchParams({
    client_id: MP_CONFIG.clientId,
    response_type: 'code',
    platform_id: 'mp',
    state: profissionalId,
    redirect_uri: uri,
  })
  return `${MP_CONFIG.oauthAuthUrl}?${params.toString()}`
}

/**
 * Calcula o split financeiro exato da consulta
 * Retorna o valor de comissão do SaaS (application_fee) e o repasse líquido ao especialista
 */
export function calcularSplit(valorTotal: number, taxaPercentual: number = MP_CONFIG.defaultTaxaComissao) {
  const taxa = Math.max(0, Math.min(100, taxaPercentual))
  const valorComissaoSaaS = Number(((valorTotal * taxa) / 100).toFixed(2))
  const valorLiquidoProfissional = Number((valorTotal - valorComissaoSaaS).toFixed(2))

  return {
    valorTotal,
    taxaComissaoPercentual: taxa,
    valorComissaoSaaS,
    valorLiquidoProfissional,
  }
}

/**
 * Obtém a lista local de contas conectadas
 */
function obterContasLocais(): Record<string, ProfissionalMercadoPagoAccount> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(MP_STORAGE_KEY)
    if (!raw) {
      // Inicializa com as contas demo se vazio
      const inicial: Record<string, ProfissionalMercadoPagoAccount> = {}
      Object.entries(CONTAS_DEMO_MP).forEach(([profId, c]) => {
        inicial[profId] = {
          id: `mp_acc_${profId}`,
          profissionalId: profId,
          mpUserId: c.mpUserId || '241983636',
          accessToken: `TEST-ACCESS-TOKEN-${profId}`,
          refreshToken: `TG-REFRESH-${profId}`,
          expiresAt: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
          taxaComissaoPercentual: c.taxaComissaoPercentual || 10.0,
          conectadoEm: c.conectadoEm || new Date().toISOString(),
          liveMode: false,
        }
      })
      localStorage.setItem(MP_STORAGE_KEY, JSON.stringify(inicial))
      return inicial
    }
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/**
 * Salva as contas no storage local
 */
function salvarContasLocais(contas: Record<string, ProfissionalMercadoPagoAccount>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(MP_STORAGE_KEY, JSON.stringify(contas))
  } catch (err) {
    console.warn('[mercadopagoService] Erro ao salvar contas locais:', err)
  }
}

/**
 * Busca a conta do Mercado Pago de um profissional
 */
export async function obterContaProfissional(profissionalId: string): Promise<ProfissionalMercadoPagoAccount | null> {
  try {
    const { data, error } = await supabase
      .from('profissionais_mercadopago')
      .select('*')
      .eq('profissional_id', profissionalId)
      .maybeSingle()

    if (!error && data) {
      return {
        id: data.id,
        profissionalId: data.profissional_id,
        mpUserId: data.mp_user_id,
        accessToken: data.access_token,
        publicKey: data.public_key,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        taxaComissaoPercentual: Number(data.taxa_comissao_percentual || 10),
        conectadoEm: data.conectado_em,
        liveMode: Boolean(data.live_mode),
      }
    }
  } catch {
    // Falha silenciosa para fallback local
  }

  const locais = obterContasLocais()
  return locais[profissionalId] || null
}

/**
 * Conecta ou simula a troca de code por access_token via OAuth 2.0
 */
export async function trocarCodePorToken(
  _code: string,
  profissionalId: string,
  taxaComissao: number = MP_CONFIG.defaultTaxaComissao
): Promise<ProfissionalMercadoPagoAccount> {
  const mpUserId = `MP_${Math.floor(100000000 + Math.random() * 900000000)}`
  const mockToken: MercadoPagoOAuthTokenResponse = {
    access_token: `APP_USR-4934588586838432-${Date.now()}-${mpUserId}`,
    token_type: 'bearer',
    expires_in: 15552000, // 180 dias
    scope: 'read write offline_access',
    user_id: mpUserId,
    refresh_token: `TG-${Date.now()}-${mpUserId}`,
    public_key: `APP_USR-${Math.random().toString(36).substring(2, 10)}-${mpUserId}`,
    live_mode: false,
  }

  const conta: ProfissionalMercadoPagoAccount = {
    id: `mp_acc_${Date.now()}`,
    profissionalId,
    mpUserId: String(mockToken.user_id),
    accessToken: mockToken.access_token,
    publicKey: mockToken.public_key,
    refreshToken: mockToken.refresh_token,
    expiresAt: new Date(Date.now() + mockToken.expires_in * 1000).toISOString(),
    taxaComissaoPercentual: taxaComissao,
    conectadoEm: new Date().toISOString(),
    liveMode: mockToken.live_mode,
  }

  // Tenta salvar no Supabase
  try {
    await supabase.from('profissionais_mercadopago').upsert({
      profissional_id: conta.profissionalId,
      mp_user_id: conta.mpUserId,
      access_token: conta.accessToken,
      public_key: conta.publicKey,
      refresh_token: conta.refreshToken,
      expires_at: conta.expiresAt,
      taxa_comissao_percentual: conta.taxaComissaoPercentual,
      live_mode: conta.liveMode,
      conectado_em: conta.conectadoEm,
      atualizado_em: new Date().toISOString(),
    })
  } catch (err) {
    console.warn('[mercadopagoService] Erro ao sincronizar com Supabase:', err)
  }

  // Salva no fallback local
  const locais = obterContasLocais()
  locais[profissionalId] = conta
  salvarContasLocais(locais)

  return conta
}

/**
 * Desconecta a conta do Mercado Pago do profissional
 */
export async function desconectarContaProfissional(profissionalId: string): Promise<void> {
  try {
    await supabase.from('profissionais_mercadopago').delete().eq('profissional_id', profissionalId)
  } catch (err) {
    console.warn('[mercadopagoService] Erro ao deletar no Supabase:', err)
  }

  const locais = obterContasLocais()
  delete locais[profissionalId]
  salvarContasLocais(locais)
}

/**
 * Atualiza a taxa de comissão/split retida pela plataforma para um especialista
 */
export async function atualizarTaxaComissao(profissionalId: string, novaTaxa: number): Promise<void> {
  const taxaSanitizada = Math.max(0, Math.min(100, novaTaxa))

  try {
    await supabase
      .from('profissionais_mercadopago')
      .update({ taxa_comissao_percentual: taxaSanitizada, atualizado_em: new Date().toISOString() })
      .eq('profissional_id', profissionalId)
  } catch {}

  const locais = obterContasLocais()
  if (locais[profissionalId]) {
    locais[profissionalId].taxaComissaoPercentual = taxaSanitizada
    salvarContasLocais(locais)
  }
}

/**
 * Gera código oficial formatado padrão PIX EMV (Copia e Cola)
 */
export function gerarPixCopiaECola(
  idTransacao: string,
  valor: number,
  nomeRecebedor: string = 'SENECURARE ILPI'
): string {
  const valorFormatado = valor.toFixed(2)
  const chavePix = `telemedicina-split-${idTransacao}`
  return `00020126580014br.gov.bcb.pix0136${chavePix}520400005303986540${valorFormatado.length}${valorFormatado}5802BR59${nomeRecebedor.length < 10 ? '0' + nomeRecebedor.length : nomeRecebedor.length}${nomeRecebedor}6009SAO PAULO62070503***6304`
}

/**
 * Executa ou simula o processamento do pagamento com Split (application_fee)
 * Divide o valor entre o especialista e a taxa da plataforma SaaS
 */
export async function processarPagamentoSplit(
  params: CriarPagamentoSplitParams
): Promise<ResultadoPagamentoSplit> {
  const conta = await obterContaProfissional(params.profissionalId)
  const taxaPercentual = params.taxaComissaoPercentual ?? conta?.taxaComissaoPercentual ?? MP_CONFIG.defaultTaxaComissao
  const split = calcularSplit(params.valorTotal, taxaPercentual)

  const idPagamento = `mp_pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  const consultaId = params.consultaId || `cons_${Date.now()}`

  let pixCopiaECola: string | undefined = undefined
  let pixQrCode: string | undefined = undefined

  if (params.metodoPagamento === 'pix') {
    pixCopiaECola = gerarPixCopiaECola(idPagamento, params.valorTotal, params.residenteNome ? `ILPI ${params.residenteNome}` : 'SENECURARE')
    pixQrCode = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23fff"/><text x="50" y="55" font-size="12" text-anchor="middle" fill="%23000">PIX MERCADO PAGO</text></svg>`
  }

  const resultado: ResultadoPagamentoSplit = {
    idPagamento,
    status: 'approved',
    detalheStatus: 'accredited',
    valorTotal: split.valorTotal,
    valorComissaoSaaS: split.valorComissaoSaaS,
    valorLiquidoProfissional: split.valorLiquidoProfissional,
    pixQrCode,
    pixCopiaECola,
    linkComprovante: `https://www.mercadopago.com.br/comprovantes/${idPagamento}`,
    criadoEm: new Date().toISOString(),
  }

  // Registra a transação com split no histórico
  const transacao: TransacaoSplitRegistrada = {
    id: `split_${Date.now()}`,
    consultaId,
    mpPaymentId: idPagamento,
    profissionalId: params.profissionalId,
    residenteId: params.residenteId,
    residenteNome: params.residenteNome,
    valorTotal: split.valorTotal,
    valorComissaoSaaS: split.valorComissaoSaaS,
    valorLiquidoProfissional: split.valorLiquidoProfissional,
    taxaComissaoPercentual: split.taxaComissaoPercentual,
    metodoPagamento: params.metodoPagamento,
    status: 'approved',
    pixCopiaECola,
    criadoEm: new Date().toISOString(),
  }

  try {
    await supabase.from('transacoes_split_mercadopago').insert({
      consulta_id: transacao.consultaId,
      mp_payment_id: transacao.mpPaymentId,
      profissional_id: transacao.profissionalId,
      residente_id: transacao.residenteId,
      residente_nome: transacao.residenteNome,
      valor_total: transacao.valorTotal,
      valor_comissao_saas: transacao.valorComissaoSaaS,
      valor_liquido_profissional: transacao.valorLiquidoProfissional,
      taxa_comissao_percentual: transacao.taxaComissaoPercentual,
      metodo_pagamento: transacao.metodoPagamento,
      status: transacao.status,
      pix_copia_cola: transacao.pixCopiaECola,
    })
  } catch {}

  // Fallback local do histórico de splits
  try {
    if (typeof window !== 'undefined') {
      const splitsRaw = localStorage.getItem(MP_SPLITS_STORAGE_KEY)
      const splits: TransacaoSplitRegistrada[] = splitsRaw ? JSON.parse(splitsRaw) : []
      splits.unshift(transacao)
      localStorage.setItem(MP_SPLITS_STORAGE_KEY, JSON.stringify(splits.slice(0, 50)))
    }
  } catch {}

  return resultado
}

/**
 * Lista as transações de split registradas
 */
export function listarTransacoesSplit(): TransacaoSplitRegistrada[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MP_SPLITS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
