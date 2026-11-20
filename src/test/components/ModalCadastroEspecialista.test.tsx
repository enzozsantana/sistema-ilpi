import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { ModalCadastroEspecialista } from '../../components/ModalCadastroEspecialista'
import * as AuthContext from '../../contexts/AuthContext'

describe('ModalCadastroEspecialista Component', () => {
  const mockCadastrar = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      cadastrarEspecialista: mockCadastrar,
    } as any)
  })

  afterEach(() => {
    cleanup()
  })

  it('exibe campos de senha e confirmação de senha com botão de olhinho', () => {
    render(<ModalCadastroEspecialista open={true} onOpenChange={() => {}} />)

    const inputSenha = screen.getByPlaceholderText(/Mínimo 6 caracteres/i) as HTMLInputElement
    const inputConfirma = screen.getByPlaceholderText(/Repita a senha de acesso/i) as HTMLInputElement

    expect(inputSenha).toBeInTheDocument()
    expect(inputConfirma).toBeInTheDocument()

    expect(inputSenha.type).toBe('password')
    expect(inputConfirma.type).toBe('password')

    const btnVerSenha = screen.getByRole('button', { name: /Exibir senha de acesso/i })
    const btnVerConfirma = screen.getByRole('button', { name: /Exibir confirmação de senha/i })

    // Alterna visibilidade da senha
    fireEvent.click(btnVerSenha)
    expect(inputSenha.type).toBe('text')

    // Alterna visibilidade da confirmação
    fireEvent.click(btnVerConfirma)
    expect(inputConfirma.type).toBe('text')
  })

  it('valida divergência entre senha e confirmação de senha antes do envio', async () => {
    render(<ModalCadastroEspecialista open={true} onOpenChange={() => {}} />)

    fireEvent.change(screen.getByPlaceholderText('ex: Dr. Gabriel Antunes'), {
      target: { value: 'Dra. Maria Clara' },
    })
    fireEvent.change(screen.getByPlaceholderText(/gabriel@clinica\.med\.br/i), {
      target: { value: 'maria@clinica.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/CRM-SP 189432/i), {
      target: { value: 'CRM-SP 123456' },
    })

    const inputSenha = screen.getByPlaceholderText(/Mínimo 6 caracteres/i)
    const inputConfirma = screen.getByPlaceholderText(/Repita a senha de acesso/i)

    fireEvent.change(inputSenha, { target: { value: 'senha123' } })
    fireEvent.change(inputConfirma, { target: { value: 'senhaDiferente' } })

    const btnCadastrar = screen.getByRole('button', { name: /Concluir Cadastro & Abrir Consultório/i })
    fireEvent.click(btnCadastrar)

    await waitFor(() => {
      expect(
        screen.getByText('As senhas não coincidem. Digite a mesma senha nos dois campos.')
      ).toBeInTheDocument()
    })
    expect(mockCadastrar).not.toHaveBeenCalled()
  })

  it('permite envio quando a senha e a confirmação coincidem', async () => {
    mockCadastrar.mockResolvedValueOnce({ sucesso: true })
    const onOpenChange = vi.fn()

    render(<ModalCadastroEspecialista open={true} onOpenChange={onOpenChange} />)

    fireEvent.change(screen.getByPlaceholderText('ex: Dr. Gabriel Antunes'), {
      target: { value: 'Dra. Maria Clara' },
    })
    fireEvent.change(screen.getByPlaceholderText(/gabriel@clinica\.med\.br/i), {
      target: { value: 'maria@clinica.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/CRM-SP 189432/i), {
      target: { value: 'CRM-SP 123456' },
    })

    const inputSenha = screen.getByPlaceholderText(/Mínimo 6 caracteres/i)
    const inputConfirma = screen.getByPlaceholderText(/Repita a senha de acesso/i)

    fireEvent.change(inputSenha, { target: { value: 'senhaValida123' } })
    fireEvent.change(inputConfirma, { target: { value: 'senhaValida123' } })

    const btnCadastrar = screen.getByRole('button', { name: /Concluir Cadastro & Abrir Consultório/i })
    fireEvent.click(btnCadastrar)

    await waitFor(() => {
      expect(mockCadastrar).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Dra. Maria Clara',
          email: 'maria@clinica.com',
          senha: 'senhaValida123',
          registro: 'CRM-SP 123456',
        })
      )
    })
  })

  it('permite selecionar múltiplas especialidades e adicionar múltiplos títulos', async () => {
    mockCadastrar.mockResolvedValueOnce({ sucesso: true })
    render(<ModalCadastroEspecialista open={true} onOpenChange={() => {}} />)

    // Seleciona também Medicina Geriátrica (além de Estomaterapia já marcada)
    const btnMedicina = screen.getByRole('button', { name: /Medicina Geriátrica/i })
    fireEvent.click(btnMedicina)

    // Adiciona novo título
    const inputTitulo = screen.getByPlaceholderText(/Adicionar qualificação/i)
    fireEvent.change(inputTitulo, { target: { value: 'Mestre em Gerontologia pela USP' } })
    const btnAddTitulo = screen.getByRole('button', { name: /Adicionar/i })
    fireEvent.click(btnAddTitulo)

    // Verifica que o novo título foi adicionado aos badges
    expect(screen.getByText('Mestre em Gerontologia pela USP')).toBeInTheDocument()
    expect(screen.getByText('Especialista em Telemedicina')).toBeInTheDocument()

    // Preenche campos obrigatórios
    fireEvent.change(screen.getByPlaceholderText('ex: Dr. Gabriel Antunes'), {
      target: { value: 'Dr. Lucas Silveira' },
    })
    fireEvent.change(screen.getByPlaceholderText(/gabriel@clinica\.med\.br/i), {
      target: { value: 'lucas@clinica.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/CRM-SP 189432/i), {
      target: { value: 'CRM-SP 654321' },
    })

    const inputSenha = screen.getByPlaceholderText(/Mínimo 6 caracteres/i)
    const inputConfirma = screen.getByPlaceholderText(/Repita a senha de acesso/i)

    fireEvent.change(inputSenha, { target: { value: 'senhaForte123' } })
    fireEvent.change(inputConfirma, { target: { value: 'senhaForte123' } })

    const btnCadastrar = screen.getByRole('button', { name: /Concluir Cadastro & Abrir Consultório/i })
    fireEvent.click(btnCadastrar)

    await waitFor(() => {
      expect(mockCadastrar).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Dr. Lucas Silveira',
          especialidades: expect.arrayContaining(['estomaterapia', 'medica']),
          titulos: expect.arrayContaining([
            'Especialista em Telemedicina',
            'Mestre em Gerontologia pela USP',
          ]),
        })
      )
    })
  })
})
