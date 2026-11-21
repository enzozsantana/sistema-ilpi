import { useEffect, useMemo, useState, Suspense } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { navVisivel } from '../lib/permissions'
import { useAuth } from '../contexts/AuthContext'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { obterProfissionaisVirtuais } from '../lib/teleconsultaStorage'
import { CURSOS_PADRAO_ILPI, TreinamentosService } from '../lib/treinamentos/treinamentosService'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'
import { NotificacoesMenu } from './NotificacoesMenu'
import { SkeletonBlock } from './Ui'
import { SenecurareLogo } from './SenecurareLogo'
import type { NavView } from '../types/ilpi'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  Activity,
  BarChart3,
  CalendarCheck2,
  Download,
  GraduationCap,
  Menu,
  PackageCheck,
  Search,
  UserCheck,
  Users,
  Video,
} from 'lucide-react'
import { CommandPaletteModal } from './CommandPaletteModal'
import { cn } from '@/lib/utils'
import { usePwaInstall } from '../hooks/usePwaInstall'

function dataCurta() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function tituloRota(pathname: string) {
  if (pathname.startsWith('/residentes/')) return 'Prontuário do Residente'
  if (pathname.startsWith('/residentes')) return 'Residentes'
  if (pathname.startsWith('/estoque')) return 'Controle de Estoque'
  if (pathname.startsWith('/rotinas')) return 'Rotinas & POPs'
  if (pathname.startsWith('/equipe')) return 'Quadro de Equipe'
  if (pathname.startsWith('/gestao')) return 'Gestão & Conformidade'
  if (pathname.startsWith('/teleconsulta')) return 'Teleconsulta & Especialistas Virtuais'
  if (pathname.startsWith('/treinamentos')) return 'Treinamentos & Educação Permanente (RDC 502)'
  if (pathname.startsWith('/perfil')) return 'Meu Perfil'
  return 'Painel de Plantão'
}

const LABELS: Record<NavView, string> = {
  equipe: 'Equipe',
  estoque: 'Estoque',
  gestao: 'Gestão',
  plantao: 'Plantão',
  residentes: 'Residentes',
  rotinas: 'Rotinas & POPs',
  teleconsulta: 'Teleconsulta',
  treinamentos: 'Treinamentos',
}

const PATHS: Record<NavView, string> = {
  equipe: '/equipe',
  estoque: '/estoque',
  gestao: '/gestao',
  plantao: '/plantao',
  residentes: '/residentes',
  rotinas: '/rotinas',
  teleconsulta: '/teleconsulta',
  treinamentos: '/treinamentos',
}

/** Ordem operacional/clínica prioritária para a rotina diária da ILPI */
const ORDEM_NAV: NavView[] = [
  'plantao',
  'residentes',
  'estoque',
  'rotinas',
  'teleconsulta',
  'treinamentos',
  'equipe',
  'gestao',
]

function getNavIcon(view: NavView | 'perfil') {
  switch (view) {
    case 'plantao':
      return Activity
    case 'residentes':
      return Users
    case 'estoque':
      return PackageCheck
    case 'rotinas':
      return CalendarCheck2
    case 'equipe':
      return UserCheck
    case 'gestao':
      return BarChart3
    case 'teleconsulta':
      return Video
    case 'treinamentos':
      return GraduationCap
    default:
      return Activity
  }
}

export function AppShell() {
  const { profissional } = useAuth()
  const { inst, residentes, equipe, casa, documentos, pops, avisosRT, loading, error } = useIlpiData()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
  const { canInstall, promptInstall } = usePwaInstall()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  const [treinamentosCount, setTreinamentosCount] = useState<number>(CURSOS_PADRAO_ILPI.length)

  // Atalho global do teclado: Ctrl+K / Cmd+K para abrir a busca rápida
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    TreinamentosService.listarCursos()
      .then((lista) => {
        if (lista && lista.length > 0) setTreinamentosCount(lista.length)
      })
      .catch(() => {})
  }, [])

  const teleconsultaCount = useMemo(() => {
    try {
      return obterProfissionaisVirtuais().length
    } catch {
      return 4
    }
  }, [])

  if (!profissional) return null

  const permitidas = navVisivel(profissional.cat)
  const views = ORDEM_NAV.filter((v) => permitidas.includes(v))
  const instNome = inst || 'Instituição'
  const ativosCount = residentes.filter((r) => r.status !== 'obito').length

  const getNavCount = (v: NavView): number => {
    switch (v) {
      case 'residentes':
        return ativosCount
      case 'equipe':
        return (equipe ?? []).filter((p) => p.ativo !== false).length || (equipe ?? []).length || 7
      case 'estoque':
        return (casa ?? []).length || 18
      case 'rotinas':
        return (pops ?? []).length || 8
      case 'gestao':
        return (documentos ?? []).length || 6
      case 'teleconsulta':
        return teleconsultaCount
      case 'treinamentos':
        return treinamentosCount
      case 'plantao':
        return (avisosRT ?? []).filter((a) => a.ativo).length || 1
      default:
        return 0
    }
  }

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="flex flex-col gap-1 px-3 py-2" aria-label="Navegação Principal">
      <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        Operação Diária
      </div>
      {views.map((v) => {
        const Icon = getNavIcon(v)
        const count = getNavCount(v)

        return (
          <NavLink
            key={v}
            to={PATHS[v]}
            onClick={onItemClick}
            className={({ isActive }) =>
              cn(
                'group flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'size-4.5 shrink-0 transition-colors',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  <span>{LABELS[v]}</span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'h-5 min-w-5 px-1.5 text-[11px] font-medium border-transparent flex items-center justify-center rounded-full transition-colors',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground font-semibold'
                      : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/15 group-hover:text-foreground'
                  )}
                >
                  {count}
                </Badge>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )

  const brandBlock = (
    <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-border/60">
      <SenecurareLogo variant="horizontal" size="md" />
      <span className="inline-block size-2 rounded-full bg-emerald-500 shrink-0" title="Sistema online" />
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border/60 bg-card/60 backdrop-blur-md shrink-0 sticky top-0 h-screen select-none z-30">
        {brandBlock}

        <div className="flex-1 overflow-y-auto py-2">
          {renderNavLinks()}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-border/50 bg-muted/15">
          <div className="px-3 py-2 rounded-xl bg-card border border-border/50 shadow-2xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-foreground">Padrão RDC 502</span>
              <span className="text-[10px] text-muted-foreground">ANVISA & COREN</span>
            </div>
            <Badge variant="outline" className="h-5 text-[10px] bg-primary/10 text-primary border-primary/20">
              SaaS v2.4
            </Badge>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 h-16 border-b border-border/60 bg-background/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden rounded-lg">
                  <Menu className="size-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 flex flex-col">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu de Navegação</SheetTitle>
                </SheetHeader>
                {brandBlock}
                <div className="flex-1 overflow-y-auto py-3">
                  {renderNavLinks(() => setMobileOpen(false))}
                </div>
              </SheetContent>
            </Sheet>

            {/* Breadcrumb / Title */}
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-foreground tracking-tight sm:text-lg leading-tight font-heading">
                {tituloRota(pathname)}
              </h2>
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
                {profissional.cat === 'tele_especialista'
                  ? 'Consultório Virtual · Telemedicina Independente'
                  : `${instNome} · ${dataCurta()}`}
              </span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão de Busca Rápida Global (Ctrl+K) */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted border border-border/60 text-xs text-muted-foreground hover:text-foreground transition-all duration-150 shadow-2xs cursor-pointer group"
            >
              <Search className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="hidden md:inline">Buscar morador, quarto, remédio...</span>
              <span className="md:hidden">Buscar...</span>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-background border border-border/70 rounded shadow-2xs text-muted-foreground">
                Ctrl K
              </kbd>
            </button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCommandPaletteOpen(true)}
              className="sm:hidden rounded-lg text-muted-foreground"
              title="Buscar morador ou remédio"
            >
              <Search className="size-4" />
            </Button>

            {/* Shift status pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border/50 text-xs font-medium text-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{profissional.cat === 'tele_especialista' ? 'Consultório online' : 'Plantão ativo'}</span>
            </div>

            {/* Online / Offline Connectivity Pill */}
            <div
              className={cn(
                "hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                isOnline
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 animate-pulse"
              )}
              title={isOnline ? "Conexão ativa e sincronizada em tempo real com a nuvem" : "Operando no modo local. As alterações serão sincronizadas ao reconectar."}
            >
              <span className={cn("size-1.5 rounded-full", isOnline ? "bg-emerald-500" : "bg-amber-500")} />
              <span>{isOnline ? "Sincronizado" : "Modo Local"}</span>
            </div>

            {/* Botão para instalar app nativo no computador (PWA) */}
            {canInstall && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void promptInstall()}
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg border-primary/40 bg-primary/5 text-primary hover:bg-primary/15 transition-all shadow-2xs"
                title="Instalar Senecurare como aplicativo de desktop"
              >
                <Download className="size-3.5" />
                <span>Instalar App</span>
              </Button>
            )}

            <NotificacoesMenu />
            <ThemeToggle compact />
            <UserMenu profissional={profissional} />
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-200">
          {loading && <SkeletonBlock />}
          {error && (
            <div className="p-4 mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm font-medium">
              {error}
            </div>
          )}
          <Suspense fallback={<SkeletonBlock />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Modal de Busca Rápida Global Command Palette */}
      <CommandPaletteModal open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </div>
  )
}
