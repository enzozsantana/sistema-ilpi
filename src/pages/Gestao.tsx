import { useMemo, useState } from 'react'
import { diffDays, fmt, iso, mesKey } from '../lib/business/dates'
import { calcInd, dimensionamento } from '../lib/business/indicadores'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { useAuth } from '../contexts/AuthContext'
import { can } from '../lib/permissions'
import { supabase } from '../lib/supabase'
import { PageHeader, StatusBadge } from '../components/Ui'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  FileCheck2,
  FileText,
  Plus,
  Scale,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DocumentoInstituicao, PopDocumento } from '../types/ilpi'

const T = iso(new Date())
const MK_ATUAL = mesKey(new Date())

export default function Gestao() {
  const { profissional } = useAuth()
  const { inst, residentes, documentos, pops, eventos, equipe, escalaMes, refresh } = useIlpiData()

  const podeGerir = profissional ? can(profissional.cat, 'gerir') : false

  const [mesInd, setMesInd] = useState<string>(MK_ATUAL)
  const dim = useMemo(() => dimensionamento(residentes, equipe, escalaMes, T), [residentes, equipe, escalaMes])
  const ind = useMemo(() => calcInd(mesInd, residentes, eventos), [mesInd, residentes, eventos])

  const docVencendo = documentos.filter((d) => {
    const v = d.validade ? diffDays(d.validade, T) : 999
    return v <= 60
  }).length

  // Dialog State: Nome da Instituição
  const [dialogInstOpen, setDialogInstOpen] = useState(false)
  const [salvandoInst, setSalvandoInst] = useState(false)
  const [novoNomeInst, setNovoNomeInst] = useState(inst || 'Senecurare — Residencial Sênior')

  // Dialog State: Novo / Editar Documento
  const [dialogDocOpen, setDialogDocOpen] = useState(false)
  const [docEditando, setDocEditando] = useState<DocumentoInstituicao | null>(null)
  const [salvandoDoc, setSalvandoDoc] = useState(false)
  const [docNome, setDocNome] = useState('')
  const [docOrgao, setDocOrgao] = useState('')
  const [docValidade, setDocValidade] = useState('')

  // Dialog State: Novo / Editar POP
  const [dialogPopOpen, setDialogPopOpen] = useState(false)
  const [popEditando, setPopEditando] = useState<PopDocumento | null>(null)
  const [salvandoPop, setSalvandoPop] = useState(false)
  const [popTitulo, setPopTitulo] = useState('')
  const [popTipo, setPopTipo] = useState('POP')
  const [popRevisao, setPopRevisao] = useState(T)

  // Dialog State: Exclusão
  const [docParaExcluir, setDocParaExcluir] = useState<DocumentoInstituicao | null>(null)
  const [popParaExcluir, setPopParaExcluir] = useState<PopDocumento | null>(null)

  function navegarMesInd(offset: number) {
    const [ano, mes] = mesInd.split('-').map(Number)
    const d = new Date(ano, mes - 1 + offset, 1)
    setMesInd(mesKey(d))
  }

  async function copiarIndicadores() {
    const t = ind.rows.map((r) => `${r.n}\t${r.c}\t${r.taxa.toFixed(1)}%`).join('\n')
    await navigator.clipboard.writeText(t)
    toast.success('Indicadores copiados para a área de transferência!')
  }

  async function handleSalvarNomeInst() {
    if (!novoNomeInst.trim()) {
      toast.error('Informe o nome da instituição.')
      return
    }

    setSalvandoInst(true)
    const { error } = await supabase
      .from('instituicao')
      .update({ nome: novoNomeInst.trim() })
      .eq('id', '00000000-0000-0000-0000-000000000001')

    setSalvandoInst(false)
    if (error) {
      toast.error(`Erro ao atualizar nome: ${error.message}`)
      return
    }

    toast.success('Nome da instituição atualizado com sucesso!')
    setDialogInstOpen(false)
    await refresh()
  }

  function abrirNovoDoc() {
    setDocEditando(null)
    setDocNome('')
    setDocOrgao('')
    setDocValidade('')
    setDialogDocOpen(true)
  }

  function abrirEditarDoc(d: DocumentoInstituicao) {
    setDocEditando(d)
    setDocNome(d.nome)
    setDocOrgao(d.orgao)
    setDocValidade(d.validade)
    setDialogDocOpen(true)
  }

  async function handleSalvarDoc() {
    if (!docNome.trim()) {
      toast.error('Informe o nome do documento ou licença.')
      return
    }
    if (!docValidade) {
      toast.error('Informe a data de validade.')
      return
    }

    setSalvandoDoc(true)
    if (docEditando) {
      // UPDATE
      const { error } = await supabase
        .from('documentos_inst')
        .update({
          nome: docNome.trim(),
          orgao: docOrgao.trim() || 'Órgão Regulador',
          validade: docValidade,
        })
        .eq('id', docEditando.id)

      setSalvandoDoc(false)
      if (error) {
        toast.error(`Erro ao atualizar licença: ${error.message}`)
        return
      }
      toast.success('Licença sanitária atualizada!')
    } else {
      // INSERT
      const id = `doc_${Date.now()}`
      const { error } = await supabase.from('documentos_inst').insert({
        id,
        nome: docNome.trim(),
        orgao: docOrgao.trim() || 'Órgão Regulador',
        validade: docValidade,
      })

      setSalvandoDoc(false)
      if (error) {
        toast.error(`Erro ao cadastrar licença: ${error.message}`)
        return
      }
      toast.success('Nova licença sanitária cadastrada!')
    }

    setDialogDocOpen(false)
    await refresh()
  }

  async function handleExcluirDoc() {
    if (!docParaExcluir) return
    const { error } = await supabase.from('documentos_inst').delete().eq('id', docParaExcluir.id)
    if (error) {
      toast.error(`Erro ao excluir: ${error.message}`)
      return
    }
    toast.success('Licença removida.')
    setDocParaExcluir(null)
    await refresh()
  }

  function abrirNovoPop() {
    setPopEditando(null)
    setPopTitulo('')
    setPopTipo('POP')
    setPopRevisao(T)
    setDialogPopOpen(true)
  }

  function abrirEditarPop(p: PopDocumento) {
    setPopEditando(p)
    setPopTitulo(p.titulo)
    setPopTipo(p.tipo)
    setPopRevisao(p.revisao || T)
    setDialogPopOpen(true)
  }

  async function handleSalvarPop() {
    if (!popTitulo.trim()) {
      toast.error('Informe o título do POP ou protocolo.')
      return
    }

    setSalvandoPop(true)
    if (popEditando) {
      // UPDATE
      const { error } = await supabase
        .from('pops')
        .update({
          titulo: popTitulo.trim(),
          tipo: popTipo,
          revisao: popRevisao,
        })
        .eq('id', popEditando.id)

      setSalvandoPop(false)
      if (error) {
        toast.error(`Erro ao atualizar POP: ${error.message}`)
        return
      }
      toast.success('POP / Protocolo atualizado!')
    } else {
      // INSERT
      const id = `pop_${Date.now()}`
      const { error } = await supabase.from('pops').insert({
        id,
        titulo: popTitulo.trim(),
        tipo: popTipo,
        revisao: popRevisao,
      })

      setSalvandoPop(false)
      if (error) {
        toast.error(`Erro ao cadastrar POP: ${error.message}`)
        return
      }
      toast.success('Novo POP / Protocolo cadastrado com sucesso!')
    }

    setDialogPopOpen(false)
    await refresh()
  }

  async function handleExcluirPop() {
    if (!popParaExcluir) return
    const { error } = await supabase.from('pops').delete().eq('id', popParaExcluir.id)
    if (error) {
      toast.error(`Erro ao excluir POP: ${error.message}`)
      return
    }
    toast.success('Procedimento removido.')
    setPopParaExcluir(null)
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Gestão & Conformidade"
          lede={`Supervisão regulatória, dimensionamento RDC 502 da ANVISA e indicadores para: ${inst || 'Senecurare'}`}
          actions={
            <div className="flex items-center gap-2">
              {podeGerir && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNovoNomeInst(inst || 'Senecurare — Residencial Sênior')
                    setDialogInstOpen(true)
                  }}
                  className="rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Building2 className="size-3.5" />
                  <span>Editar Instituição</span>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => void copiarIndicadores()}
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <Copy className="size-3.5" />
                <span>Copiar Indicadores</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Dimensionamento RDC 502
              </span>
              <span className={cn('text-sm font-bold block mt-0.5', dim.atende ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600')}>
                {dim.atende ? 'Em Conformidade' : 'Abaixo do Mínimo'}
              </span>
            </div>
            <div className={cn('size-8 rounded-lg flex items-center justify-center', dim.atende ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600')}>
              <Scale className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Licenças & Alvarás
              </span>
              <span className="text-xl font-bold text-foreground">
                {documentos.length}
              </span>
            </div>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileCheck2 className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Alvarás a Vencer
              </span>
              <span className={cn('text-xl font-bold', docVencendo > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>
                {docVencendo}
              </span>
            </div>
            <div className={cn('size-8 rounded-lg flex items-center justify-center', docVencendo > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground')}>
              <AlertTriangle className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                POPs & Protocolos
              </span>
              <span className="text-xl font-bold text-foreground">{pops.length}</span>
            </div>
            <div className="size-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <FileText className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dimensionamento de Pessoal (RDC 502 / Fugulin) */}
      <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Scale className="size-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold font-heading">
                Dimensionamento de Cuidadores (RDC 502 / ANVISA)
              </CardTitle>
              <span className="text-[11px] text-muted-foreground">
                Cálculo baseado na proporção de residentes por Grau de Dependência Fugulin
              </span>
            </div>
          </div>
          <StatusBadge tone={dim.atende ? 'ok' : 'danger'}>
            {dim.atende ? 'Conforme com a RDC 502' : 'Alerta: Escala Abaixo do Mínimo'}
          </StatusBadge>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-background border border-border/60 text-center">
              <span className="text-[11px] font-medium text-muted-foreground block">Grau 1 (Independente)</span>
              <span className="text-lg font-bold text-foreground block mt-1">{dim.porGrau.g1} residentes</span>
              <span className="text-[10px] text-muted-foreground">Proporção 1:20</span>
            </div>
            <div className="p-3.5 rounded-xl bg-background border border-border/60 text-center">
              <span className="text-[11px] font-medium text-muted-foreground block">Grau 2 (Semidependente)</span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400 block mt-1">{dim.porGrau.g2} residentes</span>
              <span className="text-[10px] text-muted-foreground">Proporção 1:10</span>
            </div>
            <div className="p-3.5 rounded-xl bg-background border border-border/60 text-center">
              <span className="text-[11px] font-medium text-muted-foreground block">Grau 3 (Dependência Total)</span>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400 block mt-1">{dim.porGrau.g3} residentes</span>
              <span className="text-[10px] text-muted-foreground">Proporção 1:6</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-foreground block">
                Cuidadores necessários por turno (Graus 2 e 3): <b>{dim.porTurnoG23.toFixed(1)}</b>
              </span>
              <span className="text-muted-foreground block">
                Escalados hoje: <b>{dim.naEscala.dia}</b> cuidadores de dia · <b>{dim.naEscala.noite}</b> de noite
              </span>
            </div>
            <div className="flex items-center gap-2">
              {dim.atende ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" /> Dimensionamento Atendido
                </span>
              ) : (
                <span className="text-rose-600 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="size-4" /> Déficit na Escala
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alvarás, Licenças Sanitárias e AVCB */}
      <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="size-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold font-heading">
                Alvarás, Vistorias e Licenças Sanitárias
              </CardTitle>
              <span className="text-[11px] text-muted-foreground">
                Documentação fiscalizatória e datas de vencimento
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {documentos.length} licenças
            </Badge>
            {podeGerir && (
              <Button
                size="sm"
                variant="outline"
                onClick={abrirNovoDoc}
                className="rounded-xl gap-1 text-xs h-8"
              >
                <Plus className="size-3.5" /> Nova Licença
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documentos.map((d) => {
              const v = d.validade ? diffDays(d.validade, T) : 999
              const status = v <= 0 ? 'danger' : v <= 60 ? 'warn' : 'ok'

              return (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/15 transition-all shadow-2xs flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-foreground block truncate">{d.nome}</span>
                    <span className="text-[11px] text-muted-foreground block truncate mt-0.5">
                      Órgão: <strong>{d.orgao}</strong> · Validade: {fmt(d.validade)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge tone={status}>
                      {v <= 0 ? 'Vencido' : v <= 60 ? `Vence em ${v}d` : 'Em dia'}
                    </StatusBadge>

                    {podeGerir && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => abrirEditarDoc(d)}
                          title="Editar licença"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                          onClick={() => setDocParaExcluir(d)}
                          title="Excluir licença"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Protocolos e POPs */}
      <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <CardTitle className="text-sm font-bold font-heading">
              Procedimentos Operacionais Padrão (POPs)
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {pops.length} protocolos
            </Badge>
            {podeGerir && (
              <Button
                size="sm"
                variant="outline"
                onClick={abrirNovoPop}
                className="rounded-xl gap-1 text-xs h-8"
              >
                <Plus className="size-3.5" /> Novo POP
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pops.map((p) => {
              const v = p.revisao ? diffDays(p.revisao, T) : 0
              const precisaRevisao = v < -365

              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl border border-border/60 bg-card flex items-center justify-between gap-3 text-xs shadow-2xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-foreground block truncate">{p.titulo}</span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Área/Tipo: <strong>{p.tipo}</strong> · Última revisão: {fmt(p.revisao)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {precisaRevisao ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Revisão pendente
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        Vigente
                      </Badge>
                    )}

                    {podeGerir && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => abrirEditarPop(p)}
                          title="Editar POP"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                          onClick={() => setPopParaExcluir(p)}
                          title="Excluir POP"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Indicadores de Qualidade da Vigilância Sanitária */}
      <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <BarChart3 className="size-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold font-heading">
                Indicadores da Vigilância Sanitária
              </CardTitle>
              <span className="text-[11px] text-muted-foreground">
                Base de cálculo (denominador): {ind.den} residentes atendidos no mês selecionado
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-card border border-border/70 p-1 rounded-xl shadow-2xs">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => navegarMesInd(-1)}
                title="Mês anterior"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-xs font-bold px-2 font-mono">
                {mesInd}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => navegarMesInd(1)}
                title="Próximo mês"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>

            <Button
              size="xs"
              variant="outline"
              onClick={() => void copiarIndicadores()}
              className="text-xs rounded-lg gap-1.5 h-8"
            >
              <Copy className="size-3" />
              Copiar tabela
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="text-xs font-semibold">Indicador de Qualidade</TableHead>
                <TableHead className="text-xs font-semibold">Ocorrências / Casos</TableHead>
                <TableHead className="text-xs font-semibold text-right">Taxa Percentual (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ind.rows.map((row) => (
                <TableRow key={row.n}>
                  <TableCell className="font-bold text-xs text-foreground">{row.n}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.c} caso(s)</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="font-mono text-xs font-semibold">
                      {row.taxa.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Editar Instituição */}
      <Dialog open={dialogInstOpen} onOpenChange={setDialogInstOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Identificação da Instituição
            </DialogTitle>
            <DialogDescription className="text-xs">
              Nome oficial que aparecerá nos relatórios e prontuários.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da ILPI *</Label>
              <Input
                placeholder="ex: Senecurare — Residencial Sênior"
                value={novoNomeInst}
                onChange={(e) => setNovoNomeInst(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogInstOpen(false)}
              disabled={salvandoInst}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarNomeInst}
              disabled={salvandoInst}
            >
              {salvandoInst ? 'Salvando...' : 'Salvar Alteração'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nova / Editar Licença Sanitária */}
      <Dialog open={dialogDocOpen} onOpenChange={setDialogDocOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck2 className="size-5 text-teal-600" />
              {docEditando ? 'Editar Licença / Alvará' : 'Nova Licença / Alvará'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastre alvarás municipais, sanitários e corpo de bombeiros.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Documento / Alvará *</Label>
              <Input
                placeholder="ex: Auto de Vistoria do Corpo de Bombeiros (AVCB)"
                value={docNome}
                onChange={(e) => setDocNome(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Órgão Expedidor / Responsável</Label>
              <Input
                placeholder="ex: Corpo de Bombeiros da PMESP"
                value={docOrgao}
                onChange={(e) => setDocOrgao(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Data de Validade *</Label>
              <Input
                type="date"
                value={docValidade}
                onChange={(e) => setDocValidade(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogDocOpen(false)}
              disabled={salvandoDoc}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarDoc}
              disabled={salvandoDoc}
            >
              {salvandoDoc ? 'Salvando...' : docEditando ? 'Atualizar Licença' : 'Cadastrar Licença'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Novo / Editar POP */}
      <Dialog open={dialogPopOpen} onOpenChange={setDialogPopOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              {popEditando ? 'Editar Procedimento Padrão' : 'Novo POP / Protocolo'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Procedimentos operacionais padronizados exigidos pela RDC 502/2021.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Título do Protocolo *</Label>
              <Input
                placeholder="ex: Prevenção e Tratamento de Lesões por Pressão (LPP)"
                value={popTitulo}
                onChange={(e) => setPopTitulo(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de Documento</Label>
              <Select value={popTipo} onValueChange={(val) => setPopTipo(val)}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POP">POP (Procedimento Operacional Padrão)</SelectItem>
                  <SelectItem value="Protocolo">Protocolo Clínico</SelectItem>
                  <SelectItem value="Manual">Manual de Boas Práticas</SelectItem>
                  <SelectItem value="Fluxograma">Fluxograma de Atendimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Data da Última Revisão *</Label>
              <Input
                type="date"
                value={popRevisao}
                onChange={(e) => setPopRevisao(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogPopOpen(false)}
              disabled={salvandoPop}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarPop}
              disabled={salvandoPop}
            >
              {salvandoPop ? 'Salvando...' : popEditando ? 'Atualizar POP' : 'Cadastrar POP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão de Licença */}
      <Dialog open={!!docParaExcluir} onOpenChange={(open) => !open && setDocParaExcluir(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <Trash2 className="size-4" /> Excluir Licença
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deseja remover <strong>&quot;{docParaExcluir?.nome}&quot;</strong> do registro de conformidade?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDocParaExcluir(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleExcluirDoc}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão de POP */}
      <Dialog open={!!popParaExcluir} onOpenChange={(open) => !open && setPopParaExcluir(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <Trash2 className="size-4" /> Excluir POP
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deseja remover o procedimento <strong>&quot;{popParaExcluir?.titulo}&quot;</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPopParaExcluir(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleExcluirPop}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
