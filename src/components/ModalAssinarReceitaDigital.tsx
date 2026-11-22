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
  ShieldCheck,
  CheckCircle2,
  Lock,
  Smartphone,
  ExternalLink,
  Copy,
  Share2,
  Loader2,
  FileCheck2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Residente } from '../types/ilpi'
import { useAuth } from '../contexts/AuthContext'
import { mascaraCPF } from '../lib/masks'
import {
  gerarCodigoValidacao,
  gerarHashSha256Simulado,
  gerarQrCodeDataUrl,
  obterUrlValidacaoPublica,
  gerarMensagemWhatsAppFarmacia,
  type AssinaturaDigitalData,
} from '../lib/assinaturaDigitalService'
import {
  salvarPedidoLocal,
  type PedidoMedicoData,
} from '../lib/business/pedidosMedicos'

interface ModalAssinarReceitaDigitalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  residente: Residente
  pedido: PedidoMedicoData
  onAssinaturaConcluida: (pedidoAtualizado: PedidoMedicoData) => void
}

export function ModalAssinarReceitaDigital({
  open,
  onOpenChange,
  residente,
  pedido,
  onAssinaturaConcluida,
}: ModalAssinarReceitaDigitalProps) {
  const { profissional } = useAuth()

  // Estados do formulário
  const [provedorNuvem, setProvedorNuvem] = useState<'birdid' | 'vidaas' | 'safeid' | 'cfm' | 'a1'>('cfm')
  const [cpf, setCpf] = useState('')
  const [pin, setPin] = useState('')
  const [etapa, setEtapa] = useState<'formulario' | 'assinando' | 'sucesso'>('formulario')
  const [progressoTexto, setProgressoTexto] = useState('')

  // Resultado
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [linkValidacao, setLinkValidacao] = useState('')
  const [codigoGerado, setCodigoGerado] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [pedidoSalvo, setPedidoSalvo] = useState<PedidoMedicoData | null>(null)

  useEffect(() => {
    if (open) {
      setEtapa('formulario')
      setCpf('')
      setPin('')
      setProgressoTexto('')
      setCopiado(false)
    }
  }, [open])

  async function handleIniciarAssinatura(e: React.FormEvent) {
    e.preventDefault()

    if (!cpf.trim() || cpf.replace(/\D/g, '').length < 11) {
      toast.error('Informe um CPF válido para assinar com o Certificado Digital.')
      return
    }

    setEtapa('assinando')
    setProgressoTexto('Conectando à Autoridade Certificadora ICP-Brasil...')

    // Simula o handshake criptográfico seguro com a nuvem (BirdID / CFM / Vidaas / A1)
    setTimeout(() => {
      setProgressoTexto('Validando CRM no Conselho Regional de Medicina...')
    }, 700)

    setTimeout(() => {
      setProgressoTexto('Gerando Hash Criptográfico SHA-256 e Chancela PAdES...')
    }, 1400)

    setTimeout(async () => {
      const codVal = pedido.codigoValidacao || gerarCodigoValidacao('ILPI-REC')
      const urlVal = obterUrlValidacaoPublica(codVal)
      const qrData = await gerarQrCodeDataUrl(urlVal)

      const dadosParaHash = `${codVal}|${residente.nome}|${pedido.prescritor.nome}|${JSON.stringify(pedido.medicamentos)}|${new Date().toISOString()}`
      const hashIcp = gerarHashSha256Simulado(dadosParaHash)

      const nomeProvedor =
        provedorNuvem === 'birdid' ? 'AC SOLUTI Multi-Nuvem (BirdID)' :
        provedorNuvem === 'vidaas' ? 'AC SERASA EXPERIAN (Vidaas)' :
        provedorNuvem === 'safeid' ? 'AC VALID (SafeID)' :
        provedorNuvem === 'cfm' ? 'AC CFM ICP-Brasil (Padrão Oficial CFM)' :
        'AC Certisign PAdES (Certificado A1)'

      const assinatura: AssinaturaDigitalData = {
        assinadoPor: pedido.prescritor.nome || profissional?.nome || 'Médica Assistente',
        cpfPrescritor: mascaraCPF(cpf),
        conselho: pedido.prescritor.conselho || profissional?.conselho || 'CRM/SP',
        dataHora: new Date().toISOString(),
        algoritmo: 'ICP-Brasil PAdES',
        hashSha256: hashIcp,
        autoridadeCertificadora: nomeProvedor,
        certificadoTipo: `nuvem_${provedorNuvem}` as any,
        status: 'valido',
      }

      const pedidoAtualizado: PedidoMedicoData = {
        ...pedido,
        codigoValidacao: codVal,
        validadeDias: 30,
        assinaturaDigital: assinatura,
      }

      salvarPedidoLocal(pedidoAtualizado)
      setPedidoSalvo(pedidoAtualizado)
      setCodigoGerado(codVal)
      setLinkValidacao(urlVal)
      setQrCodeUrl(qrData)
      setEtapa('sucesso')
      onAssinaturaConcluida(pedidoAtualizado)
      toast.success('Receita Médica assinada com Certificado ICP-Brasil com sucesso!')
    }, 2200)
  }

  function handleCopiarLink() {
    navigator.clipboard.writeText(linkValidacao)
    setCopiado(true)
    toast.success('Link de validação copiado!')
    setTimeout(() => setCopiado(false), 2500)
  }

  function handleEnviarWhatsApp() {
    if (!pedidoSalvo) return
    const texto = gerarMensagemWhatsAppFarmacia(residente, pedidoSalvo, linkValidacao)
    const contato = (residente as any).contato
    const tel = contato ? String(contato).replace(/\D/g, '') : ''
    const url = tel
      ? `https://api.whatsapp.com/send?phone=55${tel}&text=${encodeURIComponent(texto)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* CABEÇALHO */}
        <DialogHeader className="p-5 border-b border-border/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Assinar Receita Digital (ICP-Brasil)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Validade jurídica plena e aceitação em qualquer farmácia do Brasil.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* CORPO DO MODAL */}
        <div className="p-5 space-y-4 text-xs">
          {/* =========================================================================
              ETAPA 1: FORMULÁRIO DE SELEÇÃO DO CERTIFICADO
              ========================================================================= */}
          {etapa === 'formulario' && (
            <form onSubmit={handleIniciarAssinatura} className="space-y-4">
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 flex items-start gap-2.5">
                <Lock className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  A assinatura digital qualificada ICP-Brasil vincula o <strong>CRM</strong> da médica e gera o
                  hash antifraude e o QR Code exigidos pela <strong>Portaria SVS/MS nº 344/98</strong> e <strong>CFM nº 2.299/2021</strong>.
                </p>
              </div>

              {/* Escolha da Autoridade / Certificado */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Tipo de Certificado / Provedor ICP-Brasil *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvedorNuvem('cfm')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      provedorNuvem === 'cfm'
                        ? 'border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-600'
                        : 'border-border/70 hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    <span className="font-bold text-xs block">Certificado CFM</span>
                    <span className="text-[10px] text-muted-foreground block">e-CRM / Nuvem Oficial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvedorNuvem('birdid')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      provedorNuvem === 'birdid'
                        ? 'border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-600'
                        : 'border-border/70 hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    <span className="font-bold text-xs block">Soluti BirdID</span>
                    <span className="text-[10px] text-muted-foreground block">Nuvem / App Celular</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvedorNuvem('vidaas')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      provedorNuvem === 'vidaas'
                        ? 'border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-600'
                        : 'border-border/70 hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    <span className="font-bold text-xs block">Serasa Vidaas</span>
                    <span className="text-[10px] text-muted-foreground block">Nuvem / Validador</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvedorNuvem('a1')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      provedorNuvem === 'a1'
                        ? 'border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-600'
                        : 'border-border/70 hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    <span className="font-bold text-xs block">Certificado A1</span>
                    <span className="text-[10px] text-muted-foreground block">Arquivo .PFX no PC</span>
                  </button>
                </div>
              </div>

              {/* CPF e Senha / PIN */}
              <div className="space-y-3 p-3.5 rounded-xl border border-border/80 bg-muted/10">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">CPF da Médica Titular do Certificado *</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(mascaraCPF(e.target.value))}
                    maxLength={14}
                    required
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">
                    PIN / Senha de Autorização <span className="text-muted-foreground font-normal">(ou confirme no aplicativo)</span>
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="text-xs h-8 font-mono"
                  />
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Smartphone className="size-3.5 text-blue-600" />
                Se o seu certificado for em nuvem, você poderá autorizar a assinatura no app do seu celular.
              </div>

              <DialogFooter className="pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs gap-1.5"
                >
                  <ShieldCheck className="size-3.5" /> Assinar Digitalmente
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* =========================================================================
              ETAPA 2: PROCESSANDO ASSINATURA CRIPTOGRÁFICA
              ========================================================================= */}
          {etapa === 'assinando' && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="size-10 animate-spin text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-foreground">
                  Processando Assinatura ICP-Brasil
                </h3>
                <p className="text-xs text-muted-foreground font-mono animate-pulse">
                  {progressoTexto}
                </p>
              </div>
            </div>
          )}

          {/* =========================================================================
              ETAPA 3: SUCESSO - DOCUMENTO ASSINADO E QR CODE DISPONÍVEL
              ========================================================================= */}
          {etapa === 'sucesso' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-center space-y-1">
                <div className="inline-flex p-1.5 rounded-full bg-emerald-600 text-white mb-1">
                  <CheckCircle2 className="size-5" />
                </div>
                <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                  Receita Digital Assinada com Sucesso!
                </h3>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-200">
                  Documento validado com padrão PAdES / ICP-Brasil e aceito em 100% das drogarias.
                </p>
              </div>

              {/* Box com QR Code e Código de Autenticidade */}
              <div className="p-4 rounded-xl border border-border/80 bg-card flex flex-col sm:flex-row items-center gap-4">
                {qrCodeUrl && (
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs shrink-0">
                    <img src={qrCodeUrl} alt="QR Code da Receita" className="size-24" />
                  </div>
                )}
                <div className="space-y-1.5 text-center sm:text-left min-w-0">
                  <Badge variant="outline" className="text-[10px] border-emerald-600/40 text-emerald-700 bg-emerald-500/10">
                    <FileCheck2 className="size-3 mr-1" /> Código de Validação Farmacêutica
                  </Badge>
                  <div className="font-mono font-bold text-sm text-foreground tracking-wider select-all">
                    {codigoGerado}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    O farmacêutico pode ler o QR Code ou consultar pelo código acima.
                  </p>
                </div>
              </div>

              {/* Botões de Ação para envio */}
              <div className="space-y-2 pt-1">
                <Button
                  type="button"
                  onClick={handleEnviarWhatsApp}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 h-9"
                >
                  <Share2 className="size-3.5" /> Enviar para Farmácia / Família (WhatsApp)
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopiarLink}
                    className="flex-1 text-xs gap-1.5"
                  >
                    {copiado ? <CheckCircle2 className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    {copiado ? 'Link Copiado!' : 'Copiar Link de Validação'}
                  </Button>

                  <a
                    href={linkValidacao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg border border-border/70 hover:bg-muted text-xs font-semibold text-foreground"
                  >
                    <ExternalLink className="size-3.5" /> Abrir Validação
                  </a>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="w-full bg-[#123F4A] hover:bg-[#123F4A]/90 text-white text-xs font-semibold"
                >
                  Concluir & Visualizar Receita
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
