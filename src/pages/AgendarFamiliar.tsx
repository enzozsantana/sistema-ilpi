import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  obterProfissionaisVirtuais,
  salvarConsultaVirtual,
  obterConsultaPorId,
  confirmarPagamentoFamiliar,
  obterSlotsDia,
  gerarLinkSalaJitsi,
  buildJitsiUrl,
} from '../lib/teleconsultaStorage'
import type {
  ConsultaVirtual,
  MetodoPagamento,
  ProfissionalVirtual,
  SlotHorarioAgenda,
} from '../types/teleconsulta'
import { iso, fmt } from '../lib/business/dates'
import { formatarMoeda } from '../lib/currency'
import { mascaraCartao, mascaraValidadeCartao, mascaraCvv, mascaraCPF, mascaraTelefone } from '../lib/masks'
import { processarPagamentoSplit, gerarPixCopiaECola } from '../lib/mercadopagoService'
import { gerarQrCodeDataUrl } from '../lib/qrcodeUtils'
import { SenecurareLogo } from '../components/SenecurareLogo'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Lock,
  QrCode,
  Share2,
  ShieldCheck,
  Stethoscope,
  User,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function AgendarFamiliar() {
  const { residenteId: paramResidenteId, consultaId: paramConsultaId } = useParams<{
    residenteId?: string
    consultaId?: string
  }>()
  const [searchParams] = useSearchParams()

  const consultaIdUrl = paramConsultaId || searchParams.get('consulta')
  const residenteIdUrl = paramResidenteId || searchParams.get('residente') || 'r1'
  const residenteNomeUrl = searchParams.get('nome') || 'Residente Acolhido'

  // Carrega profissionais disponíveis
  const [profissionais] = useState<ProfissionalVirtual[]>(() => obterProfissionaisVirtuais())

  // Se já há uma consulta pré-agendada pela ILPI para pagamento
  const consultaExistente = useMemo(() => {
    if (consultaIdUrl) {
      return obterConsultaPorId(consultaIdUrl)
    }
    return null
  }, [consultaIdUrl])

  // Etapa do fluxo
  const [passo, setPasso] = useState<'selecao' | 'dados' | 'pagamento' | 'sucesso'>(() => {
    if (consultaExistente) return 'pagamento'
    return 'selecao'
  })

  // Seleção de Especialista e Horário
  const [profSelecionadoId, setProfSelecionadoId] = useState<string>(() => {
    if (consultaExistente) return consultaExistente.profissionalId
    return profissionais[0]?.id || ''
  })

  const profSelecionado = useMemo(() => {
    return profissionais.find((p) => p.id === profSelecionadoId) || profissionais[0]
  }, [profissionais, profSelecionadoId])

  const hojeIso = useMemo(() => iso(new Date()), [])
  const [dataSelecionada, setDataSelecionada] = useState<string>(() => {
    if (consultaExistente) return consultaExistente.data
    return hojeIso
  })
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>(() => {
    if (consultaExistente) return consultaExistente.horario
    return profSelecionado?.horariosPadrao[0] || '09:00'
  })
  const [motivoConsulta, setMotivoConsulta] = useState<string>(() => {
    if (consultaExistente?.motivo) return consultaExistente.motivo
    return ''
  })

  // Dados do Responsável Financeiro Familiar
  const [nomeFamiliar, setNomeFamiliar] = useState('')
  const [cpfFamiliar, setCpfFamiliar] = useState('')
  const [whatsappFamiliar, setWhatsappFamiliar] = useState('')
  const [emailFamiliar, setEmailFamiliar] = useState('')
  const [parentesco, setParentesco] = useState('Filho(a)')

  // Pagamento
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('pix')
  const [numCartao, setNumCartao] = useState('')
  const [valCartao, setValCartao] = useState('')
  const [cvvCartao, setCvvCartao] = useState('')
  const [processando, setProcessando] = useState(false)
  const [pixQrCodeDataUrl, setPixQrCodeDataUrl] = useState('')
  const [consultaFinalizada, setConsultaFinalizada] = useState<ConsultaVirtual | null>(consultaExistente)

  // Slots de horários do dia selecionado
  const slotsDoDia: SlotHorarioAgenda[] = useMemo(() => {
    if (!profSelecionado) return []
    return obterSlotsDia(profSelecionado.id, dataSelecionada)
  }, [profSelecionado, dataSelecionada])

  // Geração do PIX Copia-e-Cola
  const valorTotal = consultaExistente?.valor || profSelecionado?.preco || 200
  const pixCopiaECola = useMemo(() => {
    return gerarPixCopiaECola(
      `telemed_${profSelecionado?.id || 'prof'}`,
      valorTotal,
      `SENECURARE ${residenteNomeUrl.slice(0, 15)}`,
    )
  }, [profSelecionado?.id, valorTotal, residenteNomeUrl])

  useEffect(() => {
    if (pixCopiaECola) {
      gerarQrCodeDataUrl(pixCopiaECola)
        .then(setPixQrCodeDataUrl)
        .catch(() => {})
    }
  }, [pixCopiaECola])

  // Validação para avançar para dados do familiar
  function handleAvancarParaDados() {
    if (!horarioSelecionado) {
      toast.error('Escolha um horário de atendimento disponível.')
      return
    }
    setPasso('dados')
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch {}
    }
  }

  // Validação para avançar para pagamento
  function handleAvancarParaPagamento() {
    if (!nomeFamiliar.trim()) {
      toast.error('Informe o nome completo do responsável financeiro.')
      return
    }
    if (!whatsappFamiliar.trim()) {
      toast.error('Informe o WhatsApp do responsável para envio das orientações.')
      return
    }
    setPasso('pagamento')
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch {}
    }
  }

  // Conclusão e Pagamento
  async function handleFinalizarPagamento() {
    setProcessando(true)

    const id = consultaExistente ? consultaExistente.id : `cv_fam_${Date.now()}`
    const codigoSala = consultaExistente
      ? consultaExistente.codigoSala
      : `senecurare-${profSelecionado.especialidade}-${Date.now().toString(36)}`

    // Processa o split do Mercado Pago
    try {
      await processarPagamentoSplit({
        profissionalId: profSelecionado.id,
        residenteId: residenteIdUrl,
        residenteNome: consultaExistente?.residenteNome || residenteNomeUrl,
        consultaId: id,
        especialidade: profSelecionado.especialidadeLabel,
        valorTotal,
        metodoPagamento,
        pagadorNome: nomeFamiliar || 'Responsável Financeiro',
        pagadorEmail: emailFamiliar || 'contato@familiar.com.br',
      })
    } catch (err) {
      console.warn('Split Mercado Pago simulado:', err)
    }

    const consultaSalva: ConsultaVirtual = {
      id,
      profissionalId: profSelecionado.id,
      profissionalNome: profSelecionado.nome,
      especialidade: profSelecionado.especialidadeLabel,
      registro: profSelecionado.registro,
      clinica: profSelecionado.clinica,
      residenteId: residenteIdUrl,
      residenteNome: consultaExistente?.residenteNome || residenteNomeUrl,
      data: dataSelecionada,
      horario: horarioSelecionado,
      valor: valorTotal,
      metodoPagamento,
      pago: true,
      linkSala: gerarLinkSalaJitsi(codigoSala),
      codigoSala,
      status: 'confirmada',
      origemSolicitacao: 'familiar_portal',
      motivo: motivoConsulta.trim() || 'Avaliação e teleconsulta solicitada pelo responsável familiar.',
      responsavelFinanceiroFamiliar: {
        nome: nomeFamiliar,
        cpf: cpfFamiliar,
        email: emailFamiliar,
        telefone: whatsappFamiliar,
        parentesco,
      },
      responsavelFinanceiroResidente: nomeFamiliar,
      criadoEm: new Date().toISOString(),
    }

    if (consultaExistente) {
      confirmarPagamentoFamiliar(consultaExistente.id, {
        pagadorNome: nomeFamiliar || consultaExistente.responsavelFinanceiroResidente || 'Familiar',
        pagadorCpf: cpfFamiliar,
        pagadorEmail: emailFamiliar,
        pagadorTelefone: whatsappFamiliar,
        parentesco,
        metodoPagamento,
      })
    } else {
      salvarConsultaVirtual(consultaSalva)
    }

    setConsultaFinalizada(consultaSalva)
    setProcessando(false)
    setPasso('sucesso')
    toast.success('Teleconsulta confirmada com sucesso!')
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch {}
    }
  }

  function copiarChavePix() {
    navigator.clipboard.writeText(pixCopiaECola)
    toast.success('Código PIX Copia-e-Cola copiado para a área de transferência!')
  }

  function compartilharWhatsApp() {
    if (!consultaFinalizada) return
    const linkAcesso = buildJitsiUrl(consultaFinalizada.linkSala, `Familiar / ${consultaFinalizada.residenteNome}`)
    const texto = `Olá! A teleconsulta de ${consultaFinalizada.residenteNome} com ${consultaFinalizada.profissionalNome} está confirmada para ${fmt(consultaFinalizada.data)} às ${consultaFinalizada.horario}.\n\nLink direto de acesso à sala virtual:\n${linkAcesso}\n\n(Acesse no horário marcado pelo celular ou computador)`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground flex flex-col">
      {/* Barra Superior */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <SenecurareLogo variant="horizontal" size="sm" showTagline={false} />
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold gap-1">
              <ShieldCheck className="size-3.5" />
              Portal do Responsável
            </Badge>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Banner do Residente */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-200">
                Atendimento Clínico Especializado
              </span>
              <h1 className="text-xl sm:text-2xl font-bold mt-0.5">
                Teleconsulta para {consultaExistente?.residenteNome || residenteNomeUrl}
              </h1>
              <p className="text-xs sm:text-sm text-teal-100 mt-1 max-w-2xl">
                Agendamento direto e seguro com especialistas de referência em geriatria, estomaterapia, nutrição e psicologia.
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-xs text-xs font-medium">
              <Lock className="size-3.5 text-teal-300" />
              <span>CFM / COFEN / LGPD</span>
            </div>
          </div>
        </div>

        {/* Indicador de Passos */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className={cn('p-2.5 rounded-2xl border font-bold transition-all', passo === 'selecao' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border/60')}>
            1. Especialista
          </div>
          <div className={cn('p-2.5 rounded-2xl border font-bold transition-all', passo === 'dados' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border/60')}>
            2. Responsável
          </div>
          <div className={cn('p-2.5 rounded-2xl border font-bold transition-all', passo === 'pagamento' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border/60')}>
            3. Pagamento
          </div>
          <div className={cn('p-2.5 rounded-2xl border font-bold transition-all', passo === 'sucesso' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card text-muted-foreground border-border/60')}>
            4. Confirmada
          </div>
        </div>

        {/* PASSO 1: ESCOLHA DE ESPECIALISTA & HORÁRIO */}
        {passo === 'selecao' && (
          <div className="space-y-6">
            {/* Vitrine de Especialistas */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Stethoscope className="size-4 text-primary" />
                Selecione o Profissional Especialista
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {profissionais.map((prof) => {
                  const selecionado = prof.id === profSelecionadoId

                  return (
                    <Card
                      key={prof.id}
                      onClick={() => setProfSelecionadoId(prof.id)}
                      className={cn(
                        'rounded-3xl border cursor-pointer transition-all p-4 hover:shadow-md',
                        selecionado
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/40'
                          : 'border-border/70 bg-card hover:border-primary/40',
                      )}
                    >
                      <div className="flex items-start gap-3.5">
                        <img
                          src={prof.foto}
                          alt={prof.nome}
                          className="size-14 rounded-2xl object-cover shrink-0 border-2 border-primary/20 shadow-xs"
                        />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-foreground">{prof.nome}</h3>
                            <span className="font-bold text-primary text-sm">
                              {formatarMoeda(prof.preco)}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-[10px] font-semibold">
                            {prof.especialidadeLabel}
                          </Badge>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                            {prof.bio}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Escolha de Data e Horário */}
            <Card className="rounded-3xl border-border/60 p-5 bg-card space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                Data e Horário do Atendimento
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Data da Teleconsulta *</Label>
                  <Input
                    type="date"
                    min={hojeIso}
                    value={dataSelecionada}
                    onChange={(e) => setDataSelecionada(e.target.value)}
                    className="rounded-2xl text-xs h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Motivo ou Queixa Principal (Opcional)</Label>
                  <Input
                    placeholder="Ex: Revisão de medicamentos, avaliação de curativo, apetite"
                    value={motivoConsulta}
                    onChange={(e) => setMotivoConsulta(e.target.value)}
                    className="rounded-2xl text-xs h-10"
                  />
                </div>
              </div>

              {/* Horários Disponíveis */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Horários Livres com {profSelecionado?.nome}</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Duração: {profSelecionado?.duracaoMin || 45} min
                  </span>
                </Label>

                {slotsDoDia.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-muted/40 text-center text-xs text-muted-foreground">
                    O profissional não possui horários abertos para esta data. Selecione outro dia.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {slotsDoDia.map((slot) => {
                      const ativo = horarioSelecionado === slot.horario
                      return (
                        <button
                          key={slot.horario}
                          type="button"
                          disabled={!slot.disponivel}
                          onClick={() => setHorarioSelecionado(slot.horario)}
                          className={cn(
                            'py-2.5 rounded-2xl text-xs font-bold transition-all border text-center',
                            !slot.disponivel && 'opacity-40 cursor-not-allowed bg-muted/60 line-through',
                            ativo && slot.disponivel
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                              : 'bg-card text-foreground border-border/80 hover:bg-muted/30',
                          )}
                        >
                          {slot.horario}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleAvancarParaDados}
                className="rounded-2xl px-6 py-5 text-sm font-semibold shadow-xs gap-2"
              >
                <span>Avançar para Identificação</span>
                <Clock className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* PASSO 2: DADOS DO RESPONSÁVEL FINANCEIRO */}
        {passo === 'dados' && (
          <Card className="rounded-3xl border-border/60 p-5 sm:p-6 bg-card space-y-5">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <User className="size-4 text-primary" />
                Identificação do Responsável Financeiro / Familiar
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Os dados abaixo são utilizados para emissão do recibo, comprovação de pagamento e envio das orientações.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Nome Completo do Responsável *</Label>
                <Input
                  placeholder="Nome de quem está solicitando/pagando"
                  value={nomeFamiliar}
                  onChange={(e) => setNomeFamiliar(e.target.value)}
                  className="rounded-2xl text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">WhatsApp para Contato *</Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={whatsappFamiliar}
                  onChange={(e) => setWhatsappFamiliar(mascaraTelefone(e.target.value))}
                  className="rounded-2xl text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">CPF (Para Recibo / Declaração IR)</Label>
                <Input
                  placeholder="000.000.000-00"
                  value={cpfFamiliar}
                  onChange={(e) => setCpfFamiliar(mascaraCPF(e.target.value))}
                  className="rounded-2xl text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">E-mail</Label>
                <Input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={emailFamiliar}
                  onChange={(e) => setEmailFamiliar(e.target.value)}
                  className="rounded-2xl text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Grau de Parentesco / Vínculo</Label>
                <select
                  value={parentesco}
                  onChange={(e) => setParentesco(e.target.value)}
                  className="w-full h-10 rounded-2xl border border-input bg-background px-3 text-xs"
                >
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Cônjuge">Cônjuge</option>
                  <option value="Neto(a)">Neto(a)</option>
                  <option value="Irmão/Irmã">Irmão/Irmã</option>
                  <option value="Curador Legal">Curador Legal</option>
                  <option value="Outro">Outro Responsável</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setPasso('selecao')}
                className="rounded-2xl"
              >
                Voltar
              </Button>

              <Button
                onClick={handleAvancarParaPagamento}
                className="rounded-2xl px-6 py-5 text-sm font-semibold shadow-xs"
              >
                Avançar para Pagamento
              </Button>
            </div>
          </Card>
        )}

        {/* PASSO 3: PAGAMENTO (MERCADO PAGO SPLIT) */}
        {passo === 'pagamento' && (
          <div className="space-y-5">
            {/* Resumo do Atendimento */}
            <Card className="rounded-3xl border-border/60 p-5 bg-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Resumo da Contratação
                  </span>
                  <h3 className="font-bold text-base text-foreground">
                    Teleconsulta com {consultaExistente?.profissionalNome || profSelecionado?.nome}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Paciente: <strong>{consultaExistente?.residenteNome || residenteNomeUrl}</strong> · Data:{' '}
                    <strong>{fmt(dataSelecionada)} às {horarioSelecionado}</strong>
                  </p>
                </div>

                <div className="text-left sm:text-right p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                  <span className="text-xs font-medium block">Valor da Consulta</span>
                  <span className="text-xl font-bold">{formatarMoeda(valorTotal)}</span>
                </div>
              </div>
            </Card>

            {/* Escolha do Método */}
            <Card className="rounded-3xl border-border/60 p-5 sm:p-6 bg-card space-y-5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                Forma de Pagamento Segura
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMetodoPagamento('pix')}
                  className={cn(
                    'p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold',
                    metodoPagamento === 'pix'
                      ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/30'
                      : 'border-border/80 bg-background text-muted-foreground hover:border-primary/40',
                  )}
                >
                  <QrCode className="size-5" />
                  <span>PIX Instantâneo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPagamento('cartao')}
                  className={cn(
                    'p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold',
                    metodoPagamento === 'cartao'
                      ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/30'
                      : 'border-border/80 bg-background text-muted-foreground hover:border-primary/40',
                  )}
                >
                  <CreditCard className="size-5" />
                  <span>Cartão de Crédito</span>
                </button>
              </div>

              {/* PIX */}
              {metodoPagamento === 'pix' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/60 flex flex-col items-center text-center space-y-3">
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold">
                    Liberação Imediata
                  </Badge>

                  {pixQrCodeDataUrl && (
                    <img
                      src={pixQrCodeDataUrl}
                      alt="QR Code PIX"
                      className="size-44 rounded-xl border-2 border-primary/20 shadow-xs"
                    />
                  )}

                  <p className="text-xs text-muted-foreground max-w-sm">
                    Abra o app do seu banco e escaneie o QR Code acima ou copie o código abaixo:
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={copiarChavePix}
                    className="w-full max-w-sm rounded-2xl gap-2 text-xs"
                  >
                    <Copy className="size-3.5" />
                    Copiar Código PIX Copia-e-Cola
                  </Button>
                </div>
              )}

              {/* Cartão de Crédito */}
              {metodoPagamento === 'cartao' && (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-xs">Número do Cartão</Label>
                    <Input
                      placeholder="0000 0000 0000 0000"
                      value={numCartao}
                      onChange={(e) => setNumCartao(mascaraCartao(e.target.value))}
                      className="rounded-xl h-9"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Validade</Label>
                      <Input
                        placeholder="MM/AA"
                        value={valCartao}
                        onChange={(e) => setValCartao(mascaraValidadeCartao(e.target.value))}
                        className="rounded-xl h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">CVV</Label>
                      <Input
                        placeholder="123"
                        value={cvvCartao}
                        onChange={(e) => setCvvCartao(mascaraCvv(e.target.value))}
                        className="rounded-xl h-9"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <Button
                  variant="outline"
                  onClick={() => setPasso(consultaExistente ? 'selecao' : 'dados')}
                  className="rounded-2xl"
                >
                  Voltar
                </Button>

                <Button
                  onClick={handleFinalizarPagamento}
                  disabled={processando}
                  className="rounded-2xl px-6 py-5 text-sm font-semibold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {processando ? 'Processando Split…' : 'Confirmar Pagamento & Agendar'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* PASSO 4: SUCESSO & COMPROVANTE */}
        {passo === 'sucesso' && consultaFinalizada && (
          <Card className="rounded-3xl border-emerald-500/40 bg-emerald-500/5 p-6 sm:p-8 text-center space-y-5">
            <div className="size-16 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Teleconsulta Confirmada com Sucesso!
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                O pagamento foi processado e o atendimento já está sincronizado com a equipe da ILPI e na agenda do especialista.
              </p>
            </div>

            {/* Cartão de Detalhes da Consulta */}
            <div className="p-4 rounded-2xl bg-card border border-border/70 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-sm text-foreground">
                <span>{consultaFinalizada.residenteNome}</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                  Confirmada
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Especialista: <strong>{consultaFinalizada.profissionalNome}</strong> ({consultaFinalizada.especialidade})
              </p>
              <p className="text-muted-foreground">
                Data: <strong>{fmt(consultaFinalizada.data)} às {consultaFinalizada.horario}</strong>
              </p>
              <p className="text-muted-foreground">
                Responsável Financeiro: <strong>{consultaFinalizada.responsavelFinanceiroResidente}</strong>
              </p>
            </div>

            {/* Botões de Ação para o Familiar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                asChild
                className="w-full sm:w-auto rounded-2xl text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                <a
                  href={buildJitsiUrl(consultaFinalizada.linkSala, `Familiar / ${consultaFinalizada.residenteNome}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="size-4" />
                  Abrir Sala Virtual no Horário
                </a>
              </Button>

              <Button
                variant="outline"
                onClick={compartilharWhatsApp}
                className="w-full sm:w-auto rounded-2xl text-xs gap-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
              >
                <Share2 className="size-4" />
                Compartilhar via WhatsApp
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
