import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Teleconsulta from '../../pages/Teleconsulta'
import { useAuth } from '../../contexts/AuthContext'
import { useIlpiData } from '../../contexts/IlpiDataContext'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../contexts/IlpiDataContext', () => ({
  useIlpiData: vi.fn(),
}))

describe('Teleconsulta Page', () => {
  const mockResidentes = [
    {
      id: 'r1',
      nome: 'Sebastião Arruda',
      quarto: '4',
      nasc: '1945-05-12',
      convenio: 'SUS',
      alergias: ['Dipirona'],
    },
    {
      id: 'r2',
      nome: 'Maria da Penha',
      quarto: '2',
      nasc: '1940-02-20',
      convenio: 'Unimed',
      alergias: [],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    vi.mocked(useAuth).mockReturnValue({
      profissional: { id: 'prof_rt', nome: 'Helena Prado', cat: 'rt' },
    } as any)

    vi.mocked(useIlpiData).mockReturnValue({
      residentes: mockResidentes,
      refresh: vi.fn(),
    } as any)
  })

  it('renderiza os 4 especialistas virtuais com foto, clínica e valor', () => {
    render(<Teleconsulta />)

    // Verifica presença da Dra. Juliana (Médica), Enfª Patrícia (Estomaterapia), Camila (Nutri), Felipe (Psico)
    expect(screen.getByText('Dra. Juliana Mendes')).toBeInTheDocument()
    expect(screen.getByText('Médica Geriatra & Clínica Geral')).toBeInTheDocument()
    expect(screen.getByText('Enfª. Patrícia Alencar')).toBeInTheDocument()
    expect(screen.getByText('Enfermeira Estomaterapeuta (SOBEST)')).toBeInTheDocument()
    expect(screen.getByText('Nutr. Camila Bittencourt')).toBeInTheDocument()
    expect(screen.getByText('Psic. Felipe Vasconcelos')).toBeInTheDocument()

    // Verifica valores das consultas
    expect(screen.getByText('R$ 220,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 160,00')).toBeInTheDocument()
  })

  it('permite filtrar especialistas por especialidade', () => {
    render(<Teleconsulta />)

    // Filtra por Estomaterapia & Feridas
    const botaoEstoma = screen.getByRole('button', { name: 'Estomaterapia & Feridas' })
    fireEvent.click(botaoEstoma)

    expect(screen.getByText('Enfª. Patrícia Alencar')).toBeInTheDocument()
    expect(screen.queryByText('Dra. Juliana Mendes')).not.toBeInTheDocument()
  })

  it('abre o fluxo de agendamento, seleciona residente e horários do mês', () => {
    render(<Teleconsulta />)

    const botoesAgendar = screen.getAllByRole('button', { name: /Agendar Consulta/i })
    fireEvent.click(botoesAgendar[0]) // Clica em agendar na Dra. Juliana

    expect(screen.getByText(/Agendar com Dra. Juliana Mendes/i)).toBeInTheDocument()
    expect(screen.getByText(/Horários Disponíveis da Especialista/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Avançar para Pagamento/i })).toBeInTheDocument()
  })

  it('avança para a tela de pagamento via PIX ou Cartão e libera a sala virtual', async () => {
    render(<Teleconsulta />)

    const botoesAgendar = screen.getAllByRole('button', { name: /Agendar Consulta/i })
    fireEvent.click(botoesAgendar[0]) // Dra. Juliana

    // Avança para o checkout
    fireEvent.click(screen.getByRole('button', { name: /Avançar para Pagamento/i }))

    expect(screen.getByText(/Pagamento da Consulta/i)).toBeInTheDocument()
    expect(screen.getByText(/PIX \(Instantâneo\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Cartão de Crédito/i)).toBeInTheDocument()

    // Confirma pagamento
    const botaoConfirmar = screen.getByRole('button', { name: /Confirmar Pagamento/i })
    fireEvent.click(botaoConfirmar)

    // Deve exibir o feedback de sucesso e liberação da sala
    await waitFor(() => {
      expect(screen.getByText(/Pagamento Confirmado & Consulta Liberada!/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Entrar na Sala Virtual Agora/i })).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('exibe a Sala de Espera Virtual com prévia estilo Google Meet e permite controlar microfone e câmera', async () => {
    render(<Teleconsulta />)

    // Vai para a aba de consultas agendadas
    const abaConsultas = screen.getByRole('button', { name: /Consultas Agendadas/i })
    fireEvent.click(abaConsultas)

    // Entra na sala virtual da consulta existente
    const botaoEntrar = screen.getByRole('button', { name: /Entrar na Sala Virtual/i })
    fireEvent.click(botaoEntrar)

    // Verifica que exibe a Prévia Estilo Google Meet com identificação e botões de mídia
    expect(screen.getByText(/Pronto para participar\?/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Sala de Espera Virtual/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Controle do Prestador \/ Moderador/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Identificado como:/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Helena Prado/i).length).toBeGreaterThanOrEqual(1)

    // Botões de alternar microfone e câmera estilo Google Meet
    const botaoMic = screen.getByRole('button', { name: /Silenciar microfone/i })
    const botaoCam = screen.getByRole('button', { name: /Desativar câmera/i })
    expect(botaoMic).toBeInTheDocument()
    expect(botaoCam).toBeInTheDocument()

    // Clica para desativar câmera e verifica que o botão alterna
    fireEvent.click(botaoCam)
    expect(screen.getByRole('button', { name: /Ativar câmera/i })).toBeInTheDocument()
    expect(screen.getByText(/A câmera está desativada/i)).toBeInTheDocument()

    // O prestador/moderador clica para Iniciar o Atendimento e conectar a chamada
    const botaoIniciar = screen.getByRole('button', { name: /Iniciar Consulta & Conectar Chamada/i })
    fireEvent.click(botaoIniciar)

    // Após iniciar, a sala de vídeo é conectada sem 'conexão recusada' e com identificação
    const iframe = screen.getByTitle('Sala de Vídeo Teleconsulta')
    expect(iframe).toBeInTheDocument()
    const src = iframe.getAttribute('src') || ''
    expect(src).toContain('p2p.mirotalk.com/join')
    expect(src).toContain('name=Helena%20Prado')
  })
})
