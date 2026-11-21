import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Treinamentos from '../../pages/Treinamentos'
import { definirPlanoAtivo } from '../../lib/plans'

const mockProfissional = {
  id: 'prof-rt-1',
  nome: 'Enfermeira Responsável Técnica',
  cat: 'rt',
  ativo: true,
}

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { id: 'prof-rt-1' } },
    loading: false,
    profissional: mockProfissional,
  }),
}))

vi.mock('../../contexts/IlpiDataContext', () => ({
  useIlpiData: () => ({
    inst: 'Residencial Geriátrico Senecurare',
    equipe: [
      { id: 'prof-rt-1', nome: 'Enfermeira RT', cat: 'rt', ativo: true },
      { id: 'prof-cuid-1', nome: 'Maria Cuidadora', cat: 'cuid', ativo: true },
    ],
    residentes: [],
    loading: false,
  }),
}))

describe('Página Treinamentos & Educação Permanente', () => {
  beforeEach(() => {
    localStorage.clear()
    definirPlanoAtivo('avancado')
    vi.clearAllMocks()
  })

  it('renderiza o título da página e as abas principais', async () => {
    render(
      <MemoryRouter>
        <Treinamentos />
      </MemoryRouter>,
    )

    expect(screen.getByText('Módulo de Treinamentos')).toBeInTheDocument()
    expect(screen.getByText(/Educação Permanente & Capacitação Continuada/i)).toBeInTheDocument()
    expect(screen.getByText(/Meus Treinamentos/i)).toBeInTheDocument()
    expect(screen.getByText(/Catálogo de Cursos/i)).toBeInTheDocument()
    expect(screen.getByText(/Conformidade & Atas ANVISA/i)).toBeInTheDocument()
  })

  it('exibe botões administrativos para Responsável Técnico (RT)', async () => {
    render(
      <MemoryRouter>
        <Treinamentos />
      </MemoryRouter>,
    )

    expect(screen.getByText('Atribuir à Equipe')).toBeInTheDocument()
    expect(screen.getByText('Novo Treinamento')).toBeInTheDocument()
  })
})
