import { supabase } from '../supabase'
import type {
  AtribuicaoTreinamento,
  CursoTreinamento,
  MetricasTreinamentos,
} from '../../types/treinamentos'

const LOCAL_STORAGE_CURSOS_KEY = 'senecurare_treinamentos_cursos_v1'
const LOCAL_STORAGE_ATRIBUICOES_KEY = 'senecurare_treinamentos_atribuicoes_v1'

// Opera em modo local resiliente para evitar requisições 404 de rede enquanto a migration não for aplicada no Supabase
let tabelaCursosDisponivel = false
let tabelaAtribuicoesDisponivel = false

export function setSincronizacaoRemotaTreinamentos(habilitar: boolean) {
  tabelaCursosDisponivel = habilitar
  tabelaAtribuicoesDisponivel = habilitar
}

export const CURSOS_PADRAO_ILPI: CursoTreinamento[] = [
  {
    id: 'curso-higienizacao-maos',
    titulo: 'Higienização das Mãos e Controle de Infecções (RDC 502/ANVISA)',
    descricao:
      'Protocolos obrigatórios de higienização simples, antisséptica e fricção alcoólica para prevenção de infecções cruzadas na rotina de cuidados do idoso.',
    categoria: 'rdc502',
    duracaoEstimada: '40 min',
    videoUrl: 'https://www.youtube.com/watch?v=baUl_HhZ9mQ', // Anvisa higienização das mãos
    obrigatorio: true,
    notaCorte: 70,
    ativo: true,
    perguntasQuiz: [
      {
        id: 'q1',
        enunciado: 'Qual a duração mínima recomendada para a higienização das mãos com água e sabão?',
        opcoes: [
          { id: 'a', texto: '10 a 20 segundos' },
          { id: 'b', texto: '40 a 60 segundos' },
          { id: 'c', texto: '2 minutos' },
          { id: 'd', texto: 'Apenas quando as mãos estiverem visivelmente sujas' },
        ],
        opcaoCorretaId: 'b',
        explicacao: 'A ANVISA preconiza que a lavagem com água e sabão deve durar de 40 a 60 segundos para eficácia.',
      },
      {
        id: 'q2',
        enunciado: 'Em qual das seguintes situações a fricção com álcool a 70% NÃO substitui a lavagem com água e sabão?',
        opcoes: [
          { id: 'a', texto: 'Antes de tocar o residente' },
          { id: 'b', texto: 'Após aferir sinais vitais' },
          { id: 'c', texto: 'Quando houver sujidade visível ou contato com fluidos corporais' },
          { id: 'd', texto: 'Ao entrar no quarto do residente' },
        ],
        opcaoCorretaId: 'c',
        explicacao: 'Mãos visivelmente sujas ou expostas a sangue/secreções exigem água corrente e sabonete bactericida.',
      },
      {
        id: 'q3',
        enunciado: 'Segundo a RDC 502/2021, o uso de luvas de procedimento dispensa a higienização das mãos?',
        opcoes: [
          { id: 'a', texto: 'Sim, pois a luva cria uma barreira estéril impermeável' },
          { id: 'b', texto: 'Não, as mãos devem ser higienizadas antes de calçar e logo após retirar as luvas' },
          { id: 'c', texto: 'Apenas se as luvas forem trocadas a cada 4 horas' },
          { id: 'd', texto: 'Depende da preferência do cuidador' },
        ],
        opcaoCorretaId: 'b',
        explicacao: 'As luvas não são 100% impermeáveis a microrganismos e sua remoção pode contaminar as mãos.',
      },
    ],
  },
  {
    id: 'curso-prevencao-quedas',
    titulo: 'Prevenção de Quedas e Transferência Segura do Residente',
    descricao:
      'Identificação de fatores de risco intrínsecos e extrínsecos, aplicação da escala de Morse e técnicas ergonômicas de transferência leito-poltrona.',
    categoria: 'seguranca',
    duracaoEstimada: '50 min',
    videoUrl: 'https://www.youtube.com/watch?v=0hWj6pX3cO8',
    obrigatorio: true,
    notaCorte: 70,
    ativo: true,
    perguntasQuiz: [
      {
        id: 'q1',
        enunciado: 'Qual a conduta correta imediata diante de um residente que sofreu uma queda no quarto?',
        opcoes: [
          { id: 'a', texto: 'Levantá-lo rapidamente e colocá-lo na cama para evitar constrangimento' },
          { id: 'b', texto: 'Avaliar consciência, sinais vitais, dor e suspeita de fratura antes de movê-lo' },
          { id: 'c', texto: 'Dar água com açúcar e não relatar no prontuário' },
          { id: 'd', texto: 'Aguardar 24 horas para comunicar a enfermagem' },
        ],
        opcaoCorretaId: 'b',
        explicacao: 'Mover o idoso sem avaliação prévia pode agravar fraturas (ex: colo de fêmur) ou traumatismos cranianos.',
      },
      {
        id: 'q2',
        enunciado: 'Na transferência de um residente com hemiplegia (fraqueza de um lado), qual o lado que deve ser posicionado mais próximo à cadeira?',
        opcoes: [
          { id: 'a', texto: 'O lado afetado (mais fraco)' },
          { id: 'b', texto: 'O lado são (mais forte e preservado)' },
          { id: 'c', texto: 'Qualquer lado é indiferente' },
          { id: 'd', texto: 'Sempre pelas costas do idoso' },
        ],
        opcaoCorretaId: 'b',
        explicacao: 'O apoio principal na transferência deve ser no lado com maior força motora para conferir estabilidade.',
      },
      {
        id: 'q3',
        enunciado: 'Qual medida ambiental reduz drasticamente o risco de queda noturna na ILPI?',
        opcoes: [
          { id: 'a', texto: 'Manter luzes de vigília acessas, piso desobstruído e grades de leito elevadas conforme prescrição' },
          { id: 'b', texto: 'Trancar a porta do quarto à chave' },
          { id: 'c', texto: 'Retirar todos os apoios de mão dos corredores' },
          { id: 'd', texto: 'Restringir a ingestão de água às 15h' },
        ],
        opcaoCorretaId: 'a',
        explicacao: 'Iluminação indireta noturna e eliminação de tapetes soltos são essenciais para a segurança do idoso.',
      },
    ],
  },
  {
    id: 'curso-prevencao-lpp',
    titulo: 'Prevenção e Manejo de Lesões por Pressão (LPP)',
    descricao:
      'Estadiamento de lesões, hidratação cutânea, critérios da Escala de Braden e cronograma de mudança de decúbito de 2 em 2 horas.',
    categoria: 'clinico',
    duracaoEstimada: '45 min',
    videoUrl: 'https://www.youtube.com/watch?v=F3xO0mJgZ0M',
    obrigatorio: true,
    notaCorte: 70,
    ativo: true,
    perguntasQuiz: [
      {
        id: 'q1',
        enunciado: 'Qual o intervalo padrão máximo recomendado para mudança de decúbito em residentes acamados de alto risco?',
        opcoes: [
          { id: 'a', texto: 'A cada 6 horas' },
          { id: 'b', texto: 'A cada 2 horas' },
          { id: 'c', texto: 'Apenas uma vez ao dia durante o banho' },
          { id: 'd', texto: 'A cada 12 horas' },
        ],
        opcaoCorretaId: 'b',
        explicacao: 'A alternância de decúbito a cada 2 horas descomprime os capilares sanguíneos prevenindo a isquemia tissular.',
      },
      {
        id: 'q2',
        enunciado: 'Em qual estágio de LPP há hiperemia (vermelhidão) que não embranquece, com a pele ainda intacta?',
        opcoes: [
          { id: 'a', texto: 'Estágio 1' },
          { id: 'b', texto: 'Estágio 2' },
          { id: 'c', texto: 'Estágio 3' },
          { id: 'd', texto: 'Não classificável' },
        ],
        opcaoCorretaId: 'a',
        explicacao: 'O Estágio 1 é caracterizado por eritema que não embranquece em pele íntegra sobre proeminência óssea.',
      },
      {
        id: 'q3',
        enunciado: 'Sobre o uso de massagem em proeminências ósseas hiperemiadas:',
        opcoes: [
          { id: 'a', texto: 'É altamente recomendada com força moderada' },
          { id: 'b', texto: 'É contraindicada, pois causa lesão nos capilares e acelera a necrose' },
          { id: 'c', texto: 'Deve ser feita apenas com álcool' },
          { id: 'd', texto: 'Substitui a mudança de posição' },
        ],
        opcaoCorretaId: 'b',
        explicacao: 'Nunca massageie áreas avermelhadas com hiperemia: a pressão cisalhante rompe a microcirculação fragilizada.',
      },
    ],
  },
  {
    id: 'curso-demencias-humanizacao',
    titulo: 'Manejo de Demências, Sintomas Comportamentais e Cuidado Humanizado',
    descricao:
      'Abordagem compassiva do Alzheimer e outras demências: técnicas de validação, desescalonamento de agitação psicomotora e preservação da dignidade.',
    categoria: 'cuidados',
    duracaoEstimada: '35 min',
    videoUrl: 'https://www.youtube.com/watch?v=0hWj6pX3cO8',
    obrigatorio: false,
    notaCorte: 70,
    ativo: true,
    perguntasQuiz: [
      {
        id: 'q1',
        enunciado: 'Ao lidar com um residente com Alzheimer que insiste que "precisa ir buscar seus filhos pequenos na escola", qual a melhor conduta?',
        opcoes: [
          { id: 'a', texto: 'Confrontar energicamente dizendo que ele tem 85 anos e os filhos já são idosos' },
          { id: 'b', texto: 'Acolher a emoção com calma (Terapia de Validação), perguntar sobre os filhos e redirecionar a atenção com carinho' },
          { id: 'c', texto: 'Ignorar e trancar o residente no quarto' },
          { id: 'd', texto: 'Pedir contenção mecânica imediata' },
        ],
        opcaoCorretaId: 'b',
        explicacao: 'Validar a emoção e redirecionar reduz a angústia sem gerar pânico ou agressividade no idoso desorientado.',
      },
      {
        id: 'q2',
        enunciado: 'Qual postura corporal do cuidador transmite maior segurança durante episódios de agitação?',
        opcoes: [
          { id: 'a', texto: 'Ficar de pé acima do idoso com braços cruzados' },
          { id: 'b', texto: 'Manter contato visual no mesmo nível dos olhos, falar em tom suave e manter distância de segurança sem encurralar' },
          { id: 'c', texto: 'Falar gritando para que ele escute com clareza' },
          { id: 'd', texto: 'Fugir do ambiente sem prestar assistência' },
        ],
        opcaoCorretaId: 'b',
        explicacao: 'Ficar na mesma altura e usar tom de voz suave diminui a sensação de ameaça sentida pelo idoso.',
      },
    ],
  },
]

export const TreinamentosService = {
  /**
   * Retorna os cursos cadastrados (Supabase com fallback para LocalStorage/seed)
   */
  async listarCursos(): Promise<CursoTreinamento[]> {
    if (tabelaCursosDisponivel) {
      try {
        const { data, error } = await supabase
          .from('treinamentos_cursos')
          .select('*')
          .eq('ativo', true)
          .order('criado_em', { ascending: false })

        if (error) {
          if (
            error.code === 'PGRST204' ||
            error.code === 'PGRST200' ||
            error.code === '42P01' ||
            error.message?.includes('does not exist') ||
            (error as any).status === 404
          ) {
            tabelaCursosDisponivel = false
          }
        } else if (data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            titulo: row.titulo,
            descricao: row.descricao || '',
            categoria: row.categoria,
            duracaoEstimada: row.duracao_estimada || '45 min',
            videoUrl: row.video_url || '',
            obrigatorio: row.obrigatorio ?? true,
            notaCorte: row.nota_corte ?? 70,
            perguntasQuiz: row.perguntas_quiz || [],
            ativo: row.ativo ?? true,
            criadoEm: row.criado_em,
            atualizadoEm: row.atualizado_em,
          }))
        }
      } catch {
        tabelaCursosDisponivel = false
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_CURSOS_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        }
        // Salva os cursos padrão no localStorage
        localStorage.setItem(LOCAL_STORAGE_CURSOS_KEY, JSON.stringify(CURSOS_PADRAO_ILPI))
      } catch {}
    }

    return CURSOS_PADRAO_ILPI
  },

  /**
   * Salva ou atualiza um curso no catálogo
   */
  async salvarCurso(curso: Partial<CursoTreinamento> & { titulo: string }): Promise<CursoTreinamento> {
    const agora = new Date().toISOString()
    const id = curso.id || `curso-${Date.now()}`

    const novoCurso: CursoTreinamento = {
      id,
      titulo: curso.titulo,
      descricao: curso.descricao || '',
      categoria: curso.categoria || 'rdc502',
      duracaoEstimada: curso.duracaoEstimada || '45 min',
      videoUrl: curso.videoUrl || '',
      obrigatorio: curso.obrigatorio ?? true,
      notaCorte: curso.notaCorte ?? 70,
      perguntasQuiz: curso.perguntasQuiz || [],
      ativo: curso.ativo ?? true,
      criadoEm: curso.criadoEm || agora,
      atualizadoEm: agora,
    }

    if (tabelaCursosDisponivel) {
      try {
        await supabase.from('treinamentos_cursos').upsert({
          id: novoCurso.id,
          titulo: novoCurso.titulo,
          descricao: novoCurso.descricao,
          categoria: novoCurso.categoria,
          duracao_estimada: novoCurso.duracaoEstimada,
          video_url: novoCurso.videoUrl,
          obrigatorio: novoCurso.obrigatorio,
          nota_corte: novoCurso.notaCorte,
          perguntas_quiz: novoCurso.perguntasQuiz,
          ativo: novoCurso.ativo,
          atualizado_em: agora,
        })
      } catch {
        tabelaCursosDisponivel = false
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const cursos = await this.listarCursos()
        const index = cursos.findIndex((c) => c.id === id)
        let atualizados: CursoTreinamento[]
        if (index >= 0) {
          atualizados = [...cursos]
          atualizados[index] = novoCurso
        } else {
          atualizados = [novoCurso, ...cursos]
        }
        localStorage.setItem(LOCAL_STORAGE_CURSOS_KEY, JSON.stringify(atualizados))
      } catch {}
    }

    return novoCurso
  },

  /**
   * Remove/desativa um curso
   */
  async deletarCurso(cursoId: string): Promise<void> {
    try {
      await supabase.from('treinamentos_cursos').update({ ativo: false }).eq('id', cursoId)
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        const cursos = await this.listarCursos()
        const filtrados = cursos.filter((c) => c.id !== cursoId)
        localStorage.setItem(LOCAL_STORAGE_CURSOS_KEY, JSON.stringify(filtrados))
      } catch {}
    }
  },

  /**
   * Lista atribuições de treinamentos (filtradas por profissional ou todas)
   */
  async listarAtribuicoes(profissionalId?: string): Promise<AtribuicaoTreinamento[]> {
    if (tabelaAtribuicoesDisponivel) {
      try {
        let query = supabase
          .from('treinamentos_atribuicoes')
          .select('*')
          .order('prazo', { ascending: true })

        if (profissionalId) {
          query = query.eq('profissional_id', profissionalId)
        }

        const { data, error } = await query
        if (error) {
          if (
            error.code === 'PGRST204' ||
            error.code === 'PGRST200' ||
            error.code === '42P01' ||
            error.message?.includes('does not exist') ||
            (error as any).status === 404
          ) {
            tabelaAtribuicoesDisponivel = false
          }
        } else if (data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            cursoId: row.curso_id,
            cursoTitulo: row.curso_titulo,
            cursoCategoria: row.curso_categoria,
            duracaoEstimada: row.duracao_estimada,
            videoUrl: row.video_url,
            perguntasQuiz: row.perguntas_quiz || [],
            notaCorte: row.nota_corte ?? 70,
            profissionalId: row.profissional_id,
            profissionalNome: row.profissional_nome,
            profissionalCpf: row.profissional_cpf,
            profissionalCat: row.profissional_cat,
            prazo: row.prazo,
            status: this.calcularStatus(row.status, row.prazo),
            concluidoEm: row.concluido_em,
            notaObtida: row.nota_obtida,
            respostasQuiz: row.respostas_quiz,
          }))
        }
      } catch {
        tabelaAtribuicoesDisponivel = false
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_ATRIBUICOES_KEY)
        let lista: AtribuicaoTreinamento[] = []
        if (raw) {
          lista = JSON.parse(raw)
        } else {
          // Seed inicial de atribuições de demonstração
          lista = this.gerarAtribuicoesIniciais()
          localStorage.setItem(LOCAL_STORAGE_ATRIBUICOES_KEY, JSON.stringify(lista))
        }

        // Recalcula status com base no prazo atual
        const recalculadas = lista.map((a) => ({
          ...a,
          status: this.calcularStatus(a.status, a.prazo),
        }))

        if (profissionalId) {
          return recalculadas.filter((a) => a.profissionalId === profissionalId)
        }
        return recalculadas
      } catch {}
    }

    return []
  },

  /**
   * Atribui um treinamento a um profissional
   */
  async atribuirTreinamento(params: {
    curso: CursoTreinamento
    profissionalId: string
    profissionalNome: string
    profissionalCat: string
    profissionalCpf?: string
    prazo: string
  }): Promise<AtribuicaoTreinamento> {
    const { curso, profissionalId, profissionalNome, profissionalCat, profissionalCpf, prazo } = params
    const id = `atrib-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    const atribuicao: AtribuicaoTreinamento = {
      id,
      cursoId: curso.id,
      cursoTitulo: curso.titulo,
      cursoCategoria: curso.categoria,
      duracaoEstimada: curso.duracaoEstimada,
      videoUrl: curso.videoUrl,
      perguntasQuiz: curso.perguntasQuiz,
      notaCorte: curso.notaCorte,
      profissionalId,
      profissionalNome,
      profissionalCpf,
      profissionalCat,
      prazo,
      status: this.calcularStatus('pendente', prazo),
    }

    try {
      await supabase.from('treinamentos_atribuicoes').insert({
        id: atribuicao.id,
        curso_id: atribuicao.cursoId,
        curso_titulo: atribuicao.cursoTitulo,
        curso_categoria: atribuicao.cursoCategoria,
        duracao_estimada: atribuicao.duracaoEstimada,
        video_url: atribuicao.videoUrl,
        perguntas_quiz: atribuicao.perguntasQuiz,
        nota_corte: atribuicao.notaCorte,
        profissional_id: atribuicao.profissionalId,
        profissional_nome: atribuicao.profissionalNome,
        profissional_cpf: atribuicao.profissionalCpf,
        profissional_cat: atribuicao.profissionalCat,
        prazo: atribuicao.prazo,
        status: atribuicao.status,
      })
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        const todas = await this.listarAtribuicoes()
        const atualizadas = [atribuicao, ...todas]
        localStorage.setItem(LOCAL_STORAGE_ATRIBUICOES_KEY, JSON.stringify(atualizadas))
      } catch {}
    }

    return atribuicao
  },

  /**
   * Atribui em lote para uma lista de colaboradores
   */
  async atribuirEmLote(
    curso: CursoTreinamento,
    profissionais: { id: string; nome: string; cat: string; cpf?: string }[],
    prazo: string,
  ): Promise<number> {
    let count = 0
    for (const p of profissionais) {
      await this.atribuirTreinamento({
        curso,
        profissionalId: p.id,
        profissionalNome: p.nome,
        profissionalCat: p.cat,
        profissionalCpf: p.cpf,
        prazo,
      })
      count++
    }
    return count
  },

  /**
   * Conclui um treinamento registrando o resultado do quiz
   */
  async concluirTreinamento(
    atribuicaoId: string,
    respostas: Record<string, string>,
    atribuicaoAtual: AtribuicaoTreinamento,
  ): Promise<{ aprovado: boolean; nota: number; acertos: number; total: number }> {
    const perguntas = atribuicaoAtual.perguntasQuiz || []
    let acertos = 0

    perguntas.forEach((p) => {
      if (respostas[p.id] === p.opcaoCorretaId) {
        acertos++
      }
    })

    const total = perguntas.length
    const nota = total > 0 ? Math.round((acertos / total) * 100) : 100
    const aprovado = nota >= (atribuicaoAtual.notaCorte || 70)

    if (aprovado) {
      const agora = new Date().toISOString()
      const camposAtualizados = {
        status: 'concluido' as const,
        concluidoEm: agora,
        notaObtida: nota,
        respostasQuiz: respostas,
      }

      try {
        await supabase
          .from('treinamentos_atribuicoes')
          .update({
            status: 'concluido',
            concluido_em: agora,
            nota_obtida: nota,
            respostas_quiz: respostas,
          })
          .eq('id', atribuicaoId)
      } catch {}

      if (typeof window !== 'undefined') {
        try {
          const todas = await this.listarAtribuicoes()
          const index = todas.findIndex((a) => a.id === atribuicaoId)
          if (index >= 0) {
            todas[index] = { ...todas[index], ...camposAtualizados }
            localStorage.setItem(LOCAL_STORAGE_ATRIBUICOES_KEY, JSON.stringify(todas))
          }
        } catch {}
      }
    }

    return { aprovado, nota, acertos, total }
  },

  /**
   * Calcula as métricas consolidadas
   */
  obterMetricas(atribuicoes: AtribuicaoTreinamento[]): MetricasTreinamentos {
    const total = atribuicoes.length
    const concluidos = atribuicoes.filter((a) => a.status === 'concluido').length
    const pendentes = atribuicoes.filter((a) => a.status === 'pendente').length
    const atrasados = atribuicoes.filter((a) => a.status === 'atrasado').length
    const taxa = total > 0 ? Math.round((concluidos / total) * 100) : 100

    const colaboradoresUnicos = new Set(atribuicoes.map((a) => a.profissionalId)).size

    return {
      totalAtribuicoes: total,
      pendentes,
      atrasados,
      concluidos,
      taxaConclusao: taxa,
      totalCursos: CURSOS_PADRAO_ILPI.length,
      colaboradoresEngajados: colaboradoresUnicos,
    }
  },

  /**
   * Determina se uma atribuição está em dia ou atrasada
   */
  calcularStatus(statusOriginal: string, prazoStr: string): 'pendente' | 'atrasado' | 'concluido' {
    if (statusOriginal === 'concluido') return 'concluido'
    if (!prazoStr) return 'pendente'

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const prazo = new Date(prazoStr)
    prazo.setHours(23, 59, 59, 999)

    if (hoje > prazo) return 'atrasado'
    return 'pendente'
  },

  /**
   * Gera uma semente inicial para demonstração
   */
  gerarAtribuicoesIniciais(): AtribuicaoTreinamento[] {
    const c1 = CURSOS_PADRAO_ILPI[0]
    const c2 = CURSOS_PADRAO_ILPI[1]
    const c3 = CURSOS_PADRAO_ILPI[2]

    const hoje = new Date()
    const prazoFrente = new Date(hoje.getTime() + 15 * 86400000).toISOString().slice(0, 10)
    const prazoVencido = new Date(hoje.getTime() - 3 * 86400000).toISOString().slice(0, 10)
    const concluidoPassado = new Date(hoje.getTime() - 10 * 86400000).toISOString()

    return [
      {
        id: 'seed-atrib-1',
        cursoId: c1.id,
        cursoTitulo: c1.titulo,
        cursoCategoria: c1.categoria,
        duracaoEstimada: c1.duracaoEstimada,
        videoUrl: c1.videoUrl,
        perguntasQuiz: c1.perguntasQuiz,
        notaCorte: c1.notaCorte,
        profissionalId: 'p-cuid1',
        profissionalNome: 'Maria Clara dos Santos',
        profissionalCpf: '123.456.789-00',
        profissionalCat: 'cuid',
        prazo: prazoFrente,
        status: 'concluido',
        concluidoEm: concluidoPassado,
        notaObtida: 100,
      },
      {
        id: 'seed-atrib-2',
        cursoId: c2.id,
        cursoTitulo: c2.titulo,
        cursoCategoria: c2.categoria,
        duracaoEstimada: c2.duracaoEstimada,
        videoUrl: c2.videoUrl,
        perguntasQuiz: c2.perguntasQuiz,
        notaCorte: c2.notaCorte,
        profissionalId: 'p-cuid1',
        profissionalNome: 'Maria Clara dos Santos',
        profissionalCpf: '123.456.789-00',
        profissionalCat: 'cuid',
        prazo: prazoFrente,
        status: 'pendente',
      },
      {
        id: 'seed-atrib-3',
        cursoId: c3.id,
        cursoTitulo: c3.titulo,
        cursoCategoria: c3.categoria,
        duracaoEstimada: c3.duracaoEstimada,
        videoUrl: c3.videoUrl,
        perguntasQuiz: c3.perguntasQuiz,
        notaCorte: c3.notaCorte,
        profissionalId: 'p-tec1',
        profissionalNome: 'Carlos Eduardo Oliveira',
        profissionalCpf: '987.654.321-11',
        profissionalCat: 'tec',
        prazo: prazoVencido,
        status: 'atrasado',
      },
    ]
  },
}
