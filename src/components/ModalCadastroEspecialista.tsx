import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { EspecialidadeVirtual } from '../types/teleconsulta'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import { PasswordInput } from './ui/password-input'
import { toast } from 'sonner'

interface ModalCadastroEspecialistaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModalCadastroEspecialista({
  open,
  onOpenChange,
}: ModalCadastroEspecialistaProps) {
  const { cadastrarEspecialista } = useAuth()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [especialidade, setEspecialidade] = useState<EspecialidadeVirtual>('estomaterapia')
  const [registro, setRegistro] = useState('')
  const [titulo, setTitulo] = useState('')
  const [consultorio, setConsultorio] = useState('')
  const [preco, setPreco] = useState('200')
  const [bio, setBio] = useState('')

  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')

    if (!nome.trim() || !email.trim() || !senha.trim() || !confirmaSenha.trim()) {
      setErro('Preencha seu nome, e-mail, senha e confirmação de senha.')
      return
    }
    if (senha.length < 6) {
      setErro('A senha deve conter pelo menos 6 caracteres.')
      return
    }
    if (senha !== confirmaSenha) {
      setErro('As senhas não coincidem. Digite a mesma senha nos dois campos.')
      return
    }
    if (!registro.trim()) {
      setErro('Informe o seu registro profissional (CRM, COREN, CRN, CRP ou CREFITO).')
      return
    }

    setBusy(true)
    try {
      const res = await cadastrarEspecialista({
        nome: nome.trim(),
        email: email.trim(),
        senha: senha.trim(),
        especialidade,
        registro: registro.trim(),
        titulo: titulo.trim() || 'Especialista em Telemedicina',
        consultorio: consultorio.trim() || 'Consultório Virtual',
        preco: Number(preco) || 180,
        bio: bio.trim(),
      })

      if (res.erro) {
        setErro(res.erro)
        setBusy(false)
        return
      }

      toast.success('Cadastro realizado com sucesso!', {
        description: 'Bem-vindo ao seu Consultório Virtual. Seu perfil já está visível para agendamentos.',
      })
      onOpenChange(false)
    } catch (err: any) {
      setErro(err?.message || 'Erro ao realizar cadastro.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-border/80">
        <DialogHeader className="space-y-3 pb-2 border-b border-border/40">
          <div className="flex items-center gap-3.5">
            <div className="size-12 sm:size-14 rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Stethoscope className="size-6 sm:size-7" />
            </div>
            <div>
              <DialogTitle className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-foreground">
                Cadastro de Especialista Independente
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                Atenda idosos e residentes de ILPIs parceiras ou realize teleconsultas particulares integradas ao prontuário.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {erro && (
            <Alert variant="destructive" className="py-3 rounded-2xl">
              <AlertCircle className="size-5" />
              <AlertDescription className="text-xs sm:text-sm font-medium ml-2">{erro}</AlertDescription>
            </Alert>
          )}

          {/* Destaque de Acesso Exclusivo e Split */}
          <div className="p-4 sm:p-5 rounded-2xl border border-teal-500/30 bg-teal-500/5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200 text-xs sm:text-sm">
              <Sparkles className="size-4.5 text-[#D9694F]" />
              <span>Acesso Direto ao Módulo de Teleconsulta & Consultório Virtual</span>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Como especialista credenciado independente, você terá acesso dedicado para realizar teleconsultas por vídeo em alta definição, prescrever receitas, solicitar exames, registrar evoluções no prontuário e receber honorários diretamente na sua conta do <strong>Mercado Pago</strong> via split automático com comissão retida na fonte.
            </p>
          </div>

          {/* SEÇÃO 1: Identificação e Acesso */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-foreground font-extrabold">1</span>
              <span>Identificação & Acesso à Plataforma</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-semibold">Nome Completo *</Label>
                <Input
                  placeholder="ex: Dr. Gabriel Antunes"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="h-10.5 text-xs sm:text-sm rounded-xl px-3.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-semibold">E-mail de Acesso *</Label>
                <Input
                  type="email"
                  placeholder="ex: gabriel@clinica.med.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10.5 text-xs sm:text-sm rounded-xl px-3.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-semibold">Senha de Acesso *</Label>
                <PasswordInput
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength={6}
                  className="h-10.5 text-xs sm:text-sm rounded-xl px-3.5"
                  showPasswordLabel="Exibir senha de acesso"
                  hidePasswordLabel="Ocultar senha de acesso"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-semibold">Confirmar Senha *</Label>
                <PasswordInput
                  placeholder="Repita a senha de acesso"
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  required
                  minLength={6}
                  className="h-10.5 text-xs sm:text-sm rounded-xl px-3.5"
                  showPasswordLabel="Exibir confirmação de senha"
                  hidePasswordLabel="Ocultar confirmação de senha"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: Registro e Especialidade */}
          <div className="space-y-3 pt-1 border-t border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 pt-2">
              <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-foreground font-extrabold">2</span>
              <span>Especialidade & Registro Profissional</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-semibold">Especialidade Principal *</Label>
                <select
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value as EspecialidadeVirtual)}
                  className="w-full h-10.5 px-3 rounded-xl border border-input bg-background text-xs sm:text-sm font-medium focus:ring-2 focus:ring-ring"
                >
                  <option value="estomaterapia">Estomaterapia & Feridas (Enfermagem)</option>
                  <option value="fisioterapia">Fisioterapia Geriátrica</option>
                  <option value="medica">Medicina Geriátrica</option>
                  <option value="nutricao">Nutrição Clínica Geriátrica</option>
                  <option value="psicologia">Psicologia & Demências</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-semibold">Conselho & Registro *</Label>
                <Input
                  placeholder="ex: CRM-SP 189432 / COREN-SP 24512"
                  value={registro}
                  onChange={(e) => setRegistro(e.target.value)}
                  required
                  className="h-10.5 text-xs sm:text-sm rounded-xl px-3.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-semibold">Título / Qualificação</Label>
                <Input
                  placeholder="ex: Geriatra Titulado SBGG / Mestre USP"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="h-10.5 text-xs sm:text-sm rounded-xl px-3.5"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: Consultório e Honorários */}
          <div className="space-y-3 pt-1 border-t border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 pt-2">
              <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-foreground font-extrabold">3</span>
              <span>Consultório Virtual & Honorários</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-semibold">Nome do Consultório / Clínica</Label>
                <Input
                  placeholder="ex: Consultório Virtual Dr. Gabriel Antunes"
                  value={consultorio}
                  onChange={(e) => setConsultorio(e.target.value)}
                  className="h-10.5 text-xs sm:text-sm rounded-xl px-3.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-semibold">Valor da Consulta (R$) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="5"
                  placeholder="200"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  required
                  className="h-10.5 text-xs sm:text-sm rounded-xl px-3.5"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: Biografia e Apresentação */}
          <div className="space-y-3 pt-1 border-t border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 pt-2">
              <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-foreground font-extrabold">4</span>
              <span>Apresentação & Biografia Clínica</span>
            </h3>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-semibold">Mini-biografia para os Acolhidos e ILPIs</Label>
              <textarea
                placeholder="Descreva sua experiência, áreas de atuação e abordagem com idosos e suporte especializado para ILPIs..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full text-xs sm:text-sm rounded-xl border border-input bg-background p-3 focus-visible:outline-ring resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Chamada para Split Mercado Pago */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs sm:text-sm text-muted-foreground">
            <ArrowRightLeft className="size-5 text-[#009EE3] shrink-0" />
            <span>
              Ao concluir o cadastro, você poderá conectar sua conta do <strong>Mercado Pago</strong> com 1 clique para receber os repasses das teleconsultas com divisão automática de comissão.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10.5 px-5 text-xs sm:text-sm rounded-xl font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="h-10.5 px-6 text-xs sm:text-sm rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-2 shadow-xs transition-all"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Concluir Cadastro & Abrir Consultório
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
