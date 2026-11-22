import { describe, it, expect, beforeEach } from 'vitest'
import {
  PLANOS,
  PLANO_HIERARQUIA,
  isFeatureDisponivel,
  obterPlanoAtivo,
  definirPlanoAtivo,
  verificarLimiteResidentes,
  isPlanoVitalicio,
  ativarPlanoVitalicio,
  desativarPlanoVitalicio,
  isEmailDemo,
  verificarEAtivarDemoVitalicio,
} from '../../lib/plans'

describe('Módulo de Planos & Feature Gating (plans.ts)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve ter todos os 4 planos configurados com regras de negócio corretas', () => {
    expect(PLANOS.compacto).toBeDefined()
    expect(PLANOS.clinico).toBeDefined()
    expect(PLANOS.avancado).toBeDefined()
    expect(PLANOS.enterprise).toBeDefined()

    expect(PLANOS.compacto.precoMensal).toBe(450)
    expect(PLANOS.clinico.precoMensal).toBe(890)
    expect(PLANOS.avancado.precoMensal).toBe(1390)
    expect(PLANOS.enterprise.precoMensal).toBe(1990)

    expect(PLANOS.compacto.limiteResidentes).toBe(15)
    expect(PLANOS.clinico.limiteResidentes).toBe(35)
    expect(PLANOS.avancado.limiteResidentes).toBe(60)
  })

  it('deve respeitar a hierarquia numérica dos planos', () => {
    expect(PLANO_HIERARQUIA.compacto).toBeLessThan(PLANO_HIERARQUIA.clinico)
    expect(PLANO_HIERARQUIA.clinico).toBeLessThan(PLANO_HIERARQUIA.avancado)
    expect(PLANO_HIERARQUIA.avancado).toBeLessThan(PLANO_HIERARQUIA.enterprise)
  })

  it('deve verificar disponibilidade de features conforme o plano do assinante', () => {
    // Plano Compacto
    expect(isFeatureDisponivel('plantao', 'compacto')).toBe(true)
    expect(isFeatureDisponivel('residentes', 'compacto')).toBe(true)
    expect(isFeatureDisponivel('estoque', 'compacto')).toBe(false)
    expect(isFeatureDisponivel('pops', 'compacto')).toBe(false)
    expect(isFeatureDisponivel('treinamentos', 'compacto')).toBe(false)
    expect(isFeatureDisponivel('teleconsulta', 'compacto')).toBe(false)

    // Plano Clínico & Compliance
    expect(isFeatureDisponivel('estoque', 'clinico')).toBe(true)
    expect(isFeatureDisponivel('pops', 'clinico')).toBe(true)
    expect(isFeatureDisponivel('lpp_mapa', 'clinico')).toBe(true)
    expect(isFeatureDisponivel('treinamentos', 'clinico')).toBe(false)
    expect(isFeatureDisponivel('teleconsulta', 'clinico')).toBe(false)

    // Plano Avançado
    expect(isFeatureDisponivel('treinamentos', 'avancado')).toBe(true)
    expect(isFeatureDisponivel('teleconsulta', 'avancado')).toBe(true)
    expect(isFeatureDisponivel('multi_unidades', 'avancado')).toBe(false)

    // Plano Enterprise
    expect(isFeatureDisponivel('multi_unidades', 'enterprise')).toBe(true)
  })

  it('deve persistir e carregar o plano ativo do localStorage', () => {
    desativarPlanoVitalicio()
    expect(obterPlanoAtivo()).toBe('clinico') // padrão quando vitalício desativado

    definirPlanoAtivo('avancado')
    expect(obterPlanoAtivo()).toBe('avancado')

    definirPlanoAtivo('compacto')
    expect(obterPlanoAtivo()).toBe('compacto')
  })

  it('deve calcular corretamente os limites de residentes por plano', () => {
    // Compacto (limite 15)
    const verif10 = verificarLimiteResidentes(10, 'compacto')
    expect(verif10.atingiu).toBe(false)
    expect(verif10.restantes).toBe(5)

    const verif15 = verificarLimiteResidentes(15, 'compacto')
    expect(verif15.atingiu).toBe(true)
    expect(verif15.restantes).toBe(0)

    // Enterprise (ilimitado)
    const verifEnterprise = verificarLimiteResidentes(200, 'enterprise')
    expect(verifEnterprise.atingiu).toBe(false)
  })

  it('deve identificar contas de demonstração e ativar plano Enterprise vitalício', () => {
    expect(isEmailDemo('s1@ilpi.demo')).toBe(true)
    expect(isEmailDemo('s9@ilpi.demo')).toBe(true)
    expect(isEmailDemo('usuario@clinica.com')).toBe(false)

    desativarPlanoVitalicio()
    expect(isPlanoVitalicio()).toBe(false)

    // Ativa demo vitalício
    const ativou = verificarEAtivarDemoVitalicio('s1@ilpi.demo')
    expect(ativou).toBe(true)
    expect(isPlanoVitalicio()).toBe(true)
    expect(obterPlanoAtivo()).toBe('enterprise')

    // No plano vitalício, todos os módulos são liberados e residentes são ilimitados
    expect(isFeatureDisponivel('treinamentos')).toBe(true)
    expect(isFeatureDisponivel('teleconsulta')).toBe(true)
    expect(isFeatureDisponivel('estoque')).toBe(true)
    expect(isFeatureDisponivel('pops')).toBe(true)
    expect(verificarLimiteResidentes(500).atingiu).toBe(false)
  })
})
