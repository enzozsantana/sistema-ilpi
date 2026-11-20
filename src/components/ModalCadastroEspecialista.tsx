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
  const [especialidade, setEspecialidade] = useState<EspecialidadeVirtual>('medica')
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

    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setErro('Preencha seu nome, e-mail e senha de acesso.')
      return
    }
    if (senha.length < 6) {
      setErro('A senha deve conter pelo menos 6 caracteres.')
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 flex items-center justify-center">
              <Stethoscope className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-heading">
                Cadastro de Especialista Independente
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Atenda idosos e residentes de ILPIs parceiras ou consultas particulares por telemedicina.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {erro && (
            <Alert variant="destructive" className="py-2.5 rounded-xl">
              <AlertCircle className="size-4" />
              <AlertDescription className="text-xs font-medium ml-2">{erro}</AlertDescription>
            </Alert>
          )}

          {/* Destaque de Acesso Exclusivo e Split */}
          <div className="p-3.5 rounded-xl border border-teal-500/30 bg-teal-500/5 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-teal-800 dark:text-teal-300">
              <Sparkles className="size-4 text-[#D9694F]" />
              <span>Acesso Direto ao Módulo de Teleconsulta & Consultório</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Como especialista credenciado independente, você tem acesso dedicado para realizar teleconsultas por vídeo, emitir receitas, registrar evoluções e receber honorários diretamente na sua conta do Mercado Pago via split automático.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome Completo *</Label>
              <Input
                placeholder="ex: Dr. Gabriel Antunes"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="h-9.5 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">E-mail de Acesso *</Label>
              <Input
                type="email"
                placeholder="ex: gabriel@clinica.med.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9.5 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Senha de Acesso *</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="h-9.5 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Especialidade Principal *</Label>
              <select
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value as EspecialidadeVirtual)}
                className="w-full h-9.5 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-ring"
              >
                <option value="medica">Medicina Geriátrica</option>
                <option value="estomaterapia">Estomaterapia & Feridas (Enfermagem)</option>
                <option value="nutricao">Nutrição Clínica Geriátrica</option>
                <option value="psicologia">Psicologia & Demências</option>
                <option value="fisioterapia">Fisioterapia Geriátrica</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Conselho & Registro Profissional *</Label>
              <Input
                placeholder="ex: CRM-SP 189432 / COREN-SP 24512"
                value={registro}
                onChange={(e) => setRegistro(e.target.value)}
                required
                className="h-9.5 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Título / Titulação</Label>
              <Input
                placeholder="ex: Geriatra Titulado SBGG / Mestre USP"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="h-9.5 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome do Consultório / Clínica</Label>
              <Input
                placeholder="ex: Consultório Virtual Dr. Gabriel"
                value={consultorio}
                onChange={(e) => setConsultorio(e.target.value)}
                className="h-9.5 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Valor da Consulta (R$) *</Label>
              <Input
                type="number"
                min="0"
                step="5"
                placeholder="200"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                required
                className="h-9.5 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Apresentação / Minibiografia</Label>
            <textarea
              placeholder="Descreva sua experiência, áreas de atuação e abordagem com idosos e suporte a ILPIs..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full text-xs rounded-xl border border-input bg-background p-2.5 focus-visible:outline-ring resize-none leading-relaxed"
            />
          </div>

          {/* Chamada para Split Mercado Pago */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground">
            <ArrowRightLeft className="size-4 text-[#009EE3] shrink-0" />
            <span>
              Ao concluir o cadastro, você poderá conectar sua conta do <strong>Mercado Pago</strong> com 1 clique para receber os repasses das teleconsultas com divisão automática.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9.5 text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="h-9.5 text-xs rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5"
            >
              {busy ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
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
