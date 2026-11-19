import { useEffect, useMemo, useState } from 'react'
import type { Residente } from '../types/ilpi'
import { consumoDia, nivelEst, qtdPedir } from '../lib/business/estoque'
import { fmt, iso, num, primeiro } from '../lib/business/dates'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Label } from './ui/label'
import { StatusBadge } from './Ui'
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export type CanalPedido = 'familia' | 'popular' | 'comercial' | 'geral'

interface ModalPedidoEstoqueProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  residente: Residente | null
  itensIniciaisIds?: string[]
  usuarioNome?: string
  instituicaoNome?: string
}

const T = iso(new Date())

export function ModalPedidoEstoque({
  open,
  onOpenChange,
  residente,
  itensIniciaisIds = [],
  usuarioNome = 'Responsável Técnica (RT)',
  instituicaoNome = 'ILPI - Residencial para Idosos',
}: ModalPedidoEstoqueProps) {
  const [canal, setCanal] = useState<CanalPedido>('familia')
  const [buscaItem, setBuscaItem] = useState('')
  const [obsExtra, setObsExtra] = useState('')
  const [copiado, setCopiado] = useState(false)

  // Mapa de seleção: { [itemId]: { check: boolean; qtd: number } }
  const [selecao, setSelecao] = useState<Record<string, { check: boolean; qtd: number }>>({})

  const itensIniciaisKey = (itensIniciaisIds || []).join(',')

  // Inicializa a seleção quando o modal abre ou o residente muda
  useEffect(() => {
    if (!residente || !open) return

    const novaSelecao: Record<string, { check: boolean; qtd: number }> = {}
    const temIniciais = itensIniciaisIds && itensIniciaisIds.length > 0

    residente.estoque.forEach((it) => {
      const c = consumoDia(residente, it, T)
      const qSugerida = qtdPedir(c, it)
      const estaBaixo = nivelEst(c, it) !== 'ok'

      const check = temIniciais
        ? itensIniciaisIds.includes(it.id)
        : estaBaixo

      const qtdFinal = qSugerida > 0 ? qSugerida : it.min > 0 ? it.min : 1

      novaSelecao[it.id] = {
        check,
        qtd: qtdFinal,
      }
    })

    setSelecao(novaSelecao)
    setCopiado(false)
  }, [residente?.id, open, itensIniciaisKey])

  if (!residente) return null

  const itensFiltrados = useMemo(() => {
    if (!buscaItem.trim()) return residente.estoque
    const q = buscaItem.toLowerCase()
    return residente.estoque.filter((it) => it.nome.toLowerCase().includes(q))
  }, [residente.estoque, buscaItem])

  const itensSelecionadosList = useMemo(() => {
    return residente.estoque
      .filter((it) => selecao[it.id]?.check)
      .map((it) => ({
        ...it,
        qtdPedir: selecao[it.id]?.qtd || 1,
      }))
  }, [residente.estoque, selecao])

  function handleToggleItem(id: string, checked: boolean) {
    setSelecao((prev) => ({
      ...prev,
      [id]: {
        check: checked,
        qtd: prev[id]?.qtd || 1,
      },
    }))
  }

  function handleAlterarQtd(id: string, deltaOuValor: number, isDelta = false) {
    setSelecao((prev) => {
      const atual = prev[id]?.qtd || 1
      const novaQtd = isDelta ? Math.max(1, atual + deltaOuValor) : Math.max(1, deltaOuValor)
      return {
        ...prev,
        [id]: {
          check: prev[id]?.check ?? true,
          qtd: novaQtd,
        },
      }
    })
  }

  function selecionarTodos(marcar: boolean) {
    setSelecao((prev) => {
      const draft = { ...prev }
      residente?.estoque.forEach((it) => {
        draft[it.id] = {
          check: marcar,
          qtd: draft[it.id]?.qtd || 1,
        }
      })
      return draft
    })
  }

  function selecionarApenasBaixos() {
    setSelecao((prev) => {
      const draft = { ...prev }
      residente?.estoque.forEach((it) => {
        const c = consumoDia(residente, it, T)
        const baixo = nivelEst(c, it) !== 'ok'
        draft[it.id] = {
          check: baixo,
          qtd: draft[it.id]?.qtd || 1,
        }
      })
      return draft
    })
  }

  // Gera o texto personalizado conforme o canal e os itens selecionados
  const textoGerado = useMemo(() => {
    const dataFmt = fmt(T)
    const linhas = itensSelecionadosList.map(
      (it) => `• ${it.nome} — Quantidade: ${num(it.qtdPedir)} ${it.unid} (Saldo atual: ${it.qtd} ${it.unid})`
    )

    if (linhas.length === 0) {
      return 'Nenhum item selecionado para este pedido. Selecione um ou mais itens à esquerda.'
    }

    const obsTexto = obsExtra.trim() ? `\nObservação: ${obsExtra.trim()}` : ''

    switch (canal) {
      case 'familia': {
        const itensSimples = itensSelecionadosList.map(
          (it) => `• ${it.nome}: ${num(it.qtdPedir)} ${it.unid}`
        )
        return (
          `Olá! Notificação da equipe de enfermagem — ${primeiro(residente.nome)} (Quarto ${residente.quarto}):\n\n` +
          `Solicitamos a reposição dos seguintes itens de uso individual:\n` +
          `${itensSimples.join('\n')}\n` +
          `${obsTexto ? `${obsTexto}\n` : ''}\n` +
          `Favor entregar na instituição aos cuidados da enfermagem. Muito obrigado!`
        )
      }

      case 'popular': {
        return (
          `SOLICITAÇÃO DE MEDICAMENTOS — PROGRAMA FARMÁCIA POPULAR\n` +
          `Instituição: ${instituicaoNome}\n` +
          `Data: ${dataFmt}\n\n` +
          `Residente: ${residente.nome} (Quarto ${residente.quarto})\n` +
          (residente.responsavel?.nome ? `Responsável Legal: ${residente.responsavel.nome}\n` : '') +
          `\nMedicamentos para retirada:\n` +
          `${linhas.join('\n')}\n` +
          `${obsTexto ? `${obsTexto}\n` : ''}\n` +
          `Solicitante: ${usuarioNome}`
        )
      }

      case 'comercial': {
        return (
          `PEDIDO / COTAÇÃO DE MEDICAMENTOS E MATERIAIS\n` +
          `Instituição: ${instituicaoNome}\n` +
          `Data: ${dataFmt}\n\n` +
          `Residente: ${residente.nome} (Quarto ${residente.quarto})\n\n` +
          `Itens para compra / entrega:\n` +
          `${linhas.join('\n')}\n` +
          `${obsTexto ? `${obsTexto}\n` : ''}\n` +
          `Solicitado por: ${usuarioNome}`
        )
      }

      case 'geral':
      default: {
        return (
          `LISTA DE MEDICAMENTOS & MATERIAIS INDIVIDUAIS\n` +
          `Residente: ${residente.nome} (Quarto ${residente.quarto})\n` +
          `Data: ${dataFmt}\n\n` +
          `Itens:\n` +
          `${linhas.join('\n')}\n` +
          `${obsTexto}`
        )
      }
    }
  }, [canal, itensSelecionadosList, obsExtra, residente, instituicaoNome, usuarioNome])

  async function copiarTexto() {
    if (!itensSelecionadosList.length) {
      toast.warning('Selecione ao menos um item para copiar.')
      return
    }
    await navigator.clipboard.writeText(textoGerado)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
    toast.success('Texto do pedido copiado com sucesso!')
  }

  function abrirWhatsApp() {
    if (!itensSelecionadosList.length) {
      toast.warning('Selecione ao menos um item.')
      return
    }
    const tel = residente?.responsavel?.tel?.replace(/\D/g, '') || ''
    const ddi = tel.startsWith('55') ? tel : tel ? `55${tel}` : ''
    const url = ddi
      ? `https://api.whatsapp.com/send?phone=${ddi}&text=${encodeURIComponent(textoGerado)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(textoGerado)}`

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function imprimirPedido() {
    if (!itensSelecionadosList.length) {
      toast.warning('Selecione ao menos um item para imprimir.')
      return
    }

    const janela = window.open('', '_blank', 'width=800,height=600')
    if (!janela) {
      toast.error('Não foi possível abrir a janela de impressão.')
      return
    }

    const tituloCanal =
      canal === 'popular'
        ? 'Solicitação - Farmácia Popular'
        : canal === 'comercial'
        ? 'Pedido / Cotação - Farmácia Comercial'
        : canal === 'familia'
        ? 'Solicitação de Reposição - Família'
        : 'Lista de Medicamentos e Materiais'

    janela.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${tituloCanal} - ${residente?.nome}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          .sub { color: #555; font-size: 12px; margin-bottom: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
          .info { background: #f8f9fa; border: 1px solid #e9ecef; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
          th, td { border: 1px solid #dee2e6; padding: 8px 10px; text-align: left; }
          th { background: #e9ecef; }
          .obs { margin-top: 16px; padding: 10px; background: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; font-size: 12px; }
          .footer { margin-top: 24px; font-size: 11px; color: #777; border-top: 1px solid #eee; padding-top: 8px; }
        </style>
      </head>
      <body>
        <h1>${tituloCanal}</h1>
        <div class="sub">${instituicaoNome} — Emitido em ${fmt(T)}</div>
        
        <div class="info">
          <strong>Residente:</strong> ${residente?.nome} &nbsp;|&nbsp; <strong>Quarto:</strong> ${residente?.quarto}<br/>
          ${residente?.responsavel?.nome ? `<strong>Responsável:</strong> ${residente.responsavel.nome} ${residente.responsavel.tel ? `(${residente.responsavel.tel})` : ''}` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Material / Medicamento</th>
              <th>Quantidade a Solicitar</th>
              <th>Saldo Físico Atual</th>
            </tr>
          </thead>
          <tbody>
            ${itensSelecionadosList
              .map(
                (it) => `
              <tr>
                <td><strong>${it.nome}</strong></td>
                <td>${num(it.qtdPedir)} ${it.unid}</td>
                <td>${it.qtd} ${it.unid}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        ${obsExtra.trim() ? `<div class="obs"><strong>Observações:</strong> ${obsExtra.trim()}</div>` : ''}

        <div class="footer">
          Solicitado por: ${usuarioNome} &nbsp;|&nbsp; Sistema ILPI
        </div>

        <script>
          window.print();
        </script>
      </body>
      </html>
    `)
    janela.document.close()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] flex flex-col p-0 overflow-hidden border-border/80 shadow-2xl">
        {/* Cabeçalho Limpo e Espaçoso */}
        <DialogHeader className="p-4 sm:px-6 sm:py-4.5 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5 text-foreground">
                <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShoppingCart className="size-4.5 text-[#123F4A] dark:text-[#52B4BF]" />
                </div>
                <span>Gerar Pedido & Reposição de Estoque</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Residente: <strong className="text-foreground">{residente.nome}</strong> (Quarto {residente.quarto})
                {residente.responsavel?.nome && (
                  <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground">
                    · Resp: <strong className="text-foreground/90 font-medium">{residente.responsavel.nome}</strong>
                    {residente.responsavel.tel && <span>({residente.responsavel.tel})</span>}
                  </span>
                )}
              </DialogDescription>
            </div>

            <Badge
              variant="outline"
              className={cn(
                'self-start sm:self-auto text-xs px-2.5 py-1 font-semibold rounded-lg shrink-0',
                itensSelecionadosList.length > 0
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-muted border-border/60 text-muted-foreground'
              )}
            >
              {itensSelecionadosList.length} de {residente.estoque.length} selecionado(s)
            </Badge>
          </div>
        </DialogHeader>

        {/* Corpo Dividido em Duas Colunas (Desktop) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border/60">
          {/* COLUNA ESQUERDA: Destino + Seleção de Itens (7 colunas) */}
          <div className="lg:col-span-7 flex flex-col min-h-0 p-4 sm:p-5 overflow-y-auto space-y-4">
            {/* Destino do Pedido */}
            <div>
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                1. Onde será adquirido / Destino do Pedido:
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setCanal('familia')}
                  className={cn(
                    'flex flex-col items-center justify-center text-center p-2.5 rounded-xl border transition-all text-xs gap-1',
                    canal === 'familia'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-500 font-bold shadow-xs ring-1 ring-emerald-500/30'
                      : 'border-border/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Users className="size-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-xs">Pedir à Família</span>
                  <span className="text-[10px] opacity-75 font-normal">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCanal('popular')}
                  className={cn(
                    'flex flex-col items-center justify-center text-center p-2.5 rounded-xl border transition-all text-xs gap-1',
                    canal === 'popular'
                      ? 'border-blue-600 bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-500 font-bold shadow-xs ring-1 ring-blue-500/30'
                      : 'border-border/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Building2 className="size-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-xs">Farmácia Popular</span>
                  <span className="text-[10px] opacity-75 font-normal">Retirada SUS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCanal('comercial')}
                  className={cn(
                    'flex flex-col items-center justify-center text-center p-2.5 rounded-xl border transition-all text-xs gap-1',
                    canal === 'comercial'
                      ? 'border-amber-600 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-500 font-bold shadow-xs ring-1 ring-amber-500/30'
                      : 'border-border/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ShoppingCart className="size-4 text-amber-600 shrink-0" />
                  <span className="font-semibold text-xs">Farmácia Comercial</span>
                  <span className="text-[10px] opacity-75 font-normal">Cotação / Compra</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCanal('geral')}
                  className={cn(
                    'flex flex-col items-center justify-center text-center p-2.5 rounded-xl border transition-all text-xs gap-1',
                    canal === 'geral'
                      ? 'border-slate-600 bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-500 font-bold shadow-xs'
                      : 'border-border/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <FileText className="size-4 text-slate-600 shrink-0" />
                  <span className="font-semibold text-xs">Lista Geral</span>
                  <span className="text-[10px] opacity-75 font-normal">Conferência</span>
                </button>
              </div>
            </div>

            {/* Seleção de Medicamentos e Materiais */}
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  2. Selecione os itens a incluir:
                </Label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => selecionarTodos(true)}
                    className="h-6 text-[11px] rounded-lg"
                  >
                    Marcar Todos
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={selecionarApenasBaixos}
                    className="h-6 text-[11px] rounded-lg text-rose-700 dark:text-rose-300 font-medium"
                  >
                    Apenas em Falta
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => selecionarTodos(false)}
                    className="h-6 text-[11px] rounded-lg text-muted-foreground"
                  >
                    Limpar
                  </Button>
                </div>
              </div>

              {/* Filtro de Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Filtrar medicamento ou material..."
                  value={buscaItem}
                  onChange={(e) => setBuscaItem(e.target.value)}
                  className="h-8 pl-8 text-xs rounded-xl"
                />
              </div>

              {/* Lista dos Itens com Checkbox, Status e Ajuste de Quantidade */}
              <div className="border border-border/70 rounded-xl divide-y divide-border/40 max-h-64 sm:max-h-72 overflow-y-auto bg-card shadow-2xs">
                {itensFiltrados.map((it) => {
                  const c = consumoDia(residente, it, T)
                  const n = nivelEst(c, it)
                  const isSelected = !!selecao[it.id]?.check
                  const qtdAtual = selecao[it.id]?.qtd || 1

                  return (
                    <div
                      key={it.id}
                      className={cn(
                        'p-2.5 sm:px-3 flex items-center justify-between gap-3 transition-colors',
                        isSelected ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-muted/30'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          id={`chk_${it.id}`}
                          checked={isSelected}
                          onChange={(e) => handleToggleItem(it.id, e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer shrink-0"
                        />
                        <label htmlFor={`chk_${it.id}`} className="cursor-pointer min-w-0">
                          <span className="font-semibold text-xs sm:text-sm text-foreground block truncate">
                            {it.nome}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                            <span>Saldo: <strong>{it.qtd} {it.unid}</strong></span>
                            <span>· Mín: {it.min} {it.unid}</span>
                            <StatusBadge tone={n === 'ok' ? 'ok' : n === 'warn' ? 'warn' : 'danger'}>
                              {n === 'ok' ? 'Estoque OK' : n === 'warn' ? 'Alerta' : 'Crítico'}
                            </StatusBadge>
                          </span>
                        </label>
                      </div>

                      {/* Controle de Quantidade */}
                      <div className="flex items-center gap-1 shrink-0 bg-background/80 border border-border/60 rounded-lg p-0.5 shadow-2xs">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={!isSelected || qtdAtual <= 1}
                          onClick={() => handleAlterarQtd(it.id, -1, true)}
                          className="size-6 rounded text-muted-foreground hover:text-foreground"
                          title="Diminuir quantidade"
                        >
                          <Minus className="size-3" />
                        </Button>
                        <Input
                          id={`qtd_${it.id}`}
                          type="number"
                          min="1"
                          step="any"
                          value={qtdAtual}
                          onChange={(e) => handleAlterarQtd(it.id, Number(e.target.value))}
                          disabled={!isSelected}
                          className="w-12 h-6 text-xs text-center font-bold font-mono p-0 border-0 bg-transparent focus-visible:ring-0"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={!isSelected}
                          onClick={() => handleAlterarQtd(it.id, 1, true)}
                          className="size-6 rounded text-muted-foreground hover:text-foreground"
                          title="Aumentar quantidade"
                        >
                          <Plus className="size-3" />
                        </Button>
                        <span className="text-[10px] text-muted-foreground pr-1.5 font-medium">{it.unid}</span>
                      </div>
                    </div>
                  )
                })}

                {!itensFiltrados.length && (
                  <div className="p-6 text-center text-xs text-muted-foreground italic">
                    Nenhum item corresponde à busca.
                  </div>
                )}
              </div>
            </div>

            {/* Observação / Recado */}
            <div className="space-y-1 pt-1">
              <Label htmlFor="obsExtra" className="text-[11px] font-semibold text-muted-foreground">
                Observação adicional no pedido (opcional):
              </Label>
              <Input
                id="obsExtra"
                placeholder="Ex: Favor providenciar até sexta-feira / Entregar com nota fiscal..."
                value={obsExtra}
                onChange={(e) => setObsExtra(e.target.value)}
                className="h-8 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* COLUNA DIREITA: Prévia da Mensagem & Ações de Envio (5 colunas) */}
          <div className="lg:col-span-5 flex flex-col min-h-0 p-4 sm:p-5 bg-muted/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  3. Prévia do Pedido
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {canal === 'familia'
                    ? 'Mensagem WhatsApp'
                    : canal === 'popular'
                    ? 'Guia Farmácia Popular'
                    : canal === 'comercial'
                    ? 'Cotação / Farmácia'
                    : 'Lista Geral'}
                </span>
              </div>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={copiarTexto}
                disabled={!itensSelecionadosList.length}
                className="h-6 text-[11px] gap-1 font-semibold text-primary hover:text-primary/90"
              >
                {copiado ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
              </Button>
            </div>

            {/* Caixa de Texto da Mensagem */}
            <div className="flex-1 flex flex-col min-h-[180px] sm:min-h-[220px]">
              <textarea
                readOnly
                data-testid="preview-texto"
                value={textoGerado}
                className="w-full flex-1 p-3 text-xs font-mono bg-background border border-border/70 rounded-xl resize-none leading-relaxed text-foreground shadow-2xs focus:outline-none"
              />
            </div>

            {/* Botões de Ação na Coluna Direita */}
            <div className="space-y-2 pt-1">
              {canal === 'familia' ? (
                <Button
                  type="button"
                  size="default"
                  onClick={abrirWhatsApp}
                  disabled={!itensSelecionadosList.length}
                  className="w-full rounded-xl text-xs sm:text-sm font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-10"
                >
                  <ExternalLink className="size-4" />
                  <span>Enviar no WhatsApp</span>
                  {residente.responsavel?.nome && (
                    <span className="text-[11px] font-normal opacity-90 truncate max-w-[140px]">
                      ({primeiro(residente.responsavel.nome)})
                    </span>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="default"
                  onClick={copiarTexto}
                  disabled={!itensSelecionadosList.length}
                  className="w-full rounded-xl text-xs sm:text-sm font-bold gap-2 bg-[#123F4A] hover:bg-[#123F4A]/90 text-white shadow-sm h-10"
                >
                  {copiado ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                  <span>{copiado ? 'Texto Copiado com Sucesso!' : 'Copiar Lista do Pedido'}</span>
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={imprimirPedido}
                  disabled={!itensSelecionadosList.length}
                  className="rounded-xl text-xs gap-1.5 font-semibold bg-background"
                >
                  <Printer className="size-3.5" />
                  <span>Imprimir Guia</span>
                </Button>

                {canal === 'familia' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copiarTexto}
                    disabled={!itensSelecionadosList.length}
                    className="rounded-xl text-xs gap-1.5 font-semibold bg-background"
                  >
                    <Copy className="size-3.5" />
                    <span>Copiar Texto</span>
                  </Button>
                )}

                {canal !== 'familia' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    className="rounded-xl text-xs font-semibold bg-background"
                  >
                    Fechar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
