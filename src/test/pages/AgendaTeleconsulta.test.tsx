import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AgendaTeleconsulta from '../../pages/AgendaTeleconsulta'
import { useAuth } from '../../contexts/AuthContext'
import { useIlpiData } from '../../contexts/IlpiDataContext'
import { salvarConsultaVirtual, obterConsultasVirtuais } from '../../lib/teleconsultaStorage'
import type { ConsultaVirtual } from '../../types/teleconsulta'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../contexts/IlpiDataContext', () => ({
  useIlpiData: vi.fn(),
}))

describe('AgendaTeleconsulta Page', () => {
  const mockResidentes = [
    {
      id: 'r1',
      nome: 'Sebastião Arruda',
      quarto: '4',
      nasc: '1945-05-12',
      convenio: 'SUS',
      status: 'ativo',
    },
    {
      id: 'r2',
      nome: 'Maria da Penha',
      quarto: '2',
      nasc: '1940-02-20',
      convenio: 'Unimed',
      status: 'ativo',
    },
  ]

  const hojeIso = new Date().toISOString().split('T')[0]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    vi.mocked(useAuth).mockReturnValue({
      profissional: {
        id: 'prof_rt',
        nome: 'Dra. Helena Prado',
        cat: 'rt',
        funcao: 'Responsável Técnica',
      },
    } as any)

    vi.mocked(useIlpiData).mockReturnValue({
      residentes: mockResidentes,
      refresh: vi.fn(),
    } as any)

    // Insere consulta exemplo no dia de hoje
    const consultaHoje: ConsultaVirtual = {
      id: 'cv_agenda_1',
      profissionalId: 'prof_dra_juliana',
      profissionalNome: 'Dra. Juliana Mendes',
      especialidade: 'Medicina Geriátrica',
      registro: 'CRM-SP 184.290',
      clinica: 'Clínica Longevidade Ativa',
      residenteId: 'r1',
      residenteNome: 'Sebastião Arruda',
      data: hojeIso,
      horario: '14:00',
      valor: 240,
      metodoPagamento: 'pix',
      pago: true,
      linkSala: 'https://p2p.mirotalk.com/join/sala-hoje',
      codigoSala: 'sala-hoje',
      status: 'confirmada',
      motivo: 'Revisão periódica de polifarmácia',
      criadoEm: new Date().toISOString(),
    }
    salvarConsultaVirtual(consultaHoje)
  })

  it('renderiza o cabeçalho, KPIs e informações do especialista ativo', () => {
    render(
      <MemoryRouter>
        <AgendaTeleconsulta />
      </MemoryRouter>,
    )

    expect(screen.getByText('Agenda de Teleconsultas')).toBeInTheDocument()
    expect(screen.getByText(/Gestão de horários, bloqueios de atendimento e consultas virtuais/i)).toBeInTheDocument()

    // KPIs
    expect(screen.getByText(/Próximos 7 Dias/i)).toBeInTheDocument()
    expect(screen.getByText(/Repasse Previsto \(80%\)/i)).toBeInTheDocument()

    // Botões de ação
    expect(screen.getByRole('button', { name: /Novo Agendamento/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Disponibilidade & Folgas/i })).toBeInTheDocument()
  })

  it('permite alternar modos de visualização entre Dia, Semana e Lista Completa', () => {
    render(
      <MemoryRouter>
        <AgendaTeleconsulta />
      </MemoryRouter>,
    )

    // Por padrão está no modo Dia
    expect(screen.getByText(/Grade de Horários/i)).toBeInTheDocument()

    // Alterna para Lista Completa
    const btnLista = screen.getByRole('button', { name: /Lista Completa/i })
    fireEvent.click(btnLista)
    expect(screen.getByText(/Todas as Teleconsultas Registradas/i)).toBeInTheDocument()

    // Alterna para Semana
    const btnSemana = screen.getByRole('button', { name: /Semana/i })
    fireEvent.click(btnSemana)
    expect(screen.getAllByText(/Seg/i).length).toBeGreaterThan(0)
  })

  it('permite abrir o modal de configuração de disponibilidade e salvar alterações', async () => {
    render(
      <MemoryRouter>
        <AgendaTeleconsulta />
      </MemoryRouter>,
    )

    const btnConfig = screen.getByRole('button', { name: /Disponibilidade & Folgas/i })
    fireEvent.click(btnConfig)

    // Modal deve estar visível
    expect(screen.getByText(/Disponibilidade & Agenda de/i)).toBeInTheDocument()
    expect(screen.getByText(/Duração da Consulta \(minutos\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Bloqueios de Agenda & Folgas/i)).toBeInTheDocument()

    // Clica em Salvar Alterações
    const btnSalvar = screen.getByRole('button', { name: /Salvar Alterações/i })
    fireEvent.click(btnSalvar)

    await waitFor(() => {
      expect(screen.queryByText(/Duração da Consulta \(minutos\)/i)).not.toBeInTheDocument()
    })
  })

  it('permite abrir o modal de novo agendamento e marcar consulta diretamente na agenda', async () => {
    render(
      <MemoryRouter>
        <AgendaTeleconsulta />
      </MemoryRouter>,
    )

    const btnNovo = screen.getByRole('button', { name: /Novo Agendamento/i })
    fireEvent.click(btnNovo)

    expect(screen.getByText(/Novo Agendamento na Agenda/i)).toBeInTheDocument()
    expect(screen.getByText(/Residente Atendido/i)).toBeInTheDocument()

    // Preenche motivo
    const inputMotivo = screen.getByPlaceholderText(/Ex: Avaliação de lesão por pressão/i)
    fireEvent.change(inputMotivo, { target: { value: 'Avaliação geriátrica preventiva' } })

    // Confirma agendamento
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Agendamento/i })
    fireEvent.click(btnConfirmar)

    await waitFor(() => {
      const lista = obterConsultasVirtuais()
      const nova = lista.find((c) => c.motivo === 'Avaliação geriátrica preventiva')
      expect(nova).toBeDefined()
    })
  })

  it('permite reagendar uma teleconsulta existente para outro horário', async () => {
    render(
      <MemoryRouter>
        <AgendaTeleconsulta />
      </MemoryRouter>,
    )

    // Encontra o botão Reagendar da consulta
    const botoesReagendar = screen.getAllByRole('button', { name: /Reagendar/i })
    fireEvent.click(botoesReagendar[0])

    expect(screen.getByText(/Reagendar Teleconsulta/i)).toBeInTheDocument()
    expect(screen.getByText(/Horário Original:/i)).toBeInTheDocument()

    // Altera horário
    const inputs = screen.getAllByDisplayValue('14:00')
    const inputHorario = inputs[inputs.length - 1]
    fireEvent.change(inputHorario, { target: { value: '16:00' } })

    const btnSalvar = screen.getByRole('button', { name: /Salvar Novo Horário/i })
    fireEvent.click(btnSalvar)

    await waitFor(() => {
      const atualizadas = obterConsultasVirtuais()
      const alterada = atualizadas.find((c) => c.horario === '16:00')
      expect(alterada).toBeDefined()
    })
  })

  it('permite cancelar uma teleconsulta com justificativa', async () => {
    render(
      <MemoryRouter>
        <AgendaTeleconsulta />
      </MemoryRouter>,
    )

    const botoesCancelar = screen.getAllByTitle(/Cancelar atendimento/i)
    fireEvent.click(botoesCancelar[0])

    expect(screen.getByText(/Cancelar Teleconsulta/i)).toBeInTheDocument()
    expect(screen.getByText(/Justificativa do Cancelamento/i)).toBeInTheDocument()

    const inputMotivo = screen.getByPlaceholderText(/Ex: Residente internado externamente/i)
    fireEvent.change(inputMotivo, { target: { value: 'Paciente com febre encaminhado à UPA' } })

    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Cancelamento/i })
    fireEvent.click(btnConfirmar)

    await waitFor(() => {
      const canceladas = obterConsultasVirtuais().filter((c) => c.status === 'cancelada')
      expect(canceladas.length).toBeGreaterThan(0)
      expect(canceladas.some((c) => c.motivoCancelamento === 'Paciente com febre encaminhado à UPA')).toBe(true)
    })
  })
})
