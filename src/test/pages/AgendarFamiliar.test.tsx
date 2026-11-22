import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AgendarFamiliar from '../../pages/AgendarFamiliar'
import { obterConsultasVirtuais, salvarConsultaVirtual } from '../../lib/teleconsultaStorage'
import type { ConsultaVirtual } from '../../types/teleconsulta'

describe('AgendarFamiliar Page (Portal do Responsável Financeiro)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.scrollTo = vi.fn()
  })

  it('renderiza o cabeçalho público, dados do residente e vitrine de especialistas', () => {
    render(
      <MemoryRouter initialEntries={['/agendar-familiar/r1?nome=Sebastiao%20Arruda']}>
        <Routes>
          <Route path="/agendar-familiar/:residenteId" element={<AgendarFamiliar />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(/Portal do Responsável/i)).toBeInTheDocument()
    expect(screen.getByText(/Teleconsulta para Sebastiao Arruda/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Dra. Juliana Mendes/i)[0]).toBeInTheDocument()
    expect(screen.getByText(/Enfª. Patrícia Alencar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Avançar para Identificação/i })).toBeInTheDocument()
  })

  it('permite avançar para dados do responsável financeiro e preencher formulário', () => {
    render(
      <MemoryRouter initialEntries={['/agendar-familiar/r1?nome=Sebastiao%20Arruda']}>
        <Routes>
          <Route path="/agendar-familiar/:residenteId" element={<AgendarFamiliar />} />
        </Routes>
      </MemoryRouter>,
    )

    // Avança para a etapa de identificação
    const btnAvancar = screen.getByRole('button', { name: /Avançar para Identificação/i })
    fireEvent.click(btnAvancar)

    expect(screen.getByText(/Identificação do Responsável Financeiro \/ Familiar/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Nome de quem está solicitando\/pagando/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/\(11\) 99999-9999/i)).toBeInTheDocument()
  })

  it('valida preenchimento obrigatório antes de avançar para pagamento', () => {
    render(
      <MemoryRouter initialEntries={['/agendar-familiar/r1?nome=Sebastiao%20Arruda']}>
        <Routes>
          <Route path="/agendar-familiar/:residenteId" element={<AgendarFamiliar />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Avançar para Identificação/i }))

    // Tenta avançar sem preencher nome
    const btnPagamento = screen.getByRole('button', { name: /Avançar para Pagamento/i })
    fireEvent.click(btnPagamento)

    // Continua na tela de dados
    expect(screen.getByText(/Identificação do Responsável Financeiro \/ Familiar/i)).toBeInTheDocument()
  })

  it('conclui o pagamento via PIX/Cartão e confirma a teleconsulta na agenda', async () => {
    render(
      <MemoryRouter initialEntries={['/agendar-familiar/r1?nome=Sebastiao%20Arruda']}>
        <Routes>
          <Route path="/agendar-familiar/:residenteId" element={<AgendarFamiliar />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Avançar para Identificação/i }))

    // Preenche identificação
    const inputNome = screen.getByPlaceholderText(/Nome de quem está solicitando\/pagando/i)
    fireEvent.change(inputNome, { target: { value: 'Carlos Arruda (Filho)' } })

    const inputTel = screen.getByPlaceholderText(/\(11\) 99999-9999/i)
    fireEvent.change(inputTel, { target: { value: '11988887777' } })

    fireEvent.click(screen.getByRole('button', { name: /Avançar para Pagamento/i }))

    // Etapa de pagamento
    expect(screen.getByText(/Forma de Pagamento Segura/i)).toBeInTheDocument()
    expect(screen.getByText(/PIX Instantâneo/i)).toBeInTheDocument()

    // Confirma pagamento
    const btnPagar = screen.getByRole('button', { name: /Confirmar Pagamento & Agendar/i })
    fireEvent.click(btnPagar)

    // Sucesso
    await waitFor(() => {
      expect(screen.getByText(/Teleconsulta Confirmada com Sucesso!/i)).toBeInTheDocument()
      expect(screen.getByText(/Abrir Sala Virtual no Horário/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    const consultas = obterConsultasVirtuais()
    const criada = consultas.find((c) => c.responsavelFinanceiroResidente === 'Carlos Arruda (Filho)')
    expect(criada).toBeDefined()
    expect(criada?.status).toBe('confirmada')
    expect(criada?.pago).toBe(true)
  })

  it('permite quitar consulta pré-agendada via rota de pagamento direto', async () => {
    const consultaPendente: ConsultaVirtual = {
      id: 'cv_pendente_1',
      profissionalId: 'prof_dra_juliana',
      profissionalNome: 'Dra. Juliana Mendes',
      especialidade: 'Medicina Geriátrica',
      registro: 'CRM-SP 184.290',
      clinica: 'Clínica Longevidade',
      residenteId: 'r1',
      residenteNome: 'Sebastião Arruda',
      data: '2026-11-25',
      horario: '10:00',
      valor: 240,
      metodoPagamento: 'pix',
      pago: false,
      linkSala: 'https://p2p.mirotalk.com/join/sala-pend',
      codigoSala: 'sala-pend',
      status: 'pendente_pagamento',
      criadoEm: new Date().toISOString(),
    }
    salvarConsultaVirtual(consultaPendente)

    render(
      <MemoryRouter initialEntries={['/pagar-teleconsulta/cv_pendente_1']}>
        <Routes>
          <Route path="/pagar-teleconsulta/:consultaId" element={<AgendarFamiliar />} />
        </Routes>
      </MemoryRouter>,
    )

    // Abre direto no resumo e pagamento
    expect(screen.getByText(/Resumo da Contratação/i)).toBeInTheDocument()
    expect(screen.getByText(/R\$ 240,00/i)).toBeInTheDocument()

    const btnPagar = screen.getByRole('button', { name: /Confirmar Pagamento & Agendar/i })
    fireEvent.click(btnPagar)

    await waitFor(() => {
      expect(screen.getByText(/Teleconsulta Confirmada com Sucesso!/i)).toBeInTheDocument()
    })

    const consultas = obterConsultasVirtuais()
    const atualizada = consultas.find((c) => c.id === 'cv_pendente_1')
    expect(atualizada?.pago).toBe(true)
    expect(atualizada?.status).toBe('confirmada')
  })
})
