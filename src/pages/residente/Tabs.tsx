import { useState, useEffect } from 'react'
import { AREAS, CATS_ARQ, DOCS, MODELOS_ANOT, NURSE, TIPOS_PRESC } from '../../lib/constants'
import { agoraHM, fmt, idade, iso } from '../../lib/business/dates'
import { consumoDia, diasRest, nivelEst } from '../../lib/business/estoque'
import { SCALES, totalEsc, obterDefinicaoEscala, grau as calcGrau } from '../../lib/business/escalas'
import { useEscalasConfig, carregarConfigEscalas } from '../../lib/business/escalasConfig'
import { presAtiva, freqTxt as freqTxtMed, detectControlado, isMedicamentoControlado } from '../../lib/business/medication'
import { flags } from '../../lib/business/ssvv'
import { can, canAval, canTab, escalasVisiveis } from '../../lib/permissions'
import { supabase } from '../../lib/supabase'
import { useIlpiData } from '../../contexts/IlpiDataContext'
import { useAuth } from '../../contexts/AuthContext'
import { PROCESSO_ENFERMAGEM_PADRAO, type ItemProcessoEnfermagem } from '../../lib/constants/processoEnfermagem'
import type { AbaResidente, Categoria, EscalaCategoria, EscalaCustomizada, NivelBadge, PiaItemNanda, Prescricao, Residente, StatusResidente } from '../../types/ilpi'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Checkbox } from '../../components/ui/checkbox'
import { Switch } from '../../components/ui/switch'
import { SearchableSelect } from '../../components/ui/select'
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
  Bandage,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Droplets,
  Edit3,
  ExternalLink,
  FileCheck,
  FileText,
  HeartPulse,
  History,
  Image as ImageIcon,
  Info,
  Layers,
  Lock,
  Maximize2,
  Package,
  Pill,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Star,
  Stethoscope,
  Target,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { processarEUploadFoto } from '../../lib/image'
import {
  classificarCuidado,
  formatarTextoCurativo,
  formatarTextoDecubito,
  COBERTURAS_CURATIVO,
  LOCAIS_ANATOMICOS,
  GRAUS_LESAO_LPP,
  FREQUENCIAS_CURATIVO,
  isCuidadoLpp,
} from '../../lib/business/cuidados'
import { toast } from 'sonner'
import { mascaraTelefone, mascaraPA } from '../../lib/masks'
import { cn } from '@/lib/utils'
import { ModalPedidoMedico } from '../../components/ModalPedidoMedico'
import { ModalPedidoEstoque } from '../../components/ModalPedidoEstoque'
import { OrigemItemSelect } from '../../components/OrigemItemSelect'
import { BadgeTipoEstoque } from '../../components/BadgeTipoEstoque'
import { classificarTipoItem } from '../../lib/business/categoriaEstoque'
import {
  getPedidosLocais,
  removerPedidoLocal,
  type PedidoMedicoData,
} from '../../lib/business/pedidosMedicos'
import { salvarRascunho, obterRascunho, limparRascunho, temRascunho } from '../../lib/draftStorage'

const T = iso(new Date())

type Ctx = {
  r: Residente
  cat: Categoria
  area?: string
  profNome: (id?: string) => string
}

const RTABS: Record<AbaResidente, string> = {
  anot: 'Anotações & Sinais',
  aval: 'Escalas & Avaliações',
  estoque: 'Estoque do Residente',
  evol: 'Evolução Multiprofissional',
  arquivos: 'Exames & Documentos',
  ficha: 'Ficha Cadastral',
  pia: 'PIA Enfermagem',
  cuidados: 'Plano de Cuidados',
  presc: 'Prescrição Médica',
  tudo: 'Prontuário Completo',
  pasta: 'Resumo Clínico',
}

const ORDEM_TABS: AbaResidente[] = [
  'pasta',
  'presc',
  'cuidados',
  'anot',
  'evol',
  'aval',
  'pia',
  'arquivos',
  'estoque',
  'ficha',
  'tudo',
]

export function tabsVisiveis(cat: Categoria, area?: string): AbaResidente[] {
  return ORDEM_TABS.filter((k) => {
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
  const cfg = carregarConfigEscalas()
  const g = calcGrau(r, cfg.escalaDependenciaPadrao, cfg.escalasCustomizadas) ?? undefined
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
              <span className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                {p.med}
                {isMedicamentoControlado(p) && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35 font-semibold gap-1 inline-flex items-center"
                    title="Medicamento sob controle especial (Portaria 344/98)"
                  >
                    <ShieldAlert className="size-2.5 text-amber-600 dark:text-amber-400" />
                    Controlado
                  </Badge>
                )}
              </span>
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
              {ultA.dextro && (
                <Badge variant="outline" className={cn('text-xs font-semibold px-2 py-0.5', ultFlags.dextro ? 'bg-rose-500/10 text-rose-600 border-rose-500/25' : 'bg-muted')}>
                  <Droplets className="size-3 mr-1 inline text-primary" />
                  Dextro {ultA.dextro} mg/dL
                </Badge>
              )}
            </div>
            {ultA.fotos && ultA.fotos.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                <Camera className="size-3.5 text-primary" />
                <span>{ultA.fotos.length} foto(s) de comprovação anexada(s)</span>
              </div>
            )}
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
                  <Label htmlFor="eq" className="text-[11px] font-semibold">Quarto / Leito *</Label>
                  <Input id="eq" value={quarto} onChange={(e) => setQuarto(e.target.value)} required className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="es" className="text-[11px] font-semibold">Status do Residente</Label>
                  <SearchableSelect
                    id="es"
                    value={status}
                    onValueChange={(v) => setStatus(v as StatusResidente)}
                    searchPlaceholder="Buscar status..."
                    options={[
                      { value: 'ativo', label: 'Ativo' },
                      { value: 'obito', label: 'Óbito' },
                    ]}
                  />
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
                    <Input value={respTel} onChange={(e) => setRespTel(mascaraTelefone(e.target.value))} placeholder="Ex: (11) 98888-7777" className="h-8 text-xs" />
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
   TAB 3: ESCALAS & AVALIAÇÕES (com aplicação interativa, catálogo expandido,
   seleção de escalas ativas e cadastro de escalas customizadas)
   ========================================================================== */
export function TabAval({ r, cat, area, profNome }: Ctx) {
  const data = useIlpiData()
  const { profissional } = useAuth()
  const {
    config,
    toggleEscala,
    setDependenciaPadrao,
    aplicarPreset,
    adicionarOuEditarCustomizada,
    excluirCustomizada,
  } = useEscalasConfig()

  const podeGerirEscalas = profissional ? can(profissional.cat, 'gerir') || ['rt', 'enf'].includes(profissional.cat) : false

  // Modais de Controle
  const [modalAval, setModalAval] = useState(false)
  const [modalConfig, setModalConfig] = useState(false)
  const [modalNovaEscala, setModalNovaEscala] = useState(false)
  const [modalHistorico, setModalHistorico] = useState<string | null>(null)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')

  // Estado da Aplicação da Escala Atual
  const [escalaEscolhida, setEscalaEscolhida] = useState<string>(config.escalasAtivas[0] || 'fugulin')
  const [respostas, setRespostas] = useState<number[]>([])
  const [salvando, setSalvando] = useState(false)

  // Formulário de Nova Escala Personalizada
  const [formNome, setFormNome] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formArea, setFormArea] = useState('Geral')
  const [formCategoria, setFormCategoria] = useState<EscalaCategoria>('personalizada')
  const [formItens, setFormItens] = useState<Array<{ questao: string; opcoes: Array<{ texto: string; pontos: number }> }>>([
    {
      questao: 'Item 1 / Critério de Avaliação',
      opcoes: [
        { texto: 'Sem alteração / Normal', pontos: 0 },
        { texto: 'Alteração moderada', pontos: 1 },
        { texto: 'Alteração grave / Dependente', pontos: 2 },
      ],
    },
  ])
  const [formFaixas, setFormFaixas] = useState<Array<{ min: number; max: number; txt: string; nivel: NivelBadge; grau?: number }>>([
    { min: 0, max: 0, txt: 'Sem alteração', nivel: 'ok' },
    { min: 1, max: 1, txt: 'Risco moderado', nivel: 'warn' },
    { min: 2, max: 10, txt: 'Alto risco / Atenção prioritária', nivel: 'danger' },
  ])

  function resetFormNovaEscala() {
    setFormNome('')
    setFormDesc('')
    setFormArea('Geral')
    setFormCategoria('personalizada')
    setFormItens([
      {
        questao: 'Item 1 / Critério de Avaliação',
        opcoes: [
          { texto: 'Sem alteração / Normal', pontos: 0 },
          { texto: 'Alteração moderada', pontos: 1 },
          { texto: 'Alteração grave / Dependente', pontos: 2 },
        ],
      },
    ])
    setFormFaixas([
      { min: 0, max: 0, txt: 'Sem alteração', nivel: 'ok' },
      { min: 1, max: 1, txt: 'Risco moderado', nivel: 'warn' },
      { min: 2, max: 10, txt: 'Alto risco / Atenção prioritária', nivel: 'danger' },
    ])
  }

  function handleSalvarNovaEscala() {
    if (!formNome.trim()) {
      toast.error('Informe o nome da escala.')
      return
    }
    if (formItens.length === 0 || formItens.some((it) => !it.questao.trim() || it.opcoes.length === 0)) {
      toast.error('Adicione pelo menos 1 pergunta com opções válidas.')
      return
    }

    const nova: EscalaCustomizada = {
      id: 'custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      nome: formNome.trim(),
      desc: formDesc.trim() || 'Escala personalizada cadastrada pela equipe da ILPI.',
      categoria: formCategoria,
      area: formArea,
      itens: formItens.map((it) => [
        it.questao.trim(),
        it.opcoes.map((op) => [op.texto.trim(), Number(op.pontos)] as [string, number]),
      ]),
      faixas: formFaixas.map((f) => ({
        min: Number(f.min),
        max: Number(f.max),
        txt: f.txt.trim(),
        nivel: f.nivel,
        grau: f.grau ? Number(f.grau) : undefined,
      })),
      criadaEm: T,
      criadaPor: profissional?.nome,
    }

    adicionarOuEditarCustomizada(nova)
    toast.success(`Escala "${nova.nome}" cadastrada e ativada com sucesso!`)
    resetFormNovaEscala()
    setModalNovaEscala(false)
  }

  // Lista de todas as chaves ativas configuradas para a ILPI
  const todasChaves = [
    ...Object.keys(SCALES),
    ...config.escalasCustomizadas.map((c) => c.id),
  ]

  const chavesAtivas = todasChaves.filter((k) => config.escalasAtivas.includes(k))

  // Filtro visual por categoria
  const chavesExibidas = chavesAtivas.filter((k) => {
    if (filtroCategoria === 'todas') return true
    const def = obterDefinicaoEscala(k, config.escalasCustomizadas)
    if (!def) return false
    if (filtroCategoria === 'personalizada') {
      return config.escalasCustomizadas.some((c) => c.id === k)
    }
    return def.categoria === filtroCategoria
  })

  function abrirModal(k: string) {
    setEscalaEscolhida(k)
    const def = obterDefinicaoEscala(k, config.escalasCustomizadas)
    if (!def) return
    setRespostas(new Array(def.itens.length).fill(0))
    setModalAval(true)
  }

  const defAtual = obterDefinicaoEscala(escalaEscolhida, config.escalasCustomizadas)
  const totalCalculado = defAtual ? totalEsc(escalaEscolhida, respostas, config.escalasCustomizadas) : 0
  const classifCalculada = defAtual ? defAtual.classif(totalCalculado) : null

  async function handleSalvarAvaliacao() {
    if (!profissional || !defAtual) return
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

    toast.success(`Avaliação ${defAtual.nome} salva e assinada com sucesso!`)
    setModalAval(false)
    await data.refresh()
  }

  // Dados para o modal de histórico
  const defHistorico = modalHistorico ? obterDefinicaoEscala(modalHistorico, config.escalasCustomizadas) : null
  const avaliacoesHistorico = modalHistorico
    ? r.aval.filter((a) => a.esc === modalHistorico).sort((a, b) => b.d.localeCompare(a.d))
    : []

  return (
    <div className="space-y-4">
      {/* Header com Ações e Configuração de Escalas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/70 bg-card shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">Escalas Clínicas & Multiprofissionais</h3>
            <Badge variant="outline" className="text-[11px] font-semibold border-primary/30 text-primary bg-primary/5">
              RDC 502 / Coren-SP
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Avaliações de dependência ({config.escalaDependenciaPadrao === 'katz' ? 'Katz ABVD' : 'Fugulin'}), risco de queda, lesão por pressão, cognição, demência e depressão.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalConfig(true)}
            className="text-xs font-semibold gap-1.5 h-8 border-border/70 hover:bg-muted"
          >
            <Settings className="size-3.5 text-primary" />
            Configurar Escalas da ILPI
            <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-primary/20">
              {chavesAtivas.length} ativas
            </Badge>
          </Button>

          {podeGerirEscalas && (
            <Button
              size="sm"
              onClick={() => {
                resetFormNovaEscala()
                setModalNovaEscala(true)
              }}
              className="text-xs font-semibold gap-1.5 h-8 bg-[#123F4A] hover:bg-[#123F4A]/90 text-white shadow-2xs"
            >
              <Plus className="size-3.5" />
              Cadastrar Nova Escala
            </Button>
          )}
        </div>
      </div>

      {/* Barra de Filtros por Categoria */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { id: 'todas', label: `Todas em Uso (${chavesAtivas.length})` },
          { id: 'dependencia', label: 'Dependência & AVD' },
          { id: 'risco', label: 'Riscos Clínicos' },
          { id: 'cognicao', label: 'Cognição & Demência' },
          { id: 'humor', label: 'Depressão & Humor' },
          { id: 'nutricao', label: 'Nutrição' },
          { id: 'odontologia', label: 'Saúde Bucal' },
          ...(config.escalasCustomizadas.length > 0
            ? [{ id: 'personalizada', label: `Personalizadas (${config.escalasCustomizadas.length})` }]
            : []),
        ].map((item) => (
          <Button
            key={item.id}
            size="xs"
            variant={filtroCategoria === item.id ? 'default' : 'outline'}
            onClick={() => setFiltroCategoria(item.id)}
            className={cn(
              'rounded-full px-3 text-[11px] h-7 font-medium whitespace-nowrap transition-colors',
              filtroCategoria === item.id
                ? 'bg-[#123F4A] text-white hover:bg-[#123F4A]/90'
                : 'text-muted-foreground border-border/60 hover:text-foreground'
            )}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {/* Grid de Escalas Ativas */}
      {chavesExibidas.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-border/80">
          <Layers className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-semibold text-foreground">Nenhuma escala ativa nesta categoria</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Abra a configuração de escalas para ativar escalas ou selecione outra categoria acima.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalConfig(true)}
            className="mt-3 text-xs gap-1.5"
          >
            <Settings className="size-3.5" />
            Configurar Escalas
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chavesExibidas.map((k) => {
            const def = obterDefinicaoEscala(k, config.escalasCustomizadas)
            if (!def) return null

            const podeEditar = canAval(cat, area, k, def.area)
            const lista = r.aval.filter((a) => a.esc === k)
            const ult = lista[lista.length - 1]
            const total = ult ? totalEsc(k, ult.resp, config.escalasCustomizadas) : 0
            const cl = ult ? def.classif(total) : null
            const ehDependenciaPadrao =
              (k === 'fugulin' && config.escalaDependenciaPadrao === 'fugulin') ||
              (k === 'katz' && config.escalaDependenciaPadrao === 'katz')

            return (
              <Card key={k} className="border border-border/70 shadow-2xs flex flex-col justify-between hover:border-border transition-all">
                <div>
                  <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-sm font-bold flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-foreground">{def.nome}</span>
                          {ehDependenciaPadrao && (
                            <Badge className="text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 gap-1 h-5 px-1.5">
                              <Star className="size-2.5 fill-amber-500 text-amber-500" />
                              Padrão RDC 502
                            </Badge>
                          )}
                          {def.area && (
                            <Badge variant="outline" className="text-[10px] font-normal border-border/60 text-muted-foreground h-5 px-1.5">
                              {def.area}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {!podeEditar && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/60 bg-muted/40 font-normal">
                            Leitura
                          </Badge>
                        )}
                        {ult && cl && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-semibold',
                              cl.nivel === 'danger'
                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/25'
                                : cl.nivel === 'warn'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25'
                            )}
                          >
                            {cl.txt}
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 space-y-2 text-xs">
                    <p className="text-muted-foreground leading-relaxed">{def.desc}</p>
                    {ult ? (
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-muted-foreground">
                        <span>Última avaliação: <b>{fmt(ult.d)}</b></span>
                        <div className="flex items-center gap-2">
                          <span>Pontuação: <b>{total}</b></span>
                          {lista.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setModalHistorico(k)}
                              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                            >
                              <History className="size-3" />
                              Ver histórico ({lista.length})
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic pt-2 border-t border-border/40">
                        Nenhuma avaliação lançada nesta escala para este residente.
                      </p>
                    )}
                  </CardContent>
                </div>

                <div className="p-3 border-t border-border/40 bg-muted/10 flex items-center justify-between gap-2">
                  {podeEditar ? (
                    <Button
                      size="xs"
                      onClick={() => abrirModal(k)}
                      className="w-full gap-1.5 text-xs font-semibold bg-[#123F4A] hover:bg-[#123F4A]/90 text-white shadow-2xs"
                    >
                      <Plus className="size-3" />
                      Aplicar Nova {def.nome}
                    </Button>
                  ) : (
                    <div className="text-center py-1 text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1.5 w-full">
                      <Lock className="size-3 text-muted-foreground" />
                      <span>Visualização clínica (preenchimento restrito à equipe habilitada)</span>
                    </div>
                  )}

                  {lista.length > 0 && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setModalHistorico(k)}
                      title="Histórico de avaliações anteriores"
                      className="text-muted-foreground hover:text-foreground h-7 px-2 shrink-0"
                    >
                      <History className="size-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal 1: Aplicação da Escala Interativa */}
      <Dialog open={modalAval} onOpenChange={setModalAval}>
        <DialogContent className="w-[95vw] sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between gap-2 flex-wrap">
              <span>Aplicar Escala {defAtual?.nome} — {r.nome}</span>
              {classifCalculada && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-semibold',
                    classifCalculada.nivel === 'danger'
                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/25'
                      : classifCalculada.nivel === 'warn'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25'
                  )}
                >
                  {classifCalculada.txt} ({totalCalculado} pts)
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {defAtual?.desc}. Selecione a opção correspondente para cada critério avaliado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {defAtual?.itens.map(([pergunta, opcoes], idx) => {
              const valorAtual = respostas[idx] ?? 0
              return (
                <div key={idx} className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-2.5">
                  <span className="font-semibold text-foreground block text-sm">
                    {idx + 1}. {pergunta}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {opcoes.map(([opcaoTexto, pontos], optIdx) => {
                      const selecionado = valorAtual === optIdx
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => {
                            const clone = [...respostas]
                            clone[idx] = optIdx
                            setRespostas(clone)
                          }}
                          className={cn(
                            'p-3 rounded-lg border text-left text-xs transition-all flex items-start justify-between gap-2.5',
                            selecionado
                              ? 'bg-[#123F4A] text-white border-[#123F4A] font-medium shadow-xs'
                              : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span className="leading-relaxed flex-1 break-words">{opcaoTexto}</span>
                          <span
                            className={cn(
                              'text-[10px] shrink-0 font-semibold px-1.5 py-0.5 rounded mt-0.5',
                              selecionado
                                ? 'bg-white/20 text-white'
                                : 'bg-muted text-foreground/70 border border-border/40'
                            )}
                          >
                            +{pontos}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground">
              Total: {totalCalculado} pontos {classifCalculada ? `· ${classifCalculada.txt}` : ''}
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

      {/* Modal 2: Configuração de Escalas da ILPI (Ativação / Desativação e Presets) */}
      <Dialog open={modalConfig} onOpenChange={setModalConfig}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="size-4 text-primary" />
              Configuração de Escalas Clínicas da ILPI
            </DialogTitle>
            <DialogDescription className="text-xs">
              Personalize quais escalas são utilizadas na rotina da instituição. Escalas desativadas não aparecem no prontuário do residente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2 text-xs">
            {/* Presets Rápidos */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2.5">
              <span className="font-bold text-foreground block text-xs flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" />
                Presets Rápidos de Escalas Padronizadas
              </span>
              <p className="text-[11px] text-muted-foreground">
                Selecione um perfil pré-configurado de acordo com o padrão adotado na sua região:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    aplicarPreset('padrao_nacional')
                    toast.success('Padrão Nacional aplicado: Fugulin ativa, Katz e Lawton inativas.')
                  }}
                  className="text-xs font-semibold gap-1 bg-background hover:bg-muted"
                >
                  Padrão Nacional (Fugulin)
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    aplicarPreset('sao_paulo')
                    toast.success('Padrão São Paulo / Coren-SP aplicado: Katz e Lawton/AGA ativas, Fugulin inativa.')
                  }}
                  className="text-xs font-semibold gap-1 bg-background hover:bg-muted border-primary/40 text-primary"
                >
                  Padrão São Paulo / Coren-SP (Katz + Lawton)
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    aplicarPreset('todas')
                    toast.success('Todas as escalas clínicas foram ativadas.')
                  }}
                  className="text-xs font-semibold gap-1 bg-background hover:bg-muted"
                >
                  Ativar Todas as Escalas
                </Button>
              </div>
            </div>

            {/* Escala Oficial de Dependência (RDC 502) */}
            <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2">
              <span className="font-bold text-foreground block text-xs flex items-center gap-1.5">
                <Star className="size-3.5 text-amber-500 fill-amber-500" />
                Escala Oficial para Grau de Dependência (RDC 502 / Anvisa)
              </span>
              <p className="text-[11px] text-muted-foreground">
                Define qual instrumento clínico alimenta o dimensionamento de equipe e a classificação de Graus 1, 2 e 3 dos residentes:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDependenciaPadrao('fugulin')}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all',
                    config.escalaDependenciaPadrao === 'fugulin'
                      ? 'border-primary bg-primary/5 text-foreground font-semibold shadow-xs'
                      : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Escala de Fugulin</span>
                    {config.escalaDependenciaPadrao === 'fugulin' && <CheckCircle2 className="size-4 text-primary" />}
                  </div>
                  <p className="text-[11px] font-normal text-muted-foreground mt-0.5">
                    Graus 1, 2 e 3 avaliados por complexidade assistencial de enfermagem.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDependenciaPadrao('katz')}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all',
                    config.escalaDependenciaPadrao === 'katz'
                      ? 'border-primary bg-primary/5 text-foreground font-semibold shadow-xs'
                      : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Índice de Katz (ABVD)</span>
                    {config.escalaDependenciaPadrao === 'katz' && <CheckCircle2 className="size-4 text-primary" />}
                  </div>
                  <p className="text-[11px] font-normal text-muted-foreground mt-0.5">
                    Padrão em São Paulo e Coren-SP para Atividades Básicas da Vida Diária.
                  </p>
                </button>
              </div>
            </div>

            {/* Lista de Todas as Escalas com Switches Individuais */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-xs">
                  Escalas Disponíveis ({todasChaves.length})
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {config.escalasAtivas.length} selecionadas para uso
                </span>
              </div>

              <div className="space-y-2 divide-y divide-border/40 border border-border/70 rounded-xl bg-card p-1">
                {todasChaves.map((key) => {
                  const def = obterDefinicaoEscala(key, config.escalasCustomizadas)
                  if (!def) return null
                  const ativa = config.escalasAtivas.includes(key)
                  const ehCustom = config.escalasCustomizadas.some((c) => c.id === key)

                  return (
                    <div key={key} className="p-3 flex items-start justify-between gap-3 pt-3 first:pt-2">
                      <div className="space-y-1 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-foreground text-xs">{def.nome}</span>
                          {def.area && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground font-normal">
                              {def.area}
                            </Badge>
                          )}
                          {ehCustom && (
                            <Badge className="text-[10px] h-4 px-1 bg-purple-500/10 text-purple-600 border-purple-500/20 font-semibold">
                              Personalizada
                            </Badge>
                          )}
                          {key === config.escalaDependenciaPadrao && (
                            <Badge className="text-[10px] h-4 px-1 bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold">
                              Dependência Oficial
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{def.desc}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        {ehCustom && (
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            onClick={() => {
                              excluirCustomizada(key)
                              toast.success('Escala personalizada removida.')
                            }}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                            title="Excluir escala personalizada"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                        <Switch
                          checked={ativa}
                          onCheckedChange={(checked) => toggleEscala(key, checked)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Configurações salvas localmente e sincronizadas com a ILPI.
            </span>
            <Button type="button" size="sm" onClick={() => setModalConfig(false)} className="bg-[#123F4A] text-white">
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Cadastro de Nova Escala Personalizada */}
      <Dialog open={modalNovaEscala} onOpenChange={setModalNovaEscala}>
        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="size-4 text-primary" />
              Cadastrar Nova Escala Personalizada
            </DialogTitle>
            <DialogDescription className="text-xs">
              Crie escalas clínicas ou multiprofissionais customizadas para a sua equipe (Medicina, Fisioterapia, Nutrição, Odontologia, Educação Física, etc.).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nome da Escala *</Label>
                <Input
                  placeholder="ex: Avaliação de Educação Física Geriátrica"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Área / Especialidade Responsável</Label>
                <SearchableSelect
                  value={formArea}
                  onValueChange={setFormArea}
                  placeholder="Selecione a especialidade..."
                  searchPlaceholder="Buscar especialidade..."
                  options={[
                    { value: 'Geral', label: 'Geral (Multiprofissional)' },
                    { value: 'Educação Física', label: 'Educação Física' },
                    { value: 'Enfermagem', label: 'Enfermagem' },
                    { value: 'Fisioterapia', label: 'Fisioterapia' },
                    { value: 'Médico', label: 'Médico' },
                    { value: 'Nutrição', label: 'Nutrição' },
                    { value: 'Odontologia', label: 'Odontologia' },
                    { value: 'Psicologia', label: 'Psicologia' },
                    { value: 'Serviço Social', label: 'Serviço Social' },
                    { value: 'Terapia Ocupacional', label: 'Terapia Ocupacional' },
                  ]}
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold">Descrição / Finalidade Clínica</Label>
                <Input
                  placeholder="ex: Avaliação de força, flexibilidade e capacidade aeróbica do residente"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Perguntas / Itens Avaliados */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-xs">
                  Critérios e Perguntas ({formItens.length})
                </span>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    setFormItens([
                      ...formItens,
                      {
                        questao: `Critério ${formItens.length + 1}`,
                        opcoes: [
                          { texto: 'Normal / Preservado', pontos: 0 },
                          { texto: 'Limitação leve', pontos: 1 },
                          { texto: 'Incapacidade / Dependência', pontos: 2 },
                        ],
                      },
                    ])
                  }
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="size-3" /> Adicionar Critério
                </Button>
              </div>

              <div className="space-y-3">
                {formItens.map((item, itemIdx) => (
                  <div key={itemIdx} className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        placeholder={`Critério ${itemIdx + 1} (ex: Teste de sentar e levantar)`}
                        value={item.questao}
                        onChange={(e) => {
                          const clone = [...formItens]
                          clone[itemIdx].questao = e.target.value
                          setFormItens(clone)
                        }}
                        className="h-7 text-xs font-semibold flex-1"
                      />
                      {formItens.length > 1 && (
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => setFormItens(formItens.filter((_, i) => i !== itemIdx))}
                          className="text-rose-600 h-7 px-2 hover:bg-rose-50"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>

                    {/* Opções do Critério */}
                    <div className="space-y-1.5 pl-2 border-l-2 border-primary/30">
                      <span className="text-[11px] font-medium text-muted-foreground block">
                        Opções de resposta e pontuação:
                      </span>
                      {item.opcoes.map((op, opIdx) => (
                        <div key={opIdx} className="flex items-center gap-2">
                          <Input
                            placeholder="Texto da opção"
                            value={op.texto}
                            onChange={(e) => {
                              const clone = [...formItens]
                              clone[itemIdx].opcoes[opIdx].texto = e.target.value
                              setFormItens(clone)
                            }}
                            className="h-7 text-xs flex-1"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[11px] text-muted-foreground">+</span>
                            <Input
                              type="number"
                              value={op.pontos}
                              onChange={(e) => {
                                const clone = [...formItens]
                                clone[itemIdx].opcoes[opIdx].pontos = Number(e.target.value)
                                setFormItens(clone)
                              }}
                              className="h-7 w-16 text-xs text-center font-bold"
                            />
                            <span className="text-[10px] text-muted-foreground">pts</span>
                          </div>
                          {item.opcoes.length > 1 && (
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              onClick={() => {
                                const clone = [...formItens]
                                clone[itemIdx].opcoes = clone[itemIdx].opcoes.filter((_, i) => i !== opIdx)
                                setFormItens(clone)
                              }}
                              className="h-7 w-6 p-0 text-muted-foreground hover:text-rose-600"
                            >
                              ✕
                            </Button>
                          )}
                        </div>
                      ))}

                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          const clone = [...formItens]
                          clone[itemIdx].opcoes.push({ texto: 'Nova opção', pontos: clone[itemIdx].opcoes.length })
                          setFormItens(clone)
                        }}
                        className="text-[11px] text-primary h-6 px-1.5 font-medium hover:underline"
                      >
                        + Adicionar alternativa a este critério
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Faixas de Classificação da Pontuação Total */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground text-xs block">
                    Classificação do Resultado Total
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Defina a interpretação clínica de acordo com os pontos somados:
                  </span>
                </div>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    setFormFaixas([
                      ...formFaixas,
                      { min: 0, max: 0, txt: 'Nova faixa', nivel: 'ok' },
                    ])
                  }
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="size-3" /> Adicionar Faixa
                </Button>
              </div>

              <div className="space-y-2">
                {formFaixas.map((fx, fxIdx) => (
                  <div key={fxIdx} className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-muted-foreground font-medium">De</span>
                    <Input
                      type="number"
                      value={fx.min}
                      onChange={(e) => {
                        const clone = [...formFaixas]
                        clone[fxIdx].min = Number(e.target.value)
                        setFormFaixas(clone)
                      }}
                      className="h-7 w-16 text-xs text-center font-bold"
                    />
                    <span className="text-[11px] text-muted-foreground font-medium">até</span>
                    <Input
                      type="number"
                      value={fx.max}
                      onChange={(e) => {
                        const clone = [...formFaixas]
                        clone[fxIdx].max = Number(e.target.value)
                        setFormFaixas(clone)
                      }}
                      className="h-7 w-16 text-xs text-center font-bold"
                    />
                    <span className="text-[11px] text-muted-foreground font-medium">pts =</span>

                    <Input
                      placeholder="Resultado clínico (ex: Risco Moderado)"
                      value={fx.txt}
                      onChange={(e) => {
                        const clone = [...formFaixas]
                        clone[fxIdx].txt = e.target.value
                        setFormFaixas(clone)
                      }}
                      className="h-7 text-xs flex-1 min-w-[140px]"
                    />

                    <SearchableSelect
                      value={fx.nivel}
                      onValueChange={(v) => {
                        const clone = [...formFaixas]
                        clone[fxIdx].nivel = v as NivelBadge
                        setFormFaixas(clone)
                      }}
                      triggerClassName="h-7 text-xs min-w-[150px]"
                      searchPlaceholder="Buscar nível..."
                      options={[
                        { value: 'warn', label: 'Amarelo (Atenção / Moderado)' },
                        { value: 'ok', label: 'Verde (Normal / Seguro)' },
                        { value: 'danger', label: 'Vermelho (Alto Risco / Grave)' },
                      ]}
                    />

                    {formFaixas.length > 1 && (
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => setFormFaixas(formFaixas.filter((_, i) => i !== fxIdx))}
                        className="h-7 w-6 p-0 text-muted-foreground hover:text-rose-600"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalNovaEscala(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSalvarNovaEscala}
              className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold"
            >
              Salvar e Ativar Escala
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Histórico de Avaliações Anteriores do Residente */}
      <Dialog open={!!modalHistorico} onOpenChange={(open) => !open && setModalHistorico(null)}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <History className="size-4 text-primary" />
              Histórico de Avaliações — {defHistorico?.nome}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Evolução temporal e registros anteriores de {r.nome} nesta escala.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {avaliacoesHistorico.length === 0 ? (
              <p className="text-muted-foreground italic text-center py-4">
                Nenhum histórico encontrado para esta escala.
              </p>
            ) : (
              <div className="space-y-2.5">
                {avaliacoesHistorico.map((av, idx) => {
                  const pts = totalEsc(av.esc, av.resp, config.escalasCustomizadas)
                  const cl = defHistorico ? defHistorico.classif(pts) : null
                  return (
                    <div
                      key={av.id || idx}
                      className="p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/10 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-sm">
                          {fmt(av.d)} {av.sig.h ? `às ${av.sig.h}` : ''}
                        </span>
                        {cl && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-semibold',
                              cl.nivel === 'danger'
                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/25'
                                : cl.nivel === 'warn'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25'
                            )}
                          >
                            {cl.txt} ({pts} pts)
                          </Badge>
                        )}
                      </div>

                      <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
                        <span>Assinado por: <b>{profNome(av.sig.id)}</b></span>
                        <span className="text-[10px]">ID: {av.id}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" size="sm" onClick={() => setModalHistorico(null)} variant="outline">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ==========================================================================
   TAB 4: PIA (Plano Individual de Atendimento / Processo de Enfermagem — NANDA, NOC, NIC)
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
  const [obs, setObs] = useState('')
  const [encaminhamentos, setEncaminhamentos] = useState('')
  const [resultadoGeral, setResultadoGeral] = useState<string>('Parcialmente alcançado')

  // Lista de itens NANDA selecionados no formulário
  const [itensNandaSelecionados, setItensNandaSelecionados] = useState<PiaItemNanda[]>([])
  const [buscaNanda, setBuscaNanda] = useState('')
  const [itemExpandido, setItemExpandido] = useState<string | null>(null)

  function abrirModalNovoOuEditar() {
    setPeriodo(p?.periodo || 'Semestral')
    setInicio(p?.inicio || T)
    setReav(p?.reav || '')
    setObs(p?.obs || '')
    setEncaminhamentos(p?.encaminhamentos || '')
    setResultadoGeral(p?.resultado || 'Parcialmente alcançado')
    setBuscaNanda('')

    if (p?.itensNanda && p.itensNanda.length > 0) {
      setItensNandaSelecionados([...p.itensNanda])
    } else if (p?.necessidades && p.necessidades.length > 0) {
      const mapeados = p.necessidades.map((n) => {
        const achou = PROCESSO_ENFERMAGEM_PADRAO.find(
          (padrao) => padrao.diagnostico.toLowerCase() === n.toLowerCase() || padrao.id === n
        )
        return {
          id: achou ? achou.id : `diag_${n}`,
          diagnostico: achou ? achou.diagnostico : n,
          meta: (p.metas as Record<string, string>)?.[n] || achou?.meta || '',
          intervencoes: (p.intervencoes as Record<string, string>)?.[n] || achou?.intervencoes || '',
          resultado: p.resultado || 'parcial',
        }
      })
      setItensNandaSelecionados(mapeados)
    } else {
      // Padrão inicial com os 2 primeiros itens mais comuns
      setItensNandaSelecionados([
        {
          id: PROCESSO_ENFERMAGEM_PADRAO[0].id,
          diagnostico: PROCESSO_ENFERMAGEM_PADRAO[0].diagnostico,
          meta: PROCESSO_ENFERMAGEM_PADRAO[0].meta,
          intervencoes: PROCESSO_ENFERMAGEM_PADRAO[0].intervencoes,
          resultado: 'parcial',
        },
        {
          id: PROCESSO_ENFERMAGEM_PADRAO[14].id,
          diagnostico: PROCESSO_ENFERMAGEM_PADRAO[14].diagnostico,
          meta: PROCESSO_ENFERMAGEM_PADRAO[14].meta,
          intervencoes: PROCESSO_ENFERMAGEM_PADRAO[14].intervencoes,
          resultado: 'parcial',
        },
      ])
    }
    setModalNovo(true)
  }

  function toggleNandaItem(padrao: ItemProcessoEnfermagem) {
    setItensNandaSelecionados((prev) => {
      const existe = prev.some((it) => it.id === padrao.id || it.diagnostico === padrao.diagnostico)
      if (existe) {
        return prev.filter((it) => it.id !== padrao.id && it.diagnostico !== padrao.diagnostico)
      } else {
        return [
          ...prev,
          {
            id: padrao.id,
            diagnostico: padrao.diagnostico,
            meta: padrao.meta,
            intervencoes: padrao.intervencoes,
            resultado: 'parcial',
          },
        ]
      }
    })
  }

  function atualizarItem(id: string, campo: 'meta' | 'intervencoes' | 'resultado', valor: string) {
    setItensNandaSelecionados((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [campo]: valor } : it))
    )
  }

  async function handleSalvarPia(e: React.FormEvent) {
    e.preventDefault()
    if (!profissional) {
      toast.error('Profissional não identificado.')
      return
    }

    if (itensNandaSelecionados.length === 0) {
      toast.error('Selecione pelo menos um Diagnóstico de Enfermagem (NANDA).')
      return
    }

    setSalvando(true)
    const id = `pia_${Date.now()}`
    const sig = { id: profissional.id, d: T, h: agoraHM() }

    const metasMap = Object.fromEntries(itensNandaSelecionados.map((it) => [it.diagnostico, it.meta]))
    const interMap = Object.fromEntries(itensNandaSelecionados.map((it) => [it.diagnostico, it.intervencoes]))

    const payload = {
      id,
      residente_id: r.id,
      periodo: periodo.trim() || 'Semestral',
      inicio,
      reavaliacao: reav || null,
      necessidades: itensNandaSelecionados.map((it) => it.diagnostico),
      itens_nanda: itensNandaSelecionados,
      metas: metasMap,
      intervencoes: interMap,
      obs: obs.trim() || null,
      resultado: resultadoGeral || null,
      encaminhamentos: encaminhamentos.trim() || null,
      assinatura: sig,
    }

    let { error } = await supabase.from('pias').insert(payload)
    if (error && error.message.includes('column')) {
      // Fallback salvando os itens estruturados em 'necessidades' (coluna jsonb já existente)
      const payloadFallback = {
        id,
        residente_id: r.id,
        periodo: periodo.trim() || 'Semestral',
        inicio,
        reavaliacao: reav || null,
        necessidades: itensNandaSelecionados,
        obs: obs.trim() || null,
        resultado: resultadoGeral || null,
        encaminhamentos: encaminhamentos.trim() || null,
        assinatura: sig,
      }
      const res = await supabase.from('pias').insert(payloadFallback)
      error = res.error
    }

    setSalvando(false)
    if (error) {
      toast.error(`Erro ao salvar PIA no Supabase: ${error.message}`)
      return
    }

    toast.success('Plano Individual de Atendimento (PIA) registrado com sucesso no Supabase!')
    setModalNovo(false)
    await data.refresh()
  }

  const itensNandaFiltrados = PROCESSO_ENFERMAGEM_PADRAO.filter((it) => {
    if (!buscaNanda.trim()) return true
    const termo = buscaNanda.toLowerCase()
    return (
      it.diagnostico.toLowerCase().includes(termo) ||
      it.meta.toLowerCase().includes(termo) ||
      it.intervencoes.toLowerCase().includes(termo)
    )
  })

  return (
    <Card className="border border-border/70 shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <HeartPulse className="size-4 text-primary" />
            Plano Individual de Atendimento (PIA — Processo de Enfermagem / RDC 502)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Diagnósticos de Enfermagem (NANDA), Metas Individuais (NOC) e Intervenções de Enfermagem (NIC).
          </p>
        </div>

        {can(cat, 'gerir') && (
          <Button
            size="sm"
            onClick={abrirModalNovoOuEditar}
            className="rounded-xl gap-1.5 text-xs h-8 bg-[#123F4A] hover:bg-[#123F4A]/90 text-white shadow-2xs"
          >
            <Plus className="size-3.5" /> Elaborar / Atualizar PIA
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-5">
        {!p ? (
          <div className="text-center py-8 space-y-2">
            <Stethoscope className="size-8 text-muted-foreground mx-auto opacity-50" />
            <p className="text-xs text-muted-foreground italic">Nenhum PIA vigente cadastrado para este residente.</p>
            {can(cat, 'gerir') && (
              <Button size="sm" variant="outline" onClick={abrirModalNovoOuEditar} className="rounded-xl text-xs gap-1.5">
                <Plus className="size-3.5" /> Criar Primeiro PIA
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* Metadados do Plano */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-muted-foreground font-medium block text-[11px]">Avaliação Global do Resultado</span>
                <span className="font-bold text-foreground text-sm block mt-0.5">
                  <Badge variant="outline" className={cn('text-xs font-semibold mt-0.5', p.resultado === 'Alcançado' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : p.resultado === 'Não alcançado' ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30')}>
                    {p.resultado || 'Em acompanhamento'}
                  </Badge>
                </span>
              </div>
            </div>

            {/* Tabela / Cards do Processo de Enfermagem (NANDA, NOC, NIC) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                  <Stethoscope className="size-3.5 text-primary" />
                  Planejamento Assistencial de Enfermagem (NANDA / NOC / NIC)
                </span>
                <Badge variant="secondary" className="text-[10px] h-5">
                  {(p.itensNanda && p.itensNanda.length > 0 ? p.itensNanda : p.necessidades ?? []).length} diagnósticos ativos
                </Badge>
              </div>

              <div className="space-y-3">
                {(p.itensNanda && p.itensNanda.length > 0 ? p.itensNanda : (p.necessidades ?? []).map((nec) => {
                  const padrao = PROCESSO_ENFERMAGEM_PADRAO.find((it) => it.diagnostico.toLowerCase() === nec.toLowerCase())
                  return {
                    id: padrao ? padrao.id : nec,
                    diagnostico: padrao ? padrao.diagnostico : nec,
                    meta: padrao?.meta || 'Preservar estabilidade e autonomia.',
                    intervencoes: padrao?.intervencoes || 'Acompanhar rotina assistencial.',
                    resultado: p.resultado,
                  }
                })).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-2.5 hover:border-border transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-foreground text-sm">
                          {item.diagnostico}
                        </h4>
                      </div>

                      {item.resultado && (
                        <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground border-border/60">
                          {item.resultado}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {/* Meta Individual (NOC) */}
                      <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1">
                        <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                          <Target className="size-3 text-primary" /> Meta Individual (NOC)
                        </span>
                        <p className="text-xs text-foreground/90 leading-relaxed">
                          {item.meta}
                        </p>
                      </div>

                      {/* Intervenções de Enfermagem (NIC) */}
                      <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1">
                        <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                          <Stethoscope className="size-3 text-muted-foreground" /> Intervenções de Enfermagem (NIC)
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.intervencoes}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {p.obs && (
              <div className="space-y-1 pt-3 border-t border-border/40">
                <span className="font-semibold text-foreground block">Observações Assistenciais:</span>
                <p className="text-muted-foreground leading-relaxed">{p.obs}</p>
              </div>
            )}

            {p.encaminhamentos && (
              <div className="space-y-1 pt-3 border-t border-border/40">
                <span className="font-semibold text-foreground block">Encaminhamentos Multiprofissionais:</span>
                <p className="text-muted-foreground leading-relaxed">{p.encaminhamentos}</p>
              </div>
            )}

            {p.sig && (
              <div className="text-[11px] text-muted-foreground pt-3 border-t border-border/40 flex items-center justify-between flex-wrap gap-2">
                <span>
                  Responsável pelo PIA: <strong className="text-foreground">{data.profissionalPorId(p.sig.id)?.nome ?? 'Profissional'}</strong> ({fmt(p.sig.d)} às {p.sig.h})
                </span>
                <span className="text-[10px]">ID: {p.id}</span>
              </div>
            )}
          </div>
        )}

        {/* Modal Completo: Elaborar / Atualizar PIA com NANDA, NOC, NIC */}
        <Dialog open={modalNovo} onOpenChange={setModalNovo}>
          <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HeartPulse className="size-5 text-primary" />
                Plano Individual de Atendimento — Processo de Enfermagem (RDC 502)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Selecione os diagnósticos prioritários (NANDA), defina as metas individuais (NOC) e as intervenções de enfermagem (NIC).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSalvarPia} className="space-y-5 py-2 text-xs">
              {/* Vigência e Datas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Período de Vigência *</Label>
                  <Input
                    placeholder="ex: Semestral / Nov-Dez 2026"
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Data de Início *</Label>
                  <Input
                    type="date"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Previsão de Reavaliação</Label>
                  <Input
                    type="date"
                    value={reav}
                    onChange={(e) => setReav(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* Seletor do Processo de Enfermagem (NANDA, NOC, NIC) */}
              <div className="space-y-3 pt-2 border-t border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <Label className="text-xs font-bold text-foreground block">
                      Diagnósticos de Enfermagem (NANDA) & Planejamento (NOC / NIC)
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {itensNandaSelecionados.length} de {PROCESSO_ENFERMAGEM_PADRAO.length} diagnósticos selecionados
                    </span>
                  </div>

                  {/* Busca Rápida */}
                  <div className="relative w-full sm:flex-1 sm:max-w-md">
                    <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar diagnóstico, meta ou cuidado..."
                      value={buscaNanda}
                      onChange={(e) => setBuscaNanda(e.target.value)}
                      className="pl-8 text-xs h-8 w-full"
                    />
                  </div>
                </div>

                {/* Lista de Seleção dos 15 Diagnósticos Padronizados */}
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {itensNandaFiltrados.map((padrao) => {
                    const itemSelecionado = itensNandaSelecionados.find(
                      (it) => it.id === padrao.id || it.diagnostico === padrao.diagnostico
                    )
                    const selecionado = !!itemSelecionado
                    const expandido = itemExpandido === padrao.id || selecionado

                    return (
                      <div
                        key={padrao.id}
                        className={cn(
                          'rounded-xl border transition-all',
                          selecionado
                            ? 'border-primary/60 bg-primary/5 shadow-2xs'
                            : 'border-border/60 bg-muted/15 hover:bg-muted/30'
                        )}
                      >
                        {/* Header do Item */}
                        <div
                          className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
                          onClick={() => toggleNandaItem(padrao)}
                        >
                          <div className="flex items-center gap-2.5 flex-1">
                            <Checkbox
                              checked={selecionado}
                              onCheckedChange={() => toggleNandaItem(padrao)}
                              className="size-4 shrink-0"
                            />
                            <div className="space-y-0.5">
                              <span className="font-bold text-foreground text-xs block">
                                {padrao.numero}. {padrao.diagnostico}
                              </span>
                              <span className="text-[11px] text-muted-foreground line-clamp-1">
                                Meta: {padrao.meta}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant={selecionado ? 'default' : 'outline'}
                              className={cn(
                                'text-[10px] h-5 px-1.5',
                                selecionado ? 'bg-[#123F4A] text-white' : 'text-muted-foreground'
                              )}
                            >
                              {selecionado ? 'Ativo no Plano' : 'Não selecionado'}
                            </Badge>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setItemExpandido(itemExpandido === padrao.id ? null : padrao.id)
                              }}
                              className="text-muted-foreground hover:text-foreground p-1"
                            >
                              {expandido ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Corpo com Meta (NOC) e Intervenções (NIC) editáveis */}
                        {selecionado && expandido && (
                          <div className="px-3 pb-3 pt-1 border-t border-border/40 space-y-3 bg-background/50 rounded-b-xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                              {/* Meta Individual (NOC) */}
                              <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-primary flex items-center gap-1">
                                  <Target className="size-3" /> Meta Individual (NOC)
                                </Label>
                                <textarea
                                  rows={2}
                                  value={itemSelecionado.meta}
                                  onChange={(e) =>
                                    atualizarItem(itemSelecionado.id, 'meta', e.target.value)
                                  }
                                  className="w-full text-xs rounded-lg border border-input bg-background p-2 focus:ring-1 focus:ring-ring"
                                />
                              </div>

                              {/* Intervenções de Enfermagem (NIC) */}
                              <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-foreground flex items-center gap-1">
                                  <Stethoscope className="size-3" /> Intervenções de Enfermagem (NIC)
                                </Label>
                                <textarea
                                  rows={2}
                                  value={itemSelecionado.intervencoes}
                                  onChange={(e) =>
                                    atualizarItem(itemSelecionado.id, 'intervencoes', e.target.value)
                                  }
                                  className="w-full text-xs rounded-lg border border-input bg-background p-2 focus:ring-1 focus:ring-ring"
                                />
                              </div>
                            </div>

                            {/* Avaliação do Resultado do Diagnóstico */}
                            <div className="flex items-center gap-2 pt-1 border-t border-border/30 flex-wrap">
                              <span className="text-[11px] font-semibold text-muted-foreground">
                                Status da Meta:
                              </span>
                              {(
                                [
                                  ['alcancado', 'Alcançado'],
                                  ['parcial', 'Parcialmente alcançado'],
                                  ['nao_alcancado', 'Não alcançado'],
                                  ['ajuste', 'Necessidade de ajuste'],
                                ] as const
                              ).map(([val, label]) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => atualizarItem(itemSelecionado.id, 'resultado', label)}
                                  className={cn(
                                    'px-2 py-0.5 rounded text-[10px] font-medium border transition-colors',
                                    itemSelecionado.resultado === label
                                      ? 'bg-primary text-primary-foreground border-primary font-bold'
                                      : 'bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted'
                                  )}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Resultado Geral e Encaminhamentos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Avaliação Geral do Resultado</Label>
                  <SearchableSelect
                    value={resultadoGeral}
                    onValueChange={setResultadoGeral}
                    searchPlaceholder="Buscar resultado..."
                    options={[
                      { value: 'Alcançado', label: 'Alcançado' },
                      { value: 'Não alcançado', label: 'Não alcançado' },
                      { value: 'Necessidade de ajuste do Plano', label: 'Necessidade de ajuste do Plano' },
                      { value: 'Parcialmente alcançado', label: 'Parcialmente alcançado' },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Encaminhamentos Multiprofissionais</Label>
                  <Input
                    placeholder="ex: Fisioterapia motora 2x/sem, avaliação nutricional mensal"
                    value={encaminhamentos}
                    onChange={(e) => setEncaminhamentos(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">Observações Assistenciais</Label>
                  <textarea
                    rows={2}
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    placeholder="ex: Residente participativo, adaptou-se bem às orientações de prevenção de quedas..."
                    className="w-full text-xs rounded-xl border border-input bg-transparent px-3 py-2 shadow-2xs outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalNovo(false)}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={salvando}
                  className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold"
                >
                  {salvando ? 'Salvando no Supabase...' : 'Salvar e Assinar PIA'}
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
   TAB 5: PLANO DE CUIDADOS & PRESCRIÇÃO DE ENFERMAGEM
   ========================================================================== */
export function TabCuidados({ r, cat }: Ctx) {
  const data = useIlpiData()

  // Modais
  const [modalNovo, setModalNovo] = useState(false)
  const [modalCurativo, setModalCurativo] = useState(false)
  const [modalDecubito, setModalDecubito] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'lpp' | 'curativo' | 'geral'>('todos')
  const [salvando, setSalvando] = useState(false)

  // Form Cuidado Geral
  const [texto, setTexto] = useState('')
  const [quem, setQuem] = useState<'todos' | 'enfermagem' | 'cuidador'>('todos')
  const [destaqueLpp, setDestaqueLpp] = useState(false)

  // Form Prescrição de Curativo
  const [curativoCob, setCurativoCob] = useState<string>(COBERTURAS_CURATIVO[0])
  const [curativoLoc, setCurativoLoc] = useState<string>(LOCAIS_ANATOMICOS[0])
  const [curativoGrau, setCurativoGrau] = useState<string>(GRAUS_LESAO_LPP[1])
  const [curativoFreq, setCurativoFreq] = useState<string>(FREQUENCIAS_CURATIVO[0])
  const [curativoInstrucoes, setCurativoInstrucoes] = useState<string>(
    '1. Limpar suavemente com SF 0,9% morno em jato;\n2. Secar bordas perilesionais sem fricção no leito da ferida;\n3. Aplicar a cobertura prescrita com margem de segurança;\n4. Fixar e assinar checagem no plantão.'
  )
  const [curativoQuem, setCurativoQuem] = useState<'todos' | 'enfermagem' | 'cuidador'>('todos')

  // Form Mudança de Decúbito
  const [decubitoHoras, setDecubitoHoras] = useState<number | string>(2)
  const [decubitoPeriodo, setDecubitoPeriodo] = useState<'24h' | 'noturno' | 'diurno'>('24h')
  const [decubitoSequencia, setDecubitoSequencia] = useState('Dorsal → Lateral Esquerdo → Lateral Direito')
  const [decubitoAlerta, setDecubitoAlerta] = useState(true)
  const [decubitoQuem, setDecubitoQuem] = useState<'todos' | 'enfermagem' | 'cuidador'>('todos')

  // Verifica se o residente possui protocolo ativo de LPP (avaliação Braden de risco ou cuidado cadastrado)
  const bradenAval = r.aval.filter((a) => a.esc === 'braden').slice(-1)[0]
  const bradenScore = bradenAval ? bradenAval.resp.reduce((a: number, b: number) => a + b, 0) : null
  const temRiscoBraden = bradenScore !== null && bradenScore <= 14
  const temCuidadoLpp = r.cuidados.some((c) => isCuidadoLpp(c, r))
  const temProtocoloLpp = temRiscoBraden || temCuidadoLpp

  async function handleSalvarCuidado(e: React.FormEvent) {
    e.preventDefault()
    if (!NURSE.includes(cat)) {
      toast.error('Apenas a equipe de enfermagem pode prescrever cuidados.')
      return
    }
    if (!texto.trim()) return
    setSalvando(true)
    let textoFinal = texto.trim()
    if (destaqueLpp && !isCuidadoLpp(textoFinal)) {
      textoFinal = `[LPP] ${textoFinal}`
    }
    const id = `${r.id}_c_${Math.random().toString(36).substring(2, 7)}`
    const { error } = await supabase.from('cuidados').insert({
      id,
      residente_id: r.id,
      texto: textoFinal,
      quem,
    })
    setSalvando(false)

    if (error) {
      toast.error('Erro ao adicionar cuidado: ' + error.message)
      return
    }

    toast.success('Cuidado adicionado ao plano assistencial!')
    setTexto('')
    setDestaqueLpp(false)
    setModalNovo(false)
    await data.refresh()
  }

  async function handleSalvarCurativo(e: React.FormEvent) {
    e.preventDefault()
    if (!NURSE.includes(cat)) {
      toast.error('Apenas a equipe de enfermagem pode prescrever cuidados.')
      return
    }
    setSalvando(true)
    const textoFormatado = formatarTextoCurativo({
      cobertura: curativoCob,
      localizacao: curativoLoc,
      grauLesao: curativoGrau,
      frequencia: curativoFreq,
      instrucoes: curativoInstrucoes,
      quem: curativoQuem,
    })
    const id = `${r.id}_c_${Math.random().toString(36).substring(2, 7)}`
    const { error } = await supabase.from('cuidados').insert({
      id,
      residente_id: r.id,
      texto: textoFormatado,
      quem: curativoQuem,
    })
    setSalvando(false)

    if (error) {
      toast.error('Erro ao registrar prescrição de curativo: ' + error.message)
      return
    }

    toast.success('Prescrição de curativo salva e vinculada ao plantão!')
    setModalCurativo(false)
    await data.refresh()
  }

  async function handleSalvarDecubito(e: React.FormEvent) {
    e.preventDefault()
    if (!NURSE.includes(cat)) {
      toast.error('Apenas a equipe de enfermagem pode prescrever cuidados.')
      return
    }
    setSalvando(true)
    const textoFormatado = formatarTextoDecubito({
      intervaloHoras: decubitoHoras,
      periodo: decubitoPeriodo,
      sequenciaDecubito: decubitoSequencia,
      alertaLppAtivo: decubitoAlerta,
      quem: decubitoQuem,
    })
    const id = `${r.id}_c_${Math.random().toString(36).substring(2, 7)}`
    const { error } = await supabase.from('cuidados').insert({
      id,
      residente_id: r.id,
      texto: textoFormatado,
      quem: decubitoQuem,
    })
    setSalvando(false)

    if (error) {
      toast.error('Erro ao configurar mudança de decúbito: ' + error.message)
      return
    }

    toast.success('Protocolo de mudança de decúbito salvo e vinculado ao plantão!')
    setModalDecubito(false)
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

  // Filtragem dos cuidados exibidos
  const cuidadosClassificados = r.cuidados.map((c) => ({
    cuidado: c,
    info: classificarCuidado(c, r),
  }))

  const filtrados = cuidadosClassificados.filter(({ info }) => {
    if (filtro === 'lpp') return info.isLpp
    if (filtro === 'curativo') return info.isCurativo
    if (filtro === 'geral') return info.tipo === 'geral'
    return true
  })

  return (
    <Card className="border border-border/70 shadow-2xs">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            Plano de Cuidados & Prescrição de Enfermagem
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Rotina assistencial diária, protocolo de lesão por pressão (LPP) e curativos vinculados à checagem dos cuidadores e enfermagem.
          </p>
        </div>
        {NURSE.includes(cat) && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="xs"
              onClick={() => setModalCurativo(true)}
              className="gap-1.5 rounded-lg text-xs font-semibold bg-purple-700 hover:bg-purple-800 text-white shadow-2xs cursor-pointer"
            >
              <Bandage className="size-3" />
              Prescrever Curativo
            </Button>
            <Button
              size="xs"
              onClick={() => setModalDecubito(true)}
              className="gap-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs cursor-pointer"
            >
              <RefreshCw className="size-3" />
              Decúbito 2h (LPP)
            </Button>
            <Button
              size="xs"
              onClick={() => setModalNovo(true)}
              className="gap-1.5 rounded-lg text-xs font-semibold bg-[#123F4A] hover:bg-[#123F4A]/90 text-white shadow-2xs cursor-pointer"
            >
              <Plus className="size-3" />
              Adicionar Cuidado
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Banner de Alerta Clínico para Lesão por Pressão (LPP) */}
        {temProtocoloLpp && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/40 text-xs flex items-start gap-3 shadow-2xs">
            <div className="size-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="size-4" />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-amber-950 dark:text-amber-200 text-xs">
                  Atenção da Equipe: Protocolo Ativo de Lesão por Pressão (LPP)
                </span>
                <Badge className="bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/30 text-[10px] font-bold">
                  Sinalização Prioritária (Âmbar)
                </Badge>
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                Residente com necessidade estrita de prevenção e/ou tratamento de lesão de pele. Os cuidados sinalizados em tom <strong>âmbar</strong> devem ser rigorosamente checados pelos cuidadores e equipe de enfermagem nos horários previstos.
              </p>
            </div>
          </div>
        )}

        {/* Barra de Filtros Rápidos */}
        {r.cuidados.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-muted-foreground mr-1 font-medium">Filtrar:</span>
            <button
              type="button"
              onClick={() => setFiltro('todos')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer',
                filtro === 'todos' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 hover:bg-muted text-muted-foreground'
              )}
            >
              Todos ({r.cuidados.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('lpp')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer',
                filtro === 'lpp' ? 'bg-amber-600 text-white' : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-500/30'
              )}
            >
              <ShieldAlert className="size-3" />
              LPP & Decúbito ({cuidadosClassificados.filter(({ info }) => info.isLpp).length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('curativo')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer',
                filtro === 'curativo' ? 'bg-purple-700 text-white' : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-900 dark:text-purple-200 border border-purple-500/30'
              )}
            >
              <Bandage className="size-3" />
              Curativos ({cuidadosClassificados.filter(({ info }) => info.isCurativo).length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('geral')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer',
                filtro === 'geral' ? 'bg-muted text-foreground font-bold' : 'bg-muted/40 hover:bg-muted text-muted-foreground'
              )}
            >
              Rotina Geral ({cuidadosClassificados.filter(({ info }) => info.tipo === 'geral').length})
            </button>
          </div>
        )}

        {/* Lista de Cuidados */}
        {filtrados.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtrados.map(({ cuidado: c, info }) => {
              const isAmbar = info.corTema === 'amber'
              const isCurativo = info.tipo === 'curativo'

              return (
                <div
                  key={c.id}
                  className={cn(
                    'p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-2.5 transition-all',
                    isAmbar && 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/50 dark:border-amber-400/50 shadow-2xs ring-1 ring-amber-500/30',
                    isCurativo && !isAmbar && 'bg-purple-500/10 dark:bg-purple-950/40 border-purple-500/40 dark:border-purple-400/50 shadow-2xs',
                    !isAmbar && !isCurativo && 'bg-muted/30 border-border/50'
                  )}
                >
                  <div className="space-y-2">
                    {/* Topo do Card com Badge e Botão de Excluir */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isAmbar && (
                          <Badge className="bg-amber-500/25 text-amber-950 dark:text-amber-200 border-amber-500/40 text-[10px] font-bold gap-1 py-0.5">
                            <ShieldAlert className="size-2.5 text-amber-700 dark:text-amber-400" />
                            {info.badgeTexto}
                          </Badge>
                        )}
                        {isCurativo && !isAmbar && (
                          <Badge className="bg-purple-500/20 text-purple-900 dark:text-purple-200 border-purple-500/40 text-[10px] font-bold gap-1 py-0.5">
                            <Bandage className="size-2.5 text-purple-600 dark:text-purple-400" />
                            {info.badgeTexto}
                          </Badge>
                        )}
                        {!isAmbar && !isCurativo && (
                          <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground py-0.5">
                            Rotina Geral
                          </Badge>
                        )}
                      </div>
                      {can(cat, 'gerir') && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => void handleExcluirCuidado(c.id)}
                          className="size-6 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>

                    {/* Descrição Principal e Ícone */}
                    <div className="flex items-start gap-2.5">
                      <div
                        className={cn(
                          'size-7 rounded-lg flex items-center justify-center shrink-0 font-bold',
                          isAmbar && 'bg-amber-500/20 text-amber-800 dark:text-amber-300',
                          isCurativo && !isAmbar && 'bg-purple-500/20 text-purple-800 dark:text-purple-300',
                          !isAmbar && !isCurativo && 'bg-primary/10 text-primary'
                        )}
                      >
                        {isAmbar ? (
                          info.isDecubito ? <RefreshCw className="size-3.5" /> : <ShieldAlert className="size-3.5" />
                        ) : isCurativo ? (
                          <Bandage className="size-3.5" />
                        ) : (
                          <span className="text-[12px]">•</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className={cn('font-bold block text-xs leading-snug', isAmbar ? 'text-amber-950 dark:text-amber-100' : 'text-foreground')}>
                          {info.tituloPrincipal}
                        </span>

                        {/* Orientações Técnicas para o Plantão (Cuidadores e Auxiliares) */}
                        {info.instrucoes && (
                          <div className="mt-2 p-2 rounded-lg bg-background/80 border border-border/60 text-[11px] space-y-0.5">
                            <span className="font-semibold text-foreground flex items-center gap-1 text-[10px]">
                              <Info className="size-3 text-primary" />
                              Orientações para quem executa (Cuidadores / Auxiliares):
                            </span>
                            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                              {info.instrucoes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé com Responsável */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="size-3 text-muted-foreground/80" />
                      Responsável:{' '}
                      <strong className="text-foreground font-semibold">
                        {c.quem === 'todos'
                          ? 'Toda a equipe (Cuidadores e Auxiliares)'
                          : c.quem === 'cuidador'
                          ? 'Cuidadores'
                          : 'Enfermagem'}
                      </strong>
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 italic">
                      Checagem diária no plantão
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic py-3">
            {r.cuidados.length === 0
              ? 'Nenhum cuidado cadastrado para este residente.'
              : 'Nenhum cuidado encontrado com o filtro selecionado.'}
          </p>
        )}
      </CardContent>

      {/* MODAL 1: CUIDADO GERAL COM OPÇÃO DE SINALIZAR LPP */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSalvarCuidado}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Adicionar Cuidado Assistencial</DialogTitle>
              <DialogDescription className="text-xs">
                Este cuidado entrará nas rotinas diárias e na checagem de plantão dos cuidadores e enfermagem.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 py-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="cuidTexto" className="text-[11px] font-semibold">Descrição do Cuidado *</Label>
                <Input
                  id="cuidTexto"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Ex: Oferecer água de 1 em 1 hora espessada..."
                  required
                  className="h-8 text-xs"
                />
              </div>

              {/* Destaque para LPP (em tom âmbar, nunca vermelho) */}
              <div
                className={cn(
                  'p-3 rounded-lg border transition-colors flex items-start gap-2.5 cursor-pointer',
                  destaqueLpp
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-200'
                    : 'bg-muted/30 border-border/60 hover:bg-muted/50'
                )}
                onClick={() => setDestaqueLpp(!destaqueLpp)}
              >
                <Checkbox
                  id="chkLppGeral"
                  checked={destaqueLpp}
                  onCheckedChange={(v) => setDestaqueLpp(!!v)}
                  className="mt-0.5 data-checked:bg-amber-600 data-checked:border-amber-600"
                />
                <div className="space-y-0.5 leading-snug">
                  <Label htmlFor="chkLppGeral" className="text-xs font-bold cursor-pointer flex items-center gap-1.5">
                    <ShieldAlert className="size-3.5 text-amber-600 dark:text-amber-400" />
                    Sinalizar como Lesão por Pressão (LPP) / Alerta Prioritário
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Destaca o card em tom <strong>âmbar</strong> e sinaliza como prioridade máxima no plantão dos cuidadores.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="cuidQuem" className="text-[11px] font-semibold">Executores Responsáveis</Label>
                <SearchableSelect
                  id="cuidQuem"
                  value={quem}
                  onValueChange={(v) => setQuem(v as 'todos' | 'enfermagem' | 'cuidador')}
                  searchPlaceholder="Buscar responsável..."
                  options={[
                    { value: 'enfermagem', label: 'Auxiliar / Técnico / Enfermeiro' },
                    { value: 'cuidador', label: 'Cuidadores' },
                    { value: 'todos', label: 'Toda a equipe (Cuidadores e Enfermagem)' },
                  ]}
                />
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

      {/* MODAL 2: PRESCREVER CURATIVO (PRESCRIÇÃO DE ENFERMAGEM) */}
      <Dialog open={modalCurativo} onOpenChange={setModalCurativo}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSalvarCurativo}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Bandage className="size-4 text-purple-600 dark:text-purple-400" />
                Prescrição de Enfermagem • Curativo & Cobertura
              </DialogTitle>
              <DialogDescription className="text-xs">
                Defina o tipo de cobertura, região anatômica e instruções técnicas para os cuidadores e auxiliares realizarem no plantão.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Tipo de Cobertura / Curativo *</Label>
                  <SearchableSelect
                    value={curativoCob}
                    onValueChange={setCurativoCob}
                    searchPlaceholder="Buscar cobertura..."
                    options={COBERTURAS_CURATIVO.map((cob) => ({ value: cob, label: cob }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Localização Anatômica *</Label>
                  <SearchableSelect
                    value={curativoLoc}
                    onValueChange={setCurativoLoc}
                    searchPlaceholder="Buscar localização..."
                    options={LOCAIS_ANATOMICOS.map((loc) => ({ value: loc, label: loc }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Estágio / Classificação da Lesão</Label>
                  <SearchableSelect
                    value={curativoGrau}
                    onValueChange={setCurativoGrau}
                    searchPlaceholder="Buscar classificação..."
                    options={GRAUS_LESAO_LPP.map((grau) => ({ value: grau, label: grau }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Frequência da Troca *</Label>
                  <SearchableSelect
                    value={curativoFreq}
                    onValueChange={setCurativoFreq}
                    searchPlaceholder="Buscar frequência..."
                    options={FREQUENCIAS_CURATIVO.map((freq) => ({ value: freq, label: freq }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Quem deve Executar / Checar *</Label>
                <SearchableSelect
                  value={curativoQuem}
                  onValueChange={(v) => setCurativoQuem(v as 'todos' | 'enfermagem' | 'cuidador')}
                  searchPlaceholder="Buscar executores..."
                  options={[
                    { value: 'enfermagem', label: 'Auxiliar / Técnico / Enfermeiro RT' },
                    { value: 'cuidador', label: 'Cuidadores' },
                    { value: 'todos', label: 'Toda a equipe (Cuidadores e Auxiliares de Enfermagem)' },
                  ]}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Instruções Passo a Passo para Cuidadores / Auxiliares</Label>
                <textarea
                  value={curativoInstrucoes}
                  onChange={(e) => setCurativoInstrucoes(e.target.value)}
                  rows={3}
                  className="w-full text-xs rounded-md border border-input bg-background p-2 leading-relaxed resize-none min-h-[72px]"
                  placeholder="Orientações detalhadas de assepsia, aplicação e observação..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalCurativo(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={salvando} className="bg-purple-700 hover:bg-purple-800 text-white font-semibold">
                {salvando ? 'Salvando...' : 'Salvar Prescrição de Curativo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: PROTOCOLO DE MUDANÇA DE DECÚBITO COM ALERTA LPP */}
      <Dialog open={modalDecubito} onOpenChange={setModalDecubito}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSalvarDecubito}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <RefreshCw className="size-4 text-amber-600 dark:text-amber-400" />
                Protocolo de Mudança de Decúbito (LPP)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure a periodicidade de mudança de decúbito com sinalização visual em tom âmbar no plantão.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3.5 py-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Intervalo de Mudança *</Label>
                  <SearchableSelect
                    value={String(decubitoHoras)}
                    onValueChange={(v) => setDecubitoHoras(Number(v))}
                    searchPlaceholder="Buscar intervalo..."
                    options={[
                      { value: '1', label: 'A cada 1 hora (Cadeira/Poltrona)' },
                      { value: '2', label: 'A cada 2 horas (Padrão LPP)' },
                      { value: '3', label: 'A cada 3 horas' },
                      { value: '4', label: 'A cada 4 horas' },
                    ]}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Período de Aplicação *</Label>
                  <SearchableSelect
                    value={decubitoPeriodo}
                    onValueChange={(v) => setDecubitoPeriodo(v as '24h' | 'noturno' | 'diurno')}
                    searchPlaceholder="Buscar período..."
                    options={[
                      { value: '24h', label: '24 Horas (Dia e Noite)' },
                      { value: 'diurno', label: 'Somente Diurno' },
                      { value: 'noturno', label: 'Somente Noturno' },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Sequência de Posicionamento Sugerida</Label>
                <Input
                  value={decubitoSequencia}
                  onChange={(e) => setDecubitoSequencia(e.target.value)}
                  placeholder="Ex: Dorsal → Lateral Esquerdo → Lateral Direito"
                  className="h-8 text-xs"
                />
              </div>

              {/* Alerta de LPP Ativo */}
              <div
                className={cn(
                  'p-3 rounded-lg border transition-colors flex items-start gap-2.5 cursor-pointer',
                  decubitoAlerta
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-200'
                    : 'bg-muted/30 border-border/60'
                )}
                onClick={() => setDecubitoAlerta(!decubitoAlerta)}
              >
                <Checkbox
                  id="chkAlertaDecubito"
                  checked={decubitoAlerta}
                  onCheckedChange={(v) => setDecubitoAlerta(!!v)}
                  className="mt-0.5 data-checked:bg-amber-600 data-checked:border-amber-600"
                />
                <div className="space-y-0.5 leading-snug">
                  <Label htmlFor="chkAlertaDecubito" className="text-xs font-bold cursor-pointer flex items-center gap-1.5">
                    <ShieldAlert className="size-3.5 text-amber-600 dark:text-amber-400" />
                    Destacar com Alerta de Lesão por Pressão (LPP)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Sinaliza em tom <strong>âmbar</strong> com badge de alta prioridade na lista de cuidados e no plantão.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Executores Responsáveis *</Label>
                <SearchableSelect
                  value={decubitoQuem}
                  onValueChange={(v) => setDecubitoQuem(v as 'todos' | 'enfermagem' | 'cuidador')}
                  searchPlaceholder="Buscar executores..."
                  options={[
                    { value: 'enfermagem', label: 'Auxiliar / Técnico / Enfermeiro' },
                    { value: 'cuidador', label: 'Cuidadores' },
                    { value: 'todos', label: 'Toda a equipe (Cuidadores e Enfermagem)' },
                  ]}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalDecubito(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={salvando} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                {salvando ? 'Salvando...' : 'Ativar Protocolo de Decúbito'}
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
  const [modalReceita, setModalReceita] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Prescrição sendo editada (null se for novo cadastro)
  const [prescEditando, setPrescEditando] = useState<Prescricao | null>(null)
  const [reativarAoSalvar, setReativarAoSalvar] = useState(true)

  // Form states
  const [med, setMed] = useState('')
  const [dose, setDose] = useState('')
  const [via, setVia] = useState('VO')
  const [tipo, setTipo] = useState<'diario' | 'sn' | 'dias' | 'intervalo'>('diario')
  const [horariosStr, setHorariosStr] = useState('08:00')
  const [obs, setObs] = useState('')
  const [controlado, setControlado] = useState(false)
  const [controladoManual, setControladoManual] = useState(false)

  function handleAbrirModal() {
    setPrescEditando(null)
    setMed('')
    setDose('')
    setVia('VO')
    setTipo('diario')
    setHorariosStr('08:00')
    setObs('')
    setControlado(false)
    setControladoManual(false)
    setReativarAoSalvar(true)
    setModalNova(true)
  }

  function handleAbrirEditar(p: Prescricao) {
    setPrescEditando(p)
    setMed(p.med)
    setDose(p.dose || '')
    setVia(p.via || 'VO')
    setTipo((p.tipo as 'diario' | 'sn' | 'dias' | 'intervalo') || 'diario')
    setHorariosStr(Array.isArray(p.horarios) ? p.horarios.join(', ') : '08:00')
    setObs(p.obs || '')
    setControlado(isMedicamentoControlado(p))
    setControladoManual(true)
    setReativarAoSalvar(true)
    setModalNova(true)
  }

  async function handleSalvarPrescricao(e: React.FormEvent) {
    e.preventDefault()
    if (!med.trim() || !profissional) return

    setSalvando(true)
    const horarios = horariosStr.split(',').map((s) => s.trim()).filter(Boolean)

    if (prescEditando) {
      // UPDATE: Altera posologia, dosagem, via, horários ou observações sem necessidade de suspender
      const updatePayloadBase = {
        medicamento: med.trim(),
        dose: dose.trim() || '1 cp',
        via: via.trim(),
        tipo,
        horarios,
        obs: obs.trim(),
        ...(prescEditando.suspensa && reativarAoSalvar ? { suspensa: false } : {}),
      }

      let { error } = await supabase
        .from('prescricoes')
        .update({
          ...updatePayloadBase,
          controlado,
        })
        .eq('id', prescEditando.id)

      if (error && (error.code === '42703' || error.message?.includes('controlado'))) {
        const resFallback = await supabase
          .from('prescricoes')
          .update(updatePayloadBase)
          .eq('id', prescEditando.id)
        error = resFallback.error
      }

      setSalvando(false)

      if (error) {
        toast.error('Erro ao atualizar prescrição: ' + error.message)
        return
      }

      const msgSucesso = prescEditando.suspensa && reativarAoSalvar
        ? 'Prescrição médica corrigida e reativada com sucesso!'
        : 'Prescrição médica atualizada com sucesso!'
      toast.success(msgSucesso)

      setModalNova(false)
      setPrescEditando(null)
      await data.refresh()
      return
    }

    // INSERT: Novo cadastro
    const id = 'p_' + Math.random().toString(36).substring(2, 9)

    const basePayload = {
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
      assinatura: { id: profissional.id, d: T, h: agoraHM(), controlado },
    }

    // Tenta inserir com a coluna controlado (se existir no schema do banco)
    let { error } = await supabase.from('prescricoes').insert({
      ...basePayload,
      controlado,
    })

    // Fallback gracioso se a coluna 'controlado' ainda não existir na tabela PostgreSQL
    if (error && (error.code === '42703' || error.message?.includes('controlado'))) {
      const resFallback = await supabase.from('prescricoes').insert(basePayload)
      error = resFallback.error
    }

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
    setControlado(false)
    setControladoManual(false)
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
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Pill className="size-4 text-primary" />
          Prescrições Médicas Vigentes
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={() => setModalReceita(true)}
            className="gap-1.5 rounded-lg text-xs font-semibold text-foreground border-border/70 hover:bg-muted"
          >
            <Printer className="size-3 text-emerald-600 dark:text-emerald-400" />
            Imprimir Receituário
          </Button>
          {can(cat, 'presc') && (
            <Button
              size="xs"
              onClick={handleAbrirModal}
              className="gap-1.5 rounded-lg text-xs font-semibold bg-[#123F4A] hover:bg-[#123F4A]/90 text-white"
            >
              <Plus className="size-3" />
              Nova Prescrição
            </Button>
          )}
        </div>
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
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-foreground">{p.med}</span>
                    {isMedicamentoControlado(p) && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35 font-semibold gap-1 inline-flex items-center"
                        title="Medicamento sujeito a controle especial (Portaria 344/98)"
                      >
                        <ShieldAlert className="size-2.5 text-amber-600 dark:text-amber-400" />
                        Controlado
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.dose} ({p.via})</TableCell>
                <TableCell className="text-xs font-medium">{freqTxtMed(p)}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className="text-[10px]">
                    {TIPOS_PRESC[p.tipo] || p.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {can(cat, 'presc') ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleAbrirEditar(p)}
                        className="text-[11px] font-semibold h-6 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Editar posologia, dosagem ou horários"
                      >
                        <Edit3 className="size-3 mr-1" />
                        Editar
                      </Button>
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
                    </div>
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

      <Dialog open={modalNova} onOpenChange={(open) => {
        setModalNova(open)
        if (!open) setPrescEditando(null)
      }}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSalvarPrescricao}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                {prescEditando ? (
                  <>
                    <Edit3 className="size-4 text-[#123F4A]" />
                    Editar Prescrição Médica
                  </>
                ) : (
                  'Cadastrar Prescrição Médica'
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {prescEditando
                  ? 'Corrija a posologia, horários, dosagem ou via deste medicamento sem precisar suspender.'
                  : 'A prescrição alimentará a ronda de medicação do plantão assistencial.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-xs">
              {/* Opção para reativar caso o medicamento esteja atualmente suspenso */}
              {prescEditando?.suspensa && (
                <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs text-amber-950 dark:text-amber-200 font-bold block">
                      Medicamento Atualmente Suspenso
                    </span>
                    <span className="text-[11px] text-amber-900/80 dark:text-amber-300/80 block">
                      Deseja reativar o medicamento imediatamente após salvar a correção?
                    </span>
                  </div>
                  <Checkbox
                    id="pReativar"
                    checked={reativarAoSalvar}
                    onCheckedChange={(checked) => setReativarAoSalvar(!!checked)}
                    className="data-checked:bg-emerald-600 data-checked:border-emerald-600 shrink-0"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="pMed" className="text-[11px] font-semibold">Medicamento & Dosagem *</Label>
                <Input
                  id="pMed"
                  value={med}
                  onChange={(e) => {
                    const val = e.target.value
                    setMed(val)
                    if (!controladoManual) {
                      setControlado(detectControlado(val))
                    }
                  }}
                  placeholder="Ex: Clonazepam 2 mg ou Losartana Potássica 50 mg"
                  required
                  className="h-8 text-xs"
                />
              </div>

              {/* Bloco de identificação de Medicamento Controlado */}
              <div
                className={cn(
                  'p-3 rounded-lg border transition-colors flex items-start gap-3',
                  controlado
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
                    : 'bg-muted/30 border-border/60'
                )}
              >
                <Checkbox
                  id="pControlado"
                  checked={controlado}
                  onCheckedChange={(checked) => {
                    setControladoManual(true)
                    setControlado(!!checked)
                  }}
                  className="mt-0.5 data-checked:bg-amber-600 data-checked:border-amber-600"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label
                      htmlFor="pControlado"
                      className="text-xs font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldAlert
                        className={cn(
                          'size-3.5',
                          controlado ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                        )}
                      />
                      Medicamento Controlado / Psicotrópico
                    </Label>
                    {controlado && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                      >
                        Portaria 344/98
                      </Badge>
                    )}
                    {controlado && !controladoManual && detectControlado(med) && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium italic">
                        (detectado automaticamente)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Identifica receitas retidas, guarda em armário trancado e medicação com dupla checagem no plantão.
                  </p>
                </div>
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
                  <SearchableSelect
                    id="pVia"
                    value={via}
                    onValueChange={setVia}
                    searchPlaceholder="Buscar via..."
                    options={[
                      { value: 'EV', label: 'Endovenosa (EV)' },
                      { value: 'Inalatório', label: 'Inalatória' },
                      { value: 'IM', label: 'Intramuscular (IM)' },
                      { value: 'Ocular', label: 'Ocular' },
                      { value: 'VO', label: 'Oral (VO)' },
                      { value: 'VR', label: 'Retal (VR)' },
                      { value: 'SC', label: 'Subcutânea (SC)' },
                      { value: 'Tópico', label: 'Tópica' },
                    ]}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pTipo" className="text-[11px] font-semibold">Tipo de Posologia</Label>
                  <SearchableSelect
                    id="pTipo"
                    value={tipo}
                    onValueChange={(v) => setTipo(v as 'diario' | 'sn' | 'dias' | 'intervalo')}
                    searchPlaceholder="Buscar posologia..."
                    options={[
                      { value: 'diario', label: 'Diário (horários fixos)' },
                      { value: 'intervalo', label: 'Intervalado' },
                      { value: 'sn', label: 'Se Necessário (SN)' },
                    ]}
                  />
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setModalNova(false)
                  setPrescEditando(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={salvando} className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold">
                {salvando ? 'Salvando...' : prescEditando ? 'Salvar Alterações' : 'Salvar Prescrição'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ModalPedidoMedico
        open={modalReceita}
        onOpenChange={setModalReceita}
        residente={r}
        tipoInicial="receituario"
        onPedidoSalvo={() => void data.refresh()}
      />
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
  const [dextro, setDextro] = useState('')
  const [diurese, setDiurese] = useState('Presente')
  const [evac, setEvac] = useState('Presente')
  const [texto, setTexto] = useState('')
  const [fotos, setFotos] = useState<string[]>([])
  const [processandoFoto, setProcessandoFoto] = useState(false)

  const chaveRascunhoAnot = `residente_anotacao_draft_${r.id}`

  // Restaura rascunho salvo ao abrir modal de anotação
  useEffect(() => {
    if (!modalNova) return
    const rascunho = obterRascunho<{
      pa: string
      pulso: string
      temp: string
      sat: string
      dextro: string
      diurese: string
      evac: string
      texto: string
    }>(chaveRascunhoAnot)
    if (rascunho?.dados) {
      if (rascunho.dados.pa) setPa(rascunho.dados.pa)
      if (rascunho.dados.pulso) setPulso(rascunho.dados.pulso)
      if (rascunho.dados.temp) setTemp(rascunho.dados.temp)
      if (rascunho.dados.sat) setSat(rascunho.dados.sat)
      if (rascunho.dados.dextro) setDextro(rascunho.dados.dextro)
      if (rascunho.dados.diurese) setDiurese(rascunho.dados.diurese)
      if (rascunho.dados.evac) setEvac(rascunho.dados.evac)
      if (rascunho.dados.texto) setTexto(rascunho.dados.texto)
    }
  }, [modalNova, chaveRascunhoAnot])

  // Salva rascunho automaticamente enquanto digita
  useEffect(() => {
    if (!modalNova) return
    const timer = setTimeout(() => {
      if (pa.trim() || pulso.trim() || temp.trim() || sat.trim() || dextro.trim() || texto.trim()) {
        salvarRascunho(chaveRascunhoAnot, { pa, pulso, temp, sat, dextro, diurese, evac, texto })
      } else {
        limparRascunho(chaveRascunhoAnot)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [modalNova, pa, pulso, temp, sat, dextro, diurese, evac, texto, chaveRascunhoAnot])

  // Visualização de foto expandida (Lightbox)
  const [fotoExpandida, setFotoExpandida] = useState<{
    url: string
    sig?: { id: string; d: string; h: string }
    texto?: string
  } | null>(null)

  async function handleSelecionarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setProcessandoFoto(true)
    const novasFotos: string[] = []
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue
        const urlOuData = await processarEUploadFoto(file, `res_${r.id}/evidencias`)
        novasFotos.push(urlOuData)
      }
      setFotos((prev) => [...prev, ...novasFotos])
      toast.success(`${novasFotos.length} foto(s) anexada(s) com sucesso!`)
    } catch {
      toast.error('Não foi possível processar uma ou mais fotos.')
    } finally {
      setProcessandoFoto(false)
      e.target.value = ''
    }
  }

  function handleRemoverFoto(index: number) {
    setFotos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSalvarAnotacao(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() && fotos.length === 0) {
      toast.error('Informe o relato da anotação ou anexe uma foto.')
      return
    }
    if (!profissional) {
      toast.error('Sessão expirada. Faça login novamente.')
      return
    }

    setSalvando(true)
    const id = 'a_' + Math.random().toString(36).substring(2, 9)
    const relatoFinal = texto.trim() || (fotos.length > 0 ? 'Registro de foto de comprovação/cuidado anexado.' : '')

    const { error } = await supabase.from('anotacoes').insert({
      id,
      residente_id: r.id,
      pa: pa.trim() || null,
      pulso: pulso.trim() || null,
      resp: null,
      temp: temp.trim() || null,
      sat: sat.trim() || null,
      dextro: dextro.trim() || null,
      diurese: diurese.trim() || null,
      evac: evac.trim() || null,
      texto: relatoFinal,
      fotos: fotos.length > 0 ? fotos : null,
      assinatura: { id: profissional.id, d: T, h: agoraHM() },
    })
    setSalvando(false)

    if (error) {
      toast.error('Erro ao salvar anotação: ' + error.message)
      return
    }

    toast.success('Anotação e comprovação registradas no prontuário!')
    limparRascunho(chaveRascunhoAnot)
    setModalNova(false)
    setPa('')
    setPulso('')
    setTemp('')
    setSat('')
    setDextro('')
    setTexto('')
    setFotos([])
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
          const profSig = data.profissionalPorId(a.sig.id)
          return (
            <Card key={a.id} className="border border-border/70 shadow-2xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-primary" />
                    {fmt(a.sig.d)} às {a.sig.h}
                  </span>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    Assinado: {profSig?.nome || a.sig.id}
                  </span>
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
                  {a.dextro && (
                    <Badge variant="outline" className={cn('text-xs font-semibold px-2 py-0.5', f.dextro ? 'bg-rose-500/10 text-rose-600 border-rose-500/25' : 'bg-muted')}>
                      <Droplets className="size-3 mr-1 inline text-primary" />
                      Dextro {a.dextro} mg/dL
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

                {a.texto && (
                  <p className="text-xs text-foreground leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/40">
                    {a.texto}
                  </p>
                )}

                {/* Galeria de Fotos / Evidências Fotográficas do Cuidado */}
                {a.fotos && a.fotos.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80">
                      <Camera className="size-3.5 text-primary" />
                      <span>Comprovação Fotográfica ({a.fotos.length} foto{a.fotos.length > 1 ? 's' : ''})</span>
                      <span className="text-[10px] text-muted-foreground font-normal">· Prova para a família e prontuário</span>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {a.fotos.map((foto, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFotoExpandida({ url: foto, sig: a.sig, texto: a.texto })}
                          className="relative group rounded-xl overflow-hidden border border-border/70 hover:border-primary/80 transition-all shadow-2xs cursor-pointer focus:outline-hidden"
                          title="Clique para ampliar"
                        >
                          <img
                            src={foto}
                            alt={`Comprovante ${idx + 1}`}
                            className="size-16 sm:size-20 object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-semibold gap-1">
                            <Maximize2 className="size-3" />
                            <span>Ver</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* Modal Registrar Anotação & SSVV com Fotos */}
      <Dialog open={modalNova} onOpenChange={setModalNova}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSalvarAnotacao}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-2">
                  <HeartPulse className="size-4 text-[#123F4A]" />
                  Registrar Anotação, SSVV & Fotos
                </span>
                {temRascunho(chaveRascunhoAnot) && (pa.trim() || pulso.trim() || temp.trim() || sat.trim() || dextro.trim() || texto.trim()) && (
                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                    ✓ Rascunho salvo
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Anotações clínicas e comprovações de cuidados (decúbito, curativos, etc.) com respaldo técnico.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {/* Sinais Vitais com Dextro Opcional */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                <span className="font-bold text-foreground text-[11px] block">Sinais Vitais (SSVV)</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">PA (mmHg)</Label>
                    <Input value={pa} onChange={(e) => setPa(mascaraPA(e.target.value))} placeholder="120x80" className="h-8 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Pulso (bpm)</Label>
                    <Input value={pulso} onChange={(e) => setPulso(e.target.value)} placeholder="76" className="h-8 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Temp (°C)</Label>
                    <Input value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="36.5" className="h-8 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">SatO2 (%)</Label>
                    <Input value={sat} onChange={(e) => setSat(e.target.value)} placeholder="98" className="h-8 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                      <Droplets className="size-2.5 text-primary" />
                      Dextro (mg/dL)
                    </Label>
                    <Input
                      value={dextro}
                      onChange={(e) => setDextro(e.target.value)}
                      placeholder="Ex: 110"
                      className="h-8 text-xs font-mono border-primary/30"
                    />
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

              {/* Seção de Fotos Comprobatórias (Decúbito, Curativos, Cuidados) */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-[11px] flex items-center gap-1.5">
                    <Camera className="size-3.5 text-primary" />
                    Fotos Comprobatórias dos Cuidados (Opcional)
                  </span>
                  <span className="text-[10px] text-muted-foreground">Prova p/ família</span>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Evite fotos perdidas no WhatsApp. Anexe fotos da <strong>mudança de decúbito</strong>, <strong>curativos</strong> ou estado geral para comprovar o cuidado diretamente no prontuário.
                </p>

                {/* Input de arquivo e botão de câmera */}
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 bg-background hover:bg-primary/10 text-primary text-xs font-semibold transition-colors">
                    <Camera className="size-3.5" />
                    <span>Tirar Foto / Câmera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      disabled={processandoFoto}
                      onChange={handleSelecionarFotos}
                      className="sr-only"
                    />
                  </label>

                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground text-xs font-medium transition-colors">
                    <ImageIcon className="size-3.5" />
                    <span>Galeria</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={processandoFoto}
                      onChange={handleSelecionarFotos}
                      className="sr-only"
                    />
                  </label>

                  {processandoFoto && (
                    <span className="text-[11px] text-primary flex items-center gap-1 animate-pulse font-medium">
                      <RefreshCw className="size-3 animate-spin" /> Processando foto...
                    </span>
                  )}
                </div>

                {/* Pré-visualização das fotos selecionadas */}
                {fotos.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-primary/15">
                    {fotos.map((f, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-border shadow-xs">
                        <img src={f} alt={`Preview ${idx + 1}`} className="size-14 object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoverFoto(idx)}
                          className="absolute top-0.5 right-0.5 size-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] hover:bg-rose-700 shadow-sm cursor-pointer"
                          title="Remover foto"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modelos rápidos */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground font-semibold block">Modelos de relato rápido (clique para preencher):</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {MODELOS_ANOT.slice(0, 6).map((m, idx) => (
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
                <Label htmlFor="anotTexto" className="text-[11px] font-semibold">
                  Relato do Plantão / Cuidados {fotos.length === 0 && '*'}
                </Label>
                <textarea
                  id="anotTexto"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={3}
                  required={fotos.length === 0}
                  placeholder="Relato detalhado do estado do residente, mudança de decúbito, curativos, queixas..."
                  className="w-full text-xs rounded-md border border-input bg-background p-2 focus-visible:outline-ring resize-none min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalNova(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={salvando || processandoFoto} className="bg-[#123F4A] hover:bg-[#123F4A]/90 text-white font-semibold">
                {salvando ? 'Salvando...' : 'Salvar no Prontuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox / Visualização Ampliada de Foto */}
      <Dialog open={!!fotoExpandida} onOpenChange={(open) => !open && setFotoExpandida(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Camera className="size-4 text-primary" />
                Comprovação Fotográfica do Prontuário
              </span>
              {fotoExpandida?.sig && (
                <span className="text-xs text-muted-foreground font-normal">
                  {fmt(fotoExpandida.sig.d)} às {fotoExpandida.sig.h}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {fotoExpandida && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-border/80 bg-black/5 dark:bg-black/30 flex items-center justify-center max-h-[60vh]">
                <img
                  src={fotoExpandida.url}
                  alt="Comprovante ampliado"
                  className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg"
                />
              </div>

              {fotoExpandida.texto && (
                <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
                  {fotoExpandida.texto}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                <span>Assinado no prontuário por: <strong>{data.profissionalPorId(fotoExpandida.sig?.id || '')?.nome || fotoExpandida.sig?.id}</strong></span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => window.open(fotoExpandida.url, '_blank')}
                  className="gap-1 text-xs"
                >
                  <ExternalLink className="size-3" />
                  Abrir Original
                </Button>
              </div>
            </div>
          )}
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

  const chaveRascunhoEvol = `residente_evolucao_draft_${r.id}`

  // Restaura rascunho salvo ao abrir modal de evolução
  useEffect(() => {
    if (!modalNova) return
    const rascunho = obterRascunho<{ texto: string; peso: string; areaEscolhida?: string }>(chaveRascunhoEvol)
    if (rascunho?.dados) {
      if (rascunho.dados.texto) setTexto(rascunho.dados.texto)
      if (rascunho.dados.peso) setPeso(rascunho.dados.peso)
      if (rascunho.dados.areaEscolhida) setAreaEscolhida(rascunho.dados.areaEscolhida)
    }
  }, [modalNova, chaveRascunhoEvol])

  // Salva rascunho automaticamente enquanto digita
  useEffect(() => {
    if (!modalNova) return
    const timer = setTimeout(() => {
      if (texto.trim() || peso.trim()) {
        salvarRascunho(chaveRascunhoEvol, { texto, peso, areaEscolhida })
      } else {
        limparRascunho(chaveRascunhoEvol)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [modalNova, texto, peso, areaEscolhida, chaveRascunhoEvol])

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
    limparRascunho(chaveRascunhoEvol)
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
              <DialogTitle className="text-base font-bold flex items-center justify-between flex-wrap gap-2">
                <span>Registrar Evolução Clínica</span>
                {temRascunho(chaveRascunhoEvol) && (texto.trim() || peso.trim()) && (
                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                    ✓ Rascunho salvo
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Conduta técnica multidisciplinar registrada no prontuário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="evArea" className="text-[11px] font-semibold">Área Técnica *</Label>
                  <SearchableSelect
                    id="evArea"
                    value={areaEscolhida}
                    onValueChange={setAreaEscolhida}
                    searchPlaceholder="Buscar área..."
                    options={[
                      { value: 'Enfermagem', label: 'Enfermagem' },
                      { value: 'Fisioterapia', label: 'Fisioterapia' },
                      { value: 'Medicina', label: 'Medicina' },
                      { value: 'Nutrição', label: 'Nutrição' },
                      { value: 'Psicologia', label: 'Psicologia' },
                      { value: 'Serviço Social', label: 'Serviço Social' },
                      { value: 'Terapia Ocupacional', label: 'Terapia Ocupacional' },
                    ]}
                  />
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
  const [modalPedido, setModalPedido] = useState(false)
  const [pedidoParaReimprimir, setPedidoParaReimprimir] = useState<PedidoMedicoData | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<string>(CATS_ARQ[0])
  const [dataDoc, setDataDoc] = useState(T)
  const [area, setArea] = useState<string>(AREAS[0])
  const [arqParaExcluir, setArqParaExcluir] = useState<{ id: string; nome: string } | null>(null)

  function handleReimprimirArquivo(f: { id: string; nome: string; cat?: string; data?: string }) {
    const locais = getPedidosLocais(r.id)
    const encontrado = locais.find((p) => p.id === f.id)
    if (encontrado) {
      setPedidoParaReimprimir(encontrado)
    } else {
      const isReceita = f.cat === 'Receita' || f.nome.toLowerCase().includes('receit')
      setPedidoParaReimprimir({
        id: f.id,
        residenteId: r.id,
        tipo: isReceita ? 'receituario' : 'exames',
        data: f.data ? String(f.data) : T,
        hora: agoraHM(),
        prescritor: {
          id: 'prof_doc',
          nome: 'Médico(a) Assistente',
          conselho: 'CRM',
          cat: 'med',
        },
        examesSelecionados: isReceita ? [] : [f.nome],
        medicamentos: isReceita
          ? [{ nome: f.nome, dose: '1 cp', posologia: 'Conforme orientação médica', via: 'VO' }]
          : [],
      })
    }
    setModalPedido(true)
  }

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
    removerPedidoLocal(r.id, arqParaExcluir.id)
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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setPedidoParaReimprimir(null)
              setModalPedido(true)
            }}
            className="rounded-xl gap-1.5 text-xs h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-2xs"
          >
            <Printer className="size-3.5" /> Emitir Pedido Médico / Imprimir
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setNome('')
              setCategoria(CATS_ARQ[0])
              setDataDoc(T)
              setArea(AREAS[0])
              setModalNovo(true)
            }}
            className="rounded-xl gap-1.5 text-xs h-8"
          >
            <Plus className="size-3.5" /> Anexar Documento / Exame
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {r.arquivos?.map((f) => {
          const isPedido = f.cat === 'Pedido Médico' || f.cat === 'Receita' || f.nome.toLowerCase().includes('pedido')
          return (
            <Card key={f.id} className="border border-border/70 shadow-2xs hover:bg-muted/15 transition-all">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'size-10 rounded-xl flex items-center justify-center shrink-0',
                      isPedido
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {isPedido ? <Stethoscope className="size-5" /> : <FileText className="size-5" />}
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

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleReimprimirArquivo(f)}
                    className="size-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                    title="Visualizar e Imprimir este documento"
                  >
                    <Printer className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setArqParaExcluir({ id: f.id, nome: f.nome })}
                    className="size-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                    title="Excluir arquivo"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!r.arquivos?.length && (
        <Card className="border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground space-y-4">
          <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <Stethoscope className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground text-sm">Nenhum exame, laudo ou pedido anexado</p>
            <p className="max-w-md mx-auto">
              Você pode emitir e imprimir pedidos médicos já prontos com folha timbrada A4 ou anexar arquivos digitalizados trazidos de fora.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => {
                setPedidoParaReimprimir(null)
                setModalPedido(true)
              }}
              className="rounded-xl gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-2xs"
            >
              <Printer className="size-3.5" /> Emitir Pedido Médico / Imprimir
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setModalNovo(true)}
              className="rounded-xl text-xs gap-1.5"
            >
              <Plus className="size-3.5" /> Anexar Arquivo Externo
            </Button>
          </div>
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
                <Label className="text-xs">Categoria *</Label>
                <SearchableSelect
                  value={categoria}
                  onValueChange={setCategoria}
                  searchPlaceholder="Buscar categoria..."
                  options={CATS_ARQ.map((c) => ({ value: c, label: c }))}
                />
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
              <SearchableSelect
                value={area}
                onValueChange={setArea}
                searchPlaceholder="Buscar área..."
                options={AREAS.map((a) => ({ value: a, label: a }))}
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
                {salvando ? 'Salvando...' : 'Anexar ao Prontuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar Exclusão de Arquivo */}
      <Dialog open={!!arqParaExcluir} onOpenChange={(open) => !open && setArqParaExcluir(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl">
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

      <ModalPedidoMedico
        open={modalPedido}
        onOpenChange={setModalPedido}
        residente={r}
        tipoInicial="exames"
        pedidoExistente={pedidoParaReimprimir}
        onPedidoSalvo={() => void data.refresh()}
      />
    </div>
  )
}

/* ==========================================================================
   TAB 10: ESTOQUE DO RESIDENTE
   ========================================================================== */
export function TabEstoque({ r, profNome }: Ctx) {
  const data = useIlpiData()
  const { profissional } = useAuth()
  const [modalPedido, setModalPedido] = useState(false)
  const [itensSelecionados, setItensSelecionados] = useState<string[]>([])
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'medicamento' | 'higiene'>('todos')

  const totalMeds = r.estoque.filter((it) => classificarTipoItem(it.id, it.nome) === 'medicamento').length
  const totalHigs = r.estoque.filter((it) => classificarTipoItem(it.id, it.nome) === 'higiene').length

  const itensExibidos = r.estoque.filter(
    (it) => filtroTipo === 'todos' || classificarTipoItem(it.id, it.nome) === filtroTipo
  )

  const todosMarcados =
    itensExibidos.length > 0 && itensExibidos.every((it) => itensSelecionados.includes(it.id))

  return (
    <Card className="border border-border/70 shadow-2xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Package className="size-4 text-primary" />
              <span>Estoque Individual</span>
              <Badge variant="secondary" className="text-xs ml-1">
                {r.estoque.length} itens
              </Badge>
            </CardTitle>

            {/* Filtros de Categoria (Medicamentos vs Higiene) */}
            <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
              <button
                type="button"
                onClick={() => setFiltroTipo('todos')}
                className={cn(
                  'px-2 py-0.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                  filtroTipo === 'todos'
                    ? 'bg-foreground text-background border-foreground shadow-2xs'
                    : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted'
                )}
              >
                Todos ({r.estoque.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('medicamento')}
                className={cn(
                  'px-2 py-0.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1',
                  filtroTipo === 'medicamento'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
                )}
              >
                <span>💊 Medicamentos</span>
                <span className="text-[10px] opacity-80">({totalMeds})</span>
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('higiene')}
                className={cn(
                  'px-2 py-0.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1',
                  filtroTipo === 'higiene'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                    : 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 hover:bg-teal-500/20'
                )}
              >
                <span>🧴 Higiene</span>
                <span className="text-[10px] opacity-80">({totalHigs})</span>
              </button>
            </div>
          </div>

          <Button
            size="xs"
            onClick={() => setModalPedido(true)}
            className="rounded-xl text-xs gap-1.5 font-semibold bg-[#123F4A] hover:bg-[#123F4A]/90 text-white shadow-xs"
            title="Gerar pedido de reposição (Farmácia comercial, Farmácia Popular ou WhatsApp da família)"
          >
            <ShoppingCart className="size-3.5" />
            <span>
              {itensSelecionados.length > 0
                ? `Gerar Pedido (${itensSelecionados.length} selecionado${itensSelecionados.length > 1 ? 's' : ''})`
                : 'Gerar Pedido / Reposição'}
            </span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-8 px-3">
                <input
                  type="checkbox"
                  title="Selecionar / Desmarcar exibidos"
                  checked={todosMarcados}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const novos = Array.from(new Set([...itensSelecionados, ...itensExibidos.map((it) => it.id)]))
                      setItensSelecionados(novos)
                    } else {
                      const idsExibidos = new Set(itensExibidos.map((it) => it.id))
                      setItensSelecionados((prev) => prev.filter((id) => !idsExibidos.has(id)))
                    }
                  }}
                  className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer align-middle"
                />
              </TableHead>
              <TableHead className="text-xs font-semibold">Material / Insumo / Medicamento</TableHead>
              <TableHead className="text-xs font-semibold">Saldo Atual</TableHead>
              <TableHead className="text-xs font-semibold">Consumo Diário</TableHead>
              <TableHead className="text-xs font-semibold text-right">Autonomia Prevista</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itensExibidos.map((it) => {
              const c = consumoDia(r, it, T)
              const n = nivelEst(c, it)
              const dias = diasRest(c, it.qtd)
              const isSelected = itensSelecionados.includes(it.id)
              const tipo = classificarTipoItem(it.id, it.nome)

              return (
                <TableRow
                  key={it.id}
                  className={cn(
                    tipo === 'medicamento'
                      ? 'border-l-4 border-l-indigo-500 bg-indigo-500/[0.02]'
                      : 'border-l-4 border-l-teal-500 bg-teal-500/[0.02]',
                    isSelected && 'bg-primary/5 dark:bg-primary/10'
                  )}
                >
                  <TableCell className="w-8 px-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        setItensSelecionados((prev) =>
                          e.target.checked ? [...prev, it.id] : prev.filter((id) => id !== it.id)
                        )
                      }}
                      className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer align-middle"
                    />
                  </TableCell>
                  <TableCell className="font-bold text-foreground text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{it.nome}</span>
                      <BadgeTipoEstoque itemId={it.id} nomeItem={it.nome} />
                      <OrigemItemSelect itemId={it.id} nomeItem={it.nome} />
                    </div>
                  </TableCell>
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
            {!itensExibidos.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-xs text-muted-foreground italic">
                  Nenhum item encontrado nesta categoria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <ModalPedidoEstoque
        open={modalPedido}
        onOpenChange={setModalPedido}
        residente={r}
        itensIniciaisIds={itensSelecionados}
        usuarioNome={profNome ? profNome(profissional?.id) : 'Responsável Técnica (RT)'}
        instituicaoNome={data.inst || 'ILPI - Residencial para Idosos'}
      />
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
