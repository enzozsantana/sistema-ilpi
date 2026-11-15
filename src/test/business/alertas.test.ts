import { describe, it, expect } from 'vitest'
import { alertas, type ContextoAlertas } from '../../lib/business/alertas'
import type { Residente, TemperaturaGeladeira } from '../../types/ilpi'

describe('Clinical and Operational Alerts System', () => {
  const baseResidente: Residente = {
    id: 'r1',
    nome: 'Dona Mariazinha',
    sexo: 'F',
    quarto: '101',
    status: 'ativo',
    admissao: '2026-01-01',
    aval: [],
    estoque: [],
    presc: [],
    pia: [],
    cuidados: [],
    anot: [],
    evol: [],
  }

  it('gera alerta de geladeira fora da faixa (2 a 8 °C)', () => {
    const tempFora: TemperaturaGeladeira = {
      id: 't1',
      d: '2026-11-15',
      turno: 'manha',
      h: '07:30',
      mom: 9.5, // > 8 °C
      min: 4.0,
      max: 9.5,
      amb: 25,
      sig: { id: 's1', d: '2026-11-15', h: '07:30' },
    }

    const ctx: ContextoAlertas = {
      estado: {
        residentes: [baseResidente],
        adm: {},
        casa: [],
        documentos: [],
        temperaturas: [tempFora],
        treinamentos: [],
        pops: [],
        eventos: [],
      },
      usuario: { id: 's1', cat: 'rt' },
      hoje: '2026-11-15',
      agora: new Date(2026, 10, 15, 9, 0),
    }

    const res = alertas(ctx)
    const alertaGeladeira = res.find((a) => a.t.includes('Geladeira fora da faixa'))
    expect(alertaGeladeira).toBeDefined()
    expect(alertaGeladeira?.n).toBe('danger')
    expect(alertaGeladeira?.go).toBe('rotinas')
  })

  it('gera alerta quando a medição da manhã não foi registrada após as 08:00', () => {
    const ctx: ContextoAlertas = {
      estado: {
        residentes: [baseResidente],
        adm: {},
        casa: [],
        documentos: [],
        temperaturas: [],
        treinamentos: [],
        pops: [],
        eventos: [],
      },
      usuario: { id: 's1', cat: 'enf' },
      hoje: '2026-11-15',
      agora: new Date(2026, 10, 15, 9, 30),
    }

    const res = alertas(ctx)
    const alertaPendente = res.find((a) => a.t.includes('Temperatura da geladeira da manhã não registrada'))
    expect(alertaPendente).toBeDefined()
    expect(alertaPendente?.n).toBe('warn')
  })

  it('gera alerta de alteração de sinais vitais para enfermagem', () => {
    const resInstavel: Residente = {
      ...baseResidente,
      anot: [
        {
          id: 'an1',
          pa: '160/100', // Hipertensão
          pulso: 115, // Taquicardia
          texto: 'Residente queixa-se de cefaleia',
          sig: { id: 's4', d: '2026-11-15', h: '10:00' },
        },
      ],
    }

    const ctx: ContextoAlertas = {
      estado: {
        residentes: [resInstavel],
        adm: {},
        casa: [],
        documentos: [],
        temperaturas: [],
        treinamentos: [],
        pops: [],
        eventos: [],
      },
      usuario: { id: 's1', cat: 'rt' },
      hoje: '2026-11-15',
      agora: new Date(2026, 10, 15, 10, 30),
      prof: () => ({ nome: 'Técnica Juliana', cat: 'tec' }),
    }

    const res = alertas(ctx)
    const alertaSsvv = res.find((a) => a.t.includes('pa elevada'))
    expect(alertaSsvv).toBeDefined()
    expect(alertaSsvv?.n).toBe('danger')
    expect(alertaSsvv?.go).toBe('res:r1:anot')
  })

  it('gera alerta para doses de medicamentos atrasadas (> 30 min sem checagem)', () => {
    const resComPresc: Residente = {
      ...baseResidente,
      presc: [
        {
          id: 'pr_1',
          med: 'Digoxina 0.25mg',
          dose: '1 cp',
          via: 'VO',
          tipo: 'fixo',
          horarios: ['08:00'],
          inicio: '2026-11-01',
          consumo: 1,
          estoqueId: 'it_1',
        },
      ],
    }

    const ctx: ContextoAlertas = {
      estado: {
        residentes: [resComPresc],
        adm: {}, // sem registro de checagem
        casa: [],
        documentos: [],
        temperaturas: [],
        treinamentos: [],
        pops: [],
        eventos: [],
      },
      usuario: { id: 's1', cat: 'enf' },
      hoje: '2026-11-15',
      agora: new Date(2026, 10, 15, 8, 45), // 08:45 > 08:30 -> 45 min atrasada
    }

    const res = alertas(ctx)
    const alertaDose = res.find((a) => a.t.includes('sem checagem'))
    expect(alertaDose).toBeDefined()
    expect(alertaDose?.n).toBe('danger')
    expect(alertaDose?.go).toBe('plantao')
  })

  it('gera alerta para alvarás e licenças sanitárias prestes a vencer (< 60 dias)', () => {
    const ctx: ContextoAlertas = {
      estado: {
        residentes: [baseResidente],
        adm: {},
        casa: [],
        documentos: [
          {
            id: 'doc_1',
            nome: 'Auto de Vistoria do Corpo de Bombeiros (AVCB)',
            orgao: 'Corpo de Bombeiros',
            validade: '2026-11-25', // vence em 10 dias
          },
        ],
        temperaturas: [],
        treinamentos: [],
        pops: [],
        eventos: [],
      },
      usuario: { id: 's1', cat: 'rt' },
      hoje: '2026-11-15',
    }

    const res = alertas(ctx)
    const alertaDoc = res.find((a) => a.t.includes('AVCB'))
    expect(alertaDoc).toBeDefined()
    expect(alertaDoc?.t).toContain('vence em 10 dias')
    expect(alertaDoc?.go).toBe('gestao')
  })

  it('gera alerta para estoque crítico individual de residente (acabando em <= 3 dias)', () => {
    const resEstoqueCritico: Residente = {
      ...baseResidente,
      estoque: [
        {
          id: 'it_losartana',
          nome: 'Losartana 50mg',
          unid: 'comp',
          qtd: 4, // 4 comp restantes
          min: 20,
        },
      ],
      presc: [
        {
          id: 'p1',
          med: 'Losartana 50mg',
          dose: '1 comp',
          via: 'VO',
          tipo: 'fixo',
          horarios: ['08:00', '20:00'], // 2/dia -> acaba em 2 dias
          inicio: '2026-11-01',
          consumo: 1,
          estoqueId: 'it_losartana',
        },
      ],
    }

    const ctx: ContextoAlertas = {
      estado: {
        residentes: [resEstoqueCritico],
        adm: {},
        casa: [],
        documentos: [],
        temperaturas: [],
        treinamentos: [],
        pops: [],
        eventos: [],
      },
      usuario: { id: 's1', cat: 'rt' },
      hoje: '2026-11-15',
    }

    const res = alertas(ctx)
    const alertaEstoque = res.find(
      (a) => a.t.includes('Losartana 50mg') && a.t.includes('acaba em 2 dias')
    )
    expect(alertaEstoque).toBeDefined()
    expect(alertaEstoque?.n).toBe('danger')
  })
})
