import { describe, it, expect } from 'vitest'
import {
  totalEsc,
  classifEscala,
  ultAval,
  grau,
} from '../../lib/business/escalas'
import type { Residente } from '../../types/ilpi'

describe('Clinical Scales (Fugulin, Morse, Braden, Glasgow, MNA)', () => {
  describe('Fugulin Scale', () => {
    it('calcula pontuação mínima (Grau 1 - Independente)', () => {
      // 9 itens com resposta 0 (peso 1 cada) = 9 pontos
      const resp = [0, 0, 0, 0, 0, 0, 0, 0, 0]
      const total = totalEsc('fugulin', resp)
      expect(total).toBe(9)
      const res = classifEscala('fugulin', total)
      expect(res.grau).toBe(1)
      expect(res.nivel).toBe('ok')
      expect(res.txt).toBe('Grau 1 de dependência')
    })

    it('classifica Grau 2 (Semidependente)', () => {
      const total = 18
      const res = classifEscala('fugulin', total)
      expect(res.grau).toBe(2)
      expect(res.nivel).toBe('warn')
      expect(res.txt).toBe('Grau 2 de dependência')
    })

    it('classifica Grau 3 (Dependência Total)', () => {
      // 9 itens com resposta 3 (peso 4 cada) = 36 pontos
      const resp = [3, 3, 3, 3, 3, 3, 3, 3, 3]
      const total = totalEsc('fugulin', resp)
      expect(total).toBe(36)
      const res = classifEscala('fugulin', total)
      expect(res.grau).toBe(3)
      expect(res.nivel).toBe('danger')
      expect(res.txt).toBe('Grau 3 de dependência')
    })
  })

  describe('Morse Scale (Risco de Queda)', () => {
    it('classifica Sem Risco (<= 24)', () => {
      const resp = [0, 0, 0, 0, 0, 0]
      const total = totalEsc('morse', resp)
      expect(total).toBe(0)
      const res = classifEscala('morse', total)
      expect(res.nivel).toBe('ok')
      expect(res.txt).toBe('Sem risco de queda')
    })

    it('classifica Baixo Risco (25 a 50)', () => {
      const total = 35
      const res = classifEscala('morse', total)
      expect(res.nivel).toBe('warn')
      expect(res.txt).toBe('Baixo risco de queda')
    })

    it('classifica Alto Risco (> 50)', () => {
      const resp = [1, 1, 2, 1, 2, 1] // [25, 15, 30, 20, 20, 15] = 125
      const total = totalEsc('morse', resp)
      expect(total).toBe(125)
      const res = classifEscala('morse', total)
      expect(res.nivel).toBe('danger')
      expect(res.txt).toBe('Alto risco de queda')
    })
  })

  describe('Braden Scale (Risco de LPP)', () => {
    it('classifica Sem Risco (> 18)', () => {
      const resp = [3, 3, 3, 3, 3, 2] // [4, 4, 4, 4, 4, 3] = 23
      const total = totalEsc('braden', resp)
      expect(total).toBe(23)
      const res = classifEscala('braden', total)
      expect(res.nivel).toBe('ok')
      expect(res.txt).toBe('Sem risco')
    })

    it('classifica Risco Baixo e Moderado (13 a 18)', () => {
      const res1 = classifEscala('braden', 16)
      expect(res1.nivel).toBe('warn')
      expect(res1.txt).toBe('Risco baixo')

      const res2 = classifEscala('braden', 13)
      expect(res2.nivel).toBe('warn')
      expect(res2.txt).toBe('Risco moderado')
    })

    it('classifica Risco Alto e Muito Alto (<= 12)', () => {
      const resAlto = classifEscala('braden', 11)
      expect(resAlto.nivel).toBe('danger')
      expect(resAlto.txt).toBe('Risco alto')

      const resMuitoAlto = classifEscala('braden', 8)
      expect(resMuitoAlto.nivel).toBe('danger')
      expect(resMuitoAlto.txt).toBe('Risco muito alto')
    })
  })

  describe('Glasgow Scale (Nível de Consciência)', () => {
    it('classifica Sem Alteração (15)', () => {
      const resp = [0, 0, 0] // [4, 5, 6] = 15
      const total = totalEsc('glasgow', resp)
      expect(total).toBe(15)
      const res = classifEscala('glasgow', total)
      expect(res.nivel).toBe('ok')
      expect(res.txt).toBe('Sem alteração')
    })

    it('classifica Alteração Leve (13-14)', () => {
      const res = classifEscala('glasgow', 14)
      expect(res.nivel).toBe('warn')
      expect(res.txt).toBe('Alteração leve')
    })

    it('classifica Alteração Moderada (9-12) e Grave (< 9)', () => {
      const resMod = classifEscala('glasgow', 10)
      expect(resMod.nivel).toBe('danger')
      expect(resMod.txt).toBe('Alteração moderada')

      const resGrav = classifEscala('glasgow', 7)
      expect(resGrav.nivel).toBe('danger')
      expect(resGrav.txt).toBe('Alteração grave')
    })
  })

  describe('MNA Scale (Triagem Nutricional)', () => {
    it('classifica Estado Nutricional Normal (>= 12)', () => {
      const res = classifEscala('mna', 14)
      expect(res.nivel).toBe('ok')
      expect(res.txt).toBe('Estado nutricional normal')
    })

    it('classifica Risco de Desnutrição (8 a 11)', () => {
      const res = classifEscala('mna', 10)
      expect(res.nivel).toBe('warn')
      expect(res.txt).toBe('Risco de desnutrição')
    })

    it('classifica Desnutrição (< 8)', () => {
      const res = classifEscala('mna', 5)
      expect(res.nivel).toBe('danger')
      expect(res.txt).toBe('Desnutrição')
    })
  })

  describe('ultAval e grau helpers', () => {
    const mockResidente: Residente = {
      id: 'r1',
      nome: 'Dona Maria',
      sexo: 'F',
      quarto: '101',
      status: 'ativo',
      admissao: '2026-01-01',
      aval: [
        {
          id: 'a1',
          esc: 'fugulin',
          d: '2026-10-01',
          resp: [0, 0, 0, 0, 0, 0, 0, 0, 0], // total 9 -> grau 1
          sig: { id: 's1', d: '2026-10-01', h: '08:00' },
        },
        {
          id: 'a2',
          esc: 'fugulin',
          d: '2026-11-10',
          resp: [2, 2, 2, 2, 2, 2, 2, 2, 2], // total 27 -> grau 3
          sig: { id: 's1', d: '2026-11-10', h: '09:00' },
        },
      ],
      estoque: [],
      presc: [],
      pia: [],
      cuidados: [],
      anot: [],
      evol: [],
    }

    it('ultAval retorna a avaliação mais recente pela data', () => {
      const maisRecente = ultAval(mockResidente, 'fugulin')
      expect(maisRecente?.id).toBe('a2')
      expect(maisRecente?.d).toBe('2026-11-10')
    })

    it('grau retorna o grau Fugulin da avaliação mais recente', () => {
      const g = grau(mockResidente)
      expect(g).toBe(3)
    })

    it('grau retorna null se o residente não tiver avaliação Fugulin ou Katz', () => {
      const semAval: Residente = { ...mockResidente, aval: [] }
      expect(grau(semAval)).toBeNull()
    })

    it('grau calcula a partir de Katz quando a preferência é katz ou quando não há Fugulin', () => {
      const resKatz: Residente = {
        ...mockResidente,
        aval: [
          {
            id: 'k1',
            esc: 'katz',
            d: '2026-11-12',
            resp: [0, 0, 0, 0, 0, 0], // todas independentes (peso 1 cada) = 6 pts -> Grau 1
            sig: { id: 's1', d: '2026-11-12', h: '10:00' },
          },
        ],
      }
      expect(grau(resKatz)).toBe(1)
      expect(grau(resKatz, 'katz')).toBe(1)

      // Com Fugulin e Katz juntos, respeita a preferência
      const resAmbos: Residente = {
        ...mockResidente,
        aval: [
          ...mockResidente.aval, // Fugulin mais recente a2 tem grau 3
          {
            id: 'k2',
            esc: 'katz',
            d: '2026-11-15',
            resp: [1, 1, 0, 0, 0, 0], // 2 dependentes, 4 independentes = 4 pts -> Grau 2
            sig: { id: 's1', d: '2026-11-15', h: '10:00' },
          },
        ],
      }
      // Padrão: prioriza Fugulin se existir
      expect(grau(resAmbos, 'fugulin')).toBe(3)
      // Se configurado Katz como dependência padrão (como em São Paulo):
      expect(grau(resAmbos, 'katz')).toBe(2)
    })

    it('totalEsc não crasha com índices fora dos limites ou valores brutos de pontos', () => {
      // Morse com valores de pontos brutos (25) em vez do índice (1)
      const respBruta = [25, 15, 30, 20, 20, 15]
      expect(() => totalEsc('morse', respBruta)).not.toThrow()
      expect(totalEsc('morse', respBruta)).toBe(125)

      // Índice completamente inexistente / inválido
      expect(totalEsc('morse', [999, 999])).toBe(0)
    })
  })

  describe('Katz Scale (ABVD - Atividades Básicas de Vida Diária)', () => {
    it('classifica Independência Total / Grau 1 (6 pontos)', () => {
      const resp = [0, 0, 0, 0, 0, 0] // 6 itens independentes (1 ponto cada)
      const total = totalEsc('katz', resp)
      expect(total).toBe(6)
      const res = classifEscala('katz', total)
      expect(res.grau).toBe(1)
      expect(res.nivel).toBe('ok')
      expect(res.txt).toContain('Grau 1')
    })

    it('classifica Dependência Moderada / Grau 2 (4 a 5 pontos)', () => {
      const res4 = classifEscala('katz', 4)
      expect(res4.grau).toBe(2)
      expect(res4.nivel).toBe('warn')
      expect(res4.txt).toContain('Grau 2')

      const res5 = classifEscala('katz', 5)
      expect(res5.grau).toBe(2)
      expect(res5.nivel).toBe('warn')
    })

    it('classifica Dependência Importante / Grau 3 (0 a 3 pontos)', () => {
      const resp = [1, 1, 1, 1, 1, 1] // dependente em todos (0 ponto cada)
      const total = totalEsc('katz', resp)
      expect(total).toBe(0)
      const res = classifEscala('katz', total)
      expect(res.grau).toBe(3)
      expect(res.nivel).toBe('danger')
      expect(res.txt).toContain('Grau 3')
    })
  })

  describe('Lawton & Brody Scale (AIVD - Atividades Instrumentais)', () => {
    it('classifica Independência (>= 21)', () => {
      const resp = [0, 0, 0, 0, 0, 0, 0, 0] // 8 itens independentes (3 pontos cada) = 24
      const total = totalEsc('lawton', resp)
      expect(total).toBe(24)
      const res = classifEscala('lawton', total)
      expect(res.nivel).toBe('ok')
      expect(res.txt).toContain('Independência')
    })

    it('classifica Dependência Parcial (14 a 20) e Importante (8 a 13)', () => {
      const resParcial = classifEscala('lawton', 17)
      expect(resParcial.nivel).toBe('warn')
      expect(resParcial.txt).toContain('parcial')

      const resImportante = classifEscala('lawton', 10)
      expect(resImportante.nivel).toBe('danger')
      expect(resImportante.txt).toContain('importante')
    })
  })

  describe('GDS-15 Scale (Depressão Geriátrica de Yesavage)', () => {
    it('classifica Normal / Sem depressão (0 a 5)', () => {
      const respNormal = new Array(15).fill(0) // todas respostas pontuação 0
      const total = totalEsc('gds15', respNormal)
      expect(total).toBe(0)
      const res = classifEscala('gds15', total)
      expect(res.nivel).toBe('ok')
      expect(res.txt).toContain('Normal')
    })

    it('classifica Suspeita Leve/Moderada (6 a 10) e Grave (11 a 15)', () => {
      const resMod = classifEscala('gds15', 8)
      expect(resMod.nivel).toBe('warn')
      expect(resMod.txt).toContain('leve a moderada')

      const resGrave = classifEscala('gds15', 13)
      expect(resGrave.nivel).toBe('danger')
      expect(resGrave.txt).toContain('graves')
    })
  })

  describe('MEEM Scale (Mini-Exame do Estado Mental)', () => {
    it('classifica Cognição Preservada (>= 24)', () => {
      const res = classifEscala('meem', 28)
      expect(res.nivel).toBe('ok')
      expect(res.txt).toContain('preservada')
    })

    it('classifica Declínio Leve a Moderado (18 a 23) e Grave (< 18)', () => {
      const resMod = classifEscala('meem', 20)
      expect(resMod.nivel).toBe('warn')
      expect(resMod.txt).toContain('leve a moderado')

      const resGrave = classifEscala('meem', 12)
      expect(resGrave.nivel).toBe('danger')
      expect(resGrave.txt).toContain('grave')
    })
  })

  describe('CDR Scale (Clinical Dementia Rating)', () => {
    it('classifica estágios de demência CDR 0 a CDR 3', () => {
      expect(classifEscala('cdr', 0).nivel).toBe('ok')
      expect(classifEscala('cdr', 0).txt).toContain('CDR 0')

      expect(classifEscala('cdr', 20).nivel).toBe('warn')
      expect(classifEscala('cdr', 20).txt).toContain('CDR 0.5')

      expect(classifEscala('cdr', 60).nivel).toBe('warn')
      expect(classifEscala('cdr', 60).txt).toContain('CDR 1')

      expect(classifEscala('cdr', 100).nivel).toBe('danger')
      expect(classifEscala('cdr', 100).txt).toContain('CDR 2')

      expect(classifEscala('cdr', 150).nivel).toBe('danger')
      expect(classifEscala('cdr', 150).txt).toContain('CDR 3')
    })
  })

  describe('OHAT Scale (Saúde Bucal / Odontologia)', () => {
    it('classifica Saúde Bucal Saudável (0-1), Leve (2-3) e Prioritária (>= 4)', () => {
      expect(classifEscala('ohat', 0).nivel).toBe('ok')
      expect(classifEscala('ohat', 2).nivel).toBe('warn')
      expect(classifEscala('ohat', 5).nivel).toBe('danger')
    })
  })

  describe('Escalas Customizadas / Dinâmicas', () => {
    const customScales = [
      {
        id: 'escala_aptidao',
        nome: 'Aptidão Física',
        desc: 'Teste de aptidão motora',
        categoria: 'personalizada' as const,
        itens: [
          ['Força de membros inferiores', [['Excelente', 3], ['Regular', 2], ['Ruim', 1]] as [string, number][]],
          ['Flexibilidade', [['Excelente', 3], ['Regular', 2], ['Ruim', 1]] as [string, number][]],
        ] as [string, [string, number][]][],
        faixas: [
          { min: 5, max: 6, txt: 'Alta aptidão', nivel: 'ok' as const },
          { min: 3, max: 4, txt: 'Média aptidão', nivel: 'warn' as const },
          { min: 0, max: 2, txt: 'Baixa aptidão', nivel: 'danger' as const },
        ],
        criadaEm: '2026-11-17',
      },
    ]

    it('calcula pontuação e classifica escala personalizada', () => {
      const resp = [0, 1] // [3, 2] = 5
      const total = totalEsc('escala_aptidao', resp, customScales)
      expect(total).toBe(5)
      const res = classifEscala('escala_aptidao', total, customScales)
      expect(res.nivel).toBe('ok')
      expect(res.txt).toBe('Alta aptidão')
    })
  })
})
