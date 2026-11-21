import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CommandPaletteModal } from '../../components/CommandPaletteModal'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockProfissional = {
  id: 'p1',
  nome: 'Helena Prado',
  cat: 'rt',
  ativo: true,
}

const mockResidentes = [
  {
    id: 'res_1',
    nome: 'Maria da Silva',
    quarto: '102',
    status: 'ativo',
    presc: [
      { id: 'pr_1', med: 'Losartana 50mg', dose: '1 cp' },
      { id: 'pr_2', med: 'Dipirona 500mg', dose: '1 cp' },
    ],
  },
  {
    id: 'res_2',
    nome: 'João de Oliveira',
    quarto: '105',
    status: 'ativo',
    presc: [{ id: 'pr_3', med: 'Sinvastatina 20mg', dose: '1 cp' }],
  },
]

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    profissional: mockProfissional,
  }),
}))

vi.mock('../../contexts/IlpiDataContext', () => ({
  useIlpiData: () => ({
    residentes: mockResidentes,
  }),
}))

describe('CommandPaletteModal Component (Busca Rápida Global)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza os módulos principais quando o modal está aberto', () => {
    render(
      <MemoryRouter>
        <CommandPaletteModal open={true} onOpenChange={vi.fn()} />
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText(/Buscar por morador, quarto, remédio ou módulo/i)).toBeInTheDocument()
    expect(screen.getByText('Painel de Plantão')).toBeInTheDocument()
    expect(screen.getByText('Residentes & Prontuários')).toBeInTheDocument()
    expect(screen.getByText('Controle de Estoque')).toBeInTheDocument()
  })

  it('permite filtrar residente pelo nome ou quarto e navega ao selecionar', () => {
    const onOpenChange = vi.fn()
    render(
      <MemoryRouter>
        <CommandPaletteModal open={true} onOpenChange={onOpenChange} />
      </MemoryRouter>
    )

    const input = screen.getByPlaceholderText(/Buscar por morador, quarto, remédio ou módulo/i)
    fireEvent.change(input, { target: { value: 'Maria' } })

    expect(screen.getByText('Maria da Silva')).toBeInTheDocument()
    expect(screen.getByText(/Quarto 102/i)).toBeInTheDocument()

    // Clica no morador
    fireEvent.click(screen.getByText('Maria da Silva'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(mockNavigate).toHaveBeenCalledWith('/residentes/res_1')
  })

  it('permite buscar medicamento prescrito e navega para a aba de prescrição', () => {
    const onOpenChange = vi.fn()
    render(
      <MemoryRouter>
        <CommandPaletteModal open={true} onOpenChange={onOpenChange} />
      </MemoryRouter>
    )

    const input = screen.getByPlaceholderText(/Buscar por morador, quarto, remédio ou módulo/i)
    fireEvent.change(input, { target: { value: 'Losartana' } })

    expect(screen.getByText('Losartana 50mg (1 cp)')).toBeInTheDocument()
    expect(screen.getByText(/Prescrito para/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Losartana 50mg (1 cp)'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(mockNavigate).toHaveBeenCalledWith('/residentes/res_1/presc')
  })

  it('exibe mensagem amigável quando nenhum resultado é encontrado', () => {
    render(
      <MemoryRouter>
        <CommandPaletteModal open={true} onOpenChange={vi.fn()} />
      </MemoryRouter>
    )

    const input = screen.getByPlaceholderText(/Buscar por morador, quarto, remédio ou módulo/i)
    fireEvent.change(input, { target: { value: 'XYZ999Inexistente' } })

    expect(screen.getByText('Nenhum resultado encontrado')).toBeInTheDocument()
  })
})
