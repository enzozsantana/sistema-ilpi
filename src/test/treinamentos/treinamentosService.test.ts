import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  TreinamentosService,
  CURSOS_PADRAO_ILPI,
} from '../../lib/treinamentos/treinamentosService'
import { toEmbedUrl } from '../../lib/treinamentos/videoEmbed'

describe('TreinamentosService & VideoEmbed', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('toEmbedUrl converte URLs do YouTube e Vimeo corretamente', () => {
    expect(toEmbedUrl('https://www.youtube.com/watch?v=baUl_HhZ9mQ')).toContain(
      'https://www.youtube.com/embed/baUl_HhZ9mQ',
    )
    expect(toEmbedUrl('https://youtu.be/0hWj6pX3cO8')).toContain(
      'https://www.youtube.com/embed/0hWj6pX3cO8',
    )
    expect(toEmbedUrl('https://vimeo.com/123456789')).toContain(
      'https://player.vimeo.com/video/123456789',
    )
    expect(toEmbedUrl('https://exemplo.com/embed/custom')).toBe(
      'https://exemplo.com/embed/custom',
    )
    expect(toEmbedUrl('')).toBe('')
  })

  it('listarCursos retorna os cursos padrão da ILPI se vazio', async () => {
    const cursos = await TreinamentosService.listarCursos()
    expect(cursos.length).toBeGreaterThanOrEqual(4)
    expect(cursos[0].id).toBe(CURSOS_PADRAO_ILPI[0].id)
    expect(cursos[0].perguntasQuiz.length).toBeGreaterThan(0)
  })

  it('salvarCurso adiciona e persiste um novo treinamento no catálogo', async () => {
    const novo = await TreinamentosService.salvarCurso({
      titulo: 'Prevenção de Broncoaspiração na Refeição',
      categoria: 'clinico',
      duracaoEstimada: '30 min',
      videoUrl: 'https://www.youtube.com/watch?v=12345678901',
      perguntasQuiz: [
        {
          id: 'q1',
          enunciado: 'Qual a posição recomendada do residente durante a dieta por VO?',
          opcoes: [
            { id: 'a', texto: 'Totalmente deitado (0 grau)' },
            { id: 'b', texto: 'Sentado ou com cabeceira elevada a 90 graus' },
          ],
          opcaoCorretaId: 'b',
        },
      ],
    })

    expect(novo.id).toBeDefined()
    expect(novo.titulo).toBe('Prevenção de Broncoaspiração na Refeição')

    const todos = await TreinamentosService.listarCursos()
    expect(todos.some((c) => c.titulo === 'Prevenção de Broncoaspiração na Refeição')).toBe(true)
  })

  it('atribuirTreinamento cria uma atribuição individual com prazo correto', async () => {
    const curso = CURSOS_PADRAO_ILPI[0]
    const atrib = await TreinamentosService.atribuirTreinamento({
      curso,
      profissionalId: 'p-123',
      profissionalNome: 'Joana da Silva',
      profissionalCat: 'cuid',
      prazo: '2026-12-31',
    })

    expect(atrib.id).toBeDefined()
    expect(atrib.profissionalNome).toBe('Joana da Silva')
    expect(atrib.status).toBe('pendente')

    const lista = await TreinamentosService.listarAtribuicoes('p-123')
    expect(lista.length).toBe(1)
    expect(lista[0].id).toBe(atrib.id)
  })

  it('atribuirEmLote atribui o treinamento para múltiplos profissionais', async () => {
    const curso = CURSOS_PADRAO_ILPI[1]
    const profs = [
      { id: 'p-1', nome: 'Ana', cat: 'cuid' },
      { id: 'p-2', nome: 'Beto', cat: 'cuid' },
    ]

    const total = await TreinamentosService.atribuirEmLote(curso, profs, '2026-12-31')
    expect(total).toBe(2)

    const todos = await TreinamentosService.listarAtribuicoes()
    expect(todos.some((a) => a.profissionalId === 'p-1')).toBe(true)
    expect(todos.some((a) => a.profissionalId === 'p-2')).toBe(true)
  })

  it('concluirTreinamento avalia o quiz e aprova quando a nota atinge o corte', async () => {
    const curso = CURSOS_PADRAO_ILPI[0] // 3 perguntas, corte 70
    const atrib = await TreinamentosService.atribuirTreinamento({
      curso,
      profissionalId: 'p-aluno',
      profissionalNome: 'Lucas',
      profissionalCat: 'tec',
      prazo: '2026-12-31',
    })

    // Respostas 100% corretas
    const respostasCorretas = {
      q1: 'b',
      q2: 'c',
      q3: 'b',
    }

    const resultado = await TreinamentosService.concluirTreinamento(
      atrib.id,
      respostasCorretas,
      atrib,
    )

    expect(resultado.aprovado).toBe(true)
    expect(resultado.nota).toBe(100)
    expect(resultado.acertos).toBe(3)

    const atualizadas = await TreinamentosService.listarAtribuicoes('p-aluno')
    expect(atualizadas[0].status).toBe('concluido')
    expect(atualizadas[0].notaObtida).toBe(100)
  })

  it('concluirTreinamento reprova quando a nota fica abaixo da nota de corte', async () => {
    const curso = CURSOS_PADRAO_ILPI[0]
    const atrib = await TreinamentosService.atribuirTreinamento({
      curso,
      profissionalId: 'p-reprova',
      profissionalNome: 'Carlos',
      profissionalCat: 'cuid',
      prazo: '2026-12-31',
    })

    // Respostas erradas
    const respostasErradas = {
      q1: 'a',
      q2: 'a',
      q3: 'a',
    }

    const resultado = await TreinamentosService.concluirTreinamento(
      atrib.id,
      respostasErradas,
      atrib,
    )

    expect(resultado.aprovado).toBe(false)
    expect(resultado.nota).toBe(0)

    const atualizadas = await TreinamentosService.listarAtribuicoes('p-reprova')
    expect(atualizadas[0].status).toBe('pendente')
  })

  it('obterMetricas calcula os totais e a taxa de conformidade', () => {
    const atribuicoes: any[] = [
      { id: '1', status: 'concluido', profissionalId: 'p1' },
      { id: '2', status: 'concluido', profissionalId: 'p2' },
      { id: '3', status: 'pendente', profissionalId: 'p3' },
      { id: '4', status: 'atrasado', profissionalId: 'p1' },
    ]

    const metricas = TreinamentosService.obterMetricas(atribuicoes)
    expect(metricas.totalAtribuicoes).toBe(4)
    expect(metricas.concluidos).toBe(2)
    expect(metricas.pendentes).toBe(1)
    expect(metricas.atrasados).toBe(1)
    expect(metricas.taxaConclusao).toBe(50)
    expect(metricas.colaboradoresEngajados).toBe(3)
  })
})
