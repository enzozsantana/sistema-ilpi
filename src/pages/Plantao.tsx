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
import { dosesDia, isDoseLate, regAdm, isMedicamentoControlado } from '../lib/business/medication'
import { flags } from '../lib/business/ssvv'
import { ativos } from '../lib/business/indicadores'
import { can } from '../lib/permissions'
import { checarAdministracao, desfazerAdministracao } from '../lib/administracao-actions'
import { supabase } from '../lib/supabase'
import { fmt, mesKey } from '../lib/business/dates'
import { useAuth } from '../contexts/AuthContext'
import { useEstadoAlertas, useIlpiData } from '../contexts/IlpiDataContext'
import { Allergy, Avatar, EmptyState, Section, StatusBadge } from '../components/Ui'
import type { Categoria, Cuidado, DoseDia, EventoTipo, Residente, StatusAdm } from '../types/ilpi'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Progress } from '../components/ui/progress'
import { SearchableSelect } from '../components/ui/select'
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
  Bandage,
  Camera,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Clock,
  Droplets,
  HeartPulse,
  Image as ImageIcon,
  Megaphone,
  Pill,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react'
import { processarEUploadFoto } from '../lib/image'
import { classificarCuidado, isCuidadoLpp, extrairHorariosCuidado } from '../lib/business/cuidados'
import {
  MODELOS_PASSAGEM,
  TURNOS_PLANTAO,
  computarResumoPlantao,
  extrairAlertasCriticosRT,
} from '../lib/business/passagemAvisos'
import type { PrioridadeAviso, TurnoPlantao } from '../types/ilpi'
import { toast } from 'sonner'
import { mascaraPA } from '../lib/masks'
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
  const [ssvvDextro, setSsvvDextro] = useState('')
  const [ssvvTexto, setSsvvTexto] = useState('')
  const [savingSsvv, setSavingSsvv] = useState(false)

  // Modal Comprovação Fotográfica de Cuidado
  const [modalFotoCuidado, setModalFotoCuidado] = useState<{ r: Residente; c: Cuidado; horario?: string } | null>(null)
  const [fotoCuidado, setFotoCuidado] = useState('')
  const [fotoCuidadoTexto, setFotoCuidadoTexto] = useState('')
  const [processandoFotoCuidado, setProcessandoFotoCuidado] = useState(false)
  const [salvandoFotoCuidado, setSalvandoFotoCuidado] = useState(false)

  // Passagem de Plantão
  const [modalPassagem, setModalPassagem] = useState(false)
  const [modalHistoricoPassagens, setModalHistoricoPassagens] = useState(false)
  const [passagemTurno, setPassagemTurno] = useState<TurnoPlantao>('manha')
  const [passagemRecebidoPor, setPassagemRecebidoPor] = useState('')
  const [passagemRelato, setPassagemRelato] = useState('')
  const [passagemPendencias, setPassagemPendencias] = useState('')
  const [salvandoPassagem, setSalvandoPassagem] = useState(false)

  // Avisos & Comunicados da RT (Egle)
  const [modalNovoAviso, setModalNovoAviso] = useState(false)
  const [avisoTitulo, setAvisoTitulo] = useState('')
  const [avisoMensagem, setAvisoMensagem] = useState('')
  const [avisoPrioridade, setAvisoPrioridade] = useState<PrioridadeAviso>('geral')
  const [salvandoAviso, setSalvandoAviso] = useState(false)

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

  async function toggleCuidado(resId: string, cuidadoId: string, horario?: string, fotoUrl?: string) {
    if (!profissional) return
    const key = horario ? `${resId}|${cuidadoId}|${horario}` : `${resId}|${cuidadoId}`
    const atual = data.checagensCuidado[T]?.[key]

    // Busca a linha atual no Supabase para saber o estado de 'assinatura'
    const { data: linhas } = await supabase
      .from('checagens_cuidado')
      .select('*')
      .eq('data', T)
      .eq('residente_id', resId)
      .eq('cuidado_id', cuidadoId)

    const linhaExistente = linhas?.[0]
    const sigAtual = (linhaExistente?.assinatura ?? {}) as {
      id: string
      d: string
      h: string
      horario?: string
      foto?: string
      checagens?: Record<string, { id: string; d: string; h: string; foto?: string }>
    }

    if (atual && !fotoUrl) {
      // DESMARCAR
      if (horario && sigAtual.checagens && sigAtual.checagens[horario]) {
        const novoChecagens = { ...sigAtual.checagens }
        delete novoChecagens[horario]
        if (Object.keys(novoChecagens).length === 0) {
          await supabase
            .from('checagens_cuidado')
            .delete()
            .eq('data', T)
            .eq('residente_id', resId)
            .eq('cuidado_id', cuidadoId)
        } else {
          await supabase
            .from('checagens_cuidado')
            .update({
              assinatura: {
                ...sigAtual,
                checagens: novoChecagens,
              },
            })
            .eq('data', T)
            .eq('residente_id', resId)
            .eq('cuidado_id', cuidadoId)
        }
      } else {
        await supabase
          .from('checagens_cuidado')
          .delete()
          .eq('data', T)
          .eq('residente_id', resId)
          .eq('cuidado_id', cuidadoId)
      }

      toast.success(horario ? `Horário ${horario} desmarcado.` : 'Checagem desfeita.')
      await data.refresh()
      return
    }

    // MARCAR
    const novoCheckItem = {
      id: profissional.id,
      d: T,
      h: agoraHM(),
      ...(fotoUrl ? { foto: fotoUrl } : {}),
    }

    if (horario) {
      const checagensMap = { ...(sigAtual.checagens || {}), [horario]: novoCheckItem }
      const payloadAssinatura = {
        id: profissional.id,
        d: T,
        h: agoraHM(),
        horario,
        ...(fotoUrl ? { foto: fotoUrl } : {}),
        checagens: checagensMap,
      }

      if (linhaExistente) {
        await supabase
          .from('checagens_cuidado')
          .update({ assinatura: payloadAssinatura })
          .eq('data', T)
          .eq('residente_id', resId)
          .eq('cuidado_id', cuidadoId)
      } else {
        await supabase.from('checagens_cuidado').insert({
          data: T,
          residente_id: resId,
          cuidado_id: cuidadoId,
          assinatura: payloadAssinatura,
        })
      }
      toast.success(`Horário ${horario} checado com sucesso!`)
    } else {
      const sig = { id: profissional.id, d: T, h: agoraHM(), ...(fotoUrl ? { foto: fotoUrl } : {}) }
      await supabase.from('checagens_cuidado').insert({
        data: T,
        residente_id: resId,
        cuidado_id: cuidadoId,
        assinatura: sig,
      })
      toast.success('Cuidado checado.')
    }
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
      dextro: ssvvDextro.trim() || null,
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
    setSsvvDextro('')
    setSsvvTexto('')
    await data.refresh()
  }

  async function handleFotoCuidadoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !modalFotoCuidado) return
    setProcessandoFotoCuidado(true)
    try {
      const url = await processarEUploadFoto(file, `res_${modalFotoCuidado.r.id}/cuidados`)
      setFotoCuidado(url)
      toast.success('Foto carregada!')
    } catch {
      toast.error('Não foi possível processar a foto tirada.')
    } finally {
      setProcessandoFotoCuidado(false)
      e.target.value = ''
    }
  }

  async function handleSalvarFotoCuidado(e: React.FormEvent) {
    e.preventDefault()
    if (!modalFotoCuidado || !profissional) return
    if (!fotoCuidado) {
      toast.error('Tire uma foto ou selecione uma imagem para comprovação.')
      return
    }

    setSalvandoFotoCuidado(true)
    const id = 'a_' + Math.random().toString(36).substring(2, 9)
    const horTxt = modalFotoCuidado.horario ? ` às ${modalFotoCuidado.horario}` : ''
    const textoFinal =
      fotoCuidadoTexto.trim() || `[COMPROVAÇÃO DE CUIDADO${horTxt}] ${modalFotoCuidado.c.texto}`

    // 1. Salva foto em anotações do residente para constar no prontuário e histórico
    const { error: erroAnot } = await supabase.from('anotacoes').insert({
      id,
      residente_id: modalFotoCuidado.r.id,
      texto: textoFinal,
      fotos: [fotoCuidado],
      assinatura: { id: profissional.id, d: T, h: agoraHM() },
    })

    if (erroAnot) {
      toast.error('Erro ao registrar comprovação: ' + erroAnot.message)
      setSalvandoFotoCuidado(false)
      return
    }

    // 2. Marca cuidado no horário e com foto anexada
    await toggleCuidado(
      modalFotoCuidado.r.id,
      modalFotoCuidado.c.id,
      modalFotoCuidado.horario,
      fotoCuidado
    )

    setSalvandoFotoCuidado(false)
    toast.success(
      modalFotoCuidado.horario
        ? `Foto comprovada e horário ${modalFotoCuidado.horario} checado!`
        : 'Foto comprovada e cuidado checado!'
    )
    setModalFotoCuidado(null)
    setFotoCuidado('')
    setFotoCuidadoTexto('')
  }

  const isRTouEnf = profissional ? can(profissional.cat, 'gerir') : false

  const avisosAtivos = useMemo(() => {
    return data.avisosRT.filter((a) => a.ativo)
  }, [data.avisosRT])

  const ultimaPassagem = data.passagens[0]

  const resumoPlantao = useMemo(() => {
    return computarResumoPlantao({
      residentes: data.residentes,
      adm: data.adm,
      checagensCuidado: data.checagensCuidado,
      eventos: data.eventos,
      hoje: T,
    })
  }, [data.residentes, data.adm, data.checagensCuidado, data.eventos])

  const alertasCriticosRT = useMemo(() => {
    return extrairAlertasCriticosRT({
      residentes: data.residentes,
      adm: data.adm,
      checagensCuidado: data.checagensCuidado,
      eventos: data.eventos,
      temperaturas: data.temperaturas,
      hoje: T,
    })
  }, [data.residentes, data.adm, data.checagensCuidado, data.eventos, data.temperaturas])

  async function handleSalvarPassagem(e: React.FormEvent) {
    e.preventDefault()
    if (!profissional) return
    if (!passagemRelato.trim()) {
      toast.error('Informe o relato do plantão antes de salvar.')
      return
    }

    setSalvandoPassagem(true)
    const profRecebendo = passagemRecebidoPor ? data.profissionalPorId(passagemRecebidoPor) : null

    await data.salvarPassagem({
      data: T,
      hora: agoraHM(),
      turno: passagemTurno,
      passadoPor: { id: profissional.id, nome: profissional.nome, cat: profissional.cat },
      recebidoPor: profRecebendo
        ? { id: profRecebendo.id, nome: profRecebendo.nome, cat: profRecebendo.cat }
        : null,
      relato: passagemRelato.trim(),
      pendencias: passagemPendencias.trim() || null,
      resumo: resumoPlantao,
    })

    setSalvandoPassagem(false)
    setModalPassagem(false)
    setPassagemRelato('')
    setPassagemPendencias('')
    toast.success('Passagem de plantão formalizada e assinada com sucesso!')
  }

  async function handleSalvarAviso(e: React.FormEvent) {
    e.preventDefault()
    if (!profissional) return
    if (!avisoTitulo.trim() || !avisoMensagem.trim()) {
      toast.error('Informe o título e a mensagem do comunicado.')
      return
    }

    setSalvandoAviso(true)
    await data.salvarAviso({
      data: T,
      hora: agoraHM(),
      titulo: avisoTitulo.trim(),
      mensagem: avisoMensagem.trim(),
      prioridade: avisoPrioridade,
      autor: { id: profissional.id, nome: profissional.nome, cat: profissional.cat },
      ativo: true,
    })

    setSalvandoAviso(false)
    setModalNovoAviso(false)
    setAvisoTitulo('')
    setAvisoMensagem('')
    setAvisoPrioridade('geral')
    toast.success('Comunicado da RT enviado com alerta para toda a equipe!')
  }

  async function handleConfirmarCiencia(avisoId: string) {
    if (!profissional) return
    await data.darCiencia(avisoId, profissional.id)
    toast.success('Ciência confirmada no comunicado!')
  }

  const dataExt = cap(
    new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
  )

  const modalRes = modal ? data.getResidente(modal.resid) : null
  const estoqueItem =
    modal?.presc.estoqueId && modalRes
      ? modalRes.estoque.find((e) => e.id === modal.presc.estoqueId)
      : undefined

  async function checarDoseRapida(e: React.MouseEvent, x: DoseComRes) {
    e.stopPropagation()
    if (!profissional) return

    // Medicamentos controlados exigem abertura do modal deliberado para segurança do paciente
    if (isMedicamentoControlado(x.presc)) {
      setModal(x)
      return
    }

    setSavingDose(true)
    const sig = { id: profissional.id, d: T, h: agoraHM() }
    const res = await checarAdministracao({
      data: T,
      residenteId: x.resid,
      prescricaoId: x.presc.id,
      horario: x.hora,
      status: 'dado',
      assinatura: sig,
      prescricao: x.presc,
    })
    setSavingDose(false)

    if (!res.ok) {
      toast.error(res.erro ?? 'Erro ao registrar administração rápida')
      return
    }

    toast.success(`Dose de ${x.presc.med} (${x.hora}) administrada para ${primeiro(x.r.nome)}!`)
    await data.refresh()
  }

  function DoseChip({ x }: { x: DoseComRes }) {
    const g = regAdm(data.adm, x.key, T)
    const late = isDoseLate(x.hora, !!g)

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setModal(x)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setModal(x)
          }
        }}
        className={cn(
          'group flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer w-full relative overflow-hidden select-none',
          g?.st === 'dado'
            ? 'bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/15'
            : g?.st === 'recusado' || g?.st === 'nao'
              ? 'bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/15'
              : late
                ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15 ring-1 ring-rose-500/20'
                : 'bg-card border-border/80 hover:border-primary/50 hover:shadow-xs hover:bg-muted/30'
        )}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
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
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="text-xs text-foreground/90 font-medium truncate">
                {x.presc.med}
              </span>
              {isMedicamentoControlado(x.presc) && (
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 py-0 h-3.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35 font-semibold gap-0.5 shrink-0"
                  title="Medicamento Controlado (Portaria 344/98)"
                >
                  <ShieldAlert className="size-2 text-amber-600 dark:text-amber-400" />
                  Controlado
                </Badge>
              )}
            </div>
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
              <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-border/30 text-[10px]">
                <span className={cn('font-semibold flex items-center gap-1', late ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>
                  <Clock className="size-3" /> {x.hora}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Botão de Ação Rápida Beira-Leito (Touch Target otimizado >= 44px) */}
        {!g ? (
          <button
            type="button"
            title="Administrar agora (1 toque)"
            onClick={(e) => void checarDoseRapida(e, x)}
            className="size-11 min-w-11 min-h-11 sm:size-10 sm:min-w-10 sm:min-h-10 rounded-xl bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/30 flex items-center justify-center shrink-0 transition-all duration-150 active:scale-95 shadow-2xs"
          >
            <CheckCircle2 className="size-5 sm:size-4.5" />
            <span className="sr-only">Checar dose</span>
          </button>
        ) : (
          <div className="size-10 min-w-10 min-h-10 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
        )}
      </div>
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

            <Button
              size="sm"
              variant="outline"
              onClick={() => setModalPassagem(true)}
              className="gap-1.5 rounded-xl text-xs font-semibold bg-background/80 shadow-2xs hover:bg-[#123F4A] hover:text-white transition-colors"
            >
              <ClipboardList className="size-3.5 text-primary" />
              <span>📋 Passar Plantão</span>
            </Button>

            {isRTouEnf && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModalNovoAviso(true)}
                className="gap-1.5 rounded-xl text-xs font-semibold bg-background/80 shadow-2xs hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition-colors"
              >
                <Megaphone className="size-3.5 text-amber-600 dark:text-amber-400" />
                <span>+ Comunicado RT</span>
              </Button>
            )}
          </div>
        </div>

        {/* Banner de Comunicados da RT para a Equipe */}
        {avisosAtivos.length > 0 && (
          <div className="space-y-2.5 mt-5 pt-5 border-t border-border/50">
            {avisosAtivos.map((av) => {
              const jaLeu = av.ciencias?.includes(profissional.id)
              const isUrgente = av.prioridade === 'urgente'

              return (
                <div
                  key={av.id}
                  className={cn(
                    'p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all',
                    isUrgente
                      ? 'bg-rose-500/10 border-rose-500/35 text-rose-950 dark:text-rose-100 ring-1 ring-rose-500/20'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100'
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        'size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        isUrgente
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-500/25 text-amber-800 dark:text-amber-200'
                      )}
                    >
                      <Megaphone className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs uppercase tracking-wide">
                          Comunicado da RT ({av.autor.nome})
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] uppercase font-bold py-0 h-4',
                            isUrgente
                              ? 'bg-rose-500/25 text-rose-700 dark:text-rose-200 border-rose-500/40'
                              : 'bg-amber-500/25 text-amber-800 dark:text-amber-200 border-amber-500/40'
                          )}
                        >
                          {av.prioridade}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{av.hora}</span>
                      </div>
                      <h4 className="font-bold text-xs mt-0.5 text-foreground">{av.titulo}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                        {av.mensagem}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {jaLeu ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" /> Você deu ciência
                      </span>
                    ) : (
                      <Button
                        size="xs"
                        onClick={() => void handleConfirmarCiencia(av.id)}
                        className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold text-xs rounded-lg gap-1 cursor-pointer"
                      >
                        <CheckSquare className="size-3" />
                        <span>Estou ciente</span>
                      </Button>
                    )}

                    {isRTouEnf && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => void data.desativarAviso(av.id)}
                        className="text-[10px] text-muted-foreground hover:text-destructive h-7 px-2 cursor-pointer"
                        title="Encerrar comunicado"
                      >
                        Encerrar
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Alerta de Gravidade para a RT (Egle) e Supervisão */}
        {isRTouEnf && alertasCriticosRT.length > 0 && (
          <div className="p-3.5 sm:p-4 rounded-xl border border-rose-500/35 bg-rose-500/10 text-rose-950 dark:text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs mt-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="size-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                <ShieldAlert className="size-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300 block">
                  Supervisão RT — {alertasCriticosRT.length} pendências ou ocorrências críticas hoje
                </span>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {alertasCriticosRT.slice(0, 3).map((c) => (
                    <Badge
                      key={c.id}
                      variant="outline"
                      className="text-[10px] bg-rose-500/20 text-rose-900 dark:text-rose-200 border-rose-500/35 font-medium"
                    >
                      {c.titulo}
                    </Badge>
                  ))}
                  {alertasCriticosRT.length > 3 && (
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                      +{alertasCriticosRT.length - 3} mais
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              size="xs"
              variant="outline"
              onClick={() => navigate('/gestao')}
              className="border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 shrink-0 self-end sm:self-center text-xs font-semibold cursor-pointer"
            >
              Ver Gestão & Indicadores →
            </Button>
          </div>
        )}

        {/* Card de Passagem de Plantão dos Cuidadores */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <ClipboardList className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-foreground">
                  Passagem de Plantão da Equipe
                </span>
                {ultimaPassagem ? (
                  <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                    Turno {ultimaPassagem.turno} ({ultimaPassagem.hora})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Aguardando passagem de turno
                  </Badge>
                )}
              </div>
              {ultimaPassagem ? (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  Entregue por <strong>{ultimaPassagem.passadoPor.nome}</strong>: "{ultimaPassagem.relato}"
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Formalize a transferência de cuidados entre turnos com checagens automáticas de doses e cuidados.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {data.passagens.length > 0 && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setModalHistoricoPassagens(true)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Histórico ({data.passagens.length})
              </Button>
            )}
            <Button
              size="xs"
              onClick={() => setModalPassagem(true)}
              className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold text-xs rounded-lg gap-1.5 cursor-pointer"
            >
              <ClipboardList className="size-3.5" />
              <span>Passar Plantão</span>
            </Button>
          </div>
        </div>

        {/* 4 KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5 pt-5 border-t border-border/50">
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
          meta={<span className="text-xs text-muted-foreground">Rotina por horários e procedimentos assistenciais</span>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ativos(data.residentes).map((r) => {
              const cs = r.cuidados.filter((c) => cuidadoVisivel(c, profissional.cat))
              if (!cs.length) return null
              const chk = data.checagensCuidado[T] ?? {}
              const temLpp = cs.some((c) => isCuidadoLpp(c, r))

              let totalHorariosDia = 0
              let feitosHorariosDia = 0

              cs.forEach((c) => {
                const hors = extrairHorariosCuidado(c)
                totalHorariosDia += hors.length
                hors.forEach((h) => {
                  if (chk[`${r.id}|${c.id}|${h}`] || chk[`${r.id}|${c.id}`]) {
                    feitosHorariosDia++
                  }
                })
              })

              return (
                <Card
                  key={r.id}
                  className={cn(
                    'border shadow-2xs transition-all',
                    temLpp ? 'border-amber-500/40 dark:border-amber-500/30 ring-1 ring-amber-500/15' : 'border-border/70'
                  )}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar r={r} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-foreground truncate">{r.nome}</h4>
                            {temLpp && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 flex items-center gap-1 shrink-0">
                                <ShieldAlert className="size-2.5 text-amber-600 dark:text-amber-400" />
                                Alerta LPP
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">Quarto {r.quarto}</span>
                        </div>
                      </div>
                      <StatusBadge tone={feitosHorariosDia === totalHorariosDia && totalHorariosDia > 0 ? 'ok' : 'neutral'}>
                        {feitosHorariosDia}/{totalHorariosDia} horários
                      </StatusBadge>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {cs.map((c) => {
                        const info = classificarCuidado(c, r)
                        const isAmbar = info.corTema === 'amber'
                        const isCurativo = info.tipo === 'curativo'
                        const horarios = extrairHorariosCuidado(c)
                        const checadosCount = horarios.filter((h) => chk[`${r.id}|${c.id}|${h}`] || chk[`${r.id}|${c.id}`]).length

                        return (
                          <div
                            key={c.id}
                            className={cn(
                              'p-3 rounded-xl border text-xs space-y-2 transition-all',
                              isAmbar
                                ? 'bg-amber-500/10 border-amber-500/40 dark:border-amber-400/30 ring-1 ring-amber-500/15'
                                : isCurativo
                                ? 'bg-purple-500/10 border-purple-500/40 dark:border-purple-400/30 ring-1 ring-purple-500/15'
                                : 'bg-muted/20 border-border/60'
                            )}
                          >
                            {/* Cabeçalho do cuidado */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0">
                                <div
                                  className={cn(
                                    'size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold',
                                    isAmbar
                                      ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                                      : isCurativo
                                      ? 'bg-purple-500/20 text-purple-800 dark:text-purple-300'
                                      : 'bg-primary/10 text-primary'
                                  )}
                                >
                                  {isAmbar ? (
                                    info.isDecubito ? <RefreshCw className="size-3" /> : <ShieldAlert className="size-3" />
                                  ) : isCurativo ? (
                                    <Bandage className="size-3" />
                                  ) : (
                                    <span>•</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {isAmbar && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-500/40">
                                        LPP
                                      </span>
                                    )}
                                    {isCurativo && !isAmbar && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/25 text-purple-900 dark:text-purple-200 border border-purple-500/40">
                                        CURATIVO
                                      </span>
                                    )}
                                    <span className="font-bold text-foreground text-xs leading-snug">
                                      {info.tituloPrincipal}
                                    </span>
                                  </div>
                                  {info.instrucoes && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                      {info.instrucoes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                                {checadosCount}/{horarios.length}
                              </span>
                            </div>

                            {/* Fileira de Horários com Checagem e Foto (Touch Target Otimizado) */}
                            <div className="flex flex-wrap items-center gap-2 pt-1.5">
                              {horarios.map((hora) => {
                                const checkKey = `${r.id}|${c.id}|${hora}`
                                const check = chk[checkKey] || chk[`${r.id}|${c.id}`]
                                const checado = Boolean(check)

                                return (
                                  <div
                                    key={hora}
                                    className={cn(
                                      'inline-flex items-stretch rounded-xl border text-xs transition-all overflow-hidden shadow-2xs select-none',
                                      checado
                                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-800 dark:text-emerald-300 font-bold'
                                        : 'bg-background hover:bg-muted border-border/80 text-foreground'
                                    )}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => void toggleCuidado(r.id, c.id, hora)}
                                      className="min-h-[38px] px-3 py-1.5 flex items-center gap-1.5 cursor-pointer hover:opacity-85 text-xs font-semibold active:scale-95 transition-transform"
                                      title={
                                        checado
                                          ? `Checado às ${check?.h} por ${primeiro(data.profissionalPorId(check?.id)?.nome)}. Clique para desmarcar.`
                                          : `Clique para checar horário ${hora}`
                                      }
                                    >
                                      <span>{hora}</span>
                                      {checado ? (
                                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      ) : null}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setModalFotoCuidado({ r, c, horario: hora })
                                        setFotoCuidado('')
                                        setFotoCuidadoTexto(
                                          isAmbar
                                            ? `Mudança de decúbito das ${hora} realizada (pele íntegra).`
                                            : isCurativo
                                            ? `Curativo e troca de cobertura das ${hora} realizados.`
                                            : `Cuidado das ${hora} executado: ${info.tituloPrincipal}`
                                        )
                                      }}
                                      className={cn(
                                        'min-h-[38px] min-w-[34px] px-2 border-l border-border/40 hover:bg-muted/80 transition-colors flex items-center justify-center active:scale-95 cursor-pointer',
                                        check?.foto
                                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                          : 'text-muted-foreground hover:text-primary'
                                      )}
                                      title={
                                        check?.foto
                                          ? 'Foto de comprovação anexada neste horário. Clique para visualizar ou trocar.'
                                          : `Tirar foto de comprovação das ${hora}`
                                      }
                                    >
                                      <Camera className="size-3.5 shrink-0" />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
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
                          setSsvvDextro(a?.dextro != null ? String(a.dextro) : '')
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
                        {a.dextro && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5',
                              f.dextro
                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/25'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            <Droplets className="size-2.5 mr-0.5 inline text-primary" />
                            Dextro {a.dextro}
                          </Badge>
                        )}
                      </div>
                      {a.fotos && a.fotos.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-primary font-semibold">
                          <Camera className="size-3" />
                          <span>{a.fotos.length} foto(s) comprovada(s)</span>
                        </div>
                      )}
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
                      <DialogTitle className="text-lg font-bold font-heading truncate flex items-center gap-2 flex-wrap">
                        <span>{modal.presc.med}</span>
                        {isMedicamentoControlado(modal.presc) && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-semibold gap-1 inline-flex items-center"
                          >
                            <ShieldAlert className="size-3 text-amber-600 dark:text-amber-400" />
                            Controlado (Portaria 344)
                          </Badge>
                        )}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        {modalRes.nome} · Quarto {modalRes.quarto} · Horário {modal.hora}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <Allergy alergias={modalRes.alergias} />

                  {isMedicamentoControlado(modal.presc) && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
                      <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>
                        <strong>Atenção:</strong> Medicamento sujeito a controle especial. Conferir receita, dosagem e registro de saída.
                      </span>
                    </div>
                  )}

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
                <SearchableSelect
                  id="snRes"
                  value={snResId}
                  onValueChange={(novoId) => {
                    setSnResId(novoId)
                    const r = data.getResidente(novoId)
                    setSnPrescId(r?.presc[0]?.id || '')
                  }}
                  placeholder="Selecione o residente..."
                  searchPlaceholder="Buscar por nome ou quarto..."
                  options={[...ativos(data.residentes)]
                    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                    .map((r) => ({
                      value: r.id,
                      label: `${r.nome} (Quarto ${r.quarto})`,
                      keywords: [r.quarto || ''],
                    }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="snPresc" className="text-[11px] font-semibold">Medicamento Prescrito *</Label>
                <SearchableSelect
                  id="snPresc"
                  value={snPrescId}
                  onValueChange={setSnPrescId}
                  placeholder="Selecione o medicamento..."
                  searchPlaceholder="Buscar prescrição..."
                  emptyMessage="Nenhuma prescrição encontrada para este residente"
                  options={[...(data.getResidente(snResId)?.presc ?? [])]
                    .sort((a, b) => a.med.localeCompare(b.med, 'pt-BR'))
                    .map((p) => ({
                      value: p.id,
                      label: `${isMedicamentoControlado(p) ? '⚠️ [CONTROLADO] ' : ''}${p.med}`,
                      description: `${p.dose} - ${p.via} [${p.tipo.toUpperCase()}]`,
                      keywords: [p.med, p.via, p.tipo],
                    }))}
                />
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
                <SearchableSelect
                  id="ocoRes"
                  value={ocoResId}
                  onValueChange={setOcoResId}
                  placeholder="Selecione o residente..."
                  searchPlaceholder="Buscar por nome ou quarto..."
                  options={[...ativos(data.residentes)]
                    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                    .map((r) => ({
                      value: r.id,
                      label: `${r.nome} (Quarto ${r.quarto})`,
                      keywords: [r.quarto || ''],
                    }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ocoTipo" className="text-[11px] font-semibold">Tipo de Evento Sentinela *</Label>
                <SearchableSelect
                  id="ocoTipo"
                  value={ocoTipo}
                  onValueChange={(v) => setOcoTipo(v as EventoTipo)}
                  placeholder="Selecione o evento..."
                  searchPlaceholder="Buscar tipo de evento..."
                  options={[
                    { value: 'obito', label: 'Declaração de Óbito' },
                    { value: 'desidratacao', label: 'Desidratação clínica' },
                    { value: 'desnutricao', label: 'Desnutrição moderada / grave' },
                    { value: 'dda', label: 'Doença Diarreica Aguda (DDA)' },
                    { value: 'lpp', label: 'Lesão por Pressão (LPP)' },
                    { value: 'queda', label: 'Queda da própria altura / leito' },
                    { value: 'escabiose', label: 'Surto / Suspeita de Escabiose' },
                  ]}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ocoRel" className="text-[11px] font-semibold">Relato Circunstancial e Conduta Imediata</Label>
                <textarea
                  id="ocoRel"
                  rows={3}
                  value={ocoRelato}
                  onChange={(e) => setOcoRelato(e.target.value)}
                  placeholder="Descreva o que ocorreu, socorro prestado, acionamento do SAMU ou médico assistente..."
                  className="w-full text-xs rounded-md border border-input bg-background p-2 focus-visible:outline-ring resize-none min-h-[80px]"
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
                      onChange={(e) => setSsvvPa(mascaraPA(e.target.value))}
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
                  <Label className="text-[10px] text-primary font-semibold flex items-center gap-1">
                    <Droplets className="size-2.5 text-primary" />
                    Dextro / Glicemia Capilar (mg/dL) (opcional)
                  </Label>
                  <Input
                    value={ssvvDextro}
                    onChange={(e) => setSsvvDextro(e.target.value)}
                    placeholder="Ex: 110 (opcional)"
                    className="h-8 text-xs font-mono border-primary/30"
                  />
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

      {/* Modal: Comprovação Fotográfica de Cuidados (Decúbito / Curativos) */}
      <Dialog open={!!modalFotoCuidado} onOpenChange={(v) => !v && setModalFotoCuidado(null)}>
        <DialogContent className="max-w-md">
          {modalFotoCuidado && (
            <form onSubmit={handleSalvarFotoCuidado}>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Camera className="size-4 text-[#123F4A]" />
                  Comprovar Cuidado com Foto
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {modalFotoCuidado.r.nome} · Quarto {modalFotoCuidado.r.quarto}
                  {modalFotoCuidado.horario ? ` · Horário: ${modalFotoCuidado.horario}` : ''}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
                  <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Cuidado a ser comprovado:</span>
                  <span className="font-bold text-foreground mt-0.5 block">{modalFotoCuidado.c.texto}</span>
                </div>

                {/* Upload / Câmera */}
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-[11px] flex items-center gap-1">
                      <Camera className="size-3 text-primary" />
                      Captura da Evidência Fotográfica
                    </span>
                    <span className="text-[10px] text-muted-foreground">Prova p/ família</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 bg-background hover:bg-primary/10 text-primary text-xs font-semibold transition-colors">
                      <Camera className="size-4" />
                      <span>Tirar Foto (Câmera)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        disabled={processandoFotoCuidado}
                        onChange={handleFotoCuidadoChange}
                        className="sr-only"
                      />
                    </label>

                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground text-xs font-medium transition-colors">
                      <ImageIcon className="size-4" />
                      <span>Galeria</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={processandoFotoCuidado}
                        onChange={handleFotoCuidadoChange}
                        className="sr-only"
                      />
                    </label>

                    {processandoFotoCuidado && (
                      <span className="text-[11px] text-primary flex items-center gap-1 animate-pulse font-medium">
                        <RefreshCw className="size-3 animate-spin" /> Carregando...
                      </span>
                    )}
                  </div>

                  {fotoCuidado && (
                    <div className="relative rounded-lg overflow-hidden border border-border/80 mt-2 bg-black/5 flex items-center justify-center max-h-48">
                      <img src={fotoCuidado} alt="Foto comprovante" className="max-h-48 w-auto object-contain" />
                      <button
                        type="button"
                        onClick={() => setFotoCuidado('')}
                        className="absolute top-1 right-1 size-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs hover:bg-rose-700 shadow-sm cursor-pointer"
                        title="Trocar foto"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold">Observações / Detalhes do Cuidado</Label>
                  <Input
                    value={fotoCuidadoTexto}
                    onChange={(e) => setFotoCuidadoTexto(e.target.value)}
                    placeholder="Ex: Mudança de decúbito lateral direito realizada, pele íntegra..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => setModalFotoCuidado(null)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={salvandoFotoCuidado || processandoFotoCuidado || !fotoCuidado}
                  className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold gap-1.5"
                >
                  {salvandoFotoCuidado ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5" /> Salvar & Checar {modalFotoCuidado.horario ? `Horário ${modalFotoCuidado.horario}` : 'Cuidado'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Passagem de Plantão da Equipe */}
      <Dialog open={modalPassagem} onOpenChange={setModalPassagem}>
        <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto">
          <form onSubmit={handleSalvarPassagem}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <ClipboardList className="size-4 text-[#123F4A]" />
                Passagem de Plantão da Equipe
              </DialogTitle>
              <DialogDescription className="text-xs">
                Transferência formal de responsabilidade entre cuidadores e enfermagem.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {/* Resumo Automático Computado pelo Sistema */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                <span className="font-bold text-foreground text-[11px] block uppercase tracking-wide">
                  Panorama Automático do Plantão Atual
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-card border border-border/70 text-center">
                    <span className="text-[10px] text-muted-foreground block">Medicações</span>
                    <span className="font-bold text-xs text-foreground">
                      {resumoPlantao.dosesChecadas}/{resumoPlantao.dosesTotal}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-card border border-border/70 text-center">
                    <span className="text-[10px] text-muted-foreground block">Cuidados / Decúbito</span>
                    <span className="font-bold text-xs text-foreground">
                      {resumoPlantao.cuidadosChecados}/{resumoPlantao.cuidadosTotal}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-card border border-border/70 text-center">
                    <span className="text-[10px] text-muted-foreground block">Intercorrências</span>
                    <span
                      className={cn(
                        'font-bold text-xs',
                        resumoPlantao.ocorrenciasHoje > 0 ? 'text-amber-600' : 'text-emerald-600'
                      )}
                    >
                      {resumoPlantao.ocorrenciasHoje} hoje
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-card border border-border/70 text-center">
                    <span className="text-[10px] text-muted-foreground block">Alertas Graves</span>
                    <span
                      className={cn(
                        'font-bold text-xs',
                        alertasCriticosRT.length > 0 ? 'text-rose-600' : 'text-emerald-600'
                      )}
                    >
                      {alertasCriticosRT.length} pendentes
                    </span>
                  </div>
                </div>
              </div>

              {/* Turno e Profissionais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Turno que está sendo entregue *</Label>
                  <SearchableSelect
                    value={passagemTurno}
                    onValueChange={(v) => setPassagemTurno(v as TurnoPlantao)}
                    placeholder="Selecione o turno..."
                    searchPlaceholder="Buscar turno..."
                    options={TURNOS_PLANTAO.map((t) => ({
                      value: t.key,
                      label: `${t.label} (${t.horario})`,
                    }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Profissional / Equipe que assume</Label>
                  <SearchableSelect
                    value={passagemRecebidoPor}
                    onValueChange={setPassagemRecebidoPor}
                    placeholder="Equipe Geral do Próximo Turno"
                    searchPlaceholder="Buscar profissional..."
                    allowClear
                    clearLabel="Equipe Geral do Próximo Turno"
                    options={[...data.equipe]
                      .filter((p) => p.id !== profissional?.id)
                      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                      .map((p) => ({
                        value: p.id,
                        label: p.nome,
                        description: p.funcao || p.cat,
                        keywords: [p.funcao || '', p.cat || ''],
                      }))}
                  />
                </div>
              </div>

              {/* Modelos rápidos */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground font-semibold block">
                  Modelos de relato rápido (clique para acrescentar):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {MODELOS_PASSAGEM.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setPassagemRelato((prev) => (prev ? `${prev}\n${m}` : m))
                      }
                      className="px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-[10px] text-muted-foreground hover:text-foreground text-left max-w-xs truncate border border-border/40 cursor-pointer"
                    >
                      + {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Relato Principal */}
              <div className="space-y-1">
                <Label htmlFor="relatoPlantao" className="text-[11px] font-semibold">
                  Relato Geral do Plantão *
                </Label>
                <textarea
                  id="relatoPlantao"
                  value={passagemRelato}
                  onChange={(e) => setPassagemRelato(e.target.value)}
                  rows={4}
                  required
                  placeholder="Descreva como foi o turno: alimentação, hidratação, sono/repouso, comportamento dos residentes, ocorrências e procedimentos..."
                  className="w-full text-xs rounded-md border border-input bg-background p-2.5 focus-visible:outline-ring leading-relaxed resize-none min-h-[96px]"
                />
              </div>

              {/* Pendências e Recomendações */}
              <div className="space-y-1">
                <Label htmlFor="pendenciasPlantao" className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  Pendências e Atenções para o Próximo Turno
                </Label>
                <textarea
                  id="pendenciasPlantao"
                  value={passagemPendencias}
                  onChange={(e) => setPassagemPendencias(e.target.value)}
                  rows={2}
                  placeholder="Ex: Residente Iracema em observação de febre; lembrar de checar dextro às 20h; fraldas repostas no quarto 2..."
                  className="w-full text-xs rounded-md border border-amber-500/40 bg-amber-500/5 p-2 focus-visible:outline-ring resize-none min-h-[64px]"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 text-[10px] text-muted-foreground">
                Assinatura formal eletrônica: <strong>{profissional?.nome}</strong> ({profissional?.funcao || 'Plantão'}) às {agoraHM()} do dia {T}.
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalPassagem(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvandoPassagem}
                className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold gap-1.5"
              >
                <CheckCircle2 className="size-3.5" />
                {salvandoPassagem ? 'Assinando...' : 'Assinar & Entregar Plantão'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Histórico de Passagens de Plantão */}
      <Dialog open={modalHistoricoPassagens} onOpenChange={setModalHistoricoPassagens}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="size-4 text-[#123F4A]" />
              Histórico de Passagens de Plantão
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registros e transferências de turno dos cuidadores e enfermagem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            {data.passagens.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                Nenhuma passagem de plantão registrada até o momento.
              </div>
            ) : (
              data.passagens.map((p) => (
                <div key={p.id} className="p-3.5 rounded-xl border border-border/70 bg-card shadow-2xs space-y-2">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold bg-primary/10 text-primary border-primary/25">
                        Turno {p.turno}
                      </Badge>
                      <span className="font-bold text-foreground">
                        {fmt(p.data)} às {p.hora}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Passado por: <strong>{p.passadoPor.nome}</strong>
                    </span>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-line bg-muted/20 p-2.5 rounded-lg border border-border/40">
                    {p.relato}
                  </p>

                  {p.pendencias && (
                    <div className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
                      <strong>Pendências / Alertas:</strong> {p.pendencias}
                    </div>
                  )}

                  {p.resumo && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 flex-wrap">
                      <span>Doses: {p.resumo.dosesChecadas}/{p.resumo.dosesTotal}</span>
                      <span>·</span>
                      <span>Cuidados: {p.resumo.cuidadosChecados}/{p.resumo.cuidadosTotal}</span>
                      <span>·</span>
                      <span>Ocorrências: {p.resumo.ocorrenciasHoje}</span>
                      {p.recebidoPor && (
                        <>
                          <span>·</span>
                          <span>Assumiu: <strong>{p.recebidoPor.nome}</strong></span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Novo Comunicado da RT (Egle) para a Equipe */}
      <Dialog open={modalNovoAviso} onOpenChange={setModalNovoAviso}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSalvarAviso}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Megaphone className="size-4 text-amber-600" />
                Novo Comunicado da RT para a Equipe
              </DialogTitle>
              <DialogDescription className="text-xs">
                Dispare um alerta ou instrução técnica imediata para todos os cuidadores e enfermagem.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="avisoTitulo" className="text-[11px] font-semibold">Título do Comunicado *</Label>
                <Input
                  id="avisoTitulo"
                  value={avisoTitulo}
                  onChange={(e) => setAvisoTitulo(e.target.value)}
                  required
                  placeholder="Ex: Atenção ao protocolo de decúbito / Alerta de hidratação..."
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Prioridade do Comunicado</Label>
                <SearchableSelect
                  value={avisoPrioridade}
                  onValueChange={(v) => setAvisoPrioridade(v as PrioridadeAviso)}
                  placeholder="Selecione a prioridade..."
                  searchPlaceholder="Buscar prioridade..."
                  options={[
                    { value: 'geral', label: 'Geral', description: 'Aviso informativo' },
                    { value: 'importante', label: 'Importante', description: 'Atenção redobrada' },
                    { value: 'urgente', label: 'Urgente', description: 'Alerta crítico com prioridade alta' },
                  ]}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="avisoMsg" className="text-[11px] font-semibold">Mensagem Completa *</Label>
                <textarea
                  id="avisoMsg"
                  value={avisoMensagem}
                  onChange={(e) => setAvisoMensagem(e.target.value)}
                  rows={4}
                  required
                  placeholder="Descreva a instrução técnica ou aviso que toda a equipe deve cumprir..."
                  className="w-full text-xs rounded-md border border-input bg-background p-2.5 focus-visible:outline-ring leading-relaxed resize-none min-h-[96px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalNovoAviso(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvandoAviso}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5"
              >
                <Send className="size-3.5" />
                {salvandoAviso ? 'Enviando...' : 'Disparar para a Equipe'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
