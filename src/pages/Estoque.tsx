import { useMemo, useState } from 'react'
import type { Residente } from '../types/ilpi'
import { agoraHM, fmt, iso, num } from '../lib/business/dates'
import { consumoDia, diasRest, nivelEst, qtdPedir } from '../lib/business/estoque'
import { can } from '../lib/permissions'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { Avatar, EmptyState, PageHeader, StatusBadge } from '../components/Ui'
import { ModalPedidoEstoque } from '../components/ModalPedidoEstoque'
import { OrigemItemSelect } from '../components/OrigemItemSelect'
import { BadgeTipoEstoque } from '../components/BadgeTipoEstoque'
import { classificarTipoItem } from '../lib/business/categoriaEstoque'
import { salvarOrigemItem } from '../lib/business/origemEstoque'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { SearchableSelect } from '../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  Package,
  Plus,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const T = iso(new Date())

interface ItemComOrigem {
  id: string
  nome: string
  unid: string
  qtd: number
  min: number
  residenteId?: string
  residenteNome?: string
}

export default function Estoque() {
  const data = useIlpiData()
  const { residentes } = data
  const { profissional } = useAuth()
  const [busca, setBusca] = useState('')
  const [apenasEmFalta, setApenasEmFalta] = useState(false)

  // Modais de ação
  const [modalEntrada, setModalEntrada] = useState(false)
  const [modalNovoItem, setModalNovoItem] = useState(false)
  const [modalAjuste, setModalAjuste] = useState<ItemComOrigem | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Estados do formulário de Entrada Individual
  const [entradaResId, setEntradaResId] = useState('')
  const [entradaItemId, setEntradaItemId] = useState('')
  const [entradaQtd, setEntradaQtd] = useState('')
  const [entradaObs, setEntradaObs] = useState('')

  // Estados do formulário de Novo Item Individual
  const [novoResId, setNovoResId] = useState('')
  const [novoNome, setNovoNome] = useState('')
  const [novoUnidade, setNovoUnidade] = useState('un')
  const [novoQtd, setNovoQtd] = useState('0')
  const [novoMin, setNovoMin] = useState('7')
  const [novoConsumoDia, setNovoConsumoDia] = useState('')
  const [novoOrigem, setNovoOrigem] = useState('Farmácia Comercial')

  // Estados de Ajuste
  const [ajusteQtd, setAjusteQtd] = useState('')
  const [ajusteMotivo, setAjusteMotivo] = useState('')

  // Pedido & Seleção de Itens (Farmácia, Farmácia Popular, Família)
  const [modalPedidoRes, setModalPedidoRes] = useState<Residente | null>(null)
  const [itensSelecionadosPorRes, setItensSelecionadosPorRes] = useState<Record<string, string[]>>({})

  function toggleItemTabela(resId: string, itemId: string, checked: boolean) {
    setItensSelecionadosPorRes((prev) => {
      const atuais = prev[resId] || []
      const novos = checked ? [...atuais, itemId] : atuais.filter((id) => id !== itemId)
      return { ...prev, [resId]: novos }
    })
  }

  function toggleTodosTabela(r: Residente, checked: boolean) {
    setItensSelecionadosPorRes((prev) => {
      return {
        ...prev,
        [r.id]: checked ? r.estoque.map((it) => it.id) : [],
      }
    })
  }

  const residentesAtivos = useMemo(() => {
    return residentes.filter((r) => r.status !== 'obito')
  }, [residentes])

  // Estatísticas agregadas do estoque individual
  const { criticos, alertas, emDia, totalItens } = useMemo(() => {
    let crit = 0
    let al = 0
    let ok = 0
    let total = 0
    residentesAtivos.forEach((r) => {
      r.estoque.forEach((it) => {
        total++
        const c = consumoDia(r, it, T)
        const d = diasRest(c, it.qtd)
        if (d <= 3) crit++
        else if (d <= 7) al++
        else ok++
      })
    })
    return { criticos: crit, alertas: al, emDia: ok, totalItens: total }
  }, [residentesAtivos])

  const residentesFiltrados = useMemo(() => {
    let list = residentesAtivos

    if (apenasEmFalta) {
      list = list.filter((r) =>
        r.estoque.some((it) => {
          const c = consumoDia(r, it, T)
          return nivelEst(c, it) !== 'ok'
        })
      )
    }

    if (!busca.trim()) return list
    const q = busca.toLowerCase()
    return list.filter((r) => {
      const matchRes = r.nome.toLowerCase().includes(q) || (r.quarto?.toLowerCase().includes(q) ?? false)
      const matchItem = r.estoque.some((it) => it.nome.toLowerCase().includes(q))
      return matchRes || matchItem
    })
  }, [residentesAtivos, busca, apenasEmFalta])

  async function copiarListaReposicaoGeral() {
    const blocos: string[] = []
    residentesAtivos.forEach((r) => {
      const respInfo = r.responsavel?.nome
        ? ` · Contato: ${r.responsavel.nome} (${r.responsavel.tel || 'sem tel'})`
        : ''

      const meds = r.estoque.filter((it) => {
        const c = consumoDia(r, it, T)
        return classificarTipoItem(it.id, it.nome) === 'medicamento' && qtdPedir(c, it) > 0
      })

      const higs = r.estoque.filter((it) => {
        const c = consumoDia(r, it, T)
        return classificarTipoItem(it.id, it.nome) === 'higiene' && qtdPedir(c, it) > 0
      })

      if (meds.length > 0 || higs.length > 0) {
        const subBlocos: string[] = []
        if (meds.length > 0) {
          subBlocos.push(
            `  💊 MEDICAMENTOS:\n` +
              meds
                .map((it) => {
                  const c = consumoDia(r, it, T)
                  const q = qtdPedir(c, it)
                  return `    • ${it.nome}: repor ${num(q)} ${it.unid} (saldo: ${it.qtd} ${it.unid})`
                })
                .join('\n')
          )
        }
        if (higs.length > 0) {
          subBlocos.push(
            `  🧴 HIGIENE & CUIDADOS:\n` +
              higs
                .map((it) => {
                  const c = consumoDia(r, it, T)
                  const q = qtdPedir(c, it)
                  return `    • ${it.nome}: repor ${num(q)} ${it.unid} (saldo: ${it.qtd} ${it.unid})`
                })
                .join('\n')
          )
        }
        blocos.push(`👤 ${r.nome} (Quarto ${r.quarto})${respInfo}:\n${subBlocos.join('\n')}`)
      }
    })

    if (!blocos.length) {
      toast.info('Todos os residentes estão com estoque individual em dia!')
      return
    }

    const t = `Lista Geral de Reposição Individual (Famílias) — ${fmt(T)}:\n\n${blocos.join('\n\n')}\n\nGerado pelo Sistema ILPI.`
    await navigator.clipboard.writeText(t)
    toast.success('Lista de reposição das famílias copiada com sucesso!')
  }

  function abrirEntradaRapida(item: ItemComOrigem) {
    setEntradaResId(item.residenteId || '')
    setEntradaItemId(item.id)
    setEntradaQtd('')
    setEntradaObs('')
    setModalEntrada(true)
  }

  async function handleSalvarEntrada(e: React.FormEvent) {
    e.preventDefault()
    const qtdNum = Number(entradaQtd)
    if (!entradaItemId || qtdNum <= 0 || !profissional) {
      toast.error('Informe a quantidade recebida.')
      return
    }

    setSalvando(true)

    // 1. Registra a entrada no Supabase
    const { error: errEnt } = await supabase.from('entradas_estoque').insert({
      item_id: entradaItemId,
      data: T,
      quantidade: qtdNum,
      obs: entradaObs.trim(),
      assinatura: { id: profissional.id, d: T, h: agoraHM() },
    })

    if (errEnt) {
      setSalvando(false)
      toast.error('Erro ao registrar entrada no Supabase: ' + errEnt.message)
      return
    }

    // 2. Atualiza saldo em itens_estoque
    const { data: itemAtual } = await supabase
      .from('itens_estoque')
      .select('quantidade')
      .eq('id', entradaItemId)
      .maybeSingle()

    const saldoNovo = Number(itemAtual?.quantidade ?? 0) + qtdNum
    const { error: errUpd } = await supabase
      .from('itens_estoque')
      .update({ quantidade: saldoNovo })
      .eq('id', entradaItemId)

    setSalvando(false)

    if (errUpd) {
      toast.error('Entrada registrada, mas erro ao atualizar saldo: ' + errUpd.message)
      return
    }

    toast.success(`Entrada de +${qtdNum} registrada com sucesso no estoque do residente!`)
    setModalEntrada(false)
    setEntradaQtd('')
    setEntradaObs('')
    await data.refresh()
  }

  async function handleSalvarNovoItem(e: React.FormEvent) {
    e.preventDefault()
    if (!novoNome.trim() || !profissional) {
      toast.error('Informe o nome do item / medicamento / material.')
      return
    }
    if (!novoResId) {
      toast.error('Selecione o residente correspondente.')
      return
    }

    setSalvando(true)
    const id = `${novoResId}_e_` + Math.random().toString(36).substring(2, 7)
    const qtdInicial = Number(novoQtd) || 0
    const minCalculado = Number(novoMin) || 0
    const consDiaNum = novoConsumoDia ? Number(novoConsumoDia) : null

    const { error } = await supabase.from('itens_estoque').insert({
      id,
      residente_id: novoResId,
      escopo: 'residente',
      nome: novoNome.trim(),
      unidade: novoUnidade.trim(),
      quantidade: qtdInicial,
      minimo: minCalculado,
      consumo_dia: consDiaNum,
    })

    setSalvando(false)

    if (error) {
      toast.error('Erro ao cadastrar item no Supabase: ' + error.message)
      return
    }

    salvarOrigemItem(id, novoOrigem)
    toast.success('Item cadastrado com sucesso no estoque individual!')
    setModalNovoItem(false)
    setNovoNome('')
    setNovoQtd('0')
    setNovoConsumoDia('')
    setNovoOrigem('Farmácia Comercial')
    await data.refresh()
  }

  async function handleSalvarAjuste(e: React.FormEvent) {
    e.preventDefault()
    if (!modalAjuste || !profissional) return
    const qtdNum = Number(ajusteQtd)
    if (Number.isNaN(qtdNum) || qtdNum < 0) {
      toast.error('Informe uma quantidade válida.')
      return
    }

    setSalvando(true)
    const { error } = await supabase
      .from('itens_estoque')
      .update({ quantidade: qtdNum })
      .eq('id', modalAjuste.id)
    setSalvando(false)

    if (error) {
      toast.error('Erro ao retificar saldo no Supabase: ' + error.message)
      return
    }

    toast.success(`Saldo retificado para ${qtdNum} ${modalAjuste.unid}!`)
    setModalAjuste(null)
    setAjusteQtd('')
    setAjusteMotivo('')
    await data.refresh()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de Estoque & Materiais Individuais"
        lede="Medicamentos, produtos de higiene (shampoo, sabonete) e materiais de cuidados de uso individual de cada residente."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {can(profissional?.cat ?? 'cuid', 'estoque') && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    const primeiroResId = residentesAtivos[0]?.id || ''
                    setEntradaResId(primeiroResId)
                    const prim = data.getResidente(primeiroResId)
                    setEntradaItemId(prim?.estoque[0]?.id || '')
                    setModalEntrada(true)
                  }}
                  className="rounded-xl text-xs font-semibold gap-1.5 bg-[#123F4A] hover:bg-[#123F4A]/90 text-white shadow-xs"
                >
                  <ArrowDownToLine className="size-3.5" />
                  <span>+ Dar Entrada</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNovoResId(residentesAtivos[0]?.id || '')
                    setModalNovoItem(true)
                  }}
                  className="rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Plus className="size-3.5" />
                  <span>+ Novo Item / Material</span>
                </Button>
              </>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => void copiarListaReposicaoGeral()}
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              <ShoppingCart className="size-3.5" />
              <span>Lista de Reposição (Famílias)</span>
            </Button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Itens Críticos (≤ 3 dias)
              </span>
              <span className={cn('text-xl font-bold', criticos > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground')}>
                {criticos}
              </span>
            </div>
            <div className={cn('size-8 rounded-lg flex items-center justify-center', criticos > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-muted text-muted-foreground')}>
              <AlertTriangle className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Em Alerta (4–7 dias)
              </span>
              <span className={cn('text-xl font-bold', alertas > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>
                {alertas}
              </span>
            </div>
            <div className={cn('size-8 rounded-lg flex items-center justify-center', alertas > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground')}>
              <Package className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Estoque Regular (&gt; 7 dias)
              </span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {emDia}
              </span>
            </div>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Total de Residentes
              </span>
              <span className="text-xl font-bold text-foreground">
                {residentesAtivos.length} <span className="text-xs font-normal text-muted-foreground">({totalItens} itens)</span>
              </span>
            </div>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border/70 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/40">
          <Button
            size="xs"
            variant={apenasEmFalta ? 'default' : 'ghost'}
            onClick={() => setApenasEmFalta(true)}
            className="text-xs rounded-lg h-7 px-3 font-semibold"
          >
            Apenas com Itens em Falta {criticos + alertas > 0 && `(${criticos + alertas})`}
          </Button>
          <Button
            size="xs"
            variant={!apenasEmFalta ? 'default' : 'ghost'}
            onClick={() => setApenasEmFalta(false)}
            className="text-xs rounded-lg h-7 px-3 font-semibold"
          >
            Todos os Residentes
          </Button>
        </div>

        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por residente ou material (shampoo, fralda, medicamento)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-8 text-xs rounded-xl bg-background w-full"
          />
        </div>
      </div>

      {/* Lista de Residentes com seus respectivos estoques individuais */}
      <div className="space-y-4">
        {residentesFiltrados.map((r) => {
          const itensBaixos = r.estoque.filter((it) => {
            const c = consumoDia(r, it, T)
            return nivelEst(c, it) !== 'ok'
          }).length

          return (
            <Card key={r.id} className="border border-border/70 shadow-2xs overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
                <div className="flex items-center gap-3">
                  <Avatar r={r} size="sm" />
                  <div>
                    <CardTitle className="text-sm font-bold font-heading">{r.nome}</CardTitle>
                    <span className="text-[11px] text-muted-foreground">
                      Quarto {r.quarto} {r.responsavel?.nome ? `· Resp: ${r.responsavel.nome}` : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {itensBaixos > 0 && (
                    <Badge variant="destructive" className="text-[10px]">
                      {itensBaixos} item(ns) para reposição
                    </Badge>
                  )}
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setModalPedidoRes(r)}
                    className="rounded-lg text-xs gap-1.5 font-semibold bg-background hover:bg-muted"
                    title="Gerar pedido de reposição (Farmácia comercial, Farmácia Popular ou WhatsApp da família)"
                  >
                    <ShoppingCart className="size-3 text-[#123F4A] dark:text-[#52B4BF]" />
                    <span>
                      {(itensSelecionadosPorRes[r.id]?.length ?? 0) > 0
                        ? `Pedir Itens (${itensSelecionadosPorRes[r.id]?.length})`
                        : 'Pedir à família / Farmácia'}
                    </span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="w-8 px-3">
                        <input
                          type="checkbox"
                          title="Selecionar todos os itens deste residente"
                          checked={
                            r.estoque.length > 0 &&
                            (itensSelecionadosPorRes[r.id]?.length ?? 0) === r.estoque.length
                          }
                          onChange={(e) => toggleTodosTabela(r, e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer align-middle"
                        />
                      </TableHead>
                      <TableHead className="text-xs font-semibold">Material / Medicamento</TableHead>
                      <TableHead className="text-xs font-semibold">Saldo Atual</TableHead>
                      <TableHead className="text-xs font-semibold">Estoque Mínimo</TableHead>
                      <TableHead className="text-xs font-semibold">Consumo/Dia</TableHead>
                      <TableHead className="text-xs font-semibold">Autonomia Prevista</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {r.estoque.map((it) => {
                      const c = consumoDia(r, it, T)
                      const n = nivelEst(c, it)
                      const d = diasRest(c, it.qtd)
                      const isSelected = (itensSelecionadosPorRes[r.id] || []).includes(it.id)
                      const tipo = classificarTipoItem(it.id, it.nome)

                      return (
                        <TableRow
                          key={it.id}
                          className={cn(
                            tipo === 'medicamento'
                              ? 'border-l-4 border-l-indigo-500 bg-indigo-500/[0.02]'
                              : 'border-l-4 border-l-teal-500 bg-teal-500/[0.02]',
                            isSelected && 'bg-primary/5 dark:bg-primary/10'
                          )}
                        >
                          <TableCell className="w-8 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleItemTabela(r.id, it.id, e.target.checked)}
                              className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer align-middle"
                            />
                          </TableCell>
                          <TableCell className="font-bold text-xs text-foreground">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{it.nome}</span>
                              <BadgeTipoEstoque itemId={it.id} nomeItem={it.nome} />
                              <OrigemItemSelect itemId={it.id} nomeItem={it.nome} />
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-foreground">
                            {it.qtd} {it.unid}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {it.min} {it.unid}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {c > 0 ? `${c.toFixed(1)} ${it.unid}/dia` : '–'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge tone={n === 'ok' ? 'ok' : n === 'warn' ? 'warn' : 'danger'}>
                              {Number.isFinite(d) ? `${Math.floor(d)} dias` : '–'}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="text-right">
                            {can(profissional?.cat ?? 'cuid', 'estoque') && (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() =>
                                    abrirEntradaRapida({
                                      ...it,
                                      residenteId: r.id,
                                      residenteNome: r.nome,
                                    })
                                  }
                                  className="h-6 px-2 text-[11px] gap-1 font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                                  title="Dar entrada de nova remessa entregue pela família"
                                >
                                  <ArrowDownToLine className="size-3" />
                                  <span>+ Entrada</span>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setModalAjuste({ ...it, residenteId: r.id, residenteNome: r.nome })
                                    setAjusteQtd(String(it.qtd))
                                  }}
                                  className="size-6 text-muted-foreground hover:text-foreground"
                                  title="Retificar saldo físico"
                                >
                                  <SlidersHorizontal className="size-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {!r.estoque.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-xs text-muted-foreground italic">
                          Nenhum material ou medicamento cadastrado para este residente.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })}

        {!residentesFiltrados.length && (
          <EmptyState title="Nenhum residente ou material encontrado">
            Tente alterar os termos de busca ou desativar o filtro de itens em falta.
          </EmptyState>
        )}
      </div>

      {/* Modal: Lançar Entrada de Estoque Individual */}
      <Dialog open={modalEntrada} onOpenChange={setModalEntrada}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSalvarEntrada}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <ArrowDownToLine className="size-4 text-emerald-600" />
                Registrar Entrada de Material / Medicamento
              </DialogTitle>
              <DialogDescription className="text-xs">
                Lançamento de fraldas, shampoo, produtos de higiene ou medicamentos entregues pela família do residente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="entRes" className="text-[11px] font-semibold">Residente *</Label>
                <SearchableSelect
                  id="entRes"
                  value={entradaResId}
                  onValueChange={(novoId) => {
                    setEntradaResId(novoId)
                    const r = data.getResidente(novoId)
                    setEntradaItemId(r?.estoque[0]?.id || '')
                  }}
                  placeholder="Selecione o residente..."
                  searchPlaceholder="Buscar por nome ou quarto..."
                  options={[...residentesAtivos]
                    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                    .map((r) => ({
                      value: r.id,
                      label: `${r.nome} (Quarto ${r.quarto})`,
                      keywords: [r.quarto || ''],
                    }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="entItem" className="text-[11px] font-semibold">Material / Medicamento *</Label>
                <SearchableSelect
                  id="entItem"
                  value={entradaItemId}
                  onValueChange={setEntradaItemId}
                  placeholder="Selecione o item..."
                  searchPlaceholder="Buscar material ou medicamento..."
                  emptyMessage="Nenhum item cadastrado no estoque deste residente"
                  options={[...(data.getResidente(entradaResId)?.estoque ?? [])]
                    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                    .map((it) => ({
                      value: it.id,
                      label: it.nome,
                      description: `Saldo atual: ${it.qtd} ${it.unid}`,
                    }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="entQtd" className="text-[11px] font-semibold">Quantidade Recebida *</Label>
                  <Input
                    id="entQtd"
                    type="number"
                    min="1"
                    step="any"
                    value={entradaQtd}
                    onChange={(e) => setEntradaQtd(e.target.value)}
                    placeholder="Ex: 5"
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="entObs" className="text-[11px] font-semibold">Observações</Label>
                  <Input
                    id="entObs"
                    value={entradaObs}
                    onChange={(e) => setEntradaObs(e.target.value)}
                    placeholder="Ex: Trazido pela filha Joana"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalEntrada(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvando}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                {salvando ? 'Salvando...' : 'Confirmar Entrada'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Cadastrar Novo Item Individual */}
      <Dialog open={modalNovoItem} onOpenChange={setModalNovoItem}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSalvarNovoItem}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="size-4 text-[#123F4A]" />
                Cadastrar Material ou Medicamento Individual
              </DialogTitle>
              <DialogDescription className="text-xs">
                Cadastre fraldas, shampoo, sabonete, hidratante, pomadas ou medicamentos de uso individual do residente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="novoRes" className="text-[11px] font-semibold">Residente *</Label>
                <SearchableSelect
                  id="novoRes"
                  value={novoResId}
                  onValueChange={setNovoResId}
                  placeholder="Selecione o residente..."
                  searchPlaceholder="Buscar por nome ou quarto..."
                  options={[...residentesAtivos]
                    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                    .map((r) => ({
                      value: r.id,
                      label: `${r.nome} (Quarto ${r.quarto})`,
                      keywords: [r.quarto || ''],
                    }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="novoNome" className="text-[11px] font-semibold">Nome do Material / Insumo / Medicamento *</Label>
                <Input
                  id="novoNome"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Shampoo Neutro, Fralda Geriátrica G, Sabonete Líquido..."
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="novoUn" className="text-[11px] font-semibold">Unidade</Label>
                  <SearchableSelect
                    id="novoUn"
                    value={novoUnidade}
                    onValueChange={setNovoUnidade}
                    searchPlaceholder="Buscar unidade..."
                    options={[
                      { value: 'cx', label: 'caixa (cx)' },
                      { value: 'frasco', label: 'frasco' },
                      { value: 'pacote', label: 'pacote (pct)' },
                      { value: 'rolo', label: 'rolo' },
                      { value: 'sachê', label: 'sachê' },
                      { value: 'tubo', label: 'tubo / bisnaga' },
                      { value: 'un', label: 'unidade (un)' },
                    ]}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="novoQtd" className="text-[11px] font-semibold">Saldo Inicial</Label>
                  <Input
                    id="novoQtd"
                    type="number"
                    min="0"
                    step="any"
                    value={novoQtd}
                    onChange={(e) => setNovoQtd(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="novoMin" className="text-[11px] font-semibold">Estoque Mínimo</Label>
                  <Input
                    id="novoMin"
                    type="number"
                    min="0"
                    step="any"
                    value={novoMin}
                    onChange={(e) => setNovoMin(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="novoConsumo" className="text-[11px] font-semibold">Consumo Estimado / Dia (opcional)</Label>
                <Input
                  id="novoConsumo"
                  type="number"
                  step="0.1"
                  min="0"
                  value={novoConsumoDia}
                  onChange={(e) => setNovoConsumoDia(e.target.value)}
                  placeholder="Ex: 4 (para fraldas) ou 0.1 (para shampoo)"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="novoOrigem" className="text-[11px] font-semibold">Origem / Onde é Adquirido *</Label>
                <SearchableSelect
                  id="novoOrigem"
                  value={novoOrigem}
                  onValueChange={setNovoOrigem}
                  searchPlaceholder="Buscar canal de origem..."
                  options={[
                    { value: 'Familiar', label: 'Familiar', description: 'Entregue pela família' },
                    { value: 'Farmácia Comercial', label: 'Farmácia Comercial', description: 'Compra / Cotação' },
                    { value: 'Farmácia Popular', label: 'Farmácia Popular', description: 'Retirada SUS' },
                    { value: 'Instituição', label: 'Instituição', description: 'Uso geral da casa' },
                  ]}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalNovoItem(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvando}
                className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold"
              >
                {salvando ? 'Cadastrando...' : 'Cadastrar Material'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Ajuste / Retificação de Saldo Físico */}
      <Dialog open={!!modalAjuste} onOpenChange={(v) => !v && setModalAjuste(null)}>
        <DialogContent className="max-w-md">
          {modalAjuste && (
            <form onSubmit={handleSalvarAjuste}>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-[#123F4A]" />
                  Ajuste de Inventário — {modalAjuste.nome}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Residente: <strong>{modalAjuste.residenteNome}</strong>.
                  Retifique o saldo físico real do item individual conferido no armário do residente.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex justify-between">
                  <span className="text-muted-foreground">Saldo Atual Registrado:</span>
                  <span className="font-bold text-foreground">
                    {modalAjuste.qtd} {modalAjuste.unid}
                  </span>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ajQtd" className="text-[11px] font-semibold">Novo Saldo Real Contado *</Label>
                  <Input
                    id="ajQtd"
                    type="number"
                    min="0"
                    step="any"
                    value={ajusteQtd}
                    onChange={(e) => setAjusteQtd(e.target.value)}
                    required
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ajMot" className="text-[11px] font-semibold">Motivo do Ajuste (opcional)</Label>
                  <Input
                    id="ajMot"
                    value={ajusteMotivo}
                    onChange={(e) => setAjusteMotivo(e.target.value)}
                    placeholder="Ex: Auditoria mensal, produto danificado..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => setModalAjuste(null)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={salvando}
                  className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold"
                >
                  {salvando ? 'Salvando...' : 'Retificar Saldo'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Gerar Pedido / Reposição de Estoque com seleção de itens e canais */}
      <ModalPedidoEstoque
        open={!!modalPedidoRes}
        onOpenChange={(aberto) => !aberto && setModalPedidoRes(null)}
        residente={modalPedidoRes}
        itensIniciaisIds={modalPedidoRes ? itensSelecionadosPorRes[modalPedidoRes.id] : []}
        usuarioNome={profissional?.nome || 'Responsável Técnica (RT)'}
        instituicaoNome={data.inst || 'ILPI - Residencial para Idosos'}
      />
    </div>
  )
}
