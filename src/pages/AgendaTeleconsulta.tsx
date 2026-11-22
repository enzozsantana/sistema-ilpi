import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useIlpiData } from '../contexts/IlpiDataContext'
import {
  obterConsultasVirtuais,
  salvarConsultaVirtual,
  obterProfissionaisVirtuais,
  obterConfiguracaoAgenda,
  salvarConfiguracaoAgenda,
  obterSlotsDia,
  adicionarBloqueioAgenda,
  removerBloqueioAgenda,
  reagendarConsulta,
  cancelarConsultaComJustificativa,
  gerarLinkSalaJitsi,
  buildJitsiUrl,
  DIAS_SEMANA_NOMES,
} from '../lib/teleconsultaStorage'
import type {
  ConfiguracaoAgendaProfissional,
  ConsultaVirtual,
  MetodoPagamento,
  ProfissionalVirtual,
  SlotHorarioAgenda,
  StatusConsulta,
  VisualizacaoAgenda,
} from '../types/teleconsulta'
import { iso, parse, addD, fmt } from '../lib/business/dates'
import { formatarMoeda } from '../lib/currency'
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
  Calendar as CalendarIcon,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Stethoscope,
  Trash2,
  User,
  Video,
  X,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Sliders,
  DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function AgendaTeleconsulta() {
  const { profissional } = useAuth()
  const { residentes } = useIlpiData()

  // Especialistas Virtuais
  const [profissionais, setProfissionais] = useState<ProfissionalVirtual[]>(() =>
    obterProfissionaisVirtuais(),
  )

  // Profissional ativo na visualização da agenda
  const [profAtivoId, setProfAtivoId] = useState<string>(() => {
    if (profissional?.cat === 'tele_especialista') {
      const match = profissionais.find(
        (p) =>
          p.id === profissional.id ||
          p.nome.toLowerCase().includes(profissional.nome.toLowerCase()),
      )
      if (match) return match.id
    }
    return profissionais[0]?.id || ''
  })

  const profAtivo = useMemo(() => {
    return profissionais.find((p) => p.id === profAtivoId) || profissionais[0]
  }, [profissionais, profAtivoId])

  // Todas as consultas
  const [consultas, setConsultas] = useState<ConsultaVirtual[]>(() => obterConsultasVirtuais())

  // Data selecionada (padrão: hoje)
  const hojeIso = useMemo(() => iso(new Date()), [])
  const [dataSelecionada, setDataSelecionada] = useState<string>(hojeIso)

  // Modo de visualização: Dia, Semana, Mês ou Lista
  const [visualizacao, setVisualizacao] = useState<VisualizacaoAgenda>('dia')

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<StatusConsulta | 'todos'>('todos')
  const [busca, setBusca] = useState<string>('')

  // Configuração da agenda do profissional ativo
  const [configAgenda, setConfigAgenda] = useState<ConfiguracaoAgendaProfissional>(() =>
    obterConfiguracaoAgenda(profAtivoId),
  )

  useEffect(() => {
    if (profAtivoId) {
      setConfigAgenda(obterConfiguracaoAgenda(profAtivoId))
    }
  }, [profAtivoId])

  const recarregarConsultas = useCallback(() => {
    setConsultas(obterConsultasVirtuais())
  }, [])

  // Modais
  const [modalConfigOpen, setModalConfigOpen] = useState(false)
  const [modalNovoAgendamentoOpen, setModalNovoAgendamentoOpen] = useState(false)
  const [modalReagendamentoOpen, setModalReagendamentoOpen] = useState(false)
  const [modalCancelamentoOpen, setModalCancelamentoOpen] = useState(false)
  const [modalSalaVirtualOpen, setModalSalaVirtualOpen] = useState(false)

  // Consulta em foco para reagendamento, cancelamento ou sala
  const [consultaSelecionada, setConsultaSelecionada] = useState<ConsultaVirtual | null>(null)

  // Estado do formulário de novo agendamento / encaixe
  const [novoResidenteId, setNovoResidenteId] = useState<string>('')
  const [novoData, setNovoData] = useState<string>(hojeIso)
  const [novoHorario, setNovoHorario] = useState<string>('09:00')
  const [novoMotivo, setNovoMotivo] = useState<string>('')
  const [novoMetodo, setNovoMetodo] = useState<MetodoPagamento>('pix')

  // Estado do formulário de reagendamento
  const [reagendarData, setReagendarData] = useState<string>(hojeIso)
  const [reagendarHorario, setReagendarHorario] = useState<string>('')

  // Estado do formulário de cancelamento
  const [motivoCancelamento, setMotivoCancelamento] = useState<string>('')

  // Estado para adicionar bloqueio de agenda
  const [novoBloqueioData, setNovoBloqueioData] = useState<string>(hojeIso)
  const [novoBloqueioMotivo, setNovoBloqueioMotivo] = useState<string>('')
  const [novoBloqueioDiaInteiro, setNovoBloqueioDiaInteiro] = useState<boolean>(true)
  const [novoBloqueioInicio, setNovoBloqueioInicio] = useState<string>('08:00')
  const [novoBloqueioFim, setNovoBloqueioFim] = useState<string>('12:00')

  // Slots do dia para o profissional ativo
  const slotsDoDia: SlotHorarioAgenda[] = useMemo(() => {
    if (!profAtivo) return []
    return obterSlotsDia(profAtivo.id, dataSelecionada, consultas)
  }, [profAtivo, dataSelecionada, consultas])

  // Filtragem de consultas exibidas
  const consultasFiltradas = useMemo(() => {
    return consultas.filter((c) => {
      // Filtro por profissional (se não for modo "todos")
      if (profAtivo && c.profissionalId !== profAtivo.id) {
        return false
      }
      // Filtro por status
      if (filtroStatus !== 'todos' && c.status !== filtroStatus) {
        return false
      }
      // Filtro por busca de texto
      if (busca.trim()) {
        const q = busca.toLowerCase()
        const matchResidente = c.residenteNome.toLowerCase().includes(q)
        const matchMotivo = (c.motivo || '').toLowerCase().includes(q)
        const matchProf = c.profissionalNome.toLowerCase().includes(q)
        if (!matchResidente && !matchMotivo && !matchProf) return false
      }
      return true
    })
  }, [consultas, profAtivo, filtroStatus, busca])

  // Estatísticas e KPIs para o profissional ativo
  const kpis = useMemo(() => {
    const doProfissional = consultas.filter(
      (c) => !profAtivo || c.profissionalId === profAtivo.id,
    )
    const hoje = doProfissional.filter((c) => c.data === hojeIso && c.status !== 'cancelada')
    const confirmadasHoje = hoje.filter((c) => c.status === 'confirmada' || c.status === 'em_andamento').length
    const concluidasHoje = hoje.filter((c) => c.status === 'concluida').length

    // Semana atual (próximos 7 dias)
    const limiteSemana = iso(addD(new Date(), 7))
    const semana = doProfissional.filter(
      (c) => c.data >= hojeIso && c.data <= limiteSemana && c.status !== 'cancelada',
    )

    // Faturamento e Repasse acumulado (80% para o especialista)
    const totalFaturado = doProfissional
      .filter((c) => c.status !== 'cancelada')
      .reduce((acc, c) => acc + (c.valor || 0), 0)
    const repasseEstimado = totalFaturado * 0.8

    return {
      totalHoje: hoje.length,
      confirmadasHoje,
      concluidasHoje,
      totalSemana: semana.length,
      totalGeral: doProfissional.length,
      repasseEstimado,
    }
  }, [consultas, profAtivo, hojeIso])

  // Navegação de datas
  function navegarDia(delta: number) {
    const base = parse(dataSelecionada)
    const novaData = addD(base, delta)
    setDataSelecionada(iso(novaData))
  }

  function irParaHoje() {
    setDataSelecionada(hojeIso)
  }

  // Abertura de Sala Virtual
  function handleEntrarNaSala(consulta: ConsultaVirtual) {
    setConsultaSelecionada(consulta)
    setModalSalaVirtualOpen(true)
  }

  // Abertura de Reagendamento
  function abrirReagendamento(consulta: ConsultaVirtual) {
    setConsultaSelecionada(consulta)
    setReagendarData(consulta.data)
    setReagendarHorario(consulta.horario)
    setModalReagendamentoOpen(true)
  }

  function handleConfirmarReagendamento() {
    if (!consultaSelecionada) return
    if (!reagendarData) {
      toast.error('Informe a nova data para o atendimento.')
      return
    }
    if (!reagendarHorario) {
      toast.error('Selecione o novo horário disponível.')
      return
    }

    const sucesso = reagendarConsulta(consultaSelecionada.id, reagendarData, reagendarHorario)
    if (sucesso) {
      recarregarConsultas()
      setModalReagendamentoOpen(false)
      toast.success(
        `Consulta reagendada com sucesso para ${fmt(reagendarData)} às ${reagendarHorario}!`,
      )
    } else {
      toast.error('Não foi possível reagendar a consulta.')
    }
  }

  // Abertura de Cancelamento
  function abrirCancelamento(consulta: ConsultaVirtual) {
    setConsultaSelecionada(consulta)
    setMotivoCancelamento('')
    setModalCancelamentoOpen(true)
  }

  function handleConfirmarCancelamento() {
    if (!consultaSelecionada) return
    if (!motivoCancelamento.trim()) {
      toast.error('Informe a justificativa para o cancelamento do atendimento.')
      return
    }

    const sucesso = cancelarConsultaComJustificativa(
      consultaSelecionada.id,
      motivoCancelamento.trim(),
    )
    if (sucesso) {
      recarregarConsultas()
      setModalCancelamentoOpen(false)
      toast.success('Teleconsulta cancelada e horário liberado na agenda.')
    } else {
      toast.error('Não foi possível cancelar o atendimento.')
    }
  }

  // Encaixe / Novo Agendamento
  function abrirNovoAgendamento(horarioSugerido?: string) {
    setNovoResidenteId(residentes[0]?.id || '')
    setNovoData(dataSelecionada)
    setNovoHorario(horarioSugerido || '09:00')
    setNovoMotivo('')
    setNovoMetodo('pix')
    setModalNovoAgendamentoOpen(true)
  }

  function handleSalvarNovoAgendamento() {
    if (!profAtivo) return
    if (!novoResidenteId) {
      toast.error('Selecione o residente para o atendimento.')
      return
    }
    if (!novoData || !novoHorario) {
      toast.error('Informe a data e o horário da teleconsulta.')
      return
    }

    const res = residentes.find((r) => r.id === novoResidenteId)
    const id = `cv_${Date.now()}`
    const codigoSala = `senecurare-${profAtivo.especialidade}-${Date.now().toString(36)}`

    const nova: ConsultaVirtual = {
      id,
      profissionalId: profAtivo.id,
      profissionalNome: profAtivo.nome,
      especialidade: profAtivo.especialidadeLabel,
      registro: profAtivo.registro,
      clinica: profAtivo.clinica,
      residenteId: novoResidenteId,
      residenteNome: res?.nome || 'Residente da ILPI',
      data: novoData,
      horario: novoHorario,
      valor: profAtivo.preco,
      metodoPagamento: novoMetodo,
      pago: true,
      linkSala: gerarLinkSalaJitsi(codigoSala),
      codigoSala,
      status: 'confirmada',
      motivo: novoMotivo.trim() || 'Agendamento direto via Painel de Agenda.',
      criadoEm: new Date().toISOString(),
      solicitanteId: profissional?.id,
      solicitanteNome: profissional?.nome,
      solicitanteFuncao: profissional?.funcao || 'Coordenação Clínica',
    }

    salvarConsultaVirtual(nova)
    recarregarConsultas()
    setModalNovoAgendamentoOpen(false)
    toast.success(`Teleconsulta confirmada para ${res?.nome || 'residente'} em ${fmt(novoData)} às ${novoHorario}!`)
  }

  // Gestão de Bloqueios de Agenda
  function handleAdicionarBloqueio() {
    if (!profAtivo) return
    if (!novoBloqueioData) {
      toast.error('Informe a data do bloqueio.')
      return
    }
    if (!novoBloqueioMotivo.trim()) {
      toast.error('Descreva o motivo do bloqueio (ex: Férias, Folga, Reunião).')
      return
    }

    adicionarBloqueioAgenda({
      profissionalId: profAtivo.id,
      data: novoBloqueioData,
      motivo: novoBloqueioMotivo.trim(),
      diaInteiro: novoBloqueioDiaInteiro,
      horarioInicio: novoBloqueioDiaInteiro ? undefined : novoBloqueioInicio,
      horarioFim: novoBloqueioDiaInteiro ? undefined : novoBloqueioFim,
    })

    setConfigAgenda(obterConfiguracaoAgenda(profAtivo.id))
    setNovoBloqueioMotivo('')
    toast.success('Período de bloqueio registrado na agenda.')
  }

  function handleRemoverBloqueio(id: string) {
    if (!profAtivo) return
    removerBloqueioAgenda(id)
    setConfigAgenda(obterConfiguracaoAgenda(profAtivo.id))
    toast.success('Bloqueio removido com sucesso.')
  }

  // Salvar Configuração de Disponibilidade
  function handleSalvarConfiguracao() {
    if (!profAtivo) return
    salvarConfiguracaoAgenda(configAgenda)
    setProfissionais(obterProfissionaisVirtuais())
    setModalConfigOpen(false)
    toast.success('Configurações de horários e disponibilidade salvas!')
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto pb-24">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <CalendarDays className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Agenda de Teleconsultas
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs">
                  Tempo Real
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestão de horários, bloqueios de atendimento e consultas virtuais dos especialistas.
              </p>
            </div>
          </div>
        </div>

        {/* Seletor de Profissional e Ações Principais */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dropdown de Especialistas */}
          <div className="w-full sm:w-64">
            <SearchableSelect
              placeholder="Selecione o especialista"
              value={profAtivoId}
              onValueChange={setProfAtivoId}
              options={profissionais.map((p) => ({
                value: p.id,
                label: `${p.nome} (${p.titulo.split('&')[0].trim()})`,
              }))}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalConfigOpen(true)}
            className="gap-2 rounded-xl"
            title="Configurar dias da semana, horários e intervalos de atendimento"
          >
            <Settings className="size-4" />
            <span className="hidden sm:inline">Disponibilidade & Folgas</span>
          </Button>

          <Button
            size="sm"
            onClick={() => abrirNovoAgendamento()}
            className="gap-2 rounded-xl shadow-xs"
          >
            <CalendarPlus className="size-4" />
            <span>Novo Agendamento</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <Link to="/teleconsulta">
              <Video className="size-4" />
              <span className="hidden sm:inline">Vitrine</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de Resumo e KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xs shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Hoje ({fmt(hojeIso)})
              </p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">
                {kpis.totalHoje}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  atendimento{kpis.totalHoje !== 1 ? 's' : ''}
                </span>
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                {kpis.confirmadasHoje} confirmada{kpis.confirmadasHoje !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <CalendarCheck className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xs shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Próximos 7 Dias
              </p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">
                {kpis.totalSemana}{' '}
                <span className="text-xs font-normal text-muted-foreground">agendadas</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Grade da semana ativa</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xs shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Concluídas (Hoje)
              </p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {kpis.concluidasHoje}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Evolução e conduta</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Stethoscope className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xs shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Repasse Previsto (80%)
              </p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">
                {formatarMoeda(kpis.repasseEstimado)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Split automático Mercado Pago</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
              <DollarSign className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cartão de Identificação do Especialista Ativo */}
      {profAtivo && (
        <Card className="rounded-2xl border-border/60 bg-gradient-to-r from-card via-card to-primary/5 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={profAtivo.foto}
                alt={profAtivo.nome}
                className="size-14 rounded-2xl object-cover border-2 border-primary/20 shrink-0 shadow-xs"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-foreground">{profAtivo.nome}</h2>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {profAtivo.especialidadeLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground">· {profAtivo.registro}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{profAtivo.clinica}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Clock className="size-3.5 text-primary" />
                    {profAtivo.duracaoMin} min por consulta
                  </span>
                  <span>·</span>
                  <span>{formatarMoeda(profAtivo.preco)} (Repasse: {formatarMoeda(profAtivo.preco * 0.8)})</span>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {profAtivo.diasAtendimento?.length || 0} dias de atendimento na semana
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalConfigOpen(true)}
                className="rounded-xl text-xs gap-1.5"
              >
                <Sliders className="size-3.5" />
                Editar Horários & Turnos
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Barra de Controles: Navegador Temporal, Modos de Visualização e Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-muted/40 p-3 rounded-2xl border border-border/50">
        {/* Controles de Data */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navegarDia(-1)}
            className="size-9 rounded-xl"
            title="Dia anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Button
            variant={dataSelecionada === hojeIso ? 'default' : 'outline'}
            size="sm"
            onClick={irParaHoje}
            className="rounded-xl text-xs font-medium px-3 h-9"
          >
            Hoje
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => navegarDia(1)}
            className="size-9 rounded-xl"
            title="Próximo dia"
          >
            <ChevronRight className="size-4" />
          </Button>

          <div className="flex items-center gap-2 ml-1">
            <Input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="h-9 w-auto text-xs font-medium rounded-xl border-border/80"
            />
            <span className="text-xs font-semibold text-foreground hidden sm:inline">
              {(() => {
                const [y, m, d] = dataSelecionada.split('-').map(Number)
                const dt = new Date(y, m - 1, d)
                return DIAS_SEMANA_NOMES[dt.getDay()]
              })()}
            </span>
          </div>
        </div>

        {/* Alternância de Modo: Dia / Semana / Mês / Lista */}
        <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/60 self-start md:self-auto">
          <Button
            variant={visualizacao === 'dia' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setVisualizacao('dia')}
            className={cn('h-7.5 px-3 rounded-lg text-xs font-medium', visualizacao === 'dia' && 'bg-primary text-primary-foreground font-semibold shadow-xs')}
          >
            Dia
          </Button>
          <Button
            variant={visualizacao === 'semana' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setVisualizacao('semana')}
            className={cn('h-7.5 px-3 rounded-lg text-xs font-medium', visualizacao === 'semana' && 'bg-primary text-primary-foreground font-semibold shadow-xs')}
          >
            Semana
          </Button>
          <Button
            variant={visualizacao === 'lista' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setVisualizacao('lista')}
            className={cn('h-7.5 px-3 rounded-lg text-xs font-medium', visualizacao === 'lista' && 'bg-primary text-primary-foreground font-semibold shadow-xs')}
          >
            Lista Completa
          </Button>
        </div>

        {/* Filtros e Busca */}
        <div className="flex items-center gap-2">
          <div className="relative w-44 sm:w-56">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar residente…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-9 pl-8 pr-3 text-xs rounded-xl"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as any)}
            className="h-9 text-xs rounded-xl border border-input bg-background px-2.5 py-1 text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
            aria-label="Filtro de Status"
          >
            <option value="todos">Todos Status</option>
            <option value="confirmada">Confirmadas</option>
            <option value="agendada">Agendadas</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluídas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Conteúdo Principal de Acordo com a Visualização */}

      {/* 1. VISUALIZAÇÃO DO DIA (Slots e Grade Horária) */}
      {visualizacao === 'dia' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Grade de Horários · {fmt(dataSelecionada)}
              <span className="text-xs font-normal text-muted-foreground">
                ({slotsDoDia.filter((s) => s.disponivel).length} vagas disponíveis)
              </span>
            </h3>

            <Button
              variant="outline"
              size="sm"
              onClick={() => abrirNovoAgendamento()}
              className="text-xs rounded-xl gap-1.5"
            >
              <Plus className="size-3.5" />
              Encaixe de Consulta
            </Button>
          </div>

          {slotsDoDia.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-border/80 p-8 text-center bg-card/40">
              <CalendarIcon className="size-10 text-muted-foreground mx-auto mb-3 opacity-60" />
              <h4 className="text-base font-semibold text-foreground">
                Profissional não atende nesta data
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
                O dia {fmt(dataSelecionada)} não está configurado na grade semanal de atendimentos
                de {profAtivo?.nome}.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalConfigOpen(true)}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Sliders className="size-3.5" />
                  Ajustar Grade Semanal
                </Button>
                <Button
                  size="sm"
                  onClick={() => abrirNovoAgendamento('09:00')}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Plus className="size-3.5" />
                  Forçar Encaixe Avulso
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {slotsDoDia.map((slot, index) => {
                const c = slot.consulta

                // Slot Ocupado com Consulta
                if (c) {
                  const ehConcluida = c.status === 'concluida'
                  const ehEmAndamento = c.status === 'em_andamento'
                  const ehCancelada = c.status === 'cancelada'

                  return (
                    <Card
                      key={c.id || index}
                      className={cn(
                        'rounded-2xl border transition-all duration-150 overflow-hidden shadow-xs',
                        ehEmAndamento
                          ? 'border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/40'
                          : ehConcluida
                          ? 'border-border/60 bg-card/60 opacity-90'
                          : 'border-border/80 bg-card hover:border-primary/40',
                      )}
                    >
                      <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {/* Horário */}
                          <div className="flex flex-col items-center justify-center bg-primary/10 text-primary font-bold px-3 py-2 rounded-xl text-center min-w-[72px] shrink-0">
                            <span className="text-base tracking-tight">{slot.horario}</span>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {profAtivo?.duracaoMin || 45} min
                            </span>
                          </div>

                          {/* Dados do Paciente e Detalhes da Consulta */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-bold text-foreground">
                                {c.residenteNome}
                              </h4>
                              <Badge
                                variant={
                                  ehConcluida
                                    ? 'outline'
                                    : ehEmAndamento
                                    ? 'default'
                                    : 'secondary'
                                }
                                className={cn(
                                  'text-xs font-semibold capitalize',
                                  ehEmAndamento && 'bg-emerald-600 animate-pulse text-white',
                                  ehConcluida && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
                                )}
                              >
                                {c.status.replace('_', ' ')}
                              </Badge>

                              {c.reagendadaDe && (
                                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10">
                                  Reagendada
                                </Badge>
                              )}

                              <Badge variant="outline" className="text-[10px] bg-muted/60 text-muted-foreground border-border/80">
                                {c.metodoPagamento === 'pix' ? 'PIX Split' : 'Cartão Crédito'}
                              </Badge>
                            </div>

                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-foreground">{c.profissionalNome}</span>
                              <span>·</span>
                              <span>{c.especialidade}</span>
                              {c.motivo && (
                                <>
                                  <span>·</span>
                                  <span className="italic text-foreground/80 font-normal">
                                    "{c.motivo}"
                                  </span>
                                </>
                              )}
                            </p>

                            {c.notasPreConsulta && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg mt-1 inline-block">
                                <strong>Obs:</strong> {c.notasPreConsulta}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Botões de Ação na Consulta */}
                        <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                          {/* Acesso ao Prontuário */}
                          {c.residenteId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                            >
                              <Link to={`/residentes/${c.residenteId}/tudo`}>
                                <User className="size-3.5" />
                                <span className="hidden sm:inline">Prontuário</span>
                              </Link>
                            </Button>
                          )}

                          {/* Reagendar */}
                          {!ehConcluida && !ehCancelada && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirReagendamento(c)}
                              className="rounded-xl text-xs gap-1.5"
                            >
                              <RefreshCw className="size-3.5 text-muted-foreground" />
                              <span className="hidden sm:inline">Reagendar</span>
                            </Button>
                          )}

                          {/* Cancelar */}
                          {!ehConcluida && !ehCancelada && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirCancelamento(c)}
                              className="rounded-xl text-xs text-destructive hover:bg-destructive/10"
                              title="Cancelar atendimento"
                            >
                              <XCircle className="size-4" />
                            </Button>
                          )}

                          {/* Entrar na Sala Virtual */}
                          <Button
                            size="sm"
                            onClick={() => handleEntrarNaSala(c)}
                            className={cn(
                              'rounded-xl text-xs font-semibold gap-1.5 shadow-xs',
                              ehEmAndamento
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-primary hover:bg-primary/90 text-primary-foreground',
                            )}
                          >
                            <Video className="size-3.5" />
                            {ehEmAndamento ? 'Reconectar Sala' : ehConcluida ? 'Ver Sala / Histórico' : 'Entrar na Sala'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }

                // Slot Bloqueado
                if (slot.bloqueado) {
                  return (
                    <Card
                      key={`blq_${index}`}
                      className="rounded-2xl border-dashed border-amber-500/40 bg-amber-500/5 p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold px-3 py-1.5 rounded-xl text-center min-w-[72px]">
                          <span className="text-sm">{slot.horario}</span>
                          <Lock className="size-3 mt-0.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <AlertCircle className="size-3.5" />
                            Horário Bloqueado
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {slot.motivoBloqueio || 'Compromisso pessoal ou folga'}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirNovoAgendamento(slot.horario)}
                        className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
                      >
                        Encaixar mesmo assim
                      </Button>
                    </Card>
                  )
                }

                // Slot Livre / Vago
                return (
                  <div
                    key={`vago_${index}`}
                    className="group flex items-center justify-between p-3.5 px-4 rounded-2xl border border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/5 transition-all duration-150 bg-card/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center font-semibold text-muted-foreground group-hover:text-primary min-w-[72px] text-sm">
                        {slot.horario}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                        Horário livre para teleconsulta ({profAtivo?.duracaoMin || 45} min)
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirNovoAgendamento(slot.horario)}
                      className="rounded-xl text-xs font-medium text-primary hover:bg-primary/10 gap-1 opacity-80 group-hover:opacity-100"
                    >
                      <Plus className="size-3.5" />
                      Agendar neste horário
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. VISUALIZAÇÃO DA SEMANA */}
      {visualizacao === 'semana' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
              const dt = addD(parse(dataSelecionada), offset)
              const dtIso = iso(dt)
              const diaNome = DIAS_SEMANA_NOMES[dt.getDay()]
              const consultasDoDiaSemana = consultasFiltradas.filter((c) => c.data === dtIso)
              const ehHoje = dtIso === hojeIso

              return (
                <Card
                  key={dtIso}
                  className={cn(
                    'rounded-2xl border overflow-hidden flex flex-col',
                    ehHoje ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30' : 'border-border/60 bg-card',
                  )}
                >
                  <CardHeader className="p-3 border-b border-border/40 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {diaNome.slice(0, 3)}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {fmt(dtIso).slice(0, 5)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2.5 flex-1 space-y-2 min-h-[140px]">
                    {consultasDoDiaSemana.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground/60 text-center py-6">
                        Nenhum atendimento
                      </p>
                    ) : (
                      consultasDoDiaSemana.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleEntrarNaSala(c)}
                          className="p-2 rounded-xl bg-background border border-border/80 hover:border-primary/60 cursor-pointer transition-all text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between font-bold text-[11px]">
                            <span className="text-primary">{c.horario}</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                              {c.status}
                            </Badge>
                          </div>
                          <p className="font-semibold text-foreground truncate">{c.residenteNome}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{c.especialidade}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. VISUALIZAÇÃO EM LISTA COMPLETA */}
      {visualizacao === 'lista' && (
        <Card className="rounded-2xl border-border/60 overflow-hidden shadow-xs">
          <CardHeader className="p-4 border-b border-border/40 bg-muted/20">
            <CardTitle className="text-base font-bold text-foreground flex items-center justify-between">
              <span>Todas as Teleconsultas Registradas ({consultasFiltradas.length})</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => abrirNovoAgendamento()}
                className="rounded-xl text-xs gap-1.5"
              >
                <Plus className="size-3.5" />
                Novo Agendamento
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {consultasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CalendarIcon className="size-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhuma consulta encontrada com os filtros atuais.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40 overflow-x-auto">
                {consultasFiltradas.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-xl shrink-0 min-w-[70px]">
                        <div className="text-xs">{fmt(c.data).slice(0, 5)}</div>
                        <div className="text-sm">{c.horario}</div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground text-sm">{c.residenteNome}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {c.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">· {formatarMoeda(c.valor)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {c.profissionalNome} ({c.especialidade})
                          {c.motivo && ` — "${c.motivo}"`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {c.status !== 'concluida' && c.status !== 'cancelada' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirReagendamento(c)}
                            className="rounded-xl text-xs gap-1"
                          >
                            <RefreshCw className="size-3" />
                            Reagendar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirCancelamento(c)}
                            className="rounded-xl text-xs text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="size-4" />
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleEntrarNaSala(c)}
                        className="rounded-xl text-xs font-semibold gap-1.5 shadow-xs"
                      >
                        <Video className="size-3.5" />
                        Sala
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: CONFIGURAÇÃO DE DISPONIBILIDADE E BLOQUEIOS */}
      <Dialog open={modalConfigOpen} onOpenChange={setModalConfigOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings className="size-5 text-primary" />
              Disponibilidade & Agenda de {profAtivo?.nome}
            </DialogTitle>
            <DialogDescription>
              Defina os dias da semana de atendimento, duração das consultas e registre bloqueios de
              férias ou compromissos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Parâmetros Gerais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Duração da Consulta (minutos)</Label>
                <select
                  value={configAgenda.duracaoSlotMin}
                  onChange={(e) =>
                    setConfigAgenda({
                      ...configAgenda,
                      duracaoSlotMin: Number(e.target.value),
                    })
                  }
                  className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs"
                >
                  <option value={30}>30 minutos</option>
                  <option value={40}>40 minutos</option>
                  <option value={45}>45 minutos (Padrão)</option>
                  <option value={50}>50 minutos</option>
                  <option value={60}>60 minutos (1 hora)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Intervalo / Buffer Entre Consultas</Label>
                <select
                  value={configAgenda.intervaloEntreSlotsMin}
                  onChange={(e) =>
                    setConfigAgenda({
                      ...configAgenda,
                      intervaloEntreSlotsMin: Number(e.target.value),
                    })
                  }
                  className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs"
                >
                  <option value={0}>Sem intervalo (0 min)</option>
                  <option value={10}>10 minutos</option>
                  <option value={15}>15 minutos (Recomendado)</option>
                  <option value={20}>20 minutos</option>
                </select>
              </div>
            </div>

            {/* Dias da Semana Ativos */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground">Dias de Atendimento na Semana</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {configAgenda.diasSemana.map((regra, idx) => (
                  <div
                    key={regra.diaSemana}
                    className={cn(
                      'p-3 rounded-2xl border flex items-center justify-between transition-all',
                      regra.ativo
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/60 bg-muted/20 opacity-60',
                    )}
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {DIAS_SEMANA_NOMES[regra.diaSemana]}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {regra.ativo
                          ? `${regra.inicio || '08:00'} às ${regra.fim || '18:00'}`
                          : 'Indisponível'}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant={regra.ativo ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const novosDias = [...configAgenda.diasSemana]
                        novosDias[idx] = { ...regra, ativo: !regra.ativo }
                        setConfigAgenda({ ...configAgenda, diasSemana: novosDias })
                      }}
                      className="rounded-xl text-xs h-7.5 px-3"
                    >
                      {regra.ativo ? 'Ativo' : 'Inativo'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloqueios de Agenda (Férias, atestados, folgas) */}
            <div className="space-y-3 border-t border-border/50 pt-4">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Lock className="size-4 text-amber-500" />
                Bloqueios de Agenda & Folgas
              </h4>

              {/* Form Novo Bloqueio */}
              <div className="p-3.5 bg-muted/40 rounded-2xl border border-border/60 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Adicione uma data em que o profissional estará ausente para impedir agendamentos.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[11px] font-medium">Data do Bloqueio</Label>
                    <Input
                      type="date"
                      value={novoBloqueioData}
                      onChange={(e) => setNovoBloqueioData(e.target.value)}
                      className="h-8.5 text-xs rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-[11px] font-medium">Motivo do Bloqueio</Label>
                    <Input
                      placeholder="Ex: Férias, Congresso, Folga"
                      value={novoBloqueioMotivo}
                      onChange={(e) => setNovoBloqueioMotivo(e.target.value)}
                      className="h-8.5 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novoBloqueioDiaInteiro}
                      onChange={(e) => setNovoBloqueioDiaInteiro(e.target.checked)}
                      className="rounded"
                    />
                    <span>Bloquear o dia inteiro</span>
                  </label>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAdicionarBloqueio}
                    className="h-8 text-xs rounded-xl gap-1 text-primary border-primary/30"
                  >
                    <Plus className="size-3" />
                    Registrar Bloqueio
                  </Button>
                </div>

                {!novoBloqueioDiaInteiro && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                    <div>
                      <Label className="text-[11px] font-medium">Início do Bloqueio</Label>
                      <Input
                        type="time"
                        value={novoBloqueioInicio}
                        onChange={(e) => setNovoBloqueioInicio(e.target.value)}
                        className="h-8.5 text-xs rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium">Fim do Bloqueio</Label>
                      <Input
                        type="time"
                        value={novoBloqueioFim}
                        onChange={(e) => setNovoBloqueioFim(e.target.value)}
                        className="h-8.5 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de Bloqueios Registrados */}
              {configAgenda.bloqueios && configAgenda.bloqueios.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {configAgenda.bloqueios.map((b) => (
                    <div
                      key={b.id}
                      className="p-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-amber-900 dark:text-amber-200">
                          {fmt(b.data)}
                        </span>
                        <span className="text-muted-foreground ml-2">— {b.motivo}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoverBloqueio(b.id)}
                        className="size-6 text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Remover bloqueio"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setModalConfigOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvarConfiguracao} className="rounded-xl shadow-xs">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: NOVO AGENDAMENTO / ENCAIXE DIRETO NA AGENDA */}
      <Dialog open={modalNovoAgendamentoOpen} onOpenChange={setModalNovoAgendamentoOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarPlus className="size-5 text-primary" />
              Novo Agendamento na Agenda
            </DialogTitle>
            <DialogDescription>
              Marque uma teleconsulta para um residente diretamente na grade de horários de {profAtivo?.nome}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Residente Atendido</Label>
              <SearchableSelect
                placeholder="Selecione o residente da ILPI"
                value={novoResidenteId}
                onValueChange={setNovoResidenteId}
                options={residentes
                  .filter((r) => r.status !== 'obito')
                  .map((r) => ({
                    value: r.id,
                    label: `${r.nome} (${r.quarto ? `Quarto ${r.quarto}` : 'Acolhido'})`,
                  }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Data</Label>
                <Input
                  type="date"
                  value={novoData}
                  onChange={(e) => setNovoData(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Horário</Label>
                <Input
                  type="time"
                  value={novoHorario}
                  onChange={(e) => setNovoHorario(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo Clínico / Encaminhamento</Label>
              <Input
                placeholder="Ex: Avaliação de lesão por pressão, ajuste de dieta, polifarmácia"
                value={novoMotivo}
                onChange={(e) => setNovoMotivo(e.target.value)}
                className="rounded-xl text-xs h-9"
              />
            </div>

            <div className="p-3.5 bg-muted/40 rounded-2xl border border-border/60 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-foreground">Valor da Teleconsulta</p>
                <p className="text-muted-foreground">{profAtivo?.especialidadeLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-primary">
                  {formatarMoeda(profAtivo?.preco || 180)}
                </p>
                <p className="text-[10px] text-muted-foreground">Split Mercado Pago 80/20</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setModalNovoAgendamentoOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvarNovoAgendamento} className="rounded-xl shadow-xs">
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: REAGENDAMENTO */}
      <Dialog open={modalReagendamentoOpen} onOpenChange={setModalReagendamentoOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <RefreshCw className="size-5 text-primary" />
              Reagendar Teleconsulta
            </DialogTitle>
            <DialogDescription>
              Selecione a nova data e horário para a consulta de {consultaSelecionada?.residenteNome}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/30 rounded-2xl border border-border/50 text-xs">
              <p className="text-muted-foreground">Horário Original:</p>
              <p className="font-bold text-foreground mt-0.5">
                {fmt(consultaSelecionada?.data)} às {consultaSelecionada?.horario}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nova Data</Label>
                <Input
                  type="date"
                  value={reagendarData}
                  onChange={(e) => setReagendarData(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Novo Horário</Label>
                <Input
                  type="time"
                  value={reagendarHorario}
                  onChange={(e) => setReagendarHorario(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setModalReagendamentoOpen(false)}
              className="rounded-xl"
            >
              Voltar
            </Button>
            <Button onClick={handleConfirmarReagendamento} className="rounded-xl shadow-xs">
              Salvar Novo Horário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: CANCELAMENTO COM JUSTIFICATIVA */}
      <Dialog open={modalCancelamentoOpen} onOpenChange={setModalCancelamentoOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <XCircle className="size-5" />
              Cancelar Teleconsulta
            </DialogTitle>
            <DialogDescription>
              A consulta será cancelada e o horário será imediatamente liberado na agenda do especialista.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 text-xs">
              Paciente: <strong>{consultaSelecionada?.residenteNome}</strong> · Data:{' '}
              <strong>
                {fmt(consultaSelecionada?.data)} às {consultaSelecionada?.horario}
              </strong>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Justificativa do Cancelamento *</Label>
              <Input
                placeholder="Ex: Residente internado externamente, família solicitou reagendamento"
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                className="rounded-xl text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setModalCancelamentoOpen(false)}
              className="rounded-xl"
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmarCancelamento}
              className="rounded-xl shadow-xs"
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: SALA VIRTUAL DE TELECONSULTA DIRETO DA AGENDA */}
      <Dialog open={modalSalaVirtualOpen} onOpenChange={setModalSalaVirtualOpen}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden rounded-3xl flex flex-col bg-slate-950 text-white">
          <div className="p-3.5 px-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Video className="size-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Teleconsulta: {consultaSelecionada?.residenteNome}
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    Criptografia P2P WebRTC
                  </Badge>
                </h4>
                <p className="text-xs text-slate-400">
                  {consultaSelecionada?.profissionalNome} · {consultaSelecionada?.especialidade}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 text-xs bg-slate-800 text-white border-slate-700 hover:bg-slate-700 rounded-xl gap-1.5"
              >
                <a
                  href={consultaSelecionada?.linkSala || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-3.5" />
                  Abrir em Nova Guia
                </a>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModalSalaVirtualOpen(false)}
                className="size-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 w-full h-full bg-black relative">
            {consultaSelecionada?.linkSala && (
              <iframe
                src={buildJitsiUrl(consultaSelecionada.linkSala, profissional?.nome || 'Especialista')}
                title="Sala de Teleconsulta"
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
