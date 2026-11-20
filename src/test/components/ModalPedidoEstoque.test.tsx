import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModalPedidoEstoque } from '../../components/ModalPedidoEstoque'
import type { Residente } from '../../types/ilpi'

vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
    open ? <div>{children}</div> : null,
  Trigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  Portal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Overlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Content: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  Description: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  Close: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}))

describe('ModalPedidoEstoque', () => {
  const mockResidente: Residente = {
    id: 'r_sebastiao',
    nome: 'Sebastião Arruda',
    quarto: '4',
    status: 'ativo',
    responsavel: {
      nome: 'Cláudia Arruda',
      tel: '(17) 99999-0004',
      parentesco: 'Filha',
    },
    estoque: [
      {
        id: 'it_pantoprazol',
        nome: 'Pantoprazol 40 mg',
        unid: 'un',
        qtd: 12,
        min: 7,
      },
      {
        id: 'it_losartana',
        nome: 'Losartana potássica 50 mg',
        unid: 'un',
        qtd: 25,
        min: 7,
      },
      {
        id: 'it_aas',
        nome: 'Ácido acetilsalicílico 100 mg',
        unid: 'un',
        qtd: 40,
        min: 7,
      },
      {
        id: 'it_bromoprida',
        nome: 'Bromoprida 4 mg/mL',
        unid: 'un',
        qtd: 600,
        min: 100,
      },
    ],
    presc: [],
    cuidados: [],
    avaliacoes: [],
    evolucoes: [],
    anotacoes: [],
    sinais: [],
    arquivos: [],
    admissao: '2023-01-01',
    aval: {} as any,
    pia: {} as any,
    anot: [],
    evol: [],
  }

  it('renderiza o modal com informações do residente e os itens de estoque', () => {
    render(
      <ModalPedidoEstoque
        open={true}
        onOpenChange={vi.fn()}
        residente={mockResidente}
        usuarioNome="Egle (RT)"
      />
    )

    expect(screen.getByText('Gerar Pedido & Reposição de Estoque')).toBeInTheDocument()
    expect(screen.getByText('Sebastião Arruda')).toBeInTheDocument()
    expect(screen.getByText('Pantoprazol 40 mg')).toBeInTheDocument()
    expect(screen.getByText('Losartana potássica 50 mg')).toBeInTheDocument()
    expect(screen.getByText('Ácido acetilsalicílico 100 mg')).toBeInTheDocument()
    expect(screen.getByText('Bromoprida 4 mg/mL')).toBeInTheDocument()
  })

  it('permite selecionar itens específicos (ex: pantoprazol e losartana para farmácia comercial)', () => {
    render(
      <ModalPedidoEstoque
        open={true}
        onOpenChange={vi.fn()}
        residente={mockResidente}
        itensIniciaisIds={['it_pantoprazol', 'it_losartana']}
        usuarioNome="Egle (RT)"
      />
    )

    // Clica no canal "Farmácia Comercial"
    const btnComercial = screen.getByRole('button', { name: /Farmácia Comercial/i })
    fireEvent.click(btnComercial)

    const textarea = screen.getByTestId('preview-texto') as HTMLTextAreaElement
    expect(textarea.value).toContain('PEDIDO / COTAÇÃO DE MEDICAMENTOS E MATERIAIS')
    expect(textarea.value).toContain('Pantoprazol 40 mg')
    expect(textarea.value).toContain('Losartana potássica 50 mg')
    // Não deve conter AAS nem Bromoprida porque não foram selecionados
    expect(textarea.value).not.toContain('Ácido acetilsalicílico 100 mg')
    expect(textarea.value).not.toContain('Bromoprida 4 mg/mL')
  })

  it('permite alternar para Farmácia Popular e selecionar AAS e Bromoprida', () => {
    render(
      <ModalPedidoEstoque
        open={true}
        onOpenChange={vi.fn()}
        residente={mockResidente}
        itensIniciaisIds={['it_aas', 'it_bromoprida']}
        usuarioNome="Egle (RT)"
      />
    )

    // Clica no canal "Farmácia Popular"
    const btnPopular = screen.getByRole('button', { name: /Farmácia Popular/i })
    fireEvent.click(btnPopular)

    const textarea = screen.getByTestId('preview-texto') as HTMLTextAreaElement
    expect(textarea.value).toContain('SOLICITAÇÃO DE MEDICAMENTOS — PROGRAMA FARMÁCIA POPULAR')
    expect(textarea.value).toContain('Ácido acetilsalicílico 100 mg')
    expect(textarea.value).toContain('Bromoprida 4 mg/mL')
    expect(textarea.value).not.toContain('Pantoprazol 40 mg')
  })

  it('separa medicamentos e produtos de higiene em blocos distintos no pedido', () => {
    const residenteComHigiene: Residente = {
      ...mockResidente,
      estoque: [
        {
          id: 'it_pantoprazol',
          nome: 'Pantoprazol 40 mg',
          unid: 'un',
          qtd: 5,
          min: 7,
        },
        {
          id: 'it_shampoo',
          nome: 'Shampoo Anticaspa',
          unid: 'un',
          qtd: 0,
          min: 1,
        },
      ],
    }

    render(
      <ModalPedidoEstoque
        open={true}
        onOpenChange={vi.fn()}
        residente={residenteComHigiene}
        itensIniciaisIds={['it_pantoprazol', 'it_shampoo']}
        usuarioNome="Egle (RT)"
      />
    )

    const textarea = screen.getByTestId('preview-texto') as HTMLTextAreaElement
    expect(textarea.value).toContain('💊 MEDICAMENTOS:')
    expect(textarea.value).toContain('Pantoprazol 40 mg')
    expect(textarea.value).toContain('🧴 PRODUTOS DE HIGIENE & CUIDADOS:')
    expect(textarea.value).toContain('Shampoo Anticaspa')
  })
})
