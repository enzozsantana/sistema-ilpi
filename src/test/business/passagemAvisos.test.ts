import { describe, it, expect, beforeEach } from 'vitest'
import {
  computarResumoPlantao,
  extrairAlertasCriticosRT,
  getAvisosLocais,
  setAvisosLocais,
  getPassagensLocais,
  setPassagensLocais,
} from '../../lib/business/passagemAvisos'
import type { Residente, RegistroAdm } from '../../types/ilpi'

describe('Passagem de Plantão & Avisos da RT', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('computarResumoPlantao: calcula doses checadas, cuidados e intercorrências do dia', () => {
    const mockRes: Residente[] = [
      {
        id: 'r1',
        nome: 'Dona Maria',
        admissao: '2026-01-01',
        presc: [
          {
            id: 'p1',
            med: 'Losartana',
            dose: '50mg',
            via: 'VO',
            tipo: 'fixo',
            horarios: ['08:00', '20:00'],
            consumo: 1,
            estoqueId: 'est1',
            inicio: '2026-01-01',
            sig: { id: 's1', d: '2026-01-01', h: '08:00' },
          },
        ],
        cuidados: [
          { id: 'c1', texto: 'Mudança de decúbito a cada 2h', quem: 'cuidador', horarios: ['10:00'] },
          { id: 'c2', texto: 'Hidratação reforçada', quem: 'todos', horarios: ['14:00'] },
        ],
        anot: [],
        aval: [],
        pia: [],
        evol: [],
        estoque: [],
      },
    ]

    const adm: Record<string, Record<string, RegistroAdm>> = {
      '2026-11-17': {
        'r1|p1|08:00': { st: 'dado', sig: { id: 's1', d: '2026-11-17', h: '08:05' } },
      },
    }

    const checagensCuidado = {
      '2026-11-17': {
        'r1|c1': { id: 's2', d: '2026-11-17', h: '10:00' },
      },
    }

    const eventos = [
      { data: '2026-11-17', tipo: 'queda', descricao: 'Queda da própria altura' },
    ]

    const resumo = computarResumoPlantao({
      residentes: mockRes,
      adm,
      checagensCuidado,
      eventos,
      hoje: '2026-11-17',
    })

    expect(resumo.dosesTotal).toBe(2)
    expect(resumo.dosesChecadas).toBe(1)
    expect(resumo.cuidadosTotal).toBe(2)
    expect(resumo.cuidadosChecados).toBe(1)
    expect(resumo.ocorrenciasHoje).toBe(1)
  })

  it('extrairAlertasCriticosRT: identifica intercorrências, desvios térmicos e sinais vitais alterados', () => {
    const mockRes: Residente[] = [
      {
        id: 'r2',
        nome: 'Seu João',
        quarto: '102',
        admissao: '2026-01-01',
        presc: [],
        cuidados: [],
        anot: [
          {
            id: 'a1',
            pa: '170/110',
            sat: 89,
            texto: 'Relato de cefaleia',
            sig: { id: 's1', d: '2026-11-17', h: '14:00' },
          },
        ],
        aval: [],
        pia: [],
        evol: [],
        estoque: [],
      },
    ]

    const adm: Record<string, Record<string, RegistroAdm>> = {}
    const checagensCuidado = {}
    const eventos = [
      { id: 'ev1', data: '2026-11-17', tipo: 'queda', descricao: 'Escorregão no banheiro', residente_id: 'r2' },
    ]
    const temperaturas = [
      { d: '2026-11-17', mom: 10.5, min: 9.0, max: 11.2, h: '08:00' }, // fora da faixa 2-8
    ]

    const criticos = extrairAlertasCriticosRT({
      residentes: mockRes,
      adm,
      checagensCuidado,
      eventos,
      temperaturas,
      hoje: '2026-11-17',
    })

    expect(criticos.length).toBeGreaterThanOrEqual(3)
    expect(criticos.some((c) => c.tipo === 'intercorrencia')).toBe(true)
    expect(criticos.some((c) => c.tipo === 'ssvv_critico')).toBe(true)
    expect(criticos.some((c) => c.tipo === 'geladeira_fora')).toBe(true)
  })

  it('getAvisosLocais e setAvisosLocais: persiste e recupera comunicados', () => {
    const lista = [
      {
        id: 'av_1',
        data: '2026-11-17',
        hora: '09:00',
        titulo: 'Aviso Teste',
        mensagem: 'Orientação técnica da RT Egle',
        prioridade: 'urgente' as const,
        autor: { id: 's1', nome: 'Egle', cat: 'rt' },
        ativo: true,
        ciencias: ['cuid_1'],
      },
    ]

    setAvisosLocais(lista)
    const recuperados = getAvisosLocais()
    expect(recuperados).toHaveLength(1)
    expect(recuperados[0].titulo).toBe('Aviso Teste')
    expect(recuperados[0].prioridade).toBe('urgente')
  })

  it('getPassagensLocais e setPassagensLocais: persiste e recupera passagens de plantão', () => {
    const passagens = [
      {
        id: 'pp_1',
        data: '2026-11-17',
        hora: '19:00',
        turno: 'diurno' as const,
        passadoPor: { id: 's2', nome: 'Ana Cuidadora' },
        relato: 'Plantão concluído com sucesso, todos os residentes jantaram.',
        pendencias: 'Verificar saturação às 22h',
        resumo: {
          dosesChecadas: 10,
          dosesTotal: 10,
          cuidadosChecados: 5,
          cuidadosTotal: 5,
          ocorrenciasHoje: 0,
        },
      },
    ]

    setPassagensLocais(passagens)
    const recuperadas = getPassagensLocais()
    expect(recuperadas).toHaveLength(1)
    expect(recuperadas[0].turno).toBe('diurno')
    expect(recuperadas[0].passadoPor.nome).toBe('Ana Cuidadora')
  })
})
