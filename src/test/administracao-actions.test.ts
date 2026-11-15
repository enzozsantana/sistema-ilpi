import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checarAdministracao, desfazerAdministracao } from '../lib/administracao-actions'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      rpc: vi.fn(),
      from: vi.fn(),
    },
  }
})

describe('administracao-actions (Checagem e Estorno de Medicamentos)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('checarAdministracao: retorna ok quando a procedure RPC é executada com sucesso', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: null } as any)

    const res = await checarAdministracao({
      data: '2026-11-15',
      residenteId: 'r1',
      prescricaoId: 'p1',
      horario: '08:00',
      status: 'dado',
      assinatura: { id: 's1', d: '2026-11-15', h: '08:00' },
    })

    expect(res.ok).toBe(true)
    expect(supabase.rpc).toHaveBeenCalledWith('checar_administracao', expect.any(Object))
  })

  it('checarAdministracao: executa fallback direto quando RPC não existe, debitando estoque se status = dado', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function' },
    } as any)

    const mockBuilder: any = {}
    mockBuilder.select = vi.fn().mockReturnValue(mockBuilder)
    mockBuilder.update = vi.fn().mockReturnValue(mockBuilder)
    mockBuilder.delete = vi.fn().mockReturnValue(mockBuilder)
    mockBuilder.insert = vi.fn().mockResolvedValue({ error: null })
    mockBuilder.eq = vi.fn().mockReturnValue(mockBuilder)
    mockBuilder.maybeSingle = vi.fn().mockResolvedValue({ data: { quantidade: 10 }, error: null })

    vi.mocked(supabase.from).mockReturnValue(mockBuilder)

    const res = await checarAdministracao({
      data: '2026-11-15',
      residenteId: 'r1',
      prescricaoId: 'p1',
      horario: '08:00',
      status: 'dado',
      assinatura: { id: 's1', d: '2026-11-15', h: '08:00' },
      prescricao: {
        id: 'p1',
        med: 'AAS 100mg',
        dose: '1 cp',
        via: 'VO',
        tipo: 'fixo',
        horarios: ['08:00'],
        inicio: '2026-11-01',
        consumo: 1,
        estoqueId: 'it_1',
      },
    })

    expect(res.ok).toBe(true)
    expect(mockBuilder.update).toHaveBeenCalledWith({ quantidade: 9 }) // 10 - 1 = 9
    expect(mockBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        residente_id: 'r1',
        prescricao_id: 'p1',
        status: 'dado',
      })
    )
  })

  it('checarAdministracao: impede administração e avisa caso estoque seja insuficiente', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function' },
    } as any)

    const mockBuilder: any = {}
    mockBuilder.select = vi.fn().mockReturnValue(mockBuilder)
    mockBuilder.eq = vi.fn().mockReturnValue(mockBuilder)
    mockBuilder.maybeSingle = vi.fn().mockResolvedValue({ data: { quantidade: 0 }, error: null }) // Zero estoque

    vi.mocked(supabase.from).mockReturnValue(mockBuilder)

    const res = await checarAdministracao({
      data: '2026-11-15',
      residenteId: 'r1',
      prescricaoId: 'p1',
      horario: '08:00',
      status: 'dado',
      assinatura: { id: 's1', d: '2026-11-15', h: '08:00' },
      prescricao: {
        id: 'p1',
        med: 'AAS 100mg',
        dose: '1 cp',
        via: 'VO',
        tipo: 'fixo',
        horarios: ['08:00'],
        inicio: '2026-11-01',
        consumo: 1,
        estoqueId: 'it_1',
      },
    })

    expect(res.ok).toBe(false)
    expect(res.erro).toContain('Estoque insuficiente')
  })

  it('desfazerAdministracao: estorna a dose e restabelece a quantidade no estoque', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function' },
    } as any)

    const mockBuilder: any = {}
    mockBuilder.select = vi.fn().mockReturnValue(mockBuilder)
    mockBuilder.update = vi.fn().mockReturnValue(mockBuilder)
    mockBuilder.delete = vi.fn().mockReturnValue(mockBuilder)
    mockBuilder.eq = vi.fn().mockReturnValue(mockBuilder)
    mockBuilder.maybeSingle = vi.fn().mockResolvedValue({ data: { quantidade: 9 }, error: null })

    vi.mocked(supabase.from).mockReturnValue(mockBuilder)

    const res = await desfazerAdministracao(
      '2026-11-15',
      'r1',
      'p1',
      '08:00',
      { st: 'dado', sig: { id: 's1', d: '2026-11-15', h: '08:00' } },
      {
        id: 'p1',
        med: 'AAS 100mg',
        dose: '1 cp',
        via: 'VO',
        tipo: 'fixo',
        horarios: ['08:00'],
        inicio: '2026-11-01',
        consumo: 1,
        estoqueId: 'it_1',
      }
    )

    expect(res.ok).toBe(true)
    expect(mockBuilder.update).toHaveBeenCalledWith({ quantidade: 10 }) // 9 + 1 = 10
  })
})
