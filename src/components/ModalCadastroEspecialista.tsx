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
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import {
  AlertCircle,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  Loader2,
  Plus,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react'
import { PasswordInput } from './ui/password-input'
import { CurrencyInput } from './ui/currency-input'
import { parseMoeda } from '../lib/currency'
import { mascaraConselho } from '../lib/masks'
import { cn } from '../lib/utils'
import { toast } from 'sonner'
import {
  PLATAFORMAS_PRESCRICAO,
  salvarPlataformaPreferida,
  type TipoPlataformaPrescricao,
} from '../lib/memedService'

const OPCOES_ESPECIALIDADES: { id: EspecialidadeVirtual; label: string }[] = [
  { id: 'estomaterapia', label: 'Estomaterapia & Feridas (Enfermagem)' },
  { id: 'fisioterapia', label: 'Fisioterapia Geriátrica' },
  { id: 'medica', label: 'Medicina Geriátrica' },
  { id: 'nutricao', label: 'Nutrição Clínica Geriátrica' },
  { id: 'psicologia', label: 'Psicologia & Demências' },
]

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
  const [especialidades, setEspecialidades] = useState<EspecialidadeVirtual[]>(['estomaterapia'])
  const [registro, setRegistro] = useState('')
  const [titulos, setTitulos] = useState<string[]>(['Especialista em Telemedicina'])
  const [novoTitulo, setNovoTitulo] = useState('')
  const [consultorio, setConsultorio] = useState('')
  const [preco, setPreco] = useState('100')
  const [bio, setBio] = useState('')
  const [plataformaPrescricao, setPlataformaPrescricao] = useState<TipoPlataformaPrescricao>('cfm')

  function toggleEspecialidade(id: EspecialidadeVirtual) {
    if (especialidades.includes(id)) {
      if (especialidades.length === 1) {
        toast.error('Selecione pelo menos 1 especialidade.')
        return
      }
      setEspecialidades(especialidades.filter((e) => e !== id))
    } else {
      setEspecialidades([...especialidades, id])
    }
  }

  function adicionarTitulo() {
    const limpo = novoTitulo.trim()
    if (!limpo) return
    if (titulos.includes(limpo)) {
      toast.error('Este título já foi adicionado.')
      return
    }
    setTitulos([...titulos, limpo])
    setNovoTitulo('')
  }

  function removerTitulo(index: number) {
    if (titulos.length === 1) {
      toast.error('Mantenha ao menos 1 qualificação principal.')
      return
    }
    setTitulos(titulos.filter((_, i) => i !== index))
  }

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
    if (especialidades.length === 0) {
      setErro('Selecione pelo menos uma especialidade de atuação.')
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
        especialidade: especialidades[0],
        especialidades,
        especialidadesLabels: especialidades.map(
          (id) => OPCOES_ESPECIALIDADES.find((o) => o.id === id)?.label || id
        ),
        titulo: titulos.join(' • '),
        titulos: titulos.length > 0 ? titulos : ['Especialista em Telemedicina'],
        registro: registro.trim(),
        consultorio: consultorio.trim() || 'Consultório Virtual',
        preco: parseMoeda(preco) || 90,
        duracaoMin: 20,
        bio: bio.trim(),
      })

      if (res.erro) {
        setErro(res.erro)
        setBusy(false)
        return
      }

      salvarPlataformaPreferida(plataformaPrescricao, res.profissional?.id)

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

          {/* SEÇÃO 2: Registro e Especialidades Múltiplas */}
          <div className="space-y-4 pt-1 border-t border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 pt-2">
              <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-foreground font-extrabold">2</span>
              <span>Especialidades & Registro Profissional</span>
            </h3>

            {/* SELEÇÃO MÚLTIPLA DE ESPECIALIDADES */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm font-semibold">
                  Especialidades de Atuação *
                </Label>
                <span className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                  {especialidades.length} {especialidades.length === 1 ? 'selecionada' : 'selecionadas'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Selecione todas as especialidades em que você presta atendimento virtual:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {OPCOES_ESPECIALIDADES.map((op) => {
                  const selecionada = especialidades.includes(op.id)
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => toggleEspecialidade(op.id)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer',
                        selecionada
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-200 shadow-2xs ring-1 ring-teal-600'
                          : 'border-border/70 hover:bg-muted/40 text-foreground'
                      )}
                    >
                      <span>{op.label}</span>
                      <div
                        className={cn(
                          'size-4.5 rounded-md flex items-center justify-center border transition-colors shrink-0 ml-2',
                          selecionada
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-muted-foreground/30'
                        )}
                      >
                        {selecionada && <Check className="size-3 stroke-[3]" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* REGISTRO PROFISSIONAL E TÍTULOS MÚLTIPLOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-semibold">Conselho & Registro *</Label>
                <Input
                  placeholder="ex: CRM-SP 189432 / COREN-SP 24512"
                  value={registro}
                  onChange={(e) => setRegistro(mascaraConselho(e.target.value))}
                  required
                  className="h-10.5 text-xs sm:text-sm rounded-xl px-3.5"
                />
                <span className="text-[10px] text-muted-foreground block">
                  CRM, COREN, CRN, CRP, CREFITO ou outro conselho oficial
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-semibold">Títulos & Qualificações ({titulos.length})</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar qualificação (ex: Mestre USP, SBGG...)"
                    value={novoTitulo}
                    onChange={(e) => setNovoTitulo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        adicionarTitulo()
                      }
                    }}
                    className="h-10.5 text-xs sm:text-sm rounded-xl px-3.5 flex-1"
                  />
                  <Button
                    type="button"
                    onClick={adicionarTitulo}
                    variant="outline"
                    className="h-10.5 px-3.5 rounded-xl text-xs font-semibold shrink-0 gap-1"
                  >
                    <Plus className="size-3.5" />
                    <span>Adicionar</span>
                  </Button>
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  Pressione Enter ou clique em Adicionar para incluir cada qualificação
                </span>
              </div>
            </div>

            {/* Badges de Títulos Adicionados */}
            {titulos.length > 0 && (
              <div className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Títulos incluídos no seu perfil:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {titulos.map((t, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs py-1 px-2.5 rounded-lg flex items-center gap-1.5 bg-background border border-border shadow-2xs"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => removerTitulo(idx)}
                        className="hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                        title="Remover título"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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
                <Label className="text-xs sm:text-sm font-semibold">Valor da Consulta *</Label>
                <CurrencyInput
                  placeholder="R$ 0,00"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  required
                  className="h-10.5 text-xs sm:text-sm rounded-xl px-3.5"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: Plataforma Preferida de Prescrição Digital */}
          <div className="space-y-3 pt-1 border-t border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 pt-2">
              <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-foreground font-extrabold">4</span>
              <span>Plataforma de Prescrição Digital Oficial</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Selecione onde você já possui cadastro e assina digitalmente com seu certificado ICP-Brasil:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLATAFORMAS_PRESCRICAO.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlataformaPrescricao(p.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                    plataformaPrescricao === p.id
                      ? 'border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-600 shadow-2xs'
                      : 'border-border/70 hover:bg-muted/30 text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs">{p.nome}</span>
                    <Badge variant="outline" className={`text-[9px] ${p.corBadge}`}>
                      {p.badge}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-snug">
                    {p.subtitulo}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SEÇÃO 5: Biografia e Apresentação */}
          <div className="space-y-3 pt-1 border-t border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 pt-2">
              <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-foreground font-extrabold">5</span>
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
