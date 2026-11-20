import { describe, it, expect, beforeEach } from 'vitest'
import { canNav, navVisivel, can, canTab } from '../../lib/permissions'
import {
  obterProfissionaisVirtuais,
  salvarProfissionalVirtual,
} from '../../lib/teleconsultaStorage'
import type { ProfissionalVirtual } from '../../types/teleconsulta'

describe('Isolamento de Acesso e Cadastro de Especialistas Independentes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('especialista independente (tele_especialista) tem acesso estritamente ao módulo de teleconsulta', () => {
    const abasVisiveis = navVisivel('tele_especialista')
    expect(abasVisiveis).toEqual(['teleconsulta'])

    expect(canNav('tele_especialista', 'teleconsulta')).toBe(true)
    expect(canNav('tele_especialista', 'plantao')).toBe(false)
    expect(canNav('tele_especialista', 'residentes')).toBe(false)
    expect(canNav('tele_especialista', 'estoque')).toBe(false)
    expect(canNav('tele_especialista', 'rotinas')).toBe(false)
    expect(canNav('tele_especialista', 'equipe')).toBe(false)
    expect(canNav('tele_especialista', 'gestao')).toBe(false)
  })

  it('permite que o especialista independente emita prescrições/pedidos e registre evolução no prontuário', () => {
    expect(can('tele_especialista', 'presc')).toBe(true)
    expect(can('tele_especialista', 'evol')).toBe(true)
    expect(canTab('tele_especialista', 'arquivos')).toBe(true)

    // Não deve executar tarefas operacionais da ILPI (administração, gestão ILPI)
    expect(can('tele_especialista', 'adm')).toBe(false)
    expect(can('tele_especialista', 'gerir')).toBe(false)
  })

  it('retorna os profissionais semente por padrão em obterProfissionaisVirtuais', () => {
    const lista = obterProfissionaisVirtuais()
    expect(lista.length).toBeGreaterThanOrEqual(4)
    expect(lista.some((p) => p.especialidade === 'medica')).toBe(true)
  })

  it('cadastra e persiste um novo profissional virtual independente na vitrine', () => {
    const novo: ProfissionalVirtual = {
      id: 'prof_novo_teste',
      nome: 'Dr. Roberto Geriatra Teste',
      titulo: 'Geriatra SBGG',
      especialidade: 'medica',
      especialidadeLabel: 'Medicina Geriátrica',
      registro: 'CRM-SP 999999',
      clinica: 'Consultório Dr. Roberto',
      preco: 250,
      duracaoMin: 45,
      diasAtendimento: [1, 2, 3, 4, 5],
      foto: '',
      bio: 'Atendimento geriátrico e suporte para ILPIs.',
      horariosPadrao: ['14:00', '15:00', '16:00'],
      email: 'roberto@teste.com',
      isIndependente: true,
    }

    salvarProfissionalVirtual(novo)

    const atualizada = obterProfissionaisVirtuais()
    const encontrado = atualizada.find((p) => p.id === 'prof_novo_teste')

    expect(encontrado).toBeDefined()
    expect(encontrado?.nome).toBe('Dr. Roberto Geriatra Teste')
    expect(encontrado?.isIndependente).toBe(true)
    expect(encontrado?.preco).toBe(250)
  })
})
