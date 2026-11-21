import { describe, it, expect, beforeEach } from 'vitest'
import {
  obterConfigMemed,
  salvarConfigMemed,
  prepararDadosPacienteMemed,
  gerarTextoCopiaPrescricao,
  salvarReceitaDigitalLocal,
  obterReceitasDigitaisLocais,
  removerReceitaDigitalLocal,
  obterPlataformaPreferida,
  salvarPlataformaPreferida,
  LINKS_OFICIAIS_PRESCRICAO,
  type ReceitaDigitalMemed,
} from '../../lib/memedService'
import { CIDS_COMUNS_GERIATRIA } from '../../lib/business/pedidosMedicos'
import type { Residente } from '../../types/ilpi'

describe('memedService & Prescrição Digital ICP-Brasil', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('obterConfigMemed e salvarConfigMemed: gerencia credenciais locais da integração', () => {
    const configInicial = obterConfigMemed()
    expect(configInicial).toBeDefined()
    expect(configInicial.ambiente).toBe('sandbox')

    salvarConfigMemed({
      partnerKey: 'partner_test_123',
      doctorToken: 'doc_token_abc',
      ambiente: 'producao',
    })

    const configAtualizada = obterConfigMemed()
    expect(configAtualizada.partnerKey).toBe('partner_test_123')
    expect(configAtualizada.doctorToken).toBe('doc_token_abc')
    expect(configAtualizada.ambiente).toBe('producao')
    expect(configAtualizada.ativo).toBe(true)
  })

  it('prepararDadosPacienteMemed: normaliza campos do residente para payload da Memed', () => {
    const mockResidente: Partial<Residente> = {
      id: 'res_1',
      nome: 'Dona Geralda Santos',
      cpf: '123.456.789-00',
      nasc: '1940-05-10',
      contato: '(11) 98765-4321',
      alergias: 'Dipirona e Sulfas',
      quarto: '102-B',
    }

    const payload = prepararDadosPacienteMemed(mockResidente as Residente)
    expect(payload.nome).toBe('Dona Geralda Santos')
    expect(payload.cpf).toBe('12345678900') // Sem pontos e traço
    expect(payload.alergias).toContain('Dipirona')
    expect(payload.telefone).toBe('(11) 98765-4321')
  })

  it('gerarTextoCopiaPrescricao: gera resumo formatado para o modo assistido com 1 clique', () => {
    const mockResidente: Partial<Residente> = {
      id: 'res_2',
      nome: 'Sr. Benedito Oliveira',
      cpf: '987.654.321-11',
      nasc: '1935-08-20',
      presc: [
        {
          id: 'p1',
          med: 'Losartana Potássica 50mg',
          tipo: 'fixo',
          horarios: ['08:00', '20:00'],
          via: 'VO',
          posologia: 'Tomar 1 comprimido 12/12h',
          suspensa: false,
          prescritor: 'Dra. Ana',
        },
        {
          id: 'p2',
          med: 'AAS 100mg',
          tipo: 'fixo',
          horarios: ['12:00'],
          via: 'VO',
          posologia: 'Tomar 1 cp após almoço',
          suspensa: true, // suspensa não deve entrar na cópia ativa
          prescritor: 'Dra. Ana',
        },
      ],
    }

    const texto = gerarTextoCopiaPrescricao(mockResidente as Residente)
    expect(texto).toContain('Sr. Benedito Oliveira')
    expect(texto).toContain('Losartana Potássica 50mg')
    expect(texto).not.toContain('AAS 100mg') // Não inclui med suspenso
  })

  it('salvarReceitaDigitalLocal e historico: armazena e remove receitas digitais com QR Code', () => {
    const rec: ReceitaDigitalMemed = {
      id: 'rec_101',
      residenteId: 'res_1',
      urlReceita: 'https://memed.com.br/p/abc123xyz',
      codigoValidacao: 'VALID-789',
      data: '2026-11-21',
      hora: '14:30',
      prescritorNome: 'Dra. Amanda Silva',
      prescritorConselho: 'CRM/SP 123456',
      medicamentosResumo: 'Losartana 50mg, Clonazepam 2mg',
      tipo: 'memed',
    }

    salvarReceitaDigitalLocal('res_1', rec)
    const lista = obterReceitasDigitaisLocais('res_1')
    expect(lista).toHaveLength(1)
    expect(lista[0].urlReceita).toBe('https://memed.com.br/p/abc123xyz')

    removerReceitaDigitalLocal('res_1', 'rec_101')
    expect(obterReceitasDigitaisLocais('res_1')).toHaveLength(0)
  })

  it('CIDS_COMUNS_GERIATRIA: lista os CIDs essenciais para receituário de controle e SUS/LME', () => {
    expect(CIDS_COMUNS_GERIATRIA.length).toBeGreaterThanOrEqual(8)
    const codigos = CIDS_COMUNS_GERIATRIA.map((c) => c.codigo)
    expect(codigos).toContain('I10') // Hipertensão
    expect(codigos).toContain('G30.9') // Alzheimer
    expect(codigos).toContain('E11.9') // Diabetes
  })

  it('LINKS_OFICIAIS_PRESCRICAO: contém links para Memed, CFM e Validador ITI', () => {
    expect(LINKS_OFICIAIS_PRESCRICAO.memedWeb).toContain('memed.com.br')
    expect(LINKS_OFICIAIS_PRESCRICAO.cfmPrescricao).toContain('cfm.org.br')
    expect(LINKS_OFICIAIS_PRESCRICAO.validadorIti).toContain('iti.gov.br')
  })

  it('obterPlataformaPreferida e salvarPlataformaPreferida: armazena escolha do médico (CFM, Memed, etc)', () => {
    // Padrão inicial
    expect(obterPlataformaPreferida('med_1')).toBe('cfm')

    // Salva Memed
    salvarPlataformaPreferida('memed', 'med_1')
    expect(obterPlataformaPreferida('med_1')).toBe('memed')

    // Salva Receita Digital
    salvarPlataformaPreferida('receita_digital', 'med_1')
    expect(obterPlataformaPreferida('med_1')).toBe('receita_digital')
  })
})
