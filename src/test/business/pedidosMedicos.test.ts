import { describe, it, expect, beforeEach } from 'vitest'
import {
  gerarTituloResumo,
  converterPrescricoesParaReceita,
  getPedidosLocais,
  salvarPedidoLocal,
  removerPedidoLocal,
  formatarDataExtenso,
  type PedidoMedicoData,
} from '../../lib/business/pedidosMedicos'
import type { Residente } from '../../types/ilpi'

describe('Módulo de Pedidos Médicos & Impressão', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('gerarTituloResumo: gera títulos claros para exames, receitas e encaminhamentos', () => {
    const pedidoExame: PedidoMedicoData = {
      id: 'ped_1',
      residenteId: 'r1',
      tipo: 'exames',
      data: '2026-11-17',
      hora: '10:00',
      prescritor: { id: 'm1', nome: 'Dr. Roberto', cat: 'med' },
      examesSelecionados: ['Hemograma', 'Ureia', 'Creatinina', 'Glicemia'],
    }
    expect(gerarTituloResumo(pedidoExame)).toContain('Pedido de Exames (4): Hemograma, Ureia, Creatinina...')

    const pedidoReceita: PedidoMedicoData = {
      id: 'ped_2',
      residenteId: 'r1',
      tipo: 'receituario',
      tipoReceita: 'controle_especial',
      data: '2026-11-17',
      hora: '10:00',
      prescritor: { id: 'm1', nome: 'Dr. Roberto', cat: 'med' },
      examesSelecionados: [],
      medicamentos: [
        { nome: 'Clonazepam 2mg', dose: '1 cp', posologia: 'Noite', via: 'VO' },
        { nome: 'Quetiapina 25mg', dose: '1 cp', posologia: 'Noite', via: 'VO' },
      ],
    }
    expect(gerarTituloResumo(pedidoReceita)).toContain('Receituário Médico (Controle Especial): Clonazepam 2mg, Quetiapina 25mg')

    const pedidoEnc: PedidoMedicoData = {
      id: 'ped_3',
      residenteId: 'r1',
      tipo: 'encaminhamento',
      data: '2026-11-17',
      hora: '10:00',
      prescritor: { id: 'm1', nome: 'Dr. Roberto', cat: 'med' },
      examesSelecionados: [],
      especialidadeDestino: 'Cardiologia',
    }
    expect(gerarTituloResumo(pedidoEnc)).toBe('Guia de Encaminhamento: Cardiologia')
  })

  it('converterPrescricoesParaReceita: converte prescrições ativas do residente para formato de receituário', () => {
    const mockRes: Residente = {
      id: 'r1',
      nome: 'Dona Maria',
      admissao: '2026-01-01',
      presc: [
        {
          id: 'p1',
          med: 'Losartana 50mg',
          dose: '1 cp',
          via: 'VO',
          tipo: 'fixo',
          horarios: ['08:00', '20:00'],
          inicio: '2026-01-01',
          suspensa: false,
          sig: { id: 's1', d: '2026-01-01', h: '08:00' },
          consumo: 1,
          estoqueId: 'est1',
        },
        {
          id: 'p2',
          med: 'Dipirona 500mg',
          dose: '1 cp',
          via: 'VO',
          tipo: 'sn',
          horarios: [],
          obs: 'Se febre > 37.8°C',
          inicio: '2026-01-01',
          suspensa: false,
          sig: { id: 's1', d: '2026-01-01', h: '08:00' },
          consumo: 1,
          estoqueId: 'est2',
        },
        {
          id: 'p3',
          med: 'Amoxicilina 500mg',
          dose: '1 cp',
          via: 'VO',
          tipo: 'fixo',
          horarios: ['08:00'],
          inicio: '2026-01-01',
          suspensa: true, // Suspensa não deve entrar na receita
          sig: { id: 's1', d: '2026-01-01', h: '08:00' },
          consumo: 1,
          estoqueId: 'est3',
        },
      ],
      anot: [],
      aval: [],
      pia: [],
      cuidados: [],
      evol: [],
      estoque: [],
    }

    const meds = converterPrescricoesParaReceita(mockRes)
    expect(meds.length).toBe(2)
    expect(meds[0].nome).toBe('Losartana 50mg')
    expect(meds[0].posologia).toBe('Tomar às 08:00, 20:00')
    expect(meds[1].nome).toBe('Dipirona 500mg')
    expect(meds[1].posologia).toContain('Se febre > 37.8°C')
  })

  it('salvarPedidoLocal, getPedidosLocais e removerPedidoLocal: gerencia persistência local', () => {
    const pedido: PedidoMedicoData = {
      id: 'ped_abc',
      residenteId: 'r99',
      tipo: 'exames',
      data: '2026-11-17',
      hora: '14:30',
      prescritor: { id: 'm1', nome: 'Dra. Julia', cat: 'med' },
      examesSelecionados: ['Hemograma Completo'],
    }

    expect(getPedidosLocais('r99')).toHaveLength(0)
    salvarPedidoLocal(pedido)
    expect(getPedidosLocais('r99')).toHaveLength(1)
    expect(getPedidosLocais('r99')[0].id).toBe('ped_abc')

    removerPedidoLocal('r99', 'ped_abc')
    expect(getPedidosLocais('r99')).toHaveLength(0)
  })

  it('formatarDataExtenso: formata datas para documentos médicos', () => {
    const formatada = formatarDataExtenso('2026-11-17')
    expect(formatada.toLowerCase()).toContain('novembro')
    expect(formatada).toContain('2026')
  })
})
