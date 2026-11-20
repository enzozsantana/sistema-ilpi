import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CurrencyInput } from '../../components/ui/currency-input'

describe('CurrencyInput Component - Input com Máscara de Real', () => {
  it('renderiza o valor inicial formatado com máscara de Real', () => {
    render(<CurrencyInput defaultValue={200} />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('R$ 200,00')
  })

  it('aplica a máscara de Real e aciona onChangeValue com o float numérico ao digitar', () => {
    const handleValue = vi.fn()
    render(<CurrencyInput onChangeValue={handleValue} />)

    const input = screen.getByRole('textbox') as HTMLInputElement

    // Digita "25000" correspondendo a R$ 250,00
    fireEvent.change(input, { target: { value: '25000' } })

    expect(input.value).toBe('R$ 250,00')
    expect(handleValue).toHaveBeenCalledWith(250)
  })

  it('limpa o campo quando os caracteres são apagados', () => {
    const handleValue = vi.fn()
    render(<CurrencyInput defaultValue={150} onChangeValue={handleValue} />)

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('R$ 150,00')

    fireEvent.change(input, { target: { value: '' } })
    expect(input.value).toBe('')
    expect(handleValue).toHaveBeenCalledWith(0)
  })
})
