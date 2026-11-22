import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { IlpiDataProvider } from './contexts/IlpiDataContext'
import { AppShell } from './components/AppShell'
import { canNav } from './lib/permissions'
import type { NavView } from './types/ilpi'
import { Skeleton } from './components/ui/skeleton'
import { SenecurareLogo } from './components/SenecurareLogo'
import { ThemeToggle } from './components/ThemeToggle'
import { Button } from './components/ui/button'
import { Toaster } from './components/ui/sonner'
import { processarCobrancaRecorrente } from './lib/plans'
// Code-Splitting com React.lazy para redução drástica do bundle inicial
const LandingPage = lazy(() => import('./pages/LandingPage'))
const Login = lazy(() => import('./pages/Login'))
const Plantao = lazy(() => import('./pages/Plantao'))
const Residentes = lazy(() => import('./pages/Residentes'))
const ResidentePasta = lazy(() => import('./pages/ResidentePasta'))
const Estoque = lazy(() => import('./pages/Estoque'))
const Rotinas = lazy(() => import('./pages/Rotinas'))
const Equipe = lazy(() => import('./pages/Equipe'))
const Gestao = lazy(() => import('./pages/Gestao'))
const Teleconsulta = lazy(() => import('./pages/Teleconsulta'))
const AgendaTeleconsulta = lazy(() => import('./pages/AgendaTeleconsulta'))
const Treinamentos = lazy(() => import('./pages/Treinamentos'))
const Perfil = lazy(() => import('./pages/Perfil'))
const Planos = lazy(() => import('./pages/Planos'))

function PageFallback() {
  return (
    <div className="space-y-4 p-4 max-w-6xl mx-auto animate-pulse" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, profissional } = useAuth()

  useEffect(() => {
    processarCobrancaRecorrente()
  }, [])
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background space-y-3">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Carregando Senecurare…</p>
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  if (!profissional) {
    return (
      <main className="p-8 max-w-lg mx-auto text-center space-y-3">
        <p className="text-sm font-semibold text-destructive">
          Seu usuário não está vinculado a um profissional (tabela profissionais.user_id).
        </p>
      </main>
    )
  }
  return <IlpiDataProvider>{children}</IlpiDataProvider>
}

function RootRedirect() {
  const { profissional } = useAuth()
  if (profissional?.cat === 'tele_especialista') {
    return <Navigate to="/teleconsulta" replace />
  }
  return <Navigate to="/plantao" replace />
}

function GuardView({ view, children }: { view: NavView; children: React.ReactNode }) {
  const { profissional } = useAuth()
  if (!profissional || !canNav(profissional.cat, view)) {
    const fallback = profissional?.cat === 'tele_especialista' ? '/teleconsulta' : '/plantao'
    return <Navigate to={fallback} replace />
  }
  return children
}

function AuthedRoutes() {
  return (
    <Routes>
        <Route element={<AppShell />}>
          <Route index element={<RootRedirect />} />
          <Route
            path="plantao"
            element={
              <GuardView view="plantao">
                <Plantao />
              </GuardView>
            }
          />
          <Route
            path="residentes"
            element={
              <GuardView view="residentes">
                <Residentes />
              </GuardView>
            }
          />
          <Route
            path="residentes/:id/:tab?"
            element={
              <GuardView view="residentes">
                <ResidentePasta />
              </GuardView>
            }
          />
          <Route
            path="estoque"
            element={
              <GuardView view="estoque">
                <Estoque />
              </GuardView>
            }
          />
          <Route
            path="rotinas"
            element={
              <GuardView view="rotinas">
                <Rotinas />
              </GuardView>
            }
          />
          <Route
            path="equipe"
            element={
              <GuardView view="equipe">
                <Equipe />
              </GuardView>
            }
          />
          <Route
            path="gestao"
            element={
              <GuardView view="gestao">
                <Gestao />
              </GuardView>
            }
          />
          <Route
            path="teleconsulta"
            element={
              <GuardView view="teleconsulta">
                <Teleconsulta />
              </GuardView>
            }
          />
          <Route
            path="agenda"
            element={
              <GuardView view="agenda">
                <AgendaTeleconsulta />
              </GuardView>
            }
          />
          <Route
            path="agenda-teleconsulta"
            element={<Navigate to="/agenda" replace />}
          />
          <Route
            path="treinamentos"
            element={
              <GuardView view="treinamentos">
                <Treinamentos />
              </GuardView>
            }
          />
          <Route path="perfil" element={<Perfil />} />
          <Route path="planos" element={<Planos />} />
        </Route>
      </Routes>
    )
  }

function HomeRoute() {
  const { session, loading, profissional } = useAuth()
  if (loading) return <PageFallback />
  if (session) {
    if (profissional?.cat === 'tele_especialista') {
      return <Navigate to="/teleconsulta" replace />
    }
    return <Navigate to="/plantao" replace />
  }
  return <LandingPage />
}

function PlanosPublicPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/90 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <SenecurareLogo variant="horizontal" size="sm" showTagline />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/landing"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Página Inicial
            </Link>
            <ThemeToggle />
            <Button size="sm" asChild className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 shadow-xs">
              <Link to="/login">Entrar no Sistema</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Planos />
      </main>
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground bg-muted/20">
        © 2026 Senecurare Healthcare · Planos & Preços Transparentes para ILPIs
      </footer>
    </div>
  )
}

function PlanosRoute() {
  const { session, loading } = useAuth()
  if (loading) return <PageFallback />
  if (!session) {
    return <PlanosPublicPage />
  }
  return (
    <RequireAuth>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Planos />} />
        </Route>
      </Routes>
    </RequireAuth>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/planos" element={<PlanosRoute />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <AuthedRoutes />
                </RequireAuth>
              }
            />
          </Routes>
        </Suspense>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  )
}