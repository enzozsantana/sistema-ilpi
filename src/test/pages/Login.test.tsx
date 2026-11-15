import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../../pages/Login'
import { useAuth } from '../../contexts/AuthContext'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('Login Page', () => {
  const mockSignIn = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      loading: false,
      profissional: null,
      signIn: mockSignIn,
      signOut: vi.fn(),
      refreshProfissional: vi.fn(),
      salvarDadosPerfil: vi.fn(),
      atualizarFoto: vi.fn(),
      removerFoto: vi.fn(),
      alterarSenha: vi.fn(),
    })
  })

  it('renderiza os campos de e-mail e senha com a nova identidade visual', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByText('Entrar no sistema')).toBeInTheDocument()
    expect(screen.getByLabelText(/E-mail institucional/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Senha de acesso/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Entrar no Plantão/i })).toBeInTheDocument()
  })

  it('preenche automaticamente a conta de demonstração ao clicar no botão rápido', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    const btnDemo = screen.getByRole('button', { name: /Preencher dados de demonstração/i })
    fireEvent.click(btnDemo)

    const inputEmail = screen.getByLabelText(/E-mail institucional/i) as HTMLInputElement
    const inputSenha = screen.getByLabelText(/Senha de acesso/i) as HTMLInputElement

    expect(inputEmail.value).toBe('s1@ilpi.demo')
    expect(inputSenha.value).toBe('ILPI-Demo-2026!')
  })

  it('alterna a visualização da senha entre oculta e visível ao clicar no ícone de olho', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    const inputSenha = screen.getByLabelText(/Senha de acesso/i) as HTMLInputElement
    expect(inputSenha.type).toBe('password')

    const btnVer = screen.getByRole('button', { name: /Exibir senha/i })
    fireEvent.click(btnVer)
    expect(inputSenha.type).toBe('text')

    const btnOcultar = screen.getByRole('button', { name: /Ocultar senha/i })
    fireEvent.click(btnOcultar)
    expect(inputSenha.type).toBe('password')
  })

  it('chama signIn e exibe mensagem de erro se a autenticação falhar', async () => {
    mockSignIn.mockResolvedValueOnce({ erro: 'E-mail ou senha incorretos.' })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    const inputEmail = screen.getByLabelText(/E-mail institucional/i)
    const inputSenha = screen.getByLabelText(/Senha de acesso/i)
    const btnEntrar = screen.getByRole('button', { name: /Entrar no Plantão/i })

    fireEvent.change(inputEmail, { target: { value: 'errado@ilpi.demo' } })
    fireEvent.change(inputSenha, { target: { value: 'senha123' } })
    fireEvent.click(btnEntrar)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('errado@ilpi.demo', 'senha123')
      expect(screen.getByText('E-mail ou senha incorretos.')).toBeInTheDocument()
    })
  })
})
