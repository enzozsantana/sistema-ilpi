import { describe, it, expect } from 'vitest'
import { consumoDia, diasRest, nivelEst, qtdPedir } from '../../lib/business/estoque'
import type { ItemEstoque, Prescricao, Residente } from '../../types/ilpi'

describe('Estoque Business Rules & Calculators', () => {
  const itemTest: ItemEstoque = {
    id: 'it1',
    nome: 'Losartana Potássica 50mg',
    unid: 'comp',
    qtd: 60,
    min: 20,
  }

  const prescDiaria: Prescricao = {
    id: 'p1',
    med: 'Losartana 50mg',
    dose: '1 comp',
    via: 'VO',
    tipo: 'fixo',
    horarios: ['08:00', '20:00'],
    inicio: '2026-11-01',
    consumo: 1,
    estoqueId: 'it1',
  }

  const mockResidente: Residente = {
    id: 'r1',
    nome: 'Seu Antônio',
    sexo: 'M',
    quarto: '201',
    status: 'ativo',
    admissao: '2026-01-01',
    aval: [],
    estoque: [itemTest],
    presc: [prescDiaria],
    pia: [],
    cuidados: [],
    anot: [],
    evol: [],
  }

  it('consumoDia: calcula corretamente o consumo de prescrição diária (2 doses de 1 comp = 2/dia)', () => {
    const c = consumoDia(mockResidente, itemTest, '2026-11-15')
    expect(c).toBe(2)
  })

  it('consumoDia: calcula prescrição semanal fracionada por 7 dias', () => {
    const prescSemanal: Prescricao = {
      id: 'p2',
      med: 'Vitamina D',
      dose: '1 comp',
      via: 'VO',
      tipo: 'semanal',
      horarios: ['08:00'],
      inicio: '2026-11-01',
      dias: [0], // 1 dia na semana
      consumo: 1,
      estoqueId: 'it1',
    }
    const resSemanal: Residente = { ...mockResidente, presc: [prescSemanal] }
    const c = consumoDia(resSemanal, itemTest, '2026-11-15')
    expect(c).toBeCloseTo(1 / 7, 3)
  })

  it('consumoDia: ignora prescrições Se Necessário (SN)', () => {
    const prescSn: Prescricao = {
      id: 'p3',
      med: 'Dipirona 500mg',
      dose: '1 comp',
      via: 'VO',
      tipo: 'sn',
      horarios: [],
      inicio: '2026-11-01',
      consumo: 1,
      estoqueId: 'it1',
    }
    const resSn: Residente = { ...mockResidente, presc: [prescSn] }
    const c = consumoDia(resSn, itemTest, '2026-11-15')
    expect(c).toBe(0)
  })

  it('consumoDia: ignora prescrições suspensas', () => {
    const prescSuspensa: Prescricao = {
      ...prescDiaria,
      suspensa: true,
    }
    const resSuspensa: Residente = { ...mockResidente, presc: [prescSuspensa] }
    const c = consumoDia(resSuspensa, itemTest, '2026-11-15')
    expect(c).toBe(0)
  })

  it('diasRest: divide quantidade em estoque pelo consumo diário', () => {
    expect(diasRest(2, 60)).toBe(30)
    expect(diasRest(2, 10)).toBe(5)
    expect(diasRest(0, 50)).toBe(Infinity)
  })

  it('nivelEst: classifica o status de estoque (danger, warn, ok)', () => {
    // Qtd <= 0 ou dias <= 3 -> danger
    expect(nivelEst(2, { qtd: 0, min: 10 })).toBe('danger')
    expect(nivelEst(2, { qtd: 4, min: 10 })).toBe('danger') // 2 dias

    // Dias <= 7 ou qtd < min -> warn
    expect(nivelEst(2, { qtd: 10, min: 10 })).toBe('warn') // 5 dias
    expect(nivelEst(1, { qtd: 8, min: 15 })).toBe('warn') // abaixo do mínimo

    // Saldo suficiente acima de 7 dias e acima do mínimo -> ok
    expect(nivelEst(2, { qtd: 60, min: 20 })).toBe('ok') // 30 dias
  })

  it('qtdPedir: calcula sugestão de compra para reposição de 30 dias + margem de segurança', () => {
    // Consumo = 2/dia. 30 dias = 60. Min = 20. Total necessário = 80. Saldo atual = 30 -> Pedir 50.
    const pedir = qtdPedir(2, { qtd: 30, min: 20 })
    expect(pedir).toBe(50)

    // Se estoque atual já for superior à necessidade de 30 dias + mínimo, pedir 0
    const pedirZero = qtdPedir(2, { qtd: 100, min: 20 })
    expect(pedirZero).toBe(0)
  })
})
