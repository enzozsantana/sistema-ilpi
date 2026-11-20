import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { iso } from '../lib/business/dates'
import {
  gerarLinkSalaJitsi,
  buildJitsiUrl,
  obterConsultasVirtuais,
  salvarConsultaVirtual,
  atualizarStatusConsulta,
  marcarEvolucaoConsulta,
  obterProfissionaisVirtuais,
} from '../lib/teleconsultaStorage'
import type {
  ConsultaVirtual,
  EspecialidadeVirtual,
  MetodoPagamento,
  ProfissionalVirtual,
} from '../types/teleconsulta'
import type { Residente } from '../types/ilpi'
import { Card, CardContent } from '../components/ui/card'
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
import { ModalPedidoMedico } from '../components/ModalPedidoMedico'
import { ModalConectarMercadoPago } from '../components/ModalConectarMercadoPago'
import { ModalCadastroEspecialista } from '../components/ModalCadastroEspecialista'
import { salvarRascunho, obterRascunho, limparRascunho, temRascunho } from '../lib/draftStorage'
import { calcularSplit, processarPagamentoSplit, gerarPixCopiaECola } from '../lib/mercadopagoService'
import {
  ArrowRightLeft,
  Building2,
  Calendar,
  CalendarCheck,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Monitor,
  MonitorOff,
  PhoneOff,
  Pill,
  QrCode,
  Search,
  Share2,
  Sparkles,
  Stethoscope,
  Users,
  Video,
  VideoOff,
  X,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const T = iso(new Date())

const ROTULOS_ESPECIALIDADE: Record<EspecialidadeVirtual | 'todas', string> = {
  todas: 'Todas Especialidades',
  medica: 'Medicina Geriátrica',
  estomaterapia: 'Estomaterapia & Feridas',
  nutricao: 'Nutrição Clínica',
  psicologia: 'Psicologia & Demências',
  fisioterapia: 'Fisioterapia Geriátrica',
}

export default function Teleconsulta() {
  const { residentes, refresh } = useIlpiData()
  const { profissional } = useAuth()

  // Especialistas Virtuais disponíveis (semente + independentes cadastrados)
  const [profissionais, setProfissionais] = useState<ProfissionalVirtual[]>(() =>
    obterProfissionaisVirtuais(),
  )
  const [modalCadastroOpen, setModalCadastroOpen] = useState(false)

  // Aba ativa: Vitrine de Especialistas ou Consultas Agendadas
  const [abaAtiva, setAbaAtiva] = useState<'especialistas' | 'consultas'>('especialistas')
  const [filtroEsp, setFiltroEsp] = useState<EspecialidadeVirtual | 'todas'>('todas')
  const [busca, setBusca] = useState('')

  // Lista de Consultas Carregadas
  const [consultas, setConsultas] = useState<ConsultaVirtual[]>(() => obterConsultasVirtuais())

  // Fluxo de Agendamento
  const [modalAgendamentoOpen, setModalAgendamentoOpen] = useState(false)
  const [profSelecionado, setProfSelecionado] = useState<ProfissionalVirtual | null>(null)
  const [passoAgendamento, setPassoAgendamento] = useState<'horario' | 'pagamento' | 'sucesso'>('horario')

  // Dados do formulário de agendamento
  const [residenteId, setResidenteId] = useState('')
  const [diaSelecionado, setDiaSelecionado] = useState(T)
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [motivoConsulta, setMotivoConsulta] = useState('')
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('pix')

  // Form Cartão
  const [numCartao, setNumCartao] = useState('')
  const [nomeCartao, setNomeCartao] = useState('')
  const [valCartao, setValCartao] = useState('')
  const [cvvCartao, setCvvCartao] = useState('')
  const [processandoPagamento, setProcessandoPagamento] = useState(false)

  // Consulta recém-criada
  const [consultaCriada, setConsultaCriada] = useState<ConsultaVirtual | null>(null)

  // Modal Mercado Pago Marketplace & Split
  const [modalMercadoPagoOpen, setModalMercadoPagoOpen] = useState(false)

  // Sala de Teleconsulta ao Vivo (Jitsi Meet gratuito)
  const [salaAberta, setSalaAberta] = useState<ConsultaVirtual | null>(null)
  const [painelProntuarioAberto, setPainelProntuarioAberto] = useState(true)
  const [modalProntuarioOpen, setModalProntuarioOpen] = useState(false)
  const [modoTelaCheia, setModoTelaCheia] = useState(false)

  // Nome do usuário logado para identificação automática na sala do Jitsi
  const nomeUsuarioLogado = useMemo(() => {
    if (profissional?.nome) {
      const funcao = profissional.funcao ? ` (${profissional.funcao})` : ''
      return `${profissional.nome}${funcao}`
    }
    return 'Equipe ILPI'
  }, [profissional])

  // Evolução clínica durante a consulta
  const [textoEvolucao, setTextoEvolucao] = useState('')
  const [salvandoEvolucao, setSalvandoEvolucao] = useState(false)

  // Restauração de rascunho de evolução clínica caso haja queda de conexão ou desligamento
  useEffect(() => {
    if (!salaAberta) return
    const chave = `teleconsulta_evolucao_${salaAberta.id}`
    const rascunho = obterRascunho<string>(chave)
    if (rascunho?.dados) {
      setTextoEvolucao(rascunho.dados)
    } else {
      setTextoEvolucao('')
    }
  }, [salaAberta?.id])

  // Auto-save debounced da evolução da consulta
  useEffect(() => {
    if (!salaAberta) return
    const chave = `teleconsulta_evolucao_${salaAberta.id}`
    const timer = setTimeout(() => {
      salvarRascunho(chave, textoEvolucao)
    }, 400)
    return () => clearTimeout(timer)
  }, [textoEvolucao, salaAberta?.id])

  // Modal de Prescrição / Pedido Médico
  const [modalReceitaOpen, setModalReceitaOpen] = useState(false)
  const [residenteParaReceita, setResidenteParaReceita] = useState<Residente | null>(null)

  const profDaConsulta = useMemo(() => {
    if (!salaAberta) return null
    return profissionais.find((p) => p.id === salaAberta.profissionalId) || null
  }, [salaAberta, profissionais])

  // Estado da sessão de vídeo: false = na Sala de Espera / Lobby Google Meet; true = chamada ao vivo conectada
  const [chamadaAtiva, setChamadaAtiva] = useState(false)
  const estaEmEspera = !chamadaAtiva

  function abrirSalaVirtual(consulta: ConsultaVirtual) {
    setChamadaAtiva(false)
    setSalaAberta(consulta)
    setPainelProntuarioAberto(true)
  }

  // Controles de Prévia de Câmera e Microfone (Estilo Google Meet)
  const videoPreviaRef = useRef<HTMLVideoElement>(null)
  const [streamLocal, setStreamLocal] = useState<MediaStream | null>(null)
  const [cameraAtiva, setCameraAtiva] = useState(true)
  const [micAtivo, setMicAtivo] = useState(true)
  const [erroMidia, setErroMidia] = useState<string | null>(null)

  // Inicia e solicita a permissão de câmera e microfone para a prévia do usuário
  const iniciarPreviaDispositivos = useCallback(async () => {
    setErroMidia(null)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      setStreamLocal(stream)
      if (videoPreviaRef.current) {
        videoPreviaRef.current.srcObject = stream
      }
    } catch (err: any) {
      console.warn('Permissão de mídia na prévia:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErroMidia('Permissão de câmera e microfone negada. Clique no ícone de cadeado na barra de endereços para permitir.')
      } else {
        setErroMidia('Nenhuma câmera ou microfone encontrado no dispositivo.')
      }
    }
  }, [])

  const videoChamadaLocalRef = useRef<HTMLVideoElement>(null)
  const [compartilhandoTela, setCompartilhandoTela] = useState(false)
  const streamTelaRef = useRef<MediaStream | null>(null)

  // Gerencia o ciclo de vida do stream da webcam enquanto a consulta estiver aberta
  useEffect(() => {
    if (salaAberta) {
      iniciarPreviaDispositivos()
    } else {
      if (streamLocal) {
        streamLocal.getTracks().forEach((t) => t.stop())
        setStreamLocal(null)
      }
      if (streamTelaRef.current) {
        streamTelaRef.current.getTracks().forEach((t) => t.stop())
        streamTelaRef.current = null
      }
      setCompartilhandoTela(false)
    }
    return () => {
      if (streamLocal) {
        streamLocal.getTracks().forEach((t) => t.stop())
      }
      if (streamTelaRef.current) {
        streamTelaRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [salaAberta?.id])

  // Vincula o srcObject aos elementos de vídeo (prévia e chamada ao vivo)
  useEffect(() => {
    if (videoPreviaRef.current && streamLocal) {
      videoPreviaRef.current.srcObject = streamLocal
    }
    if (videoChamadaLocalRef.current && streamLocal) {
      videoChamadaLocalRef.current.srcObject = streamLocal
    }
  }, [streamLocal, cameraAtiva, chamadaAtiva])

  async function alternarCompartilhamentoTela() {
    if (compartilhandoTela) {
      if (streamTelaRef.current) {
        streamTelaRef.current.getTracks().forEach((t) => t.stop())
        streamTelaRef.current = null
      }
      setCompartilhandoTela(false)
      toast.info('Compartilhamento de tela encerrado.')
    } else {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
        toast.error('Compartilhamento de tela não suportado neste navegador.')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        streamTelaRef.current = stream
        setCompartilhandoTela(true)
        toast.success('Compartilhando sua tela na chamada.')
        stream.getVideoTracks()[0].onended = () => {
          setCompartilhandoTela(false)
          streamTelaRef.current = null
        }
      } catch (err: any) {
        console.warn('Compartilhamento cancelado:', err)
      }
    }
  }

  function alternarCamera() {
    if (streamLocal) {
      const videoTrack = streamLocal.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setCameraAtiva(videoTrack.enabled)
        toast.info(videoTrack.enabled ? 'Câmera ativada' : 'Câmera desativada')
      }
    } else {
      const proximo = !cameraAtiva
      setCameraAtiva(proximo)
      if (proximo) iniciarPreviaDispositivos()
    }
  }

  function alternarMicrofone() {
    if (streamLocal) {
      const audioTrack = streamLocal.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setMicAtivo(audioTrack.enabled)
        toast.info(audioTrack.enabled ? 'Microfone ativado' : 'Microfone silenciado')
      }
    } else {
      const proximo = !micAtivo
      setMicAtivo(proximo)
      if (proximo) iniciarPreviaDispositivos()
    }
  }

  function handleIniciarConsulta() {
    if (!salaAberta) return
    setChamadaAtiva(true)
    atualizarStatusConsulta(salaAberta.id, 'em_andamento')
    setSalaAberta((prev) => (prev ? { ...prev, status: 'em_andamento' } : null))
    setConsultas((prev) =>
      prev.map((c) => (c.id === salaAberta.id ? { ...c, status: 'em_andamento' } : c))
    )
    toast.success('Atendimento iniciado! Conectado na chamada.')
  }

  function handleFinalizarConsulta() {
    if (!salaAberta) return
    if (streamLocal) {
      streamLocal.getTracks().forEach((t) => t.stop())
      setStreamLocal(null)
    }
    if (streamTelaRef.current) {
      streamTelaRef.current.getTracks().forEach((t) => t.stop())
      streamTelaRef.current = null
    }
    setCompartilhandoTela(false)
    setChamadaAtiva(false)
    atualizarStatusConsulta(salaAberta.id, 'concluida')
    setSalaAberta((prev) => (prev ? { ...prev, status: 'concluida' } : null))
    setConsultas((prev) =>
      prev.map((c) => (c.id === salaAberta.id ? { ...c, status: 'concluida' } : c))
    )
    toast.success('Consulta finalizada! Registre a evolução e prescrições no prontuário.')
  }

  // Filtro de profissionais
  const profissionaisFiltrados = useMemo(() => {
    return profissionais.filter((p) => {
      if (filtroEsp !== 'todas' && p.especialidade !== filtroEsp) return false
      if (busca.trim()) {
        const q = busca.toLowerCase()
        const matchNome = p.nome.toLowerCase().includes(q)
        const matchEsp = p.especialidadeLabel.toLowerCase().includes(q)
        const matchClinica = p.clinica.toLowerCase().includes(q)
        if (!matchNome && !matchEsp && !matchClinica) return false
      }
      return true
    })
  }, [filtroEsp, busca, profissionais])

  // Residente selecionado para a consulta
  const residenteEscolhido = useMemo(() => {
    return residentes.find((r) => r.id === (salaAberta?.residenteId || residenteId)) || null
  }, [residentes, salaAberta, residenteId])

  function abrirAgendamento(prof: ProfissionalVirtual) {
    setProfSelecionado(prof)
    setPassoAgendamento('horario')
    setResidenteId(residentes[0]?.id || '')
    setDiaSelecionado(T)
    setHorarioSelecionado(prof.horariosPadrao[0] || '09:00')
    setMotivoConsulta('')
    setMetodoPagamento('pix')
    setModalAgendamentoOpen(true)
  }

  function handleAvancarParaPagamento() {
    if (!residenteId) {
      toast.error('Selecione o residente que receberá a consulta.')
      return
    }
    if (!horarioSelecionado) {
      toast.error('Escolha um horário de atendimento disponível.')
      return
    }
    setPassoAgendamento('pagamento')
  }

  async function handleFinalizarPagamentoEAgendar() {
    if (!profSelecionado) return

    setProcessandoPagamento(true)

    const res = residentes.find((r) => r.id === residenteId)
    const id = `cv_${Date.now()}`
    const codigoSala = `senecurare-${profSelecionado.especialidade}-${Date.now().toString(36)}`

    // Processa o split de pagamento pelo Mercado Pago Marketplace
    await processarPagamentoSplit({
      profissionalId: profSelecionado.id,
      residenteId,
      residenteNome: res?.nome || 'Residente da ILPI',
      consultaId: id,
      especialidade: profSelecionado.especialidadeLabel,
      valorTotal: profSelecionado.preco,
      metodoPagamento,
      pagadorNome: 'ILPI / Familiar',
      pagadorEmail: 'financeiro@ilpi.com.br',
    })

    const novaConsulta: ConsultaVirtual = {
      id,
      profissionalId: profSelecionado.id,
      profissionalNome: profSelecionado.nome,
      especialidade: profSelecionado.especialidadeLabel,
      registro: profSelecionado.registro,
      clinica: profSelecionado.clinica,
      residenteId,
      residenteNome: res?.nome || 'Residente da ILPI',
      data: diaSelecionado,
      horario: horarioSelecionado,
      valor: profSelecionado.preco,
      metodoPagamento,
      pago: true,
      linkSala: gerarLinkSalaJitsi(codigoSala),
      codigoSala,
      status: 'confirmada',
      motivo: motivoConsulta.trim() || 'Avaliação e conduta clínica virtual.',
      criadoEm: new Date().toISOString(),
    }

    salvarConsultaVirtual(novaConsulta)
    setConsultas(obterConsultasVirtuais())
    setConsultaCriada(novaConsulta)
    setProcessandoPagamento(false)
    setPassoAgendamento('sucesso')
    toast.success('Pagamento confirmado e consulta agendada com Split no Mercado Pago!')
  }

  function copiarChavePix() {
    const res = residentes.find((r) => r.id === residenteId)
    const chave = gerarPixCopiaECola(
      `mp_${Date.now()}`,
      profSelecionado?.preco || 200,
      `ILPI ${res?.nome || 'SENECURARE'}`
    )
    navigator.clipboard.writeText(chave)
    toast.success('Código PIX Copia e Cola do Mercado Pago copiado!')
  }

  function copiarLinkConsulta(linkOuConsulta: string | ConsultaVirtual) {
    const url =
      typeof linkOuConsulta === 'string'
        ? buildJitsiUrl(linkOuConsulta, 'Familiar')
        : buildJitsiUrl(linkOuConsulta.linkSala, `Familiar / ${linkOuConsulta.residenteNome}`)
    navigator.clipboard.writeText(url)
    toast.success('Link da sala copiado (com identificação automática)!')
  }

  function compartilharWhatsApp(c: ConsultaVirtual) {
    const linkFamiliar = buildJitsiUrl(c.linkSala, `Familiar / ${c.residenteNome}`)
    const texto = `Olá! Segue o link da consulta virtual com ${c.profissionalNome} (${c.especialidade}) para o residente ${c.residenteNome} agendada para ${c.data} às ${c.horario}:\n\n${linkFamiliar}\n\n(Acesso direto sem necessidade de cadastro pelo celular ou computador)`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank')
  }

  async function handleSalvarEvolucaoConsulta() {
    if (!textoEvolucao.trim()) {
      toast.error('Escreva a conduta ou anotação da consulta.')
      return
    }
    if (!salaAberta) return

    setSalvandoEvolucao(true)
    const id = `ev_tele_${Date.now()}`

    const { error } = await supabase.from('evolucoes').insert({
      id,
      residente_id: salaAberta.residenteId,
      area: salaAberta.especialidade,
      texto: `[TELECONSULTA VIRTUAL - ${salaAberta.profissionalNome} (${salaAberta.registro})]\n${textoEvolucao.trim()}`,
      peso: null,
      assinatura: {
        id: profissional?.id || 'prof_tele',
        d: T,
        h: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    })

    setSalvandoEvolucao(false)
    if (error) {
      toast.error(`Erro ao salvar no prontuário: ${error.message}`)
      return
    }

    marcarEvolucaoConsulta(salaAberta.id)
    setConsultas(obterConsultasVirtuais())
    if (salaAberta) {
      limparRascunho(`teleconsulta_evolucao_${salaAberta.id}`)
    }
    setTextoEvolucao('')
    toast.success('Evolução clínica gravada com sucesso no Prontuário do Residente!')
    await refresh()
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 flex items-center justify-center shadow-2xs">
              <Video className="size-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
                <span>Teleconsulta & Especialistas Virtuais</span>
                <Badge variant="outline" className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 text-xs">
                  <Sparkles className="size-3 mr-1" /> Telemedicina ILPI
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Atendimento por vídeo com Doutora Geriatra, Enfermeira Estomaterapeuta, Nutricionista e Psicólogo integrados ao prontuário.
              </p>
            </div>
          </div>
        </div>

        {/* Ações e Seletor de Abas */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Botão Cadastrar como Especialista Independente */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalCadastroOpen(true)}
            className="rounded-xl text-xs gap-1.5 border-teal-600/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
          >
            <Stethoscope className="size-3.5 text-teal-600" />
            <span>Cadastrar como Especialista</span>
          </Button>

          {/* Botão de Gestão Mercado Pago Marketplace */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalMercadoPagoOpen(true)}
            className="rounded-xl text-xs gap-1.5 border-[#009EE3]/40 text-[#009EE3] hover:bg-[#009EE3]/10"
          >
            <ArrowRightLeft className="size-3.5" />
            <span>Mercado Pago & Split</span>
          </Button>

          {/* Seletor de Abas em Ordem Alfabética */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setAbaAtiva('consultas')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5',
                abaAtiva === 'consultas'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>Consultas Agendadas</span>
              <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-bold">
                {consultas.length}
              </Badge>
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('especialistas')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
                abaAtiva === 'especialistas'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Especialistas Disponíveis
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Consultório Virtual para Especialista Independente Autenticado */}
      {profissional?.cat === 'tele_especialista' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-primary/10 to-teal-500/5 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {profissional.nome.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">
                  Consultório Virtual de {profissional.nome}
                </h2>
                <Badge className="bg-teal-600 text-white text-[10px] px-2 py-0.5">
                  Especialista Independente
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {profissional.area || 'Especialista credenciado'} · Registro {profissional.conselho || 'N/A'} · Atendendo ILPIs parceiras e particulares
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setModalMercadoPagoOpen(true)}
              className="text-xs rounded-xl border-[#009EE3]/40 text-[#009EE3] hover:bg-[#009EE3]/10 gap-1.5 shadow-2xs"
            >
              <ArrowRightLeft className="size-3.5" />
              Conectar Mercado Pago (Split)
            </Button>
          </div>
        </div>
      )}

      {/* ABA 1: VITRINE DE PROFISSIONAIS E AGENDAMENTO */}
      {abaAtiva === 'especialistas' && (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['todas', 'estomaterapia', 'fisioterapia', 'medica', 'nutricao', 'psicologia'] as const).map((esp) => (
                <button
                  key={esp}
                  type="button"
                  onClick={() => setFiltroEsp(esp)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
                    filtroEsp === esp
                      ? 'bg-[#123F4A] text-white border-[#123F4A] shadow-2xs'
                      : 'bg-card text-muted-foreground border-border/70 hover:bg-muted/40'
                  )}
                >
                  {ROTULOS_ESPECIALIDADE[esp]}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar especialista, clínica..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 text-xs h-8.5 rounded-xl bg-card border-border/70"
              />
            </div>
          </div>

          {/* Grid de Cards dos Especialistas com foto, registro, clínica e horários */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {profissionaisFiltrados.map((prof) => (
              <Card
                key={prof.id}
                className="border border-border/70 shadow-2xs rounded-2xl overflow-hidden hover:border-teal-500/40 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Topo: Foto e Dados Principais */}
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      {prof.foto ? (
                        <img
                          src={prof.foto}
                          alt={prof.nome}
                          className="size-18 rounded-2xl object-cover border-2 border-border/80 shadow-xs"
                        />
                      ) : (
                        <div className="size-18 rounded-2xl bg-teal-500/10 border-2 border-border/80 text-teal-700 dark:text-teal-400 font-bold text-xl flex items-center justify-center shadow-xs">
                          {prof.nome.charAt(0)}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 size-4.5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center text-white" title="Disponível para teleatendimento">
                        <CheckCircle2 className="size-3" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                            {prof.especialidadeLabel}
                          </span>
                          {prof.isIndependente && (
                            <Badge variant="outline" className="text-[9px] bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 py-0 h-4">
                              Independente
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-muted/40 border-border/60">
                          <Clock className="size-2.5 mr-1 text-muted-foreground" /> {prof.duracaoMin || 45} min
                        </Badge>
                      </div>

                      <h3 className="font-bold text-base text-foreground leading-tight">{prof.nome}</h3>
                      <p className="text-xs text-muted-foreground font-medium">{prof.titulo}</p>

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                        <Building2 className="size-3 text-primary shrink-0" />
                        <span className="truncate">{prof.clinica}</span>
                      </div>
                    </div>
                  </div>

                  {/* Registro Profissional e Bio */}
                  <div className="space-y-2 pt-1 border-t border-border/50 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-medium">Registro Profissional:</span>
                      <strong className="text-foreground">{prof.registro}</strong>
                    </div>

                    <p className="text-muted-foreground leading-relaxed line-clamp-3 text-[11px]">
                      {prof.bio}
                    </p>
                  </div>

                  {/* Dias e Horários do Mês */}
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Horários Habitual de Atendimento:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {prof.horariosPadrao.map((h) => (
                        <span key={h} className="px-2 py-0.5 rounded-md bg-background border border-border/60 text-[10px] font-semibold text-foreground">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card com Preço e Ação */}
                <div className="p-4 px-5 border-t border-border/60 bg-muted/15 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Valor da Consulta</span>
                    <span className="text-base font-extrabold text-foreground">
                      R$ {prof.preco.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <Button
                    onClick={() => abrirAgendamento(prof)}
                    className="gap-2 text-xs rounded-xl bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold shadow-xs"
                  >
                    <Calendar className="size-3.5" />
                    <span>Agendar Consulta</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ABA 2: CONSULTAS AGENDADAS E HISTÓRICO */}
      {abaAtiva === 'consultas' && (
        <div className="space-y-3">
          {consultas.map((c) => (
            <Card key={c.id} className="border border-border/70 shadow-2xs rounded-2xl overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 text-xs font-semibold">
                      {c.especialidade}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {c.status === 'confirmada' ? 'Confirmada (Paga)' : c.status}
                    </Badge>
                    {c.evolucaoRealizada && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                        <CheckCircle2 className="size-2.5 mr-1" /> Prontuário Atualizado
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                      <span>{c.profissionalNome}</span>
                      <span className="text-xs font-normal text-muted-foreground">({c.registro})</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Residente: <strong className="text-foreground">{c.residenteNome}</strong> · Data: <strong>{c.data}</strong> às <strong>{c.horario}</strong>
                    </p>
                    {c.motivo && (
                      <p className="text-xs text-muted-foreground/90 italic mt-1 line-clamp-1">
                        Motivo: &quot;{c.motivo}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap md:flex-nowrap shrink-0">
                  <Button
                    size="sm"
                    onClick={() => abrirSalaVirtual(c)}
                    className="gap-1.5 text-xs rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
                  >
                    <Video className="size-3.5" />
                    <span>Entrar na Sala Virtual</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => compartilharWhatsApp(c)}
                    className="gap-1.5 text-xs rounded-xl"
                    title="Enviar link no WhatsApp para a família"
                  >
                    <Share2 className="size-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copiarLinkConsulta(c.linkSala)}
                    className="size-8 p-0 text-muted-foreground hover:text-foreground"
                    title="Copiar link da sala"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {!consultas.length && (
            <Card className="border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
              Nenhuma consulta virtual agendada no momento. Selecione um especialista para agendar.
            </Card>
          )}
        </div>
      )}

      {/* MODAL DE AGENDAMENTO & PAGAMENTO EM ETAPAS */}
      <Dialog open={modalAgendamentoOpen} onOpenChange={setModalAgendamentoOpen}>
        <DialogContent className="sm:max-w-xl max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl">
          {profSelecionado && (
            <>
              {/* ETAPA 1: SELEÇÃO DE HORÁRIO E RESIDENTE */}
              {passoAgendamento === 'horario' && (
                <div className="space-y-4">
                  <DialogHeader>
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="size-5 text-teal-600" />
                      <DialogTitle className="text-base font-bold">
                        Agendar com {profSelecionado.nome}
                      </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs">
                      {profSelecionado.especialidadeLabel} · {profSelecionado.clinica}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 py-2 text-xs">
                    {/* Selecionar Residente */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Residente que receberá a consulta *</Label>
                      <select
                        value={residenteId}
                        onChange={(e) => setResidenteId(e.target.value)}
                        className="w-full h-9 text-xs rounded-xl border border-input bg-background px-3"
                      >
                        {residentes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nome} {r.quarto ? `(Quarto ${r.quarto})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selecionar Data do Mês */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Data da Consulta no Mês *</Label>
                      <Input
                        type="date"
                        value={diaSelecionado}
                        onChange={(e) => setDiaSelecionado(e.target.value)}
                        min={T}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    {/* Selecionar Horário Disponível */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Horários Disponíveis da Especialista *</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {profSelecionado.horariosPadrao.map((hor) => (
                          <button
                            key={hor}
                            type="button"
                            onClick={() => setHorarioSelecionado(hor)}
                            className={cn(
                              'py-2 rounded-xl text-xs font-bold transition-all border text-center',
                              horarioSelecionado === hor
                                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                : 'bg-card text-foreground border-border/80 hover:bg-muted/30'
                            )}
                          >
                            {hor}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Motivo da consulta */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Motivo da Consulta / Sintomas (Opcional)</Label>
                      <Input
                        placeholder="Ex: Revisão de ferida no calcâneo / ajuste de dosagem..."
                        value={motivoConsulta}
                        onChange={(e) => setMotivoConsulta(e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>

                    {/* Resumo de Valor */}
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Valor do Atendimento Virtual:</span>
                      <strong className="text-foreground text-sm">
                        R$ {profSelecionado.preco.toFixed(2).replace('.', ',')}
                      </strong>
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" size="sm" onClick={() => setModalAgendamentoOpen(false)} className="rounded-xl text-xs">
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAvancarParaPagamento}
                      className="rounded-xl text-xs bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold"
                    >
                      Avançar para Pagamento
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {/* ETAPA 2: CHECKOUT / PAGAMENTO (CARTÃO OU PIX) */}
              {passoAgendamento === 'pagamento' && (
                <div className="space-y-4">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                      <CreditCard className="size-5 text-teal-600" />
                      Pagamento da Consulta
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Valor total: <strong>R$ {profSelecionado.preco.toFixed(2).replace('.', ',')}</strong> · Atendimento em {diaSelecionado} às {horarioSelecionado}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Banner Mercado Pago Marketplace & Split Automático */}
                  <div className="p-3 rounded-xl bg-[#009EE3]/10 border border-[#009EE3]/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-md bg-[#009EE3] text-white flex items-center justify-center font-extrabold text-[10px]">
                          MP
                        </div>
                        <span className="font-bold text-[11px] text-foreground">
                          Mercado Pago Marketplace · Split Automático
                        </span>
                      </div>
                      <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                        Split Ativo
                      </Badge>
                    </div>

                    {(() => {
                      const split = calcularSplit(profSelecionado.preco)
                      return (
                        <div className="grid grid-cols-2 gap-2 text-[10.5px] p-2 rounded-lg bg-background/80 border border-border/50">
                          <div>
                            <span className="text-[10px] text-muted-foreground block">
                              Repasse Direto ao Especialista ({100 - split.taxaComissaoPercentual}%):
                            </span>
                            <strong className="text-teal-700 dark:text-teal-300 font-bold">
                              R$ {split.valorLiquidoProfissional.toFixed(2).replace('.', ',')}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">
                              Comissão da Plataforma SaaS ({split.taxaComissaoPercentual}%):
                            </span>
                            <strong className="text-primary font-bold">
                              R$ {split.valorComissaoSaaS.toFixed(2).replace('.', ',')}
                            </strong>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Abas PIX vs Cartão */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-xl border border-border/60 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setMetodoPagamento('pix')}
                      className={cn(
                        'py-2 rounded-lg transition-all flex items-center justify-center gap-1.5',
                        metodoPagamento === 'pix' ? 'bg-background shadow-2xs text-teal-700 dark:text-teal-400' : 'text-muted-foreground'
                      )}
                    >
                      <QrCode className="size-4" /> PIX (Instantâneo)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPagamento('cartao')}
                      className={cn(
                        'py-2 rounded-lg transition-all flex items-center justify-center gap-1.5',
                        metodoPagamento === 'cartao' ? 'bg-background shadow-2xs text-teal-700 dark:text-teal-400' : 'text-muted-foreground'
                      )}
                    >
                      <CreditCard className="size-4" /> Cartão de Crédito
                    </button>
                  </div>

                  {/* Conteúdo PIX */}
                  {metodoPagamento === 'pix' && (
                    <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3 text-center">
                      <div className="size-36 mx-auto bg-white p-2 rounded-xl border border-border/60 shadow-xs flex items-center justify-center">
                        <QrCode className="size-32 text-slate-800" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-foreground block">
                          Chave PIX Copia e Cola
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          Abra o app do seu banco, escolha Pix Copia e Cola e conclua o pagamento.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copiarChavePix}
                        className="rounded-xl text-xs gap-1.5 w-full border-teal-500/40 text-teal-700 dark:text-teal-300"
                      >
                        <Copy className="size-3.5" /> Copiar Código PIX
                      </Button>
                    </div>
                  )}

                  {/* Conteúdo Cartão de Crédito */}
                  {metodoPagamento === 'cartao' && (
                    <div className="space-y-3 p-4 rounded-xl border border-border/70 bg-card text-xs">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Número do Cartão *</Label>
                        <Input
                          placeholder="0000 0000 0000 0000"
                          value={numCartao}
                          onChange={(e) => setNumCartao(e.target.value)}
                          className="h-8.5 text-xs rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Nome Impresso no Cartão *</Label>
                        <Input
                          placeholder="Nome Completo"
                          value={nomeCartao}
                          onChange={(e) => setNomeCartao(e.target.value)}
                          className="h-8.5 text-xs rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold">Validade (MM/AA) *</Label>
                          <Input
                            placeholder="12/28"
                            value={valCartao}
                            onChange={(e) => setValCartao(e.target.value)}
                            className="h-8.5 text-xs rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold">CVV *</Label>
                          <Input
                            placeholder="123"
                            value={cvvCartao}
                            onChange={(e) => setCvvCartao(e.target.value)}
                            className="h-8.5 text-xs rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPassoAgendamento('horario')}
                      disabled={processandoPagamento}
                      className="rounded-xl text-xs"
                    >
                      Voltar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleFinalizarPagamentoEAgendar}
                      disabled={processandoPagamento}
                      className="rounded-xl text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                    >
                      {processandoPagamento ? 'Processando...' : `Confirmar Pagamento (R$ ${profSelecionado.preco.toFixed(2).replace('.', ',')})`}
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {/* ETAPA 3: SUCESSO E LIBERAÇÃO DO LINK DA CONSULTA */}
              {passoAgendamento === 'sucesso' && consultaCriada && (
                <div className="space-y-4 text-center py-2">
                  <div className="size-14 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="size-8" />
                  </div>

                  <div className="space-y-1">
                    <DialogTitle className="text-lg font-bold text-foreground">
                      Pagamento Confirmado & Consulta Liberada!
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Atendimento com {consultaCriada.profissionalNome} agendado com sucesso para {consultaCriada.data} às {consultaCriada.horario}.
                    </DialogDescription>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border border-teal-500/30 text-left space-y-2 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
                      Link da Sala Virtual de Vídeo (Jitsi Meet Criptografado):
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-card p-2 rounded-lg border border-border">
                      <span className="font-mono text-[11px] truncate">{consultaCriada.linkSala}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => copiarLinkConsulta(consultaCriada.linkSala)}
                        className="text-xs gap-1"
                      >
                        <Copy className="size-3" /> Copiar
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      className="flex-1 rounded-xl text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5"
                      onClick={() => {
                        setModalAgendamentoOpen(false)
                        abrirSalaVirtual(consultaCriada)
                      }}
                    >
                      <Video className="size-3.5" />
                      <span>Entrar na Sala Virtual Agora</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl text-xs gap-1.5"
                      onClick={() => compartilharWhatsApp(consultaCriada)}
                    >
                      <Share2 className="size-3.5 text-emerald-600" />
                      <span>Enviar no WhatsApp</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SALA DE TELECONSULTA AO VIVO COM PRONTUÁRIO INTEGRADO */}
      <Dialog open={!!salaAberta} onOpenChange={(open) => !open && setSalaAberta(null)}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            'flex flex-col p-0 overflow-hidden bg-background transition-all duration-200 border-border/80 shadow-2xl',
            modoTelaCheia
              ? '!fixed !inset-0 !w-screen !h-screen !max-w-none sm:!max-w-none !max-h-none !translate-x-0 !translate-y-0 !top-0 !left-0 rounded-none border-none'
              : '!w-[96vw] !max-w-[96vw] sm:!max-w-[96vw] lg:!max-w-[96vw] xl:!max-w-[1600px] !h-[94vh] !max-h-[94vh] rounded-2xl'
          )}
        >
          {salaAberta && (
            <>
              {/* Topo da Sala Virtual */}
              <div className="p-3 sm:px-6 border-b border-border/60 bg-muted/30 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <h2 className="font-bold text-sm text-foreground truncate">
                      Teleconsulta: {salaAberta.profissionalNome} · {salaAberta.residenteNome}
                    </h2>
                    <span className="text-[11px] text-muted-foreground block truncate">
                      {salaAberta.especialidade} ({salaAberta.registro}) · Sala Criptografada Ponto-a-Ponto
                    </span>
                  </div>
                </div>

                {/* Identificação Automática do Usuário Logado */}
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-background/80 border border-border/60 text-xs shadow-2xs shrink-0">
                  <span className="text-muted-foreground text-[11px]">Identificado como:</span>
                  <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate max-w-[220px]">{nomeUsuarioLogado}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {estaEmEspera ? (
                    <Button
                      type="button"
                      size="xs"
                      onClick={handleIniciarConsulta}
                      className="text-xs rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      title="Iniciar o atendimento e conectar a chamada de vídeo"
                    >
                      <Video className="size-3.5" />
                      <span>Iniciar Atendimento</span>
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => setChamadaAtiva(false)}
                        className="text-xs rounded-xl gap-1 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10"
                        title="Retornar à sala de espera com prévia de câmera"
                      >
                        <Camera className="size-3.5" />
                        <span className="hidden sm:inline">Sala de Espera</span>
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={handleFinalizarConsulta}
                        className="text-xs rounded-xl gap-1.5 text-rose-700 dark:text-rose-300 border-rose-500/40 hover:bg-rose-500/10"
                        title="Finalizar consulta e registrar no prontuário"
                      >
                        <span>Finalizar Atendimento</span>
                      </Button>
                    </div>
                  )}

                  <Button
                    type="button"
                    size="xs"
                    variant={modalProntuarioOpen || painelProntuarioAberto ? 'default' : 'outline'}
                    onClick={() => {
                      setModalProntuarioOpen(true)
                      setPainelProntuarioAberto(true)
                    }}
                    className="text-xs rounded-xl gap-1.5"
                    title="Exibir Prontuário & Evolução Clínica em Modal"
                  >
                    <FileText className="size-3.5" />
                    <span className="hidden sm:inline">Prontuário & Evolução</span>
                  </Button>

                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => setModoTelaCheia(!modoTelaCheia)}
                    className="text-xs rounded-xl gap-1.5"
                    title={modoTelaCheia ? 'Restaurar tamanho da janela' : 'Expandir para Tela Cheia (100%)'}
                  >
                    {modoTelaCheia ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                    <span className="hidden sm:inline">{modoTelaCheia ? 'Restaurar' : 'Tela Cheia'}</span>
                  </Button>

                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setChamadaAtiva(false)
                      setSalaAberta(null)
                    }}
                    className="size-7 p-0 rounded-full"
                    title="Fechar chamada"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              {/* CORPO DA SALA: PRÉVIA ESTILO GOOGLE MEET NA SALA DE ESPERA OU ATENDIMENTO AO VIVO */}
              {estaEmEspera ? (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center bg-gradient-to-b from-card via-card/95 to-muted/20">
                  <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
                    {/* COLUNA 1: PRÉVIA DE CÂMERA & MICROFONE (LOBBY / GREEN ROOM GOOGLE MEET) */}
                    <div className="lg:col-span-7 flex flex-col items-center">
                      <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-border/80 shadow-2xl flex items-center justify-center group">
                        {/* Feed de Vídeo da Câmera (Espelhada) */}
                        <video
                          ref={videoPreviaRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                            cameraAtiva ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
                          }`}
                        />

                        {/* Fallback quando câmera estiver desligada */}
                        {!cameraAtiva && (
                          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center select-none">
                            <div className="size-24 sm:size-28 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl font-bold text-slate-200 shadow-inner">
                              {nomeUsuarioLogado.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-slate-200">A câmera está desativada</p>
                              <p className="text-xs text-slate-400">Clique no botão abaixo para ligar sua câmera</p>
                            </div>
                          </div>
                        )}

                        {/* Badge de Alerta se houver erro de permissão */}
                        {erroMidia && (
                          <div className="absolute top-4 left-4 right-4 z-20 p-3 rounded-2xl bg-rose-950/90 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 backdrop-blur-md">
                            <AlertCircle className="size-4 shrink-0 text-rose-400" />
                            <span className="leading-snug">{erroMidia}</span>
                          </div>
                        )}

                        {/* Indicador de Status de Áudio (Canto superior esquerdo) */}
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 backdrop-blur-md border ${
                              micAtivo
                                ? 'bg-black/60 border-white/10 text-emerald-300'
                                : 'bg-rose-950/80 border-rose-500/30 text-rose-200'
                            }`}
                          >
                            {micAtivo ? (
                              <>
                                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Microfone pronto</span>
                              </>
                            ) : (
                              <>
                                <MicOff className="size-3 text-rose-400" />
                                <span>Microfone silenciado</span>
                              </>
                            )}
                          </span>
                        </div>

                        {/* Identificação do Usuário no Feed de Vídeo (Canto inferior esquerdo) */}
                        <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-white text-xs font-medium">
                          <span>{nomeUsuarioLogado}</span>
                        </div>

                        {/* Barra Flutuante de Controles Estilo Google Meet (Câmera e Microfone) */}
                        <div className="absolute bottom-4 z-20 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={alternarMicrofone}
                            aria-label={micAtivo ? 'Silenciar microfone' : 'Ativar microfone'}
                            title={micAtivo ? 'Silenciar microfone' : 'Ativar microfone'}
                            className={`size-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                              micAtivo
                                ? 'bg-slate-800/90 hover:bg-slate-700 text-white border border-white/20'
                                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/40 ring-2 ring-rose-400'
                            }`}
                          >
                            {micAtivo ? <Mic className="size-5" /> : <MicOff className="size-5" />}
                          </button>

                          <button
                            type="button"
                            onClick={alternarCamera}
                            aria-label={cameraAtiva ? 'Desativar câmera' : 'Ativar câmera'}
                            title={cameraAtiva ? 'Desativar câmera' : 'Ativar câmera'}
                            className={`size-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                              cameraAtiva
                                ? 'bg-slate-800/90 hover:bg-slate-700 text-white border border-white/20'
                                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/40 ring-2 ring-rose-400'
                            }`}
                          >
                            {cameraAtiva ? <Camera className="size-5" /> : <VideoOff className="size-5" />}
                          </button>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-muted-foreground text-center">
                        Ajuste sua câmera e microfone antes de conectar. Ninguém na sala poderá ver você até que entre.
                      </p>
                    </div>

                    {/* COLUNA 2: INFORMAÇÕES DA CONSULTA & BOTÕES DE PARTICIPAR */}
                    <div className="lg:col-span-5 flex flex-col space-y-5 text-left">
                      {/* Header: Pronto(a) para participar? */}
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 font-bold text-xs uppercase tracking-wide">
                          <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                          <span>Sala de Espera Virtual</span>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                          Pronto(a) para participar?
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Identificado como: <strong className="text-foreground">{nomeUsuarioLogado}</strong>
                        </p>
                      </div>

                      {/* Card do Residente e Especialista */}
                      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              profDaConsulta?.foto ||
                              'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
                            }
                            alt={salaAberta.profissionalNome}
                            className="size-14 rounded-2xl object-cover border-2 border-teal-500/40 shadow-sm"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-foreground truncate">
                              {salaAberta.profissionalNome}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {salaAberta.especialidade} · {salaAberta.registro}
                            </p>
                            <Badge
                              variant="outline"
                              className="mt-1 text-[10px] border-teal-500/30 text-teal-700 dark:text-teal-300"
                            >
                              {salaAberta.clinica}
                            </Badge>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/50 text-xs space-y-1">
                          <p className="text-muted-foreground">
                            Paciente: <strong className="text-foreground">{salaAberta.residenteNome}</strong>
                          </p>
                          <p className="text-muted-foreground">
                            Agendamento:{' '}
                            <span className="text-foreground font-medium">
                              {salaAberta.data} às {salaAberta.horario}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Painel do Prestador / Moderador com Botão Principal */}
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-xs">
                          <span className="text-base">🛡️</span>
                          <span>Controle do Prestador / Moderador</span>
                        </div>
                        <p className="text-xs text-emerald-950/80 dark:text-emerald-200/80 leading-relaxed">
                          Você está logado(a) como responsável pelo atendimento. Quando estiver pronto(a), clique abaixo para abrir a sala virtual.
                        </p>
                        <Button
                          type="button"
                          size="lg"
                          onClick={handleIniciarConsulta}
                          className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-6 gap-2 shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01]"
                        >
                          <Video className="size-5" />
                          <span>Iniciar Consulta & Conectar Chamada</span>
                        </Button>
                      </div>

                      {/* Ação Auxiliar: Avisar Prestador no WhatsApp */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => compartilharWhatsApp(salaAberta)}
                        className="w-full rounded-xl text-xs gap-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 py-2.5"
                      >
                        <Share2 className="size-4 text-emerald-600" />
                        <span>Avisar Prestador via WhatsApp</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950">
                  {/* Janela de Vídeo WebRTC Nativa (100% em Português) */}
                  <div
                    title="Sala de Vídeo Teleconsulta"
                    className="flex-1 h-full min-h-[350px] relative bg-slate-950 flex flex-col justify-between overflow-hidden"
                  >
                    {/* Topo Flutuante: Badge de Conexão Segura e Identificação */}
                    <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs pointer-events-auto shadow-sm">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-semibold">Consulta ao Vivo</span>
                        <span className="text-white/40">·</span>
                        <span className="text-white/80">Criptografia P2P</span>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs pointer-events-auto shadow-sm">
                        <span className="text-white/70">Sala:</span>
                        <span className="font-mono text-emerald-400 font-bold">{salaAberta.codigoSala}</span>
                      </div>
                    </div>

                    {/* Área Principal de Vídeo */}
                    <div className="flex-1 relative flex items-center justify-center p-4">
                      {/* Se estiver compartilhando tela, exibe a tela no palco principal */}
                      {compartilhandoTela ? (
                        <div className="w-full h-full max-h-[70vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-2xl">
                          <video
                            ref={(el) => {
                              if (el && streamTelaRef.current) {
                                el.srcObject = streamTelaRef.current
                              }
                            }}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        /* Palco Central: Informações do Paciente & Status de Conexão */
                        <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl text-center space-y-4 backdrop-blur-md">
                          <div className="relative mx-auto size-24 sm:size-28">
                            <img
                              src={
                                profDaConsulta?.foto ||
                                'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
                              }
                              alt={salaAberta.profissionalNome}
                              className="size-full rounded-full object-cover border-4 border-teal-500/40 shadow-xl"
                            />
                            <span className="absolute bottom-1 right-1 size-7 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-xs text-white shadow-md">
                              ✓
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                              <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                              <span>Você está conectado(a) na chamada</span>
                            </div>
                            <h3 className="text-base font-bold text-white">
                              Atendimento de {salaAberta.residenteNome}
                            </h3>
                            <p className="text-xs text-slate-400">
                              {salaAberta.especialidade} com {salaAberta.profissionalNome}
                            </p>
                          </div>

                          {/* Caixa de Acolhimento do Paciente / Familiar */}
                          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-left space-y-2">
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="font-semibold text-slate-200">
                                Aguardando entrada de {salaAberta.residenteNome}
                              </span>
                              <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              O link da teleconsulta já está ativo. Caso o paciente ou familiar ainda não tenha entrado pelo celular ou tablet, envie uma mensagem pelo WhatsApp com o botão abaixo.
                            </p>
                            <Button
                              type="button"
                              onClick={() => compartilharWhatsApp(salaAberta)}
                              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 gap-2 shadow-md"
                            >
                              <Share2 className="size-3.5" />
                              <span>Enviar Link no WhatsApp da Família</span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* PiP (Picture-in-Picture) com a Câmera Local do Usuário */}
                      <div className="absolute bottom-20 right-4 sm:bottom-24 sm:right-6 z-20 w-44 sm:w-60 aspect-video rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-2xl">
                        <video
                          ref={videoChamadaLocalRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover scale-x-[-1] ${
                            cameraAtiva ? 'block' : 'hidden'
                          }`}
                        />
                        {!cameraAtiva && (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-300 select-none">
                            <div className="size-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300">
                              {nomeUsuarioLogado.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1">Câmera desligada</span>
                          </div>
                        )}
                        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded-lg backdrop-blur-xs">
                          <span className="truncate max-w-[120px] font-medium">{nomeUsuarioLogado}</span>
                          <span>{micAtivo ? '🎤' : '🔇'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de Controles Inferior 100% em Português */}
                    <div className="p-4 z-20 flex items-center justify-center gap-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
                      <button
                        type="button"
                        onClick={alternarMicrofone}
                        aria-label={micAtivo ? 'Silenciar Microfone' : 'Ativar Microfone'}
                        title={micAtivo ? 'Silenciar Microfone' : 'Ativar Microfone'}
                        className={`size-11 rounded-full flex items-center justify-center transition-all shadow-md ${
                          micAtivo
                            ? 'bg-slate-800/90 hover:bg-slate-700 text-white border border-white/20'
                            : 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400'
                        }`}
                      >
                        {micAtivo ? <Mic className="size-5" /> : <MicOff className="size-5" />}
                      </button>

                      <button
                        type="button"
                        onClick={alternarCamera}
                        aria-label={cameraAtiva ? 'Desativar Câmera' : 'Ativar Câmera'}
                        title={cameraAtiva ? 'Desativar Câmera' : 'Ativar Câmera'}
                        className={`size-11 rounded-full flex items-center justify-center transition-all shadow-md ${
                          cameraAtiva
                            ? 'bg-slate-800/90 hover:bg-slate-700 text-white border border-white/20'
                            : 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400'
                        }`}
                      >
                        {cameraAtiva ? <Camera className="size-5" /> : <VideoOff className="size-5" />}
                      </button>

                      <button
                        type="button"
                        onClick={alternarCompartilhamentoTela}
                        aria-label={compartilhandoTela ? 'Parar Compartilhamento' : 'Compartilhar Tela'}
                        title={compartilhandoTela ? 'Parar Compartilhamento' : 'Compartilhar Tela'}
                        className={`size-11 rounded-full flex items-center justify-center transition-all shadow-md ${
                          compartilhandoTela
                            ? 'bg-teal-600 text-white ring-2 ring-teal-400'
                            : 'bg-slate-800/90 hover:bg-slate-700 text-white border border-white/20'
                        }`}
                      >
                        {compartilhandoTela ? <MonitorOff className="size-5" /> : <Monitor className="size-5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setChamadaAtiva(false)}
                        aria-label="Voltar para Sala de Espera"
                        title="Voltar para Sala de Espera"
                        className="size-11 rounded-full flex items-center justify-center bg-slate-800/90 hover:bg-slate-700 text-white border border-white/20 transition-all shadow-md"
                      >
                        <Users className="size-5" />
                      </button>

                      <button
                        type="button"
                        onClick={handleFinalizarConsulta}
                        aria-label="Finalizar Atendimento"
                        title="Finalizar Atendimento"
                        className="size-11 rounded-full flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md shadow-rose-900/50"
                      >
                        <PhoneOff className="size-5" />
                      </button>
                    </div>
                  </div>

                  {/* Painel Clínico Lateral: Prontuário, Evolução e Prescrição */}
                  {painelProntuarioAberto && (
                    <div className="w-full lg:w-[420px] xl:w-[450px] border-t lg:border-t-0 lg:border-l border-border/70 bg-card flex flex-col max-h-[50vh] lg:max-h-full overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                      {/* Header do Residente */}
                      {residenteEscolhido ? (
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-foreground font-bold">{residenteEscolhido.nome}</strong>
                            <Badge variant="outline" className="text-[10px]">
                              Quarto {residenteEscolhido.quarto || '-'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {residenteEscolhido.nasc ? `Nascimento: ${String(residenteEscolhido.nasc)}` : ''} · Convênio: {String(residenteEscolhido.convenio || 'Particular')}
                          </p>
                          {residenteEscolhido.alergias && (
                            <div className="pt-1">
                              <span className="text-[10px] text-rose-600 font-semibold block">⚠️ Alergias:</span>
                              <span className="text-[10px] text-rose-700 dark:text-rose-300">
                                {Array.isArray(residenteEscolhido.alergias)
                                  ? (residenteEscolhido.alergias as string[]).join(', ')
                                  : String(residenteEscolhido.alergias)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">Residente da ILPI</p>
                      )}

                      {/* Ações Rápidas: Receita & Exames */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground block">
                          Prescrição & Pedido de Exames:
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (residenteEscolhido) {
                              setResidenteParaReceita(residenteEscolhido)
                              setModalReceitaOpen(true)
                            }
                          }}
                          className="w-full rounded-xl text-xs gap-1.5 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10"
                        >
                          <Pill className="size-3.5" />
                          <span>Emitir Receita & Pedidos de Exames</span>
                        </Button>
                      </div>

                      {/* Formulário de Evolução da Teleconsulta */}
                      <div className="space-y-2 pt-2 border-t border-border/50 flex-1 flex flex-col">
                        <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                          <span>Evolução Clínica da Consulta</span>
                          <div className="flex items-center gap-1.5">
                            {salaAberta && temRascunho(`teleconsulta_evolucao_${salaAberta.id}`) && textoEvolucao.trim() && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                ✓ Rascunho salvo
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground font-normal">Grava no Prontuário</span>
                          </div>
                        </Label>
                        <textarea
                          value={textoEvolucao}
                          onChange={(e) => setTextoEvolucao(e.target.value)}
                          placeholder="Descreva o atendimento, conduta terapêutica, orientações aos cuidadores..."
                          rows={6}
                          className="w-full text-xs rounded-xl border border-input bg-background p-2.5 focus-visible:outline-ring resize-none leading-relaxed"
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={salvandoEvolucao}
                          onClick={handleSalvarEvolucaoConsulta}
                          className="rounded-xl text-xs bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold"
                        >
                          {salvandoEvolucao ? 'Salvando...' : 'Salvar Evolução no Prontuário'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE EMISSÃO DE RECEITAS & EXAMES DA CONSULTA */}
      {residenteParaReceita && (
        <ModalPedidoMedico
          open={modalReceitaOpen}
          onOpenChange={setModalReceitaOpen}
          residente={residenteParaReceita}
          tipoInicial="receituario"
          className="!z-[80] !w-[96vw] !max-w-[96vw] sm:!max-w-[96vw] lg:!max-w-[96vw] xl:!max-w-[1600px] !max-h-[94vh] overflow-y-auto overflow-x-hidden"
          onPedidoSalvo={() => {
            toast.success('Receita / pedido médico gravado e assinado no prontuário!')
          }}
        />
      )}

      {/* MODAL DE PRONTUÁRIO & EVOLUÇÃO (Acessível em Tela Cheia, Sala de Espera ou Chamada ao Vivo) */}
      <Dialog open={modalProntuarioOpen} onOpenChange={setModalProntuarioOpen}>
        <DialogContent
          overlayClassName="!z-[60]"
          className="!z-[65] max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 space-y-4"
        >
          <DialogHeader className="border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                <FileText className="size-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Prontuário & Evolução Clínica
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {salaAberta ? `Consulta com ${salaAberta.profissionalNome} (${salaAberta.especialidade})` : 'Atendimento Virtual'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Dados do Residente */}
          {residenteEscolhido ? (
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-sm font-bold text-foreground">{residenteEscolhido.nome}</strong>
                  <p className="text-[11px] text-muted-foreground">
                    {residenteEscolhido.nasc ? `Nascimento: ${String(residenteEscolhido.nasc)}` : ''} · Convênio: {String(residenteEscolhido.convenio || 'Particular')}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-semibold">
                  Quarto {residenteEscolhido.quarto || '-'}
                </Badge>
              </div>

              {residenteEscolhido.alergias && (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
                  <span className="font-bold text-[11px] block">⚠️ Alergias Conhecidas:</span>
                  <span className="text-[11px]">
                    {Array.isArray(residenteEscolhido.alergias)
                      ? (residenteEscolhido.alergias as string[]).join(', ')
                      : String(residenteEscolhido.alergias)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Residente da ILPI</p>
          )}

          {/* Ação: Emissão de Pedido Médico / Receituário */}
          <div className="p-3.5 rounded-xl bg-card border border-border/70 flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-foreground block">Prescrição & Pedido de Exames</span>
              <span className="text-[11px] text-muted-foreground">
                Gere guias timbradas A4 para farmácia e laboratório durante o atendimento
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (residenteEscolhido) {
                  setResidenteParaReceita(residenteEscolhido)
                  setModalReceitaOpen(true)
                } else {
                  toast.error('Residente não identificado nesta consulta.')
                }
              }}
              className="rounded-xl text-xs gap-1.5 shrink-0 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 font-semibold"
            >
              <Pill className="size-3.5" />
              <span>Emitir Receita & Exames</span>
            </Button>
          </div>

          {/* Formulário de Evolução da Teleconsulta com Auto-Save */}
          <div className="space-y-2 p-3.5 rounded-xl border border-border/70 bg-card text-xs">
            <Label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Evolução Clínica da Consulta</span>
              <div className="flex items-center gap-1.5">
                {salaAberta && temRascunho(`teleconsulta_evolucao_${salaAberta.id}`) && textoEvolucao.trim() && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Rascunho salvo
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground font-normal">Grava no Prontuário</span>
              </div>
            </Label>
            <textarea
              value={textoEvolucao}
              onChange={(e) => setTextoEvolucao(e.target.value)}
              placeholder="Descreva o atendimento, conduta terapêutica, orientações aos cuidadores..."
              rows={6}
              className="w-full text-xs rounded-xl border border-input bg-background p-2.5 focus-visible:outline-ring resize-none leading-relaxed"
            />
            <Button
              type="button"
              size="sm"
              disabled={salvandoEvolucao}
              onClick={handleSalvarEvolucaoConsulta}
              className="rounded-xl text-xs bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold w-full sm:w-auto"
            >
              {salvandoEvolucao ? 'Salvando...' : 'Salvar Evolução no Prontuário'}
            </Button>
          </div>

          {/* Prescrições / Medicamentos em uso do Residente */}
          {residenteEscolhido && residenteEscolhido.presc && residenteEscolhido.presc.length > 0 && (
            <div className="space-y-2 p-3.5 rounded-xl border border-border/60 bg-muted/20 text-xs">
              <span className="font-bold text-foreground block">Medicamentos em Uso (Prescrições Vigentes)</span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {residenteEscolhido.presc.map((p, idx) => (
                  <div key={p.id || idx} className="p-2 rounded-lg bg-background border border-border/50 flex items-center justify-between text-[11px]">
                    <div>
                      <strong className="text-foreground">{p.med}</strong>
                      <span className="text-[10px] text-muted-foreground block">
                        {p.dose} · {p.via}{p.horarios?.length ? ` · Horários: ${p.horarios.join(', ')}` : ''}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {p.tipo || 'Uso contínuo'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* MODAL DE CONEXÃO MERCADO PAGO MARKETPLACE & SPLIT */}
      <ModalConectarMercadoPago
        open={modalMercadoPagoOpen}
        onOpenChange={setModalMercadoPagoOpen}
        profissionais={profissionais}
      />

      {/* MODAL DE CADASTRO DE ESPECIALISTA INDEPENDENTE */}
      <ModalCadastroEspecialista
        open={modalCadastroOpen}
        onOpenChange={(open) => {
          setModalCadastroOpen(open)
          if (!open) {
            setProfissionais(obterProfissionaisVirtuais())
          }
        }}
      />
    </div>
  )
}
