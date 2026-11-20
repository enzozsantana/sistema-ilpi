import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import {
  FileText,
  Printer,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Pill,
  Sparkles,
  Stethoscope,
  Building2,
  Eye,
  Edit3,
} from 'lucide-react'
import { toast } from 'sonner'
import { mascaraConselho } from '../lib/masks'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { iso, agoraHM, fmt, idade } from '../lib/business/dates'
import {
  EXAMES_PREDEFINIDOS,
  GRUPOS_EXAMES,
  PRESETS_INDICACAO_CLINICA,
  PRESETS_ORIENTACOES_COLETA,
  converterPrescricoesParaReceita,
  formatarDataExtenso,
  gerarTituloResumo,
  salvarPedidoLocal,
  type MedicamentoReceita,
  type PedidoMedicoData,
  type TipoPedido,
} from '../lib/business/pedidosMedicos'
import type { Residente } from '../types/ilpi'
import { cn } from '@/lib/utils'
import { salvarRascunho, obterRascunho, limparRascunho, temRascunho } from '../lib/draftStorage'

interface ModalPedidoMedicoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  residente: Residente
  tipoInicial?: TipoPedido
  pedidoExistente?: PedidoMedicoData | null
  onPedidoSalvo?: () => void
  className?: string
}

export function ModalPedidoMedico({
  open,
  onOpenChange,
  residente,
  tipoInicial = 'exames',
  pedidoExistente = null,
  onPedidoSalvo,
  className,
}: ModalPedidoMedicoProps) {
  const { profissional } = useAuth()
  const { inst, refresh } = useIlpiData()

  // Aba ativa: formulário ('edicao') ou folha A4 ('visualizacao')
  const [modo, setModo] = useState<'edicao' | 'visualizacao'>('edicao')
  const [salvando, setSalvando] = useState(false)

  // Dados do formulário
  const [tipo, setTipo] = useState<TipoPedido>(tipoInicial)
  const [dataEmissao, setDataEmissao] = useState(iso(new Date()))
  const [horaEmissao, setHoraEmissao] = useState(agoraHM())

  // Exames
  const [examesSelecionados, setExamesSelecionados] = useState<string[]>([])
  const [examesLivres, setExamesLivres] = useState('')
  const [indicacaoClinica, setIndicacaoClinica] = useState('')
  const [cid10, setCid10] = useState('')
  const [observacoesColeta, setObservacoesColeta] = useState('Coleta em domicílio / no leito na ILPI')

  // Receita
  const [tipoReceita, setTipoReceita] = useState<'simples' | 'controle_especial'>('simples')
  const [medicamentos, setMedicamentos] = useState<MedicamentoReceita[]>([])
  const [medNome, setMedNome] = useState('')
  const [medDose, setMedDose] = useState('')
  const [medPosologia, setMedPosologia] = useState('')
  const [medVia, setMedVia] = useState('VO')
  const [medQtd, setMedQtd] = useState('1 cx')
  const [orientacoesGerais, setOrientacoesGerais] = useState('')

  // Encaminhamento
  const [especialidadeDestino, setEspecialidadeDestino] = useState('')
  const [motivoEncaminhamento, setMotivoEncaminhamento] = useState('')
  const [resumoClinico, setResumoClinico] = useState('')

  // Profissional / Prescritor
  const [prescritorNome, setPrescritorNome] = useState(profissional?.nome || '')
  const [prescritorConselho, setPrescritorConselho] = useState(profissional?.conselho || 'CRM/SP')
  const [prescritorFuncao, setPrescritorFuncao] = useState(profissional?.funcao || 'Médico(a) Assistente')

  // Inicialização ao abrir ou trocar pedidoExistente
  useEffect(() => {
    if (!open) return

    if (pedidoExistente) {
      setTipo(pedidoExistente.tipo)
      setDataEmissao(pedidoExistente.data)
      setHoraEmissao(pedidoExistente.hora)
      setExamesSelecionados(pedidoExistente.examesSelecionados || [])
      setExamesLivres(pedidoExistente.examesLivres || '')
      setIndicacaoClinica(pedidoExistente.indicacaoClinica || '')
      setCid10(pedidoExistente.cid10 || '')
      setObservacoesColeta(pedidoExistente.observacoesColeta || '')
      setTipoReceita(pedidoExistente.tipoReceita || 'simples')
      setMedicamentos(pedidoExistente.medicamentos || [])
      setOrientacoesGerais(pedidoExistente.orientacoesGerais || '')
      setEspecialidadeDestino(pedidoExistente.especialidadeDestino || '')
      setMotivoEncaminhamento(pedidoExistente.motivoEncaminhamento || '')
      setResumoClinico(pedidoExistente.resumoClinico || '')
      setPrescritorNome(pedidoExistente.prescritor.nome)
      setPrescritorConselho(pedidoExistente.prescritor.conselho || '')
      setPrescritorFuncao(pedidoExistente.prescritor.funcao || '')
      setModo('visualizacao')
    } else {
      const draftKey = `pedido_medico_draft_${residente.id}`
      const rascunho = obterRascunho<any>(draftKey)
      if (rascunho?.dados) {
        setTipo(rascunho.dados.tipo || tipoInicial)
        setDataEmissao(rascunho.dados.dataEmissao || iso(new Date()))
        setHoraEmissao(rascunho.dados.horaEmissao || agoraHM())
        setExamesSelecionados(rascunho.dados.examesSelecionados || [])
        setExamesLivres(rascunho.dados.examesLivres || '')
        setIndicacaoClinica(rascunho.dados.indicacaoClinica || 'Avaliação clínica periódica de rotina geriátrica na ILPI')
        setCid10(rascunho.dados.cid10 || '')
        setObservacoesColeta(rascunho.dados.observacoesColeta || 'Coleta em domicílio / no leito na ILPI')
        setTipoReceita(rascunho.dados.tipoReceita || 'simples')
        setMedicamentos(rascunho.dados.medicamentos || [])
        setOrientacoesGerais(rascunho.dados.orientacoesGerais || '')
        setEspecialidadeDestino(rascunho.dados.especialidadeDestino || '')
        setMotivoEncaminhamento(rascunho.dados.motivoEncaminhamento || '')
        setResumoClinico(rascunho.dados.resumoClinico || '')
        setPrescritorNome(rascunho.dados.prescritorNome || profissional?.nome || '')
        setPrescritorConselho(rascunho.dados.prescritorConselho || profissional?.conselho || 'CRM/SP')
        setPrescritorFuncao(rascunho.dados.prescritorFuncao || profissional?.funcao || 'Médico(a) Assistente')
      } else {
        setTipo(tipoInicial)
        setDataEmissao(iso(new Date()))
        setHoraEmissao(agoraHM())
        setExamesSelecionados([])
        setExamesLivres('')
        setIndicacaoClinica('Avaliação clínica periódica de rotina geriátrica na ILPI')
        setCid10('')
        setObservacoesColeta('Coleta em domicílio / no leito na ILPI')
        setTipoReceita('simples')
        setMedicamentos([])
        setOrientacoesGerais('')
        setEspecialidadeDestino('')
        setMotivoEncaminhamento('')
        setResumoClinico('')
        setPrescritorNome(profissional?.nome || '')
        setPrescritorConselho(profissional?.conselho || 'CRM/SP')
        setPrescritorFuncao(profissional?.funcao || 'Médico(a) Assistente')
      }
      setModo('edicao')
    }
  }, [open, pedidoExistente, tipoInicial, profissional, residente.id])

  // Auto-save debounced do formulário para evitar perda de dados caso a conexão caia ou a máquina desligue
  useEffect(() => {
    if (!open || pedidoExistente || modo !== 'edicao') return
    const draftKey = `pedido_medico_draft_${residente.id}`

    const temConteudo =
      examesSelecionados.length > 0 ||
      examesLivres.trim() ||
      medicamentos.length > 0 ||
      orientacoesGerais.trim() ||
      motivoEncaminhamento.trim() ||
      resumoClinico.trim() ||
      cid10.trim()

    const timer = setTimeout(() => {
      if (temConteudo) {
        salvarRascunho(draftKey, {
          tipo,
          dataEmissao,
          horaEmissao,
          examesSelecionados,
          examesLivres,
          indicacaoClinica,
          cid10,
          observacoesColeta,
          tipoReceita,
          medicamentos,
          orientacoesGerais,
          especialidadeDestino,
          motivoEncaminhamento,
          resumoClinico,
          prescritorNome,
          prescritorConselho,
          prescritorFuncao,
        })
      } else {
        limparRascunho(draftKey)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [
    open,
    pedidoExistente,
    modo,
    residente.id,
    tipo,
    dataEmissao,
    horaEmissao,
    examesSelecionados,
    examesLivres,
    indicacaoClinica,
    cid10,
    observacoesColeta,
    tipoReceita,
    medicamentos,
    orientacoesGerais,
    especialidadeDestino,
    motivoEncaminhamento,
    resumoClinico,
    prescritorNome,
    prescritorConselho,
    prescritorFuncao,
  ])

  function toggleExame(nomeExame: string) {
    if (examesSelecionados.includes(nomeExame)) {
      setExamesSelecionados(examesSelecionados.filter((e) => e !== nomeExame))
    } else {
      setExamesSelecionados([...examesSelecionados, nomeExame])
    }
  }

  function handleImportarPrescricoesAtuais() {
    const convertidos = converterPrescricoesParaReceita(residente)
    if (convertidos.length === 0) {
      toast.info('O residente não possui medicamentos vigentes cadastrados na aba de prescrição.')
      return
    }
    setMedicamentos(convertidos)
    toast.success(`${convertidos.length} medicamentos ativos importados para o receituário!`)
  }

  function handleAdicionarMedicamento() {
    if (!medNome.trim()) {
      toast.error('Informe o nome do medicamento.')
      return
    }
    const novo: MedicamentoReceita = {
      nome: medNome.trim(),
      dose: medDose.trim() || '1 comprimido',
      posologia: medPosologia.trim() || 'Conforme prescrição',
      via: medVia.trim() || 'VO',
      quantidade: medQtd.trim() || '1 cx',
      usoContinuo: true,
    }
    setMedicamentos([...medicamentos, novo])
    setMedNome('')
    setMedDose('')
    setMedPosologia('')
    setMedQtd('1 cx')
  }

  function handleRemoverMedicamento(index: number) {
    setMedicamentos(medicamentos.filter((_, i) => i !== index))
  }

  function montarDadosPedido(): PedidoMedicoData {
    return {
      id: pedidoExistente?.id || `ped_${Date.now()}`,
      residenteId: residente.id,
      tipo,
      data: dataEmissao,
      hora: horaEmissao,
      prescritor: {
        id: profissional?.id || 'prof_auto',
        nome: prescritorNome.trim() || profissional?.nome || 'Médico(a) Assistente',
        conselho: prescritorConselho.trim() || profissional?.conselho || 'CRM',
        funcao: prescritorFuncao.trim() || profissional?.funcao || 'Médico(a)',
        cat: profissional?.cat || 'med',
      },
      examesSelecionados,
      examesLivres: examesLivres.trim() || undefined,
      indicacaoClinica: indicacaoClinica.trim() || undefined,
      cid10: cid10.trim() || undefined,
      observacoesColeta: observacoesColeta.trim() || undefined,
      tipoReceita,
      medicamentos,
      orientacoesGerais: orientacoesGerais.trim() || undefined,
      especialidadeDestino: especialidadeDestino.trim() || undefined,
      motivoEncaminhamento: motivoEncaminhamento.trim() || undefined,
      resumoClinico: resumoClinico.trim() || undefined,
    }
  }

  async function handleSalvarEContinuar(imprimirApos: boolean = false) {
    if (tipo === 'exames' && examesSelecionados.length === 0 && !examesLivres.trim()) {
      toast.error('Selecione ou digite ao menos um exame para o pedido.')
      return
    }
    if (tipo === 'receituario' && medicamentos.length === 0) {
      toast.error('Adicione ao menos um medicamento no receituário.')
      return
    }
    if (tipo === 'encaminhamento' && !motivoEncaminhamento.trim()) {
      toast.error('Informe o motivo do encaminhamento.')
      return
    }

    setSalvando(true)
    const pedido = montarDadosPedido()

    // 1. Salva localmente com todos os metadados ricos para reabertura
    salvarPedidoLocal(pedido)

    // 2. Registra no histórico de arquivos do residente no Supabase
    const titulo = gerarTituloResumo(pedido)
    const categoria = tipo === 'receituario' ? 'Receita' : 'Pedido Médico'

    try {
      // Verifica se já existe arquivo com esse id
      const { data: existente } = await supabase
        .from('arquivos')
        .select('id')
        .eq('id', pedido.id)
        .maybeSingle()

      if (!existente) {
        await supabase.from('arquivos').insert({
          id: pedido.id,
          residente_id: residente.id,
          nome: titulo,
          categoria,
          data: pedido.data,
          area: 'Médica',
        })
      } else {
        await supabase
          .from('arquivos')
          .update({
            nome: titulo,
            categoria,
            data: pedido.data,
          })
          .eq('id', pedido.id)
      }
    } catch (err) {
      console.warn('Registro em arquivos finalizado com fallback:', err)
    }

    setSalvando(false)
    limparRascunho(`pedido_medico_draft_${residente.id}`)
    toast.success('Pedido médico registrado com sucesso no prontuário!')
    await refresh()
    onPedidoSalvo?.()

    if (imprimirApos) {
      setModo('visualizacao')
      setTimeout(() => {
        window.print()
      }, 350)
    } else {
      setModo('visualizacao')
    }
  }

  function handleImprimirDireto() {
    window.print()
  }

  if (!residente) return null

  const idadeAnos = residente.nasc ? idade(residente.nasc) : ''
  const dataExtenso = formatarDataExtenso(dataEmissao)
  const nomeInstituicao = inst || 'Instituição de Longa Permanência para Idosos'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="!z-[75]"
        className={cn(
          '!z-[80] !w-[96vw] !max-w-[96vw] sm:!max-w-[96vw] lg:!max-w-[96vw] xl:!max-w-[1600px] !max-h-[94vh] overflow-y-auto overflow-x-hidden p-0 gap-0 border-border/80 shadow-2xl',
          className
        )}
      >
        {/* CABEÇALHO DO MODAL (Não aparece na impressão) */}
        <div className="no-print p-5 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground flex-wrap">
                <Stethoscope className="size-5 text-emerald-600 dark:text-emerald-400" />
                <span>{pedidoExistente ? 'Visualizar / Re-imprimir Pedido Médico' : 'Emissão de Pedido Médico & Exames'}</span>
                {!pedidoExistente && temRascunho(`pedido_medico_draft_${residente.id}`) && (
                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full ml-1">
                    ✓ Rascunho salvo automaticamente
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Gere pedidos de exames laboratoriais, receituários e guias com folha timbrada A4 pronta para impressão.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              size="sm"
              variant={modo === 'edicao' ? 'default' : 'outline'}
              onClick={() => setModo('edicao')}
              className="text-xs h-8 gap-1.5 rounded-xl font-semibold"
            >
              <Edit3 className="size-3.5" /> Preencher
            </Button>
            <Button
              size="sm"
              variant={modo === 'visualizacao' ? 'default' : 'outline'}
              onClick={() => setModo('visualizacao')}
              className="text-xs h-8 gap-1.5 rounded-xl font-semibold"
            >
              <Eye className="size-3.5" /> Visualizar A4
            </Button>
            <Button
              size="sm"
              onClick={handleImprimirDireto}
              className="text-xs h-8 gap-1.5 rounded-xl font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
            >
              <Printer className="size-3.5" /> Imprimir
            </Button>
          </div>
        </div>

        {/* =========================================================================
            MODO 1: EDIÇÃO / PREENCHIMENTO DO PEDIDO (no-print)
            ========================================================================= */}
        {modo === 'edicao' && (
          <div className="no-print p-6 space-y-6 text-xs">
            {/* 1. SELETOR DE TIPO DE DOCUMENTO */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Tipo de Solicitação Médica *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTipo('exames')}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all flex items-start gap-2.5',
                    tipo === 'exames'
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-600'
                      : 'border-border/70 hover:bg-muted/30 text-muted-foreground'
                  )}
                >
                  <FileText className="size-4 mt-0.5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block text-xs">Pedido de Exames</span>
                    <span className="text-[11px] opacity-80 block">Laboratório, EAS, Sangue e Imagem</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('receituario')}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all flex items-start gap-2.5',
                    tipo === 'receituario'
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-600'
                      : 'border-border/70 hover:bg-muted/30 text-muted-foreground'
                  )}
                >
                  <Pill className="size-4 mt-0.5 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold block text-xs">Receituário Médico</span>
                    <span className="text-[11px] opacity-80 block">Medicamentos e posologia (Simples/Controlado)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('encaminhamento')}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all flex items-start gap-2.5',
                    tipo === 'encaminhamento'
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-600'
                      : 'border-border/70 hover:bg-muted/30 text-muted-foreground'
                  )}
                >
                  <Building2 className="size-4 mt-0.5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold block text-xs">Guia de Encaminhamento</span>
                    <span className="text-[11px] opacity-80 block">Parecer especialista ou transferência</span>
                  </div>
                </button>
              </div>
            </div>

            {/* IDENTIFICAÇÃO DO RESIDENTE PREVIEW */}
            <div className="p-3.5 bg-muted/30 rounded-xl border border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm">{residente.nome}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{idadeAnos} anos ({fmt(residente.nasc)})</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">Quarto {residente.quarto || '–'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-background">
                  {residente.convenio ? String(residente.convenio) : 'Particular / SUS'}
                </Badge>
                {Boolean(residente.alergias) && (
                  <Badge variant="destructive" className="text-[10px]">
                    Alergias: {residente.alergias}
                  </Badge>
                )}
              </div>
            </div>

            {/* SEÇÃO ESPECÍFICA: PEDIDO DE EXAMES */}
            {tipo === 'exames' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-bold text-foreground">Exames Frequentes em ILPI (Clique para selecionar)</Label>
                    <span className="text-[11px] text-muted-foreground block">
                      {examesSelecionados.length} exame(s) selecionado(s) para o pedido
                    </span>
                  </div>
                  {examesSelecionados.length > 0 && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setExamesSelecionados([])}
                      className="text-rose-600 hover:text-rose-700 text-xs h-6 px-2"
                    >
                      Limpar seleção
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {GRUPOS_EXAMES.map((grupo) => {
                    const examesDoGrupo = EXAMES_PREDEFINIDOS.filter((e) => e.grupo === grupo.id)
                    return (
                      <div key={grupo.id} className="space-y-2">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground block">
                          {grupo.label}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                          {examesDoGrupo.map((exame) => {
                            const marcado = examesSelecionados.includes(exame.nome)
                            return (
                              <button
                                key={exame.id}
                                type="button"
                                onClick={() => toggleExame(exame.nome)}
                                className={cn(
                                  'flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all',
                                  marcado
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-300 font-semibold'
                                    : 'border-border/50 hover:bg-muted/40 text-foreground'
                                )}
                              >
                                {marcado ? (
                                  <CheckSquare className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                  <Square className="size-4 text-muted-foreground/60 shrink-0" />
                                )}
                                <span className="truncate">{exame.nome}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Exames adicionais livres */}
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-semibold">Outros Exames Específicos (opcional)</Label>
                  <Input
                    placeholder="ex: Troponina T ultrassensível, D-Dímero, Tomografia de Crânio..."
                    value={examesLivres}
                    onChange={(e) => setExamesLivres(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {/* Indicação Clínica & Hipótese Diagnóstica */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Indicação Clínica / Hipótese Diagnóstica *</Label>
                    <span className="text-[10px] text-muted-foreground">Sugestões rápidas abaixo:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {PRESETS_INDICACAO_CLINICA.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setIndicacaoClinica(p)}
                        className="text-[10px] bg-muted/60 hover:bg-muted px-2 py-0.5 rounded-md border border-border/60 transition-colors text-muted-foreground"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-3">
                      <Input
                        placeholder="ex: Avaliação de rotina geriátrica semestral / Suspeita de infecção urinária"
                        value={indicacaoClinica}
                        onChange={(e) => setIndicacaoClinica(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="CID-10 (opcional)"
                        value={cid10}
                        onChange={(e) => setCid10(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Instruções de Coleta */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Orientações de Coleta / Observações</Label>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {PRESETS_ORIENTACOES_COLETA.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setObservacoesColeta((prev) => (prev ? `${prev}; ${p}` : p))
                        }
                        className="text-[10px] bg-muted/60 hover:bg-muted px-2 py-0.5 rounded-md border border-border/60 transition-colors text-muted-foreground"
                      >
                        + {p}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="ex: Coleta no leito / Jejum de 8 a 12 horas"
                    value={observacoesColeta}
                    onChange={(e) => setObservacoesColeta(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            {/* SEÇÃO ESPECÍFICA: RECEITUÁRIO */}
            {tipo === 'receituario' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/40 rounded-xl">
                  <div>
                    <span className="font-bold text-xs text-blue-900 dark:text-blue-200 block">
                      Agilidade no Receituário
                    </span>
                    <span className="text-[11px] text-blue-800/80 dark:text-blue-300 block">
                      Copie os medicamentos já ativos do prontuário com apenas 1 clique.
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    onClick={handleImportarPrescricoesAtuais}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 rounded-lg text-xs font-semibold"
                  >
                    <Sparkles className="size-3.5" /> Importar Medicamentos Atuais
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo de Receituário *</Label>
                    <select
                      value={tipoReceita}
                      onChange={(e) => setTipoReceita(e.target.value as 'simples' | 'controle_especial')}
                      className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs shadow-2xs outline-none"
                    >
                      <option value="controle_especial">Receita de Controle Especial (Portaria 344/98 - 2 vias)</option>
                      <option value="simples">Receituário Simples (Branco)</option>
                    </select>
                  </div>
                </div>

                {/* Lista de Medicamentos na receita */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Medicamentos na Receita ({medicamentos.length})</Label>
                  {medicamentos.length === 0 ? (
                    <div className="p-4 border border-dashed rounded-xl text-center text-muted-foreground text-xs">
                      Nenhum medicamento adicionado à receita ainda.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {medicamentos.map((med, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-border/70 flex items-center justify-between gap-3 bg-muted/20"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-foreground text-xs block">
                              {idx + 1}. {med.nome} — {med.dose} ({med.via})
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              Posologia: {med.posologia} {med.quantidade ? `· Quantidade: ${med.quantidade}` : ''}
                            </span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoverMedicamento(idx)}
                            className="size-7 text-rose-600 hover:bg-rose-500/10 shrink-0"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form para adicionar item avulso */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/10 space-y-3">
                  <span className="font-bold text-xs block text-foreground">+ Adicionar Medicamento Avulso</span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <Label className="text-[10px]">Nome do Medicamento *</Label>
                      <Input
                        placeholder="ex: Paracetamol 750mg"
                        value={medNome}
                        onChange={(e) => setMedNome(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Dosagem</Label>
                      <Input
                        placeholder="ex: 1 cp"
                        value={medDose}
                        onChange={(e) => setMedDose(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Via</Label>
                      <Input
                        placeholder="ex: VO"
                        value={medVia}
                        onChange={(e) => setMedVia(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-3">
                      <Label className="text-[10px]">Como Tomar / Posologia</Label>
                      <Input
                        placeholder="ex: Tomar 1 comprimido de 8 em 8 horas se dor ou febre"
                        value={medPosologia}
                        onChange={(e) => setMedPosologia(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Quantidade</Label>
                      <Input
                        placeholder="ex: 1 caixa"
                        value={medQtd}
                        onChange={(e) => setMedQtd(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    onClick={handleAdicionarMedicamento}
                    className="text-xs h-7 gap-1 font-semibold"
                  >
                    <Plus className="size-3" /> Incluir Medicamento
                  </Button>
                </div>

                {/* Orientações gerais */}
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs">Orientações Gerais ao Paciente / Cuidador</Label>
                  <Input
                    placeholder="ex: Ingerir com bastante líquido. Evitar jejum prolongado."
                    value={orientacoesGerais}
                    onChange={(e) => setOrientacoesGerais(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            {/* SEÇÃO ESPECÍFICA: GUIA DE ENCAMINHAMENTO */}
            {tipo === 'encaminhamento' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Especialidade / Destino *</Label>
                  <Input
                    placeholder="ex: Cardiologia / Neurologia / Pronto Atendimento Hospitalar"
                    value={especialidadeDestino}
                    onChange={(e) => setEspecialidadeDestino(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Motivo do Encaminhamento *</Label>
                  <Input
                    placeholder="ex: Avaliação de pico pressórico refratário e síncope recente"
                    value={motivoEncaminhamento}
                    onChange={(e) => setMotivoEncaminhamento(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Resumo Clínico / Histórico / Medicamentos em Uso</Label>
                  <textarea
                    rows={4}
                    placeholder="Descreva brevemente as condições clínicas, antecedentes, sinais vitais recentes e conduta prévia adotada..."
                    value={resumoClinico}
                    onChange={(e) => setResumoClinico(e.target.value)}
                    className="w-full rounded-xl border border-input bg-transparent p-3 text-xs shadow-2xs outline-none"
                  />
                </div>
              </div>
            )}

            {/* DADOS DO PROFISSIONAL EMISSOR & DATA */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
              <span className="font-bold text-xs text-foreground block">
                Dados do Médico / Profissional Emissor (para o carimbo e assinatura)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Nome Completo</Label>
                  <Input
                    value={prescritorNome}
                    onChange={(e) => setPrescritorNome(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Conselho / Registro (CRM / COREN)</Label>
                  <Input
                    value={prescritorConselho}
                    onChange={(e) => setPrescritorConselho(mascaraConselho(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Data de Emissão</Label>
                  <Input
                    type="date"
                    value={dataEmissao}
                    onChange={(e) => setDataEmissao(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODO 2: FOLHA TIMBRADA A4 DE IMPRESSÃO (aparece na tela e no print)
            ========================================================================= */}
        <div
          className={cn(
            'w-full bg-slate-100/70 dark:bg-slate-900/40 p-4 sm:p-8 flex justify-center overflow-x-hidden',
            modo === 'edicao' ? 'hidden' : 'block'
          )}
        >
          <div
            className="folha-impressao-a4 bg-white text-slate-900 p-8 sm:p-12 transition-all font-sans w-full max-w-[210mm] shadow-xl border border-slate-200 rounded-sm"
            style={{ minHeight: '297mm' }}
          >
          {/* CABEÇALHO INSTITUCIONAL */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                {nomeInstituicao}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Prontuário Médico & Assistencial · Atenção Integral à Saúde do Idoso
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <p className="font-semibold text-slate-700">Via Original do Documento</p>
              <p>Emissão: {fmt(dataEmissao)} às {horaEmissao}</p>
            </div>
          </div>

          {/* BOX IDENTIFICAÇÃO DO PACIENTE */}
          <div className="border border-slate-300 rounded-md p-3.5 mb-6 bg-slate-50/50 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Paciente / Residente</span>
                <span className="font-bold text-sm text-slate-900 block">{residente.nome}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-bold">Idade / Nasc.</span>
                <span className="font-semibold text-slate-900 block">
                  {idadeAnos ? `${idadeAnos} anos` : '–'} ({fmt(residente.nasc)})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500 text-[10px] block">Acomodação:</span>
                <span className="font-medium text-slate-800">Quarto {residente.quarto || '–'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Convênio / SUS:</span>
                <span className="font-medium text-slate-800">{String(residente.convenio || 'Particular')}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 text-[10px] block">Alergias Conhecidas:</span>
                <span className={cn('font-bold', residente.alergias ? 'text-rose-700' : 'text-emerald-700')}>
                  {residente.alergias || 'Nenhuma alergia relatada'}
                </span>
              </div>
            </div>
          </div>

          {/* TÍTULO DO DOCUMENTO */}
          <div className="text-center my-6">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-2 inline-block px-6">
              {tipo === 'exames' && 'Solicitação de Exames Complementares'}
              {tipo === 'receituario' && (tipoReceita === 'controle_especial' ? 'Receituário de Controle Especial' : 'Receituário Médico')}
              {tipo === 'encaminhamento' && 'Guia de Encaminhamento & Relatório Médico'}
            </h2>
          </div>

          {/* CORPO DO DOCUMENTO: EXAMES */}
          {tipo === 'exames' && (
            <div className="space-y-6 text-xs text-slate-900">
              <div>
                <p className="font-semibold text-slate-800 mb-3">
                  Solicito a realização dos seguintes exames complementares para o(a) paciente acima identificado(a):
                </p>

                <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed text-slate-900">
                  {examesSelecionados.map((item, i) => (
                    <li key={i} className="font-medium">
                      {item}
                    </li>
                  ))}
                  {Boolean(examesLivres.trim()) && (
                    <li className="font-medium">
                      {examesLivres.trim()}
                    </li>
                  )}
                </ol>

                {examesSelecionados.length === 0 && !examesLivres.trim() && (
                  <p className="text-slate-400 italic text-xs">Nenhum exame selecionado.</p>
                )}
              </div>

              {Boolean(indicacaoClinica.trim() || cid10.trim()) && (
                <div className="border-t border-slate-200 pt-4 mt-6">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 block mb-1">
                    Indicação Clínica / Hipótese Diagnóstica:
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {indicacaoClinica} {cid10 ? `(CID-10: ${cid10})` : ''}
                  </p>
                </div>
              )}

              {Boolean(observacoesColeta.trim()) && (
                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                  <span className="font-bold text-[10px] uppercase text-slate-700 block mb-0.5">
                    Orientações de Coleta / Observações:
                  </span>
                  <p className="text-slate-800">{observacoesColeta}</p>
                </div>
              )}
            </div>
          )}

          {/* CORPO DO DOCUMENTO: RECEITUÁRIO */}
          {tipo === 'receituario' && (
            <div className="space-y-6 text-xs text-slate-900">
              <div className="space-y-4">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 block">
                  Uso Conforme Prescrição:
                </span>

                <ol className="list-decimal pl-5 space-y-3.5 text-sm">
                  {medicamentos.map((m, idx) => (
                    <li key={idx} className="leading-snug">
                      <div className="font-bold text-slate-900">
                        {m.nome} — {m.dose} ({m.via}) {m.quantidade ? `······ ${m.quantidade}` : ''}
                      </div>
                      <div className="text-xs text-slate-700 pl-1 mt-0.5 font-normal">
                        Posologia: {m.posologia}
                      </div>
                    </li>
                  ))}
                </ol>

                {medicamentos.length === 0 && (
                  <p className="text-slate-400 italic text-xs">Nenhum medicamento registrado.</p>
                )}
              </div>

              {Boolean(orientacoesGerais.trim()) && (
                <div className="border-t border-slate-200 pt-4 mt-6">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 block mb-1">
                    Orientações Gerais:
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed">{orientacoesGerais}</p>
                </div>
              )}

              {tipoReceita === 'controle_especial' && (
                <div className="border border-slate-300 rounded p-3 text-[10px] text-slate-600 bg-slate-50 mt-6">
                  <p className="font-bold text-slate-800 mb-1">1ª Via: Farmácia / Retenção da Receita · 2ª Via: Orientação ao Paciente</p>
                  <p>Medicamento sujeito a controle especial conforme legislação vigente (Portaria SVS/MS nº 344/98).</p>
                </div>
              )}
            </div>
          )}

          {/* CORPO DO DOCUMENTO: ENCAMINHAMENTO */}
          {tipo === 'encaminhamento' && (
            <div className="space-y-5 text-xs text-slate-900">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Ao(À) Especialista em:</span>
                <span className="text-base font-bold text-slate-900 block">{especialidadeDestino || 'Clínica Especializada'}</span>
              </div>

              <div>
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 block mb-1">
                  Motivo da Solicitação:
                </span>
                <p className="text-sm font-medium text-slate-900 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                  {motivoEncaminhamento || '–'}
                </p>
              </div>

              {Boolean(resumoClinico.trim()) && (
                <div>
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 block mb-1">
                    Histórico Clínico & Observações Relevantes:
                  </span>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {resumoClinico}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* RODAPÉ DO DOCUMENTO COM DATA E ASSINATURA */}
          <div className="mt-16 pt-8 border-t border-slate-300">
            <div className="flex flex-col sm:flex-row items-end justify-between gap-6">
              <div className="text-xs text-slate-700">
                <p className="font-medium">{dataExtenso}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Documento emitido eletronicamente via Sistema ILPI
                </p>
              </div>

              <div className="text-center min-w-[260px]">
                <div className="w-56 border-b border-slate-800 mx-auto mb-2" />
                <p className="font-bold text-xs text-slate-900 uppercase">{prescritorNome}</p>
                <p className="text-[11px] text-slate-700 font-medium">{prescritorConselho}</p>
                <p className="text-[10px] text-slate-500">{prescritorFuncao}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* RODAPÉ DO MODAL (Não aparece na impressão) */}
        <DialogFooter className="no-print p-4 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {modo === 'edicao' ? (
              <span>Preencha os campos e clique em <b>"Salvar & Imprimir"</b> ou <b>"Visualizar A4"</b>.</span>
            ) : (
              <span>Folha A4 pronta. Clique em <b>"Imprimir"</b> para enviar à impressora ou salvar PDF.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-xl"
            >
              Fechar
            </Button>

            {modo === 'edicao' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSalvarEContinuar(false)}
                  disabled={salvando}
                  className="text-xs rounded-xl"
                >
                  {salvando ? 'Salvando...' : 'Salvar no Prontuário'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSalvarEContinuar(true)}
                  disabled={salvando}
                  className="text-xs rounded-xl gap-1.5 font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Printer className="size-3.5" /> Salvar & Imprimir A4
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModo('edicao')}
                  className="text-xs rounded-xl gap-1.5"
                >
                  <Edit3 className="size-3.5" /> Editar Pedido
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleImprimirDireto}
                  className="text-xs rounded-xl gap-1.5 font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Printer className="size-3.5" /> Imprimir Agora (PDF / A4)
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
