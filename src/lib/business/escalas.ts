import type { AvaliacaoEscala, ClassifEscala, EscalaKey, Residente } from '../../types/ilpi'

export type OpcaoEscala = [string, number]
export type ItemEscala = [string, OpcaoEscala[]]

export interface DefinicaoEscala {
  nome: string
  desc: string
  itens: ItemEscala[]
  classif: (total: number) => ClassifEscala
}

function sc(q: string, ops: OpcaoEscala[]): ItemEscala {
  return [q, ops]
}

export const SCALES: Record<EscalaKey, DefinicaoEscala> = {
  fugulin: {
    nome: 'Fugulin',
    desc: 'Grau de dependência',
    itens: [
      ['Estado mental', ['Orientação no tempo e no espaço', 'Períodos de desorientação no tempo e no espaço', 'Períodos de inconsciência', 'Inconsciente'].map((t, i) => [t, i + 1] as OpcaoEscala)],
      ['Oxigenação', ['Não depende de oxigênio', 'Uso intermitente de máscara ou cateter de O₂', 'Uso contínuo de máscara ou cateter de O₂', 'Ventilação mecânica'].map((t, i) => [t, i + 1] as OpcaoEscala)],
      ['Sinais vitais', ['Controle de rotina (8 horas)', 'Controle a cada 6 horas', 'Controle a cada 4 horas', 'Controle a cada 2 horas ou menos'].map((t, i) => [t, i + 1] as OpcaoEscala)],
      ['Motilidade', ['Movimenta todos os segmentos corporais', 'Limitação de movimentos', 'Dificuldade para movimentar segmentos; mudança de decúbito auxiliada', 'Incapaz de movimentar qualquer segmento; decúbito feito pela enfermagem'].map((t, i) => [t, i + 1] as OpcaoEscala)],
      ['Deambulação', ['Ambulante', 'Necessita de auxílio para deambular', 'Locomoção em cadeira de rodas', 'Restrito ao leito'].map((t, i) => [t, i + 1] as OpcaoEscala)],
      ['Alimentação', ['Autossuficiente', 'Por boca, com auxílio', 'Por sonda nasogástrica', 'Por cateter central'].map((t, i) => [t, i + 1] as OpcaoEscala)],
      ['Cuidado corporal', ['Autossuficiente', 'Auxílio no banho de chuveiro e/ou higiene oral', 'Banho de chuveiro e higiene oral feitos pela enfermagem', 'Banho no leito e higiene oral feitos pela enfermagem'].map((t, i) => [t, i + 1] as OpcaoEscala)],
      ['Eliminação', ['Autossuficiente', 'Vaso sanitário com auxílio', 'Comadre ou eliminações no leito', 'Evacuação no leito e sonda vesical'].map((t, i) => [t, i + 1] as OpcaoEscala)],
      ['Terapêutica', ['IM ou VO', 'EV intermitente', 'EV contínua ou por sonda nasogástrica', 'Drogas vasoativas'].map((t, i) => [t, i + 1] as OpcaoEscala)],
    ],
    classif: (t) => {
      const g = t <= 14 ? 1 : t <= 20 ? 2 : 3
      return {
        txt: `Grau ${g} de dependência`,
        nivel: g === 1 ? 'ok' : g === 2 ? 'warn' : 'danger',
        grau: g,
      }
    },
  },
  morse: {
    nome: 'Morse',
    desc: 'Risco de queda',
    itens: [
      sc('Histórico de quedas nos últimos 3 meses', [['Não', 0], ['Sim', 25]]),
      sc('Diagnóstico secundário', [['Não', 0], ['Sim', 15]]),
      sc('Ajuda para caminhar', [
        ['Nenhuma, acamado, cadeira de rodas ou ajuda da enfermagem', 0],
        ['Muletas, bengala ou andador', 15],
        ['Apoia-se no mobiliário para andar', 30],
      ]),
      sc('Terapia intravenosa ou heparina', [['Não', 0], ['Sim', 20]]),
      sc('Postura ao andar e na transferência', [
        ['Normal, acamado ou imóvel', 0],
        ['Debilitada', 10],
        ['Dependente de ajuda', 20],
      ]),
      sc('Estado mental', [
        ['Consciente das suas capacidades', 0],
        ['Esquece-se das suas limitações', 15],
      ]),
    ],
    classif: (t) =>
      t <= 24
        ? { txt: 'Sem risco de queda', nivel: 'ok' }
        : t <= 50
          ? { txt: 'Baixo risco de queda', nivel: 'warn' }
          : { txt: 'Alto risco de queda', nivel: 'danger' },
  },
  braden: {
    nome: 'Braden',
    desc: 'Risco de lesão por pressão',
    itens: [
      sc('Percepção sensorial', [['Totalmente limitado', 1], ['Muito limitado', 2], ['Levemente limitado', 3], ['Nenhuma limitação', 4]]),
      sc('Umidade', [['Completamente molhada', 1], ['Muito molhada', 2], ['Ocasionalmente molhada', 3], ['Raramente molhada', 4]]),
      sc('Atividade', [['Acamado', 1], ['Confinado à cadeira', 2], ['Anda ocasionalmente', 3], ['Anda frequentemente', 4]]),
      sc('Mobilidade', [['Totalmente imóvel', 1], ['Bastante limitada', 2], ['Levemente limitada', 3], ['Sem limitações', 4]]),
      sc('Nutrição', [['Muito pobre', 1], ['Provavelmente inadequada', 2], ['Adequada', 3], ['Excelente', 4]]),
      sc('Fricção e cisalhamento', [['Problema', 1], ['Problema potencial', 2], ['Nenhum problema aparente', 3]]),
    ],
    classif: (t) =>
      t <= 12
        ? { txt: t <= 9 ? 'Risco muito alto' : 'Risco alto', nivel: 'danger' }
        : t <= 14
          ? { txt: 'Risco moderado', nivel: 'warn' }
          : t <= 18
            ? { txt: 'Risco baixo', nivel: 'warn' }
            : { txt: 'Sem risco', nivel: 'ok' },
  },
  glasgow: {
    nome: 'Glasgow',
    desc: 'Nível de consciência',
    itens: [
      sc('Abertura ocular', [['Espontânea', 4], ['Ao chamado', 3], ['À dor', 2], ['Nenhuma', 1]]),
      sc('Resposta verbal', [['Orientada', 5], ['Confusa', 4], ['Palavras inapropriadas', 3], ['Sons incompreensíveis', 2], ['Nenhuma', 1]]),
      sc('Resposta motora', [['Obedece comandos', 6], ['Localiza dor', 5], ['Retirada à dor', 4], ['Flexão anormal', 3], ['Extensão anormal', 2], ['Nenhuma', 1]]),
    ],
    classif: (t) =>
      t === 15
        ? { txt: 'Sem alteração', nivel: 'ok' }
        : t >= 13
          ? { txt: 'Alteração leve', nivel: 'warn' }
          : t >= 9
            ? { txt: 'Alteração moderada', nivel: 'danger' }
            : { txt: 'Alteração grave', nivel: 'danger' },
  },
  mna: {
    nome: 'MNA triagem',
    desc: 'Estado nutricional',
    itens: [
      sc('Diminuição da ingesta nos últimos 3 meses', [['Diminuição grave', 0], ['Diminuição moderada', 1], ['Sem diminuição', 2]]),
      sc('Perda de peso nos últimos 3 meses', [['Mais de 3 kg', 0], ['Não sabe informar', 1], ['Entre 1 e 3 kg', 2], ['Sem perda de peso', 3]]),
      sc('Mobilidade', [['Restrito ao leito ou à cadeira de rodas', 0], ['Deambula, mas não sai de casa', 1], ['Normal', 2]]),
      sc('Estresse psicológico ou doença aguda nos últimos 3 meses', [['Sim', 0], ['Não', 2]]),
      sc('Problemas neuropsicológicos', [['Demência ou depressão graves', 0], ['Demência leve', 1], ['Sem problemas psicológicos', 2]]),
      sc('Índice de massa corporal', [['IMC menor que 19', 0], ['IMC de 19 a menos de 21', 1], ['IMC de 21 a menos de 23', 2], ['IMC 23 ou mais', 3]]),
    ],
    classif: (t) =>
      t >= 12
        ? { txt: 'Estado nutricional normal', nivel: 'ok' }
        : t >= 8
          ? { txt: 'Risco de desnutrição', nivel: 'warn' }
          : { txt: 'Desnutrição', nivel: 'danger' },
  },
}

export function totalEsc(k: EscalaKey, resp: number[]): number {
  return resp.reduce((s, ix, i) => s + SCALES[k].itens[i][1][ix][1], 0)
}

export function classifEscala(k: EscalaKey, total: number): ClassifEscala {
  return SCALES[k].classif(total)
}

export function ultAval(r: Residente, k: EscalaKey): AvaliacaoEscala | undefined {
  const lista = r.aval.filter((a) => a.esc === k)
  return [...lista].sort((a, b) => b.d.localeCompare(a.d))[0]
}

export function grau(r: Residente): number | null {
  const a = ultAval(r, 'fugulin')
  if (!a) return null
  return classifEscala('fugulin', totalEsc('fugulin', a.resp)).grau ?? null
}