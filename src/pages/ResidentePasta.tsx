import { useNavigate, useParams } from 'react-router-dom'
import { fmt, idade } from '../lib/business/dates'
import { grau as calcGrau } from '../lib/business/escalas'
import { carregarConfigEscalas } from '../lib/business/escalasConfig'
import { useAuth } from '../contexts/AuthContext'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { Allergy, Avatar, StatusBadge } from '../components/Ui'
import type { AbaResidente } from '../types/ilpi'
import { RTABS, renderTab, tabsVisiveis } from './residente/Tabs'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
  Activity,
  ArrowLeft,
  Calendar,
  ChevronRight,
  FileText,
  HeartHandshake,
  Home,
  Package,
  Phone,
  Pill,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function getTabIcon(tab: AbaResidente) {
  switch (tab) {
    case 'pasta':
      return FileText
    case 'ficha':
      return User
    case 'aval':
      return Activity
    case 'pia':
      return HeartHandshake
    case 'cuidados':
      return Activity
    case 'presc':
      return Pill
    case 'anot':
      return Activity
    case 'evol':
      return Calendar
    case 'arquivos':
      return FileText
    case 'estoque':
      return Package
    case 'tudo':
      return FileText
    default:
      return FileText
  }
}

export default function ResidentePasta() {
  const { id, tab } = useParams<{ id: string; tab?: string }>()
  const { profissional } = useAuth()
  const data = useIlpiData()
  const navigate = useNavigate()

  if (!profissional || !id) return null
  const r = data.getResidente(id)
  if (!r) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-semibold text-destructive">Residente não encontrado.</p>
        <Button onClick={() => navigate('/residentes')}>Voltar aos Residentes</Button>
      </div>
    )
  }

  const tabs = tabsVisiveis(profissional.cat, profissional.area)
  let cur: AbaResidente = (tab as AbaResidente) || 'pasta'
  if (!tabs.includes(cur)) cur = 'pasta'

  const cfg = carregarConfigEscalas()
  const g = calcGrau(r, cfg.escalaDependenciaPadrao, cfg.escalasCustomizadas) ?? 0

  const ctx = {
    r,
    cat: profissional.cat,
    area: profissional.area,
    profNome: (pid?: string) => data.profissionalPorId(pid ?? '')?.nome ?? '–',
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => navigate('/residentes')}
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="size-3.5" />
          <span>Residentes</span>
        </Button>
        <ChevronRight className="size-3 text-border" />
        <span className="text-foreground font-semibold truncate max-w-xs">{r.nome}</span>
      </div>

      {/* Patient EHR Hero Card */}
      <Card className="border border-border/80 shadow-xs bg-gradient-to-br from-card via-card to-muted/20 rounded-2xl overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
              <Avatar r={r} size="xl" className="ring-2 ring-primary/20 shadow-sm" />
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading truncate">
                    {r.nome}
                  </h1>
                  <Badge variant="secondary" className="font-mono text-xs font-semibold px-2">
                    <Home className="size-3 mr-1 inline" /> Quarto {r.quarto}
                  </Badge>
                  {r.status === 'obito' && (
                    <Badge variant="destructive" className="text-xs">
                      Óbito ({fmt(r.obitoData)})
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground font-medium flex items-center gap-2 flex-wrap">
                  <span>{idade(r.nasc)} anos</span>
                  <span>·</span>
                  <span>Nascimento: {fmt(r.nasc)}</span>
                  <span>·</span>
                  <span>Acolhimento: {fmt(r.admissao)}</span>
                  {typeof r.convenio === 'string' && r.convenio ? (
                    <>
                      <span>·</span>
                      <span>Convênio: {r.convenio}</span>
                    </>
                  ) : null}
                </p>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <Allergy alergias={r.alergias} />
                  {g ? (
                    <StatusBadge tone={g === 1 ? 'ok' : g === 2 ? 'warn' : 'danger'}>
                      Fugulin Grau {g}
                    </StatusBadge>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Quick Contact or Caregiver Info */}
            {r.responsavel?.nome && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1 shrink-0 self-start md:self-center">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Responsável Legal
                </span>
                <span className="font-bold text-foreground block">{r.responsavel.nome}</span>
                {r.responsavel.tel && (
                  <span className="text-muted-foreground flex items-center gap-1.5 pt-0.5">
                    <Phone className="size-3 text-primary" /> {r.responsavel.tel}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation Bar */}
      <div className="border-b border-border/60 overflow-x-auto pb-px">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((k) => {
            const Icon = getTabIcon(k)
            const active = cur === k
            return (
              <Button
                key={k}
                variant={active ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate(`/residentes/${id}/${k}`)}
                className={cn(
                  'gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold transition-all',
                  active
                    ? 'shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Icon className="size-3.5" />
                <span>{RTABS[k]}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2 animate-in fade-in-50 duration-200">
        {renderTab(cur, ctx)}
      </div>
    </div>
  )
}
