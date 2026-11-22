import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Planos } from '../../pages/Planos'
import { definirPlanoAtivo, desativarPlanoVitalicio, ativarPlanoVitalicio } from '../../lib/plans'

describe('Página de Vendas de Planos (Planos.tsx)', () => {
  beforeEach(() => {
    localStorage.clear()
    desativarPlanoVitalicio()
    definirPlanoAtivo('clinico')
  })

  it('deve renderizar o cabeçalho, os 4 planos e a tabela comparativa', () => {
    render(
      <MemoryRouter>
        <Planos />
      </MemoryRouter>
    )

    // Título principal
    expect(screen.getByText(/Monte e Compare o Plano Ideal para sua ILPI/i)).toBeInTheDocument()

    // 4 Planos
    expect(screen.getAllByText('Plano Compacto').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Clínico & Compliance').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Plano Avançado').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Redes & Enterprise').length).toBeGreaterThan(0)

    // Badge de Plano Atual (Clinico)
    expect(screen.getByText('Plano Ativo na Clínica')).toBeInTheDocument()

    // Tabela comparativa
    expect(screen.getByText(/Comparativo Técnico & Sanitário Completo/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Usuários Profissionais e Cuidadores/i).length).toBeGreaterThan(0)
  })

  it('deve alternar preços entre faturamento mensal e anual com 15% de desconto', () => {
    render(
      <MemoryRouter>
        <Planos />
      </MemoryRouter>
    )

    // Inicial (Mensal por padrão): Compacto é 450,00, Clínico é 890,00
    expect(screen.getAllByText('450,00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('890,00').length).toBeGreaterThan(0)

    // Clica no switch para alternar para Anual
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)

    // Com desconto anual: Compacto é 382,50, Clínico é 756,50
    expect(screen.getAllByText('382,50').length).toBeGreaterThan(0)
    expect(screen.getAllByText('756,50').length).toBeGreaterThan(0)
  })

  it('deve abrir o modal de checkout ao clicar para assinar um plano', () => {
    render(
      <MemoryRouter>
        <Planos />
      </MemoryRouter>
    )

    // Clica para assinar o Plano Avançado
    const btnAvancado = screen.getByRole('button', { name: /Assinar Plano Avançado/i })
    fireEvent.click(btnAvancado)

    // Modal deve abrir com detalhes de pagamento
    expect(screen.getByText('Contratação Direta')).toBeInTheDocument()
    expect(screen.getByText('PIX Instantâneo')).toBeInTheDocument()
    expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument()
  })

  it('deve exibir o banner de Licença Vitalícia Ativa quando o plano vitalício está ativo', () => {
    ativarPlanoVitalicio('enterprise', 'Demonstração Homologada')

    render(
      <MemoryRouter>
        <Planos />
      </MemoryRouter>
    )

    expect(screen.getByText(/Licença Vitalícia Homologada Ativa \(Plano Enterprise\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Acesso Perpétuo/i)).toBeInTheDocument()
    expect(screen.getByText(/Vitalício Ativo/i)).toBeInTheDocument()
  })
})
