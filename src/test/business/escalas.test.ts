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

    it('grau retorna null se o residente não tiver avaliação Fugulin', () => {
      const semAval: Residente = { ...mockResidente, aval: [] }
      expect(grau(semAval)).toBeNull()
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
})
