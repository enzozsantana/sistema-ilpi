import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Profissional } from '../types/ilpi'
import { mensagemAuth, mensagemSenha } from '../lib/auth-errors'
import { mapProfissional } from '../lib/db-map'
import { redimensionarAvatar } from '../lib/image'
import { supabase } from '../lib/supabase'

export type PerfilDadosEditaveis = {
  conselho: string
  setor: string
  area: string
  carga: string
  horario: string
}

type AuthState = {
  session: Session | null
  loading: boolean
  profissional: Profissional | null
  signIn: (email: string, password: string) => Promise<{ erro?: string }>
  signOut: () => Promise<void>
  refreshProfissional: () => Promise<void>
  salvarDadosPerfil: (dados: PerfilDadosEditaveis) => Promise<{ erro?: string }>
  atualizarFoto: (file: File) => Promise<{ erro?: string }>
  removerFoto: () => Promise<{ erro?: string }>
  alterarSenha: (atual: string, nova: string) => Promise<{ erro?: string }>
}

const AuthContext = createContext<AuthState | null>(null)

async function fetchProfissional(userId: string): Promise<Profissional | null> {
  const { data, error } = await supabase
    .from('profissionais')
    .select('*')
    .eq('user_id', userId)
    .eq('ativo', true)
    .maybeSingle()
  if (error || !data) return null
  return mapProfissional(data as Parameters<typeof mapProfissional>[0])
}

async function urlPublicaAssinada(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('profissionais').createSignedUrl(path, 60 * 60 * 24 * 365)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profissional, setProfissional] = useState<Profissional | null>(null)

  const loadProf = useCallback(async (userId: string) => {
    setProfissional(await fetchProfissional(userId))
  }, [])

  const refreshProfissional = useCallback(async () => {
    if (session?.user.id) await loadProf(session.user.id)
  }, [loadProf, session?.user.id])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
      if (data.session?.user.id) void loadProf(data.session.user.id)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (next?.user.id) void loadProf(next.user.id)
      else setProfissional(null)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProf])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email.trim() || !password) {
      return { erro: 'Informe e-mail e senha para entrar.' }
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error ? { erro: mensagemAuth(error) } : {}
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfissional(null)
  }, [])

  const salvarDadosPerfil = useCallback(
    async (dados: PerfilDadosEditaveis) => {
      if (!profissional?.id) return { erro: 'Perfil não encontrado.' }
      const { error } = await supabase
        .from('profissionais')
        .update({
          conselho: dados.conselho.trim(),
          setor: dados.setor.trim() || null,
          area: dados.area.trim() || null,
          carga: dados.carga.trim() || null,
          horario: dados.horario.trim() || null,
        })
        .eq('id', profissional.id)
      if (error) return { erro: 'Não foi possível salvar. Tente novamente.' }
      await refreshProfissional()
      return {}
    },
    [profissional?.id, refreshProfissional],
  )

  const atualizarFoto = useCallback(
    async (file: File) => {
      const uid = session?.user.id
      if (!uid || !profissional?.id) return { erro: 'Sessão inválida.' }
      if (!file.type.startsWith('image/')) return { erro: 'Envie uma imagem (JPG, PNG ou WebP).' }
      if (file.size > 8 * 1024 * 1024) return { erro: 'A imagem deve ter no máximo 8 MB.' }

      try {
        const blob = await redimensionarAvatar(file)
        const path = `${uid}/avatar.jpg`
        const { error: upErr } = await supabase.storage.from('profissionais').upload(path, blob, {
          upsert: true,
          contentType: 'image/jpeg',
        })
        if (upErr) return { erro: 'Não foi possível enviar a foto.' }

        const signed = await urlPublicaAssinada(path)
        const fotoUrl = signed ?? path
        const { error } = await supabase.from('profissionais').update({ foto: fotoUrl }).eq('id', profissional.id)
        if (error) return { erro: 'Foto enviada, mas não foi possível atualizar o perfil.' }
        await refreshProfissional()
        return {}
      } catch (e) {
        return { erro: e instanceof Error ? e.message : 'Falha ao processar a imagem.' }
      }
    },
    [profissional?.id, refreshProfissional, session?.user.id],
  )

  const removerFoto = useCallback(async () => {
    const uid = session?.user.id
    if (!uid || !profissional?.id) return { erro: 'Sessão inválida.' }
    await supabase.storage.from('profissionais').remove([`${uid}/avatar.jpg`])
    const { error } = await supabase.from('profissionais').update({ foto: null }).eq('id', profissional.id)
    if (error) return { erro: 'Não foi possível remover a foto.' }
    await refreshProfissional()
    return {}
  }, [profissional?.id, refreshProfissional, session?.user.id])

  const alterarSenha = useCallback(
    async (atual: string, nova: string) => {
      const email = session?.user.email
      if (!email) return { erro: 'Sessão inválida.' }
      if (nova.length < 6) return { erro: 'A nova senha precisa ter pelo menos 6 caracteres.' }
      if (atual === nova) return { erro: 'A nova senha precisa ser diferente da atual.' }

      const { error: reauth } = await supabase.auth.signInWithPassword({ email, password: atual })
      if (reauth) return { erro: mensagemSenha(reauth) }

      const { error } = await supabase.auth.updateUser({ password: nova })
      if (error) return { erro: mensagemSenha(error) }
      return {}
    },
    [session?.user.email],
  )

  const value = useMemo(
    () => ({
      session,
      loading,
      profissional,
      signIn,
      signOut,
      refreshProfissional,
      salvarDadosPerfil,
      atualizarFoto,
      removerFoto,
      alterarSenha,
    }),
    [
      session,
      loading,
      profissional,
      signIn,
      signOut,
      refreshProfissional,
      salvarDadosPerfil,
      atualizarFoto,
      removerFoto,
      alterarSenha,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
