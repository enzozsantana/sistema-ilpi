import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  StatusBadge,
  Allergy,
  Avatar,
  EmptyState,
  PageHeader,
  ResidentMeta,
} from '../../components/Ui'
import type { Residente } from '../../types/ilpi'

describe('Shared UI Components', () => {
  describe('StatusBadge', () => {
    it('renderiza o texto e aplica as classes conforme o tom (ok, warn, danger, neutral)', () => {
      const { rerender } = render(<StatusBadge tone="ok">Conforme</StatusBadge>)
      expect(screen.getByText('Conforme')).toBeInTheDocument()

      rerender(<StatusBadge tone="danger">Crítico</StatusBadge>)
      expect(screen.getByText('Crítico')).toBeInTheDocument()

      rerender(<StatusBadge tone="warn">Atenção</StatusBadge>)
      expect(screen.getByText('Atenção')).toBeInTheDocument()
    })
  })

  describe('Allergy', () => {
    it('exibe alerta destacado quando o residente possui alergias', () => {
      render(<Allergy alergias="Dipirona e Penicilina" />)
      expect(screen.getByText('Alergia: Dipirona e Penicilina')).toBeInTheDocument()
    })

    it('exibe mensagem verde quando não há alergias registradas', () => {
      render(<Allergy />)
      expect(screen.getByText('Sem alergia registrada')).toBeInTheDocument()
    })
  })

  describe('Avatar', () => {
    it('renderiza as iniciais do nome no fallback', () => {
      render(<Avatar r={{ nome: 'Helena Prado' }} />)
      expect(screen.getByText('HE')).toBeInTheDocument()

      render(<Avatar r={{ nome: 'Rafael Duarte' }} />)
      expect(screen.getByText('RA')).toBeInTheDocument()
    })
  })

  describe('EmptyState', () => {
    it('renderiza título e mensagem explicativa', () => {
      render(
        <EmptyState title="Nenhum registro encontrado">
          Não há itens cadastrados no momento.
        </EmptyState>
      )
      expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument()
      expect(screen.getByText('Não há itens cadastrados no momento.')).toBeInTheDocument()
    })
  })

  describe('PageHeader', () => {
    it('renderiza título, subtítulo e ações', () => {
      render(
        <PageHeader
          title="Painel de Plantão"
          lede="Visão geral dos atendimentos de hoje"
          actions={<button>Ação Teste</button>}
          badge={<span>Badge Teste</span>}
        />
      )
      expect(screen.getByText('Painel de Plantão')).toBeInTheDocument()
      expect(screen.getByText('Visão geral dos atendimentos de hoje')).toBeInTheDocument()
      expect(screen.getByText('Ação Teste')).toBeInTheDocument()
      expect(screen.getByText('Badge Teste')).toBeInTheDocument()
    })
  })

  describe('ResidentMeta', () => {
    it('exibe a idade calculada e indicador de óbito se aplicável', () => {
      const mockRes: Residente = {
        id: 'r1',
        nome: 'Dona Bento',
        sexo: 'F',
        nasc: '1945-03-20',
        status: 'ativo',
        admissao: '2026-01-01',
        aval: [],
        estoque: [],
        presc: [],
        pia: [],
        cuidados: [],
        anot: [],
        evol: [],
      }

      const { rerender } = render(<ResidentMeta r={mockRes} />)
      expect(screen.getByText(/anos/)).toBeInTheDocument()

      rerender(<ResidentMeta r={{ ...mockRes, status: 'obito' }} />)
      expect(screen.getByText(/óbito/)).toBeInTheDocument()
    })
  })
})
