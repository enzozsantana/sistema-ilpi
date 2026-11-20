import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PasswordInput } from '../../components/ui/password-input'

describe('PasswordInput Component', () => {
  it('renderiza como campo de senha por padrão', () => {
    render(<PasswordInput placeholder="Digite sua senha" />)
    const input = screen.getByPlaceholderText('Digite sua senha') as HTMLInputElement
    expect(input.type).toBe('password')
  })

  it('alterna visibilidade da senha e label de acessibilidade ao clicar no botão do olhinho', () => {
    render(
      <PasswordInput
        placeholder="Digite sua senha"
        showPasswordLabel="Ver senha"
        hidePasswordLabel="Esconder senha"
      />
    )
    const input = screen.getByPlaceholderText('Digite sua senha') as HTMLInputElement
    const toggleBtn = screen.getByRole('button', { name: 'Ver senha' })

    // Inicialmente oculto
    expect(input.type).toBe('password')

    // Clica para exibir
    fireEvent.click(toggleBtn)
    expect(input.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Esconder senha' })).toBeInTheDocument()

    // Clica para ocultar
    fireEvent.click(screen.getByRole('button', { name: 'Esconder senha' }))
    expect(input.type).toBe('password')
    expect(screen.getByRole('button', { name: 'Ver senha' })).toBeInTheDocument()
  })
})
