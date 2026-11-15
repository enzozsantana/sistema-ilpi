import { describe, it, expect } from 'vitest'
import {
  mapProfissional,
  mapItemEstoque,
  mapPrescricao,
  mapTemperatura,
  buildAdmMap,
  mapResidenteBase,
} from '../lib/db-map'

describe('Database Entity Mappers', () => {
  it('mapProfissional: mapeia linha do Supabase para modelo Profissional', () => {
    const row = {
      id: 's1',
      nome: 'Helena Prado',
      categoria: 'rt' as const,
      funcao: 'Enfermeira RT',
      conselho: 'COREN-SP 111.111-ENF',
      setor: 'Responsável técnica',
      area: 'Enfermagem',
      carga: '40h',
      horario: '08h às 17h',
      foto: null,
      ativo: true,
    }

    const p = mapProfissional(row)
    expect(p.id).toBe('s1')
    expect(p.nome).toBe('Helena Prado')
    expect(p.cat).toBe('rt')
    expect(p.conselho).toBe('COREN-SP 111.111-ENF')
    expect(p.ativo).toBe(true)
  })

  it('mapItemEstoque: converte números e mapeia campos de estoque', () => {
    const row = {
      id: 'it1',
      nome: 'Fralda Geriátrica G',
      unidade: 'pct',
      quantidade: 50,
      minimo: 15,
      consumo_dia: 3.5,
    }

    const item = mapItemEstoque(row)
    expect(item.id).toBe('it1')
    expect(item.unid).toBe('pct')
    expect(item.qtd).toBe(50)
    expect(item.min).toBe(15)
    expect(item.consumoDia).toBe(3.5)
  })

  it('mapPrescricao: mapeia e normaliza tipos de prescrição e assinatura', () => {
    const row = {
      id: 'pr1',
      medicamento: 'AAS 100mg',
      dose: '1 cp',
      via: 'VO',
      tipo: 'diario' as const, // deve virar 'fixo'
      horarios: ['08:00'],
      dias: [],
      consumo: 1,
      suspensa: false,
      assinatura: { id: 's1', d: '2026-11-01', h: '09:00' },
    }

    const p = mapPrescricao(row)
    expect(p.id).toBe('pr1')
    expect(p.med).toBe('AAS 100mg')
    expect(p.tipo).toBe('fixo')
    expect(p.horarios).toEqual(['08:00'])
    expect(p.sig?.id).toBe('s1')
  })

  it('mapTemperatura: mapeia e converte temperaturas numéricas', () => {
    const row = {
      id: 'temp_1',
      data: '2026-11-15',
      turno: 'manha' as const,
      hora: '07:30',
      momento: 4.5,
      min: 3.8,
      max: 5.2,
      ambiente: 23.5,
      assinatura: { id: 's1', d: '2026-11-15', h: '07:30' },
    }

    const t = mapTemperatura(row)
    expect(t.d).toBe('2026-11-15')
    expect(t.turno).toBe('manha')
    expect(t.mom).toBe(4.5)
    expect(t.min).toBe(3.8)
    expect(t.max).toBe(5.2)
    expect(t.amb).toBe(23.5)
    expect(t.sig.id).toBe('s1')
  })

  it('buildAdmMap: indexa administrações por data e doseKey', () => {
    const rows = [
      {
        data: '2026-11-15',
        residente_id: 'r1',
        prescricao_id: 'p1',
        horario: '08:00',
        status: 'dado' as const,
        motivo: null,
        assinatura: { id: 's4', d: '2026-11-15', h: '08:05' },
      },
      {
        data: '2026-11-15',
        residente_id: 'r1',
        prescricao_id: 'p1',
        horario: '20:00',
        status: 'recusado' as const,
        motivo: 'Residente referiu náusea',
        assinatura: { id: 's7', d: '2026-11-15', h: '20:10' },
      },
    ]

    const admMap = buildAdmMap(rows)
    expect(admMap['2026-11-15']).toBeDefined()
    expect(admMap['2026-11-15']['r1|p1|08:00']?.st).toBe('dado')
    expect(admMap['2026-11-15']['r1|p1|20:00']?.st).toBe('recusado')
    expect(admMap['2026-11-15']['r1|p1|20:00']?.motivo).toBe('Residente referiu náusea')
  })

  it('mapResidenteBase: inicializa listas de arrays vazias e extrai campos', () => {
    const row = {
      id: 'res_1',
      nome: 'Dona Ivone',
      sexo: 'F',
      quarto: '204',
      status: 'ativo' as const,
      alergias: 'Dipirona, Penicilina',
    }

    const r = mapResidenteBase(row)
    expect(r.id).toBe('res_1')
    expect(r.nome).toBe('Dona Ivone')
    expect(r.quarto).toBe('204')
    expect(r.alergias).toBe('Dipirona, Penicilina')
    expect(r.aval).toEqual([])
    expect(r.presc).toEqual([])
    expect(r.estoque).toEqual([])
  })
})
