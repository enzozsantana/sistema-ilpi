import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Teleconsulta from '../../pages/Teleconsulta'
import { useAuth } from '../../contexts/AuthContext'
import { useIlpiData } from '../../contexts/IlpiDataContext'
import { definirPlanoAtivo } from '../../lib/plans'

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
    definirPlanoAtivo('avancado')

    vi.mocked(useAuth).mockReturnValue({
      profissional: { id: 'prof_rt', nome: 'Helena Prado', cat: 'rt' },
    } as any)

    vi.mocked(useIlpiData).mockReturnValue({
      residentes: mockResidentes,
      refresh: vi.fn(),
    } as any)
  })

  it('renderiza os 4 especialistas virtuais com foto, clínica e valor', () => {
    render(
      <MemoryRouter>
        <Teleconsulta />
      </MemoryRouter>
    )

    // Verifica presença da Dra. Juliana (Médica), Enfª Patrícia (Estomaterapia), Camila (Nutri), Felipe (Psico)
    expect(screen.getByText('Dra. Juliana Mendes')).toBeInTheDocument()
    expect(screen.getByText('Médica Geriatra & Clínica Geral')).toBeInTheDocument()
    expect(screen.getByText('Enfª. Patrícia Alencar')).toBeInTheDocument()
    expect(screen.getByText('Enfermeira Estomaterapeuta (SOBEST)')).toBeInTheDocument()
    expect(screen.getByText('Nutr. Camila Bittencourt')).toBeInTheDocument()
    expect(screen.getByText('Psic. Felipe Vasconcelos')).toBeInTheDocument()

    // Verifica valores das consultas
    expect(screen.getByText('R$ 240,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 160,00')).toBeInTheDocument()
  })

  it('permite filtrar especialistas por especialidade', () => {
    render(
      <MemoryRouter>
        <Teleconsulta />
      </MemoryRouter>
    )

    // Filtra por Estomaterapia & Feridas
    const botaoEstoma = screen.getByRole('button', { name: 'Estomaterapia & Feridas' })
    fireEvent.click(botaoEstoma)

    expect(screen.getByText('Enfª. Patrícia Alencar')).toBeInTheDocument()
    expect(screen.queryByText('Dra. Juliana Mendes')).not.toBeInTheDocument()
  })

  it('abre o fluxo de agendamento, seleciona residente e horários do mês', () => {
    render(
      <MemoryRouter>
        <Teleconsulta />
      </MemoryRouter>
    )

    const botoesAgendar = screen.getAllByRole('button', { name: /Agendar Consulta/i })
    fireEvent.click(botoesAgendar[0]) // Clica em agendar na Dra. Juliana

    expect(screen.getByText(/Agendar com Dra. Juliana Mendes/i)).toBeInTheDocument()
    expect(screen.getByText(/Horários Disponíveis da Especialista/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Avançar para Pagamento/i })).toBeInTheDocument()
  })

  it('avança para a tela de pagamento via PIX ou Cartão e libera a sala virtual', async () => {
    render(
      <MemoryRouter>
        <Teleconsulta />
      </MemoryRouter>
    )

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
    render(
      <MemoryRouter>
        <Teleconsulta />
      </MemoryRouter>
    )

    // Vai para a aba de consultas agendadas
    const abaConsultas = screen.getByRole('button', { name: /Consultas Agendadas/i })
    fireEvent.click(abaConsultas)

    // Entra na sala virtual da consulta existente
    const botaoEntrar = screen.getByRole('button', { name: /Entrar na Sala Virtual/i })
    fireEvent.click(botaoEntrar)

    // Verifica que exibe a Prévia Estilo Google Meet com identificação e botões de mídia
    expect(screen.getByText(/Pronto\(a\) para participar\?/i)).toBeInTheDocument()
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

    // Após iniciar, a sala de vídeo nativa é conectada 100% em PT-BR com identificação e controles
    const salaVideo = screen.getByTitle('Sala de Vídeo Teleconsulta')
    expect(salaVideo).toBeInTheDocument()
    expect(screen.getByText(/Consulta ao Vivo/i)).toBeInTheDocument()
    expect(screen.getByText(/Atendimento de Sebastião Arruda/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Compartilhar Tela/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Voltar para Sala de Espera/i })).toBeInTheDocument()
  })

  it('bloqueia cuidadores e perfil assistencial de solicitar consultas para evitar despesas não autorizadas', () => {
    vi.mocked(useAuth).mockReturnValue({
      profissional: { id: 'prof_cuid', nome: 'Maria Cuidadora', cat: 'cuid', funcao: 'Cuidadora de Idosos' },
    } as any)

    render(
      <MemoryRouter>
        <Teleconsulta />
      </MemoryRouter>
    )

    // Exibe banner de controle financeiro
    expect(
      screen.getByText(/Acesso Assistencial: Solicitação de teleconsulta restrita ao Responsável Financeiro/i),
    ).toBeInTheDocument()

    // Botões de agendamento ficam desabilitados como restritos ao financeiro
    const botoesRestritos = screen.getAllByRole('button', { name: /Restrito ao Financeiro/i })
    expect(botoesRestritos.length).toBeGreaterThanOrEqual(1)
    expect(botoesRestritos[0]).toBeDisabled()

    // Não deve haver botões habilitados de "Agendar Consulta"
    expect(screen.queryByRole('button', { name: /^Agendar Consulta$/i })).not.toBeInTheDocument()
  })

  it('exibe autorização da clínica e responsável familiar no modal quando aberto pelo responsável financeiro / RT', () => {
    vi.mocked(useAuth).mockReturnValue({
      profissional: { id: 'prof_fin', nome: 'Carlos Gerente', cat: 'gestao', funcao: 'Gestor Financeiro' },
    } as any)

    render(
      <MemoryRouter>
        <Teleconsulta />
      </MemoryRouter>
    )

    const botoesAgendar = screen.getAllByRole('button', { name: /Agendar Consulta/i })
    fireEvent.click(botoesAgendar[0])

    expect(screen.getByText(/Solicitação Autorizada pela Clínica/i)).toBeInTheDocument()
    expect(screen.getByText(/Carlos Gerente/i)).toBeInTheDocument()
    expect(screen.getByText(/Gestor Financeiro/i)).toBeInTheDocument()
  })

  it('especialista externo (tele_especialista) entra direto na aba de consultas e não vê cadastro de especialista', () => {
    vi.mocked(useAuth).mockReturnValue({
      profissional: {
        id: 'prof_ext',
        nome: 'Dra. Juliana Mendes',
        cat: 'tele_especialista',
        funcao: 'Médica Geriatra',
      },
    } as any)

    render(
      <MemoryRouter>
        <Teleconsulta />
      </MemoryRouter>
    )

    // Não exibe o botão de auto-cadastro pois já é um especialista credenciado
    expect(screen.queryByRole('button', { name: /Cadastrar como Especialista/i })).not.toBeInTheDocument()

    // O banner de consultório virtual independente deve estar presente
    expect(screen.getByText(/Consultório Virtual de Dra. Juliana Mendes/i)).toBeInTheDocument()
  })

  it('permite que qualquer especialista visualize a rede e se cadastre mesmo em plano compacto, bloqueando apenas a solicitação de consulta pela clínica com modal de upgrade', () => {
    definirPlanoAtivo('compacto')

    render(
      <MemoryRouter>
        <Teleconsulta />
      </MemoryRouter>
    )

    // A vitrine deve estar aberta mesmo em plano compacto
    expect(screen.getByText('Dra. Juliana Mendes')).toBeInTheDocument()
    expect(screen.getByText(/Solicitação de Teleconsultas pela ILPI: Recurso do Plano Avançado/i)).toBeInTheDocument()

    // O botão de cadastro de especialista deve estar presente e visível
    const btnCadastro = screen.getByRole('button', { name: /Cadastrar como Especialista/i })
    expect(btnCadastro).toBeInTheDocument()

    // O botão no card de cada especialista deve convidar para Upgrade em vez de permitir agendar direto
    const btnUpgrade = screen.getAllByRole('button', { name: /Upgrade para Agendar/i })[0]
    expect(btnUpgrade).toBeInTheDocument()

    // Ao clicar no botão de upgrade, abre o modal explicativo
    fireEvent.click(btnUpgrade)
    expect(screen.getByText(/Solicitação Restrita ao Plano Avançado/i)).toBeInTheDocument()
    expect(screen.getByText(/Cadastro 100% gratuito de médicos e especialistas independentes na rede/i)).toBeInTheDocument()
  })
})
