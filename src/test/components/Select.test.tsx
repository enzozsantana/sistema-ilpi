import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SearchableSelect,
} from '../../components/ui/select'

describe('Select Component com Busca por Padrão', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    window.HTMLElement.prototype.hasPointerCapture = vi.fn()
    window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  })

  it('renderiza o SearchableSelect com placeholder', () => {
    render(
      <SearchableSelect
        placeholder="Selecione um morador..."
        options={[
          { value: '1', label: 'Dona Francisca (Quarto 101)' },
          { value: '2', label: 'Sr. Antônio (Quarto 102)' },
        ]}
      />
    )

    expect(screen.getByText('Selecione um morador...')).toBeInTheDocument()
  })

  it('exibe o campo de busca por padrão ao abrir o dropdown e filtra itens sem distinção de acentos', async () => {
    const handleSelect = vi.fn()

    render(
      <SearchableSelect
        onValueChange={handleSelect}
        placeholder="Selecione..."
        options={[
          { value: '1', label: 'Dona Francisca (Quarto 101)' },
          { value: '2', label: 'Sr. Antônio (Quarto 102)' },
          { value: '3', label: 'Joãozinho da Silva' },
        ]}
      />
    )

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)

    // O campo de busca deve estar presente por padrão
    const searchInput = await screen.findByPlaceholderText('Buscar...')
    expect(searchInput).toBeInTheDocument()

    // Itens devem estar visíveis
    expect(screen.getByText('Dona Francisca (Quarto 101)')).toBeInTheDocument()
    expect(screen.getByText('Sr. Antônio (Quarto 102)')).toBeInTheDocument()

    // Filtra digitando "antonio" (sem acento, o item original é Antônio)
    fireEvent.change(searchInput, { target: { value: 'antonio' } })

    expect(screen.getByText('Sr. Antônio (Quarto 102)')).toBeInTheDocument()
    expect(screen.queryByText('Dona Francisca (Quarto 101)')).not.toBeInTheDocument()
  })

  it('exibe mensagem amigável quando nenhum item corresponde à busca', async () => {
    render(
      <SearchableSelect
        placeholder="Selecione..."
        options={[
          { value: '1', label: 'Losartana 50mg' },
          { value: '2', label: 'Dipirona 500mg' },
        ]}
      />
    )

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)

    const searchInput = await screen.findByPlaceholderText('Buscar...')
    fireEvent.change(searchInput, { target: { value: 'Paracetamol' } })

    expect(screen.getByText('Nenhum resultado encontrado')).toBeInTheDocument()
    expect(screen.queryByText('Losartana 50mg')).not.toBeInTheDocument()
  })

  it('funciona também com a sintaxe declarativa Select + SelectContent + SelectItem com busca automática', async () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="enf">Enfermeiro(a)</SelectItem>
          <SelectItem value="cuid">Cuidador(a)</SelectItem>
          <SelectItem value="med">Médico(a)</SelectItem>
        </SelectContent>
      </Select>
    )

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)

    const searchInput = await screen.findByPlaceholderText('Buscar...')
    expect(searchInput).toBeInTheDocument()

    // Filtra por "cuid"
    fireEvent.change(searchInput, { target: { value: 'cuid' } })

    expect(screen.getByText('Cuidador(a)')).toBeInTheDocument()
    expect(screen.queryByText('Médico(a)')).not.toBeInTheDocument()
  })
})
