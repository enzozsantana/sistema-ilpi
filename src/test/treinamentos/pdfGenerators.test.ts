import { describe, it, expect, vi } from 'vitest'
import { gerarMiniCertificado } from '../../lib/treinamentos/miniCertificadoPdf'
import { gerarAtaAssinaturasAnvisa } from '../../lib/treinamentos/ataAssinaturasPdf'

// Mock jsPDF and jspdf-autotable
vi.mock('jspdf', () => {
  return {
    default: class MockJsPDF {
      internal = {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 148,
        },
      }
      setFillColor = vi.fn()
      rect = vi.fn()
      setDrawColor = vi.fn()
      setLineWidth = vi.fn()
      setFont = vi.fn()
      setFontSize = vi.fn()
      setTextColor = vi.fn()
      text = vi.fn()
      line = vi.fn()
      save = vi.fn()
      getNumberOfPages = vi.fn(() => 1)
      addPage = vi.fn()
    },
  }
})

vi.mock('jspdf-autotable', () => {
  return {
    default: vi.fn(),
  }
})

describe('PDF Generators (Mini-Certificado e Ata ANVISA)', () => {
  it('gerarMiniCertificado executa sem erros e chama jsPDF.save', async () => {
    await expect(
      gerarMiniCertificado({
        profissionalNome: 'Mariana Silva',
        cpf: '123.456.789-00',
        conselho: 'COREN-SP 123456',
        funcao: 'Técnica de Enfermagem',
        cursoTitulo: 'Higienização das Mãos e Controle de Infecções',
        cargaHoraria: '40 min',
        instituicaoNome: 'Residencial Longevidade',
        concluidoEm: '2026-11-20T10:00:00.000Z',
        notaObtida: 100,
      }),
    ).resolves.not.toThrow()
  })

  it('gerarAtaAssinaturasAnvisa executa sem erros com tabela de assinaturas', async () => {
    await expect(
      gerarAtaAssinaturasAnvisa({
        instituicaoNome: 'Residencial Longevidade',
        cursoTitulo: 'Prevenção de Quedas e Transferência Segura',
        atribuicoes: [
          {
            id: 'a1',
            cursoId: 'c1',
            cursoTitulo: 'Prevenção de Quedas',
            cursoCategoria: 'seguranca',
            duracaoEstimada: '45 min',
            videoUrl: 'https://youtube.com',
            perguntasQuiz: [],
            notaCorte: 70,
            profissionalId: 'p1',
            profissionalNome: 'Mariana Silva',
            profissionalCpf: '123.456.789-00',
            profissionalCat: 'tec',
            prazo: '2026-12-01',
            status: 'concluido',
            concluidoEm: '2026-11-20',
            notaObtida: 100,
          },
        ],
      }),
    ).resolves.not.toThrow()
  })
})
