import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { IlpiDataProvider } from './contexts/IlpiDataContext'
import { AppShell } from './components/AppShell'
import { canNav } from './lib/permissions'
import type { NavView } from './types/ilpi'
import Login from './pages/Login'
import Plantao from './pages/Plantao'
import Residentes from './pages/Residentes'
import ResidentePasta from './pages/ResidentePasta'
import Estoque from './pages/Estoque'
import Rotinas from './pages/Rotinas'
import Equipe from './pages/Equipe'
import Gestao from './pages/Gestao'
import Teleconsulta from './pages/Teleconsulta'
import Perfil from './pages/Perfil'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, profissional } = useAuth()
  if (loading) return <p className="muted" style={{ padding: 24 }}>Carregando…</p>
  if (!session) return <Navigate to="/login" replace />
  if (!profissional) {
    return (
      <main style={{ padding: 24 }}>
        <p className="err">Seu usuário não está vinculado a um profissional (tabela profissionais.user_id).</p>
      </main>
    )
  }
  return children
}

function GuardView({ view, children }: { view: NavView; children: React.ReactNode }) {
  const { profissional } = useAuth()
  if (!profissional || !canNav(profissional.cat, view)) {
    return <Navigate to="/plantao" replace />
  }
  return children
}

function AuthedRoutes() {
  return (
    <IlpiDataProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/plantao" replace />} />
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
          <Route path="perfil" element={<Perfil />} />
        </Route>
      </Routes>
    </IlpiDataProvider>
  )
}

import { Toaster } from './components/ui/sonner'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
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
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  )
}