import { describe, it, expect, beforeEach } from 'vitest'
import {
  obterProfissionaisVirtuais,
  gerarConfiguracaoAgendaPadrao,
  obterConfiguracaoAgenda,
  salvarConfiguracaoAgenda,
  adicionarBloqueioAgenda,
  removerBloqueioAgenda,
  obterBloqueiosAgenda,
  obterSlotsDia,
  reagendarConsulta,
  cancelarConsultaComJustificativa,
  salvarNotasConsulta,
  salvarConsultaVirtual,
  obterConsultasVirtuais,
} from '../../lib/teleconsultaStorage'
import type { ConsultaVirtual } from '../../types/teleconsulta'

describe('teleconsultaStorage - Módulo de Agenda e Disponibilidade', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('gerarConfiguracaoAgendaPadrao cria estrutura inicial com base no profissional', () => {
    const profs = obterProfissionaisVirtuais()
    const draJuliana = profs.find((p) => p.id === 'prof_dra_juliana')!

    const config = gerarConfiguracaoAgendaPadrao(draJuliana)
    expect(config.profissionalId).toBe('prof_dra_juliana')
    expect(config.duracaoSlotMin).toBe(45)
    expect(config.diasSemana.length).toBe(7)

    // Dra. Juliana atende seg, qua, sex (1, 3, 5)
    const seg = config.diasSemana.find((d) => d.diaSemana === 1)
    expect(seg?.ativo).toBe(true)
    const dom = config.diasSemana.find((d) => d.diaSemana === 0)
    expect(dom?.ativo).toBe(false)
  })

  it('salva e recupera a configuração de disponibilidade e horários', () => {
    const profs = obterProfissionaisVirtuais()
    const prof = profs[0]

    const config = obterConfiguracaoAgenda(prof.id)
    config.duracaoSlotMin = 50
    config.intervaloEntreSlotsMin = 20

    salvarConfiguracaoAgenda(config)

    const recuperada = obterConfiguracaoAgenda(prof.id)
    expect(recuperada.duracaoSlotMin).toBe(50)
    expect(recuperada.intervaloEntreSlotsMin).toBe(20)
  })

  it('permite adicionar e remover bloqueios de agenda (férias, folgas)', () => {
    const profs = obterProfissionaisVirtuais()
    const profId = profs[0].id

    const bloqueio = adicionarBloqueioAgenda({
      profissionalId: profId,
      data: '2026-12-25',
      motivo: 'Feriado de Natal',
      diaInteiro: true,
    })

    expect(bloqueio.id).toBeDefined()
    expect(bloqueio.data).toBe('2026-12-25')

    let lista = obterBloqueiosAgenda(profId)
    expect(lista.length).toBe(1)
    expect(lista[0].motivo).toBe('Feriado de Natal')

    // Remove o bloqueio
    removerBloqueioAgenda(bloqueio.id)
    lista = obterBloqueiosAgenda(profId)
    expect(lista.length).toBe(0)
  })

  it('obterSlotsDia calcula slots livres, ocupados e bloqueados corretamente', () => {
    const profs = obterProfissionaisVirtuais()
    const draJuliana = profs.find((p) => p.id === 'prof_dra_juliana')!

    // 2026-11-23 é Segunda-feira (dia 1), em que a Dra. Juliana atende
    const dataSegunda = '2026-11-23'

    // Mock de consulta existente às 14:00
    const consultaMock: ConsultaVirtual = {
      id: 'cv_teste_1',
      profissionalId: draJuliana.id,
      profissionalNome: draJuliana.nome,
      especialidade: draJuliana.especialidadeLabel,
      registro: draJuliana.registro,
      clinica: draJuliana.clinica,
      residenteId: 'r1',
      residenteNome: 'Sebastião Arruda',
      data: dataSegunda,
      horario: '14:00',
      valor: draJuliana.preco,
      metodoPagamento: 'pix',
      pago: true,
      linkSala: 'https://p2p.mirotalk.com/join/sala1',
      codigoSala: 'sala1',
      status: 'confirmada',
      criadoEm: new Date().toISOString(),
    }

    salvarConsultaVirtual(consultaMock)

    // Adiciona bloqueio de horário específico às 10:00 - 11:30
    adicionarBloqueioAgenda({
      profissionalId: draJuliana.id,
      data: dataSegunda,
      horarioInicio: '10:00',
      horarioFim: '11:30',
      diaInteiro: false,
      motivo: 'Reunião de Diretoria Médica',
    })

    const slots = obterSlotsDia(draJuliana.id, dataSegunda, [consultaMock])
    expect(slots.length).toBeGreaterThan(0)

    // Slot das 14:00 deve estar ocupado com a consulta
    const slot14 = slots.find((s) => s.horario === '14:00')
    expect(slot14).toBeDefined()
    expect(slot14?.disponivel).toBe(false)
    expect(slot14?.consulta?.residenteNome).toBe('Sebastião Arruda')

    // Slot das 10:00 deve estar bloqueado
    const slot10 = slots.find((s) => s.horario === '10:00')
    expect(slot10).toBeDefined()
    expect(slot10?.disponivel).toBe(false)
    expect(slot10?.bloqueado).toBe(true)
    expect(slot10?.motivoBloqueio).toContain('Reunião')

    // Slot das 08:30 deve estar disponível
    const slot0830 = slots.find((s) => s.horario === '08:30')
    expect(slot0830?.disponivel).toBe(true)
  })

  it('reagenda uma consulta alterando data e horário e gravando o histórico', () => {
    const consulta: ConsultaVirtual = {
      id: 'cv_reagendar_1',
      profissionalId: 'prof_dra_juliana',
      profissionalNome: 'Dra. Juliana Mendes',
      especialidade: 'Medicina Geriátrica',
      registro: 'CRM-SP 184.290',
      clinica: 'Clínica Longevidade',
      residenteId: 'r2',
      residenteNome: 'Dona Maria',
      data: '2026-11-23',
      horario: '10:00',
      valor: 240,
      metodoPagamento: 'pix',
      pago: true,
      linkSala: 'https://p2p.mirotalk.com/join/sala-reag',
      codigoSala: 'sala-reag',
      status: 'confirmada',
      criadoEm: new Date().toISOString(),
    }

    salvarConsultaVirtual(consulta)

    const sucesso = reagendarConsulta('cv_reagendar_1', '2026-11-25', '15:30')
    expect(sucesso).toBe(true)

    const atualizada = obterConsultasVirtuais().find((c) => c.id === 'cv_reagendar_1')!
    expect(atualizada.data).toBe('2026-11-25')
    expect(atualizada.horario).toBe('15:30')
    expect(atualizada.status).toBe('confirmada')
    expect(atualizada.reagendadaDe).toBe('2026-11-23 às 10:00')
    expect(atualizada.historicoReagendamentos?.length).toBe(1)
  })

  it('cancela uma consulta com justificativa clínica e libera o slot', () => {
    const consulta: ConsultaVirtual = {
      id: 'cv_cancelar_1',
      profissionalId: 'prof_dra_juliana',
      profissionalNome: 'Dra. Juliana Mendes',
      especialidade: 'Medicina Geriátrica',
      registro: 'CRM-SP 184.290',
      clinica: 'Clínica Longevidade',
      residenteId: 'r3',
      residenteNome: 'Seu Manoel',
      data: '2026-11-23',
      horario: '14:00',
      valor: 240,
      metodoPagamento: 'pix',
      pago: true,
      linkSala: 'https://p2p.mirotalk.com/join/sala-canc',
      codigoSala: 'sala-canc',
      status: 'confirmada',
      criadoEm: new Date().toISOString(),
    }

    salvarConsultaVirtual(consulta)

    const sucesso = cancelarConsultaComJustificativa(
      'cv_cancelar_1',
      'Residente transferido para exame laboratorial externo',
    )
    expect(sucesso).toBe(true)

    const atualizada = obterConsultasVirtuais().find((c) => c.id === 'cv_cancelar_1')!
    expect(atualizada.status).toBe('cancelada')
    expect(atualizada.motivoCancelamento).toBe(
      'Residente transferido para exame laboratorial externo',
    )
  })

  it('permite registrar observações pré-consulta', () => {
    const consulta: ConsultaVirtual = {
      id: 'cv_notas_1',
      profissionalId: 'prof_dra_juliana',
      profissionalNome: 'Dra. Juliana Mendes',
      especialidade: 'Medicina Geriátrica',
      registro: 'CRM-SP 184.290',
      clinica: 'Clínica Longevidade',
      residenteId: 'r4',
      residenteNome: 'Ana Souza',
      data: '2026-11-23',
      horario: '11:15',
      valor: 240,
      metodoPagamento: 'pix',
      pago: true,
      linkSala: 'https://p2p.mirotalk.com/join/sala-notas',
      codigoSala: 'sala-notas',
      status: 'confirmada',
      criadoEm: new Date().toISOString(),
    }

    salvarConsultaVirtual(consulta)

    const ok = salvarNotasConsulta('cv_notas_1', 'Verificar resultado do hemograma e TSH recente')
    expect(ok).toBe(true)

    const atualizada = obterConsultasVirtuais().find((c) => c.id === 'cv_notas_1')!
    expect(atualizada.notasPreConsulta).toBe('Verificar resultado do hemograma e TSH recente')
  })
})
