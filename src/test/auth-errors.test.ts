import { describe, it, expect } from 'vitest'
import { mensagemAuth, mensagemSenha } from '../lib/auth-errors'

describe('Auth Error Translation & User Messages', () => {
  it('traduz credenciais inválidas para mensagem amigável', () => {
    expect(mensagemAuth({ message: 'Invalid login credentials' })).toBe(
      'E-mail ou senha incorretos. Confira e tente de novo.'
    )
    expect(mensagemAuth({ code: 'invalid_credentials' })).toBe(
      'E-mail ou senha incorretos. Confira e tente de novo.'
    )
  })

  it('traduz e-mail não confirmado', () => {
    expect(mensagemAuth({ message: 'Email not confirmed' })).toBe(
      'Este e-mail ainda não foi confirmado. Peça à RT para liberar o acesso.'
    )
  })

  it('traduz rate limit / muitas requisições', () => {
    expect(mensagemAuth({ message: 'Too many requests' })).toBe(
      'Muitas tentativas seguidas. Aguarde um momento e tente novamente.'
    )
  })

  it('traduz falhas de rede / conectividade', () => {
    expect(mensagemAuth({ message: 'Failed to fetch' })).toBe(
      'Não foi possível conectar. Verifique a internet e tente de novo.'
    )
  })

  it('traduz senha fraca', () => {
    expect(mensagemAuth({ message: 'Password should be at least 6 characters' })).toBe(
      'A nova senha precisa ser mais forte (mínimo 6 caracteres).'
    )
  })

  it('mensagemSenha: trata senha atual incorreta na troca de credenciais', () => {
    expect(mensagemSenha({ message: 'Invalid login credentials' })).toBe(
      'Senha atual incorreta.'
    )
  })

  it('retorna fallback gracioso quando o erro for nulo ou vazio', () => {
    expect(mensagemAuth(null)).toBe('Não foi possível concluir. Tente novamente em instantes.')
    expect(mensagemAuth(undefined)).toBe('Não foi possível concluir. Tente novamente em instantes.')
  })
})
