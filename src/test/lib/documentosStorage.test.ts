import { describe, it, expect, beforeEach } from 'vitest'
import {
  formatarTamanhoArquivo,
  salvarAnexoLocal,
  obterAnexoLocal,
  removerAnexoLocal,
  carregarTodosAnexosLocais,
  type AnexoDocumento,
} from '../../lib/documentosStorage'

describe('documentosStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('formata tamanhos de arquivo legíveis corretamente', () => {
    expect(formatarTamanhoArquivo(0)).toBe('Tamanho desconhecido')
    expect(formatarTamanhoArquivo(500)).toBe('500 B')
    expect(formatarTamanhoArquivo(1024 * 50)).toBe('50.0 KB')
    expect(formatarTamanhoArquivo(1024 * 1024 * 2.5)).toBe('2.5 MB')
  })

  it('salva, obtém e remove anexo de alvará', async () => {
    const anexo: AnexoDocumento = {
      id: 'doc_123',
      tipoDocumento: 'alvara',
      nomeArquivo: 'alvara_vigilancia_2026.pdf',
      tipoMime: 'application/pdf',
      tamanho: 1048576,
      dataUpload: '2026-11-20T00:00:00.000Z',
      url: 'https://exemplo.com/doc.pdf',
    }

    await salvarAnexoLocal(anexo)
    const obtido = await obterAnexoLocal('alvara', 'doc_123')
    expect(obtido).toBeTruthy()
    expect(obtido?.nomeArquivo).toBe('alvara_vigilancia_2026.pdf')

    await removerAnexoLocal('alvara', 'doc_123')
    const removido = await obterAnexoLocal('alvara', 'doc_123')
    expect(removido).toBeNull()
  })

  it('salva e lista anexos de POPs', async () => {
    const anexo1: AnexoDocumento = {
      id: 'pop_1',
      tipoDocumento: 'pop',
      nomeArquivo: 'pop_medicamentos.pdf',
      tipoMime: 'application/pdf',
      tamanho: 204800,
      dataUpload: '2026-11-20T00:00:00.000Z',
      url: 'https://exemplo.com/pop1.pdf',
    }
    const anexo2: AnexoDocumento = {
      id: 'pop_2',
      tipoDocumento: 'pop',
      nomeArquivo: 'manual_boas_praticas.pdf',
      tipoMime: 'application/pdf',
      tamanho: 512000,
      dataUpload: '2026-11-20T00:00:00.000Z',
      url: 'https://exemplo.com/pop2.pdf',
    }

    await salvarAnexoLocal(anexo1)
    await salvarAnexoLocal(anexo2)

    const todos = await carregarTodosAnexosLocais('pop')
    expect(todos['pop_1']).toBeTruthy()
    expect(todos['pop_1'].nomeArquivo).toBe('pop_medicamentos.pdf')
    expect(todos['pop_2']).toBeTruthy()
    expect(todos['pop_2'].nomeArquivo).toBe('manual_boas_praticas.pdf')
  })
})
