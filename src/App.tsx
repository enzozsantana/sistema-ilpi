import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { IlpiDataProvider } from './contexts/IlpiDataContext'
import { AppShell } from './components/AppShell'
import { canNav } from './lib/permissions'
import type { NavView } from './types/ilpi'
import { Skeleton } from './components/ui/skeleton'

// Code-Splitting com React.lazy para redução drástica do bundle inicial
const Login = lazy(() => import('./pages/Login'))
const Plantao = lazy(() => import('./pages/Plantao'))
const Residentes = lazy(() => import('./pages/Residentes'))
const ResidentePasta = lazy(() => import('./pages/ResidentePasta'))
const Estoque = lazy(() => import('./pages/Estoque'))
const Rotinas = lazy(() => import('./pages/Rotinas'))
const Equipe = lazy(() => import('./pages/Equipe'))
const Gestao = lazy(() => import('./pages/Gestao'))
const Teleconsulta = lazy(() => import('./pages/Teleconsulta'))
const Treinamentos = lazy(() => import('./pages/Treinamentos'))
const Perfil = lazy(() => import('./pages/Perfil'))
const Planos = lazy(() => import('./pages/Planos'))
const ValidarReceita = lazy(() => import('./pages/ValidarReceita'))

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

import { Toaster } from './components/ui/sonner'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/validar-receita/:codigo?" element={<ValidarReceita />} />
            <Route path="/v/:codigo?" element={<ValidarReceita />} />
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