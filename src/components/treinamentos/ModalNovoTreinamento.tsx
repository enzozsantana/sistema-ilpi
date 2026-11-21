import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { TreinamentosService } from '../../lib/treinamentos/treinamentosService'
import {
  CATEGORIAS_CURSO_LABELS,
  type CategoriaCursoTreinamento,
  type CursoTreinamento,
  type PerguntaQuiz,
} from '../../types/treinamentos'
import { Award, Plus, Trash2, Video } from 'lucide-react'
import { toast } from 'sonner'

interface ModalNovoTreinamentoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cursoEditando?: CursoTreinamento | null
  onSalvo?: (curso: CursoTreinamento) => void
}

export function ModalNovoTreinamento({
  open,
  onOpenChange,
  cursoEditando,
  onSalvo,
}: ModalNovoTreinamentoProps) {
  const [titulo, setTitulo] = useState(cursoEditando?.titulo || '')
  const [descricao, setDescricao] = useState(cursoEditando?.descricao || '')
  const [categoria, setCategoria] = useState<CategoriaCursoTreinamento>(
    cursoEditando?.categoria || 'rdc502',
  )
  const [duracao, setDuracao] = useState(cursoEditando?.duracaoEstimada || '45 min')
  const [videoUrl, setVideoUrl] = useState(cursoEditando?.videoUrl || '')
  const [notaCorte, setNotaCorte] = useState<number>(cursoEditando?.notaCorte ?? 70)
  const [perguntas, setPerguntas] = useState<PerguntaQuiz[]>(
    cursoEditando?.perguntasQuiz && cursoEditando.perguntasQuiz.length > 0
      ? cursoEditando.perguntasQuiz
      : [
          {
            id: `q-${Date.now()}`,
            enunciado: '',
            opcoes: [
              { id: 'a', texto: '' },
              { id: 'b', texto: '' },
              { id: 'c', texto: '' },
            ],
            opcaoCorretaId: 'a',
            explicacao: '',
          },
        ],
  )
  const [salvando, setSalvando] = useState(false)

  function handleAdicionarPergunta() {
    setPerguntas((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}-${prev.length + 1}`,
        enunciado: '',
        opcoes: [
          { id: 'a', texto: '' },
          { id: 'b', texto: '' },
          { id: 'c', texto: '' },
        ],
        opcaoCorretaId: 'a',
        explicacao: '',
      },
    ])
  }

  function handleRemoverPergunta(idx: number) {
    setPerguntas((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleAtualizarPergunta(idx: number, campo: keyof PerguntaQuiz, valor: any) {
    setPerguntas((prev) => {
      const clone = [...prev]
      clone[idx] = { ...clone[idx], [campo]: valor }
      return clone
    })
  }

  function handleAtualizarOpcao(perguntaIdx: number, opcaoIdx: number, texto: string) {
    setPerguntas((prev) => {
      const clone = [...prev]
      const opcoesClone = [...clone[perguntaIdx].opcoes]
      opcoesClone[opcaoIdx] = { ...opcoesClone[opcaoIdx], texto }
      clone[perguntaIdx] = { ...clone[perguntaIdx], opcoes: opcoesClone }
      return clone
    })
  }

  async function handleSalvar() {
    if (!titulo.trim()) {
      toast.error('Informe o título do treinamento.')
      return
    }

    setSalvando(true)
    try {
      const cursoSalvo = await TreinamentosService.salvarCurso({
        id: cursoEditando?.id,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria,
        duracaoEstimada: duracao.trim() || '45 min',
        videoUrl: videoUrl.trim(),
        notaCorte,
        perguntasQuiz: perguntas.filter((p) => p.enunciado.trim().length > 0),
        ativo: true,
      })

      toast.success('Treinamento salvo com sucesso no catálogo!')
      onSalvo?.(cursoSalvo)
      onOpenChange(false)
    } catch {
      toast.error('Erro ao salvar treinamento.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto p-6 md:p-8">
        <DialogHeader className="pb-3 border-b border-border/40">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold font-heading">
            <Award className="size-5 text-amber-500" />
            {cursoEditando ? 'Editar Treinamento' : 'Novo Treinamento Continuado'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cadastre videoaulas (YouTube ou Vimeo) e elabore o questionário de fixação conforme as exigências da RDC 502/2021 ANVISA.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-4 text-xs">
          {/* Coluna Esquerda: Dados Gerais e Vídeo */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-4 shadow-2xs">
              <span className="font-semibold text-xs text-foreground uppercase tracking-wider block border-b border-border/40 pb-2">
                1. Informações do Treinamento
              </span>

              <div className="space-y-1.5">
                <Label className="text-xs">Título do Treinamento *</Label>
                <Input
                  placeholder="ex: Higienização das Mãos e Controle de Infecções"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descrição / Objetivos de Aprendizagem</Label>
                <textarea
                  rows={3}
                  placeholder="ex: Protocolos obrigatórios de lavagem e fricção alcoólica para prevenção de infecções cruzadas na rotina de cuidados do idoso."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoria *</Label>
                  <Select
                    value={categoria}
                    onValueChange={(val: CategoriaCursoTreinamento) => setCategoria(val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Selecione categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORIAS_CURSO_LABELS).map(([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Carga Horária</Label>
                  <Input
                    placeholder="ex: 45 min ou 1h"
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Nota Mínima para Aprovação</Label>
                  <span className="font-bold text-xs text-primary">{notaCorte}%</span>
                </div>
                <Input
                  type="number"
                  min={50}
                  max={100}
                  value={notaCorte}
                  onChange={(e) => setNotaCorte(Number(e.target.value) || 70)}
                  className="text-xs"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Padrão recomendado pela auditoria sanitária: 70%.
                </span>
              </div>
            </div>

            {/* Video Section */}
            <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-3 shadow-2xs">
              <span className="font-semibold text-xs text-foreground uppercase tracking-wider block border-b border-border/40 pb-2">
                2. Videoaula & Material Teórico
              </span>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Video className="size-3.5 text-primary" />
                  Link do Vídeo (YouTube ou Vimeo)
                </Label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground block leading-relaxed">
                  Insira o link de um vídeo do YouTube (público ou não listado) ou Vimeo. Ele será embutido diretamente no player do aluno.
                </span>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Construtor de Perguntas & Quiz */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div>
                  <span className="font-semibold text-xs text-foreground uppercase tracking-wider block">
                    3. Questionário de Fixação ({perguntas.length} Questões)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Perguntas de múltipla escolha para validar o aprendizado e habilitar o certificado.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleAdicionarPergunta}
                  className="gap-1 text-xs shrink-0"
                >
                  <Plus className="size-3" />
                  Adicionar Questão
                </Button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {perguntas.map((p, pIdx) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                      <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <span className="size-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">
                          {pIdx + 1}
                        </span>
                        Questão {pIdx + 1}
                      </span>
                      {perguntas.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground hover:text-rose-600"
                          onClick={() => handleRemoverPergunta(pIdx)}
                          title="Remover questão"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Enunciado da Pergunta *</Label>
                      <Input
                        placeholder="ex: Qual o procedimento correto antes de manusear a dieta do residente?"
                        value={p.enunciado}
                        onChange={(e) =>
                          handleAtualizarPergunta(pIdx, 'enunciado', e.target.value)
                        }
                        className="text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-semibold text-muted-foreground block">
                        Alternativas (selecione a correta no botão de rádio):
                      </span>
                      {p.opcoes.map((opcao, oIdx) => (
                        <div key={opcao.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correta-${p.id}`}
                            checked={p.opcaoCorretaId === opcao.id}
                            onChange={() =>
                              handleAtualizarPergunta(pIdx, 'opcaoCorretaId', opcao.id)
                            }
                            className="size-3.5 accent-primary cursor-pointer shrink-0"
                            title="Marcar como alternativa correta"
                          />
                          <Input
                            placeholder={`Opção ${opcao.id.toUpperCase()}...`}
                            value={opcao.texto}
                            onChange={(e) =>
                              handleAtualizarOpcao(pIdx, oIdx, e.target.value)
                            }
                            className="text-xs h-7 flex-1"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1 pt-1">
                      <Label className="text-[10px] text-muted-foreground">
                        Explicação / Justificativa da Resposta Correta (opcional)
                      </Label>
                      <Input
                        placeholder="ex: Conforme o POP 03, a higienização prévia reduz em 90% a carga microbiana."
                        value={p.explicacao || ''}
                        onChange={(e) =>
                          handleAtualizarPergunta(pIdx, 'explicacao', e.target.value)
                        }
                        className="text-[11px] text-muted-foreground h-7"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/40 flex items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSalvar} disabled={salvando} className="gap-1.5">
            <Award className="size-4" />
            {salvando ? 'Salvando...' : cursoEditando ? 'Salvar Alterações' : 'Cadastrar Treinamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
