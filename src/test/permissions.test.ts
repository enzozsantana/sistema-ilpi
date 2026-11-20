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

    it('adm: enfermagem e cuidadores podem checar e administrar medicações', () => {
      expect(can('rt', 'adm')).toBe(true)
      expect(can('enf', 'adm')).toBe(true)
      expect(can('tec', 'adm')).toBe(true)
      expect(can('estag', 'adm')).toBe(true)
      expect(can('cuid', 'adm')).toBe(true)
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

    it('pop_ver: todos os profissionais podem visualizar POPs e protocolos', () => {
      expect(can('rt', 'pop_ver')).toBe(true)
      expect(can('enf', 'pop_ver')).toBe(true)
      expect(can('tec', 'pop_ver')).toBe(true)
      expect(can('estag', 'pop_ver')).toBe(true)
      expect(can('cuid', 'pop_ver')).toBe(true)
      expect(can('med', 'pop_ver')).toBe(true)
      expect(can('multi', 'pop_ver')).toBe(true)
      expect(can('apoio', 'pop_ver')).toBe(true)
    })

    it('pop_editar: somente RT e Enfermeiro podem criar, editar e excluir POPs', () => {
      expect(can('rt', 'pop_editar')).toBe(true)
      expect(can('enf', 'pop_editar')).toBe(true)
      expect(can('tec', 'pop_editar')).toBe(false)
      expect(can('estag', 'pop_editar')).toBe(false)
      expect(can('cuid', 'pop_editar')).toBe(false)
      expect(can('med', 'pop_editar')).toBe(false)
      expect(can('multi', 'pop_editar')).toBe(false)
      expect(can('apoio', 'pop_editar')).toBe(false)
    })

    it('alvara: restrito exclusivamente a RT e Gestão (funções diferentes de enfermagem assistencial)', () => {
      expect(can('rt', 'alvara')).toBe(true)
      expect(can('gestao', 'alvara')).toBe(true)
      expect(can('enf', 'alvara')).toBe(false)
      expect(can('tec', 'alvara')).toBe(false)
      expect(can('cuid', 'alvara')).toBe(false)
      expect(can('med', 'alvara')).toBe(false)
      expect(can('multi', 'alvara')).toBe(false)
      expect(can('apoio', 'alvara')).toBe(false)
    })
  })

  describe('canNav (Navegação nas views principais)', () => {
    it('plantao é aberto para todos (*)', () => {
      expect(canNav('cuid', 'plantao')).toBe(true)
      expect(canNav('apoio', 'plantao')).toBe(true)
      expect(canNav('rt', 'plantao')).toBe(true)
      expect(canNav('gestao', 'plantao')).toBe(true)
    })

    it('gestao é acessível para RT, Enfermeiro e Gestão', () => {
      expect(canNav('rt', 'gestao')).toBe(true)
      expect(canNav('enf', 'gestao')).toBe(true)
      expect(canNav('gestao', 'gestao')).toBe(true)
      expect(canNav('cuid', 'gestao')).toBe(false)
      expect(canNav('med', 'gestao')).toBe(false)
      expect(canNav('apoio', 'gestao')).toBe(false)
    })

    it('estoque é restrito exclusivamente ao Responsável Técnico (RT)', () => {
      expect(canNav('rt', 'estoque')).toBe(true)
      expect(canNav('enf', 'estoque')).toBe(false)
      expect(canNav('tec', 'estoque')).toBe(false)
      expect(canNav('cuid', 'estoque')).toBe(false)
      expect(canNav('apoio', 'estoque')).toBe(false)
      expect(can('rt', 'estoque')).toBe(true)
      expect(can('enf', 'estoque')).toBe(false)
      expect(can('tec', 'estoque')).toBe(false)
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

    it('presc é visível para enfermagem, médico e cuidadores (para checagem), enquanto anot e cuidados são acessíveis a cuidadores', () => {
      expect(canTab('enf', 'presc')).toBe(true)
      expect(canTab('med', 'presc')).toBe(true)
      expect(canTab('cuid', 'presc')).toBe(true)
      expect(canTab('cuid', 'anot')).toBe(true)
      expect(can('cuid', 'anot')).toBe(true)
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

    it('escalasVisiveis disponibiliza todas as escalas para consulta e visualização clínica', () => {
      const escalasFisio = escalasVisiveis('multi', 'Fisioterapia')
      expect(escalasFisio).toHaveLength(5)
      expect(escalasFisio).toContain('morse')
      expect(escalasFisio).toContain('braden')
      expect(escalasFisio).toContain('fugulin')

      const escalasNutri = escalasVisiveis('multi', 'Nutrição')
      expect(escalasNutri).toHaveLength(5)

      const escalasEnf = escalasVisiveis('enf')
      expect(escalasEnf).toHaveLength(5)
    })
  })
})
