import { describe, it, expect } from 'vitest'
import { parsePA, flags, flagsValues } from '../../lib/business/ssvv'

describe('SSVV (Sinais Vitais) Clinical Flags', () => {
  describe('parsePA', () => {
    it('extrai sistólica e diastólica de formatos comuns', () => {
      expect(parsePA('120/80')).toEqual([120, 80])
      expect(parsePA('130x85')).toEqual([130, 85])
      expect(parsePA('140/90 mmHg')).toEqual([140, 90])
      expect(parsePA('12-8')).toBeNull() // menos de 2 digitos cada
      expect(parsePA(null)).toBeNull()
      expect(parsePA('')).toBeNull()
    })
  })

  describe('flags e alertas clínicos', () => {
    it('identifica SSVV normais sem nenhuma flag', () => {
      const normal = {
        pa: '120/80',
        pulso: 75,
        resp: 16,
        temp: 36.5,
        sat: 98,
      }
      expect(flags(normal)).toEqual({})
      expect(flagsValues(normal)).toEqual([])
    })

    it('identifica hipertensão / PA elevada', () => {
      expect(flags({ pa: '145/95' }).pa).toBe('PA elevada')
      expect(flags({ pa: '150/80' }).pa).toBe('PA elevada')
      expect(flags({ pa: '120/95' }).pa).toBe('PA elevada')
    })

    it('identifica hipotensão / PA baixa', () => {
      expect(flags({ pa: '85/55' }).pa).toBe('PA baixa')
      expect(flags({ pa: '80/70' }).pa).toBe('PA baixa')
      expect(flags({ pa: '110/50' }).pa).toBe('PA baixa')
    })

    it('identifica bradicardia (< 60 bpm) e taquicardia (> 100 bpm)', () => {
      expect(flags({ pulso: 52 }).pulso).toBe('Bradicardia')
      expect(flags({ pulso: '58' }).pulso).toBe('Bradicardia')
      expect(flags({ pulso: 115 }).pulso).toBe('Taquicardia')
      expect(flags({ pulso: '120' }).pulso).toBe('Taquicardia')
      expect(flags({ pulso: 78 }).pulso).toBeUndefined()
    })

    it('identifica alterações na frequência respiratória (Bradipneia e Taquipneia)', () => {
      expect(flags({ resp: 10 }).resp).toBe('Bradipneia')
      expect(flags({ resp: 28 }).resp).toBe('Taquipneia')
      expect(flags({ resp: 18 }).resp).toBeUndefined()
    })

    it('identifica febre (>= 37.8°C) e hipotermia (< 35°C)', () => {
      expect(flags({ temp: 38.2 }).temp).toBe('Febre')
      expect(flags({ temp: '37.8' }).temp).toBe('Febre')
      expect(flags({ temp: 34.8 }).temp).toBe('Hipotermia')
      expect(flags({ temp: 36.6 }).temp).toBeUndefined()
    })

    it('identifica saturação de oxigênio baixa (< 92%)', () => {
      expect(flags({ sat: 89 }).sat).toBe('Saturação baixa')
      expect(flags({ sat: 91 }).sat).toBe('Saturação baixa')
      expect(flags({ sat: 95 }).sat).toBeUndefined()
    })

    it('identifica dextro / glicemia capilar (Hipoglicemia < 70 e Hiperglicemia > 180)', () => {
      expect(flags({ dextro: 55 }).dextro).toBe('Hipoglicemia')
      expect(flags({ dextro: '65' }).dextro).toBe('Hipoglicemia')
      expect(flags({ dextro: 220 }).dextro).toBe('Hiperglicemia')
      expect(flags({ dextro: '200' }).dextro).toBe('Hiperglicemia')
      expect(flags({ dextro: 110 }).dextro).toBeUndefined()
      expect(flags({ dextro: '' }).dextro).toBeUndefined()
    })

    it('retorna múltiplas flags simultâneas quando o paciente está instável', () => {
      const critico = {
        pa: '160/100',
        pulso: 125,
        resp: 30,
        temp: 39.1,
        sat: 88,
        dextro: 250,
      }
      const f = flags(critico)
      expect(f.pa).toBe('PA elevada')
      expect(f.pulso).toBe('Taquicardia')
      expect(f.resp).toBe('Taquipneia')
      expect(f.temp).toBe('Febre')
      expect(f.sat).toBe('Saturação baixa')
      expect(f.dextro).toBe('Hiperglicemia')

      const vals = flagsValues(critico)
      expect(vals).toHaveLength(6)
    })
  })
})
