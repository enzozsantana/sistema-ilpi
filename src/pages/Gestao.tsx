import { useEffect, useMemo, useRef, useState } from 'react'
import { diffDays, fmt, iso, mesKey } from '../lib/business/dates'
import { calcInd, dimensionamento, INDICADORES_VIGILANCIA, ROTULO_EVENTO } from '../lib/business/indicadores'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { useAuth } from '../contexts/AuthContext'
import { can } from '../lib/permissions'
import { supabase } from '../lib/supabase'
import { PageHeader, StatusBadge } from '../components/Ui'
import { SecaoPops } from '../components/SecaoPops'
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
  ClipboardList,
  Copy,
  Download,
  Edit,
  Eye,
  FileCheck2,
  FileText,
  ListFilter,
  Paperclip,
  Plus,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DocumentoInstituicao, EventoTipo, EventoVigilancia } from '../types/ilpi'
import {
  type AnexoDocumento,
  carregarTodosAnexosLocais,
  processarArquivoParaAnexo,
  removerAnexoLocal,
  formatarTamanhoArquivo,
  baixarDocumento,
} from '../lib/documentosStorage'
import { VisualizadorDocumentoModal } from '../components/VisualizadorDocumentoModal'

const T = iso(new Date())
const MK_ATUAL = mesKey(new Date())

export default function Gestao() {
  const { profissional } = useAuth()
  const { inst, residentes, documentos, pops, eventos, equipe, escalaMes, refresh } = useIlpiData()

  const podeGerir = profissional ? can(profissional.cat, 'gerir') : false
  const podeAlvara = profissional ? can(profissional.cat, 'alvara') : false

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

  // Dialog State: Exclusão de Documento
  const [docParaExcluir, setDocParaExcluir] = useState<DocumentoInstituicao | null>(null)

  // Anexos de Alvarás e Licenças (Vigilância Sanitária)
  const [anexosAlvaras, setAnexosAlvaras] = useState<Record<string, AnexoDocumento>>({})
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [anexoAtual, setAnexoAtual] = useState<AnexoDocumento | null>(null)
  const [removerAnexoExistente, setRemoverAnexoExistente] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Visualizador de Documento Anexo
  const [modalVisualizarDoc, setModalVisualizarDoc] = useState(false)
  const [docParaVisualizar, setDocParaVisualizar] = useState<{ anexo: AnexoDocumento; titulo: string } | null>(null)

  useEffect(() => {
    carregarTodosAnexosLocais('alvara').then(setAnexosAlvaras)
  }, [])

  // Ocorrências do Mês Selecionado (Vigilância Sanitária)
  const [anoInd, mesIndNum] = mesInd.split('-').map(Number)
  const iniInd = iso(new Date(anoInd, mesIndNum - 1, 1))
  const fimInd = iso(new Date(anoInd, mesIndNum, 0))

  const eventosDoMes = useMemo(() => {
    return eventos
      .filter((e) => e.data >= iniInd && e.data <= fimInd)
      .sort((a, b) => b.data.localeCompare(a.data))
  }, [eventos, iniInd, fimInd])

  // Dialog State: Gerenciar Ocorrências do Mês
  const [dialogOcorrenciasOpen, setDialogOcorrenciasOpen] = useState(false)
  const [filtroTipoOco, setFiltroTipoOco] = useState<string>('todos')

  const eventosFiltrados = useMemo(() => {
    if (filtroTipoOco === 'todos') return eventosDoMes
    return eventosDoMes.filter((e) => e.tipo === filtroTipoOco)
  }, [eventosDoMes, filtroTipoOco])

  // Dialog State: Nova / Editar Ocorrência
  const [dialogOcoFormOpen, setDialogOcoFormOpen] = useState(false)
  const [ocoEditando, setOcoEditando] = useState<EventoVigilancia | null>(null)
  const [salvandoOco, setSalvandoOco] = useState(false)
  const [ocoTipo, setOcoTipo] = useState<EventoTipo>('lpp')
  const [ocoResId, setOcoResId] = useState<string>('')
  const [ocoData, setOcoData] = useState<string>(T)
  const [ocoRelato, setOcoRelato] = useState<string>('')

  // Dialog State: Exclusão de Ocorrência
  const [ocoParaExcluir, setOcoParaExcluir] = useState<EventoVigilancia | null>(null)

  function navegarMesInd(offset: number) {
    const [ano, mes] = mesInd.split('-').map(Number)
    const d = new Date(ano, mes - 1 + offset, 1)
    setMesInd(mesKey(d))
  }

  function abrirNovaOcorrencia(tipoPredefinido?: EventoTipo) {
    setOcoEditando(null)
    setOcoTipo(tipoPredefinido || 'lpp')
    const dataDefault = mesInd === MK_ATUAL ? T : `${mesInd}-01`
    setOcoData(dataDefault)
    setOcoResId(residentes[0]?.id || '')
    setOcoRelato('')
    setDialogOcoFormOpen(true)
  }

  function abrirEditarOcorrencia(ev: EventoVigilancia) {
    setOcoEditando(ev)
    setOcoTipo(ev.tipo)
    setOcoData(ev.data)
    setOcoResId(ev.resId || '')
    setOcoRelato('')
    setDialogOcoFormOpen(true)
  }

  function abrirGerenciarTipo(tipo: string) {
    setFiltroTipoOco(tipo)
    setDialogOcorrenciasOpen(true)
  }

  async function handleSalvarOcorrencia() {
    if (!ocoResId) {
      toast.error('Selecione o residente envolvido.')
      return
    }
    if (!ocoData) {
      toast.error('Informe a data da ocorrência.')
      return
    }

    setSalvandoOco(true)

    if (ocoEditando) {
      const { error } = await supabase
        .from('ocorrencias')
        .update({
          residente_id: ocoResId,
          tipo: ocoTipo,
          data: ocoData,
        })
        .eq('id', ocoEditando.id)

      setSalvandoOco(false)
      if (error) {
        toast.error(`Erro ao atualizar ocorrência: ${error.message}`)
        return
      }
      toast.success('Ocorrência sanitária atualizada! Indicadores recalculados.')
    } else {
      const id = 'oco_' + Math.random().toString(36).substring(2, 9)
      const { error } = await supabase
        .from('ocorrencias')
        .insert({
          id,
          residente_id: ocoResId,
          tipo: ocoTipo,
          data: ocoData,
        })

      if (error) {
        setSalvandoOco(false)
        toast.error(`Erro ao registrar ocorrência: ${error.message}`)
        return
      }

      if (ocoRelato.trim() && profissional) {
        const anotId = 'a_' + Math.random().toString(36).substring(2, 9)
        await supabase.from('anotacoes').insert({
          id: anotId,
          residente_id: ocoResId,
          texto: `[INTERCORRÊNCIA SANITÁRIA - ${ocoTipo.toUpperCase()}] ${ocoRelato.trim()}`,
          assinatura: { id: profissional.id, d: ocoData, h: '12:00' },
        })
      }

      setSalvandoOco(false)
      toast.success('Ocorrência sanitária registrada! Indicadores atualizados.')
    }

    setDialogOcoFormOpen(false)
    await refresh()
  }

  async function handleExcluirOcorrencia() {
    if (!ocoParaExcluir) return
    const { error } = await supabase
      .from('ocorrencias')
      .delete()
      .eq('id', ocoParaExcluir.id)

    if (error) {
      toast.error(`Erro ao remover ocorrência: ${error.message}`)
      return
    }

    toast.success('Ocorrência sanitária excluída e indicadores atualizados.')
    setOcoParaExcluir(null)
    await refresh()
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
    setArquivoSelecionado(null)
    setAnexoAtual(null)
    setRemoverAnexoExistente(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setDialogDocOpen(true)
  }

  function abrirEditarDoc(d: DocumentoInstituicao) {
    setDocEditando(d)
    setDocNome(d.nome)
    setDocOrgao(d.orgao)
    setDocValidade(d.validade)
    setArquivoSelecionado(null)
    setRemoverAnexoExistente(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    const anexoExistente = anexosAlvaras[d.id] || (d.arquivo_url ? {
      id: d.id,
      tipoDocumento: 'alvara' as const,
      nomeArquivo: d.arquivo_nome || 'alvara.pdf',
      tipoMime: d.arquivo_tipo || 'application/pdf',
      tamanho: d.arquivo_tamanho || 0,
      dataUpload: d.arquivo_data || '',
      url: d.arquivo_url,
    } : null)
    setAnexoAtual(anexoExistente)
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
    const docId = docEditando ? docEditando.id : `doc_${Date.now()}`

    let anexoSalvo: AnexoDocumento | null = null
    if (arquivoSelecionado) {
      try {
        anexoSalvo = await processarArquivoParaAnexo('alvara', docId, arquivoSelecionado)
        setAnexosAlvaras((prev) => ({ ...prev, [docId]: anexoSalvo! }))
      } catch (err) {
        console.error('Erro ao processar anexo:', err)
        toast.error('Falha ao processar arquivo anexo.')
      }
    } else if (removerAnexoExistente) {
      await removerAnexoLocal('alvara', docId)
      setAnexosAlvaras((prev) => {
        const copy = { ...prev }
        delete copy[docId]
        return copy
      })
    }

    const payloadBase = {
      nome: docNome.trim(),
      orgao: docOrgao.trim() || 'Órgão Regulador',
      validade: docValidade,
    }

    const payloadComArquivo = {
      ...payloadBase,
      ...(anexoSalvo ? {
        arquivo_url: anexoSalvo.url,
        arquivo_nome: anexoSalvo.nomeArquivo,
        arquivo_tipo: anexoSalvo.tipoMime,
        arquivo_tamanho: anexoSalvo.tamanho,
        arquivo_data: anexoSalvo.dataUpload,
      } : removerAnexoExistente ? {
        arquivo_url: null,
        arquivo_nome: null,
        arquivo_tipo: null,
        arquivo_tamanho: null,
        arquivo_data: null,
      } : {}),
    }

    if (docEditando) {
      // UPDATE
      let { error } = await supabase
        .from('documentos_inst')
        .update(payloadComArquivo)
        .eq('id', docEditando.id)

      if (error && error.message?.includes('column')) {
        const fallback = await supabase
          .from('documentos_inst')
          .update(payloadBase)
          .eq('id', docEditando.id)
        error = fallback.error
      }

      setSalvandoDoc(false)
      if (error) {
        toast.error(`Erro ao atualizar licença: ${error.message}`)
        return
      }
      toast.success('Licença sanitária atualizada!')
    } else {
      // INSERT
      let { error } = await supabase.from('documentos_inst').insert({
        id: docId,
        ...payloadComArquivo,
      })

      if (error && error.message?.includes('column')) {
        const fallback = await supabase.from('documentos_inst').insert({
          id: docId,
          ...payloadBase,
        })
        error = fallback.error
      }

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
    const id = docParaExcluir.id
    await removerAnexoLocal('alvara', id)
    setAnexosAlvaras((prev) => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
    const { error } = await supabase.from('documentos_inst').delete().eq('id', id)
    if (error) {
      toast.error(`Erro ao excluir: ${error.message}`)
      return
    }
    toast.success('Licença removida.')
    setDocParaExcluir(null)
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
      <div className={cn(
        'grid gap-3 sm:gap-4',
        podeAlvara ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'
      )}>
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

        {podeAlvara && (
          <>
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
          </>
        )}

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

      {/* Alvarás, Licenças Sanitárias e AVCB (Exclusivo para RT e Gestão) */}
      {podeAlvara && (
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
                  Documentação fiscalizatória e datas de vencimento (Exclusivo RT & Gestão)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {documentos.length} licenças
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={abrirNovoDoc}
                className="rounded-xl gap-1 text-xs h-8"
              >
                <Plus className="size-3.5" /> Nova Licença
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documentos.map((d) => {
                const v = d.validade ? diffDays(d.validade, T) : 999
                const status = v <= 0 ? 'danger' : v <= 60 ? 'warn' : 'ok'
                const anexo = anexosAlvaras[d.id] || (d.arquivo_url ? {
                  id: d.id,
                  tipoDocumento: 'alvara' as const,
                  nomeArquivo: d.arquivo_nome || 'documento_alvara.pdf',
                  tipoMime: d.arquivo_tipo || 'application/pdf',
                  tamanho: d.arquivo_tamanho || 0,
                  dataUpload: d.arquivo_data || '',
                  url: d.arquivo_url,
                } : null)

                return (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/15 transition-all shadow-2xs flex flex-col justify-between gap-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-foreground block truncate">{d.nome}</span>
                        <span className="text-[11px] text-muted-foreground block truncate mt-0.5">
                          Órgão: <strong>{d.orgao}</strong> · Validade: {fmt(d.validade)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge tone={status}>
                          {v <= 0 ? 'Vencido' : v <= 60 ? `Vence em ${v}d` : 'Em dia'}
                        </StatusBadge>

                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            onClick={() => abrirEditarDoc(d)}
                            title="Editar licença e anexos"
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
                      </div>
                    </div>

                    {/* Linha do Documento Digitalizado Anexo para Fiscalização */}
                    <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 text-[11px]">
                      {anexo ? (
                        <>
                          <div className="flex items-center gap-1.5 text-teal-800 dark:text-teal-300 font-medium min-w-0">
                            <Paperclip className="size-3.5 shrink-0 text-teal-600" />
                            <span className="truncate max-w-[150px] sm:max-w-[210px]">{anexo.nomeArquivo}</span>
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">
                              ({formatarTamanhoArquivo(anexo.tamanho)})
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[10px] rounded-lg gap-1 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10"
                              onClick={() => {
                                setDocParaVisualizar({ anexo, titulo: d.nome })
                                setModalVisualizarDoc(true)
                              }}
                              title="Visualizar documento original em tela"
                            >
                              <Eye className="size-3" /> Visualizar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="size-6 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => baixarDocumento(anexo)}
                              title="Baixar arquivo original"
                            >
                              <Download className="size-3" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-amber-800 dark:text-amber-300 flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="size-3 text-amber-500 shrink-0" />
                            <span>Sem documento digitalizado</span>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] text-teal-700 dark:text-teal-400 hover:underline hover:bg-teal-500/10 rounded-lg"
                            onClick={() => abrirEditarDoc(d)}
                          >
                            + Anexar via original
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Protocolos e POPs (Visualização para todos, edição restrita a Enfermeiro e RT) */}
      <SecaoPops />

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

            {podeGerir && (
              <>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    setFiltroTipoOco('todos')
                    setDialogOcorrenciasOpen(true)
                  }}
                  className="text-xs rounded-lg gap-1.5 h-8"
                  title="Ver, editar ou excluir ocorrências deste mês"
                >
                  <ClipboardList className="size-3.5 text-amber-600" />
                  Gerenciar Ocorrências ({eventosDoMes.length})
                </Button>

                <Button
                  size="xs"
                  onClick={() => abrirNovaOcorrencia()}
                  className="text-xs rounded-lg gap-1.5 h-8 bg-amber-600 hover:bg-amber-700 text-white font-medium"
                  title="Lançar nova ocorrência / evento sentinela no mês"
                >
                  <Plus className="size-3.5" />
                  Lançar Ocorrência
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="text-xs font-semibold">Indicador de Qualidade</TableHead>
                <TableHead className="text-xs font-semibold">Ocorrências / Casos</TableHead>
                <TableHead className="text-xs font-semibold text-right">Taxa Percentual (%)</TableHead>
                {podeGerir && (
                  <TableHead className="text-xs font-semibold text-right pr-4">Ações / Edição</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ind.rows.map((row) => (
                <TableRow key={row.n} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold text-xs text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{row.n}</span>
                      {row.tipo && (
                        <span className="text-[10px] text-muted-foreground uppercase font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                          {row.tipo}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.c > 0 ? (
                      <button
                        type="button"
                        onClick={() => row.tipo && abrirGerenciarTipo(row.tipo)}
                        className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                        title="Ver e gerenciar os casos deste indicador"
                      >
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {row.c} caso(s) registrado(s)
                      </button>
                    ) : (
                      <span className="text-muted-foreground">0 casos</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={row.c > 0 ? 'default' : 'secondary'}
                      className={cn(
                        'font-mono text-xs font-semibold',
                        row.c > 0 && 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      )}
                    >
                      {row.taxa.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  {podeGerir && (
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.c > 0 && (
                          <Button
                            size="xs"
                            variant="ghost"
                            className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() => row.tipo && abrirGerenciarTipo(row.tipo)}
                            title="Ver e editar casos deste indicador"
                          >
                            <Eye className="size-3" />
                            Ver / Editar
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="outline"
                          className="h-7 px-2 text-[11px] gap-1 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                          onClick={() => abrirNovaOcorrencia(row.tipo as EventoTipo)}
                          title={`Lançar novo caso de ${row.n}`}
                        >
                          <Plus className="size-3" />
                          Lançar caso
                        </Button>
                      </div>
                    </TableCell>
                  )}
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

            {/* Upload de Documento Digitalizado (PDF ou Imagem) */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Via Digitalizada Original (PDF ou Imagem)</span>
                <span className="text-[10px] text-muted-foreground font-normal">Exigência Vigilância</span>
              </Label>

              <div className="border border-dashed border-border/80 rounded-xl p-3 bg-muted/10 text-center">
                {arquivoSelecionado ? (
                  <div className="flex items-center justify-between gap-2 bg-card p-2 rounded-lg border border-border">
                    <div className="flex items-center gap-2 min-w-0 text-left">
                      <FileCheck2 className="size-4 text-teal-600 shrink-0" />
                      <div className="min-w-0 text-xs">
                        <span className="font-semibold block truncate">{arquivoSelecionado.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatarTamanhoArquivo(arquivoSelecionado.size)} (Novo arquivo selecionado)
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-rose-600"
                      onClick={() => {
                        setArquivoSelecionado(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      title="Descartar seleção"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : anexoAtual && !removerAnexoExistente ? (
                  <div className="flex items-center justify-between gap-2 bg-card p-2 rounded-lg border border-border">
                    <div className="flex items-center gap-2 min-w-0 text-left">
                      <FileCheck2 className="size-4 text-teal-600 shrink-0" />
                      <div className="min-w-0 text-xs">
                        <span className="font-semibold block truncate">{anexoAtual.nomeArquivo}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatarTamanhoArquivo(anexoAtual.tamanho)} · Anexo cadastrado
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[10px] gap-1"
                        onClick={() => {
                          setDocParaVisualizar({ anexo: anexoAtual, titulo: docNome || 'Licença' })
                          setModalVisualizarDoc(true)
                        }}
                      >
                        <Eye className="size-3" /> Ver
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-rose-600"
                        onClick={() => setRemoverAnexoExistente(true)}
                        title="Remover anexo"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,image/*,.doc,.docx"
                      className="hidden"
                      id="input-alvara-doc"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setArquivoSelecionado(e.target.files[0])
                          setRemoverAnexoExistente(false)
                        }
                      }}
                    />
                    <label
                      htmlFor="input-alvara-doc"
                      className="cursor-pointer flex flex-col items-center justify-center gap-1.5 py-2 hover:opacity-80 transition-opacity"
                    >
                      <UploadCloud className="size-6 text-teal-600" />
                      <span className="text-xs font-semibold text-foreground">
                        Clique para anexar arquivo PDF ou foto do Alvará
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Aceita PDF, JPG, PNG e DOCX (até 15MB)
                      </span>
                    </label>
                  </div>
                )}
              </div>
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

      {/* Dialog: Gerenciar Ocorrências Sanitárias do Mês */}
      <Dialog open={dialogOcorrenciasOpen} onOpenChange={setDialogOcorrenciasOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="pb-2 border-b border-border/40">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <DialogTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="size-5 text-amber-600" />
                  Ocorrências da Vigilância Sanitária — {mesInd}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Eventos sentinela registrados no mês selecionado que compõem as taxas da RDC 502/2021.
                </DialogDescription>
              </div>
              <Button
                size="sm"
                onClick={() => abrirNovaOcorrencia(filtroTipoOco !== 'todos' ? (filtroTipoOco as EventoTipo) : undefined)}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shrink-0 text-xs h-8"
              >
                <Plus className="size-3.5" />
                Nova Ocorrência
              </Button>
            </div>

            {/* Filtro por Indicador */}
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ListFilter className="size-3 text-muted-foreground" />
                Filtrar:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="xs"
                  variant={filtroTipoOco === 'todos' ? 'default' : 'outline'}
                  onClick={() => setFiltroTipoOco('todos')}
                  className={cn(
                    'h-6 text-[11px] rounded-full px-2.5',
                    filtroTipoOco === 'todos' && 'bg-amber-600 hover:bg-amber-700 text-white'
                  )}
                >
                  Todos ({eventosDoMes.length})
                </Button>
                {INDICADORES_VIGILANCIA.map(([k, n]) => {
                  const qtd = eventosDoMes.filter((e) => e.tipo === k).length
                  return (
                    <Button
                      key={k}
                      size="xs"
                      variant={filtroTipoOco === k ? 'default' : 'outline'}
                      onClick={() => setFiltroTipoOco(k)}
                      className={cn(
                        'h-6 text-[11px] rounded-full px-2.5',
                        filtroTipoOco === k && 'bg-amber-600 hover:bg-amber-700 text-white'
                      )}
                    >
                      {n.split(' ')[0]} {n.includes('(') ? n.match(/\((.*?)\)/)?.[0] : ''} ({qtd})
                    </Button>
                  )
                })}
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 py-2">
            {eventosFiltrados.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="size-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                  <CheckCircle2 className="size-5" />
                </div>
                <p className="text-xs font-medium text-foreground">
                  Nenhuma ocorrência registrada para os filtros selecionados no mês {mesInd}.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Você pode lançar novos eventos sentinela ou retificar ocorrências a qualquer momento.
                </p>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => abrirNovaOcorrencia(filtroTipoOco !== 'todos' ? (filtroTipoOco as EventoTipo) : undefined)}
                  className="mt-2 text-xs gap-1"
                >
                  <Plus className="size-3" />
                  Lançar Ocorrência
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-28">Data</TableHead>
                    <TableHead>Indicador / Evento</TableHead>
                    <TableHead>Residente</TableHead>
                    <TableHead className="text-right w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventosFiltrados.map((ev) => {
                    const res = residentes.find((r) => r.id === ev.resId)
                    return (
                      <TableRow key={ev.id} className="text-xs hover:bg-muted/40">
                        <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                          {fmt(ev.data)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                            {ROTULO_EVENTO[ev.tipo] || ev.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {res ? (
                            <span>
                              {res.nome}{' '}
                              {res.quarto && (
                                <span className="text-[11px] text-muted-foreground font-normal">
                                  (Q. {res.quarto})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              {ev.resId ? `ID: ${ev.resId}` : 'Não informado'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-muted-foreground hover:text-foreground"
                              onClick={() => abrirEditarOcorrencia(ev)}
                              title="Editar data, indicador ou residente"
                            >
                              <Edit className="size-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                              onClick={() => setOcoParaExcluir(ev)}
                              title="Excluir ocorrência"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border/40">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOcorrenciasOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nova / Editar Ocorrência Sanitária */}
      <Dialog open={dialogOcoFormOpen} onOpenChange={setDialogOcoFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-amber-600" />
              {ocoEditando ? 'Editar Ocorrência Sanitária' : 'Nova Ocorrência Sanitária'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Evento sentinela de notificação compulsória para os indicadores da Vigilância Sanitária (RDC 502/2021).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Indicador / Tipo de Evento *</Label>
              <Select
                value={ocoTipo}
                onValueChange={(val) => setOcoTipo(val as EventoTipo)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o indicador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lpp">Prevalência de lesão por pressão (LPP)</SelectItem>
                  <SelectItem value="escabiose">Incidência de escabiose</SelectItem>
                  <SelectItem value="dda">Incidência de DDA (Doença Diarreica Aguda)</SelectItem>
                  <SelectItem value="desidratacao">Incidência de desidratação</SelectItem>
                  <SelectItem value="desnutricao">Prevalência de desnutrição</SelectItem>
                  <SelectItem value="obito">Taxa de mortalidade (Óbito)</SelectItem>
                  <SelectItem value="queda">Queda da própria altura / leito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Residente Envolvido *</Label>
              <Select
                value={ocoResId}
                onValueChange={(val) => setOcoResId(val)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o residente" />
                </SelectTrigger>
                <SelectContent>
                  {residentes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nome} {r.quarto ? `(Quarto ${r.quarto})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Data da Ocorrência *</Label>
              <Input
                type="date"
                value={ocoData}
                onChange={(e) => setOcoData(e.target.value)}
                className="text-xs"
              />
            </div>

            {!ocoEditando && (
              <div className="space-y-1.5">
                <Label className="text-xs">Relato Circunstancial e Conduta (Opcional)</Label>
                <textarea
                  rows={2}
                  value={ocoRelato}
                  onChange={(e) => setOcoRelato(e.target.value)}
                  placeholder="Se preenchido, será registrado também no prontuário de anotações do residente."
                  className="w-full text-xs rounded-md border border-input bg-background p-2 focus-visible:outline-ring"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOcoFormOpen(false)}
              disabled={salvandoOco}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarOcorrencia}
              disabled={salvandoOco}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {salvandoOco
                ? 'Salvando...'
                : ocoEditando
                ? 'Atualizar Ocorrência'
                : 'Registrar Ocorrência'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão de Ocorrência */}
      <Dialog
        open={!!ocoParaExcluir}
        onOpenChange={(open) => !open && setOcoParaExcluir(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <Trash2 className="size-4" /> Excluir Ocorrência Sanitária
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deseja remover o registro de{' '}
              <strong>
                {ocoParaExcluir ? ROTULO_EVENTO[ocoParaExcluir.tipo] || ocoParaExcluir.tipo : ''}
              </strong>{' '}
              do dia {ocoParaExcluir ? fmt(ocoParaExcluir.data) : ''}? Os cálculos dos indicadores serão atualizados imediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOcoParaExcluir(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleExcluirOcorrencia}
            >
              Excluir Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Visualizador de Documento Anexo */}
      <VisualizadorDocumentoModal
        anexo={docParaVisualizar?.anexo ?? null}
        tituloDocumento={docParaVisualizar?.titulo}
        aberto={modalVisualizarDoc}
        onClose={() => setModalVisualizarDoc(false)}
      />
    </div>
  )
}
