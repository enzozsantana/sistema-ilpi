import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { can } from '../lib/permissions'
import { CATS } from '../lib/constants'
import { TreinamentosService } from '../lib/treinamentos/treinamentosService'
import { gerarAtaAssinaturasAnvisa } from '../lib/treinamentos/ataAssinaturasPdf'
import { gerarMiniCertificado } from '../lib/treinamentos/miniCertificadoPdf'
import { ModalPlayerTreinamento } from '../components/treinamentos/ModalPlayerTreinamento'
import { ModalNovoTreinamento } from '../components/treinamentos/ModalNovoTreinamento'
import { ModalAtribuirTreinamento } from '../components/treinamentos/ModalAtribuirTreinamento'
import type {
  AtribuicaoTreinamento,
  CursoTreinamento,
} from '../types/treinamentos'
import { CATEGORIAS_CURSO_LABELS } from '../types/treinamentos'

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileDown,
  GraduationCap,
  Play,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

export default function Treinamentos() {
  const { profissional } = useAuth()
  const { equipe, inst } = useIlpiData()

  const podeGerir = profissional ? can(profissional.cat, 'gerir') : false
  const instituicaoNome = inst || 'Instituição de Longa Permanência para Idosos'

  const [abaAtiva, setAbaAtiva] = useState<'meus' | 'catalogo' | 'conformidade'>('meus')
  const [cursos, setCursos] = useState<CursoTreinamento[]>([])
  const [todasAtribuicoes, setTodasAtribuicoes] = useState<AtribuicaoTreinamento[]>([])
  const [, setCarregando] = useState(true)

  // Modals state
  const [modalPlayerOpen, setModalPlayerOpen] = useState(false)
  const [atribuicaoSelecionada, setAtribuicaoSelecionada] = useState<AtribuicaoTreinamento | null>(null)

  const [modalNovoCursoOpen, setModalNovoCursoOpen] = useState(false)
  const [cursoEditando, setCursoEditando] = useState<CursoTreinamento | null>(null)

  const [modalAtribuirOpen, setModalAtribuirOpen] = useState(false)
  const [cursoParaAtribuir, setCursoParaAtribuir] = useState<CursoTreinamento | null>(null)

  // Filters for compliance table
  const [buscaConformidade, setBuscaConformidade] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [gerandoAtaPdf, setGerandoAtaPdf] = useState(false)

  // Filter for learner tab
  const [filtroMeusStatus, setFiltroMeusStatus] = useState<'todos' | 'pendentes' | 'concluidos'>('todos')

  useEffect(() => {
    carregarDados()
  }, [profissional?.id])

  async function carregarDados() {
    setCarregando(true)
    try {
      const [listaCursos, listaAtribuicoes] = await Promise.all([
        TreinamentosService.listarCursos(),
        TreinamentosService.listarAtribuicoes(),
      ])

      setCursos(listaCursos)

      // Se o profissional atual não tiver atribuições, vincula as atribuições do seed a ele para teste
      let atribs = listaAtribuicoes
      if (profissional && !listaAtribuicoes.some((a) => a.profissionalId === profissional.id)) {
        if (listaCursos.length > 0) {
          const hoje = new Date()
          const prazoProximo = new Date(hoje.getTime() + 15 * 86400000).toISOString().slice(0, 10)
          const novaAtrib = await TreinamentosService.atribuirTreinamento({
            curso: listaCursos[0],
            profissionalId: profissional.id,
            profissionalNome: profissional.nome,
            profissionalCat: profissional.cat,
            profissionalCpf: (profissional as any).cpf || '',
            prazo: prazoProximo,
          })
          atribs = [novaAtrib, ...atribs]
        }
      }

      setTodasAtribuicoes(atribs)
    } catch {
      toast.error('Erro ao carregar dados de treinamentos.')
    } finally {
      setCarregando(false)
    }
  }

  // Minhas atribuições
  const minhasAtribuicoes = useMemo(() => {
    if (!profissional) return []
    return todasAtribuicoes.filter((a) => a.profissionalId === profissional.id)
  }, [todasAtribuicoes, profissional?.id])

  // Minhas atribuições filtradas
  const minhasFiltradas = useMemo(() => {
    if (filtroMeusStatus === 'todos') return minhasAtribuicoes
    if (filtroMeusStatus === 'concluidos') {
      return minhasAtribuicoes.filter((a) => a.status === 'concluido')
    }
    return minhasAtribuicoes.filter((a) => a.status !== 'concluido')
  }, [minhasAtribuicoes, filtroMeusStatus])

  // Métricas do Colaborador
  const metricasPessoais = useMemo(() => {
    const total = minhasAtribuicoes.length
    const concluidos = minhasAtribuicoes.filter((a) => a.status === 'concluido').length
    const pendentes = minhasAtribuicoes.filter((a) => a.status === 'pendente').length
    const atrasados = minhasAtribuicoes.filter((a) => a.status === 'atrasado').length
    return { total, concluidos, pendentes, atrasados }
  }, [minhasAtribuicoes])

  // Métricas Gerais (Gestor / RT)
  const metricasGerais = useMemo(() => {
    return TreinamentosService.obterMetricas(todasAtribuicoes)
  }, [todasAtribuicoes])

  // Linhas da tabela de conformidade filtradas
  const atribuicoesFiltradasConformidade = useMemo(() => {
    return todasAtribuicoes.filter((a) => {
      if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false
      if (buscaConformidade.trim()) {
        const termo = buscaConformidade.toLowerCase()
        const matchNome = a.profissionalNome.toLowerCase().includes(termo)
        const matchCurso = a.cursoTitulo.toLowerCase().includes(termo)
        const matchCpf = (a.profissionalCpf || '').toLowerCase().includes(termo)
        return matchNome || matchCurso || matchCpf
      }
      return true
    })
  }, [todasAtribuicoes, filtroStatus, buscaConformidade])

  function handleAbrirPlayer(atrib: AtribuicaoTreinamento) {
    setAtribuicaoSelecionada(atrib)
    setModalPlayerOpen(true)
  }

  function handleNovoCurso() {
    setCursoEditando(null)
    setModalNovoCursoOpen(true)
  }

  function handleEditarCurso(curso: CursoTreinamento) {
    setCursoEditando(curso)
    setModalNovoCursoOpen(true)
  }

  function handleAbrirAtribuir(curso?: CursoTreinamento) {
    setCursoParaAtribuir(curso || null)
    setModalAtribuirOpen(true)
  }

  async function handleGerarAtaPdf() {
    if (todasAtribuicoes.length === 0) {
      toast.error('Não há registros de treinamentos para gerar a ata.')
      return
    }

    setGerandoAtaPdf(true)
    try {
      await gerarAtaAssinaturasAnvisa({
        instituicaoNome,
        atribuicoes: atribuicoesFiltradasConformidade,
        filtroStatus:
          filtroStatus !== 'todos'
            ? filtroStatus === 'concluido'
              ? 'Concluídos'
              : filtroStatus === 'atrasado'
                ? 'Atrasados'
                : 'Pendentes'
            : undefined,
      })
      toast.success('Ata de treinamentos gerada com sucesso!')
    } catch {
      toast.error('Erro ao gerar documento PDF de assinaturas.')
    } finally {
      setGerandoAtaPdf(false)
    }
  }

  async function handleBaixarCertificadoAvulso(a: AtribuicaoTreinamento) {
    try {
      await gerarMiniCertificado({
        profissionalNome: a.profissionalNome,
        cpf: a.profissionalCpf,
        funcao: a.profissionalCat.toUpperCase(),
        cursoTitulo: a.cursoTitulo,
        cargaHoraria: a.duracaoEstimada || '1 hora',
        instituicaoNome,
        concluidoEm: a.concluidoEm || new Date().toISOString(),
        notaObtida: a.notaObtida ?? 100,
      })
      toast.success('Certificado gerado!')
    } catch {
      toast.error('Erro ao gerar certificado em PDF.')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-2">
            <GraduationCap className="size-3.5" />
            <span>Educação Permanente & Capacitação Continuada</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-foreground">
            Módulo de Treinamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conformidade com a Resolução RDC nº 502/2021 ANVISA — Capacitação periódica da equipe assistencial e de apoio.
          </p>
        </div>

        {podeGerir && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAbrirAtribuir()}
              className="gap-1.5"
            >
              <UserCheck className="size-4 text-primary" />
              Atribuir à Equipe
            </Button>
            <Button
              size="sm"
              onClick={handleNovoCurso}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Novo Treinamento
            </Button>
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <Tabs
        value={abaAtiva}
        onValueChange={(v) => setAbaAtiva(v as any)}
        className="space-y-5"
      >
        <TabsList className="bg-muted/70 p-1 rounded-xl">
          <TabsTrigger value="meus" className="rounded-lg text-xs font-semibold gap-1.5">
            <Award className="size-3.5" />
            Meus Treinamentos
            {metricasPessoais.pendentes + metricasPessoais.atrasados > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                {metricasPessoais.pendentes + metricasPessoais.atrasados}
              </Badge>
            )}
          </TabsTrigger>

          {podeGerir && (
            <>
              <TabsTrigger value="catalogo" className="rounded-lg text-xs font-semibold gap-1.5">
                <BookOpen className="size-3.5" />
                Catálogo de Cursos ({cursos.length})
              </TabsTrigger>
              <TabsTrigger value="conformidade" className="rounded-lg text-xs font-semibold gap-1.5">
                <FileCheck2 className="size-3.5" />
                Conformidade & Atas ANVISA
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* TAB 1: MEUS TREINAMENTOS (Visible to all collaborators) */}
        <TabsContent value="meus" className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border border-border/60 bg-card/60 shadow-2xs">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Total Atribuídos
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {metricasPessoais.total}
                  </span>
                </div>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen className="size-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/60 shadow-2xs">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Concluídos & Certificados
                  </span>
                  <span className="text-xl font-bold text-emerald-600">
                    {metricasPessoais.concluidos}
                  </span>
                </div>
                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="size-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/60 shadow-2xs">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Pendentes no Prazo
                  </span>
                  <span className="text-xl font-bold text-amber-600">
                    {metricasPessoais.pendentes}
                  </span>
                </div>
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Clock className="size-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/60 shadow-2xs">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Atrasados
                  </span>
                  <span className="text-xl font-bold text-rose-600">
                    {metricasPessoais.atrasados}
                  </span>
                </div>
                <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="size-4" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 border-b border-border/40 pb-2">
            <Button
              variant={filtroMeusStatus === 'todos' ? 'default' : 'ghost'}
              size="xs"
              onClick={() => setFiltroMeusStatus('todos')}
              className="text-xs rounded-lg"
            >
              Todos ({minhasAtribuicoes.length})
            </Button>
            <Button
              variant={filtroMeusStatus === 'pendentes' ? 'default' : 'ghost'}
              size="xs"
              onClick={() => setFiltroMeusStatus('pendentes')}
              className="text-xs rounded-lg"
            >
              Pendentes ({metricasPessoais.pendentes + metricasPessoais.atrasados})
            </Button>
            <Button
              variant={filtroMeusStatus === 'concluidos' ? 'default' : 'ghost'}
              size="xs"
              onClick={() => setFiltroMeusStatus('concluidos')}
              className="text-xs rounded-lg"
            >
              Concluídos ({metricasPessoais.concluidos})
            </Button>
          </div>

          {/* Cards Grid */}
          {minhasFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {minhasFiltradas.map((atrib) => {
                const isConcluido = atrib.status === 'concluido'
                const isAtrasado = atrib.status === 'atrasado'
                const prazoFormatado = new Date(atrib.prazo).toLocaleDateString('pt-BR')

                return (
                  <Card
                    key={atrib.id}
                    className="border border-border/70 hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden shadow-xs group"
                  >
                    <CardHeader className="p-4 pb-2 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-muted/60 text-muted-foreground uppercase"
                        >
                          {CATEGORIAS_CURSO_LABELS[atrib.cursoCategoria] || atrib.cursoCategoria}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            isConcluido
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-300 text-[10px]'
                              : isAtrasado
                                ? 'bg-rose-500/10 text-rose-600 border-rose-300 text-[10px]'
                                : 'bg-amber-500/10 text-amber-600 border-amber-300 text-[10px]'
                          }
                        >
                          {isConcluido
                            ? 'Concluído'
                            : isAtrasado
                              ? 'Atrasado'
                              : 'Pendente'}
                        </Badge>
                      </div>

                      <CardTitle className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                        {atrib.cursoTitulo}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-3">
                      <div className="space-y-1 text-xs text-muted-foreground pt-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-primary" />
                          <span>Duração: {atrib.duracaoEstimada}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-primary" />
                          <span>
                            {isConcluido
                              ? `Concluído em ${new Date(atrib.concluidoEm || '').toLocaleDateString('pt-BR')}`
                              : `Prazo limite: ${prazoFormatado}`}
                          </span>
                        </div>
                        {isConcluido && typeof atrib.notaObtida === 'number' && (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <Award className="size-3.5" />
                            <span>Aproveitamento: {atrib.notaObtida}%</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                        <Button
                          variant={isConcluido ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleAbrirPlayer(atrib)}
                          className="w-full text-xs gap-1.5"
                        >
                          {isConcluido ? (
                            <>
                              <Award className="size-3.5 text-primary" />
                              Ver Aula & Certificado
                            </>
                          ) : (
                            <>
                              <Play className="size-3.5" />
                              Iniciar Treinamento
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border/70 bg-card/40 space-y-2">
              <Award className="size-10 mx-auto text-muted-foreground/50" />
              <p className="text-sm font-semibold text-foreground">
                Nenhum treinamento nesta categoria
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Todos os treinamentos obrigatórios designados a você pelo Responsável Técnico aparecerão aqui.
              </p>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: CATÁLOGO DE CURSOS (Management) */}
        {podeGerir && (
          <TabsContent value="catalogo" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Cursos Disponíveis para a ILPI ({cursos.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Grade de treinamentos permanentes conforme a RDC 502/2021 e boas práticas assistenciais.
                </p>
              </div>
              <Button size="sm" onClick={handleNovoCurso} className="gap-1.5">
                <Plus className="size-4" />
                Adicionar Curso
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cursos.map((curso) => (
                <Card
                  key={curso.id}
                  className="border border-border/70 shadow-xs flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-primary/10 text-primary border-primary/20"
                      >
                        {CATEGORIAS_CURSO_LABELS[curso.categoria] || curso.categoria}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" /> {curso.duracaoEstimada}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground leading-snug">
                      {curso.titulo}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {curso.descricao}
                    </p>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{curso.perguntasQuiz?.length || 0} questões de quiz</span>
                      <span>Nota mínima: {curso.notaCorte}%</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleEditarCurso(curso)}
                        className="flex-1 text-xs"
                      >
                        Editar
                      </Button>
                      <Button
                        size="xs"
                        onClick={() => handleAbrirAtribuir(curso)}
                        className="flex-1 text-xs gap-1"
                      >
                        <UserCheck className="size-3.5" />
                        Atribuir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {/* TAB 3: CONFORMIDADE & ATAS ANVISA (Management) */}
        {podeGerir && (
          <TabsContent value="conformidade" className="space-y-5">
            {/* Compliance KPI Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border border-border/70 bg-card p-4 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Taxa de Conformidade da Equipe
                  </span>
                  <ShieldCheck className="size-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-heading text-emerald-600">
                    {metricasGerais.taxaConclusao}%
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ({metricasGerais.concluidos} de {metricasGerais.totalAtribuicoes} concluídos)
                  </span>
                </div>
              </Card>

              <Card className="border border-border/70 bg-card p-4 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Colaboradores Capacitados
                  </span>
                  <Users className="size-4 text-primary" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-heading text-foreground">
                    {metricasGerais.colaboradoresEngajados}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    profissionais com cursos atribuídos
                  </span>
                </div>
              </Card>

              <Card className="border border-border/70 bg-card p-4 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Pendências e Atrasos
                  </span>
                  <ShieldAlert className="size-4 text-rose-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-heading text-rose-600">
                    {metricasGerais.atrasados}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    atrasados (+{metricasGerais.pendentes} no prazo)
                  </span>
                </div>
              </Card>
            </div>

            {/* Table and Actions */}
            <Card className="border border-border/70 shadow-xs rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
                <div>
                  <CardTitle className="text-sm font-bold font-heading flex items-center gap-2">
                    <Award className="size-4 text-primary" />
                    Quadro Geral de Capacitações & Atas de Presença
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Gere o relatório oficial de assinaturas para arquivamento e apresentação à fiscalização da Vigilância Sanitária.
                  </p>
                </div>

                <Button
                  onClick={handleGerarAtaPdf}
                  disabled={gerandoAtaPdf || todasAtribuicoes.length === 0}
                  className="gap-2 shrink-0 bg-primary text-primary-foreground font-semibold shadow-xs"
                >
                  <FileDown className="size-4" />
                  {gerandoAtaPdf ? 'Gerando Ata...' : 'Gerar Documento de Assinaturas (PDF)'}
                </Button>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* Search & Filter bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por colaborador ou curso..."
                      value={buscaConformidade}
                      onChange={(e) => setBuscaConformidade(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-muted-foreground shrink-0">Filtrar status:</span>
                    <select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="text-xs rounded-xl border border-border/70 bg-background px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="todos">Todos os Registros</option>
                      <option value="concluido">Concluídos</option>
                      <option value="pendente">Pendentes</option>
                      <option value="atrasado">Atrasados</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                      <tr>
                        <th className="p-3">Colaborador(a)</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Treinamento</th>
                        <th className="p-3">Prazo</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Conclusão</th>
                        <th className="p-3">Nota</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {atribuicoesFiltradasConformidade.length > 0 ? (
                        atribuicoesFiltradasConformidade.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-semibold text-foreground">
                              {item.profissionalNome}
                              {item.profissionalCpf && (
                                <span className="block text-[10px] text-muted-foreground font-normal">
                                  CPF: {item.profissionalCpf}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-[10px]">
                                {CATS[item.profissionalCat as keyof typeof CATS] || item.profissionalCat.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="p-3 font-medium text-foreground max-w-xs truncate">
                              {item.cursoTitulo}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {new Date(item.prazo).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className={
                                  item.status === 'concluido'
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-300 text-[10px]'
                                    : item.status === 'atrasado'
                                      ? 'bg-rose-500/10 text-rose-600 border-rose-300 text-[10px]'
                                      : 'bg-amber-500/10 text-amber-600 border-amber-300 text-[10px]'
                                }
                              >
                                {item.status === 'concluido'
                                  ? 'Concluído'
                                  : item.status === 'atrasado'
                                    ? 'Atrasado'
                                    : 'Pendente'}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {item.concluidoEm
                                ? new Date(item.concluidoEm).toLocaleDateString('pt-BR')
                                : '—'}
                            </td>
                            <td className="p-3 font-semibold">
                              {typeof item.notaObtida === 'number'
                                ? `${item.notaObtida}%`
                                : '—'}
                            </td>
                            <td className="p-3 text-right">
                              {item.status === 'concluido' ? (
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleBaixarCertificadoAvulso(item)}
                                  className="text-xs gap-1 text-primary hover:text-primary"
                                  title="Baixar Mini-Certificado em PDF"
                                >
                                  <Download className="size-3.5" />
                                  Certificado
                                </Button>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">Aguardando</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-muted-foreground">
                            Nenhum registro encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Modais */}
      <ModalPlayerTreinamento
        open={modalPlayerOpen}
        onOpenChange={setModalPlayerOpen}
        atribuicao={atribuicaoSelecionada}
        instituicaoNome={instituicaoNome}
        onConcluido={carregarDados}
      />

      <ModalNovoTreinamento
        open={modalNovoCursoOpen}
        onOpenChange={setModalNovoCursoOpen}
        cursoEditando={cursoEditando}
        onSalvo={carregarDados}
      />

      <ModalAtribuirTreinamento
        open={modalAtribuirOpen}
        onOpenChange={setModalAtribuirOpen}
        cursos={cursos}
        equipe={equipe}
        cursoPreSelecionado={cursoParaAtribuir}
        onAtribuido={carregarDados}
      />
    </div>
  )
}
