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
import type { CursoTreinamento } from '../../types/treinamentos'
import type { Profissional } from '../../types/ilpi'
import { CATS } from '../../lib/constants'
import { Award, Calendar, CheckCheck, Users } from 'lucide-react'
import { toast } from 'sonner'

interface ModalAtribuirTreinamentoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cursos: CursoTreinamento[]
  equipe: Profissional[]
  cursoPreSelecionado?: CursoTreinamento | null
  onAtribuido?: () => void
}

export function ModalAtribuirTreinamento({
  open,
  onOpenChange,
  cursos,
  equipe,
  cursoPreSelecionado,
  onAtribuido,
}: ModalAtribuirTreinamentoProps) {
  const [cursoId, setCursoId] = useState<string>(
    cursoPreSelecionado?.id || (cursos[0]?.id ?? ''),
  )
  const [modo, setModo] = useState<'individual' | 'lote'>('individual')
  const [profissionalId, setProfissionalId] = useState<string>(equipe[0]?.id ?? '')
  const [categoriaLote, setCategoriaLote] = useState<string>('cuid')

  // Data limite padrão: 15 dias no futuro
  const dataPadrao = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)
  const [prazo, setPrazo] = useState<string>(dataPadrao)
  const [salvando, setSalvando] = useState(false)

  const equipeAtiva = equipe.filter((p) => p.ativo !== false)

  async function handleAtribuir() {
    const cursoAlvo = cursos.find((c) => c.id === cursoId) || cursoPreSelecionado
    if (!cursoAlvo) {
      toast.error('Selecione um treinamento para atribuir.')
      return
    }

    if (!prazo) {
      toast.error('Informe a data limite (prazo).')
      return
    }

    setSalvando(true)
    try {
      if (modo === 'individual') {
        const prof = equipeAtiva.find((p) => p.id === profissionalId)
        if (!prof) {
          toast.error('Selecione o profissional.')
          setSalvando(false)
          return
        }

        await TreinamentosService.atribuirTreinamento({
          curso: cursoAlvo,
          profissionalId: prof.id,
          profissionalNome: prof.nome,
          profissionalCat: prof.cat,
          profissionalCpf: (prof as any).cpf || '',
          prazo,
        })

        toast.success(`Treinamento atribuído a ${prof.nome}!`)
      } else {
        // Atribuição em lote
        let destinatarios = equipeAtiva
        if (categoriaLote !== 'todos') {
          destinatarios = equipeAtiva.filter((p) => p.cat === categoriaLote)
        }

        if (destinatarios.length === 0) {
          toast.error('Nenhum colaborador ativo encontrado nesta categoria.')
          setSalvando(false)
          return
        }

        const qtd = await TreinamentosService.atribuirEmLote(
          cursoAlvo,
          destinatarios.map((p) => ({
            id: p.id,
            nome: p.nome,
            cat: p.cat,
            cpf: (p as any).cpf || '',
          })),
          prazo,
        )

        toast.success(`Treinamento atribuído com sucesso a ${qtd} colaboradores!`)
      }

      onAtribuido?.()
      onOpenChange(false)
    } catch {
      toast.error('Erro ao atribuir treinamento.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold font-heading">
            <Award className="size-5 text-primary" />
            Atribuir Treinamento à Equipe
          </DialogTitle>
          <DialogDescription className="text-xs">
            Designe cursos e defina o prazo para conclusão pelos colaboradores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Seleção do Curso */}
          <div className="space-y-1.5">
            <Label className="text-xs">Treinamento *</Label>
            <Select value={cursoId} onValueChange={setCursoId}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Selecione o curso" />
              </SelectTrigger>
              <SelectContent>
                {cursos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Modo de Atribuição */}
          <div className="space-y-1.5">
            <Label className="text-xs">Destinatário</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={modo === 'individual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModo('individual')}
                className="text-xs gap-1.5"
              >
                <Users className="size-3.5" />
                Individual
              </Button>
              <Button
                type="button"
                variant={modo === 'lote' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModo('lote')}
                className="text-xs gap-1.5"
              >
                <CheckCheck className="size-3.5" />
                Em Lote (Categoria)
              </Button>
            </div>
          </div>

          {modo === 'individual' ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Colaborador *</Label>
              <Select value={profissionalId} onValueChange={setProfissionalId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {equipeAtiva.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} ({CATS[p.cat] || p.cat.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria Alvo *</Label>
              <Select value={categoriaLote} onValueChange={setCategoriaLote}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Toda a Equipe (Todos os Profissionais)</SelectItem>
                  <SelectItem value="cuid">Cuidadores de Idosos ({equipeAtiva.filter((p) => p.cat === 'cuid').length})</SelectItem>
                  <SelectItem value="tec">Técnicos de Enfermagem ({equipeAtiva.filter((p) => p.cat === 'tec').length})</SelectItem>
                  <SelectItem value="enf">Enfermeiros ({equipeAtiva.filter((p) => p.cat === 'enf').length})</SelectItem>
                  <SelectItem value="apoio">Equipe de Apoio / Limpeza / Cozinha ({equipeAtiva.filter((p) => p.cat === 'apoio').length})</SelectItem>
                  <SelectItem value="multi">Multiprofissional ({equipeAtiva.filter((p) => p.cat === 'multi').length})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Prazo */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" />
              Prazo Limite de Conclusão *
            </Label>
            <Input
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={handleAtribuir} disabled={salvando}>
            {salvando ? 'Atribuindo...' : 'Confirmar Atribuição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
