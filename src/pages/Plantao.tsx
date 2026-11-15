import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NURSE, COD } from '../lib/constants'
import { alertas } from '../lib/business/alertas'
import {
  agoraHM,
  cap,
  iso,
  minAgora,
  minDe,
  primeiro,
  sigCurta,
} from '../lib/business/dates'
import { dosesDia, isDoseLate, regAdm } from '../lib/business/medication'
import { flags } from '../lib/business/ssvv'
import { ativos } from '../lib/business/indicadores'
import { can } from '../lib/permissions'
import { checarAdministracao, desfazerAdministracao } from '../lib/administracao-actions'
import { supabase } from '../lib/supabase'
import { mesKey } from '../lib/business/dates'
import { useAuth } from '../contexts/AuthContext'
import { useEstadoAlertas, useIlpiData } from '../contexts/IlpiDataContext'
import { Allergy, Avatar, EmptyState, Section, StatusBadge } from '../components/Ui'
import type { Categoria, Cuidado, DoseDia, EventoTipo, Residente, StatusAdm } from '../types/ilpi'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Progress } from '../components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  HeartPulse,
  Pill,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const T = iso(new Date())

function cuidadoVisivel(c: Cuidado, cat: Categoria) {
  return (
    c.quem === 'todos' ||
    (c.quem === 'enfermagem' && NURSE.includes(cat)) ||
    (c.quem === 'cuidador' && (cat === 'cuid' || NURSE.includes(cat)))
  )
}

type DoseComRes = DoseDia & { r: ReturnType<typeof useIlpiData>['residentes'][0] }

export default function Plantao() {
  const { profissional } = useAuth()
  const data = useIlpiData()
  const estado = useEstadoAlertas()
  const navigate = useNavigate()
  const [modal, setModal] = useState<DoseComRes | null>(null)
  const [motivo, setMotivo] = useState('')
  const [savingDose, setSavingDose] = useState(false)

  // Modal Medicação SN
  const [modalSn, setModalSn] = useState(false)
  const [snResId, setSnResId] = useState('')
  const [snPrescId, setSnPrescId] = useState('')
  const [snMotivo, setSnMotivo] = useState('')
  const [savingSn, setSavingSn] = useState(false)

  // Modal Intercorrência Sanitária
  const [modalOcorrencia, setModalOcorrencia] = useState(false)
  const [ocoResId, setOcoResId] = useState('')
  const [ocoTipo, setOcoTipo] = useState<EventoTipo>('queda')
  const [ocoRelato, setOcoRelato] = useState('')
  const [savingOco, setSavingOco] = useState(false)

  // Modal Quick SSVV
  const [modalSsvv, setModalSsvv] = useState<Residente | null>(null)
  const [ssvvPa, setSsvvPa] = useState('')
  const [ssvvPulso, setSsvvPulso] = useState('')
  const [ssvvTemp, setSsvvTemp] = useState('')
  const [ssvvSat, setSsvvSat] = useState('')
  const [ssvvTexto, setSsvvTexto] = useState('')
  const [savingSsvv, setSavingSsvv] = useState(false)

  const codigoHoje = useMemo(() => {
    if (!profissional) return ''
    const mk = mesKey(new Date())
    const lista = data.escalaMes[mk]?.[profissional.id] ?? []
    const dia = new Date().getDate()
    return lista[dia - 1] ?? ''
  }, [data.escalaMes, profissional])

  const al = useMemo(
    () => {
      if (!profissional) return []
      return alertas({
        estado: { ...estado, adm: data.adm },
        usuario: { id: profissional.id, cat: profissional.cat },
        hoje: T,
        prof: (id) => data.profissionalPorId(id),
      })
    },
    [data.adm, data.profissionalPorId, estado, profissional],
  )

  const todasDoses = useMemo(() => {
    const ds: DoseComRes[] = []
    ativos(data.residentes).forEach((r) => {
      dosesDia(r, T).forEach((d) => ds.push({ ...d, r }))
    })
    ds.sort((a, b) => a.hora.localeCompare(b.hora) || a.r.nome.localeCompare(b.r.nome))
    return ds
  }, [data.residentes])

  const horas = [...new Set(todasDoses.map((x) => x.hora))]
  const ag = minAgora()
  const feitas = todasDoses.filter((x) => regAdm(data.adm, x.key, T)).length
  const progressoPercent = todasDoses.length ? Math.round((feitas / todasDoses.length) * 100) : 100

  const agoraDoses = useMemo(() => {
    return todasDoses.filter((x) => {
      if (regAdm(data.adm, x.key, T)) return false
      const m = minDe(x.hora)
      return Math.abs(m - ag) <= 30 || isDoseLate(x.hora, false)
    })
  }, [todasDoses, data.adm, ag])

  const atrasadas = agoraDoses.filter((x) => isDoseLate(x.hora, false)).length

  const minhas = profissional
    ? data.tarefas.filter(
        (t) => t.resp === profissional.id && t.dias.includes(new Date().getDay()),
      )
    : []
  const feitasTar = data.tarefasFeitas[T] ?? []

  if (!profissional) return null

  async function registrarDose(st: StatusAdm) {
    if (!modal || !profissional) return
    if ((st === 'recusado' || st === 'nao') && !motivo.trim()) {
      toast.error('Informe o motivo caso a dose não tenha sido administrada.')
      return
    }
    setSavingDose(true)
    const sig = { id: profissional.id, d: T, h: agoraHM() }
    const res = await checarAdministracao({
      data: T,
      residenteId: modal.resid,
      prescricaoId: modal.presc.id,
      horario: modal.hora,
      status: st,
      motivo: motivo.trim() || undefined,
      assinatura: sig,
      prescricao: modal.presc,
    })
    setSavingDose(false)

    if (!res.ok) {
      toast.error(res.erro ?? 'Erro ao registrar dose')
      return
    }

    setModal(null)
    setMotivo('')
    toast.success(st === 'dado' ? 'Dose administrada e estoque atualizado!' : 'Dose registrada.')
    await data.refresh()
  }

  async function handleDesfazerDose() {
    if (!modal || !profissional) return
    const regExistente = regAdm(data.adm, modal.key, T)
    if (!regExistente) return

    setSavingDose(true)
    const res = await desfazerAdministracao(
      T,
      modal.resid,
      modal.presc.id,
      modal.hora,
      regExistente,
      modal.presc
    )
    setSavingDose(false)

    if (!res.ok) {
      toast.error(res.erro ?? 'Erro ao desfazer checagem')
      return
    }

    setModal(null)
    setMotivo('')
    toast.success('Checagem desfeita e estoque estornado!')
    await data.refresh()
  }

  async function toggleCuidado(resId: string, cuidadoId: string) {
    if (!profissional) return
    const key = `${resId}|${cuidadoId}`
    const atual = data.checagensCuidado[T]?.[key]
    if (atual) {
      const { error } = await supabase
        .from('checagens_cuidado')
        .delete()
        .eq('data', T)
        .eq('residente_id', resId)
        .eq('cuidado_id', cuidadoId)
      if (error) {
        toast.error('Erro ao desmarcar cuidado: ' + error.message)
        return
      }
      toast.success('Checagem desfeita.')
      await data.refresh()
      return
    }
    const sig = { id: profissional.id, d: T, h: agoraHM() }
    const { error } = await supabase.from('checagens_cuidado').insert({
      data: T,
      residente_id: resId,
      cuidado_id: cuidadoId,
      assinatura: sig,
    })
    if (error) {
      toast.error('Erro ao checar cuidado: ' + error.message)
      return
    }
    toast.success('Cuidado checado.')
    await data.refresh()
  }

  async function handleSalvarSn(e: React.FormEvent) {
    e.preventDefault()
    if (!snResId || !snPrescId || !snMotivo.trim() || !profissional) {
      toast.error('Preencha todos os campos da medicação SN.')
      return
    }
    setSavingSn(true)
    const id = 'sn_' + Math.random().toString(36).substring(2, 9)
    const resTarget = data.getResidente(snResId)
    const prescTarget = resTarget?.presc.find((p) => p.id === snPrescId)

    const { error } = await supabase.from('administracoes_sn').insert({
      id,
      residente_id: snResId,
      prescricao_id: snPrescId,
      motivo: snMotivo.trim(),
      assinatura: { id: profissional.id, d: T, h: agoraHM() },
    })

    if (error) {
      setSavingSn(false)
      toast.error('Erro ao registrar dose SN: ' + error.message)
      return
    }

    // Baixa de estoque se a prescrição tiver estoque vinculado
    if (prescTarget?.estoqueId) {
      const { data: item } = await supabase
        .from('itens_estoque')
        .select('quantidade')
        .eq('id', prescTarget.estoqueId)
        .maybeSingle()
      if (item && Number(item.quantidade) > 0) {
        await supabase
          .from('itens_estoque')
          .update({ quantidade: Number(item.quantidade) - 1 })
          .eq('id', prescTarget.estoqueId)
      }
    }

    setSavingSn(false)
    toast.success('Dose Se Necessário (SN) registrada e estoque atualizado!')
    setModalSn(false)
    setSnMotivo('')
    await data.refresh()
  }

  async function handleSalvarOcorrencia(e: React.FormEvent) {
    e.preventDefault()
    if (!ocoResId || !profissional) {
      toast.error('Selecione o residente.')
      return
    }
    setSavingOco(true)
    const id = 'oco_' + Math.random().toString(36).substring(2, 9)

    const { error } = await supabase.from('ocorrencias').insert({
      id,
      residente_id: ocoResId,
      tipo: ocoTipo,
      data: T,
    })

    if (error) {
      setSavingOco(false)
      toast.error('Erro ao registrar intercorrência: ' + error.message)
      return
    }

    // Registra relato também em anotações de enfermagem
    if (ocoRelato.trim()) {
      const anotId = 'a_' + Math.random().toString(36).substring(2, 9)
      await supabase.from('anotacoes').insert({
        id: anotId,
        residente_id: ocoResId,
        texto: `[INTERCORRÊNCIA SANITÁRIA - ${ocoTipo.toUpperCase()}] ${ocoRelato.trim()}`,
        assinatura: { id: profissional.id, d: T, h: agoraHM() },
      })
    }

    setSavingOco(false)
    toast.success('Intercorrência registrada e indicadores da Vigilância atualizados!')
    setModalOcorrencia(false)
    setOcoRelato('')
    await data.refresh()
  }

  async function handleSalvarSsvv(e: React.FormEvent) {
    e.preventDefault()
    if (!modalSsvv || !profissional) return
    setSavingSsvv(true)
    const id = 'a_' + Math.random().toString(36).substring(2, 9)
    const { error } = await supabase.from('anotacoes').insert({
      id,
      residente_id: modalSsvv.id,
      pa: ssvvPa.trim() || null,
      pulso: ssvvPulso.trim() || null,
      temp: ssvvTemp.trim() || null,
      sat: ssvvSat.trim() || null,
      texto: ssvvTexto.trim() || 'Aferição de rotina de sinais vitais no plantão.',
      assinatura: { id: profissional.id, d: T, h: agoraHM() },
    })
    setSavingSsvv(false)

    if (error) {
      toast.error('Erro ao registrar sinais vitais: ' + error.message)
      return
    }

    toast.success('Sinais vitais registrados com sucesso!')
    setModalSsvv(null)
    setSsvvPa('')
    setSsvvPulso('')
    setSsvvTemp('')
    setSsvvSat('')
    setSsvvTexto('')
    await data.refresh()
  }

  const dataExt = cap(
    new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
  )

  const modalRes = modal ? data.getResidente(modal.resid) : null
  const estoqueItem =
    modal?.presc.estoqueId && modalRes
      ? modalRes.estoque.find((e) => e.id === modal.presc.estoqueId)
      : undefined

  function DoseChip({ x }: { x: DoseComRes }) {
    const g = regAdm(data.adm, x.key, T)
    const late = isDoseLate(x.hora, !!g)

    return (
      <button
        type="button"
        onClick={() => setModal(x)}
        className={cn(
          'group flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer w-full relative overflow-hidden',
          g?.st === 'dado'
            ? 'bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/15'
            : g?.st === 'recusado' || g?.st === 'nao'
              ? 'bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/15'
              : late
                ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15 ring-1 ring-rose-500/20'
                : 'bg-card border-border/80 hover:border-primary/50 hover:shadow-xs hover:bg-muted/30'
        )}
      >
        <Avatar r={x.r} size="sm" className="mt-0.5" />
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {primeiro(x.r.nome)}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground shrink-0">
              Q.{x.r.quarto}
            </span>
          </div>
          <span className="text-xs text-foreground/90 font-medium truncate mt-0.5">
            {x.presc.med}
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            {x.presc.dose} · {x.presc.via}
          </span>

          {g ? (
            <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-border/30 text-[10px] font-medium text-muted-foreground">
              {g.st === 'dado' ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Administrado
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="size-3" /> {g.st === 'recusado' ? 'Recusado' : 'Não adm.'}
                </span>
              )}
              <span>· {sigCurta(g.sig, data.profissionalPorId(g.sig.id)?.nome)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/30 text-[10px]">
              <span className={cn('font-semibold flex items-center gap-1', late ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>
                <Clock className="size-3" /> {x.hora}
              </span>
              <span className="text-primary font-semibold group-hover:translate-x-0.5 transition-transform">
                Checar →
              </span>
            </div>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Shift Hero Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar r={profissional} size="lg" className="ring-2 ring-primary/20" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                {dataExt}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
                Olá, {primeiro(profissional.nome)}
              </h1>
              <p className="text-xs text-muted-foreground">
                {profissional.funcao || 'Plantão assistencial'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            {codigoHoje ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/25 text-xs font-semibold text-primary">
                <span className="size-2 rounded-full bg-primary" />
                <span>Hoje: {COD[codigoHoje] || codigoHoje}</span>
              </div>
            ) : (
              <Badge variant="outline" className="text-xs py-1 px-3">
                {NURSE.includes(profissional.cat) || profissional.cat === 'cuid'
                  ? 'Sem escala hoje'
                  : profissional.funcao}
              </Badge>
            )}

            {can(profissional.cat, 'adm') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSnResId(data.residentes[0]?.id || '')
                  setModalSn(true)
                }}
                className="gap-1.5 rounded-xl text-xs font-semibold bg-background/80 shadow-2xs hover:bg-[#123F4A] hover:text-white transition-colors"
              >
                <Pill className="size-3.5 text-[#D9694F]" />
                <span>+ Medicação SN</span>
              </Button>
            )}

            {can(profissional.cat, 'anot') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setOcoResId(data.residentes[0]?.id || '')
                  setModalOcorrencia(true)
                }}
                className="gap-1.5 rounded-xl text-xs font-semibold bg-background/80 shadow-2xs hover:bg-[#E0A93F]/20 transition-colors"
              >
                <ShieldAlert className="size-3.5 text-[#E0A93F]" />
                <span>+ Intercorrência</span>
              </Button>
            )}
          </div>
        </div>

        {/* 4 KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-border/50">
          <Card className="border border-border/60 bg-background/60 shadow-2xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Doses Previstas
                </span>
                <span className="text-xl font-bold text-foreground">{todasDoses.length}</span>
              </div>
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Pill className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-background/60 shadow-2xs">
            <CardContent className="p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Progresso ({feitas}/{todasDoses.length})
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {progressoPercent}%
                </span>
              </div>
              <Progress value={progressoPercent} className="h-2" />
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-background/60 shadow-2xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Atrasadas
                </span>
                <span
                  className={cn(
                    'text-xl font-bold',
                    atrasadas > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                  )}
                >
                  {atrasadas}
                </span>
              </div>
              <div
                className={cn(
                  'size-8 rounded-lg flex items-center justify-center',
                  atrasadas > 0
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <Clock className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-background/60 shadow-2xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Alertas Ativos
                </span>
                <span
                  className={cn(
                    'text-xl font-bold',
                    al.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                  )}
                >
                  {al.length}
                </span>
              </div>
              <div
                className={cn(
                  'size-8 rounded-lg flex items-center justify-center',
                  al.length > 0
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <AlertTriangle className="size-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção Agora (±30 min / Doses Imediatas) */}
      {can(profissional.cat, 'adm') && (
        <Section
          variant="plain"
          title="Doses do Momento (Janela de ±30 min)"
          meta={
            <div className="flex items-center gap-2">
              {atrasadas > 0 && (
                <StatusBadge tone="danger">
                  {atrasadas} atrasada{atrasadas > 1 ? 's' : ''}
                </StatusBadge>
              )}
              <span className="text-xs text-muted-foreground font-medium">
                {agoraDoses.length} pendente{agoraDoses.length === 1 ? '' : 's'}
              </span>
            </div>
          }
        >
          {agoraDoses.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {agoraDoses.slice(0, 12).map((x) => (
                <DoseChip key={x.key} x={x} />
              ))}
            </div>
          ) : (
            <EmptyState compact title="Tudo em dia">
              Nenhuma dose urgente ou atrasada pendente neste momento.
            </EmptyState>
          )}
        </Section>
      )}

      {/* Alertas e Pendências */}
      {al.length > 0 && (
        <Section
          title="Avisos & Alertas do Plantão"
          meta={<Badge variant="secondary">{al.length} pendentes</Badge>}
        >
          <div className="grid gap-2.5">
            {al.map((a, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (a.go.startsWith('res:')) {
                    const [, id, tab] = a.go.split(':')
                    navigate(`/residentes/${id}/${tab || 'pasta'}`)
                  } else navigate(`/${a.go}`)
                }}
                className={cn(
                  'flex items-center justify-between gap-4 p-3.5 rounded-xl border text-left transition-all hover:bg-muted/40 cursor-pointer',
                  a.n === 'danger'
                    ? 'border-l-4 border-l-rose-500 bg-rose-500/5 border-border/80'
                    : 'border-l-4 border-l-amber-500 bg-amber-500/5 border-border/80'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0',
                      a.n === 'danger' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                    )}
                  >
                    {a.n === 'danger' ? <ShieldAlert className="size-4" /> : <AlertTriangle className="size-4" />}
                  </div>
                  <div className="min-w-0">
                    <strong className="text-xs font-semibold text-foreground block truncate">
                      {a.t}
                    </strong>
                    <span className="text-xs text-muted-foreground truncate block">{a.s}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-primary shrink-0">
                  <span>Abrir</span>
                  <ArrowRight className="size-3.5" />
                </div>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Ronda de Medicação Completa */}
      {can(profissional.cat, 'adm') && (
        <Section
          title="Ronda de Medicação do Dia"
          meta={
            <span className="text-xs text-muted-foreground font-medium">
              {feitas} de {todasDoses.length} checadas ({progressoPercent}%)
            </span>
          }
        >
          <div className="space-y-6">
            {horas.map((hh) => {
              const dosesDaHora = todasDoses.filter((x) => x.hora === hh)
              const past = minDe(hh) < ag - 30
              const todasChecadas = dosesDaHora.every((x) => regAdm(data.adm, x.key, T))

              return (
                <div key={hh} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-foreground px-2 py-1 rounded-md bg-muted/80 border border-border/60">
                        {hh}
                      </span>
                      {todasChecadas && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          Horário concluído
                        </Badge>
                      )}
                      {past && !todasChecadas && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                          Horário passado
                        </Badge>
                      )}
                    </div>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {dosesDaHora.map((x) => (
                      <DoseChip key={x.key} x={x} />
                    ))}
                  </div>
                </div>
              )
            })}

            {horas.length === 0 && (
              <EmptyState title="Sem medicações">
                Nenhuma dose médica prescrita para o dia de hoje.
              </EmptyState>
            )}
          </div>
        </Section>
      )}

      {/* Plano de Cuidados de Enfermagem e Cuidadores */}
      {can(profissional.cat, 'cuid') && (
        <Section
          title="Plano de Cuidados (Prescrição de Enfermagem)"
          meta={<span className="text-xs text-muted-foreground">Rotina de auxílio e procedimentos</span>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ativos(data.residentes).map((r) => {
              const cs = r.cuidados.filter((c) => cuidadoVisivel(c, profissional.cat))
              if (!cs.length) return null
              const chk = data.checagensCuidado[T] ?? {}
              const okCount = cs.filter((c) => chk[`${r.id}|${c.id}`]).length

              return (
                <Card key={r.id} className="border border-border/70 shadow-2xs">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar r={r} size="sm" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate">{r.nome}</h4>
                          <span className="text-[11px] text-muted-foreground">Quarto {r.quarto}</span>
                        </div>
                      </div>
                      <StatusBadge tone={okCount === cs.length ? 'ok' : 'neutral'}>
                        {okCount}/{cs.length}
                      </StatusBadge>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {cs.map((c) => {
                        const g = chk[`${r.id}|${c.id}`]
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => void toggleCuidado(r.id, c.id)}
                            className={cn(
                              'flex items-center justify-between gap-2.5 w-full p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer',
                              g
                                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300'
                                : 'bg-muted/30 border-border/60 hover:bg-muted text-foreground'
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={cn(
                                  'size-4.5 rounded-md flex items-center justify-center border text-[11px] shrink-0 font-bold',
                                  g
                                    ? 'bg-emerald-500 border-emerald-600 text-white'
                                    : 'border-border bg-background'
                                )}
                              >
                                {g ? '✓' : ''}
                              </div>
                              <span className="truncate">{c.texto}</span>
                            </div>
                            {g && (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                AT {sigCurta(g, data.profissionalPorId(g.id)?.nome)}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </Section>
      )}

      {/* Sinais Vitais & Evolução */}
      {can(profissional.cat, 'anot') && (
        <Section
          title="Sinais Vitais & Anotações de Enfermagem"
          meta={
            <span className="text-xs text-muted-foreground">
              {ativos(data.residentes).filter((r) => r.anot.some((a) => a.sig.d === T)).length} de{' '}
              {ativos(data.residentes).length} avaliados hoje
            </span>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ativos(data.residentes).map((r) => {
              const a = r.anot.filter((x) => x.sig.d === T).slice(-1)[0]
              const f = a ? flags(a) : {}

              return (
                <div
                  key={r.id}
                  className="flex flex-col justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar r={r} size="sm" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground block truncate">
                          {r.nome}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Quarto {r.quarto}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="xs"
                        variant={a ? 'outline' : 'default'}
                        onClick={() => {
                          setModalSsvv(r)
                          setSsvvPa(a?.pa || '')
                          setSsvvPulso(a?.pulso != null ? String(a.pulso) : '')
                          setSsvvTemp(a?.temp != null ? String(a.temp) : '')
                          setSsvvSat(a?.sat != null ? String(a.sat) : '')
                        }}
                        className="rounded-lg text-[11px] gap-1 bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold"
                      >
                        <HeartPulse className="size-3" />
                        <span>Aferir</span>
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => navigate(`/residentes/${r.id}/anot`)}
                        className="rounded-lg text-[11px] px-1.5"
                        title="Ver histórico no prontuário"
                      >
                        <ArrowRight className="size-3" />
                      </Button>
                    </div>
                  </div>

                  {a ? (
                    <div className="space-y-1.5 pt-2 border-t border-border/40">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {a.pa && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5',
                              f.pa
                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/25'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            PA {a.pa}
                          </Badge>
                        )}
                        {a.temp != null && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5',
                              f.temp
                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/25'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            T {a.temp} °C
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {a.sig.h} · {primeiro(data.profissionalPorId(a.sig.id)?.nome)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground pt-2 border-t border-border/40 italic">
                      Nenhum sinal vital registrado hoje
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Tarefas Pessoais do Profissional */}
      {minhas.length > 0 && (
        <Section title="Minhas Tarefas do Dia">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {minhas.map((t) => {
              const f = feitasTar.includes(t.id)
              return (
                <div
                  key={t.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border text-xs font-medium',
                    f
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300'
                      : 'bg-card border-border/70 text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'size-5 rounded-md flex items-center justify-center border font-bold text-xs shrink-0',
                      f
                        ? 'bg-emerald-500 border-emerald-600 text-white'
                        : 'border-border bg-background'
                    )}
                  >
                    {f ? '✓' : ''}
                  </div>
                  <span>{t.tarefa}</span>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Radix Dialog: Checagem de Administração de Dose */}
      <Dialog open={!!modal} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          {modal && modalRes && (() => {
            const regExistente = regAdm(data.adm, modal.key, T)
            return (
              <>
                <DialogHeader className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar r={modalRes} size="lg" />
                    <div className="min-w-0">
                      <DialogTitle className="text-lg font-bold font-heading truncate">
                        {modal.presc.med}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        {modalRes.nome} · Quarto {modalRes.quarto} · Horário {modal.hora}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <Allergy alergias={modalRes.alergias} />

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Posologia:</span>
                      <span className="font-semibold text-foreground">
                        {modal.presc.dose} ({modal.presc.via})
                      </span>
                    </div>
                    {estoqueItem && (
                      <div className="flex justify-between pt-1 border-t border-border/40">
                        <span className="text-muted-foreground">Saldo em Estoque:</span>
                        <span className="font-semibold text-foreground">
                          {estoqueItem.qtd} {estoqueItem.unid}
                        </span>
                      </div>
                    )}
                  </div>

                  {regExistente ? (
                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground">Registro de Plantão:</span>
                        <StatusBadge tone={regExistente.st === 'dado' ? 'ok' : 'danger'}>
                          {regExistente.st === 'dado'
                            ? 'Administrado'
                            : regExistente.st === 'recusado'
                              ? 'Recusado pelo residente'
                              : 'Não administrado'}
                        </StatusBadge>
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Horário / Checador:</span>
                        <span>{sigCurta(regExistente.sig, data.profissionalPorId(regExistente.sig.id)?.nome)}</span>
                      </div>
                      {regExistente.motivo && (
                        <p className="text-[11px] text-muted-foreground italic border-t border-border/40 pt-1.5">
                          Justificativa: "{regExistente.motivo}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="motivo" className="text-xs font-semibold">
                        Observação ou Motivo (obrigatório em caso de não administração)
                      </Label>
                      <textarea
                        id="motivo"
                        rows={3}
                        placeholder="Descreva se o residente recusou ou se houve intercorrência..."
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        className="w-full text-xs rounded-xl border border-border bg-background p-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  )}
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                  {regExistente ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setModal(null)}
                        className="w-full sm:w-auto text-xs"
                      >
                        Fechar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={savingDose}
                        onClick={() => void handleDesfazerDose()}
                        className="w-full sm:w-auto text-xs font-semibold gap-1.5"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>Desfazer Checagem (Estornar)</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        disabled={savingDose}
                        onClick={() => void registrarDose('dado')}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                      >
                        <CheckCircle2 className="size-4 mr-1.5" />
                        Administrado
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={savingDose}
                        onClick={() => void registrarDose('recusado')}
                        className="w-full sm:w-auto text-amber-600 hover:bg-amber-500/10 rounded-xl text-xs font-semibold"
                      >
                        <AlertCircle className="size-4 mr-1.5" />
                        Recusou
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={savingDose}
                        onClick={() => void registrarDose('nao')}
                        className="w-full sm:w-auto text-rose-600 hover:bg-rose-500/10 rounded-xl text-xs font-semibold"
                      >
                        <XCircle className="size-4 mr-1.5" />
                        Não Administrado
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal: Medicação Se Necessário (SN) */}
      <Dialog open={modalSn} onOpenChange={setModalSn}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSalvarSn}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Pill className="size-4 text-[#D9694F]" />
                Registrar Medicação Se Necessário (SN)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Registre uma administração de medicamento de alívio ou sintomático à beira-leito.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="snRes" className="text-[11px] font-semibold">Residente *</Label>
                <select
                  id="snRes"
                  value={snResId}
                  onChange={(e) => {
                    setSnResId(e.target.value)
                    const r = data.getResidente(e.target.value)
                    setSnPrescId(r?.presc[0]?.id || '')
                  }}
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                >
                  {ativos(data.residentes).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome} (Quarto {r.quarto})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="snPresc" className="text-[11px] font-semibold">Medicamento Prescrito *</Label>
                <select
                  id="snPresc"
                  value={snPrescId}
                  onChange={(e) => setSnPrescId(e.target.value)}
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                >
                  <option value="">Selecione o medicamento...</option>
                  {(data.getResidente(snResId)?.presc ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.med} ({p.dose} - {p.via}) [{p.tipo.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="snMot" className="text-[11px] font-semibold">Motivo / Indicação Clínica *</Label>
                <Input
                  id="snMot"
                  value={snMotivo}
                  onChange={(e) => setSnMotivo(e.target.value)}
                  placeholder="Ex: Queixa de dor lombar intensa, febre 38.4°C, náusea..."
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalSn(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingSn || !snPrescId}
                className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold"
              >
                {savingSn ? 'Registrando...' : 'Confirmar Dose SN'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Intercorrência Sanitária (RDC 502 / ANVISA) */}
      <Dialog open={modalOcorrencia} onOpenChange={setModalOcorrencia}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSalvarOcorrencia}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <ShieldAlert className="size-4 text-[#E0A93F]" />
                Registrar Intercorrência Sanitária
              </DialogTitle>
              <DialogDescription className="text-xs">
                Evento sentinela de notificação compulsória para a Vigilância Sanitária (RDC 502).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="ocoRes" className="text-[11px] font-semibold">Residente Envolvido *</Label>
                <select
                  id="ocoRes"
                  value={ocoResId}
                  onChange={(e) => setOcoResId(e.target.value)}
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                >
                  {ativos(data.residentes).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome} (Quarto {r.quarto})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="ocoTipo" className="text-[11px] font-semibold">Tipo de Evento Sentinela *</Label>
                <select
                  id="ocoTipo"
                  value={ocoTipo}
                  onChange={(e) => setOcoTipo(e.target.value as EventoTipo)}
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                >
                  <option value="queda">Queda da própria altura / leito</option>
                  <option value="lpp">Lesão por Pressão (LPP)</option>
                  <option value="desidratacao">Desidratação clínica</option>
                  <option value="dda">Doença Diarreica Aguda (DDA)</option>
                  <option value="escabiose">Surto / Suspeita de Escabiose</option>
                  <option value="desnutricao">Desnutrição moderada / grave</option>
                  <option value="obito">Declaração de Óbito</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="ocoRel" className="text-[11px] font-semibold">Relato Circunstancial e Conduta Imediata</Label>
                <textarea
                  id="ocoRel"
                  rows={3}
                  value={ocoRelato}
                  onChange={(e) => setOcoRelato(e.target.value)}
                  placeholder="Descreva o que ocorreu, socorro prestado, acionamento do SAMU ou médico assistente..."
                  className="w-full text-xs rounded-md border border-input bg-background p-2 focus-visible:outline-ring"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOcorrencia(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingOco}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                {savingOco ? 'Registrando...' : 'Notificar Intercorrência'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Quick Aferição de Sinais Vitais */}
      <Dialog open={!!modalSsvv} onOpenChange={(v) => !v && setModalSsvv(null)}>
        <DialogContent className="max-w-md">
          {modalSsvv && (
            <form onSubmit={handleSalvarSsvv}>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <HeartPulse className="size-4 text-[#123F4A]" />
                  Aferir Sinais Vitais — {modalSsvv.nome}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Aferição de leito · Quarto {modalSsvv.quarto} · Registro direto no prontuário.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Pressão Arterial (PA)</Label>
                    <Input
                      value={ssvvPa}
                      onChange={(e) => setSsvvPa(e.target.value)}
                      placeholder="120x80"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Frequência Cardíaca (bpm)</Label>
                    <Input
                      value={ssvvPulso}
                      onChange={(e) => setSsvvPulso(e.target.value)}
                      placeholder="76"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Temperatura Axilar (°C)</Label>
                    <Input
                      value={ssvvTemp}
                      onChange={(e) => setSsvvTemp(e.target.value)}
                      placeholder="36.5"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Saturação de Oxigênio (%)</Label>
                    <Input
                      value={ssvvSat}
                      onChange={(e) => setSsvvSat(e.target.value)}
                      placeholder="98"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px]">Observações / Queixas</Label>
                  <Input
                    value={ssvvTexto}
                    onChange={(e) => setSsvvTexto(e.target.value)}
                    placeholder="Ex: Lúcido, eupneico, afebril, sem queixas..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => setModalSsvv(null)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingSsvv}
                  className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold"
                >
                  {savingSsvv ? 'Registrando...' : 'Salvar no Prontuário'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
