import { describe, it, expect } from 'vitest'
import {
  presAtiva,
  horariosNoDia,
  doseKey,
  parseDoseKey,
  dosesDia,
  isDoseLate,
  freqTxt,
} from '../../lib/business/medication'
import type { Prescricao, Residente } from '../../types/ilpi'

describe('Medication Business Rules & Dose Scheduling', () => {
  const basePresc: Prescricao = {
    id: 'pr_1',
    med: 'Metformina 850mg',
    dose: '1 cp',
    via: 'VO',
    tipo: 'fixo',
    horarios: ['08:00', '20:00'],
    inicio: '2026-11-01',
    fim: '2026-12-31',
    consumo: 1,
    estoqueId: 'it_1',
  }

  describe('presAtiva', () => {
    it('retorna true para prescrição dentro do período e não suspensa', () => {
      expect(presAtiva(basePresc, '2026-11-15')).toBe(true)
    })

    it('retorna false para prescrição suspensa', () => {
      expect(presAtiva({ ...basePresc, suspensa: true }, '2026-11-15')).toBe(false)
    })

    it('retorna false para data anterior ao início', () => {
      expect(presAtiva(basePresc, '2026-10-31')).toBe(false)
    })

    it('retorna false para data posterior ao término', () => {
      expect(presAtiva(basePresc, '2027-01-01')).toBe(false)
    })
  })

  describe('horariosNoDia', () => {
    it('retorna horários diários para tipo fixo', () => {
      expect(horariosNoDia(basePresc, '2026-11-15')).toEqual(['08:00', '20:00'])
    })

    it('retorna horários apenas nos dias programados para tipo semanal', () => {
      // 2026-11-15 é Domingo (dia 0). 2026-11-16 é Segunda (dia 1).
      const semanal: Prescricao = {
        ...basePresc,
        tipo: 'semanal',
        dias: [1, 3, 5], // Seg, Qua, Sex
      }
      expect(horariosNoDia(semanal, '2026-11-15')).toEqual([]) // Domingo
      expect(horariosNoDia(semanal, '2026-11-16')).toEqual(['08:00', '20:00']) // Segunda
    })

    it('retorna horários a cada N dias para tipo intervalo', () => {
      const intervalo: Prescricao = {
        ...basePresc,
        tipo: 'intervalo',
        inicio: '2026-11-10',
        intervalo: 3, // a cada 3 dias (dias 10, 13, 16, 19...)
      }
      expect(horariosNoDia(intervalo, '2026-11-10')).toEqual(['08:00', '20:00'])
      expect(horariosNoDia(intervalo, '2026-11-11')).toEqual([])
      expect(horariosNoDia(intervalo, '2026-11-12')).toEqual([])
      expect(horariosNoDia(intervalo, '2026-11-13')).toEqual(['08:00', '20:00'])
      expect(horariosNoDia(intervalo, '2026-11-16')).toEqual(['08:00', '20:00'])
    })
  })

  describe('doseKey e parseDoseKey', () => {
    it('cria e desmonta a chave única da dose no plantão', () => {
      const key = doseKey('res_123', 'presc_456', '08:00')
      expect(key).toBe('res_123|presc_456|08:00')

      const parsed = parseDoseKey(key)
      expect(parsed).toEqual({
        resid: 'res_123',
        prescId: 'presc_456',
        hora: '08:00',
      })
    })
  })

  describe('dosesDia', () => {
    it('extrai todas as doses do dia de um residente', () => {
      const mockRes: Residente = {
        id: 'r1',
        nome: 'Dona Ana',
        sexo: 'F',
        quarto: '102',
        status: 'ativo',
        admissao: '2026-01-01',
        aval: [],
        estoque: [],
        presc: [basePresc],
        pia: [],
        cuidados: [],
        anot: [],
        evol: [],
      }

      const doses = dosesDia(mockRes, '2026-11-15')
      expect(doses).toHaveLength(2)
      expect(doses[0].hora).toBe('08:00')
      expect(doses[0].key).toBe('r1|pr_1|08:00')
      expect(doses[1].hora).toBe('20:00')
      expect(doses[1].key).toBe('r1|pr_1|20:00')
    })
  })

  describe('isDoseLate', () => {
    it('detecta dose atrasada quando ultrapassa o limite de tolerância (30 min)', () => {
      // 08:00 = 480 min. Agora = 08:40 (520 min). Diferença = 40 min > 30 min -> Atrasada
      expect(isDoseLate('08:00', false, 520, 30)).toBe(true)

      // Agora = 08:20 (500 min). Diferença = 20 min <= 30 min -> No prazo
      expect(isDoseLate('08:00', false, 500, 30)).toBe(false)

      // Se já foi registrada/administrada, nunca está atrasada
      expect(isDoseLate('08:00', true, 520, 30)).toBe(false)
    })
  })

  describe('freqTxt', () => {
    it('formata texto descritivo para prescrição diária', () => {
      expect(freqTxt(basePresc)).toBe('Diário, às 08:00, 20:00')
    })

    it('formata texto descritivo para prescrição semanal', () => {
      const semanal: Prescricao = {
        ...basePresc,
        tipo: 'semanal',
        dias: [1, 4],
      }
      expect(freqTxt(semanal)).toBe('Seg e Qui, às 08:00, 20:00')
    })

    it('formata texto descritivo para intervalo', () => {
      const intervalo: Prescricao = {
        ...basePresc,
        tipo: 'intervalo',
        intervalo: 2,
      }
      expect(freqTxt(intervalo)).toBe('A cada 2 dias, às 08:00, 20:00')
    })

    it('formata texto descritivo para Se Necessário (SN)', () => {
      const sn: Prescricao = {
        ...basePresc,
        tipo: 'sn',
        obs: 'em caso de febre ou dor',
      }
      expect(freqTxt(sn)).toBe('Se necessário. em caso de febre ou dor')
    })
  })
})
