import { describe, it, expect } from 'vitest'
import { formatarMoeda, parseMoeda, mascaraMoeda } from '../../lib/currency'

describe('Utilitários Monetários - Máscara e Formatação em Real Brasileiro (BRL)', () => {
  describe('formatarMoeda', () => {
    it('formata números inteiros com vírgula e duas casas decimais', () => {
      expect(formatarMoeda(200)).toBe('R$ 200,00')
      expect(formatarMoeda(50)).toBe('R$ 50,00')
    })

    it('formata números fracionados corretamente', () => {
      expect(formatarMoeda(199.9)).toBe('R$ 199,90')
      expect(formatarMoeda(245.55)).toBe('R$ 245,55')
    })

    it('adiciona separador de milhar no padrão brasileiro', () => {
      expect(formatarMoeda(1500)).toBe('R$ 1.500,00')
      expect(formatarMoeda(12500.75)).toBe('R$ 12.500,75')
    })

    it('retorna R$ 0,00 para nulo, indefinido ou zero', () => {
      expect(formatarMoeda(0)).toBe('R$ 0,00')
      expect(formatarMoeda(null)).toBe('R$ 0,00')
      expect(formatarMoeda(undefined)).toBe('R$ 0,00')
      expect(formatarMoeda('')).toBe('R$ 0,00')
    })
  })

  describe('parseMoeda', () => {
    it('converte string formatada em Real para número float puro', () => {
      expect(parseMoeda('R$ 200,00')).toBe(200)
      expect(parseMoeda('R$ 1.500,50')).toBe(1500.5)
      expect(parseMoeda('1.500,50')).toBe(1500.5)
    })

    it('converte string numérica pura sem vírgula mantendo os reais', () => {
      expect(parseMoeda('200')).toBe(200)
      expect(parseMoeda('250.5')).toBe(250.5)
    })

    it('trata valores numéricos e vazios com segurança', () => {
      expect(parseMoeda(200)).toBe(200)
      expect(parseMoeda(null)).toBe(0)
      expect(parseMoeda('')).toBe(0)
    })
  })

  describe('mascaraMoeda', () => {
    it('aplica a máscara de Real à medida que os dígitos são digitados', () => {
      expect(mascaraMoeda('2')).toBe('R$ 0,02')
      expect(mascaraMoeda('20')).toBe('R$ 0,20')
      expect(mascaraMoeda('200')).toBe('R$ 2,00')
      expect(mascaraMoeda('2000')).toBe('R$ 20,00')
      expect(mascaraMoeda('20000')).toBe('R$ 200,00')
    })

    it('formata números já existentes passados como number', () => {
      expect(mascaraMoeda(250)).toBe('R$ 250,00')
    })
  })
})
