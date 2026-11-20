import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SecaoPops } from '../../components/SecaoPops'
import { useAuth } from '../../contexts/AuthContext'
import { useIlpiData } from '../../contexts/IlpiDataContext'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../contexts/IlpiDataContext', () => ({
  useIlpiData: vi.fn(),
}))

describe('SecaoPops Component (POPs & Protocolos)', () => {
  const mockPops = [
    {
      id: 'pop1',
      titulo: 'Administração de medicamentos',
      tipo: 'POP',
      revisao: '2026-08-06',
    },
    {
      id: 'pop2',
      titulo: 'Higienização das mãos',
      tipo: 'POP',
      revisao: '2025-10-10',
    },
    {
      id: 'pop3',
      titulo: 'Prevenção de quedas',
      tipo: 'Protocolo',
      revisao: '2026-04-28',
    },
  ]

  it('permite que qualquer profissional (ex: cuidador) visualize todos os POPs e abra o procedimento', () => {
    vi.mocked(useAuth).mockReturnValue({
      profissional: { id: 'prof_cuid', nome: 'Débora Silva', cat: 'cuid' },
    } as any)

    vi.mocked(useIlpiData).mockReturnValue({
      pops: mockPops,
      refresh: vi.fn(),
    } as any)

    render(<SecaoPops />)

    // Todos os POPs devem ser visíveis
    expect(screen.getByText('Administração de medicamentos')).toBeInTheDocument()
    expect(screen.getByText('Higienização das mãos')).toBeInTheDocument()
    expect(screen.getByText('Prevenção de quedas')).toBeInTheDocument()

    // Cuidador deve ver o indicativo de modo consulta
    expect(screen.getByText(/Modo Consulta/i)).toBeInTheDocument()

    // Cuidador NÃO deve ver o botão de criar novo POP
    expect(screen.queryByRole('button', { name: /Novo POP/i })).not.toBeInTheDocument()

    // Cuidador pode clicar em um POP para ler o procedimento
    fireEvent.click(screen.getByText('Higienização das mãos'))
    expect(screen.getByText('🎯 Objetivo do Procedimento:')).toBeInTheDocument()
    expect(screen.getByText(/Prevenir e controlar infecções cruzadas/i)).toBeInTheDocument()
  })

  it('permite que Enfermeiro e RT criem, editem e gerenciem os POPs', () => {
    vi.mocked(useAuth).mockReturnValue({
      profissional: { id: 'prof_rt', nome: 'Helena Prado', cat: 'rt' },
    } as any)

    vi.mocked(useIlpiData).mockReturnValue({
      pops: mockPops,
      refresh: vi.fn(),
    } as any)

    render(<SecaoPops />)

    // RT e Enfermeiro devem ver o botão de Novo POP
    expect(screen.getByRole('button', { name: /Novo POP/i })).toBeInTheDocument()
    // Não deve exibir o badge de restrição de modo consulta
    expect(screen.queryByText(/Modo Consulta/i)).not.toBeInTheDocument()
  })
})
