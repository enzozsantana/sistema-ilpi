import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  CheckCircle2,
  ExternalLink,
  Percent,
  RefreshCw,
  Unlink,
  ArrowRightLeft,
  Building,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  MP_CONFIG,
  calcularSplit,
  desconectarContaProfissional,
  gerarLinkAutorizacaoOAuth,
  listarTransacoesSplit,
  obterContaProfissional,
  trocarCodePorToken,
  atualizarTaxaComissao,
} from '../lib/mercadopagoService'
import { formatarMoeda } from '../lib/currency'
import type { ProfissionalVirtual } from '../types/teleconsulta'
import type { ProfissionalMercadoPagoAccount, TransacaoSplitRegistrada } from '../types/mercadopago'

interface ModalConectarMercadoPagoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profissionais: ProfissionalVirtual[]
}

export function ModalConectarMercadoPago({
  open,
  onOpenChange,
  profissionais,
}: ModalConectarMercadoPagoProps) {
  const [profSelecionadoId, setProfSelecionadoId] = useState<string>(profissionais[0]?.id || '')
  const [contaAtual, setContaAtual] = useState<ProfissionalMercadoPagoAccount | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [conectando, setConectando] = useState(false)
  const [taxaEditada, setTaxaEditada] = useState<number>(MP_CONFIG.defaultTaxaComissao)
  const [historicoSplits, setHistoricoSplits] = useState<TransacaoSplitRegistrada[]>([])

  const profSelecionado = profissionais.find((p) => p.id === profSelecionadoId) || profissionais[0]

  useEffect(() => {
    if (!open || !profSelecionadoId) return
    carregarConta(profSelecionadoId)
    setHistoricoSplits(listarTransacoesSplit())
  }, [open, profSelecionadoId])

  async function carregarConta(id: string) {
    setCarregando(true)
    try {
      const conta = await obterContaProfissional(id)
      setContaAtual(conta)
      if (conta) {
        setTaxaEditada(conta.taxaComissaoPercentual)
      } else {
        setTaxaEditada(MP_CONFIG.defaultTaxaComissao)
      }
    } finally {
      setCarregando(false)
    }
  }

  async function handleConectarSimulado() {
    if (!profSelecionado) return
    setConectando(true)
    try {
      // Simula o recebimento do authorization_code retornado pelo OAuth do Mercado Pago
      const mockCode = `TG-AUTH-${Date.now()}`
      const novaConta = await trocarCodePorToken(mockCode, profSelecionado.id, taxaEditada)
      setContaAtual(novaConta)
      toast.success(`Conta Mercado Pago conectada com sucesso para ${profSelecionado.nome}!`)
    } catch {
      toast.error('Erro ao conectar conta do Mercado Pago.')
    } finally {
      setConectando(false)
    }
  }

  async function handleDesconectar() {
    if (!profSelecionado) return
    await desconectarContaProfissional(profSelecionado.id)
    setContaAtual(null)
    toast.info(`Conta Mercado Pago desconectada de ${profSelecionado.nome}.`)
  }

  async function handleSalvarTaxa() {
    if (!profSelecionado) return
    await atualizarTaxaComissao(profSelecionado.id, taxaEditada)
    if (contaAtual) {
      setContaAtual({ ...contaAtual, taxaComissaoPercentual: taxaEditada })
    }
    toast.success('Taxa de comissão da plataforma atualizada!')
  }

  const precoConsulta = profSelecionado?.preco || 200
  const splitExemplo = calcularSplit(precoConsulta, taxaEditada)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#009EE3]/15 text-[#009EE3] flex items-center justify-center font-bold text-sm">
              MP
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Mercado Pago Marketplace & Split de Pagamento
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Conecte a conta dos especialistas para repasse direto de honorários com retenção automática da comissão do SaaS.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-3 text-xs">
          {/* SELETOR DE ESPECIALISTA */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Selecione o Especialista / Profissional:
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {profissionais.map((p) => {
                const ativo = p.id === profSelecionadoId
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProfSelecionadoId(p.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      ativo
                        ? 'border-[#009EE3] bg-[#009EE3]/10 ring-1 ring-[#009EE3]'
                        : 'border-border/60 hover:bg-muted/30'
                    }`}
                  >
                    <img
                      src={p.foto}
                      alt={p.nome}
                      className="size-8 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs truncate text-foreground">{p.nome}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{p.especialidadeLabel}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* CARD DE STATUS DA CONEXÃO MERCADO PAGO */}
          {profSelecionado && (
            <div className="p-4 rounded-xl border border-border/70 bg-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-foreground block">
                    Status da Conta Mercado Pago ({profSelecionado.nome})
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    OAuth 2.0 Seller Account · Permite split automático via <code>application_fee</code>
                  </span>
                </div>

                {carregando ? (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <RefreshCw className="size-3 animate-spin" /> Verificando...
                  </Badge>
                ) : contaAtual ? (
                  <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] gap-1">
                    <CheckCircle2 className="size-3" /> Conectada (ID: {contaAtual.mpUserId})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                    Desconectada (Requer autorização)
                  </Badge>
                )}
              </div>

              {contaAtual ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg bg-muted/30 text-[11px]">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">ID Vendedor MP:</span>
                      <strong className="font-mono">{contaAtual.mpUserId}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Conectado em:</span>
                      <strong>{new Date(contaAtual.conectadoEm).toLocaleDateString('pt-BR')}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Ambiente:</span>
                      <strong className="text-teal-600 dark:text-teal-400">Sandbox / Ativo</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDesconectar}
                      className="rounded-xl text-xs gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Unlink className="size-3.5" /> Desconectar Conta
                    </Button>
                    <a
                      href={gerarLinkAutorizacaoOAuth(profSelecionado.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline decoration-dotted"
                    >
                      <ExternalLink className="size-3" /> Reautorizar via portal MP
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    O especialista precisa autorizar a aplicação para que as consultas agendadas creditem os honorários diretamente em sua conta do Mercado Pago.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={conectando}
                      onClick={handleConectarSimulado}
                      className="rounded-xl text-xs font-semibold bg-[#009EE3] hover:bg-[#009EE3]/90 text-white gap-2 shadow-xs"
                    >
                      {conectando ? (
                        <>
                          <RefreshCw className="size-3.5 animate-spin" /> Conectando...
                        </>
                      ) : (
                        <>
                          <Building className="size-3.5" /> Conectar Conta Mercado Pago (OAuth)
                        </>
                      )}
                    </Button>
                    <a
                      href={gerarLinkAutorizacaoOAuth(profSelecionado.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#009EE3] hover:underline"
                    >
                      Abrir tela de login Mercado Pago <ExternalLink className="size-3 ml-0.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SIMULADOR DE SPLIT FINANCEIRO */}
          <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <Percent className="size-3.5 text-primary" />
                Configuração da Taxa de Comissão da Plataforma (Split)
              </span>
              <span className="text-[10px] text-muted-foreground">Retenção no ato do pagamento</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="space-y-1 w-32">
                <Label htmlFor="taxaInput" className="text-[10px] text-muted-foreground">Comissão SaaS (%)</Label>
                <div className="relative">
                  <Input
                    id="taxaInput"
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={taxaEditada}
                    onChange={(e) => setTaxaEditada(parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs pr-6 rounded-lg font-bold"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-muted-foreground font-bold">%</span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleSalvarTaxa}
                className="mt-4 rounded-lg text-xs h-8"
              >
                Salvar Taxa
              </Button>
            </div>

            {/* Demonstrativo do Split */}
            <div className="p-3 rounded-lg bg-background border border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-md bg-muted/30">
                <span className="text-[10px] text-muted-foreground block">Valor da Consulta</span>
                <strong className="text-sm font-extrabold text-foreground">
                  {formatarMoeda(splitExemplo.valorTotal)}
                </strong>
              </div>

              <div className="p-2 rounded-md bg-teal-500/10 border border-teal-500/20">
                <span className="text-[10px] text-teal-700 dark:text-teal-300 block font-medium">
                  Repasse Direto ao Especialista ({100 - splitExemplo.taxaComissaoPercentual}%)
                </span>
                <strong className="text-sm font-extrabold text-teal-700 dark:text-teal-300">
                  {formatarMoeda(splitExemplo.valorLiquidoProfissional)}
                </strong>
              </div>

              <div className="p-2 rounded-md bg-primary/10 border border-primary/20">
                <span className="text-[10px] text-primary block font-medium">
                  Comissão Plataforma SaaS ({splitExemplo.taxaComissaoPercentual}%)
                </span>
                <strong className="text-sm font-extrabold text-primary">
                  {formatarMoeda(splitExemplo.valorComissaoSaaS)}
                </strong>
              </div>
            </div>
          </div>

          {/* HISTÓRICO RECENTE DE TRANSAÇÕES COM SPLIT */}
          {historicoSplits.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <ArrowRightLeft className="size-3.5 text-muted-foreground" />
                Últimas Transações com Split no Mercado Pago
              </span>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {historicoSplits.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="p-2 rounded-lg bg-card border border-border/60 flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <strong className="text-foreground">{t.residenteNome || 'Residente'}</strong>
                      <span className="text-[10px] text-muted-foreground block">
                        {new Date(t.criadoEm).toLocaleDateString('pt-BR')} · Método: {t.metodoPagamento.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-foreground block">
                        {formatarMoeda(t.valorTotal)}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        Médico: {formatarMoeda(t.valorLiquidoProfissional)} | SaaS: {formatarMoeda(t.valorComissaoSaaS)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
