import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Label } from '../../components/ui/label'

describe('Label Component - Sinalização de Campos Obrigatórios com Asterisco Vermelho', () => {
  it('destaca o asterisco * em vermelho quando presente no texto', () => {
    const { container } = render(<Label>Nome Completo *</Label>)

    // O texto completo continua acessível
    expect(screen.getByText(/Nome Completo/i)).toBeInTheDocument()

    // O asterisco é estilizado com classe de cor vermelha
    const asteriscoSpan = container.querySelector('.text-red-500')
    expect(asteriscoSpan).not.toBeNull()
    expect(asteriscoSpan?.textContent).toBe('*')
  })

  it('adiciona o asterisco vermelho automaticamente quando required={true}', () => {
    const { container } = render(<Label required>E-mail institucional</Label>)

    expect(screen.getByText(/E-mail institucional/i)).toBeInTheDocument()

    const asteriscoSpan = container.querySelector('.text-red-500')
    expect(asteriscoSpan).not.toBeNull()
    expect(asteriscoSpan?.textContent).toBe('*')
  })

  it('não duplica o asterisco se required={true} mas o texto já possui *', () => {
    const { container } = render(<Label required>Senha *</Label>)

    const asteriscos = container.querySelectorAll('.text-red-500')
    expect(asteriscos.length).toBe(1)
  })

  it('funciona com elementos filhos aninhados', () => {
    const { container } = render(
      <Label>
        <span>Endereço de Cobrança *</span>
      </Label>
    )

    const asteriscoSpan = container.querySelector('.text-red-500')
    expect(asteriscoSpan).not.toBeNull()
    expect(asteriscoSpan?.textContent).toBe('*')
  })
})
