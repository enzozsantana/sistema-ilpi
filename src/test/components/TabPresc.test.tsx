import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TabPresc } from '../../pages/residente/Tabs'
import { useAuth } from '../../contexts/AuthContext'
import { useIlpiData } from '../../contexts/IlpiDataContext'
import { supabase } from '../../lib/supabase'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../contexts/IlpiDataContext', () => ({
  useIlpiData: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('TabPresc Component (Edição e Gestão de Prescrições)', () => {
  const mockRefresh = vi.fn()
  const mockResidente = {
    id: 'r1',
    nome: 'Sebastião Arruda',
    quarto: '4',
    presc: [
      {
        id: 'p_losartana',
        med: 'Losartana Potássica 50 mg',
        dose: '1 cp',
        via: 'VO',
        tipo: 'diario' as const,
        horarios: ['08:00'],
        inicio: '2026-01-01',
        consumo: 1,
        estoqueId: null,
        suspensa: false,
        controlado: false,
        obs: 'Tomar pela manhã',
      },
      {
        id: 'p_clonazepam',
        med: 'Clonazepam 2 mg',
        dose: '0.5 cp',
        via: 'VO',
        tipo: 'diario' as const,
        horarios: ['20:00'],
        inicio: '2026-01-01',
        consumo: 0.5,
        estoqueId: null,
        suspensa: true,
        controlado: true,
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      profissional: { id: 'prof_med', nome: 'Dr. Roberto', cat: 'med' },
    } as any)

    vi.mocked(useIlpiData).mockReturnValue({
      refresh: mockRefresh,
    } as any)
  })

  it('exibe o botão Editar para prescrições vigentes', () => {
    render(<TabPresc r={mockResidente as any} cat="med" profNome={() => 'Dr. Roberto'} />)

    const botoesEditar = screen.getAllByRole('button', { name: /Editar/i })
    expect(botoesEditar.length).toBe(1) // Apenas Losartana (vigente); Clonazepam está suspenso no histórico
  })

  it('abre o modal preenchido com a posologia atual ao clicar em Editar', () => {
    render(<TabPresc r={mockResidente as any} cat="med" profNome={() => 'Dr. Roberto'} />)

    const botaoEditar = screen.getByRole('button', { name: /Editar/i })
    fireEvent.click(botaoEditar) // Editar Losartana

    expect(screen.getByText('Editar Prescrição Médica')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Losartana Potássica 50 mg')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1 cp')).toBeInTheDocument()
    expect(screen.getByDisplayValue('08:00')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Tomar pela manhã')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeInTheDocument()
  })

  it('salva a edição da posologia no banco chamando supabase.update', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    vi.mocked(supabase.from).mockReturnValue({
      update: updateMock,
    } as any)

    render(<TabPresc r={mockResidente as any} cat="med" profNome={() => 'Dr. Roberto'} />)

    const botaoEditar = screen.getByRole('button', { name: /Editar/i })
    fireEvent.click(botaoEditar) // Editar Losartana

    // Altera a dose de 1 cp para 2 cp e o horário
    const inputDose = screen.getByDisplayValue('1 cp')
    fireEvent.change(inputDose, { target: { value: '2 cp' } })

    const inputHor = screen.getByDisplayValue('08:00')
    fireEvent.change(inputHor, { target: { value: '08:00, 20:00' } })

    // Submete o formulário
    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('prescricoes')
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          dose: '2 cp',
          horarios: ['08:00', '20:00'],
        })
      )
    })
  })

  it('ao clicar em Suspender, abre modal solicitando justificativa clínica e encaminha para enfermagem', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    vi.mocked(supabase.from).mockReturnValue({
      update: updateMock,
    } as any)

    render(<TabPresc r={mockResidente as any} cat="med" profNome={() => 'Dr. Roberto'} />)

    // Clica em Suspender no Losartana
    const botaoSuspender = screen.getByRole('button', { name: /Suspender/i })
    fireEvent.click(botaoSuspender)

    // Modal de suspensão aberto com justificativa obrigatória
    expect(screen.getByText('Suspender Medicamento')).toBeInTheDocument()
    expect(screen.getByText(/Informe a justificativa clínica para a suspensão/i)).toBeInTheDocument()

    // Preenche a justificativa
    const textareaJustificativa = screen.getByPlaceholderText(/Descreva o motivo clínico da suspensão/i)
    fireEvent.change(textareaJustificativa, { target: { value: 'Efeito adverso: hipotensão postural acentuada' } })

    // Clica no botão de enviar para enfermagem
    const botaoEnviar = screen.getByRole('button', { name: /Solicitar Suspensão \(Enviar p\/ Enfermagem\)/i })
    fireEvent.click(botaoEnviar)

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('prescricoes')
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          assinatura: expect.objectContaining({
            suspensao: expect.objectContaining({
              justificativa: 'Efeito adverso: hipotensão postural acentuada',
              status: 'pendente_enfermagem',
            }),
          }),
        })
      )
    })
  })

  it('não exibe botão de reativar para medicamentos descontinuados (não polui receita)', () => {
    render(<TabPresc r={mockResidente as any} cat="med" profNome={() => 'Dr. Roberto'} />)

    // Não deve existir botão "Reativar" na tela
    expect(screen.queryByRole('button', { name: /Reativar/i })).not.toBeInTheDocument()

    // O histórico de medicamentos suspensos deve estar presente
    expect(screen.getByText(/Histórico de Medicamentos Suspensos \/ Desprescrições/i)).toBeInTheDocument()
  })
})
