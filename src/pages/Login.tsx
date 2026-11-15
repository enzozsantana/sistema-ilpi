import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { Alert, AlertDescription } from '../components/ui/alert'
import { SenecurareLogo } from '../components/SenecurareLogo'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Pill,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

export default function Login() {
  const { session, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [erro, setErro] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && session) return <Navigate to="/plantao" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErro('')
    const res = await signIn(email.trim(), password)
    setBusy(false)
    if (res.erro) setErro(res.erro)
  }

  function preencherDemo() {
    setEmail('s1@ilpi.demo')
    setPassword('ILPI-Demo-2026!')
    setErro('')
    setShowPassword(true)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Branding Showcase Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-muted/40 p-12 flex-col justify-between border-r border-border/60 overflow-hidden">
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <SenecurareLogo variant="horizontal" size="lg" showTagline />
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#7FB0A0]/15 text-[#123F4A] dark:text-[#7FB0A0] border border-[#7FB0A0]/30">
            <Sparkles className="size-3.5 text-[#D9694F]" />
            <span>Árvore do Vínculo · RDC 502 / ANVISA</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-serif font-bold tracking-tight text-foreground leading-tight">
            Raízes de cuidado, <span className="italic text-[#D9694F]">laços de vida.</span>
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            O idoso e quem cuida unidos em um mesmo laço de afeto e segurança. Prontuário
            multidisciplinar, rondas de medicação com dupla checagem e gestão assistencial integrada.
          </p>

          <div className="grid gap-3 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card/70 border border-border/50 backdrop-blur-sm shadow-2xs">
              <div className="size-8 rounded-lg bg-[#7FB0A0]/20 text-[#123F4A] dark:text-[#7FB0A0] flex items-center justify-center shrink-0">
                <Pill className="size-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-foreground block">Ronda de Medicação Inteligente</span>
                <span className="text-muted-foreground">Baixa automática de estoque e checagem à beira-leito</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-card/70 border border-border/50 backdrop-blur-sm shadow-2xs">
              <div className="size-8 rounded-lg bg-[#E0A93F]/20 text-[#E0A93F] flex items-center justify-center shrink-0">
                <ShieldCheck className="size-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-foreground block">Segurança e Auditoria Sanitária</span>
                <span className="text-muted-foreground">Prontuário completo por função assistencial</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-card/70 border border-border/50 backdrop-blur-sm shadow-2xs">
              <div className="size-8 rounded-lg bg-[#D9694F]/20 text-[#D9694F] flex items-center justify-center shrink-0">
                <Heart className="size-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-foreground block">Cuidado Multidisciplinar</span>
                <span className="text-muted-foreground">Enfermagem, nutrição, fisio e cuidadores em sintonia</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground flex items-center justify-between border-t border-border/40 pt-6">
          <span>© 2026 Senecurare Healthcare</span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="size-3.5 text-[#7FB0A0]" />
            Auditoria & Dados Criptografados
          </span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 relative">
        <div className="flex justify-between items-center w-full">
          <div className="lg:hidden">
            <SenecurareLogo variant="horizontal" size="sm" />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-8">
          <Card className="border border-border/70 shadow-lg rounded-2xl">
            <CardHeader className="space-y-1.5 pb-5">
              <CardTitle className="text-2xl font-bold tracking-tight font-heading">
                Entrar no sistema
              </CardTitle>
              <CardDescription className="text-xs">
                Acesse com seu e-mail institucional de profissional da instituição.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    E-mail institucional
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ex: enfermeiro@ilpi.demo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    className="h-10 text-sm rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold">
                      Senha de acesso
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="h-10 text-sm pr-10 rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </div>

                {erro && (
                  <Alert variant="destructive" className="py-2.5 rounded-xl">
                    <AlertCircle className="size-4" />
                    <AlertDescription className="text-xs font-medium ml-2">
                      {erro}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full h-10 rounded-xl font-semibold shadow-xs transition-all"
                >
                  {busy ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    'Entrar no Plantão'
                  )}
                </Button>
              </form>

              {/* Demo Credentials Box */}
              <div className="pt-2">
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-primary" />
                      Acesso de Demonstração
                    </span>
                    <span className="text-[10px] text-muted-foreground">RT Helena</span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    E-mail: <code className="bg-background px-1 py-0.5 rounded border border-border/50 text-foreground font-mono">s1@ilpi.demo</code>
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={preencherDemo}
                    className="w-full h-8 text-xs font-semibold rounded-lg bg-background hover:bg-muted"
                  >
                    Preencher dados de demonstração
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-xs text-muted-foreground py-2">
          Suporte e plantão de enfermagem · Senecurare
        </div>
      </div>
    </div>
  )
}
