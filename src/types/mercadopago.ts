export interface MercadoPagoOAuthTokenResponse {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  scope: string
  user_id: number | string
  refresh_token: string
  public_key?: string
  live_mode: boolean
}

export interface ProfissionalMercadoPagoAccount {
  id: string
  profissionalId: string
  mpUserId: string
  accessToken: string
  publicKey?: string
  refreshToken: string
  expiresAt: string // ISO string
  taxaComissaoPercentual: number // Ex: 10%
  conectadoEm: string // ISO string
  liveMode: boolean
}

export interface CriarPagamentoSplitParams {
  profissionalId: string
  residenteId: string
  residenteNome: string
  consultaId?: string
  especialidade: string
  valorTotal: number
  taxaComissaoPercentual?: number // Se não informado, usa o da conta ou 10%
  metodoPagamento: 'pix' | 'cartao'
  pagadorEmail?: string
  pagadorNome?: string
  pagadorCpf?: string
  dadosCartao?: {
    token?: string
    ultimosDigitos?: string
    bandeira?: string
    parcelas?: number
  }
}

export interface ResultadoPagamentoSplit {
  idPagamento: string
  status: 'approved' | 'pending' | 'in_process' | 'rejected'
  detalheStatus?: string
  valorTotal: number
  valorComissaoSaaS: number
  valorLiquidoProfissional: number
  pixQrCode?: string
  pixCopiaECola?: string
  linkComprovante?: string
  criadoEm: string
}

export interface TransacaoSplitRegistrada {
  id: string
  consultaId: string
  mpPaymentId: string
  profissionalId: string
  residenteId: string
  residenteNome: string
  valorTotal: number
  valorComissaoSaaS: number
  valorLiquidoProfissional: number
  taxaComissaoPercentual: number
  metodoPagamento: 'pix' | 'cartao'
  status: 'approved' | 'pending' | 'in_process' | 'rejected'
  pixCopiaECola?: string
  criadoEm: string
}
