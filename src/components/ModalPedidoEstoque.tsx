import { useEffect, useMemo, useState } from 'react'
import type { Residente } from '../types/ilpi'
import { consumoDia, nivelEst, qtdPedir } from '../lib/business/estoque'
import { fmt, iso, num, primeiro } from '../lib/business/dates'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

  function handleAlterarQtd(id: string, novaQtd: number) {
    setSelecao((prev) => ({
      ...prev,
      [id]: {
        check: prev[id]?.check ?? true,
        qtd: Math.max(1, novaQtd),
      },
    }))
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
      return 'Nenhum item selecionado para este pedido. Selecione um ou mais itens acima.'
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
    toast.success('Texto do pedido copiado para a área de transferência!')
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 border-b border-border/40 bg-muted/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <ShoppingCart className="size-4.5 text-[#123F4A] dark:text-[#52B4BF]" />
                Gerar Pedido & Reposição de Estoque
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Residente: <strong className="text-foreground">{residente.nome}</strong> (Quarto {residente.quarto})
                {residente.responsavel?.nome && (
                  <span className="text-muted-foreground ml-2">
                    · Resp: {residente.responsavel.nome} {residente.responsavel.tel ? `(${residente.responsavel.tel})` : ''}
                  </span>
                )}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {itensSelecionadosList.length} de {residente.estoque.length} selecionado(s)
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Seletor de Destino / Canal */}
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Destino do Pedido / Onde será adquirido:
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setCanal('familia')}
                className={cn(
                  'flex flex-col items-center justify-center text-center p-2.5 rounded-xl border transition-all text-xs gap-1',
                  canal === 'familia'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-500 font-bold shadow-xs'
                    : 'border-border/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                )}
              >
                <Users className="size-4 text-emerald-600 shrink-0" />
                <span>Pedir à Família</span>
                <span className="text-[10px] font-normal opacity-80">(WhatsApp)</span>
              </button>

              <button
                type="button"
                onClick={() => setCanal('popular')}
                className={cn(
                  'flex flex-col items-center justify-center text-center p-2.5 rounded-xl border transition-all text-xs gap-1',
                  canal === 'popular'
                    ? 'border-blue-600 bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-500 font-bold shadow-xs'
                    : 'border-border/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                )}
              >
                <Building2 className="size-4 text-blue-600 shrink-0" />
                <span>Farmácia Popular</span>
                <span className="text-[10px] font-normal opacity-80">(SUS / Retirada)</span>
              </button>

              <button
                type="button"
                onClick={() => setCanal('comercial')}
                className={cn(
                  'flex flex-col items-center justify-center text-center p-2.5 rounded-xl border transition-all text-xs gap-1',
                  canal === 'comercial'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-500 font-bold shadow-xs'
                    : 'border-border/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                )}
              >
                <ShoppingCart className="size-4 text-amber-600 shrink-0" />
                <span>Farmácia Comercial</span>
                <span className="text-[10px] font-normal opacity-80">(Compra / Cotação)</span>
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
                <span>Lista Geral</span>
                <span className="text-[10px] font-normal opacity-80">(Texto simples)</span>
              </button>
            </div>
          </div>

          {/* Seleção de Itens */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => selecionarTodos(true)}
                  className="h-6 text-[11px] rounded-lg"
                >
                  Selecionar Todos
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={selecionarApenasBaixos}
                  className="h-6 text-[11px] rounded-lg text-rose-700 dark:text-rose-300"
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
                  Limpar Seleção
                </Button>
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Filtrar item..."
                  value={buscaItem}
                  onChange={(e) => setBuscaItem(e.target.value)}
                  className="h-6 pl-7 text-[11px] rounded-lg"
                />
              </div>
            </div>

            {/* Lista dos Itens com Checkbox e Quantidade */}
            <div className="border border-border/70 rounded-xl overflow-hidden divide-y divide-border/40 max-h-56 overflow-y-auto bg-card">
              {itensFiltrados.map((it) => {
                const c = consumoDia(residente, it, T)
                const n = nivelEst(c, it)
                const isSelected = !!selecao[it.id]?.check
                const qtdAtual = selecao[it.id]?.qtd || 1

                return (
                  <div
                    key={it.id}
                    className={cn(
                      'p-2.5 flex items-center justify-between gap-2 transition-colors',
                      isSelected ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        id={`chk_${it.id}`}
                        checked={isSelected}
                        onChange={(e) => handleToggleItem(it.id, e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer shrink-0"
                      />
                      <label htmlFor={`chk_${it.id}`} className="cursor-pointer min-w-0">
                        <span className="font-semibold text-xs text-foreground block truncate">
                          {it.nome}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                          <span>Saldo: <strong>{it.qtd} {it.unid}</strong></span>
                          <span>· Mín: {it.min} {it.unid}</span>
                          <StatusBadge tone={n === 'ok' ? 'ok' : n === 'warn' ? 'warn' : 'danger'}>
                            {n === 'ok' ? 'OK' : n === 'warn' ? 'Alerta' : 'Crítico'}
                          </StatusBadge>
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Label htmlFor={`qtd_${it.id}`} className="text-[11px] text-muted-foreground">
                        Qtd:
                      </Label>
                      <Input
                        id={`qtd_${it.id}`}
                        type="number"
                        min="1"
                        step="any"
                        value={qtdAtual}
                        onChange={(e) => handleAlterarQtd(it.id, Number(e.target.value))}
                        disabled={!isSelected}
                        className="w-16 h-7 text-xs text-center font-bold font-mono rounded-lg"
                      />
                      <span className="text-[11px] text-muted-foreground w-6">{it.unid}</span>
                    </div>
                  </div>
                )
              })}

              {!itensFiltrados.length && (
                <div className="p-4 text-center text-xs text-muted-foreground italic">
                  Nenhum item corresponde à busca.
                </div>
              )}
            </div>
          </div>

          {/* Observação Adicional */}
          <div className="space-y-1">
            <Label htmlFor="obsExtra" className="text-[11px] font-semibold text-muted-foreground">
              Observação adicional ou recado (opcional):
            </Label>
            <Input
              id="obsExtra"
              placeholder="Ex: Favor providenciar até sexta-feira / Receita médica já anexada na recepção..."
              value={obsExtra}
              onChange={(e) => setObsExtra(e.target.value)}
              className="h-8 text-xs rounded-lg"
            />
          </div>

          {/* Prévia da Mensagem Formatada */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Prévia da Mensagem / Pedido ({itensSelecionadosList.length} itens)
              </Label>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={copiarTexto}
                className="h-6 text-[11px] gap-1 font-semibold text-primary"
              >
                {copiado ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
              </Button>
            </div>
            <textarea
              readOnly
              data-testid="preview-texto"
              value={textoGerado}
              className="w-full h-28 text-[11px] font-mono bg-muted/30 border border-border/60 rounded-xl p-2.5 resize-none leading-relaxed text-foreground focus:outline-none"
            />
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-5 border-t border-border/40 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Fechar
          </Button>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={imprimirPedido}
              disabled={!itensSelecionadosList.length}
              className="rounded-xl text-xs gap-1.5 font-semibold"
            >
              <Printer className="size-3.5" />
              <span>Imprimir</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copiarTexto}
              disabled={!itensSelecionadosList.length}
              className="rounded-xl text-xs gap-1.5 font-semibold"
            >
              {copiado ? <CheckCircle2 className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              <span>{copiado ? 'Texto Copiado!' : 'Copiar Mensagem'}</span>
            </Button>

            {canal === 'familia' && (
              <Button
                type="button"
                size="sm"
                onClick={abrirWhatsApp}
                disabled={!itensSelecionadosList.length}
                className="rounded-xl text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                <ExternalLink className="size-3.5" />
                <span>Abrir WhatsApp</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
