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
import type { CadastroEspecialistaInput, ProfissionalVirtual, EspecialidadeVirtual } from '../types/teleconsulta'
import { salvarProfissionalVirtual } from '../lib/teleconsultaStorage'
import { mensagemAuth, mensagemSenha } from '../lib/auth-errors'
import { mapProfissional } from '../lib/db-map'
import { redimensionarAvatar } from '../lib/image'
import { supabase } from '../lib/supabase'
import { verificarEAtivarDemoVitalicio } from '../lib/plans'

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
  cadastrarEspecialista: (dados: CadastroEspecialistaInput) => Promise<{ erro?: string; profissional?: Profissional }>
}

const AuthContext = createContext<AuthState | null>(null)

async function fetchProfissional(userId: string): Promise<Profissional | null> {
  if (typeof window !== 'undefined') {
    try {
      const rawLocal = localStorage.getItem('senecurare_especialista_session')
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal)
        if (parsed?.profissional && (parsed?.user?.id === userId || parsed?.profissional?.id === userId)) {
          return parsed.profissional
        }
      }
    } catch {}
  }

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

    if (typeof window !== 'undefined') {
      try {
        const rawLocal = localStorage.getItem('senecurare_especialista_session')
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal)
          if (parsed?.profissional && parsed?.session) {
            setSession(parsed.session)
            setProfissional(parsed.profissional)
            setLoading(false)
          }
        }
      } catch {}
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (data.session) {
        if (data.session.user?.email) {
          verificarEAtivarDemoVitalicio(data.session.user.email)
        }
        setSession(data.session)
        setLoading(false)
        if (data.session.user.id) void loadProf(data.session.user.id)
      } else {
        setLoading(false)
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (next) {
        if (next.user?.email) {
          verificarEAtivarDemoVitalicio(next.user.email)
        }
        setSession(next)
        if (next.user.id) void loadProf(next.user.id)
      } else {
        if (typeof window !== 'undefined' && localStorage.getItem('senecurare_especialista_session')) {
          // Keep specialist session
        } else {
          setProfissional(null)
          setSession(null)
        }
      }
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

    verificarEAtivarDemoVitalicio(email.trim())

    // Suporte a login de especialista independente cadastrado localmente
    if (typeof window !== 'undefined') {
      try {
        const rawLocal = localStorage.getItem('senecurare_especialista_session')
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal)
          if (
            parsed?.email?.toLowerCase() === email.trim().toLowerCase() &&
            parsed?.senha === password
          ) {
            setSession(parsed.session)
            setProfissional(parsed.profissional)
            return {}
          }
        }
      } catch {}
    }

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error ? { erro: mensagemAuth(error) } : {}
  }, [])

  const signOut = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('senecurare_especialista_session')
    }
    await supabase.auth.signOut()
    setProfissional(null)
    setSession(null)
  }, [])

  const cadastrarEspecialista = useCallback(
    async (dados: CadastroEspecialistaInput) => {
      const senhaValida = dados.senha || dados.password || ''
      if (!dados.nome.trim() || !dados.email.trim() || !senhaValida) {
        return { erro: 'Nome, e-mail e senha são obrigatórios.' }
      }
      if (!dados.registro.trim()) {
        return { erro: 'Registro profissional (CRM/COREN/CRN/CRP/CREFITO) é obrigatório.' }
      }

      const idProf = `esp_${Date.now()}`
      const userId = `user_esp_${Date.now()}`

      const labels: Record<string, string> = {
        estomaterapia: 'Estomaterapia & Feridas (Enfermagem)',
        fisioterapia: 'Fisioterapia Geriátrica',
        medica: 'Medicina Geriátrica',
        nutricao: 'Nutrição Clínica Geriátrica',
        psicologia: 'Psicologia & Demências',
      }

      const listaEspecialidades: EspecialidadeVirtual[] =
        dados.especialidades && dados.especialidades.length > 0
          ? dados.especialidades
          : dados.especialidade
            ? [dados.especialidade]
            : ['estomaterapia']

      const espPrincipal = listaEspecialidades[0]
      const especialidadesLabels =
        dados.especialidadesLabels && dados.especialidadesLabels.length > 0
          ? dados.especialidadesLabels
          : listaEspecialidades.map((e) => labels[e] || e)
      const label = especialidadesLabels.join(' • ')

      const listaTitulos: string[] =
        dados.titulos && dados.titulos.length > 0
          ? dados.titulos
          : dados.titulo?.trim()
            ? [dados.titulo.trim()]
            : [label]
      const tituloStr = listaTitulos.join(' • ')

      const novoVirtual: ProfissionalVirtual = {
        id: idProf,
        nome: dados.nome.trim(),
        titulo: tituloStr,
        titulos: listaTitulos,
        especialidade: espPrincipal,
        especialidades: listaEspecialidades,
        especialidadeLabel: label,
        especialidadesLabels,
        registro: dados.registro.trim(),
        clinica: dados.consultorio?.trim() || dados.clinica?.trim() || 'Consultório Virtual Independente',
        preco: Number(dados.preco) || 180,
        duracaoMin: dados.duracaoMin || 45,
        diasAtendimento: [1, 2, 3, 4, 5],
        foto: dados.foto || '',
        bio: dados.bio.trim() || `${label} com atendimento remoto especializado.`,
        horariosPadrao: ['09:00', '10:30', '14:00', '15:30', '17:00'],
        email: dados.email.trim(),
        isIndependente: true,
      }

      salvarProfissionalVirtual(novoVirtual)

      const profObj: Profissional = {
        id: idProf,
        userId,
        nome: dados.nome.trim(),
        cat: 'tele_especialista',
        funcao: label,
        conselho: dados.registro.trim(),
        setor: dados.consultorio?.trim() || dados.clinica?.trim() || 'Consultório Virtual',
        area: tituloStr || label,
        carga: 'Horário Flexível',
        horario: 'Telemedicina',
        ativo: true,
      }

      let sessionObj: Session | null = null
      try {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: dados.email.trim(),
          password: senhaValida,
          options: {
            data: {
              nome: dados.nome.trim(),
              cat: 'tele_especialista',
              registro: dados.registro.trim(),
            },
          },
        })
        if (!signUpErr && signUpData.session) {
          sessionObj = signUpData.session
          profObj.userId = signUpData.user?.id || userId
        }
      } catch (err) {
        console.warn('Supabase signUp ignorado, utilizando sessão local de especialista:', err)
      }

      if (!sessionObj) {
        sessionObj = {
          access_token: `mock_jwt_esp_${Date.now()}`,
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: `mock_refresh_esp_${Date.now()}`,
          user: {
            id: profObj.userId || userId,
            app_metadata: {},
            user_metadata: {
              nome: profObj.nome,
              cat: 'tele_especialista',
            },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            email: dados.email.trim(),
          },
        } as Session
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'senecurare_especialista_session',
          JSON.stringify({
            session: sessionObj,
            profissional: profObj,
            email: dados.email.trim(),
            senha: senhaValida,
          })
        )
      }

      setSession(sessionObj)
      setProfissional(profObj)
      return { profissional: profObj }
    },
    [],
  )

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
      cadastrarEspecialista,
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
      cadastrarEspecialista,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
