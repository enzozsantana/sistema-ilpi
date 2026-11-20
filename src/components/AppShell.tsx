import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { navVisivel } from '../lib/permissions'
import { useAuth } from '../contexts/AuthContext'
import { useIlpiData } from '../contexts/IlpiDataContext'
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
  Menu,
  PackageCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  if (pathname.startsWith('/perfil')) return 'Meu Perfil'
  return 'Painel de Plantão'
}

const LABELS: Record<NavView, string> = {
  plantao: 'Plantão',
  residentes: 'Residentes',
  estoque: 'Estoque',
  rotinas: 'Rotinas & POPs',
  equipe: 'Equipe',
  gestao: 'Gestão',
}

const PATHS: Record<NavView, string> = {
  plantao: '/plantao',
  residentes: '/residentes',
  estoque: '/estoque',
  rotinas: '/rotinas',
  equipe: '/equipe',
  gestao: '/gestao',
}

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
    default:
      return Activity
  }
}

export function AppShell() {
  const { profissional } = useAuth()
  const { inst, residentes, loading, error } = useIlpiData()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!profissional) return null

  const views = navVisivel(profissional.cat)
  const instNome = inst || 'Instituição'
  const ativosCount = residentes.filter((r) => r.status !== 'obito').length

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="flex flex-col gap-1 px-3 py-2" aria-label="Navegação Principal">
      <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        Operação Diária
      </div>
      {views.map((v) => {
        const Icon = getNavIcon(v)
        const isResidentes = v === 'residentes'

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
                {isResidentes && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'h-5 px-1.5 text-[11px] font-medium border-transparent',
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/15'
                    )}
                  >
                    {ativosCount}
                  </Badge>
                )}
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
                {instNome} · {dataCurta()}
              </span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Shift status pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border/50 text-xs font-medium text-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Plantão ativo</span>
            </div>

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
          <Outlet />
        </main>
      </div>
    </div>
  )
}
