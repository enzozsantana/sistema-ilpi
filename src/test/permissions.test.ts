import { describe, it, expect } from 'vitest'
import {
  can,
  canNav,
  canTab,
  canAval,
  escalasVisiveis,
  navVisivel,
} from '../lib/permissions'

describe('RBAC & Permission Matrix', () => {
  describe('can (Ações clínicas e gerenciais)', () => {
    it('gerir: permitido apenas para RT e Enfermeiro', () => {
      expect(can('rt', 'gerir')).toBe(true)
      expect(can('enf', 'gerir')).toBe(true)
      expect(can('tec', 'gerir')).toBe(false)
      expect(can('cuid', 'gerir')).toBe(false)
      expect(can('med', 'gerir')).toBe(false)
      expect(can('apoio', 'gerir')).toBe(false)
    })

    it('adm: enfermagem pode administrar medicamentos (RT, Enf, Téc, Estagiário)', () => {
      expect(can('rt', 'adm')).toBe(true)
      expect(can('enf', 'adm')).toBe(true)
      expect(can('tec', 'adm')).toBe(true)
      expect(can('estag', 'adm')).toBe(true)
      expect(can('cuid', 'adm')).toBe(false)
      expect(can('apoio', 'adm')).toBe(false)
    })

    it('presc: médicos, RT e enfermeiros podem prescrever', () => {
      expect(can('med', 'presc')).toBe(true)
      expect(can('rt', 'presc')).toBe(true)
      expect(can('enf', 'presc')).toBe(true)
      expect(can('tec', 'presc')).toBe(false)
      expect(can('cuid', 'presc')).toBe(false)
    })

    it('cuid: cuidadores e enfermagem podem checar plano de cuidados', () => {
      expect(can('cuid', 'cuid')).toBe(true)
      expect(can('tec', 'cuid')).toBe(true)
      expect(can('enf', 'cuid')).toBe(true)
      expect(can('apoio', 'cuid')).toBe(false)
    })

    it('evol: equipe multiprofissional, médicos e enfermagem podem evoluir', () => {
      expect(can('multi', 'evol')).toBe(true)
      expect(can('med', 'evol')).toBe(true)
      expect(can('enf', 'evol')).toBe(true)
      expect(can('cuid', 'evol')).toBe(false)
    })
  })

  describe('canNav (Navegação nas views principais)', () => {
    it('plantao é aberto para todos (*)', () => {
      expect(canNav('cuid', 'plantao')).toBe(true)
      expect(canNav('apoio', 'plantao')).toBe(true)
      expect(canNav('rt', 'plantao')).toBe(true)
    })

    it('gestao é restrita a RT e Enfermeiro', () => {
      expect(canNav('rt', 'gestao')).toBe(true)
      expect(canNav('enf', 'gestao')).toBe(true)
      expect(canNav('cuid', 'gestao')).toBe(false)
      expect(canNav('med', 'gestao')).toBe(false)
      expect(canNav('apoio', 'gestao')).toBe(false)
    })

    it('estoque é restrito a enfermagem (RT, Enf, Téc)', () => {
      expect(canNav('rt', 'estoque')).toBe(true)
      expect(canNav('tec', 'estoque')).toBe(true)
      expect(canNav('cuid', 'estoque')).toBe(false)
      expect(canNav('apoio', 'estoque')).toBe(false)
    })

    it('navVisivel lista todas as telas permitidas para a categoria', () => {
      const viewsCuid = navVisivel('cuid')
      expect(viewsCuid).toContain('plantao')
      expect(viewsCuid).toContain('residentes')
      expect(viewsCuid).toContain('rotinas')
      expect(viewsCuid).toContain('equipe')
      expect(viewsCuid).not.toContain('gestao')
      expect(viewsCuid).not.toContain('estoque')
    })
  })

  describe('canTab (Abas do prontuário do residente)', () => {
    it('pasta e ficha são abertas (*)', () => {
      expect(canTab('cuid', 'pasta')).toBe(true)
      expect(canTab('cuid', 'ficha')).toBe(true)
    })

    it('presc e anot exigem perfil de enfermagem ou médico', () => {
      expect(canTab('enf', 'presc')).toBe(true)
      expect(canTab('med', 'presc')).toBe(true)
      expect(canTab('cuid', 'presc')).toBe(false)
    })

    it('cuidados é acessível para cuidadores', () => {
      expect(canTab('cuid', 'cuidados')).toBe(true)
    })
  })

  describe('canAval e escalasVisiveis', () => {
    it('RT e Enf podem avaliar qualquer escala', () => {
      expect(canAval('rt', undefined, 'fugulin')).toBe(true)
      expect(canAval('enf', undefined, 'morse')).toBe(true)
      expect(canAval('enf', undefined, 'mna')).toBe(true)
    })

    it('Multiprofissional só avalia escalas de sua área técnica', () => {
      // Fisioterapia avalia Morse (risco de queda)
      expect(canAval('multi', 'Fisioterapia', 'morse')).toBe(true)
      expect(canAval('multi', 'Fisioterapia', 'mna')).toBe(false)

      // Nutrição avalia MNA (triagem nutricional)
      expect(canAval('multi', 'Nutrição', 'mna')).toBe(true)
      expect(canAval('multi', 'Nutrição', 'morse')).toBe(false)
    })

    it('escalasVisiveis filtra corretamente as escalas para equipe multi', () => {
      const escalasFisio = escalasVisiveis('multi', 'Fisioterapia')
      expect(escalasFisio).toEqual(['morse'])

      const escalasNutri = escalasVisiveis('multi', 'Nutrição')
      expect(escalasNutri).toEqual(['mna'])

      const escalasEnf = escalasVisiveis('enf')
      expect(escalasEnf).toHaveLength(5)
    })
  })
})
