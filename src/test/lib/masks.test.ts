import { describe, it, expect } from 'vitest'
import {
  mascaraConselho,
  mascaraTelefone,
  mascaraCartao,
  mascaraValidadeCartao,
  mascaraCvv,
  mascaraPA,
} from '../../lib/masks'

describe('Máscaras do Sistema (Conselhos de Saúde, Telefones, Cartão, PA)', () => {
  describe('mascaraConselho (CRM, COREN, etc.)', () => {
    it('padroniza e formata CRM com UF e número', () => {
      expect(mascaraConselho('crmsp189432')).toBe('CRM-SP 189432')
      expect(mascaraConselho('crm-sp 189432')).toBe('CRM-SP 189432')
      expect(mascaraConselho('crm/sp 189432')).toBe('CRM-SP 189432')
      expect(mascaraConselho('crm 189432')).toBe('CRM 189432')
    })

    it('padroniza e formata COREN com UF, número e categoria', () => {
      expect(mascaraConselho('corensp123456te')).toBe('COREN-SP 123456-TE')
      expect(mascaraConselho('coren-sp 123456-enf')).toBe('COREN-SP 123456-ENF')
      expect(mascaraConselho('coren-sp 123.456-enf')).toBe('COREN-SP 123.456-ENF')
    })

    it('formata outros conselhos multiprofissionais como CRN, CRP, CREFITO', () => {
      expect(mascaraConselho('crnsp5544')).toBe('CRN-SP 5544')
      expect(mascaraConselho('crp-06 12345')).toBe('CRP-06 12345')
      expect(mascaraConselho('crefito-3 12345-f')).toBe('CREFITO-3 12345-F')
    })
  })

  describe('mascaraTelefone', () => {
    it('formata celular com 11 dígitos no padrão brasileiro', () => {
      expect(mascaraTelefone('11987654321')).toBe('(11) 98765-4321')
    })

    it('formata telefone fixo com 10 dígitos', () => {
      expect(mascaraTelefone('1134567890')).toBe('(11) 3456-7890')
    })

    it('formata enquanto o usuário digita', () => {
      expect(mascaraTelefone('11')).toBe('(11')
      expect(mascaraTelefone('119')).toBe('(11) 9')
      expect(mascaraTelefone('1198765')).toBe('(11) 9876-5')
    })
  })

  describe('mascaraCartao, validade e cvv', () => {
    it('agrupa número do cartão em blocos de 4 dígitos', () => {
      expect(mascaraCartao('1234567812345678')).toBe('1234 5678 1234 5678')
    })

    it('formata validade no formato MM/AA', () => {
      expect(mascaraValidadeCartao('1228')).toBe('12/28')
      expect(mascaraValidadeCartao('12')).toBe('12')
    })

    it('limita CVV a 4 dígitos numéricos', () => {
      expect(mascaraCvv('123abc456')).toBe('1234')
    })
  })

  describe('mascaraPA (Pressão Arterial)', () => {
    it('formata aferição com separador "x"', () => {
      expect(mascaraPA('12080')).toBe('120x80')
      expect(mascaraPA('13085')).toBe('130x85')
      expect(mascaraPA('128')).toBe('12x8')
    })

    it('aceita entrada com "x" ou "/" digitada diretamente', () => {
      expect(mascaraPA('120x80')).toBe('120x80')
      expect(mascaraPA('120/80')).toBe('120x80')
    })
  })
})
