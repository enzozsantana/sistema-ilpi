import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { iso, addD, parse, fmt, agoraHM } from '../lib/business/dates'
import { DIAS } from '../lib/constants'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { EmptyState, PageHeader, StatusBadge } from '../components/Ui'
import { SecaoPops } from '../components/SecaoPops'
import { PlanGate } from '../components/PlanGate'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Progress } from '../components/ui/progress'
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
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListChecks,
  Plus,
  ShieldCheck,
  ThermometerSnowflake,
  Trash2,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { TemperaturaGeladeira } from '../types/ilpi'

export default function Rotinas() {
  const { temperaturas, tarefas, tarefasFeitas, equipe, profissionalPorId, pops, refresh } = useIlpiData()
  const { profissional } = useAuth()

  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [abaAtiva, setAbaAtiva] = useState<'todas' | 'rotinas' | 'geladeira' | 'pops'>(
    tabParam === 'pops' ? 'pops' : tabParam === 'geladeira' ? 'geladeira' : tabParam === 'rotinas' ? 'rotinas' : 'todas'
  )

  function mudarAba(novaAba: 'todas' | 'rotinas' | 'geladeira' | 'pops') {
    setAbaAtiva(novaAba)
    if (novaAba === 'todas') {
      searchParams.delete('tab')
      setSearchParams(searchParams, { replace: true })
    } else {
      setSearchParams({ tab: novaAba }, { replace: true })
    }
  }

  const hojeIso = useMemo(() => iso(new Date()), [])
  const [dataSel, setDataSel] = useState<string>(hojeIso)
  const isHoje = dataSel === hojeIso

  // Day of the week for the selected date (0 = Dom, 6 = Sáb)
  const diaSemana = useMemo(() => parse(dataSel).getDay(), [dataSel])

  // Temperatures for selected date
  const leiturasDia = useMemo(
    () => temperaturas.filter((x) => x.d === dataSel),
    [temperaturas, dataSel]
  )
  const leituraManha = leiturasDia.find((x) => x.turno === 'manha')
  const leituraNoite = leiturasDia.find((x) => x.turno === 'noite')

  // Tasks for selected date
  const [modoTarefas, setModoTarefas] = useState<'dia' | 'todas'>('dia')
  const tarefasHoje = useMemo(
    () => tarefas.filter((t) => t.dias.includes(diaSemana)),
    [tarefas, diaSemana]
  )

  // Optimistic tracking for completed tasks
  const [localFeitas, setLocalFeitas] = useState<Record<string, string[]>>({})
  const feitas = localFeitas[dataSel] ?? tarefasFeitas[dataSel] ?? []

  const concluidasCount = tarefasHoje.filter((t) => feitas.includes(t.id)).length
  const progressoTarefas = tarefasHoje.length
    ? Math.round((concluidasCount / tarefasHoje.length) * 100)
    : 100

  // Dialog State: Registrar Temperatura
  const [dialogTempOpen, setDialogTempOpen] = useState(false)
  const [salvandoTemp, setSalvandoTemp] = useState(false)
  const [tempTurno, setTempTurno] = useState<'manha' | 'noite'>('manha')
  const [tempHora, setTempHora] = useState<string>(agoraHM())
  const [tempMomento, setTempMomento] = useState<string>('4.5')
  const [tempMin, setTempMin] = useState<string>('3.5')
  const [tempMax, setTempMax] = useState<string>('5.5')
  const [tempAmbiente, setTempAmbiente] = useState<string>('24.0')

  // Dialog State: Nova Tarefa
  const [dialogTarefaOpen, setDialogTarefaOpen] = useState(false)
  const [salvandoTarefa, setSalvandoTarefa] = useState(false)
  const [novaTarefaDesc, setNovaTarefaDesc] = useState('')
  const [novaTarefaResp, setNovaTarefaResp] = useState<string>('todos')
  const [novaTarefaDias, setNovaTarefaDias] = useState<number[]>([1, 2, 3, 4, 5]) // Seg a Sex

  // Dialog State: Exclusão
  const [tempParaExcluir, setTempParaExcluir] = useState<TemperaturaGeladeira | null>(null)
  const [tarefaParaExcluir, setTarefaParaExcluir] = useState<{ id: string; desc: string } | null>(null)

  function navegarData(dias: number) {
    const nova = iso(addD(dataSel, dias))
    setDataSel(nova)
  }

  function abrirRegistroTemp(turnoPref?: 'manha' | 'noite') {
    const t = turnoPref ?? (new Date().getHours() < 14 ? 'manha' : 'noite')
    setTempTurno(t)
    setTempHora(agoraHM())
    setTempMomento('4.5')
    setTempMin('3.5')
    setTempMax('5.5')
    setTempAmbiente('24.0')
    setDialogTempOpen(true)
  }

  async function handleSalvarTemperatura() {
    if (!profissional) {
      toast.error('Profissional não identificado para assinar o registro.')
      return
    }

    const momNum = parseFloat(tempMomento.replace(',', '.'))
    if (isNaN(momNum)) {
      toast.error('Informe um valor numérico válido para a temperatura do momento.')
      return
    }

    const minNum = tempMin ? parseFloat(tempMin.replace(',', '.')) : momNum
    const maxNum = tempMax ? parseFloat(tempMax.replace(',', '.')) : momNum
    const ambNum = tempAmbiente ? parseFloat(tempAmbiente.replace(',', '.')) : null

    setSalvandoTemp(true)
    const id = `temp_${Date.now()}`
    const sig = {
      id: profissional.id,
      d: dataSel,
      h: tempHora || agoraHM(),
    }

    const { error } = await supabase.from('temperaturas').insert({
      id,
      data: dataSel,
      turno: tempTurno,
      hora: tempHora || agoraHM(),
      momento: momNum,
      min: isNaN(minNum) ? momNum : minNum,
      max: isNaN(maxNum) ? momNum : maxNum,
      ambiente: ambNum,
      assinatura: sig,
    })

    setSalvandoTemp(false)

    if (error) {
      toast.error(`Erro ao salvar temperatura: ${error.message}`)
      return
    }

    toast.success(
      `Temperatura do turno ${tempTurno === 'manha' ? 'da Manhã' : 'da Noite'} registrada com sucesso!`
    )
    setDialogTempOpen(false)
    await refresh()
  }

  async function handleExcluirTemperatura() {
    if (!tempParaExcluir) return
    const { error } = await supabase.from('temperaturas').delete().eq('id', tempParaExcluir.id)
    if (error) {
      toast.error(`Erro ao excluir medição: ${error.message}`)
      return
    }
    toast.success('Medição estornada com sucesso.')
    setTempParaExcluir(null)
    await refresh()
  }

  async function handleToggleTarefa(tarefaId: string) {
    const isConcluida = feitas.includes(tarefaId)
    const novasFeitas = isConcluida
      ? feitas.filter((id) => id !== tarefaId)
      : [...feitas, tarefaId]

    // Optimistic update
    setLocalFeitas((prev) => ({ ...prev, [dataSel]: novasFeitas }))

    if (isConcluida) {
      const { error } = await supabase
        .from('tarefas_feitas')
        .delete()
        .eq('data', dataSel)
        .eq('tarefa_id', tarefaId)

      if (error) {
        toast.error(`Erro ao desmarcar tarefa: ${error.message}`)
        await refresh()
      } else {
        toast.success('Tarefa marcada como pendente.')
        await refresh()
      }
    } else {
      const { error } = await supabase.from('tarefas_feitas').insert({
        data: dataSel,
        tarefa_id: tarefaId,
      })

      if (error) {
        toast.error(`Erro ao concluir tarefa: ${error.message}`)
        await refresh()
      } else {
        toast.success('Tarefa concluída!')
        await refresh()
      }
    }
  }

  async function handleSalvarTarefa() {
    if (!novaTarefaDesc.trim()) {
      toast.error('Informe a descrição da rotina.')
      return
    }
    if (!novaTarefaDias.length) {
      toast.error('Selecione ao menos um dia da semana para a tarefa.')
      return
    }

    setSalvandoTarefa(true)
    const id = `tar_${Date.now()}`
    const { error } = await supabase.from('tarefas').insert({
      id,
      tarefa: novaTarefaDesc.trim(),
      responsavel: novaTarefaResp === 'todos' ? null : novaTarefaResp,
      dias: novaTarefaDias.sort(),
    })
    setSalvandoTarefa(false)

    if (error) {
      toast.error(`Erro ao cadastrar tarefa: ${error.message}`)
      return
    }

    toast.success('Nova rotina cadastrada com sucesso!')
    setNovaTarefaDesc('')
    setNovaTarefaResp('todos')
    setNovaTarefaDias([1, 2, 3, 4, 5])
    setDialogTarefaOpen(false)
    await refresh()
  }

  async function handleExcluirTarefa() {
    if (!tarefaParaExcluir) return
    const { error } = await supabase.from('tarefas').delete().eq('id', tarefaParaExcluir.id)
    if (error) {
      toast.error(`Erro ao excluir rotina: ${error.message}`)
      return
    }
    toast.success('Rotina excluída do sistema.')
    setTarefaParaExcluir(null)
    await refresh()
  }

  function toggleDia(d: number) {
    setNovaTarefaDias((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )
  }

  const momNumLive = parseFloat(tempMomento.replace(',', '.'))
  const isForaLive = !isNaN(momNumLive) && (momNumLive < 2 || momNumLive > 8)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Rotinas, Geladeira & POPs"
          lede="Monitoramento de cadeia de frio, rotinas operacionais diárias e procedimentos operacionais padrão (POPs)."
        />

        {/* Date Selector Navigation (exibido para rotinas diárias e geladeira) */}
        {abaAtiva !== 'pops' && (
          <div className="flex items-center gap-2 bg-card border border-border/70 p-1.5 rounded-xl shadow-xs self-start sm:self-auto">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => navegarData(-1)}
              title="Dia anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <div className="flex items-center gap-2 px-2 text-xs font-semibold">
              <Calendar className="size-3.5 text-primary" />
              <Input
                type="date"
                value={dataSel}
                onChange={(e) => e.target.value && setDataSel(e.target.value)}
                className="h-7 text-xs px-2 py-0 border-none bg-transparent font-medium cursor-pointer shadow-none focus-visible:ring-0"
              />
              {isHoje && (
                <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0 h-5">
                  Hoje
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => navegarData(1)}
              title="Próximo dia"
            >
              <ChevronRight className="size-4" />
            </Button>

            {!isHoje && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs ml-1"
                onClick={() => setDataSel(hojeIso)}
              >
                Voltar p/ Hoje
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Navegação por Abas Principais de Rotinas em Ordem Alfabética */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60">
        <button
          type="button"
          onClick={() => mudarAba('geladeira')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer',
            abaAtiva === 'geladeira'
              ? 'bg-[#123F4A] text-white shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <ThermometerSnowflake className="size-3.5" />
          <span>Geladeira de Medicamentos</span>
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 ml-0.5">
            {leiturasDia.length}/2
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => mudarAba('pops')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer',
            abaAtiva === 'pops'
              ? 'bg-[#123F4A] text-white shadow-xs ring-2 ring-primary/20'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <FileText className="size-3.5 text-primary" />
          <span className="font-bold">POPs & Protocolos</span>
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 ml-0.5 font-bold">
            {pops.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => mudarAba('rotinas')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer',
            abaAtiva === 'rotinas'
              ? 'bg-[#123F4A] text-white shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <ListChecks className="size-3.5" />
          <span>Rotinas Diárias</span>
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 ml-0.5">
            {concluidasCount}/{tarefasHoje.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => mudarAba('todas')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer',
            abaAtiva === 'todas'
              ? 'bg-[#123F4A] text-white shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <CalendarCheck2 className="size-3.5" />
          <span>Visão Geral</span>
        </button>
      </div>

      {/* Geladeira de Medicamentos Section */}
      {(abaAtiva === 'todas' || abaAtiva === 'geladeira') && (
      <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <ThermometerSnowflake className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold font-heading">
                  Cadeia de Frio — Geladeira de Medicamentos
                </CardTitle>
                <Badge variant="outline" className="text-xs bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25">
                  <ShieldCheck className="size-3 mr-1 inline" /> RDC 502 / ANVISA
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                Faixa padrão exigida: entre 2,0 °C e 8,0 °C (medição obrigatória manhã e noite). Data:{' '}
                <strong className="text-foreground">{fmt(dataSel)} ({DIAS[diaSemana]})</strong>
              </span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => abrirRegistroTemp()}
            className="rounded-xl gap-1.5 self-start sm:self-auto bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
          >
            <Plus className="size-4" /> Registrar Temperatura
          </Button>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slot Manhã */}
            {leituraManha ? (
              <TemperaturaCard
                leitura={leituraManha}
                titulo="Turno: Manhã"
                responsavel={profissionalPorId(leituraManha.sig?.id)?.nome}
                conselho={profissionalPorId(leituraManha.sig?.id)?.conselho}
                onExcluir={() => setTempParaExcluir(leituraManha)}
              />
            ) : (
              <TemperaturaPendenteSlot
                turno="manha"
                label="Turno da Manhã (07h - 08h)"
                onClick={() => abrirRegistroTemp('manha')}
              />
            )}

            {/* Slot Noite */}
            {leituraNoite ? (
              <TemperaturaCard
                leitura={leituraNoite}
                titulo="Turno: Noite"
                responsavel={profissionalPorId(leituraNoite.sig?.id)?.nome}
                conselho={profissionalPorId(leituraNoite.sig?.id)?.conselho}
                onExcluir={() => setTempParaExcluir(leituraNoite)}
              />
            ) : (
              <TemperaturaPendenteSlot
                turno="noite"
                label="Turno da Noite (19h - 20h)"
                onClick={() => abrirRegistroTemp('noite')}
              />
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Escala de Organização do Dia */}
      {(abaAtiva === 'todas' || abaAtiva === 'rotinas') && (
      <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CalendarCheck2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold font-heading">
                  Escala de Organização & Rotinas da Casa
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {DIAS[diaSemana]}, {fmt(dataSel)}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                Tarefas periódicas, checagem e atribuições de suporte operacional do plantão
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-muted/60 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setModoTarefas('dia')}
                className={cn(
                  'px-3 py-1 rounded-lg font-medium transition-all',
                  modoTarefas === 'dia'
                    ? 'bg-card text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Tarefas do Dia ({tarefasHoje.length})
              </button>
              <button
                type="button"
                onClick={() => setModoTarefas('todas')}
                className={cn(
                  'px-3 py-1 rounded-lg font-medium transition-all',
                  modoTarefas === 'todas'
                    ? 'bg-card text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Todas as Rotinas ({tarefas.length})
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogTarefaOpen(true)}
              className="rounded-xl gap-1.5"
            >
              <Plus className="size-4" /> Nova Rotina
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {modoTarefas === 'dia' && (
            <div className="space-y-1.5 bg-muted/20 p-3.5 rounded-xl border border-border/50">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">
                  Progresso do checklist ({concluidasCount} de {tarefasHoje.length} rotinas concluídas):
                </span>
                <span className="font-bold text-foreground">{progressoTarefas}%</span>
              </div>
              <Progress value={progressoTarefas} className="h-2.5" />
            </div>
          )}

          {modoTarefas === 'dia' ? (
            tarefasHoje.length === 0 ? (
              <EmptyState title="Nenhuma tarefa prevista para este dia">
                Não há rotinas organizacionais programadas para {DIAS[diaSemana]}. Clique em &quot;Nova Rotina&quot; para cadastrar.
              </EmptyState>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {tarefasHoje.map((t) => {
                  const ok = feitas.includes(t.id)
                  const respNome = t.resp ? profissionalPorId(t.resp)?.nome ?? t.resp : 'Geral'

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTarefa(t.id)}
                      className={cn(
                        'flex items-center justify-between gap-3 p-3.5 rounded-xl border text-xs cursor-pointer select-none transition-all duration-150',
                        ok
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100 shadow-xs'
                          : 'bg-card border-border/70 text-foreground hover:bg-muted/30 hover:border-border'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'size-5 rounded-md flex items-center justify-center border font-bold text-xs shrink-0 transition-colors',
                            ok
                              ? 'bg-emerald-600 border-emerald-700 text-white'
                              : 'border-border/80 bg-background text-transparent'
                          )}
                        >
                          ✓
                        </div>
                        <div className="min-w-0">
                          <span
                            className={cn(
                              'font-semibold block truncate leading-tight',
                              ok && 'line-through opacity-85'
                            )}
                          >
                            {t.tarefa}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                            Resp: <strong>{respNome}</strong>
                          </span>
                        </div>
                      </div>

                      {ok ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shrink-0 font-bold"
                        >
                          Feito
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/80 shrink-0">
                          Pendente
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            /* Todas as rotinas cadastradas */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Catálogo de tarefas configuradas e dias da semana atribuídos:</span>
              </div>
              <div className="divide-y divide-border/40 rounded-xl border border-border/60 overflow-hidden bg-card">
                {tarefas.map((t) => {
                  const respNome = t.resp ? profissionalPorId(t.resp)?.nome ?? t.resp : 'Todos os plantonistas'
                  return (
                    <div
                      key={t.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-muted/15"
                    >
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground text-sm block">
                          {t.tarefa}
                        </span>
                        <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                          <span>Responsável: <strong>{respNome}</strong></span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            {DIAS.map((dia, idx) => (
                              <span
                                key={dia}
                                className={cn(
                                  'px-1.5 py-0.5 rounded text-[10px] font-bold',
                                  t.dias.includes(idx)
                                    ? 'bg-primary/15 text-primary border border-primary/20'
                                    : 'text-muted-foreground/40'
                                )}
                              >
                                {dia}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTarefaParaExcluir({ id: t.id, desc: t.tarefa })}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 h-8 self-end sm:self-auto gap-1 text-xs"
                      >
                        <Trash2 className="size-3.5" /> Excluir
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Procedimentos Operacionais Padrão (POPs & Protocolos) */}
      {(abaAtiva === 'todas' || abaAtiva === 'pops') && (
        <PlanGate feature="pops" compacto={abaAtiva === 'todas'}>
          <SecaoPops />
        </PlanGate>
      )}

      {/* Dialog: Registrar Temperatura */}
      <Dialog open={dialogTempOpen} onOpenChange={setDialogTempOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThermometerSnowflake className="size-5 text-teal-600" />
              Registrar Temperatura da Geladeira
            </DialogTitle>
            <DialogDescription className="text-xs">
              Conformidade da Cadeia de Frio (ANVISA RDC 502). Data: <strong>{fmt(dataSel)}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Turno</Label>
                <Select
                  value={tempTurno}
                  onValueChange={(val: 'manha' | 'noite') => setTempTurno(val)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã (07h/08h)</SelectItem>
                    <SelectItem value="noite">Noite (19h/20h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Horário da Leitura</Label>
                <Input
                  type="time"
                  value={tempHora}
                  onChange={(e) => setTempHora(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Temp. Momento (°C) *</span>
                  <span className="text-[10px] text-teal-600 font-normal">Faixa: 2° a 8°C</span>
                </Label>
                <Input
                  type="text"
                  placeholder="ex: 4.5"
                  value={tempMomento}
                  onChange={(e) => setTempMomento(e.target.value)}
                  className="text-sm font-bold font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Temp. Ambiente (°C)</Label>
                <Input
                  type="text"
                  placeholder="ex: 24.0"
                  value={tempAmbiente}
                  onChange={(e) => setTempAmbiente(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Mínima Atingida (°C)</Label>
                <Input
                  type="text"
                  placeholder="ex: 3.5"
                  value={tempMin}
                  onChange={(e) => setTempMin(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Máxima Atingida (°C)</Label>
                <Input
                  type="text"
                  placeholder="ex: 5.5"
                  value={tempMax}
                  onChange={(e) => setTempMax(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            {/* In-range check banner */}
            {isForaLive ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <strong className="block font-bold">Atenção: Temperatura fora da faixa padrão!</strong>
                  Valores abaixo de 2,0 °C ou acima de 8,0 °C oferecem risco aos medicamentos termolábeis. Uma notificação de não conformidade será gerada.
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center gap-2 text-xs text-teal-700 dark:text-teal-300">
                <CheckCircle2 className="size-4 shrink-0 text-teal-600" />
                <span>Temperatura em conformidade com o padrão da ANVISA (2,0 °C a 8,0 °C).</span>
              </div>
            )}

            <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
              Responsável pelo registro:{' '}
              <strong className="text-foreground">{profissional?.nome}</strong>{' '}
              ({profissional?.conselho || profissional?.funcao})
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogTempOpen(false)}
              disabled={salvandoTemp}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarTemperatura}
              disabled={salvandoTemp}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {salvandoTemp ? 'Salvando...' : 'Salvar Registro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nova Tarefa de Rotina */}
      <Dialog open={dialogTarefaOpen} onOpenChange={setDialogTarefaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="size-5 text-primary" />
              Nova Rotina Operacional
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastre tarefas periódicas que deverão ser executadas pela equipe nos plantões.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição da Tarefa *</Label>
              <Input
                placeholder="ex: Higienizar maçanetas e corrimãos das alas"
                value={novaTarefaDesc}
                onChange={(e) => setNovaTarefaDesc(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Profissional ou Setor Responsável</Label>
              <Select
                value={novaTarefaResp}
                onValueChange={(val) => setNovaTarefaResp(val)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Geral (Qualquer plantonista)</SelectItem>
                  {[...equipe]
                    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} ({p.funcao})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Dias da Semana *</Label>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setNovaTarefaDias([0, 1, 2, 3, 4, 5, 6])}
                    className="text-primary hover:underline"
                  >
                    Todos
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setNovaTarefaDias([1, 2, 3, 4, 5])}
                    className="text-primary hover:underline"
                  >
                    Seg-Sex
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setNovaTarefaDias([0, 6])}
                    className="text-primary hover:underline"
                  >
                    Fim de semana
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {DIAS.map((dia, idx) => {
                  const sel = novaTarefaDias.includes(idx)
                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDia(idx)}
                      className={cn(
                        'py-1.5 text-center rounded-lg text-xs font-semibold border transition-all',
                        sel
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted/70'
                      )}
                    >
                      {dia}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogTarefaOpen(false)}
              disabled={salvandoTarefa}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarTarefa}
              disabled={salvandoTarefa}
            >
              {salvandoTarefa ? 'Cadastrando...' : 'Cadastrar Rotina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão de Temperatura */}
      <Dialog
        open={!!tempParaExcluir}
        onOpenChange={(open) => !open && setTempParaExcluir(null)}
      >
        <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <Trash2 className="size-4" />
              Estornar Medição
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deseja realmente remover o registro de temperatura do turno{' '}
              <strong>
                {tempParaExcluir?.turno === 'manha' ? 'Manhã' : 'Noite'} ({tempParaExcluir?.mom} °C)
              </strong>
              ? Essa ação será registrada nos logs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTempParaExcluir(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleExcluirTemperatura}
            >
              Confirmar Estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão de Tarefa */}
      <Dialog
        open={!!tarefaParaExcluir}
        onOpenChange={(open) => !open && setTarefaParaExcluir(null)}
      >
        <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <Trash2 className="size-4" />
              Excluir Rotina
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deseja remover a rotina <strong>&quot;{tarefaParaExcluir?.desc}&quot;</strong> do catálogo geral?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTarefaParaExcluir(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleExcluirTarefa}
            >
              Excluir Rotina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TemperaturaCard({
  leitura,
  titulo,
  responsavel,
  conselho,
  onExcluir,
}: {
  leitura: TemperaturaGeladeira
  titulo: string
  responsavel?: string
  conselho?: string
  onExcluir: () => void
}) {
  const fora = leitura.mom < 2 || leitura.mom > 8

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all space-y-3',
        fora
          ? 'border-rose-500/40 bg-rose-500/5'
          : 'border-border/70 bg-card hover:bg-muted/10'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-foreground uppercase tracking-wide">
            {titulo}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
            <Clock className="size-3" /> {leitura.h}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge tone={fora ? 'danger' : 'ok'}>
            {fora ? 'Fora da faixa (Alerta)' : 'Conforme (2–8 °C)'}
          </StatusBadge>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg"
            onClick={onExcluir}
            title="Estornar medição"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/40 text-center">
        <div className="p-2 rounded-lg bg-background border border-border/40">
          <span className="text-[10px] text-muted-foreground block">Momento</span>
          <span
            className={cn(
              'text-base font-bold font-mono block',
              fora ? 'text-rose-600' : 'text-teal-600'
            )}
          >
            {leitura.mom} °C
          </span>
        </div>
        <div className="p-2 rounded-lg bg-background border border-border/40">
          <span className="text-[10px] text-muted-foreground block">Mínima</span>
          <span className="text-sm font-semibold font-mono text-foreground block">
            {leitura.min} °C
          </span>
        </div>
        <div className="p-2 rounded-lg bg-background border border-border/40">
          <span className="text-[10px] text-muted-foreground block">Máxima</span>
          <span className="text-sm font-semibold font-mono text-foreground block">
            {leitura.max} °C
          </span>
        </div>
        <div className="p-2 rounded-lg bg-background border border-border/40">
          <span className="text-[10px] text-muted-foreground block">Ambiente</span>
          <span className="text-sm font-semibold font-mono text-muted-foreground block">
            {leitura.amb} °C
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
        <span>Assinatura Digital:</span>
        <span className="font-medium text-foreground">
          {responsavel ?? 'Profissional'} {conselho ? `(${conselho})` : ''}
        </span>
      </div>
    </div>
  )
}

function TemperaturaPendenteSlot({
  label,
  onClick,
}: {
  turno: 'manha' | 'noite'
  label: string
  onClick: () => void
}) {
  return (
    <div className="p-5 rounded-xl border border-dashed border-border/80 bg-muted/10 flex flex-col items-center justify-center text-center space-y-2.5">
      <div className="size-9 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
        <Clock className="size-4.5" />
      </div>
      <div>
        <span className="font-semibold text-xs text-foreground block">{label}</span>
        <span className="text-[11px] text-muted-foreground block">
          Medição de temperatura ainda não registrada para este turno.
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        className="rounded-xl gap-1 text-xs h-8"
      >
        <Plus className="size-3.5" /> Registrar Medição
      </Button>
    </div>
  )
}
