import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  salvarRascunho,
  obterRascunho,
  limparRascunho,
  temRascunho,
  listarRascunhos,
  useFormDraft,
} from '../../lib/draftStorage'
import { renderHook, act } from '@testing-library/react'

describe('Módulo draftStorage - Persistência de Rascunhos', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('salva e recupera rascunho com timestamp', () => {
    salvarRascunho('teste_campo', 'texto digitado pelo usuario')
    expect(temRascunho('teste_campo')).toBe(true)

    const rascunho = obterRascunho<string>('teste_campo')
    expect(rascunho).not.toBeNull()
    expect(rascunho?.dados).toBe('texto digitado pelo usuario')
    expect(rascunho?.salvoEm).toBeDefined()
  })

  it('salva e recupera objetos complexos (ex: dados de prescricao)', () => {
    const dados = {
      tipo: 'receituario',
      medicamentos: [{ nome: 'Dipirona 500mg', dose: '1 cp' }],
      indicacao: 'Dor de cabeça',
    }

    salvarRascunho('pedido_r1', dados)
    const recuperado = obterRascunho<typeof dados>('pedido_r1')

    expect(recuperado?.dados.tipo).toBe('receituario')
    expect(recuperado?.dados.medicamentos).toHaveLength(1)
    expect(recuperado?.dados.indicacao).toBe('Dor de cabeça')
  })

  it('limpa rascunho corretamente', () => {
    salvarRascunho('teste_del', 'conteudo')
    expect(temRascunho('teste_del')).toBe(true)

    limparRascunho('teste_del')
    expect(temRascunho('teste_del')).toBe(false)
    expect(obterRascunho('teste_del')).toBeNull()
  })

  it('limpa automaticamente rascunho se receber string vazia ou nula', () => {
    salvarRascunho('campo_vazio', 'algo')
    expect(temRascunho('campo_vazio')).toBe(true)

    salvarRascunho('campo_vazio', '')
    expect(temRascunho('campo_vazio')).toBe(false)
  })

  it('lista todos os rascunhos salvos', () => {
    salvarRascunho('form_1', 'dados 1')
    salvarRascunho('form_2', 'dados 2')

    const todos = listarRascunhos()
    expect(todos.length).toBeGreaterThanOrEqual(2)
  })

  it('useFormDraft: inicializa com rascunho pré-existente e salva alterações', async () => {
    vi.useFakeTimers()
    salvarRascunho('draft_hook_test', 'texto ja salvo antes da queda de energia')

    const { result } = renderHook(() =>
      useFormDraft<string>('draft_hook_test', 'padrao', { debounceMs: 50 })
    )

    // Deve inicializar com o que estava no localStorage
    expect(result.current[0]).toBe('texto ja salvo antes da queda de energia')
    expect(result.current[3].temRascunho).toBe(true)

    // Altera o valor
    act(() => {
      result.current[1]('novo texto atualizado')
    })

    // Avança debounce timer
    act(() => {
      vi.advanceTimersByTime(60)
    })

    const salvo = obterRascunho<string>('draft_hook_test')
    expect(salvo?.dados).toBe('novo texto atualizado')

    // Descarta rascunho após salvar
    act(() => {
      result.current[2]()
    })

    expect(temRascunho('draft_hook_test')).toBe(false)
    vi.useRealTimers()
  })
})
