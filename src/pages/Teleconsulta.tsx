import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { iso } from '../lib/business/dates'
import {
  PROFISSIONAIS_VIRTUAIS,
  gerarLinkSalaJitsi,
  buildJitsiUrl,
  obterConsultasVirtuais,
  salvarConsultaVirtual,
  atualizarStatusConsulta,
  marcarEvolucaoConsulta,
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
import {
  Building2,
  Calendar,
  CalendarCheck,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Pill,
  QrCode,
  Search,
  Share2,
  Sparkles,
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

  // Sala de Teleconsulta ao Vivo (Jitsi Meet gratuito)
  const [salaAberta, setSalaAberta] = useState<ConsultaVirtual | null>(null)
  const [painelProntuarioAberto, setPainelProntuarioAberto] = useState(true)
  const [modoTelaCheia, setModoTelaCheia] = useState(false)

  // Nome do usuário logado para identificação automática na sala do Jitsi
  const nomeUsuarioLogado = useMemo(() => {
    if (profissional?.nome) {
      const funcao = profissional.funcao ? ` (${profissional.funcao})` : ''
      return `${profissional.nome}${funcao}`
    }
    return 'Equipe ILPI'
  }, [profissional])

  // Link da sala para a iframe atual (com identificação automática do usuário logado e bypass de pré-sala)
  const urlSalaLogado = useMemo(() => {
    if (!salaAberta) return ''
    return buildJitsiUrl(salaAberta.linkSala, nomeUsuarioLogado)
  }, [salaAberta, nomeUsuarioLogado])

  // Evolução clínica durante a consulta
  const [textoEvolucao, setTextoEvolucao] = useState('')
  const [salvandoEvolucao, setSalvandoEvolucao] = useState(false)

  // Modal de Prescrição / Pedido Médico
  const [modalReceitaOpen, setModalReceitaOpen] = useState(false)
  const [residenteParaReceita, setResidenteParaReceita] = useState<Residente | null>(null)

  const profDaConsulta = useMemo(() => {
    if (!salaAberta) return null
    return PROFISSIONAIS_VIRTUAIS.find((p) => p.id === salaAberta.profissionalId) || null
  }, [salaAberta])

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

  // Gerencia o ciclo de vida do stream da webcam na sala de espera
  useEffect(() => {
    if (salaAberta && estaEmEspera) {
      iniciarPreviaDispositivos()
    } else {
      if (streamLocal) {
        streamLocal.getTracks().forEach((t) => t.stop())
        setStreamLocal(null)
      }
    }
    return () => {
      if (streamLocal) {
        streamLocal.getTracks().forEach((t) => t.stop())
      }
    }
  }, [salaAberta?.id, estaEmEspera])

  // Vincula o srcObject ao elemento de vídeo quando a referência estiver pronta
  useEffect(() => {
    if (videoPreviaRef.current && streamLocal) {
      videoPreviaRef.current.srcObject = streamLocal
    }
  }, [streamLocal, cameraAtiva])

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
    // Desliga a prévia da webcam para liberar o hardware para o vídeo
    if (streamLocal) {
      streamLocal.getTracks().forEach((t) => t.stop())
      setStreamLocal(null)
    }
    setChamadaAtiva(true)
    atualizarStatusConsulta(salaAberta.id, 'em_andamento')
    setSalaAberta((prev) => (prev ? { ...prev, status: 'em_andamento' } : null))
    setConsultas((prev) =>
      prev.map((c) => (c.id === salaAberta.id ? { ...c, status: 'em_andamento' } : c))
    )
    toast.success('Atendimento iniciado! Chamada de vídeo conectada.')
  }

  function handleFinalizarConsulta() {
    if (!salaAberta) return
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
    return PROFISSIONAIS_VIRTUAIS.filter((p) => {
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
  }, [filtroEsp, busca])

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

    // Simula validação segura de pagamento (PIX ou Cartão)
    await new Promise((resolve) => setTimeout(resolve, 1200))

    const res = residentes.find((r) => r.id === residenteId)
    const id = `cv_${Date.now()}`
    const codigoSala = `senecurare-${profSelecionado.especialidade}-${Date.now().toString(36)}`

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
    toast.success('Pagamento confirmado e consulta agendada!')
  }

  function copiarChavePix() {
    const chave = `00020126580014br.gov.bcb.pix0136senecurare-telemedicina-${Date.now()}5204000053039865405${profSelecionado?.preco || 200}.005802BR5919SENECURARE ILPI6009SAO PAULO62070503***6304`
    navigator.clipboard.writeText(chave)
    toast.success('Código PIX Copia e Cola copiado para a área de transferência!')
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
                <span>Teleconsulta & Consultas Virtuais</span>
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

        {/* Seletor de Abas */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 self-start sm:self-auto shadow-2xs">
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
        </div>
      </div>

      {/* ABA 1: VITRINE DE PROFISSIONAIS E AGENDAMENTO */}
      {abaAtiva === 'especialistas' && (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['todas', 'medica', 'estomaterapia', 'nutricao', 'psicologia'] as const).map((esp) => (
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
                      <img
                        src={prof.foto}
                        alt={prof.nome}
                        className="size-18 rounded-2xl object-cover border-2 border-border/80 shadow-xs"
                      />
                      <span className="absolute -bottom-1 -right-1 size-4.5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center text-white" title="Disponível para teleatendimento">
                        <CheckCircle2 className="size-3" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                          {prof.especialidadeLabel}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-muted/40 border-border/60">
                          <Clock className="size-2.5 mr-1 text-muted-foreground" /> {prof.duracaoMin} min
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

      {/* SALA DE TELECONSULTA AO VIVO COM PRONTUÁRIO INTEGRADO (Jitsi Meet Gratuito) */}
      <Dialog open={!!salaAberta} onOpenChange={(open) => !open && setSalaAberta(null)}>
        <DialogContent
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
                    variant={painelProntuarioAberto ? 'default' : 'outline'}
                    onClick={() => setPainelProntuarioAberto(!painelProntuarioAberto)}
                    className="text-xs rounded-xl gap-1.5"
                    title={painelProntuarioAberto ? 'Ocultar prontuário para expandir o vídeo' : 'Exibir Prontuário & Evolução'}
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
                    variant="outline"
                    onClick={() => window.open(urlSalaLogado, '_blank')}
                    className="text-xs rounded-xl gap-1"
                    title="Abrir em tela cheia / janela separada em nova aba já identificado"
                  >
                    <ExternalLink className="size-3.5" />
                    <span className="hidden sm:inline">Nova Aba</span>
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
                  {/* Janela de Vídeo WebRTC */}
                  <div className="flex-1 h-full min-h-[350px] relative bg-black">
                    <iframe
                      src={urlSalaLogado}
                      allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
                      className="w-full h-full border-none relative z-10"
                      title="Sala de Vídeo Teleconsulta"
                    />
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
                          <span className="text-[10px] text-muted-foreground font-normal">Grava no Prontuário</span>
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
          className="!w-[96vw] !max-w-[96vw] sm:!max-w-[96vw] lg:!max-w-[96vw] xl:!max-w-[1600px] !max-h-[94vh] overflow-y-auto overflow-x-hidden"
          onPedidoSalvo={() => {
            toast.success('Receita / pedido médico gravado e assinado no prontuário!')
          }}
        />
      )}
    </div>
  )
}
