import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from '../../pages/LandingPage'

describe('LandingPage Component (Página Institucional & Planos)', () => {
  it('renderiza o cabeçalho, slogan de autoridade sanitária e CTAs principais', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    // Headline e proposta de valor
    expect(screen.getByText(/Elimine erros de medicação e blinde sua ILPI contra/i)).toBeInTheDocument()
    expect(screen.getByText(/fiscalizações sanitárias/i)).toBeInTheDocument()

    // Badges de autoridade
    expect(screen.getByText(/Software Especialista para ILPIs & Residências Geriátricas/i)).toBeInTheDocument()
    expect(screen.getByText(/Conformidade RDC 502\/611 ANVISA/i)).toBeInTheDocument()

    // Botões de ação
    expect(screen.getAllByText(/Ver Planos & Preços/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Acessar Demonstração Pronta/i)).toBeInTheDocument()
  })

  it('exibe os 4 planos e permite alternar entre faturamento mensal e anual', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    // 4 Planos
    expect(screen.getByText('Plano Compacto')).toBeInTheDocument()
    expect(screen.getByText('Clínico & Compliance')).toBeInTheDocument()
    expect(screen.getByText('Plano Avançado')).toBeInTheDocument()
    expect(screen.getByText('Redes & Enterprise')).toBeInTheDocument()

    // Preço mensal inicial
    expect(screen.getByText('450,00')).toBeInTheDocument()
    expect(screen.getByText('890,00')).toBeInTheDocument()

    // Alterna para anual (-15%)
    const switchAnual = screen.getByRole('switch')
    fireEvent.click(switchAnual)

    // Preços com desconto
    expect(screen.getByText('382,50')).toBeInTheDocument()
    expect(screen.getByText('756,50')).toBeInTheDocument()
  })

  it('permite abrir e fechar itens do FAQ', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const perguntaAnvisa = screen.getByText(/O sistema atende integralmente à RDC 502\/2021 da ANVISA\?/i)
    expect(perguntaAnvisa).toBeInTheDocument()

    // Inicialmente a resposta não está no DOM
    expect(screen.queryByText(/O Senecurare foi construído especificamente para ILPIs/i)).not.toBeInTheDocument()

    // Clica para expandir
    fireEvent.click(perguntaAnvisa)
    expect(screen.getByText(/O Senecurare foi construído especificamente para ILPIs/i)).toBeInTheDocument()

    // Clica novamente para recolher
    fireEvent.click(perguntaAnvisa)
    expect(screen.queryByText(/O Senecurare foi construído especificamente para ILPIs/i)).not.toBeInTheDocument()
  })
})
