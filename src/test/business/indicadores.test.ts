import { describe, it, expect } from 'vitest'
import {
  calcInd,
  dimensionamento,
  ativos,
  codigoHoje,
  variacaoPeso,
} from '../../lib/business/indicadores'
import type {
  EscalaMes,
  EventoVigilancia,
  Profissional,
  Residente,
} from '../../types/ilpi'

describe('ANVISA RDC 502 Indicadores & Dimensionamento', () => {
  const mockRes1: Residente = {
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
        d: '2026-11-01',
        resp: [0, 0, 0, 0, 0, 0, 0, 0, 0], // total 9 -> Grau 1
        sig: { id: 's1', d: '2026-11-01', h: '08:00' },
      },
    ],
    estoque: [],
    presc: [],
    pia: [],
    cuidados: [],
    anot: [],
    evol: [],
  }

  const mockRes2: Residente = {
    id: 'r2',
    nome: 'Seu José',
    sexo: 'M',
    quarto: '102',
    status: 'ativo',
    admissao: '2026-02-01',
    aval: [
      {
        id: 'a2',
        esc: 'fugulin',
        d: '2026-11-01',
        resp: [1, 1, 1, 1, 1, 1, 1, 1, 1], // total 18 -> Grau 2
        sig: { id: 's1', d: '2026-11-01', h: '08:00' },
      },
    ],
    estoque: [],
    presc: [],
    pia: [],
    cuidados: [],
    anot: [],
    evol: [],
  }

  const mockRes3: Residente = {
    id: 'r3',
    nome: 'Dona Carmem',
    sexo: 'F',
    quarto: '103',
    status: 'ativo',
    admissao: '2026-03-01',
    aval: [
      {
        id: 'a3',
        esc: 'fugulin',
        d: '2026-11-01',
        resp: [3, 3, 3, 3, 3, 3, 3, 3, 3], // total 36 -> Grau 3
        sig: { id: 's1', d: '2026-11-01', h: '08:00' },
      },
    ],
    estoque: [],
    presc: [],
    pia: [],
    cuidados: [],
    anot: [],
    evol: [],
  }

  const mockResObito: Residente = {
    id: 'r4',
    nome: 'Falecido',
    sexo: 'M',
    status: 'obito',
    admissao: '2026-01-01',
    obitoData: '2026-10-15',
    aval: [],
    estoque: [],
    presc: [],
    pia: [],
    cuidados: [],
    anot: [],
    evol: [],
  }

  describe('ativos', () => {
    it('filtra apenas residentes vivos / ativos', () => {
      const todos = [mockRes1, mockRes2, mockResObito]
      const result = ativos(todos)
      expect(result).toHaveLength(2)
      expect(result.map((r) => r.id)).toEqual(['r1', 'r2'])
    })
  })

  describe('calcInd (Indicadores de Vigilância Sanitária)', () => {
    it('calcula taxas percentuais sobre a base de residentes do mês', () => {
      const residentes = [mockRes1, mockRes2, mockRes3] // 3 residentes no mês de novembro
      const eventos: EventoVigilancia[] = [
        { id: 'ev1', tipo: 'queda', data: '2026-11-05', resId: 'r1' },
        { id: 'ev2', tipo: 'lpp', data: '2026-11-10', resId: 'r3' },
      ]

      const res = calcInd('2026-11', residentes, eventos)
      expect(res.den).toBe(3)

      const lppRow = res.rows.find((r) => r.n.includes('lesão por pressão'))
      expect(lppRow?.tipo).toBe('lpp')
      expect(lppRow?.c).toBe(1)
      expect(lppRow?.taxa).toBeCloseTo((1 / 3) * 100, 1)

      const ddaRow = res.rows.find((r) => r.n.includes('diarreica'))
      expect(ddaRow?.tipo).toBe('dda')
      expect(ddaRow?.c).toBe(0)
      expect(ddaRow?.taxa).toBe(0)
    })
  })

  describe('dimensionamento (RDC 502 / ANVISA)', () => {
    const equipeCuidadores: Profissional[] = [
      { id: 'c1', nome: 'Cuidadora 1', cat: 'cuid', funcao: 'Cuidadora' },
      { id: 'c2', nome: 'Cuidadora 2', cat: 'cuid', funcao: 'Cuidadora' },
      { id: 'c3', nome: 'Técnica 1', cat: 'tec', funcao: 'Téc Enf' },
      { id: 'c4', nome: 'Técnica 2', cat: 'tec', funcao: 'Téc Enf' },
    ]

    it('calcula cuidadores necessários e aprova quando a escala atende o mínimo', () => {
      // 1 residente Grau 1 (req: 1), 1 Grau 2 (req: 1), 1 Grau 3 (req: 1)
      // porTurnoG23 = req.g2 + req.g3 = 1 + 1 = 2 cuidadores por turno
      const escala: Record<string, EscalaMes> = {
        '2026-11': {
          c1: Array(30).fill('D'), // dia
          c2: Array(30).fill('D'), // dia (total dia: 2)
          c3: Array(30).fill('N'), // noite
          c4: Array(30).fill('N'), // noite (total noite: 2)
        },
      }

      const dim = dimensionamento([mockRes1, mockRes2, mockRes3], equipeCuidadores, escala, '2026-11-15')
      expect(dim.porGrau).toEqual({ g1: 1, g2: 1, g3: 1 })
      expect(dim.req).toEqual({ g1: 1, g2: 1, g3: 1 })
      expect(dim.porTurnoG23).toBe(2)
      expect(dim.naEscala).toEqual({ dia: 2, noite: 2 })
      expect(dim.atende).toBe(true)
    })

    it('aponta déficit e atende = false quando a escala está abaixo do mínimo legal', () => {
      // Escala com apenas 1 cuidador no turno da noite
      const escalaDeficit: Record<string, EscalaMes> = {
        '2026-11': {
          c1: Array(30).fill('D'),
          c2: Array(30).fill('D'),
          c3: Array(30).fill('N'),
          c4: Array(30).fill('F'), // folga
        },
      }

      const dim = dimensionamento([mockRes1, mockRes2, mockRes3], equipeCuidadores, escalaDeficit, '2026-11-15')
      expect(dim.naEscala.noite).toBe(1)
      expect(dim.porTurnoG23).toBe(2)
      expect(dim.atende).toBe(false)
    })
  })

  describe('codigoHoje', () => {
    it('retorna o código de plantão do dia correto no mês', () => {
      const escala: Record<string, EscalaMes> = {
        '2026-11': {
          p1: ['D', 'F', 'D', 'F', 'N'],
        },
      }
      expect(codigoHoje(escala, 'p1', '2026-11-01')).toBe('D')
      expect(codigoHoje(escala, 'p1', '2026-11-02')).toBe('F')
      expect(codigoHoje(escala, 'p1', '2026-11-05')).toBe('N')
      expect(codigoHoje(escala, 'p2', '2026-11-01')).toBe('')
    })
  })

  describe('variacaoPeso', () => {
    it('calcula variação percentual de peso entre evoluções', () => {
      const resComPeso: Residente = {
        ...mockRes1,
        evol: [
          {
            id: 'ev1',
            area: 'Nutrição',
            texto: 'Avaliação nutricional inicial',
            peso: 70,
            sig: { id: 's1', d: '2026-08-01', h: '10:00' },
          },
          {
            id: 'ev2',
            area: 'Nutrição',
            texto: 'Reavaliação trimestral',
            peso: 66.5, // perda de 3.5kg = -5%
            sig: { id: 's1', d: '2026-11-01', h: '10:00' },
          },
        ],
      }

      const vp = variacaoPeso(resComPeso)
      expect(vp).not.toBeNull()
      expect(vp?.pct).toBeCloseTo(-5, 1)
    })

    it('retorna null quando há menos de duas medições de peso', () => {
      expect(variacaoPeso(mockRes1)).toBeNull()
    })
  })
})
