import { useMemo, useState } from 'react'
import { CATS, COD, SETORES } from '../lib/constants'
import { mesKey, diasNoMes, fmt, iso } from '../lib/business/dates'
import { useAuth } from '../contexts/AuthContext'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { can } from '../lib/permissions'
import { supabase } from '../lib/supabase'
import { Avatar, EmptyState, PageHeader } from '../components/Ui'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
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
  Award,
  Calendar,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  GraduationCap,
  Lock,
  Plus,
  Power,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Categoria, Profissional } from '../types/ilpi'

const hoje = new Date()
const MK_ATUAL = mesKey(hoje)
const diaAtual = hoje.getDate()

export default function Equipe() {
  const { profissional } = useAuth()
  const { equipe, escalaMes, treinamentos, refresh } = useIlpiData()

  const [abaAtiva, setAbaAtiva] = useState<'diretorio' | 'escala' | 'treinamentos'>('diretorio')
  const [busca, setBusca] = useState('')
  const [filtroCat, setFiltroCat] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('ativos')

  // Month state for the schedule grid
  const [mesGrade, setMesGrade] = useState<string>(MK_ATUAL)
  const numDiasMes = useMemo(() => diasNoMes(mesGrade), [mesGrade])

  const podeGerir = profissional ? can(profissional.cat, 'gerir') : false

  // Colaboradores em plantão hoje
  const emPlantaoHoje = useMemo(() => {
    return equipe.filter((p) => {
      if (p.ativo === false) return false
      const cod = escalaMes[MK_ATUAL]?.[p.id]?.[diaAtual - 1]
      return cod && ['D', 'N', 'M', 'T', 'EX'].includes(cod)
    })
  }, [equipe, escalaMes])

  // Filtragem do diretório
  const equipeFiltrada = useMemo(() => {
    return equipe.filter((p) => {
      if (filtroStatus === 'ativos' && p.ativo === false) return false
      if (filtroStatus === 'inativos' && p.ativo !== false) return false

      if (busca.trim()) {
        const q = busca.toLowerCase()
        const matchNome = p.nome.toLowerCase().includes(q)
        const matchFuncao = (p.funcao ?? '').toLowerCase().includes(q)
        const matchConselho = (p.conselho ?? '').toLowerCase().includes(q)
        if (!matchNome && !matchFuncao && !matchConselho) return false
      }

      if (filtroCat !== 'todos' && p.cat !== filtroCat) {
        return false
      }
      return true
    })
  }, [equipe, busca, filtroCat, filtroStatus])

  // Dialog State: Novo / Editar Colaborador
  const [dialogColabOpen, setDialogColabOpen] = useState(false)
  const [colabEditando, setColabEditando] = useState<Profissional | null>(null)
  const [salvandoColab, setSalvandoColab] = useState(false)
  const [colabNome, setColabNome] = useState('')
  const [colabCat, setColabCat] = useState<Categoria>('cuid')
  const [colabFuncao, setColabFuncao] = useState('')
  const [colabConselho, setColabConselho] = useState('')
  const [colabSetor, setColabSetor] = useState('Diurno 12h')
  const [colabArea, setColabArea] = useState('')
  const [colabCarga, setColabCarga] = useState('12x36')
  const [colabHorario, setColabHorario] = useState('07:00 às 19:00')

  // Dialog State: Editar Escala do Dia
  const [dialogEscalaOpen, setDialogEscalaOpen] = useState(false)
  const [escalaAlvo, setEscalaAlvo] = useState<{
    prof: Profissional
    diaIndex: number
    codigoAtual: string
  } | null>(null)
  const [salvandoEscala, setSalvandoEscala] = useState(false)

  // Dialog State: Novo Treinamento
  const [dialogTreinamentoOpen, setDialogTreinamentoOpen] = useState(false)
  const [salvandoTreinamento, setSalvandoTreinamento] = useState(false)
  const [treinTema, setTreinTema] = useState('')
  const [treinData, setTreinData] = useState(iso(new Date()))
  const [treinPresentes, setTreinPresentes] = useState<string[]>([])

  if (!profissional) return null

  function abrirNovoColaborador() {
    setColabEditando(null)
    setColabNome('')
    setColabCat('cuid')
    setColabFuncao('Cuidador(a) de Idosos')
    setColabConselho('')
    setColabSetor('Diurno 12h')
    setColabArea('')
    setColabCarga('12x36')
    setColabHorario('07:00 às 19:00')
    setDialogColabOpen(true)
  }

  function abrirEditarColaborador(p: Profissional) {
    setColabEditando(p)
    setColabNome(p.nome)
    setColabCat(p.cat)
    setColabFuncao(p.funcao ?? '')
    setColabConselho(p.conselho ?? '')
    setColabSetor(p.setor ?? 'Diurno 12h')
    setColabArea(p.area ?? '')
    setColabCarga(p.carga ?? '12x36')
    setColabHorario(p.horario ?? '07:00 às 19:00')
    setDialogColabOpen(true)
  }

  async function handleSalvarColaborador() {
    if (!colabNome.trim()) {
      toast.error('Informe o nome do colaborador.')
      return
    }
    if (!colabFuncao.trim()) {
      toast.error('Informe a função do colaborador.')
      return
    }

    setSalvandoColab(true)

    if (colabEditando) {
      // UPDATE
      const { error } = await supabase
        .from('profissionais')
        .update({
          nome: colabNome.trim(),
          categoria: colabCat,
          funcao: colabFuncao.trim(),
          conselho: colabConselho.trim() || null,
          setor: colabSetor || null,
          area: colabArea || null,
          carga: colabCarga.trim() || null,
          horario: colabHorario.trim() || null,
        })
        .eq('id', colabEditando.id)

      setSalvandoColab(false)
      if (error) {
        toast.error(`Erro ao atualizar colaborador: ${error.message}`)
        return
      }
      toast.success('Cadastro do colaborador atualizado com sucesso!')
    } else {
      // INSERT
      const novoId = `p_${Date.now()}`
      const { error } = await supabase.from('profissionais').insert({
        id: novoId,
        nome: colabNome.trim(),
        categoria: colabCat,
        funcao: colabFuncao.trim(),
        conselho: colabConselho.trim() || null,
        setor: colabSetor || null,
        area: colabArea || null,
        carga: colabCarga.trim() || null,
        horario: colabHorario.trim() || null,
        ativo: true,
      })

      setSalvandoColab(false)
      if (error) {
        toast.error(`Erro ao cadastrar colaborador: ${error.message}`)
        return
      }

      // Initialize default empty schedule for the current month
      const codigosVazios = Array(numDiasMes).fill('F')
      await supabase.from('escalas_mes').upsert(
        {
          mes: mesGrade,
          profissional_id: novoId,
          codigos: codigosVazios,
        },
        { onConflict: 'mes,profissional_id' }
      )

      toast.success('Novo colaborador cadastrado com sucesso!')
    }

    setDialogColabOpen(false)
    await refresh()
  }

  async function handleToggleStatusColaborador(p: Profissional) {
    const novoStatus = !(p.ativo !== false)
    const { error } = await supabase
      .from('profissionais')
      .update({ ativo: novoStatus })
      .eq('id', p.id)

    if (error) {
      toast.error(`Erro ao alterar status: ${error.message}`)
      return
    }

    toast.success(
      novoStatus
        ? `Colaborador ${p.nome} reativado na equipe!`
        : `Colaborador ${p.nome} desativado.`
    )
    await refresh()
  }

  function abrirEdicaoEscala(prof: Profissional, diaIndex: number) {
    if (!podeGerir) {
      toast.error('Edição de escalas restrita à RT e coordenação.')
      return
    }
    const escalaDoMes = escalaMes[mesGrade]?.[prof.id] ?? []
    const codigoAtual = escalaDoMes[diaIndex] ?? 'F'
    setEscalaAlvo({ prof, diaIndex, codigoAtual })
    setDialogEscalaOpen(true)
  }

  async function handleDefinirCodigoEscala(codigo: string) {
    if (!escalaAlvo) return
    const { prof, diaIndex } = escalaAlvo

    setSalvandoEscala(true)
    const escalaDoMes = [...(escalaMes[mesGrade]?.[prof.id] ?? [])]
    while (escalaDoMes.length < numDiasMes) {
      escalaDoMes.push('F')
    }
    escalaDoMes[diaIndex] = codigo

    const { error } = await supabase.from('escalas_mes').upsert(
      {
        mes: mesGrade,
        profissional_id: prof.id,
        codigos: escalaDoMes,
      },
      { onConflict: 'mes,profissional_id' }
    )

    setSalvandoEscala(false)

    if (error) {
      toast.error(`Erro ao salvar escala: ${error.message}`)
      return
    }

    toast.success(`Plantão atualizado para o dia ${diaIndex + 1}: ${codigo}`)
    setDialogEscalaOpen(false)
    await refresh()
  }

  async function handlePreencherPadrao12x36(prof: Profissional, tipo: 'D' | 'N') {
    if (!podeGerir) return
    const escala = Array(numDiasMes).fill('F')
    for (let i = 0; i < numDiasMes; i += 2) {
      escala[i] = tipo
    }

    const { error } = await supabase.from('escalas_mes').upsert(
      {
        mes: mesGrade,
        profissional_id: prof.id,
        codigos: escala,
      },
      { onConflict: 'mes,profissional_id' }
    )

    if (error) {
      toast.error(`Erro ao aplicar padrão 12x36: ${error.message}`)
      return
    }

    toast.success(`Escala 12x36 (${tipo === 'D' ? 'Diurno' : 'Noturno'}) aplicada para ${prof.nome}!`)
    await refresh()
  }

  async function handleSalvarTreinamento() {
    if (!treinTema.trim()) {
      toast.error('Informe o tema do treinamento.')
      return
    }
    if (!treinData) {
      toast.error('Informe a data da realização.')
      return
    }

    setSalvandoTreinamento(true)
    const id = `tre_${Date.now()}`
    const { error } = await supabase.from('treinamentos').insert({
      id,
      tema: treinTema.trim(),
      data: treinData,
      presentes: treinPresentes,
    })
    setSalvandoTreinamento(false)

    if (error) {
      toast.error(`Erro ao registrar treinamento: ${error.message}`)
      return
    }

    toast.success('Treinamento continuado registrado com sucesso!')
    setTreinTema('')
    setTreinPresentes([])
    setDialogTreinamentoOpen(false)
    await refresh()
  }

  function alternarPresenteTreinamento(profId: string) {
    setTreinPresentes((prev) =>
      prev.includes(profId) ? prev.filter((id) => id !== profId) : [...prev, profId]
    )
  }

  function navegarMes(offset: number) {
    const [ano, mes] = mesGrade.split('-').map(Number)
    const d = new Date(ano, mes - 1 + offset, 1)
    setMesGrade(mesKey(d))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Quadro de Equipe & Escalas"
          lede="Gestão de profissionais, escala de plantões, cobertura de enfermagem e treinamentos continuados."
          badge={
            <Badge variant="secondary" className="font-semibold text-xs">
              {emPlantaoHoje.length} em plantão hoje
            </Badge>
          }
        />

        {podeGerir && (
          <Button
            onClick={abrirNovoColaborador}
            className="rounded-xl gap-1.5 self-start sm:self-auto bg-primary text-primary-foreground shadow-xs"
          >
            <UserPlus className="size-4" /> Novo Colaborador
          </Button>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Plantão de Hoje
              </span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {emPlantaoHoje.length}
              </span>
            </div>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <UserCheck className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Colaboradores Ativos
              </span>
              <span className="text-xl font-bold text-foreground">
                {equipe.filter((p) => p.ativo !== false).length}
              </span>
            </div>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Corpo de Enfermagem
              </span>
              <span className="text-xl font-bold text-foreground">
                {equipe.filter((p) => ['rt', 'enf', 'tec', 'estag'].includes(p.cat) && p.ativo !== false).length}
              </span>
            </div>
            <div className="size-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Treinamentos ANVISA
              </span>
              <span className="text-xl font-bold text-foreground">{treinamentos.length}</span>
            </div>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <GraduationCap className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs
        value={abaAtiva}
        onValueChange={(v) => setAbaAtiva(v as 'diretorio' | 'escala' | 'treinamentos')}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-2">
          <TabsList className="bg-muted/70 p-1 rounded-xl">
            <TabsTrigger value="diretorio" className="rounded-lg text-xs font-semibold gap-1.5">
              <Users className="size-3.5" /> Quadro & Diretório
            </TabsTrigger>
            <TabsTrigger value="escala" className="rounded-lg text-xs font-semibold gap-1.5">
              <CalendarDays className="size-3.5" /> Grade Mensal de Plantões
            </TabsTrigger>
            <TabsTrigger value="treinamentos" className="rounded-lg text-xs font-semibold gap-1.5">
              <Award className="size-3.5" /> Treinamentos Continuados
            </TabsTrigger>
          </TabsList>

          {abaAtiva === 'escala' && (
            <div className="flex items-center gap-2 self-start sm:self-auto bg-card border border-border/70 p-1 rounded-xl shadow-2xs">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => navegarMes(-1)}
                title="Mês anterior"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-xs font-bold px-2 font-mono">
                {mesGrade}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => navegarMes(1)}
                title="Próximo mês"
              >
                <ChevronRight className="size-3.5" />
              </Button>
              {mesGrade !== MK_ATUAL && (
                <Button
                  variant="outline"
                  size="xs"
                  className="h-6 text-[11px] ml-1"
                  onClick={() => setMesGrade(MK_ATUAL)}
                >
                  Mês Atual
                </Button>
              )}
            </div>
          )}

          {abaAtiva === 'treinamentos' && podeGerir && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTreinTema('')
                setTreinData(iso(new Date()))
                setTreinPresentes([])
                setDialogTreinamentoOpen(true)
              }}
              className="rounded-xl gap-1 text-xs h-8"
            >
              <Plus className="size-3.5" /> Novo Treinamento
            </Button>
          )}
        </div>

        {/* TAB 1: Diretório de Profissionais */}
        <TabsContent value="diretorio" className="space-y-6">
          {/* Quem Está em Plantão Hoje */}
          <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
              <div className="flex items-center gap-2">
                <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-bold font-heading">
                  Profissionais em Plantão Hoje (Dia {diaAtual})
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25">
                {emPlantaoHoje.length} ativos hoje
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              {emPlantaoHoje.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {emPlantaoHoje.map((p) => {
                    const cod = escalaMes[MK_ATUAL]?.[p.id]?.[diaAtual - 1] ?? ''
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/15 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar r={p} size="sm" />
                          <div className="min-w-0">
                            <span className="font-bold text-foreground text-xs block truncate">
                              {p.nome}
                            </span>
                            <span className="text-[11px] text-muted-foreground block truncate">
                              {CATS[p.cat]} · {p.funcao}
                            </span>
                          </div>
                        </div>
                        {cod && (
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs font-bold px-2 py-0.5 shrink-0"
                            title={COD[cod]}
                          >
                            {cod} · {COD[cod] || cod}
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState title="Nenhum plantonista hoje">
                  Não há códigos de plantão registrados na escala para o dia de hoje.
                </EmptyState>
              )}
            </CardContent>
          </Card>

          {/* Diretório Geral de Profissionais */}
          <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40 bg-muted/20 px-5 pt-4">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <CardTitle className="text-sm font-bold font-heading">
                  Diretório da Equipe ({equipeFiltrada.length})
                </CardTitle>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar profissional..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-xl bg-background w-44 sm:w-52"
                  />
                </div>

                <div className="flex items-center gap-1 p-0.5 bg-muted/60 rounded-xl border border-border/40 text-xs">
                  <button
                    type="button"
                    onClick={() => setFiltroCat('todos')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg font-medium transition-all',
                      filtroCat === 'todos' ? 'bg-card text-foreground shadow-2xs font-bold' : 'text-muted-foreground'
                    )}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroCat('enf')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg font-medium transition-all',
                      filtroCat === 'enf' ? 'bg-card text-foreground shadow-2xs font-bold' : 'text-muted-foreground'
                    )}
                  >
                    Enfermagem
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroCat('cuid')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg font-medium transition-all',
                      filtroCat === 'cuid' ? 'bg-card text-foreground shadow-2xs font-bold' : 'text-muted-foreground'
                    )}
                  >
                    Cuidadores
                  </button>
                </div>

                <div className="flex items-center gap-1 p-0.5 bg-muted/60 rounded-xl border border-border/40 text-xs">
                  <button
                    type="button"
                    onClick={() => setFiltroStatus('ativos')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg font-medium transition-all',
                      filtroStatus === 'ativos' ? 'bg-card text-foreground shadow-2xs font-bold' : 'text-muted-foreground'
                    )}
                  >
                    Ativos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroStatus('inativos')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg font-medium transition-all',
                      filtroStatus === 'inativos' ? 'bg-card text-foreground shadow-2xs font-bold' : 'text-muted-foreground'
                    )}
                  >
                    Inativos
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {equipeFiltrada.map((p) => {
                  const isInativo = p.ativo === false
                  const codHoje = escalaMes[MK_ATUAL]?.[p.id]?.[diaAtual - 1]

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'flex flex-col justify-between p-4 rounded-xl border transition-all shadow-2xs space-y-3',
                        isInativo
                          ? 'border-border/40 bg-muted/20 opacity-70'
                          : 'border-border/60 bg-card hover:bg-muted/10'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar r={p} size="" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground text-sm block truncate">
                                {p.nome}
                              </span>
                              {isInativo && (
                                <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 uppercase">
                                  Inativo
                                </Badge>
                              )}
                            </div>
                            <span className="text-muted-foreground block truncate text-xs">
                              {p.funcao ?? CATS[p.cat]}
                            </span>
                            {p.conselho && (
                              <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 block truncate">
                                {p.conselho}
                              </span>
                            )}
                          </div>
                        </div>

                        {codHoje && !isInativo && (
                          <Badge variant="outline" className="text-[10px] font-mono font-bold shrink-0">
                            {codHoje}
                          </Badge>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                        <div>
                          <span className="block text-[10px] text-muted-foreground/80">Setor/Área:</span>
                          <span className="font-medium text-foreground truncate block">
                            {[p.setor, p.area].filter(Boolean).join(' · ') || 'Geral'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-muted-foreground/80">Carga / Horário:</span>
                          <span className="font-medium text-foreground truncate block">
                            {p.carga || '–'} ({p.horario || '–'})
                          </span>
                        </div>
                      </div>

                      {podeGerir && (
                        <div className="pt-2 border-t border-border/30 flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => abrirEditarColaborador(p)}
                            className="h-7 text-xs gap-1"
                          >
                            <Edit className="size-3" /> Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleToggleStatusColaborador(p)}
                            className={cn(
                              'h-7 text-xs gap-1',
                              isInativo
                                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10'
                                : 'text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10'
                            )}
                          >
                            <Power className="size-3" />
                            {isInativo ? 'Reativar' : 'Desativar'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {!podeGerir && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground">
                  <Lock className="size-4 shrink-0 text-muted-foreground" />
                  <span>Edição e cadastro de profissionais restritos a RT e coordenação.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Grade Mensal de Plantões */}
        <TabsContent value="escala" className="space-y-4">
          <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
              <div>
                <CardTitle className="text-sm font-bold font-heading flex items-center gap-2">
                  <Calendar className="size-4 text-primary" />
                  Grade de Escala — {mesGrade}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  Clique na célula do dia para alterar o código do plantonista. Legenda: D (Dia 12h), N (Noite 12h), M (Manhã), T (Tarde), F (Folga), FE (Férias).
                </span>
              </div>

              {podeGerir && (
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Modo Edição Ativo
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground">
                    <th className="p-3 sticky left-0 bg-muted/90 backdrop-blur-xs font-bold text-foreground min-w-[180px] z-10 border-r border-border/40">
                      Colaborador
                    </th>
                    {Array.from({ length: numDiasMes }, (_, i) => i + 1).map((diaNum) => (
                      <th
                        key={diaNum}
                        className={cn(
                          'p-2 text-center font-mono font-bold min-w-[34px] border-r border-border/30',
                          mesGrade === MK_ATUAL && diaNum === diaAtual && 'bg-primary/15 text-primary'
                        )}
                      >
                        {diaNum}
                      </th>
                    ))}
                    {podeGerir && <th className="p-3 text-center min-w-[120px]">Ações Rápidas</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {equipe
                    .filter((p) => p.ativo !== false)
                    .map((p) => {
                      const escala = escalaMes[mesGrade]?.[p.id] ?? []

                      return (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 sticky left-0 bg-card/95 backdrop-blur-xs font-semibold text-foreground z-10 border-r border-border/40">
                            <div className="flex items-center gap-2">
                              <span className="truncate">{p.nome}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                ({p.cat.toUpperCase()})
                              </span>
                            </div>
                          </td>

                          {Array.from({ length: numDiasMes }, (_, i) => i).map((diaIdx) => {
                            const cod = escala[diaIdx] ?? 'F'

                            return (
                              <td
                                key={diaIdx}
                                onClick={() => podeGerir && abrirEdicaoEscala(p, diaIdx)}
                                className={cn(
                                  'p-1 text-center font-mono font-bold text-xs border-r border-border/30 transition-colors select-none',
                                  podeGerir && 'cursor-pointer hover:bg-primary/20',
                                  mesGrade === MK_ATUAL && diaIdx + 1 === diaAtual && 'ring-1 ring-primary/40',
                                  cod === 'D' && 'bg-teal-500/15 text-teal-700 dark:text-teal-300',
                                  cod === 'N' && 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
                                  cod === 'M' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                                  cod === 'T' && 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
                                  cod === 'F' && 'text-muted-foreground/60',
                                  cod === 'FE' && 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                                )}
                                title={`Dia ${diaIdx + 1}: ${COD[cod] || cod}`}
                              >
                                {cod}
                              </td>
                            )
                          })}

                          {podeGerir && (
                            <td className="p-2 text-center space-x-1">
                              <Button
                                variant="outline"
                                size="xs"
                                className="h-6 text-[10px] px-1.5"
                                onClick={() => handlePreencherPadrao12x36(p, 'D')}
                                title="Preencher dia sim / dia não (Diurno 12h)"
                              >
                                12x36 D
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                className="h-6 text-[10px] px-1.5"
                                onClick={() => handlePreencherPadrao12x36(p, 'N')}
                                title="Preencher dia sim / dia não (Noturno 12h)"
                              >
                                12x36 N
                              </Button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Treinamentos & Educação Continuada */}
        <TabsContent value="treinamentos" className="space-y-4">
          <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-amber-500" />
                <CardTitle className="text-sm font-bold font-heading">
                  Educação Continuada & Treinamentos Obrigatórios (RDC 502)
                </CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">
                {treinamentos.length} treinamentos registrados
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              {treinamentos.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {[...treinamentos]
                    .reverse()
                    .map((t) => {
                      const presentesNomes = (t.presentes ?? [])
                        .map((id) => equipe.find((x) => x.id === id)?.nome ?? id)

                      return (
                        <div
                          key={t.id}
                          className="p-4 rounded-xl border border-border/60 bg-card space-y-2.5 text-xs shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="font-bold text-foreground text-sm block">
                                {t.tema}
                              </span>
                              <span className="text-muted-foreground text-[11px] flex items-center gap-1.5 mt-0.5">
                                <Clock className="size-3" /> Data: {fmt(t.data)}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[10px] shrink-0 bg-primary/10 text-primary border-primary/25">
                              {(t.presentes ?? []).length} presentes
                            </Badge>
                          </div>

                          <div className="pt-2 border-t border-border/40">
                            <span className="text-[10px] text-muted-foreground block mb-1">
                              Lista de Colaboradores Participantes:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {presentesNomes.map((nome, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium text-foreground"
                                >
                                  {nome}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <EmptyState title="Sem registros de treinamentos">
                  Nenhum treinamento continuado registrado. Clique em &quot;Novo Treinamento&quot; para cadastrar.
                </EmptyState>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Novo / Editar Colaborador */}
      <Dialog open={dialogColabOpen} onOpenChange={setDialogColabOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              {colabEditando ? 'Editar Colaborador' : 'Novo Colaborador'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados do profissional para compor o corpo técnico da ILPI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome Completo *</Label>
              <Input
                placeholder="ex: Maria da Silva"
                value={colabNome}
                onChange={(e) => setColabNome(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria *</Label>
                <Select
                  value={colabCat}
                  onValueChange={(val: Categoria) => setColabCat(val)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Cargo / Função *</Label>
                <Input
                  placeholder="ex: Cuidador(a) de Idosos"
                  value={colabFuncao}
                  onChange={(e) => setColabFuncao(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Conselho de Classe / Registro</Label>
                <Input
                  placeholder="ex: COREN-SP 123456-TE"
                  value={colabConselho}
                  onChange={(e) => setColabConselho(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Setor de Atuação</Label>
                <Select
                  value={colabSetor}
                  onValueChange={(val) => setColabSetor(val)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {SETORES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Carga Horária</Label>
                <Input
                  placeholder="ex: 12x36 ou 44h"
                  value={colabCarga}
                  onChange={(e) => setColabCarga(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Horário Habitual</Label>
                <Input
                  placeholder="ex: 07:00 às 19:00"
                  value={colabHorario}
                  onChange={(e) => setColabHorario(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogColabOpen(false)}
              disabled={salvandoColab}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarColaborador}
              disabled={salvandoColab}
            >
              {salvandoColab ? 'Salvando...' : colabEditando ? 'Atualizar Dados' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Alterar Código de Escala */}
      <Dialog open={dialogEscalaOpen} onOpenChange={setDialogEscalaOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Alterar Plantão — Dia {(escalaAlvo?.diaIndex ?? 0) + 1}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Profissional: <strong>{escalaAlvo?.prof.nome}</strong> ({mesGrade})
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 py-3">
            {Object.entries(COD).map(([cod, desc]) => (
              <button
                key={cod}
                type="button"
                onClick={() => handleDefinirCodigoEscala(cod)}
                disabled={salvandoEscala}
                className={cn(
                  'p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between',
                  escalaAlvo?.codigoAtual === cod
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border/60 hover:bg-muted/40 text-foreground'
                )}
              >
                <div>
                  <span className="font-mono font-bold block">{cod}</span>
                  <span className="text-[10px] text-muted-foreground block truncate">{desc}</span>
                </div>
                {escalaAlvo?.codigoAtual === cod && <Check className="size-3.5" />}
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogEscalaOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Novo Treinamento */}
      <Dialog open={dialogTreinamentoOpen} onOpenChange={setDialogTreinamentoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="size-5 text-amber-500" />
              Registrar Treinamento Continuado
            </DialogTitle>
            <DialogDescription className="text-xs">
              Conformidade RDC 502/2021 — Capacitação periódica dos recursos humanos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Tema da Capacitação *</Label>
              <Input
                placeholder="ex: Prevenção de Quedas e Transferência Segura"
                value={treinTema}
                onChange={(e) => setTreinTema(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Data de Realização *</Label>
              <Input
                type="date"
                value={treinData}
                onChange={(e) => setTreinData(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Colaboradores Presentes ({treinPresentes.length})</Label>
                <button
                  type="button"
                  onClick={() =>
                    setTreinPresentes(
                      treinPresentes.length === equipe.length ? [] : equipe.map((p) => p.id)
                    )
                  }
                  className="text-[11px] text-primary hover:underline"
                >
                  {treinPresentes.length === equipe.length ? 'Desmarcar todos' : 'Marcar todos'}
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 border border-border/60 rounded-xl p-2 bg-muted/20">
                {equipe
                  .filter((p) => p.ativo !== false)
                  .map((p) => {
                    const sel = treinPresentes.includes(p.id)
                    return (
                      <div
                        key={p.id}
                        onClick={() => alternarPresenteTreinamento(p.id)}
                        className={cn(
                          'p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors',
                          sel
                            ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                            : 'bg-card border-border/40 text-foreground hover:bg-muted/40'
                        )}
                      >
                        <span>{p.nome} ({p.funcao})</span>
                        {sel && <Check className="size-3.5" />}
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogTreinamentoOpen(false)}
              disabled={salvandoTreinamento}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarTreinamento}
              disabled={salvandoTreinamento}
            >
              {salvandoTreinamento ? 'Salvando...' : 'Salvar Treinamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
