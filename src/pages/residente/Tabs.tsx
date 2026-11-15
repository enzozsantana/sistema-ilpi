import { useState } from 'react'
import { AREAS, CATS_ARQ, DOCS, MODELOS_ANOT, TIPOS_PRESC } from '../../lib/constants'
import { agoraHM, fmt, idade, iso } from '../../lib/business/dates'
import { consumoDia, diasRest, nivelEst } from '../../lib/business/estoque'
import { SCALES, totalEsc, ultAval } from '../../lib/business/escalas'
import { presAtiva, freqTxt as freqTxtMed } from '../../lib/business/medication'
import { flags } from '../../lib/business/ssvv'
import { can, canAval, canTab, escalasVisiveis } from '../../lib/permissions'
import { supabase } from '../../lib/supabase'
import { useIlpiData } from '../../contexts/IlpiDataContext'
import { useAuth } from '../../contexts/AuthContext'
import type { AbaResidente, Categoria, EscalaKey, Residente, StatusResidente } from '../../types/ilpi'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { StatusBadge, Allergy } from '../../components/Ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Activity,
  CheckCircle2,
  Clock,
  Edit3,
  FileCheck,
  FileText,
  HeartPulse,
  Package,
  Pill,
  Plus,
  Trash2,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const T = iso(new Date())

type Ctx = {
  r: Residente
  cat: Categoria
  area?: string
  profNome: (id?: string) => string
}

const RTABS: Record<AbaResidente, string> = {
  pasta: 'Resumo Clínico',
  ficha: 'Ficha Cadastral',
  aval: 'Escalas & Avaliações',
  pia: 'PIA Enfermagem',
  cuidados: 'Plano de Cuidados',
  presc: 'Prescrição Médica',
  anot: 'Anotações & Sinais',
  evol: 'Evolução Multiprofissional',
  arquivos: 'Exames & Documentos',
  estoque: 'Estoque do Residente',
  tudo: 'Prontuário Completo',
}

export function tabsVisiveis(cat: Categoria, area?: string): AbaResidente[] {
  return (Object.keys(RTABS) as AbaResidente[]).filter((k) => {
    if (!canTab(cat, k)) return false
    if (k === 'aval' && cat === 'multi' && escalasVisiveis(cat, area).length === 0) return false
    return true
  })
}

export { RTABS }

/* ==========================================================================
   TAB 1: PASTA (Resumo Clínico)
   ========================================================================== */
export function TabPasta({ r, profNome }: Ctx) {
  const fug = ultAval(r, 'fugulin')
  const g = fug ? SCALES.fugulin.classif(totalEsc('fugulin', fug.resp)).grau : undefined
  const meds = r.presc.filter((p) => presAtiva(p, T))
  const ultA = [...r.anot].sort((a, b) => (b.sig.d + b.sig.h).localeCompare(a.sig.d + a.sig.h))[0]
  const ultFlags = ultA ? flags(ultA) : {}

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border border-border/70 shadow-2xs">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <User className="size-4 text-primary" />
            Identificação do Residente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div>
              <dt className="text-muted-foreground font-medium">Nascimento</dt>
              <dd className="font-semibold text-foreground mt-0.5">{fmt(r.nasc)} ({idade(r.nasc)} anos)</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Acomodação</dt>
              <dd className="font-semibold text-foreground mt-0.5">Quarto {r.quarto}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Data de Acolhimento</dt>
              <dd className="font-semibold text-foreground mt-0.5">{fmt(r.admissao)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Plano / Convênio</dt>
              <dd className="font-semibold text-foreground mt-0.5">{(r.convenio as string | undefined) || 'Particular'}</dd>
            </div>
          </dl>
          {r.alergias && (
            <div className="mt-4 pt-3 border-t border-border/40">
              <span className="text-[11px] text-muted-foreground font-medium block mb-1">Alergias Documentadas:</span>
              <Allergy alergias={r.alergias} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border/70 shadow-2xs">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Classificação & Cuidados
            </span>
            {g && (
              <StatusBadge tone={g === 1 ? 'ok' : g === 2 ? 'warn' : 'danger'}>
                Grau {g} (RDC 502)
              </StatusBadge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3 text-xs">
          <div>
            <span className="text-muted-foreground font-medium block">Diagnósticos Crônicos:</span>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {(Array.isArray(r.doencas) ? (r.doencas as string[]) : []).map((d, i) => (
                <Badge key={i} variant="secondary" className="text-[11px]">
                  {d}
                </Badge>
              ))}
              {!r.doencas?.length && <span className="text-muted-foreground italic">Nenhum registrado</span>}
            </div>
          </div>
          {r.outras ? (
            <div>
              <span className="text-muted-foreground font-medium block">Outras observações clínicas:</span>
              <p className="text-foreground mt-0.5">{String(r.outras)}</p>
            </div>
          ) : null}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-muted-foreground">
            <span>Médico Assistente:</span>
            <span className="font-semibold text-foreground">{profNome(r.medico ? String(r.medico) : undefined)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/70 shadow-2xs">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Pill className="size-4 text-primary" />
              Medicações Ativas no Plantão
            </span>
            <Badge variant="secondary" className="text-xs">
              {meds.length} ativas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {meds.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
              <span className="font-semibold text-foreground">{p.med}</span>
              <span className="text-muted-foreground">{freqTxtMed(p)} ({p.via})</span>
            </div>
          ))}
          {meds.length > 5 && (
            <span className="text-[11px] text-muted-foreground text-center block pt-1">
              + {meds.length - 5} outros medicamentos na aba de prescrição
            </span>
          )}
          {!meds.length && (
            <p className="text-xs text-muted-foreground italic">Nenhuma medicação ativa no momento.</p>
          )}
        </CardContent>
      </Card>

      {ultA && (
        <Card className="border border-border/70 shadow-2xs">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <HeartPulse className="size-4 text-primary" />
                Últimos Sinais Vitais Aferidos
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                {fmt(ultA.sig.d)} às {ultA.sig.h}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {ultA.pa && (
                <Badge variant="outline" className={cn('text-xs font-semibold px-2 py-0.5', ultFlags.pa ? 'bg-rose-500/10 text-rose-600 border-rose-500/25' : 'bg-muted')}>
                  PA {ultA.pa}
                </Badge>
              )}
              {ultA.temp != null && (
                <Badge variant="outline" className={cn('text-xs font-semibold px-2 py-0.5', ultFlags.temp ? 'bg-rose-500/10 text-rose-600 border-rose-500/25' : 'bg-muted')}>
                  T {ultA.temp} °C
                </Badge>
              )}
              {ultA.pulso != null && (
                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 bg-muted">
                  P {ultA.pulso} bpm
                </Badge>
              )}
              {ultA.sat != null && (
                <Badge variant="outline" className={cn('text-xs font-semibold px-2 py-0.5', ultFlags.sat ? 'bg-rose-500/10 text-rose-600 border-rose-500/25' : 'bg-muted')}>
                  Sat {ultA.sat}%
                </Badge>
              )}
            </div>
            {ultA.texto && (
              <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                "{ultA.texto}"
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ==========================================================================
   TAB 2: FICHA CADASTRAL & DOCUMENTOS (com edição e checklist interativo no Supabase)
   ========================================================================== */
export function TabFicha({ r, cat }: Ctx) {
  const data = useIlpiData()
  const pref = (r.pref ?? {}) as Record<string, string>
  const [modalEditar, setModalEditar] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Edit fields
  const [quarto, setQuarto] = useState(r.quarto ? String(r.quarto) : '')
  const [convenio, setConvenio] = useState(r.convenio ? String(r.convenio) : 'Particular')
  const [status, setStatus] = useState<StatusResidente>(r.status || 'ativo')
  const [alergias, setAlergias] = useState(r.alergias ? String(r.alergias) : '')
  const [outras, setOutras] = useState(r.outras ? String(r.outras) : '')
  const [respNome, setRespNome] = useState(r.responsavel?.nome || '')
  const [respPar, setRespPar] = useState(r.responsavel?.parentesco || '')
  const [respTel, setRespTel] = useState(r.responsavel?.tel || '')

  async function handleSalvarFicha(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const { error } = await supabase
      .from('residentes')
      .update({
        quarto: quarto.trim(),
        convenio: convenio.trim(),
        status,
        alergias: alergias.trim(),
        outras: outras.trim(),
        responsavel: {
          nome: respNome.trim(),
          parentesco: respPar.trim(),
          tel: respTel.trim(),
        },
      })
      .eq('id', r.id)
    setSalvando(false)

    if (error) {
      toast.error('Erro ao atualizar no Supabase: ' + error.message)
      return
    }

    toast.success('Ficha cadastral atualizada no Supabase!')
    setModalEditar(false)
    await data.refresh()
  }

  async function toggleDocumento(chave: string) {
    const atual = !!r.docs?.[chave]
    const novosDocs = { ...(r.docs || {}), [chave]: !atual }
    const { error } = await supabase.from('residentes').update({ docs: novosDocs }).eq('id', r.id)
    if (error) {
      toast.error('Erro ao atualizar documento: ' + error.message)
      return
    }
    toast.success(`Documento "${chave.toUpperCase()}" ${!atual ? 'marcado como entregue' : 'marcado como pendente'}!`)
    await data.refresh()
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border/70 shadow-2xs">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <User className="size-4 text-primary" />
            Dados Pessoais & Contatos de Emergência
          </CardTitle>
          {can(cat, 'gerir') && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => setModalEditar(true)}
              className="gap-1.5 rounded-lg text-xs font-semibold"
            >
              <Edit3 className="size-3" />
              Editar Ficha
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium block">Nome Completo</span>
              <span className="font-semibold text-foreground text-sm block">{r.nome}</span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium block">Acomodação</span>
              <span className="font-semibold text-foreground block">Quarto {r.quarto}</span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium block">Idade</span>
              <span className="font-semibold text-foreground block">{idade(r.nasc)} anos ({fmt(r.nasc)})</span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium block">Status</span>
              <StatusBadge tone={r.status === 'ativo' ? 'ok' : 'danger'}>
                {r.status === 'ativo' ? 'Ativo na Instituição' : r.status === 'obito' ? 'Óbito' : 'Inativo / Transferido'}
              </StatusBadge>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium block">Responsável Familiar</span>
              <span className="font-semibold text-foreground block">{r.responsavel?.nome ?? '–'}</span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium block">Parentesco</span>
              <span className="font-semibold text-foreground block">{r.responsavel?.parentesco ?? '–'}</span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium block">Telefone de Contato</span>
              <span className="font-semibold text-foreground block">{r.responsavel?.tel ?? '–'}</span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium block">Convênio</span>
              <span className="font-semibold text-foreground block">{(r.convenio as string) || 'Particular'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist de Documentos Obrigatórios com Toggle Interativo */}
      <Card className="border border-border/70 shadow-2xs">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileCheck className="size-4 text-primary" />
              Checklist de Documentos Entregues (RDC 502)
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              Clique em um documento para alternar seu status no Supabase
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {DOCS.map(([k, label]) => {
              const entregue = !!r.docs?.[k]
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => void toggleDocumento(k)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer hover:shadow-xs',
                    entregue
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                      : 'bg-muted/30 border-border/70 text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <span className="font-semibold">{label}</span>
                  <Badge
                    variant={entregue ? 'outline' : 'secondary'}
                    className={cn(
                      'text-[10px] gap-1',
                      entregue && 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-white/50 dark:bg-card'
                    )}
                  >
                    {entregue && <CheckCircle2 className="size-3 text-emerald-600" />}
                    {entregue ? 'Entregue' : 'Pendente'}
                  </Badge>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preferências e Hábitos */}
      {Object.keys(pref).length > 0 && (
        <Card className="border border-border/70 shadow-2xs">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <CardTitle className="text-sm font-bold">Preferências e Hábitos de Vida (Árvore do Vínculo)</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {Object.entries(pref).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <dt className="font-bold text-foreground capitalize mb-1">{k}</dt>
                  <dd className="text-muted-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Modal Editar Ficha Cadastral */}
      <Dialog open={modalEditar} onOpenChange={setModalEditar}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSalvarFicha}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit3 className="size-4 text-[#123F4A]" />
                Editar Ficha de {r.nome}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Atualize os dados cadastrais, quarto ou contatos de emergência no Supabase.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="eq" className="text-[11px] font-semibold">Quarto / Leito</Label>
                  <Input id="eq" value={quarto} onChange={(e) => setQuarto(e.target.value)} required className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="es" className="text-[11px] font-semibold">Status do Residente</Label>
                  <select
                    id="es"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusResidente)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="obito">Óbito</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="econv" className="text-[11px] font-semibold">Convênio / Pagador</Label>
                <Input id="econv" value={convenio} onChange={(e) => setConvenio(e.target.value)} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="eal" className="text-[11px] font-semibold text-rose-600">Alergias Documentadas</Label>
                <Input id="eal" value={alergias} onChange={(e) => setAlergias(e.target.value)} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="eout" className="text-[11px] font-semibold">Outras Observações Clínicas</Label>
                <Input id="eout" value={outras} onChange={(e) => setOutras(e.target.value)} className="h-8 text-xs" />
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                <span className="font-bold text-foreground block text-[11px]">Responsável Familiar</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 space-y-1">
                    <Label className="text-[10px]">Nome</Label>
                    <Input value={respNome} onChange={(e) => setRespNome(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Parentesco</Label>
                    <Input value={respPar} onChange={(e) => setRespPar(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Telefone</Label>
                    <Input value={respTel} onChange={(e) => setRespTel(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalEditar(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={salvando} className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white">
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ==========================================================================
   TAB 3: ESCALAS & AVALIAÇÕES (com aplicação interativa e persistência no Supabase)
   ========================================================================== */
export function TabAval({ r, cat, area }: Ctx) {
  const data = useIlpiData()
  const { profissional } = useAuth()
  const keys = escalasVisiveis(cat, area)

  const [modalAval, setModalAval] = useState(false)
  const [escalaEscolhida, setEscalaEscolhida] = useState<EscalaKey>(keys[0] || 'fugulin')
  const [respostas, setRespostas] = useState<number[]>([])
  const [salvando, setSalvando] = useState(false)

  function abrirModal(k: EscalaKey) {
    setEscalaEscolhida(k)
    const def = SCALES[k]
    setRespostas(new Array(def.itens.length).fill(0))
    setModalAval(true)
  }

  const defAtual = SCALES[escalaEscolhida]
  const totalCalculado = defAtual ? totalEsc(escalaEscolhida, respostas) : 0
  const classifCalculada = defAtual ? defAtual.classif(totalCalculado) : null

  async function handleSalvarAvaliacao() {
    if (!profissional) return
    setSalvando(true)
    const id = 'av_' + Math.random().toString(36).substring(2, 9)
    const { error } = await supabase.from('avaliacoes').insert({
      id,
      residente_id: r.id,
      escala: escalaEscolhida,
      data: T,
      respostas,
      assinatura: { id: profissional.id, d: T, h: agoraHM() },
    })
    setSalvando(false)

    if (error) {
      toast.error('Erro ao salvar avaliação no Supabase: ' + error.message)
      return
    }

    toast.success(`Avaliação ${defAtual.nome} salva no Supabase com sucesso!`)
    setModalAval(false)
    await data.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Escalas Clínicas Padronizadas (RDC 502)</h3>
          <p className="text-xs text-muted-foreground">Avaliações de dependência, risco de queda, lesão por pressão e estado nutricional.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {keys.map((k) => {
          if (!canAval(cat, area, k)) return null
          const lista = r.aval.filter((a) => a.esc === k)
          const ult = lista[lista.length - 1]
          const total = ult ? totalEsc(k, ult.resp) : 0
          const cl = ult ? SCALES[k].classif(total) : null

          return (
            <Card key={k} className="border border-border/70 shadow-2xs flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-sm font-bold flex items-center justify-between">
                    <span>{SCALES[k].nome}</span>
                    {ult && cl && (
                      <Badge variant="outline" className={cn('text-xs font-semibold', cl.nivel === 'danger' ? 'bg-rose-500/10 text-rose-600 border-rose-500/25' : cl.nivel === 'warn' ? 'bg-amber-500/10 text-amber-600 border-amber-500/25' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25')}>
                        {cl.txt}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-xs">
                  <p className="text-muted-foreground">{SCALES[k].desc}</p>
                  {ult ? (
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-muted-foreground">
                      <span>Última avaliação: <b>{fmt(ult.d)}</b></span>
                      <span>Pontuação: <b>{total}</b></span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic pt-2 border-t border-border/40">
                      Nenhuma avaliação lançada nesta escala.
                    </p>
                  )}
                </CardContent>
              </div>

              <div className="p-3 border-t border-border/40 bg-muted/10">
                <Button
                  size="xs"
                  onClick={() => abrirModal(k)}
                  className="w-full gap-1.5 text-xs font-semibold bg-[#123F4A] hover:bg-[#123F4A]/90 text-white"
                >
                  <Plus className="size-3" />
                  Aplicar Nova {SCALES[k].nome}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Modal de Aplicação da Escala */}
      <Dialog open={modalAval} onOpenChange={setModalAval}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>Aplicar Escala {defAtual?.nome} — {r.nome}</span>
              {classifCalculada && (
                <Badge variant="outline" className={cn('text-xs font-semibold', classifCalculada.nivel === 'danger' ? 'bg-rose-500/10 text-rose-600' : classifCalculada.nivel === 'warn' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600')}>
                  {classifCalculada.txt} ({totalCalculado} pts)
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {defAtual?.desc}. Selecione a resposta para cada item avaliado à beira-leito.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {defAtual?.itens.map(([pergunta, opcoes], idx) => {
              const valorAtual = respostas[idx] ?? 0
              return (
                <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                  <span className="font-semibold text-foreground block">
                    {idx + 1}. {pergunta}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {opcoes.map(([opcaoTexto, pontos], optIdx) => {
                      const selecionado = valorAtual === pontos
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => {
                            const clone = [...respostas]
                            clone[idx] = pontos
                            setRespostas(clone)
                          }}
                          className={cn(
                            'p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between gap-2',
                            selecionado
                              ? 'bg-[#123F4A] text-white border-[#123F4A] font-semibold'
                              : 'bg-background hover:bg-muted text-muted-foreground'
                          )}
                        >
                          <span className="truncate">{opcaoTexto}</span>
                          <span className="text-[10px] opacity-75 shrink-0">+{pontos}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              Total: {totalCalculado} pontos
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalAval(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={salvando}
                onClick={() => void handleSalvarAvaliacao()}
                className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold"
              >
                {salvando ? 'Salvando...' : 'Salvar e Assinar Avaliação'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ==========================================================================
   TAB 4: PIA (Plano Individual de Atendimento)
   ========================================================================== */
export function TabPia({ r, cat }: Ctx) {
  const data = useIlpiData()
  const { profissional } = useAuth()
  const p = r.pia[r.pia.length - 1]

  const [modalNovo, setModalNovo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [periodo, setPeriodo] = useState('Semestral')
  const [inicio, setInicio] = useState(T)
  const [reav, setReav] = useState('')
  const [necessidades, setNecessidades] = useState<string[]>([
    'Autonomia e autocuidado',
    'Manejo de doenças crônicas',
  ])
  const [obs, setObs] = useState('')
  const [encaminhamentos, setEncaminhamentos] = useState('')

  const opcoesNecessidades = [
    'Autonomia e autocuidado',
    'Manejo de doenças crônicas',
    'Prevenção de quedas e mobilidade',
    'Estimulação cognitiva e memória',
    'Suporte nutricional / hidratação',
    'Integração social e lazer',
    'Apoio emocional / psicológico',
  ]

  function toggleNec(item: string) {
    setNecessidades((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    )
  }

  async function handleSalvarPia(e: React.FormEvent) {
    e.preventDefault()
    if (!profissional) {
      toast.error('Profissional não identificado.')
      return
    }

    setSalvando(true)
    const id = `pia_${Date.now()}`
    const sig = { id: profissional.id, d: T, h: agoraHM() }

    const { error } = await supabase.from('pias').insert({
      id,
      residente_id: r.id,
      periodo: periodo.trim() || 'Semestral',
      inicio,
      reavaliacao: reav || null,
      necessidades,
      obs: obs.trim() || null,
      encaminhamentos: encaminhamentos.trim() || null,
      assinatura: sig,
    })

    setSalvando(false)
    if (error) {
      toast.error(`Erro ao salvar PIA: ${error.message}`)
      return
    }

    toast.success('Plano Individual de Atendimento (PIA) registrado com sucesso!')
    setModalNovo(false)
    await data.refresh()
  }

  return (
    <Card className="border border-border/70 shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <HeartPulse className="size-4 text-primary" />
          Plano Individual de Atendimento (PIA — RDC 502)
        </CardTitle>
        {can(cat, 'gerir') && (
          <Button
            size="sm"
            onClick={() => {
              setPeriodo('Semestral')
              setInicio(T)
              setReav('')
              setObs(p?.obs || '')
              setEncaminhamentos(p?.encaminhamentos || '')
              setModalNovo(true)
            }}
            className="rounded-xl gap-1.5 text-xs h-8"
          >
            <Plus className="size-3.5" /> Elaborar / Atualizar PIA
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-5">
        {!p ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-xs text-muted-foreground italic">Nenhum PIA vigente cadastrado para este residente.</p>
            {can(cat, 'gerir') && (
              <Button size="sm" variant="outline" onClick={() => setModalNovo(true)} className="rounded-xl text-xs">
                Criar Primeiro PIA
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-muted-foreground font-medium block text-[11px]">Período de Vigência</span>
                <span className="font-bold text-foreground text-sm block mt-0.5">
                  {p.periodo || 'Semestral'} (início em {fmt(p.inicio)})
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-muted-foreground font-medium block text-[11px]">Previsão de Reavaliação</span>
                <span className="font-bold text-foreground text-sm block mt-0.5">{fmt(p.reav)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-semibold text-foreground block">Necessidades Identificadas no Plano:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(p.necessidades ?? []).map((n, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {n}
                  </Badge>
                ))}
              </div>
            </div>

            {p.obs && (
              <div className="space-y-1 pt-2 border-t border-border/40">
                <span className="font-semibold text-foreground block">Observações Assistenciais:</span>
                <p className="text-muted-foreground leading-relaxed">{p.obs}</p>
              </div>
            )}

            {p.encaminhamentos && (
              <div className="space-y-1 pt-2 border-t border-border/40">
                <span className="font-semibold text-foreground block">Encaminhamentos Multiprofissionais:</span>
                <p className="text-muted-foreground leading-relaxed">{p.encaminhamentos}</p>
              </div>
            )}

            {p.sig && (
              <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                Responsável pelo PIA: <strong className="text-foreground">{data.profissionalPorId(p.sig.id)?.nome ?? 'Profissional'}</strong> ({fmt(p.sig.d)} às {p.sig.h})
              </div>
            )}
          </div>
        )}

        {/* Modal: Novo PIA */}
        <Dialog open={modalNovo} onOpenChange={setModalNovo}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HeartPulse className="size-5 text-primary" />
                Elaborar Plano Individual de Atendimento
              </DialogTitle>
              <DialogDescription className="text-xs">
                Plano multiprofissional obrigatório conforme a RDC 502/2021 da ANVISA.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSalvarPia} className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs">Período de Vigência *</Label>
                <Input
                  placeholder="ex: Semestral / 1º Semestre 2026"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Data de Início *</Label>
                  <Input
                    type="date"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Previsão de Reavaliação</Label>
                  <Input
                    type="date"
                    value={reav}
                    onChange={(e) => setReav(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Necessidades Identificadas</Label>
                <div className="flex flex-wrap gap-1.5">
                  {opcoesNecessidades.map((op) => {
                    const sel = necessidades.includes(op)
                    return (
                      <button
                        key={op}
                        type="button"
                        onClick={() => toggleNec(op)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                          sel
                            ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                            : 'bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted/70'
                        )}
                      >
                        {op}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Observações Assistenciais</Label>
                <textarea
                  rows={2}
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="ex: Residente lúcido, mantém capacidade de decisão..."
                  className="w-full text-xs rounded-xl border border-input bg-transparent px-3 py-2 shadow-2xs outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Encaminhamentos Multiprofissionais</Label>
                <Input
                  placeholder="ex: Fisioterapia motora 2x/sem, avaliação nutricional mensal"
                  value={encaminhamentos}
                  onChange={(e) => setEncaminhamentos(e.target.value)}
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalNovo(false)}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar PIA'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

/* ==========================================================================
   TAB 5: PLANO DE CUIDADOS (com adição e exclusão no Supabase)
   ========================================================================== */
export function TabCuidados({ r, cat }: Ctx) {
  const data = useIlpiData()
  const [modalNovo, setModalNovo] = useState(false)
  const [texto, setTexto] = useState('')
  const [quem, setQuem] = useState<'todos' | 'enfermagem' | 'cuidador'>('todos')
  const [salvando, setSalvando] = useState(false)

  async function handleSalvarCuidado(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    setSalvando(true)
    const id = `${r.id}_c_${Math.random().toString(36).substring(2, 7)}`
    const { error } = await supabase.from('cuidados').insert({
      id,
      residente_id: r.id,
      texto: texto.trim(),
      quem,
    })
    setSalvando(false)

    if (error) {
      toast.error('Erro ao adicionar cuidado: ' + error.message)
      return
    }

    toast.success('Cuidado adicionado ao plano!')
    setTexto('')
    setModalNovo(false)
    await data.refresh()
  }

  async function handleExcluirCuidado(cuidadoId: string) {
    const { error } = await supabase.from('cuidados').delete().eq('id', cuidadoId)
    if (error) {
      toast.error('Erro ao remover cuidado: ' + error.message)
      return
    }
    toast.success('Cuidado removido do plano!')
    await data.refresh()
  }

  return (
    <Card className="border border-border/70 shadow-2xs">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          Plano de Cuidados Diários
        </CardTitle>
        {can(cat, 'cuid') && (
          <Button
            size="xs"
            onClick={() => setModalNovo(true)}
            className="gap-1.5 rounded-lg text-xs font-semibold bg-[#123F4A] hover:bg-[#123F4A]/90 text-white"
          >
            <Plus className="size-3" />
            Adicionar Cuidado
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-5">
        {r.cuidados.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {r.cuidados.map((c) => (
              <div key={c.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[11px] font-bold">
                    •
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block">{c.texto}</span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Responsável: {c.quem === 'todos' ? 'Toda a equipe' : c.quem}
                    </span>
                  </div>
                </div>
                {can(cat, 'gerir') && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => void handleExcluirCuidado(c.id)}
                    className="size-6 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Nenhum cuidado cadastrado para este residente.</p>
        )}
      </CardContent>

      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSalvarCuidado}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Adicionar Cuidado Assistencial</DialogTitle>
              <DialogDescription className="text-xs">
                Este cuidado entrará nas rotinas diárias e na checagem de plantão do residente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="cuidTexto" className="text-[11px] font-semibold">Descrição do Cuidado *</Label>
                <Input
                  id="cuidTexto"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Ex: Mudança de decúbito de 2 em 2 horas..."
                  required
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cuidQuem" className="text-[11px] font-semibold">Executores Responsáveis</Label>
                <select
                  id="cuidQuem"
                  value={quem}
                  onChange={(e) => setQuem(e.target.value as 'todos' | 'enfermagem' | 'cuidador')}
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                >
                  <option value="todos">Toda a equipe</option>
                  <option value="enfermagem">Enfermagem</option>
                  <option value="cuidador">Cuidadores</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalNovo(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={salvando} className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold">
                {salvando ? 'Salvando...' : 'Adicionar ao Plano'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

/* ==========================================================================
   TAB 6: PRESCRIÇÃO MÉDICA (com cadastro, suspensão e reativação no Supabase)
   ========================================================================== */
export function TabPresc({ r, cat }: Ctx) {
  const data = useIlpiData()
  const { profissional } = useAuth()
  const [modalNova, setModalNova] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Form states
  const [med, setMed] = useState('')
  const [dose, setDose] = useState('')
  const [via, setVia] = useState('VO')
  const [tipo, setTipo] = useState<'diario' | 'sn' | 'dias' | 'intervalo'>('diario')
  const [horariosStr, setHorariosStr] = useState('08:00')
  const [obs, setObs] = useState('')

  async function handleSalvarPrescricao(e: React.FormEvent) {
    e.preventDefault()
    if (!med.trim() || !profissional) return

    setSalvando(true)
    const id = 'p_' + Math.random().toString(36).substring(2, 9)
    const horarios = horariosStr.split(',').map((s) => s.trim()).filter(Boolean)

    const { error } = await supabase.from('prescricoes').insert({
      id,
      residente_id: r.id,
      medicamento: med.trim(),
      dose: dose.trim() || '1 cp',
      via: via.trim(),
      tipo,
      horarios,
      dias: [],
      intervalo: 1,
      consumo: 1,
      item_estoque_id: null,
      inicio: T,
      fim: null,
      obs: obs.trim(),
      prescritor_id: profissional.id,
      suspensa: false,
      assinatura: { id: profissional.id, d: T, h: agoraHM() },
    })
    setSalvando(false)

    if (error) {
      toast.error('Erro ao cadastrar prescrição: ' + error.message)
      return
    }

    toast.success('Prescrição médica cadastrada com sucesso!')
    setModalNova(false)
    setMed('')
    setDose('')
    setHorariosStr('08:00')
    setObs('')
    await data.refresh()
  }

  async function handleToggleSuspender(prescId: string, suspensa: boolean) {
    const { error } = await supabase
      .from('prescricoes')
      .update({ suspensa: !suspensa })
      .eq('id', prescId)
    if (error) {
      toast.error('Erro ao alterar status da prescrição: ' + error.message)
      return
    }
    toast.success(!suspensa ? 'Prescrição suspensa!' : 'Prescrição reativada!')
    await data.refresh()
  }

  return (
    <Card className="border border-border/70 shadow-2xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Pill className="size-4 text-primary" />
          Prescrições Médicas Vigentes
        </CardTitle>
        {can(cat, 'presc') && (
          <Button
            size="xs"
            onClick={() => setModalNova(true)}
            className="gap-1.5 rounded-lg text-xs font-semibold bg-[#123F4A] hover:bg-[#123F4A]/90 text-white"
          >
            <Plus className="size-3" />
            Nova Prescrição
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs font-semibold">Medicamento</TableHead>
              <TableHead className="text-xs font-semibold">Posologia & Via</TableHead>
              <TableHead className="text-xs font-semibold">Frequência / Horários</TableHead>
              <TableHead className="text-xs font-semibold">Tipo</TableHead>
              <TableHead className="text-xs font-semibold text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.presc.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-bold text-foreground text-xs">{p.med}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.dose} ({p.via})</TableCell>
                <TableCell className="text-xs font-medium">{freqTxtMed(p)}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className="text-[10px]">
                    {TIPOS_PRESC[p.tipo] || p.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {can(cat, 'presc') ? (
                    <Button
                      size="xs"
                      variant={p.suspensa ? 'outline' : 'ghost'}
                      onClick={() => void handleToggleSuspender(p.id, !!p.suspensa)}
                      className={cn(
                        'text-[11px] font-semibold h-6 px-2 rounded-md',
                        p.suspensa
                          ? 'text-emerald-600 border-emerald-500/30'
                          : 'text-rose-600 hover:bg-rose-500/10'
                      )}
                    >
                      {p.suspensa ? 'Reativar' : 'Suspender'}
                    </Button>
                  ) : p.suspensa ? (
                    <Badge variant="destructive" className="text-[10px]">Suspensa</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Ativa
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={modalNova} onOpenChange={setModalNova}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSalvarPrescricao}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Cadastrar Prescrição Médica</DialogTitle>
              <DialogDescription className="text-xs">
                A prescrição alimentará a ronda de medicação do plantão assistencial.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="pMed" className="text-[11px] font-semibold">Medicamento & Dosagem *</Label>
                <Input
                  id="pMed"
                  value={med}
                  onChange={(e) => setMed(e.target.value)}
                  placeholder="Ex: Losartana Potássica 50 mg"
                  required
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pDose" className="text-[11px] font-semibold">Dose por Tomada</Label>
                  <Input
                    id="pDose"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    placeholder="Ex: 1 cp ou 10 gotas"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pVia" className="text-[11px] font-semibold">Via de Administração</Label>
                  <select
                    id="pVia"
                    value={via}
                    onChange={(e) => setVia(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                  >
                    <option value="VO">Oral (VO)</option>
                    <option value="SC">Subcutânea (SC)</option>
                    <option value="IM">Intramuscular (IM)</option>
                    <option value="EV">Endovenosa (EV)</option>
                    <option value="VR">Retal (VR)</option>
                    <option value="Tópico">Tópica</option>
                    <option value="Ocular">Ocular</option>
                    <option value="Inalatório">Inalatória</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pTipo" className="text-[11px] font-semibold">Tipo de Posologia</Label>
                  <select
                    id="pTipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as 'diario' | 'sn' | 'dias' | 'intervalo')}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                  >
                    <option value="diario">Diário (horários fixos)</option>
                    <option value="sn">Se Necessário (SN)</option>
                    <option value="intervalo">Intervalado</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pHor" className="text-[11px] font-semibold">Horários (separados por vírgula)</Label>
                  <Input
                    id="pHor"
                    value={horariosStr}
                    onChange={(e) => setHorariosStr(e.target.value)}
                    placeholder="Ex: 08:00, 20:00"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="pObs" className="text-[11px] font-semibold">Observações / Recomendações</Label>
                <Input
                  id="pObs"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Ex: Administrar após o café da manhã..."
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalNova(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={salvando} className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold">
                {salvando ? 'Salvando...' : 'Salvar Prescrição'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

/* ==========================================================================
   TAB 7: ANOTAÇÕES & SINAIS VITAIS (com registro no Supabase e atalhos rápidos)
   ========================================================================== */
export function TabAnot({ r, cat }: Ctx) {
  const data = useIlpiData()
  const { profissional } = useAuth()
  const sorted = [...r.anot].sort((a, b) => (b.sig.d + b.sig.h).localeCompare(a.sig.d + a.sig.h))

  const [modalNova, setModalNova] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Form states
  const [pa, setPa] = useState('')
  const [pulso, setPulso] = useState('')
  const [temp, setTemp] = useState('')
  const [sat, setSat] = useState('')
  const [diurese, setDiurese] = useState('Presente')
  const [evac, setEvac] = useState('Presente')
  const [texto, setTexto] = useState('')

  async function handleSalvarAnotacao(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || !profissional) {
      toast.error('Informe o relato da anotação.')
      return
    }

    setSalvando(true)
    const id = 'a_' + Math.random().toString(36).substring(2, 9)
    const { error } = await supabase.from('anotacoes').insert({
      id,
      residente_id: r.id,
      pa: pa.trim() || null,
      pulso: pulso.trim() || null,
      resp: null,
      temp: temp.trim() || null,
      sat: sat.trim() || null,
      diurese: diurese.trim() || null,
      evac: evac.trim() || null,
      texto: texto.trim(),
      assinatura: { id: profissional.id, d: T, h: agoraHM() },
    })
    setSalvando(false)

    if (error) {
      toast.error('Erro ao salvar anotação: ' + error.message)
      return
    }

    toast.success('Anotação e sinais vitais salvos no Supabase!')
    setModalNova(false)
    setPa('')
    setPulso('')
    setTemp('')
    setSat('')
    setTexto('')
    await data.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Histórico de Anotações & Sinais Vitais</h3>
          <span className="text-xs text-muted-foreground">{sorted.length} registros no prontuário</span>
        </div>
        {can(cat, 'anot') && (
          <Button
            size="xs"
            onClick={() => setModalNova(true)}
            className="gap-1.5 rounded-lg text-xs font-semibold bg-[#123F4A] hover:bg-[#123F4A]/90 text-white"
          >
            <Plus className="size-3" />
            Nova Anotação / SSVV
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sorted.map((a) => {
          const f = flags(a)
          return (
            <Card key={a.id} className="border border-border/70 shadow-2xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-primary" />
                    {fmt(a.sig.d)} às {a.sig.h}
                  </span>
                  <span className="text-muted-foreground font-mono">Assinado: {a.sig.id}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {a.pa && (
                    <Badge variant="outline" className={cn('text-xs font-semibold px-2 py-0.5', f.pa ? 'bg-rose-500/10 text-rose-600 border-rose-500/25' : 'bg-muted')}>
                      PA {a.pa}
                    </Badge>
                  )}
                  {a.pulso != null && (
                    <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 bg-muted">
                      P {a.pulso} bpm
                    </Badge>
                  )}
                  {a.temp != null && (
                    <Badge variant="outline" className={cn('text-xs font-semibold px-2 py-0.5', f.temp ? 'bg-rose-500/10 text-rose-600 border-rose-500/25' : 'bg-muted')}>
                      T {a.temp} °C
                    </Badge>
                  )}
                  {a.sat != null && (
                    <Badge variant="outline" className={cn('text-xs font-semibold px-2 py-0.5', f.sat ? 'bg-rose-500/10 text-rose-600 border-rose-500/25' : 'bg-muted')}>
                      Sat {a.sat}%
                    </Badge>
                  )}
                  {a.diurese && (
                    <Badge variant="secondary" className="text-[11px]">
                      Diurese: {a.diurese}
                    </Badge>
                  )}
                  {a.evac && (
                    <Badge variant="secondary" className="text-[11px]">
                      Evacuação: {a.evac}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-foreground leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/40">
                  {a.texto}
                </p>
              </CardContent>
            </Card>
          )
        })}

        {!sorted.length && (
          <Card className="border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
            Nenhuma anotação registrada até o momento.
          </Card>
        )}
      </div>

      {/* Modal Registrar Anotação */}
      <Dialog open={modalNova} onOpenChange={setModalNova}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSalvarAnotacao}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <HeartPulse className="size-4 text-[#123F4A]" />
                Registrar Anotação & Sinais Vitais
              </DialogTitle>
              <DialogDescription className="text-xs">
                Anotação de enfermagem em conformidade com o COREN.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {/* Sinais Vitais */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                <span className="font-bold text-foreground text-[11px] block">Sinais Vitais (SSVV)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">PA (mmHg)</Label>
                    <Input value={pa} onChange={(e) => setPa(e.target.value)} placeholder="120x80" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Pulso (bpm)</Label>
                    <Input value={pulso} onChange={(e) => setPulso(e.target.value)} placeholder="76" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Temp (°C)</Label>
                    <Input value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="36.5" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">SatO2 (%)</Label>
                    <Input value={sat} onChange={(e) => setSat(e.target.value)} placeholder="98" className="h-8 text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Diurese</Label>
                    <Input value={diurese} onChange={(e) => setDiurese(e.target.value)} placeholder="Presente / Clara" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Evacuação</Label>
                    <Input value={evac} onChange={(e) => setEvac(e.target.value)} placeholder="Presente / Pastosa" className="h-8 text-xs" />
                  </div>
                </div>
              </div>

              {/* Modelos rápidos */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground font-semibold block">Modelos de relato rápido (clique para preencher):</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {MODELOS_ANOT.slice(0, 3).map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTexto(m)}
                      className="px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-[10px] text-muted-foreground hover:text-foreground text-left max-w-xs truncate border border-border/40"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Texto livre da anotação */}
              <div className="space-y-1">
                <Label htmlFor="anotTexto" className="text-[11px] font-semibold">Relato de Enfermagem *</Label>
                <textarea
                  id="anotTexto"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={4}
                  required
                  placeholder="Relato detalhado do estado do residente, aceitação de dieta, queixas e intercorrências..."
                  className="w-full text-xs rounded-md border border-input bg-background p-2 focus-visible:outline-ring"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalNova(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={salvando} className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold">
                {salvando ? 'Salvando...' : 'Salvar no Supabase'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ==========================================================================
   TAB 8: EVOLUÇÃO MULTIPROFISSIONAL (com lançamento no Supabase)
   ========================================================================== */
export function TabEvol({ r, cat, area }: Ctx) {
  const data = useIlpiData()
  const { profissional } = useAuth()
  const evs = r.evol.filter((e) => cat !== 'multi' || e.area === area)

  const [modalNova, setModalNova] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [areaEscolhida, setAreaEscolhida] = useState(area || (cat === 'med' ? 'Medicina' : 'Enfermagem'))
  const [peso, setPeso] = useState('')
  const [texto, setTexto] = useState('')

  async function handleSalvarEvolucao(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || !profissional) return

    setSalvando(true)
    const id = 'ev_' + Math.random().toString(36).substring(2, 9)
    const pesoNum = peso ? parseFloat(peso.replace(',', '.')) : null

    const { error } = await supabase.from('evolucoes').insert({
      id,
      residente_id: r.id,
      area: areaEscolhida,
      texto: texto.trim(),
      peso: Number.isFinite(pesoNum) ? pesoNum : null,
      assinatura: { id: profissional.id, d: T, h: agoraHM() },
    })
    setSalvando(false)

    if (error) {
      toast.error('Erro ao salvar evolução: ' + error.message)
      return
    }

    toast.success('Evolução multiprofissional registrada no Supabase!')
    setModalNova(false)
    setTexto('')
    setPeso('')
    await data.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Evoluções Multiprofissionais</h3>
          <span className="text-xs text-muted-foreground">{evs.length} evoluções lançadas</span>
        </div>
        {can(cat, 'evol') && (
          <Button
            size="xs"
            onClick={() => setModalNova(true)}
            className="gap-1.5 rounded-lg text-xs font-semibold bg-[#123F4A] hover:bg-[#123F4A]/90 text-white"
          >
            <Plus className="size-3" />
            Nova Evolução
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {evs.map((e) => (
          <Card key={e.id} className="border border-border/70 shadow-2xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-[10px] font-bold bg-[#123F4A]">
                    {e.area}
                  </Badge>
                  <span className="text-muted-foreground">{fmt(e.sig.d)}</span>
                </div>
                {e.peso != null && (
                  <Badge variant="outline" className="text-xs font-semibold">
                    Peso: {e.peso} kg
                  </Badge>
                )}
              </div>
              <p className="text-xs text-foreground leading-relaxed pt-1">{e.texto}</p>
            </CardContent>
          </Card>
        ))}

        {!evs.length && (
          <Card className="border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
            Nenhuma evolução multiprofissional lançada.
          </Card>
        )}
      </div>

      <Dialog open={modalNova} onOpenChange={setModalNova}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSalvarEvolucao}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Registrar Evolução Clínica</DialogTitle>
              <DialogDescription className="text-xs">
                Conduta técnica multidisciplinar registrada no prontuário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="evArea" className="text-[11px] font-semibold">Área Técnica</Label>
                  <select
                    id="evArea"
                    value={areaEscolhida}
                    onChange={(e) => setAreaEscolhida(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                  >
                    <option value="Enfermagem">Enfermagem</option>
                    <option value="Medicina">Medicina</option>
                    <option value="Fisioterapia">Fisioterapia</option>
                    <option value="Nutrição">Nutrição</option>
                    <option value="Psicologia">Psicologia</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="evPeso" className="text-[11px] font-semibold">Peso (kg, se aferido)</Label>
                  <Input
                    id="evPeso"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    placeholder="Ex: 68.5"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="evTexto" className="text-[11px] font-semibold">Descrição da Evolução *</Label>
                <textarea
                  id="evTexto"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={4}
                  required
                  placeholder="Relato de atendimento, condutas terapêuticas e metas assistenciais..."
                  className="w-full text-xs rounded-md border border-input bg-background p-2 focus-visible:outline-ring"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalNova(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={salvando} className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold">
                {salvando ? 'Salvando...' : 'Salvar Evolução'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ==========================================================================
   TAB 9: ARQUIVOS & EXAMES
   ========================================================================== */
export function TabArquivos({ r }: Ctx) {
  const data = useIlpiData()
  const [modalNovo, setModalNovo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<string>(CATS_ARQ[0])
  const [dataDoc, setDataDoc] = useState(T)
  const [area, setArea] = useState<string>(AREAS[0])
  const [arqParaExcluir, setArqParaExcluir] = useState<{ id: string; nome: string } | null>(null)

  async function handleSalvarArquivo(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      toast.error('Informe o nome do documento ou exame.')
      return
    }

    setSalvando(true)
    const id = `arq_${Date.now()}`
    const { error } = await supabase.from('arquivos').insert({
      id,
      residente_id: r.id,
      nome: nome.trim(),
      categoria,
      data: dataDoc,
      area: area || null,
    })

    setSalvando(false)
    if (error) {
      toast.error(`Erro ao anexar arquivo: ${error.message}`)
      return
    }

    toast.success('Documento / exame anexado ao prontuário!')
    setNome('')
    setModalNovo(false)
    await data.refresh()
  }

  async function handleExcluirArquivo() {
    if (!arqParaExcluir) return
    const { error } = await supabase.from('arquivos').delete().eq('id', arqParaExcluir.id)
    if (error) {
      toast.error(`Erro ao excluir documento: ${error.message}`)
      return
    }
    toast.success('Documento removido do prontuário.')
    setArqParaExcluir(null)
    await data.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Exames, Laudos e Documentos Anexados</h3>
          <span className="text-xs text-muted-foreground">{r.arquivos?.length ?? 0} arquivos digitalizados</span>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setNome('')
            setCategoria(CATS_ARQ[0])
            setDataDoc(T)
            setArea(AREAS[0])
            setModalNovo(true)
          }}
          className="rounded-xl gap-1.5 text-xs h-8 self-start sm:self-auto"
        >
          <Plus className="size-3.5" /> Anexar Documento / Exame
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {r.arquivos?.map((f) => (
          <Card key={f.id} className="border border-border/70 shadow-2xs hover:bg-muted/15 transition-all">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-foreground text-xs block truncate" title={f.nome}>
                    {f.nome}
                  </span>
                  <span className="text-[11px] text-muted-foreground block truncate">
                    {String(f.cat ?? 'Exame')} · {fmt(f.data ? String(f.data) : undefined)}
                  </span>
                  {Boolean(f.area) && (
                    <span className="text-[10px] text-muted-foreground/80 block truncate">
                      {String(f.area)}
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setArqParaExcluir({ id: f.id, nome: f.nome })}
                className="size-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 shrink-0"
                title="Excluir arquivo"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {!r.arquivos?.length && (
        <Card className="border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground space-y-2">
          <p>Nenhum arquivo digitalizado ou laudo anexado ao prontuário.</p>
          <Button size="sm" variant="outline" onClick={() => setModalNovo(true)} className="rounded-xl text-xs">
            Anexar Primeiro Arquivo
          </Button>
        </Card>
      )}

      {/* Modal: Anexar Documento */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              Anexar Documento ao Prontuário
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registre exames laboratoriais, pareceres médicos, receitas ou certidões do residente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarArquivo} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Documento / Exame *</Label>
              <Input
                placeholder="ex: Hemograma e Glicemia de Jejum"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-xs shadow-2xs outline-none"
                >
                  {CATS_ARQ.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Data do Documento</Label>
                <Input
                  type="date"
                  value={dataDoc}
                  onChange={(e) => setDataDoc(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Área Técnica Responsável</Label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-xs shadow-2xs outline-none"
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalNovo(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Anexar ao Prontuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar Exclusão de Arquivo */}
      <Dialog open={!!arqParaExcluir} onOpenChange={(open) => !open && setArqParaExcluir(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <Trash2 className="size-4" /> Remover Arquivo
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deseja remover <strong>&quot;{arqParaExcluir?.nome}&quot;</strong> do prontuário?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setArqParaExcluir(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleExcluirArquivo}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ==========================================================================
   TAB 10: ESTOQUE DO RESIDENTE
   ========================================================================== */
export function TabEstoque({ r }: Ctx) {
  return (
    <Card className="border border-border/70 shadow-2xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="size-4 text-primary" />
            Estoque Individual de Medicamentos
          </span>
          <Badge variant="secondary" className="text-xs">
            {r.estoque.length} itens
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs font-semibold">Item / Medicamento</TableHead>
              <TableHead className="text-xs font-semibold">Saldo Atual</TableHead>
              <TableHead className="text-xs font-semibold">Consumo Diário</TableHead>
              <TableHead className="text-xs font-semibold text-right">Autonomia Prevista</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.estoque.map((it) => {
              const c = consumoDia(r, it, T)
              const n = nivelEst(c, it)
              const dias = diasRest(c, it.qtd)

              return (
                <TableRow key={it.id}>
                  <TableCell className="font-bold text-foreground text-xs">{it.nome}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {it.qtd} {it.unid} (mín. {it.min})
                  </TableCell>
                  <TableCell className="text-xs font-medium">{c.toFixed(1)} {it.unid}/dia</TableCell>
                  <TableCell className="text-right">
                    <StatusBadge tone={n === 'ok' ? 'ok' : n === 'warn' ? 'warn' : 'danger'}>
                      {Number.isFinite(dias) ? `${Math.floor(dias)} dias` : '–'}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/* ==========================================================================
   TAB 11: PRONTUÁRIO COMPLETO
   ========================================================================== */
export function TabTudo({ r, cat, area, profNome }: Ctx) {
  return (
    <div className="space-y-6">
      <TabFicha r={r} cat={cat} profNome={profNome} />
      {canTab(cat, 'aval') && <TabAval r={r} cat={cat} area={area} profNome={profNome} />}
      {canTab(cat, 'pia') && <TabPia r={r} cat={cat} profNome={profNome} />}
      {canTab(cat, 'cuidados') && <TabCuidados r={r} cat={cat} profNome={profNome} />}
      {canTab(cat, 'presc') && <TabPresc r={r} cat={cat} profNome={profNome} />}
      {canTab(cat, 'anot') && <TabAnot r={r} cat={cat} profNome={profNome} />}
      {canTab(cat, 'evol') && <TabEvol r={r} cat={cat} area={area} profNome={profNome} />}
    </div>
  )
}

/* ==========================================================================
   RENDERER PRINCIPAL DAS ABAS
   ========================================================================== */
export function renderTab(tab: AbaResidente, ctx: Ctx) {
  switch (tab) {
    case 'pasta':
      return <TabPasta {...ctx} />
    case 'ficha':
      return <TabFicha {...ctx} />
    case 'aval':
      return <TabAval {...ctx} />
    case 'pia':
      return <TabPia {...ctx} />
    case 'cuidados':
      return <TabCuidados {...ctx} />
    case 'presc':
      return <TabPresc {...ctx} />
    case 'anot':
      return <TabAnot {...ctx} />
    case 'evol':
      return <TabEvol {...ctx} />
    case 'arquivos':
      return <TabArquivos {...ctx} />
    case 'estoque':
      return <TabEstoque {...ctx} />
    case 'tudo':
      return <TabTudo {...ctx} />
    default:
      return null
  }
}
