import { describe, it, expect } from 'vitest'
import {
  pad,
  iso,
  parse,
  addD,
  diffDays,
  fmt,
  fmtDM,
  mesKey,
  diasNoMes,
  agoraHM,
  idade,
} from '../../lib/business/dates'

describe('Dates business utilities', () => {
  it('pad: preenche com zero à esquerda', () => {
    expect(pad(1)).toBe('01')
    expect(pad(9)).toBe('09')
    expect(pad(10)).toBe('10')
    expect(pad(99)).toBe('99')
  })

  it('iso: converte Date para YYYY-MM-DD', () => {
    const d = new Date(2026, 10, 15) // Novembro = mês 10 (base 0)
    expect(iso(d)).toBe('2026-11-15')
  })

  it('parse: converte string YYYY-MM-DD em Date corretamente', () => {
    const d = parse('2026-11-15')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(10)
    expect(d.getDate()).toBe(15)

    // Se já for Date, retorna ele mesmo
    const now = new Date()
    expect(parse(now)).toBe(now)
  })

  it('addD: adiciona e subtrai dias corretamente, tratando virada de mês', () => {
    expect(iso(addD('2026-11-15', 1))).toBe('2026-11-16')
    expect(iso(addD('2026-11-15', -1))).toBe('2026-11-14')
    expect(iso(addD('2026-11-30', 1))).toBe('2026-12-01')
    expect(iso(addD('2026-12-31', 1))).toBe('2027-01-01')
    expect(iso(addD('2026-03-01', -1))).toBe('2026-02-28')
  })

  it('diffDays: calcula a diferença em dias entre duas datas', () => {
    expect(diffDays('2026-11-20', '2026-11-15')).toBe(5)
    expect(diffDays('2026-11-15', '2026-11-20')).toBe(-5)
    expect(diffDays('2026-11-15', '2026-11-15')).toBe(0)
  })

  it('fmt: formata YYYY-MM-DD para DD/MM/YYYY', () => {
    expect(fmt('2026-11-15')).toBe('15/11/2026')
    expect(fmt(null)).toBe('–')
    expect(fmt(undefined)).toBe('–')
    expect(fmt('')).toBe('–')
  })

  it('fmtDM: formata para DD/MM', () => {
    expect(fmtDM('2026-11-15')).toBe('15/11')
    expect(fmtDM(new Date(2026, 4, 3))).toBe('03/05')
  })

  it('mesKey: gera chave de mês YYYY-MM', () => {
    expect(mesKey(new Date(2026, 10, 15))).toBe('2026-11')
    expect(mesKey(new Date(2026, 0, 1))).toBe('2026-01')
  })

  it('diasNoMes: retorna a quantidade correta de dias para cada mês', () => {
    expect(diasNoMes('2026-01')).toBe(31)
    expect(diasNoMes('2026-02')).toBe(28) // 2026 não é bissexto
    expect(diasNoMes('2024-02')).toBe(29) // 2024 foi bissexto
    expect(diasNoMes('2026-04')).toBe(30)
    expect(diasNoMes('2026-11')).toBe(30)
    expect(diasNoMes('2026-12')).toBe(31)
  })

  it('agoraHM: retorna horário no formato HH:mm', () => {
    const fixed = new Date(2026, 10, 15, 14, 30)
    expect(agoraHM(fixed)).toBe('14:30')
    const morning = new Date(2026, 10, 15, 7, 5)
    expect(agoraHM(morning)).toBe('07:05')
  })

  it('idade: calcula idade correta em anos a partir da data de nascimento', () => {
    const nasc = '1940-05-10'
    const id = idade(nasc)
    expect(typeof id).toBe('number')
    expect(id).toBeGreaterThanOrEqual(85)
    expect(idade(undefined)).toBeNull()
  })
})
