import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Planos } from '../../pages/Planos'
import {
  definirPlanoAtivo,
  desativarPlanoVitalicio,
  ativarPlanoVitalicio,
  criarOuRenovarAssinatura,
} from '../../lib/plans'

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

  it('deve abrir o modal de checkout com contexto de upgrade ao clicar em um plano superior', () => {
    render(
      <MemoryRouter>
        <Planos />
      </MemoryRouter>
    )

    // Estando no Plano Clínico, o Plano Avançado deve oferecer Fazer Upgrade
    const btnAvancado = screen.getAllByRole('button', { name: /Upgrade.*Plano Avançado/i })[0]
    fireEvent.click(btnAvancado)

    // Modal deve abrir com detalhes contextuais de upgrade
    expect(screen.getByText(/Upgrade Imediato de Plano/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Upgrade para Plano Avançado/i })).toBeInTheDocument()
    expect(screen.getByText(/Todos os residentes cadastrados, prontuários e históricos são 100% preservados/i)).toBeInTheDocument()
    expect(screen.getByText('PIX Instantâneo')).toBeInTheDocument()
    expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument()
  })

  it('deve permitir upgrade com 1 clique utilizando cartão salvo da assinatura anterior', () => {
    // Configura assinatura prévia com cartão
    criarOuRenovarAssinatura('compacto', 'cartao', 'mensal', {
      numero: '4242424242429876',
      titular: 'DRA BEATRIZ',
      validade: '11/29',
    })

    render(
      <MemoryRouter>
        <Planos />
      </MemoryRouter>
    )

    const btnClinico = screen.getAllByRole('button', { name: /Upgrade.*Clínico & Compliance/i })[0]
    fireEvent.click(btnClinico)

    // Deve exibir opção de cartão salvo 1-clique
    expect(screen.getByText(/Cartão Salvo \(•••• 9876\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Upgrade 1-Clique/i)).toBeInTheDocument()
    expect(screen.getByText(/DRA BEATRIZ/i)).toBeInTheDocument()
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
