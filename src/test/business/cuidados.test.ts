import { describe, it, expect } from 'vitest'
import {
  isCuidadoLpp,
  isCuidadoCurativo,
  classificarCuidado,
  formatarTextoCurativo,
  formatarTextoDecubito,
  extrairHorariosCuidado,
} from '../../lib/business/cuidados'
import type { Cuidado } from '../../types/ilpi'

describe('business/cuidados', () => {
  it('detecta mudança de decúbito como LPP', () => {
    expect(isCuidadoLpp('Mudança de decúbito a cada 2 horas')).toBe(true)
    expect(isCuidadoLpp('Mudanca de decubito no periodo noturno')).toBe(true)
    expect(isCuidadoLpp('Hidratar a pele com AGE após o banho')).toBe(true)
    expect(isCuidadoLpp('Verificar sinais vitais')).toBe(false)
  })

  it('detecta tags explícitas [LPP] no texto', () => {
    expect(isCuidadoLpp('[LPP] Mobilização passiva no leito')).toBe(true)
    expect(isCuidadoLpp('[Lesão por Pressão] Cuidados perilesionais')).toBe(true)
  })

  it('detecta prescrição de curativo', () => {
    expect(isCuidadoCurativo('Curativo em região sacra com placa de hidrocolóide')).toBe(true)
    expect(isCuidadoCurativo('Aplicar sulfadiazina de prata no calcâneo')).toBe(true)
    expect(isCuidadoCurativo('[CURATIVO] Troca de cobertura no banho')).toBe(true)
    expect(isCuidadoCurativo('Oferecer água de 1 em 1 hora')).toBe(false)
  })

  it('classifica cuidado comum como geral (slate)', () => {
    const c: Cuidado = { id: 'c1', texto: 'Oferecer água espessada', quem: 'todos' }
    const res = classificarCuidado(c)
    expect(res.tipo).toBe('geral')
    expect(res.corTema).toBe('slate')
    expect(res.isLpp).toBe(false)
    expect(res.isCurativo).toBe(false)
  })

  it('classifica mudança de decúbito com LPP ativa em tom AMBER (nunca vermelho)', () => {
    const c: Cuidado = { id: 'c2', texto: 'Mudança de decúbito a cada 2 horas', quem: 'todos' }
    const res = classificarCuidado(c)
    expect(res.tipo).toBe('lpp')
    expect(res.corTema).toBe('amber') // Ambar para alerta clinico, vermelho reservado para nao-feito
    expect(res.isLpp).toBe(true)
    expect(res.isDecubito).toBe(true)
    expect(res.badgeTexto).toContain('Decúbito')
  })

  it('classifica curativo de LPP com instruções para cuidadores e auxiliares', () => {
    const c: Cuidado = {
      id: 'c3',
      texto: '[CURATIVO LPP - Grau 2] Região Sacra: Placa de Hidrocolóide. Frequência: A cada 72h. Instruções: Irrigar com SF morno e secar sem esfregar.',
      quem: 'todos',
    }
    const res = classificarCuidado(c)
    expect(res.tipo).toBe('curativo')
    expect(res.isCurativo).toBe(true)
    expect(res.isLpp).toBe(true)
    expect(res.corTema).toBe('amber')
    expect(res.instrucoes).toContain('Irrigar com SF morno')
  })

  it('formata texto de curativo adequadamente', () => {
    const txt = formatarTextoCurativo({
      cobertura: 'Placa de Hidrocolóide',
      localizacao: 'Região Sacra / Cóccix',
      grauLesao: 'Grau 2',
      frequencia: 'A cada 72h ou se saturar',
      instrucoes: 'Higienizar com SF 0,9% em jato suave',
      quem: 'todos',
    })

    expect(txt).toContain('[CURATIVO LPP - Grau 2]')
    expect(txt).toContain('Região Sacra / Cóccix')
    expect(txt).toContain('Placa de Hidrocolóide')
    expect(txt).toContain('Higienizar com SF 0,9% em jato suave')
  })

  it('formata texto de mudança de decúbito com tag LPP', () => {
    const txt = formatarTextoDecubito({
      intervaloHoras: 2,
      periodo: '24h',
      sequenciaDecubito: 'DLE -> DD -> DLD',
      alertaLppAtivo: true,
      quem: 'todos',
    })

    expect(txt).toContain('[LPP]')
    expect(txt).toContain('Mudança de decúbito a cada 2 horas')
    expect(txt).toContain('DLE -> DD -> DLD')
  })

  it('extrairHorariosCuidado: extrai e infere horários estruturados para checagem da equipe', () => {
    // Decúbito a cada 2h (24h)
    const c1: Cuidado = { id: 'c1', texto: 'Mudança de decúbito a cada 2 horas', quem: 'cuidador' }
    const h1 = extrairHorariosCuidado(c1)
    expect(h1).toContain('08:00')
    expect(h1).toContain('10:00')
    expect(h1).toContain('12:00')
    expect(h1.length).toBeGreaterThanOrEqual(6)

    // Decúbito a cada 2h no período noturno
    const c2: Cuidado = { id: 'c2', texto: 'Mudança de decúbito a cada 2h no período noturno', quem: 'cuidador' }
    const h2 = extrairHorariosCuidado(c2)
    expect(h2).toContain('20:00')
    expect(h2).toContain('22:00')
    expect(h2).toContain('00:00')

    // Hidratação de 1 em 1 hora
    const c3: Cuidado = { id: 'c3', texto: 'Oferecer água de 1 em 1 hora (espessada)', quem: 'cuidador' }
    const h3 = extrairHorariosCuidado(c3)
    expect(h3).toContain('08:00')
    expect(h3).toContain('09:00')
    expect(h3).toContain('10:00')
    expect(h3.length).toBeGreaterThanOrEqual(10)

    // Banho / AGE
    const c4: Cuidado = { id: 'c4', texto: 'Hidratar a pele com AGE após o banho', quem: 'cuidador' }
    const h4 = extrairHorariosCuidado(c4)
    expect(h4).toEqual(['09:00'])

    // Horários explícitos no texto
    const c5: Cuidado = { id: 'c5', texto: 'Curativo estéril às 08:30 e 17:00', quem: 'enfermagem' }
    const h5 = extrairHorariosCuidado(c5)
    expect(h5).toEqual(['08:30', '17:00'])

    // Cuidado com array explícito de horários
    const c6: Cuidado = { id: 'c6', texto: 'Rotina especial', quem: 'todos', horarios: ['07:00', '19:00'] }
    const h6 = extrairHorariosCuidado(c6)
    expect(h6).toEqual(['07:00', '19:00'])
  })
})
