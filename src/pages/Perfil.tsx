import { useRef, useState, type FormEvent } from 'react'
import { AREAS, CATS, SETORES } from '../lib/constants'
import { useAuth } from '../contexts/AuthContext'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { Avatar, PageHeader } from '../components/Ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import {
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { mascaraConselho } from '../lib/masks'

export default function Perfil() {
  const {
    session,
    profissional,
    salvarDadosPerfil,
    atualizarFoto,
    removerFoto,
    alterarSenha,
  } = useAuth()
  const { refresh } = useIlpiData()
  const fileRef = useRef<HTMLInputElement>(null)

  const [conselho, setConselho] = useState(profissional?.conselho ?? '')
  const [setor, setSetor] = useState(profissional?.setor ?? '')
  const [area, setArea] = useState(profissional?.area ?? '')
  const [carga, setCarga] = useState(profissional?.carga ?? '')
  const [horario, setHorario] = useState(profissional?.horario ?? '')
  const [erroDados, setErroDados] = useState('')
  const [busyDados, setBusyDados] = useState(false)

  const [erroFoto, setErroFoto] = useState('')
  const [busyFoto, setBusyFoto] = useState(false)

  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [senhaConf, setSenhaConf] = useState('')
  const [showAtual, setShowAtual] = useState(false)
  const [showNova, setShowNova] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [erroSenha, setErroSenha] = useState('')
  const [busySenha, setBusySenha] = useState(false)

  if (!profissional) return null

  async function onSalvarDados(e: FormEvent) {
    e.preventDefault()
    setBusyDados(true)
    setErroDados('')
    const res = await salvarDadosPerfil({ conselho, setor, area, carga, horario })
    setBusyDados(false)
    if (res.erro) {
      setErroDados(res.erro)
      toast.error(res.erro)
    } else {
      toast.success('Dados profissionais atualizados com sucesso!')
      await refresh()
    }
  }

  async function onEscolherFoto(file: File | undefined) {
    if (!file) return
    setBusyFoto(true)
    setErroFoto('')
    const res = await atualizarFoto(file)
    setBusyFoto(false)
    if (res.erro) {
      setErroFoto(res.erro)
      toast.error(res.erro)
    } else {
      toast.success('Foto de perfil atualizada!')
      await refresh()
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function onRemoverFoto() {
    setBusyFoto(true)
    setErroFoto('')
    const res = await removerFoto()
    setBusyFoto(false)
    if (res.erro) {
      setErroFoto(res.erro)
      toast.error(res.erro)
    } else {
      toast.success('Foto de perfil removida.')
      await refresh()
    }
  }

  async function onTrocarSenha(e: FormEvent) {
    e.preventDefault()
    setErroSenha('')
    if (senhaNova !== senhaConf) {
      setErroSenha('A confirmação não confere com a nova senha.')
      return
    }
    setBusySenha(true)
    const res = await alterarSenha(senhaAtual, senhaNova)
    setBusySenha(false)
    if (res.erro) {
      setErroSenha(res.erro)
      toast.error(res.erro)
      return
    }
    setSenhaAtual('')
    setSenhaNova('')
    setSenhaConf('')
    toast.success('Senha de acesso alterada com sucesso!')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Meu Perfil"
        lede="Gerencie sua foto de identificação, credenciais profissionais e segurança da conta."
      />

      {/* Identity Card */}
      <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group">
              <Avatar r={profissional} size="xl" className="ring-2 ring-primary/20 shadow-md" />
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => void onEscolherFoto(e.target.files?.[0])}
              />
            </div>

            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">
                  {profissional.nome}
                </h2>
                <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                  {CATS[profissional.cat]}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground font-medium">
                Função: {profissional.funcao || 'Profissional de Plantão'}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="xs"
                  variant="default"
                  disabled={busyFoto}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg text-xs gap-1.5 font-semibold"
                >
                  <Camera className="size-3.5" />
                  <span>{busyFoto ? 'Salvando...' : profissional.foto ? 'Trocar foto' : 'Enviar foto'}</span>
                </Button>

                {profissional.foto && (
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={busyFoto}
                    onClick={() => void onRemoverFoto()}
                    className="rounded-lg text-xs gap-1.5 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Remover</span>
                  </Button>
                )}
              </div>

              {erroFoto && <p className="text-xs text-destructive font-medium pt-1">{erroFoto}</p>}
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1 w-full sm:w-64">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Mail className="size-3" /> E-mail de Acesso
              </span>
              <span className="font-semibold text-foreground block truncate">
                {session?.user.email ?? '–'}
              </span>
              <span className="text-[10px] text-muted-foreground block pt-1">
                Vínculo institucional autenticado via Supabase.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Profissionais Form */}
      <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
          <div className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            <CardTitle className="text-sm font-bold font-heading">
              Informações do Cadastro Profissional
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Dados de registro de conselho de classe e setor de atuação no residencial.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={(e) => void onSalvarDados(e)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="conselho" className="text-xs font-semibold">
                  Conselho Profissional (COREN, CRM, CREFITO...)
                </Label>
                <Input
                  id="conselho"
                  type="text"
                  value={conselho}
                  onChange={(e) => setConselho(mascaraConselho(e.target.value))}
                  placeholder="Ex.: COREN-SP 123.456-ENF"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setor" className="text-xs font-semibold">
                  Setor Assistencial
                </Label>
                <select
                  id="setor"
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  className="w-full h-9 text-xs rounded-xl border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                >
                  <option value="">Selecione o setor...</option>
                  {SETORES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="area" className="text-xs font-semibold">
                  Área Multiprofissional
                </Label>
                <select
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full h-9 text-xs rounded-xl border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                >
                  <option value="">Selecione a área...</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="carga" className="text-xs font-semibold">
                  Carga Horária Contratual
                </Label>
                <Input
                  id="carga"
                  type="text"
                  value={carga}
                  onChange={(e) => setCarga(e.target.value)}
                  placeholder="Ex.: 12x36 ou 40h semanais"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="horario" className="text-xs font-semibold">
                  Horário de Trabalho e Escala Habitual
                </Label>
                <Input
                  id="horario"
                  type="text"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  placeholder="Ex.: Plantão Diurno 07h às 19h"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            {erroDados && (
              <p className="text-xs text-destructive font-medium pt-1">{erroDados}</p>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={busyDados}
                className="h-9 text-xs font-semibold rounded-xl"
              >
                {busyDados ? (
                  <>
                    <Loader2 className="size-3.5 mr-2 animate-spin" />
                    Salvando dados...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Alteração de Senha */}
      <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            <CardTitle className="text-sm font-bold font-heading">
              Segurança & Troca de Senha
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Atualize sua senha de autenticação na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={(e) => void onTrocarSenha(e)} className="space-y-4 md:col-span-2">
              <div className="space-y-1.5">
                <Label htmlFor="senhaAtual" className="text-xs font-semibold">
                  Senha atual *
                </Label>
                <div className="relative">
                  <Input
                    id="senhaAtual"
                    type={showAtual ? 'text' : 'password'}
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-9 text-xs pr-10 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAtual((v) => !v)}
                    className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                  >
                    {showAtual ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="senhaNova" className="text-xs font-semibold">
                  Nova senha (mínimo de 6 caracteres) *
                </Label>
                <div className="relative">
                  <Input
                    id="senhaNova"
                    type={showNova ? 'text' : 'password'}
                    value={senhaNova}
                    onChange={(e) => setSenhaNova(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-9 text-xs pr-10 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNova((v) => !v)}
                    className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                  >
                    {showNova ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="senhaConf" className="text-xs font-semibold">
                  Confirmar nova senha *
                </Label>
                <div className="relative">
                  <Input
                    id="senhaConf"
                    type={showConf ? 'text' : 'password'}
                    value={senhaConf}
                    onChange={(e) => setSenhaConf(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-9 text-xs pr-10 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConf((v) => !v)}
                    className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                    aria-label={showConf ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
                  >
                    {showConf ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                </div>
              </div>

              {erroSenha && (
                <Alert variant="destructive" className="py-2 rounded-xl text-xs">
                  <AlertDescription>{erroSenha}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={busySenha}
                className="h-9 text-xs font-semibold rounded-xl"
              >
                {busySenha ? (
                  <>
                    <Loader2 className="size-3.5 mr-2 animate-spin" />
                    Atualizando senha...
                  </>
                ) : (
                  'Atualizar Senha'
                )}
              </Button>
            </form>

            {/* Dicas de Segurança */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-2.5 h-fit">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-600" />
                Segurança do Prontuário
              </span>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Todas as ações assistenciais (administração de medicamentos, sinais vitais e anotações)
                são assinadas eletronicamente com seu usuário.
              </p>
              <div className="pt-2 border-t border-border/40 space-y-1 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                  <span>Nunca compartilhe sua senha</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                  <span>Bloqueie a tela ao se ausentar</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
