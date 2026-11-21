import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import {
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  FileCheck2,
  Settings,
  Pill,
  Trash2,
  Clock,
  QrCode,
  Info,
  Stethoscope,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Residente } from '../types/ilpi'
import { useAuth } from '../contexts/AuthContext'
import { fmt, agoraHM, iso } from '../lib/business/dates'
import {
  obterConfigMemed,
  salvarConfigMemed,
  gerarTextoCopiaPrescricao,
  obterReceitasDigitaisLocais,
  salvarReceitaDigitalLocal,
  removerReceitaDigitalLocal,
  LINKS_OFICIAIS_PRESCRICAO,
  PLATAFORMAS_PRESCRICAO,
  obterPlataformaPreferida,
  salvarPlataformaPreferida,
  type ReceitaDigitalMemed,
  type MemedConfig,
  type TipoPlataformaPrescricao,
} from '../lib/memedService'

interface ModalMemedPrescricaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  residente: Residente
  onReceitaRegistrada?: (urlReceita?: string) => void
}

export function ModalMemedPrescricao({
  open,
  onOpenChange,
  residente,
  onReceitaRegistrada,
}: ModalMemedPrescricaoProps) {
  const { profissional } = useAuth()
  const [abaAtiva, setAbaAtiva] = useState<'emitir' | 'historico' | 'config'>('emitir')
  const [copiado, setCopiado] = useState(false)
  const [plataformaAtiva, setPlataformaAtiva] = useState<TipoPlataformaPrescricao>(() =>
    obterPlataformaPreferida(profissional?.id)
  )
  const [mostrarOutrasPlataformas, setMostrarOutrasPlataformas] = useState(false)

  // Configuração
  const [config, setConfig] = useState<MemedConfig>(obterConfigMemed())
  const [inputPartnerKey, setInputPartnerKey] = useState(config.partnerKey)
  const [inputDoctorToken, setInputDoctorToken] = useState(config.doctorToken || '')
  const [ambiente, setAmbiente] = useState<'sandbox' | 'producao'>(config.ambiente)

  // Registro de receita emitida
  const [urlReceita, setUrlReceita] = useState('')
  const [codigoValidacao, setCodigoValidacao] = useState('')
  const [resumoMeds, setResumoMeds] = useState('')
  const [receitas, setReceitas] = useState<ReceitaDigitalMemed[]>([])

  useEffect(() => {
    if (open) {
      setPlataformaAtiva(obterPlataformaPreferida(profissional?.id))
      const conf = obterConfigMemed()
      setConfig(conf)
      setInputPartnerKey(conf.partnerKey)
      setInputDoctorToken(conf.doctorToken || '')
      setAmbiente(conf.ambiente)
      carregarHistorico()
    }
  }, [open, residente.id, profissional?.id])

  function carregarHistorico() {
    const list = obterReceitasDigitaisLocais(residente.id)
    setReceitas(list)
  }

  function handleCopiarDados() {
    const texto = gerarTextoCopiaPrescricao(residente)
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    toast.success('Dados do residente e medicamentos copiados para a área de transferência!')
    setTimeout(() => setCopiado(false), 3000)
  }

  function handleSalvarConfig() {
    salvarConfigMemed({
      partnerKey: inputPartnerKey.trim(),
      doctorToken: inputDoctorToken.trim(),
      ambiente,
    })
    const atualizada = obterConfigMemed()
    setConfig(atualizada)
    toast.success('Configurações da integração Memed salvas!')
    setAbaAtiva('emitir')
  }

  function handleRegistrarReceita(e: React.FormEvent) {
    e.preventDefault()
    if (!urlReceita.trim() && !codigoValidacao.trim()) {
      toast.error('Informe ao menos o Link da Receita ou o Código de Validação.')
      return
    }

    const nova: ReceitaDigitalMemed = {
      id: `rec_dig_${Date.now()}`,
      residenteId: residente.id,
      urlReceita: urlReceita.trim(),
      codigoValidacao: codigoValidacao.trim(),
      data: iso(new Date()),
      hora: agoraHM(),
      prescritorNome: profissional?.nome || 'Médico(a) Assistente',
      prescritorConselho: profissional?.conselho || 'CRM',
      medicamentosResumo: resumoMeds.trim() || 'Prescrição digital oficial',
      tipo: urlReceita.includes('cfm.org') ? 'cfm' : 'memed',
    }

    salvarReceitaDigitalLocal(residente.id, nova)
    carregarHistorico()
    const linkSalvo = urlReceita.trim()
    setUrlReceita('')
    setCodigoValidacao('')
    setResumoMeds('')
    toast.success('Receita digital oficial registrada com sucesso no prontuário!')
    onReceitaRegistrada?.(linkSalvo)
  }

  function handleExcluirReceita(id: string) {
    removerReceitaDigitalLocal(residente.id, id)
    carregarHistorico()
    toast.info('Receita removida do histórico local.')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* CABEÇALHO */}
        <DialogHeader className="p-5 border-b border-border/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  Prescrição Digital Oficial (ICP-Brasil / Memed)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Residente: <strong>{residente.nome}</strong> (Quarto {residente.quarto || '–'})
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-[11px] gap-1 border-emerald-600/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
            >
              <FileCheck2 className="size-3" /> Válida em Farmácias
            </Badge>
          </div>

          {/* NAVEGAÇÃO DE ABAS */}
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => setAbaAtiva('emitir')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                abaAtiva === 'emitir'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              Emitir Prescrição
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('historico')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                abaAtiva === 'historico'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              Histórico ({receitas.length})
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('config')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                abaAtiva === 'config'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              <Settings className="size-3" /> Chave Memed
            </button>
          </div>
        </DialogHeader>

        {/* CORPO DO MODAL */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* =========================================================================
              ABA 1: EMITIR PRESCRIÇÃO DIGITAL
              ========================================================================= */}
          {abaAtiva === 'emitir' && (
            <div className="space-y-4">
              {/* Alerta de Validade Farmacêutica */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-800 dark:text-emerald-200">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                  Como garantir que a receita não seja recusada na farmácia?
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  De acordo com a <strong>Portaria SVS/MS nº 344/98</strong> e <strong>Resolução CFM nº 2.299/2021</strong>,
                  receitas digitais enviadas por WhatsApp/SMS só possuem validade legal em farmácias se forem assinadas
                  com <strong>Certificado Digital ICP-Brasil (e-CRM)</strong> e possuírem QR Code verificável no validador nacional.
                </p>
              </div>

              {/* MODO ASSISTIDO: COPIAR DADOS E ABRIR PORTAL */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Stethoscope className="size-3.5 text-blue-600" />
                      Emissão Assistida Direta (Memed / CFM)
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Copie os dados completos do residente com 1 clique e acesse o prescritor oficial credenciado.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopiarDados}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    {copiado ? (
                      <>
                        <Check className="size-3.5 text-emerald-600" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" /> Copiar Dados
                      </>
                    )}
                  </Button>
                </div>

                {/* Prévia dos dados a serem colados */}
                <div className="p-2.5 rounded-lg bg-background border border-border/60 text-[11px] font-mono whitespace-pre-wrap max-h-32 overflow-y-auto text-muted-foreground">
                  {gerarTextoCopiaPrescricao(residente)}
                </div>

                {/* Plataforma configurada do profissional */}
                {(() => {
                  const infoAtiva =
                    PLATAFORMAS_PRESCRICAO.find((p) => p.id === plataformaAtiva) || PLATAFORMAS_PRESCRICAO[0]
                  return (
                    <div className="space-y-2 pt-1">
                      <div className="p-4 rounded-xl border-2 border-emerald-600/50 bg-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                              {infoAtiva.nome}
                            </span>
                            <Badge variant="outline" className={`text-[10px] ${infoAtiva.corBadge}`}>
                              {infoAtiva.badge}
                            </Badge>
                            <Badge variant="secondary" className="text-[9px] bg-background text-muted-foreground">
                              Sua Preferência
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground block">
                            {infoAtiva.subtitulo}
                          </span>
                        </div>

                        <a
                          href={infoAtiva.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs shrink-0 transition-colors"
                        >
                          <span>Abrir e Prescrever</span>
                          <ExternalLink className="size-3.5" />
                        </a>
                      </div>

                      {/* Opção para alternar portal */}
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] text-muted-foreground">
                          Prefere prescrever em outro portal nesta consulta?
                        </span>
                        <button
                          type="button"
                          onClick={() => setMostrarOutrasPlataformas(!mostrarOutrasPlataformas)}
                          className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          {mostrarOutrasPlataformas ? 'Ocultar opções' : 'Trocar de portal'}
                        </button>
                      </div>

                      {mostrarOutrasPlataformas && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {PLATAFORMAS_PRESCRICAO.map((p) => {
                            const isSelected = p.id === plataformaAtiva
                            return (
                              <div
                                key={p.id}
                                className={`p-3 rounded-lg border flex items-center justify-between gap-2 transition-all ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-500/10'
                                    : 'border-border/80 bg-background hover:bg-muted/30'
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0">
                                  <span className="font-bold text-xs text-foreground block truncate">
                                    {p.nome}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground block truncate">
                                    {p.badge}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {!isSelected && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPlataformaAtiva(p.id)
                                        salvarPlataformaPreferida(p.id, profissional?.id)
                                        toast.success(`Plataforma preferida alterada para ${p.nome}!`)
                                      }}
                                      className="text-[10px] text-emerald-700 dark:text-emerald-400 underline font-medium cursor-pointer"
                                    >
                                      Usar como padrão
                                    </button>
                                  )}
                                  <a
                                    href={p.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg border border-border/80 hover:bg-muted text-foreground"
                                    title={`Abrir ${p.nome}`}
                                  >
                                    <ExternalLink className="size-3.5" />
                                  </a>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* REGISTRAR A RECEITA GERADA NO PRONTUÁRIO */}
              <form onSubmit={handleRegistrarReceita} className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode className="size-4 text-emerald-600" />
                  <span className="font-bold text-xs text-foreground">
                    Registrar Link / QR Code da Receita no Prontuário
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Cole abaixo o link que a Memed ou o CFM gerou (ou o código de dispensação).
                  Assim, a equipe de enfermagem da ILPI poderá consultar a receita válida com QR Code a qualquer hora!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Link da Receita Digital *</Label>
                    <Input
                      placeholder="ex: https://memed.com.br/p/xyz123"
                      value={urlReceita}
                      onChange={(e) => setUrlReceita(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Código de Validação / Token</Label>
                    <Input
                      placeholder="ex: 1234-ABCD-5678"
                      value={codigoValidacao}
                      onChange={(e) => setCodigoValidacao(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Resumo dos Medicamentos Prescritos</Label>
                  <Input
                    placeholder="ex: Losartana 50mg, Clonazepam 2mg, Metformina 850mg"
                    value={resumoMeds}
                    onChange={(e) => setResumoMeds(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold gap-1.5 text-xs"
                >
                  <Check className="size-3.5" /> Salvar Receita Digital no Prontuário
                </Button>
              </form>
            </div>
          )}

          {/* =========================================================================
              ABA 2: HISTÓRICO DE RECEITAS DIGITAIS DO RESIDENTE
              ========================================================================= */}
          {abaAtiva === 'historico' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">
                  Receitas Digitais Emitidas para {residente.nome}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Total: {receitas.length}
                </span>
              </div>

              {receitas.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-xl space-y-2">
                  <FileCheck2 className="size-8 mx-auto text-muted-foreground/60" />
                  <p className="text-xs text-muted-foreground">
                    Nenhuma receita digital registrada ainda para este residente.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAbaAtiva('emitir')}
                    className="text-xs"
                  >
                    Emitir Primeira Receita
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {receitas.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl border border-border/80 bg-muted/10 hover:bg-muted/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                          >
                            {rec.tipo === 'cfm' ? 'CFM ICP-Brasil' : 'Memed Digital'}
                          </Badge>
                          <span className="text-xs font-semibold text-foreground">
                            {rec.medicamentosResumo || 'Prescrição Digital'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" /> {fmt(rec.data)} às {rec.hora}
                          </span>
                          <span>Prescritor: {rec.prescritorNome} ({rec.prescritorConselho})</span>
                          {rec.codigoValidacao && (
                            <span>Cód: <strong>{rec.codigoValidacao}</strong></span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {rec.urlReceita && (
                          <a
                            href={rec.urlReceita}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
                          >
                            <ExternalLink className="size-3" /> Abrir Receita
                          </a>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleExcluirReceita(rec.id)}
                          className="size-7 text-rose-600 hover:bg-rose-500/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              ABA 3: CONFIGURAÇÃO DO MEMED SDK / PARTNER TOKEN
              ========================================================================= */}
          {abaAtiva === 'config' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <span className="font-bold text-xs text-foreground block">
                  Como funciona a Chave de Integração Memed (Sinapse Prescrição)?
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  A Memed oferece um <strong>Partner Token</strong> gratuito para softwares médicos e ILPIs.
                  Com esta chave, o receituário do Memed é incorporado diretamente no sistema, sem precisar abrir abas externas.
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-muted-foreground">
                  <li>Acesse o <a href={LINKS_OFICIAIS_PRESCRICAO.memedPortalParceiros} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline font-semibold">Portal de Desenvolvedores Memed</a>.</li>
                  <li>Crie uma conta parceira gratuita para a sua instituição ou clínica.</li>
                  <li>Copie seu <strong>Token de Parceiro (Partner Key)</strong> e cole no campo abaixo.</li>
                </ol>
              </div>

              <div className="space-y-3 p-4 rounded-xl border border-border/80 bg-card">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Partner Key (Chave do Parceiro Memed)</Label>
                  <Input
                    placeholder="Cole aqui seu token de parceiro da Memed"
                    value={inputPartnerKey}
                    onChange={(e) => setInputPartnerKey(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Doctor Token (Opcional - Token individual do Médico)</Label>
                  <Input
                    placeholder="Cole o token exclusivo da médica caso ela já possua"
                    value={inputDoctorToken}
                    onChange={(e) => setInputDoctorToken(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Ambiente</Label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="ambiente"
                        checked={ambiente === 'sandbox'}
                        onChange={() => setAmbiente('sandbox')}
                        className="text-emerald-600"
                      />
                      Sandbox (Testes / Homologação)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                      <input
                        type="radio"
                        name="ambiente"
                        checked={ambiente === 'producao'}
                        onChange={() => setAmbiente('producao')}
                        className="text-emerald-600"
                      />
                      Produção (Receitas Válidas Oficiais)
                    </label>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSalvarConfig}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold mt-2"
                >
                  Salvar Chave & Configurações
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <DialogFooter className="p-3.5 border-t border-border/80 bg-muted/20 flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Info className="size-3.5 text-blue-500" />
            Emissão em conformidade com CFM, CFF e ITI / ICP-Brasil.
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
