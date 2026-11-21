import { useState, useId } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { toEmbedUrl } from '../../lib/treinamentos/videoEmbed'
import { gerarMiniCertificado } from '../../lib/treinamentos/miniCertificadoPdf'
import { TreinamentosService } from '../../lib/treinamentos/treinamentosService'
import type { AtribuicaoTreinamento } from '../../types/treinamentos'
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  RotateCcw,
  Video,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface ModalPlayerTreinamentoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  atribuicao: AtribuicaoTreinamento | null
  instituicaoNome: string
  onConcluido?: () => void
}

export function ModalPlayerTreinamento({
  open,
  onOpenChange,
  atribuicao,
  instituicaoNome,
  onConcluido,
}: ModalPlayerTreinamentoProps) {
  const radioGroupId = useId()
  const [videoAssistido, setVideoAssistido] = useState(false)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [submetendo, setSubmetendo] = useState(false)
  const [resultado, setResultado] = useState<{
    avaliado: boolean
    aprovado: boolean
    nota: number
    acertos: number
    total: number
  } | null>(null)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  if (!atribuicao) return null

  const perguntas = atribuicao.perguntasQuiz || []
  const jaConcluido = atribuicao.status === 'concluido'

  function handleSelecionarOpcao(perguntaId: string, opcaoId: string) {
    setRespostas((prev) => ({ ...prev, [perguntaId]: opcaoId }))
  }

  async function handleSubmeterQuiz() {
    if (!atribuicao) return

    if (perguntas.length > 0 && Object.keys(respostas).length < perguntas.length) {
      toast.error('Por favor, responda a todas as questões antes de enviar.')
      return
    }

    setSubmetendo(true)
    try {
      const res = await TreinamentosService.concluirTreinamento(
        atribuicao.id,
        respostas,
        atribuicao,
      )

      setResultado({
        avaliado: true,
        aprovado: res.aprovado,
        nota: res.nota,
        acertos: res.acertos,
        total: res.total,
      })

      if (res.aprovado) {
        toast.success(`Parabéns! Você foi aprovado com nota ${res.nota}%.`)
        onConcluido?.()
      } else {
        toast.error(`Aproveitamento de ${res.nota}%. A nota mínima é ${atribuicao.notaCorte}%.`)
      }
    } catch {
      toast.error('Erro ao registrar resposta do questionário.')
    } finally {
      setSubmetendo(false)
    }
  }

  async function handleBaixarCertificado() {
    if (!atribuicao) return
    setGerandoPdf(true)
    try {
      await gerarMiniCertificado({
        profissionalNome: atribuicao.profissionalNome,
        cpf: atribuicao.profissionalCpf,
        funcao: atribuicao.profissionalCat.toUpperCase(),
        cursoTitulo: atribuicao.cursoTitulo,
        cargaHoraria: atribuicao.duracaoEstimada || '1 hora',
        instituicaoNome,
        concluidoEm: atribuicao.concluidoEm || new Date().toISOString(),
        notaObtida: resultado?.nota ?? atribuicao.notaObtida ?? 100,
      })
      toast.success('Certificado gerado com sucesso!')
    } catch {
      toast.error('Erro ao gerar certificado em PDF.')
    } finally {
      setGerandoPdf(false)
    }
  }

  function handleResetarQuiz() {
    setResultado(null)
    setRespostas({})
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {atribuicao.cursoCategoria.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" /> Duração: {atribuicao.duracaoEstimada}
            </span>
          </div>
          <DialogTitle className="text-lg md:text-xl font-bold font-heading text-foreground">
            {atribuicao.cursoTitulo}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {jaConcluido
              ? 'Você já concluiu este treinamento. Pode rever a aula e baixar seu certificado a qualquer momento.'
              : 'Assista à videoaula na íntegra e, em seguida, responda ao questionário de fixação para certificar-se.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Video Player */}
          {atribuicao.videoUrl ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/90 border border-border/80 shadow-md">
              <iframe
                src={toEmbedUrl(atribuicao.videoUrl)}
                title={atribuicao.cursoTitulo}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-muted/30">
              <Video className="size-10 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-sm font-semibold text-foreground">Material Teórico & Procedimento</p>
              <p className="text-xs text-muted-foreground">Consulte o conteúdo orientado pelo RT.</p>
            </div>
          )}

          {/* Action button to unlock quiz if not watched */}
          {!videoAssistido && !jaConcluido && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/5 border border-primary/20">
              <div className="text-xs text-foreground">
                <span className="font-semibold block">Vídeo concluído?</span>
                <span className="text-muted-foreground">
                  Ao terminar o vídeo, confirme para desbloquear as questões do questionário.
                </span>
              </div>
              <Button
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => setVideoAssistido(true)}
              >
                <CheckCircle2 className="size-4" />
                Concluí o vídeo
              </Button>
            </div>
          )}

          {/* Certificate banner if already completed */}
          {jaConcluido && (
            <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-teal-500/20 text-teal-600 flex items-center justify-center shrink-0">
                  <Award className="size-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground block">
                    Treinamento Concluído!
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Aproveitamento: {atribuicao.notaObtida ?? 100}% • Concluído em{' '}
                    {atribuicao.concluidoEm
                      ? new Date(atribuicao.concluidoEm).toLocaleDateString('pt-BR')
                      : 'Data recente'}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBaixarCertificado}
                disabled={gerandoPdf}
                className="gap-1.5 bg-card hover:bg-muted"
              >
                <Download className="size-4 text-teal-600" />
                {gerandoPdf ? 'Gerando...' : 'Baixar Certificado'}
              </Button>
            </div>
          )}

          {/* Quiz Section */}
          {(videoAssistido || jaConcluido) && perguntas.length > 0 && (
            <Card className="border border-border/70 rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Award className="size-4 text-amber-500" />
                    Questionário de Fixação ({perguntas.length} Questões)
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    Nota mínima: {atribuicao.notaCorte}%
                  </Badge>
                </div>

                {/* Result Feedback Banner */}
                {resultado?.avaliado && (
                  <div
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                      resultado.aprovado
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {resultado.aprovado ? (
                        <CheckCircle2 className="size-6 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="size-6 text-rose-600 shrink-0" />
                      )}
                      <div className="text-xs">
                        <span className="font-bold text-sm block">
                          {resultado.aprovado
                            ? 'Parabéns, você foi aprovado!'
                            : 'Aproveitamento insuficiente'}
                        </span>
                        <span>
                          Você acertou {resultado.acertos} de {resultado.total} questões (Nota:{' '}
                          {resultado.nota}%). Mínimo exigido: {atribuicao.notaCorte}%.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {resultado.aprovado ? (
                        <Button
                          size="sm"
                          onClick={handleBaixarCertificado}
                          disabled={gerandoPdf}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        >
                          <Download className="size-4" />
                          {gerandoPdf ? 'Gerando...' : 'Baixar Certificado'}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetarQuiz}
                          className="gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <RotateCcw className="size-3.5" />
                          Tentar Novamente
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Questions List */}
                <div className="space-y-4 pt-1">
                  {perguntas.map((pergunta, idx) => {
                    const respostaEscolhida = respostas[pergunta.id]
                    const acertou =
                      resultado?.avaliado && respostaEscolhida === pergunta.opcaoCorretaId
                    const errou =
                      resultado?.avaliado && respostaEscolhida !== pergunta.opcaoCorretaId

                    return (
                      <div
                        key={pergunta.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-colors ${
                          resultado?.avaliado
                            ? acertou
                              ? 'border-emerald-500/40 bg-emerald-500/5'
                              : 'border-rose-500/40 bg-rose-500/5'
                            : 'border-border/60 bg-muted/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-foreground leading-snug">
                            {idx + 1}. {pergunta.enunciado}
                          </span>
                          {resultado?.avaliado && (
                            <Badge
                              variant="outline"
                              className={
                                acertou
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-300 text-[10px]'
                                  : 'bg-rose-500/10 text-rose-600 border-rose-300 text-[10px]'
                              }
                            >
                              {acertou ? 'Correto' : 'Incorreto'}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {pergunta.opcoes.map((opcao) => {
                            const isSelected = respostaEscolhida === opcao.id
                            const isCorrectOption = pergunta.opcaoCorretaId === opcao.id
                            const inputId = `${radioGroupId}-${pergunta.id}-${opcao.id}`

                            let optionClasses =
                              'flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all'
                            if (resultado?.avaliado) {
                              if (isCorrectOption) {
                                optionClasses += ' border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-semibold'
                              } else if (isSelected && !isCorrectOption) {
                                optionClasses += ' border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-200'
                              } else {
                                optionClasses += ' border-border/40 opacity-60'
                              }
                            } else {
                              optionClasses += isSelected
                                ? ' border-primary bg-primary/10 text-primary font-medium'
                                : ' border-border/60 hover:bg-muted/40 text-foreground'
                            }

                            return (
                              <label key={opcao.id} htmlFor={inputId} className={optionClasses}>
                                <input
                                  id={inputId}
                                  type="radio"
                                  name={`pergunta-${pergunta.id}`}
                                  value={opcao.id}
                                  checked={isSelected}
                                  disabled={Boolean(resultado?.avaliado)}
                                  onChange={() => handleSelecionarOpcao(pergunta.id, opcao.id)}
                                  className="size-3.5 accent-primary cursor-pointer"
                                />
                                <span className="flex-1">{opcao.texto}</span>
                              </label>
                            )
                          })}
                        </div>

                        {resultado?.avaliado && errou && pergunta.explicacao && (
                          <div className="p-2.5 rounded-lg bg-background/80 border border-border/60 text-[11px] text-muted-foreground mt-2">
                            <strong className="text-foreground">Explicação: </strong>
                            {pergunta.explicacao}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {!resultado?.avaliado && !jaConcluido && (
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSubmeterQuiz}
                      disabled={submetendo}
                      className="gap-2"
                    >
                      <CheckCircle2 className="size-4" />
                      {submetendo ? 'Avaliando respostas...' : 'Finalizar e Enviar Questionário'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between border-t border-border/40 pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {jaConcluido && (
            <Button
              size="sm"
              onClick={handleBaixarCertificado}
              disabled={gerandoPdf}
              className="gap-1.5"
            >
              <Download className="size-4" />
              {gerandoPdf ? 'Gerando...' : 'Baixar Certificado'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
