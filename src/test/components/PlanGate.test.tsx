import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PlanGate } from '../../components/PlanGate'
import { definirPlanoAtivo, obterPlanoAtivo } from '../../lib/plans'

describe('Componente PlanGate', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve renderizar o conteúdo filho quando a feature é permitida no plano ativo', () => {
    definirPlanoAtivo('clinico') // Permite estoque

    render(
      <MemoryRouter>
        <PlanGate feature="estoque">
          <div data-testid="conteudo-protegido">Módulo de Estoque Liberado</div>
        </PlanGate>
      </MemoryRouter>
    )

    expect(screen.getByTestId('conteudo-protegido')).toBeInTheDocument()
    expect(screen.queryByText(/Disponível a partir do/i)).not.toBeInTheDocument()
  })

  it('deve renderizar tela de bloqueio com botão de upgrade quando a feature exige plano superior', () => {
    definirPlanoAtivo('compacto') // Não inclui estoque nem teleconsulta

    render(
      <MemoryRouter>
        <PlanGate feature="estoque">
          <div data-testid="conteudo-protegido">Módulo de Estoque</div>
        </PlanGate>
      </MemoryRouter>
    )

    expect(screen.queryByTestId('conteudo-protegido')).not.toBeInTheDocument()
    expect(screen.getByText(/Disponível a partir do Clínico & Compliance/i)).toBeInTheDocument()
    expect(screen.getByText(/Fazer Upgrade para Clínico & Compliance/i)).toBeInTheDocument()
    expect(screen.getByText(/Simular Liberação Instantânea/i)).toBeInTheDocument()
  })

  it('deve permitir simular liberação instantânea ao clicar no botão de teste', () => {
    definirPlanoAtivo('compacto')

    render(
      <MemoryRouter>
        <PlanGate feature="treinamentos">
          <div data-testid="conteudo-treinamento">Módulo LMS Liberado</div>
        </PlanGate>
      </MemoryRouter>
    )

    expect(screen.queryByTestId('conteudo-treinamento')).not.toBeInTheDocument()

    // Clica no botão de simulação instantânea
    const btnSimular = screen.getByText(/Simular Liberação Instantânea/i)
    fireEvent.click(btnSimular)

    // O conteúdo deve agora estar renderizado
    expect(screen.getByTestId('conteudo-treinamento')).toBeInTheDocument()
    expect(obterPlanoAtivo()).toBe('avancado')
  })
})
