import { useMemo, useState } from 'react'
import { consumoDia, diasRest, nivelEst, qtdPedir } from '../lib/business/estoque'
import { agoraHM, fmt, iso, num, primeiro } from '../lib/business/dates'
import { can } from '../lib/permissions'
import { supabase } from '../lib/supabase'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { useAuth } from '../contexts/AuthContext'
import { Avatar, EmptyState, PageHeader, StatusBadge } from '../components/Ui'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
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
  Copy,
  Package,
  PackageCheck,
  Plus,
  Search,
  Share2,
  ShoppingCart,
  SlidersHorizontal,
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
  const { residentes, casa } = data
  const { profissional } = useAuth()
  const [busca, setBusca] = useState('')
  const [abaEstoque, setAbaEstoque] = useState<'residentes' | 'casa'>('residentes')

  // Modais de ação no Supabase
  const [modalEntrada, setModalEntrada] = useState(false)
  const [modalNovoItem, setModalNovoItem] = useState(false)
  const [modalAjuste, setModalAjuste] = useState<ItemComOrigem | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Estados do formulário de Entrada
  const [entradaEscopo, setEntradaEscopo] = useState<'residente' | 'casa'>('residente')
  const [entradaResId, setEntradaResId] = useState('')
  const [entradaItemId, setEntradaItemId] = useState('')
  const [entradaQtd, setEntradaQtd] = useState('')
  const [entradaObs, setEntradaObs] = useState('')

  // Estados do formulário de Novo Item
  const [novoEscopo, setNovoEscopo] = useState<'residente' | 'casa'>('residente')
  const [novoResId, setNovoResId] = useState('')
  const [novoNome, setNovoNome] = useState('')
  const [novoUnidade, setNovoUnidade] = useState('un')
  const [novoQtd, setNovoQtd] = useState('0')
  const [novoMin, setNovoMin] = useState('7')
  const [novoConsumoDia, setNovoConsumoDia] = useState('')

  // Estados de Ajuste
  const [ajusteQtd, setAjusteQtd] = useState('')
  const [ajusteMotivo, setAjusteMotivo] = useState('')

  const residentesAtivos = useMemo(() => {
    return residentes.filter((r) => r.status !== 'obito')
  }, [residentes])

  // Aggregate stats
  const { criticos, alertas, emDia } = useMemo(() => {
    let crit = 0
    let al = 0
    let ok = 0
    residentesAtivos.forEach((r) => {
      r.estoque.forEach((it) => {
        const c = consumoDia(r, it, T)
        const d = diasRest(c, it.qtd)
        if (d <= 3) crit++
        else if (d <= 7) al++
        else ok++
      })
    })
    return { criticos: crit, alertas: al, emDia: ok }
  }, [residentesAtivos])

  const residentesFiltrados = useMemo(() => {
    if (!busca.trim()) return residentesAtivos
    const q = busca.toLowerCase()
    return residentesAtivos.filter((r) => {
      const matchRes = r.nome.toLowerCase().includes(q)
      const matchMed = r.estoque.some((it) => it.nome.toLowerCase().includes(q))
      return matchRes || matchMed
    })
  }, [residentesAtivos, busca])

  const casaFiltrada = useMemo(() => {
    if (!busca.trim()) return casa
    const q = busca.toLowerCase()
    return casa.filter((it) => it.nome.toLowerCase().includes(q))
  }, [casa, busca])

  async function copiarWhatsFamilia(resId: string) {
    const r = residentes.find((x) => x.id === resId)
    if (!r) return
    const linhas = r.estoque
      .map((it) => {
        const c = consumoDia(r, it, T)
        const q = qtdPedir(c, it)
        if (q <= 0) return null
        return `• ${it.nome}: pedir ${num(q)} ${it.unid}`
      })
      .filter(Boolean)

    if (!linhas.length) {
      toast.info(`O estoque de ${primeiro(r.nome)} está em dia. Nenhum pedido necessário.`)
      return
    }

    const t = `Olá! Notificação do Residencial Senecurare — ${primeiro(r.nome)}:\n\nSolicitamos reposição dos seguintes itens:\n${linhas.join('\n')}\n\nFavor entregar na enfermagem. Obrigado!`
    await navigator.clipboard.writeText(t)
    toast.success('Mensagem copiada para a área de transferência!')
  }

  async function copiarListaComprasCasa() {
    const linhas = casa
      .map((it) => {
        const c = it.consumoDia ?? 0
        const q = qtdPedir(c, it)
        return q > 0 ? `• ${it.nome}: ${num(q)} ${it.unid}` : null
      })
      .filter(Boolean)

    if (!linhas.length) {
      toast.info('Nenhum item com estoque abaixo do mínimo.')
      return
    }

    const t = `Lista de Compras da Casa — ${fmt(T)}:\n\n${linhas.join('\n')}\n\nGerado automaticamente pelo Sistema Senecurare.`
    await navigator.clipboard.writeText(t)
    toast.success('Lista de compras copiada com sucesso!')
  }

  function abrirEntradaRapida(item: ItemComOrigem, escopo: 'residente' | 'casa') {
    setEntradaEscopo(escopo)
    if (escopo === 'residente') {
      setEntradaResId(item.residenteId || '')
    }
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

    // 2. Atualiza saldo atômico em itens_estoque
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

    toast.success(`Entrada de +${qtdNum} registrada com sucesso no estoque!`)
    setModalEntrada(false)
    setEntradaQtd('')
    setEntradaObs('')
    await data.refresh()
  }

  async function handleSalvarNovoItem(e: React.FormEvent) {
    e.preventDefault()
    if (!novoNome.trim() || !profissional) {
      toast.error('Informe o nome do item / medicamento.')
      return
    }
    if (novoEscopo === 'residente' && !novoResId) {
      toast.error('Selecione o residente correspondente.')
      return
    }

    setSalvando(true)
    const id = (novoEscopo === 'residente' ? `${novoResId}_` : 'casa_') + 'e_' + Math.random().toString(36).substring(2, 7)
    const qtdInicial = Number(novoQtd) || 0
    const minCalculado = Number(novoMin) || 0
    const consDiaNum = novoConsumoDia ? Number(novoConsumoDia) : null

    const { error } = await supabase.from('itens_estoque').insert({
      id,
      residente_id: novoEscopo === 'residente' ? novoResId : null,
      escopo: novoEscopo,
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

    toast.success('Item cadastrado com sucesso no estoque!')
    setModalNovoItem(false)
    setNovoNome('')
    setNovoQtd('0')
    setNovoConsumoDia('')
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
        title="Controle de Estoque & Farmácia"
        lede="Medicamentos individualizados dos residentes e suprimentos de consumo geral da instituição."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {can(profissional?.cat ?? 'cuid', 'estoque') && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    setEntradaEscopo('residente')
                    setEntradaResId(residentesAtivos[0]?.id || '')
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
                    setNovoEscopo('residente')
                    setNovoResId(residentesAtivos[0]?.id || '')
                    setModalNovoItem(true)
                  }}
                  className="rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Plus className="size-3.5" />
                  <span>+ Novo Item</span>
                </Button>
              </>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => void copiarListaComprasCasa()}
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              <ShoppingCart className="size-3.5" />
              <span>Lista de Compras</span>
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
                Materiais da Instituição
              </span>
              <span className="text-xl font-bold text-foreground">{casa.length}</span>
            </div>
            <div className="size-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <PackageCheck className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar & Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border/70 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/40">
          <Button
            size="xs"
            variant={abaEstoque === 'residentes' ? 'default' : 'ghost'}
            onClick={() => setAbaEstoque('residentes')}
            className="text-xs rounded-lg h-7 px-3 font-semibold"
          >
            Medicamentos dos Residentes
          </Button>
          <Button
            size="xs"
            variant={abaEstoque === 'casa' ? 'default' : 'ghost'}
            onClick={() => setAbaEstoque('casa')}
            className="text-xs rounded-lg h-7 px-3 font-semibold"
          >
            Materiais da Casa ({casa.length})
          </Button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filtrar por residente ou item..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-8 text-xs rounded-xl bg-background"
          />
        </div>
      </div>

      {/* Content based on Tab */}
      {abaEstoque === 'residentes' ? (
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
                      <span className="text-[11px] text-muted-foreground">Quarto {r.quarto}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {itensBaixos > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        {itensBaixos} item(ns) em falta
                      </Badge>
                    )}
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => void copiarWhatsFamilia(r.id)}
                      className="rounded-lg text-xs gap-1.5 font-semibold bg-background"
                    >
                      <Share2 className="size-3 text-emerald-600" />
                      <span>Pedir à família</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Medicamento</TableHead>
                        <TableHead className="text-xs font-semibold">Saldo Atual</TableHead>
                        <TableHead className="text-xs font-semibold">Estoque Mínimo</TableHead>
                        <TableHead className="text-xs font-semibold">Consumo/Dia</TableHead>
                        <TableHead className="text-xs font-semibold">Autonomia</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {r.estoque.map((it) => {
                        const c = consumoDia(r, it, T)
                        const n = nivelEst(c, it)
                        const d = diasRest(c, it.qtd)

                        return (
                          <TableRow key={it.id}>
                            <TableCell className="font-bold text-xs text-foreground">{it.nome}</TableCell>
                            <TableCell className="text-xs font-semibold text-foreground">
                              {it.qtd} {it.unid}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {it.min} {it.unid}
                            </TableCell>
                            <TableCell className="text-xs font-medium">
                              {c.toFixed(1)} {it.unid}/dia
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
                                      abrirEntradaRapida(
                                        { ...it, residenteId: r.id, residenteNome: r.nome },
                                        'residente'
                                      )
                                    }
                                    className="h-6 px-2 text-[11px] gap-1 font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                                    title="Dar entrada de nova remessa trazida pela família"
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
                                    title="Retificar / Inventariar saldo"
                                  >
                                    <SlidersHorizontal className="size-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          })}

          {!residentesFiltrados.length && (
            <EmptyState title="Nenhum residente ou medicamento encontrado">
              Tente alterar os termos de busca no campo acima.
            </EmptyState>
          )}
        </div>
      ) : (
        <Card className="border border-border/70 shadow-xs overflow-hidden rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PackageCheck className="size-4 text-primary" />
              Materiais & Insumos de Uso Coletivo
            </CardTitle>
            <div className="flex items-center gap-2">
              {can(profissional?.cat ?? 'cuid', 'estoque') && (
                <Button
                  size="xs"
                  onClick={() => {
                    setNovoEscopo('casa')
                    setModalNovoItem(true)
                  }}
                  className="gap-1.5 rounded-lg text-xs font-semibold bg-[#123F4A] hover:bg-[#123F4A]/90 text-white"
                >
                  <Plus className="size-3" />
                  Novo Material da Casa
                </Button>
              )}
              <Button
                size="xs"
                variant="outline"
                onClick={() => void copiarListaComprasCasa()}
                className="text-xs rounded-lg gap-1.5"
              >
                <Copy className="size-3" />
                Copiar lista
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Material / Insumo</TableHead>
                  <TableHead className="text-xs font-semibold">Saldo em Estoque</TableHead>
                  <TableHead className="text-xs font-semibold">Estoque Mínimo</TableHead>
                  <TableHead className="text-xs font-semibold">Consumo Estimado/Dia</TableHead>
                  <TableHead className="text-xs font-semibold">Status de Reposição</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {casaFiltrada.map((it) => {
                  const c = it.consumoDia ?? 0
                  const q = qtdPedir(c, it)
                  const precisaComprar = q > 0

                  return (
                    <TableRow key={it.id}>
                      <TableCell className="font-bold text-xs text-foreground">{it.nome}</TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {it.qtd} {it.unid}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {it.min} {it.unid}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {it.consumoDia != null ? `${it.consumoDia} ${it.unid}/dia` : '–'}
                      </TableCell>
                      <TableCell>
                        {precisaComprar ? (
                          <Badge variant="destructive" className="text-[11px] font-semibold">
                            Comprar {num(q)} {it.unid}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            Estoque OK
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {can(profissional?.cat ?? 'cuid', 'estoque') && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => abrirEntradaRapida(it, 'casa')}
                              className="h-6 px-2 text-[11px] gap-1 font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                              title="Dar entrada de suprimento comprado"
                            >
                              <ArrowDownToLine className="size-3" />
                              <span>+ Entrada</span>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setModalAjuste(it)
                                setAjusteQtd(String(it.qtd))
                              }}
                              className="size-6 text-muted-foreground hover:text-foreground"
                              title="Retificar / Inventariar saldo"
                            >
                              <SlidersHorizontal className="size-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal: Lançar Entrada de Estoque */}
      <Dialog open={modalEntrada} onOpenChange={setModalEntrada}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSalvarEntrada}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <ArrowDownToLine className="size-4 text-emerald-600" />
                Registrar Entrada no Estoque
              </DialogTitle>
              <DialogDescription className="text-xs">
                Lançamento de medicamentos entregues pela família ou insumos comprados para a casa.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Destino do Item</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="xs"
                    variant={entradaEscopo === 'residente' ? 'default' : 'outline'}
                    onClick={() => setEntradaEscopo('residente')}
                    className="flex-1 text-xs"
                  >
                    Medicamento de Residente
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant={entradaEscopo === 'casa' ? 'default' : 'outline'}
                    onClick={() => setEntradaEscopo('casa')}
                    className="flex-1 text-xs"
                  >
                    Material Coletivo da Casa
                  </Button>
                </div>
              </div>

              {entradaEscopo === 'residente' && (
                <div className="space-y-1">
                  <Label htmlFor="entRes" className="text-[11px] font-semibold">Residente *</Label>
                  <select
                    id="entRes"
                    value={entradaResId}
                    onChange={(e) => {
                      setEntradaResId(e.target.value)
                      const r = data.getResidente(e.target.value)
                      setEntradaItemId(r?.estoque[0]?.id || '')
                    }}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                  >
                    {residentesAtivos.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nome} (Quarto {r.quarto})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="entItem" className="text-[11px] font-semibold">Item / Medicamento *</Label>
                <select
                  id="entItem"
                  value={entradaItemId}
                  onChange={(e) => setEntradaItemId(e.target.value)}
                  required
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                >
                  <option value="">Selecione o item...</option>
                  {(entradaEscopo === 'residente'
                    ? data.getResidente(entradaResId)?.estoque ?? []
                    : casa
                  ).map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.nome} (Saldo atual: {it.qtd} {it.unid})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="entQtd" className="text-[11px] font-semibold">Quantidade Recebida *</Label>
                <Input
                  id="entQtd"
                  type="number"
                  min="1"
                  step="any"
                  value={entradaQtd}
                  onChange={(e) => setEntradaQtd(e.target.value)}
                  placeholder="Ex: 30 comprimidos, 2 caixas..."
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="entObs" className="text-[11px] font-semibold">Observações / Lote / Validade</Label>
                <Input
                  id="entObs"
                  value={entradaObs}
                  onChange={(e) => setEntradaObs(e.target.value)}
                  placeholder="Ex: Entregue pela filha, lote 4821, val 12/2027..."
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalEntrada(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvando || !entradaItemId}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {salvando ? 'Registrando...' : 'Confirmar Entrada'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Cadastrar Novo Item no Estoque */}
      <Dialog open={modalNovoItem} onOpenChange={setModalNovoItem}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSalvarNovoItem}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Package className="size-4 text-[#123F4A]" />
                Cadastrar Novo Item no Estoque
              </DialogTitle>
              <DialogDescription className="text-xs">
                Cadastre um novo fármaco para um residente ou suprimento para a instituição.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Escopo do Item</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="xs"
                    variant={novoEscopo === 'residente' ? 'default' : 'outline'}
                    onClick={() => setNovoEscopo('residente')}
                    className="flex-1 text-xs"
                  >
                    Residente
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant={novoEscopo === 'casa' ? 'default' : 'outline'}
                    onClick={() => setNovoEscopo('casa')}
                    className="flex-1 text-xs"
                  >
                    Uso Coletivo (Casa)
                  </Button>
                </div>
              </div>

              {novoEscopo === 'residente' && (
                <div className="space-y-1">
                  <Label htmlFor="novoRes" className="text-[11px] font-semibold">Residente *</Label>
                  <select
                    id="novoRes"
                    value={novoResId}
                    onChange={(e) => setNovoResId(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                  >
                    {residentesAtivos.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nome} (Quarto {r.quarto})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="novoNome" className="text-[11px] font-semibold">Nome do Item / Medicamento *</Label>
                <Input
                  id="novoNome"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Clonazepam 2 mg ou Fralda Geriátrica G"
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="novoUn" className="text-[11px] font-semibold">Unidade</Label>
                  <select
                    id="novoUn"
                    value={novoUnidade}
                    onChange={(e) => setNovoUnidade(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                  >
                    <option value="un">un (comp/item)</option>
                    <option value="cx">caixa</option>
                    <option value="frasco">frasco</option>
                    <option value="ampola">ampola</option>
                    <option value="pacote">pacote</option>
                    <option value="sachê">sachê</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="novoQtd" className="text-[11px] font-semibold">Saldo Inicial</Label>
                  <Input
                    id="novoQtd"
                    type="number"
                    min="0"
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
                    value={novoMin}
                    onChange={(e) => setNovoMin(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {novoEscopo === 'casa' && (
                <div className="space-y-1">
                  <Label htmlFor="novoConsumo" className="text-[11px] font-semibold">Consumo Estimado/Dia</Label>
                  <Input
                    id="novoConsumo"
                    type="number"
                    step="0.1"
                    min="0"
                    value={novoConsumoDia}
                    onChange={(e) => setNovoConsumoDia(e.target.value)}
                    placeholder="Ex: 5 pacotes/dia"
                    className="h-8 text-xs"
                  />
                </div>
              )}
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
                {salvando ? 'Cadastrando...' : 'Cadastrar Item'}
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
                  {modalAjuste.residenteNome ? `Residente: ${modalAjuste.residenteNome}` : 'Material coletivo da casa'}.
                  Retifique o saldo físico conferido na farmácia.
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
                    placeholder="Ex: Auditoria mensal, quebra acidental de frasco..."
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
    </div>
  )
}
