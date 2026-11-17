import type { AvaliacaoEscala, ClassifEscala, EscalaCategoria, EscalaCustomizada, EscalaKey, Residente } from '../../types/ilpi'

export type OpcaoEscala = [string, number]
export type ItemEscala = [string, OpcaoEscala[]]

export interface DefinicaoEscala {
  id?: string
  nome: string
  desc: string
  categoria?: EscalaCategoria
  area?: string
  itens: ItemEscala[]
  classif: (total: number) => ClassifEscala
}

function sc(q: string, ops: OpcaoEscala[]): ItemEscala {
  return [q, ops]
}

export const SCALES: Record<string, DefinicaoEscala> = {
  fugulin: {
    nome: 'Fugulin',
    desc: 'Grau de dependência de enfermagem (RDC 502 / Cofen)',
    categoria: 'dependencia',
    area: 'Enfermagem',
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

  katz: {
    nome: 'Katz (ABVD)',
    desc: 'Índice de Independência em Atividades Básicas de Vida Diária (Padrão Coren-SP / SBGG)',
    categoria: 'dependencia',
    area: 'Enfermagem',
    itens: [
      sc('Banho', [
        ['Independente: lava-se completamente sozinho ou necessita de ajuda apenas para uma parte do corpo (ex: costas)', 1],
        ['Dependente: necessita de ajuda para lavar mais de uma parte do corpo, entrar ou sair do chuveiro/banheira', 0],
      ]),
      sc('Vestir-se', [
        ['Independente: pega as roupas e veste-se completamente sozinho sem auxílio (exceto amarrar sapatos)', 1],
        ['Dependente: necessita de ajuda para vestir-se ou permanece desarrumado/despido', 0],
      ]),
      sc('Uso do vaso sanitário', [
        ['Independente: vai ao vaso, senta/levanta, ajeita as roupas e higieniza-se sem auxílio', 1],
        ['Dependente: necessita de ajuda para ir ao sanitário, limpar-se ou usa comadre/fralda', 0],
      ]),
      sc('Transferência', [
        ['Independente: deita e levanta da cama e senta/levanta da cadeira sozinho', 1],
        ['Dependente: necessita de ajuda de outra pessoa para sentar-se ou levantar-se, ou é acamado', 0],
      ]),
      sc('Continência', [
        ['Independente: controle esfincteriano completo da micção e da evacuação', 1],
        ['Dependente: incontinência total ou parcial, acidentes frequentes ou uso contínuo de fraldas/sondas', 0],
      ]),
      sc('Alimentação', [
        ['Independente: leva a comida do prato à boca sem assistência (corte de alimentos prévio é aceito)', 1],
        ['Dependente: necessita de auxílio para comer, ou alimentado por sonda/cateter', 0],
      ]),
    ],
    classif: (t) => {
      const g = t >= 6 ? 1 : t >= 4 ? 2 : 3
      return {
        txt: t >= 6 ? 'Independente (Grau 1 de dependência)' : t >= 4 ? 'Dependência moderada (Grau 2 de dependência)' : 'Dependência importante (Grau 3 de dependência)',
        nivel: g === 1 ? 'ok' : g === 2 ? 'warn' : 'danger',
        grau: g,
      }
    },
  },

  lawton: {
    nome: 'Lawton & Brody (AIVD)',
    desc: 'Escala de Atividades Instrumentais da Vida Diária (AGA / Avaliação Geriátrica Ampla)',
    categoria: 'dependencia',
    area: 'Enfermagem',
    itens: [
      sc('1. Uso do telefone', [
        ['Utiliza o telefone por iniciativa própria e disca números', 3],
        ['Disca apenas alguns números conhecidos ou atende ligações', 2],
        ['Não atende nem usa telefone', 1],
      ]),
      sc('2. Viagens / Locomoção fora de casa', [
        ['Viaja sozinho em transporte coletivo ou dirige próprio carro', 3],
        ['Viaja se acompanhado ou de táxi/transporte adaptado', 2],
        ['Restrito ao domicílio ou ao leito', 1],
      ]),
      sc('3. Compras', [
        ['Realiza todas as compras necessárias de forma independente', 3],
        ['Compra apenas pequenos itens com auxílio', 2],
        ['Incapaz de fazer compras', 1],
      ]),
      sc('4. Preparo das refeições', [
        ['Planeja, prepara e serve refeições completas adequadamente', 3],
        ['Prepara se os ingredientes forem organizados ou esquenta refeição pronta', 2],
        ['Não prepara nem esquenta refeições', 1],
      ]),
      sc('5. Tarefas domésticas', [
        ['Mantém a casa/quarto em ordem sem dificuldades', 3],
        ['Realiza apenas tarefas leves (arrumar cama, louça simples)', 2],
        ['Incapaz de realizar qualquer tarefa doméstica', 1],
      ]),
      sc('6. Lavagem de roupas', [
        ['Lava e cuida de toda sua roupa pessoal sozinho', 3],
        ['Lava apenas pequenas peças íntimas', 2],
        ['Toda a roupa precisa ser lavada por terceiros', 1],
      ]),
      sc('7. Uso de medicamentos', [
        ['Toma os remédios na dose e horários corretos de forma autônoma', 3],
        ['Toma os remédios se preparados e lembrados previamente por outrem', 2],
        ['Incapaz de administrar seus próprios medicamentos', 1],
      ]),
      sc('8. Manejo financeiro / Dinheiro', [
        ['Administra finanças, contas e pagamentos de forma autônoma', 3],
        ['Maneja dinheiro do dia a dia, mas precisa de ajuda com contas maiores', 2],
        ['Totalmente incapaz de manejar dinheiro', 1],
      ]),
    ],
    classif: (t) =>
      t >= 21
        ? { txt: 'Independência em AIVD', nivel: 'ok' }
        : t >= 14
          ? { txt: 'Dependência parcial em AIVD', nivel: 'warn' }
          : { txt: 'Dependência importante em AIVD', nivel: 'danger' },
  },

  morse: {
    nome: 'Morse',
    desc: 'Risco de queda',
    categoria: 'risco',
    area: 'Fisioterapia',
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
    desc: 'Risco de lesão por pressão (LPP)',
    categoria: 'risco',
    area: 'Enfermagem',
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
    categoria: 'risco',
    area: 'Enfermagem',
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
    desc: 'Mini Avaliação Nutricional (Triagem)',
    categoria: 'nutricao',
    area: 'Nutrição',
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

  gds15: {
    nome: 'GDS-15 (Depressão Geriátrica)',
    desc: 'Escala de Depressão Geriátrica de Yesavage (Rastreio em 15 itens)',
    categoria: 'humor',
    area: 'Psicologia',
    itens: [
      sc('1. Você está basicamente satisfeito com sua vida?', [['Sim', 0], ['Não', 1]]),
      sc('2. Você deixou muitos de seus interesses e atividades?', [['Não', 0], ['Sim', 1]]),
      sc('3. Você sente que sua vida está vazia?', [['Não', 0], ['Sim', 1]]),
      sc('4. Você se aborrece ou fica entediado com frequência?', [['Não', 0], ['Sim', 1]]),
      sc('5. Você está de bom humor na maior parte do tempo?', [['Sim', 0], ['Não', 1]]),
      sc('6. Você tem medo de que algo de ruim vá lhe acontecer?', [['Não', 0], ['Sim', 1]]),
      sc('7. Você se sente feliz na maior parte do tempo?', [['Sim', 0], ['Não', 1]]),
      sc('8. Você se sente desamparado com frequência?', [['Não', 0], ['Sim', 1]]),
      sc('9. Você prefere ficar no quarto a sair e fazer coisas novas?', [['Não', 0], ['Sim', 1]]),
      sc('10. Você sente que tem mais problemas de memória do que os outros?', [['Não', 0], ['Sim', 1]]),
      sc('11. Você acha maravilhoso estar vivo agora?', [['Sim', 0], ['Não', 1]]),
      sc('12. Você se sente inútil no estado em que está agora?', [['Não', 0], ['Sim', 1]]),
      sc('13. Você se sente cheio de energia?', [['Sim', 0], ['Não', 1]]),
      sc('14. Você sente que sua situação não tem esperança?', [['Não', 0], ['Sim', 1]]),
      sc('15. Você acha que a maioria das pessoas está em situação melhor que a sua?', [['Não', 0], ['Sim', 1]]),
    ],
    classif: (t) =>
      t <= 5
        ? { txt: 'Normal (sem indícios de depressão)', nivel: 'ok' }
        : t <= 10
          ? { txt: 'Suspeita de depressão leve a moderada', nivel: 'warn' }
          : { txt: 'Sintomas depressivos graves / severos', nivel: 'danger' },
  },

  meem: {
    nome: 'MEEM (Mini-Mental)',
    desc: 'Mini-Exame do Estado Mental de Folstein (Rastreio Cognitivo e Demência)',
    categoria: 'cognicao',
    area: 'Médico',
    itens: [
      sc('Orientação Temporal (Dia do mês, mês, ano, dia da semana, hora aprox.)', [
        ['5 acertos (completo)', 5],
        ['4 acertos', 4],
        ['3 acertos', 3],
        ['2 acertos', 2],
        ['1 acerto', 1],
        ['Nenhum acerto', 0],
      ]),
      sc('Orientação Espacial (Local/instituição, andar/setor, bairro/rua, cidade, estado)', [
        ['5 acertos (completo)', 5],
        ['4 acertos', 4],
        ['3 acertos', 3],
        ['2 acertos', 2],
        ['1 acerto', 1],
        ['Nenhum acerto', 0],
      ]),
      sc('Memória Imediata / Registro (Repetição imediata de 3 palavras não correlacionadas)', [
        ['3 palavras repetidas corretamente', 3],
        ['2 palavras repetidas', 2],
        ['1 palavra repetida', 1],
        ['Nenhuma repetida', 0],
      ]),
      sc('Atenção e Cálculo (Subtrações de 7 de 100 ou soletrar M-U-N-D-O invertido)', [
        ['5 acertos', 5],
        ['4 acertos', 4],
        ['3 acertos', 3],
        ['2 acertos', 2],
        ['1 acerto', 1],
        ['Nenhum acerto', 0],
      ]),
      sc('Memória de Evocação (Recordação das 3 palavras anteriores)', [
        ['3 palavras recordadas', 3],
        ['2 palavras recordadas', 2],
        ['1 palavra recordada', 1],
        ['Nenhuma palavra recordada', 0],
      ]),
      sc('Linguagem - Nomeação (Identificar caneta e relógio de pulso)', [
        ['2 acertos (ambos nomeados)', 2],
        ['1 acerto', 1],
        ['Nenhum acerto', 0],
      ]),
      sc('Linguagem - Repetição ("Nem aqui, nem ali, nem lá")', [
        ['Repetiu corretamente de primeira', 1],
        ['Errou ou não repetiu', 0],
      ]),
      sc('Linguagem - Comando de 3 estágios (Pegar papel na mão direita, dobrar ao meio e colocar na mesa)', [
        ['3 comandos executados corretamente', 3],
        ['2 comandos executados', 2],
        ['1 comando executado', 1],
        ['Nenhum executado', 0],
      ]),
      sc('Linguagem - Leitura e Execução (Ler a instrução "Feche os olhos" e executar)', [
        ['Leu e fechou os olhos', 1],
        ['Não leu ou não executou', 0],
      ]),
      sc('Linguagem - Escrita (Escrever uma frase completa com sentido)', [
        ['Frase compreensível com sujeito e verbo', 1],
        ['Incompreensível, palavra isolada ou não escreveu', 0],
      ]),
      sc('Praxia Construtiva (Copiar o desenho de dois pentágonos com interseção)', [
        ['Cópia correta com interseção visível', 1],
        ['Incorreta ou não copiou', 0],
      ]),
    ],
    classif: (t) =>
      t >= 24
        ? { txt: 'Cognição preservada', nivel: 'ok' }
        : t >= 18
          ? { txt: 'Declínio cognitivo leve a moderado', nivel: 'warn' }
          : { txt: 'Declínio cognitivo importante / grave', nivel: 'danger' },
  },

  cdr: {
    nome: 'CDR (Estágio de Demência)',
    desc: 'Clinical Dementia Rating (Classificação Clínica e Estágio de Demência)',
    categoria: 'cognicao',
    area: 'Médico',
    itens: [
      sc('Memória', [
        ['Sem perda de memória ou apenas esquecimento inconsistente ocasional (CDR 0)', 0],
        ['Esquecimento leve, mas consistente; recordação parcial de eventos (CDR 0.5)', 5],
        ['Perda moderada de memória, mais marcada para eventos recentes; interfere no dia a dia (CDR 1)', 10],
        ['Perda grave de memória; retém apenas material altamente aprendido (CDR 2)', 20],
        ['Perda severa; restam apenas fragmentos mínimos de memória (CDR 3)', 30],
      ]),
      sc('Orientação', [
        ['Plenamente orientado no tempo e espaço (CDR 0)', 0],
        ['Plenamente orientado, exceto com ligeira dificuldade de relações temporais (CDR 0.5)', 5],
        ['Dificuldade moderada com relações temporais; orientado no espaço geográfico (CDR 1)', 10],
        ['Gravemente desorientado no tempo e frequentemente no espaço (CDR 2)', 20],
        ['Orientado apenas em relação à própria pessoa / nome (CDR 3)', 30],
      ]),
      sc('Julgamento e Solução de Problemas', [
        ['Resolve bem problemas cotidianos; lida bem com finanças e negócios (CDR 0)', 0],
        ['Ligeira dificuldade em solucionar problemas e semelhanças (CDR 0.5)', 5],
        ['Dificuldade moderada em lidar com problemas e abstrações; julgamento social prejudicado (CDR 1)', 10],
        ['Gravemente comprometido para resolver problemas e julgar situações (CDR 2)', 20],
        ['Incapaz de fazer julgamentos ou resolver qualquer problema (CDR 3)', 30],
      ]),
      sc('Assuntos Comunitários', [
        ['Função independente no trabalho, compras e grupos comunitários (CDR 0)', 0],
        ['Dúvida ou ligeira dificuldade nessas atividades (CDR 0.5)', 5],
        ['Incapaz de funcionar independentemente fora da residência, embora aparente normalidade (CDR 1)', 10],
        ['Nenhuma atividade fora da residência de forma independente (CDR 2)', 20],
        ['Totalmente dependente no ambiente social (CDR 3)', 30],
      ]),
      sc('Lar e Passatempos', [
        ['Vida doméstica, hobbies e interesses intelectuais preservados (CDR 0)', 0],
        ['Vida doméstica e interesses ligeiramente comprometidos ou abandonou hobbies mais difíceis (CDR 0.5)', 5],
        ['Comprometimento leve mas claro nas funções em casa; abandonou tarefas mais complexas (CDR 1)', 10],
        ['Apenas tarefas muito simples preservadas; interesse bastante restrito (CDR 2)', 20],
        ['Nenhuma função significativa em atividades domésticas (CDR 3)', 30],
      ]),
      sc('Cuidados Pessoais', [
        ['Totalmente capaz de autocuidado, higiene e vestimenta (CDR 0)', 0],
        ['Totalmente capaz de autocuidado, exigindo apenas estímulo eventual (CDR 0)', 0],
        ['Necessita de lembretes e supervisão para vestir-se e higiene (CDR 1)', 10],
        ['Necessita de assistência direta para vestir-se e higiene corporal (CDR 2)', 20],
        ['Exige assistência total para cuidados pessoais, frequentemente incontinente (CDR 3)', 30],
      ]),
    ],
    classif: (t) => {
      if (t === 0) return { txt: 'CDR 0 — Sem demência / Normal', nivel: 'ok' }
      if (t <= 30) return { txt: 'CDR 0.5 — Demência questionável / CCL', nivel: 'warn' }
      if (t <= 70) return { txt: 'CDR 1 — Demência leve', nivel: 'warn' }
      if (t <= 130) return { txt: 'CDR 2 — Demência moderada', nivel: 'danger' }
      return { txt: 'CDR 3 — Demência grave / avançada', nivel: 'danger' }
    },
  },

  ohat: {
    nome: 'OHAT (Saúde Bucal)',
    desc: 'Oral Health Assessment Tool (Triagem de Saúde Bucal Geriátrica / Odontologia)',
    categoria: 'odontologia',
    area: 'Odontologia',
    itens: [
      sc('Lábios', [
        ['Suaves, rosados e úmidos', 0],
        ['Secos, rachados ou cantos avermelhados', 1],
        ['Com fissuras profundas, sangramento ou úlceras', 2],
      ]),
      sc('Língua', [
        ['Limpa, rosada e úmida', 0],
        ['Com saburra, perda de papilas ou ressecamento moderado', 1],
        ['Muito vermelha, dolorida, placas brancas ou úlceras', 2],
      ]),
      sc('Gengivas e Mucosa oral', [
        ['Rosa, firme e sem lesões', 0],
        ['Seca, avermelhada ou edema leve', 1],
        ['Sangramento espontâneo, estomatite ou úlcera', 2],
      ]),
      sc('Saliva', [
        ['Umidade bucal adequada e fluida', 0],
        ['Pouca saliva, boca ressecada', 1],
        ['Ausência de saliva ou saliva extremamente espessa', 2],
      ]),
      sc('Dentes Naturais', [
        ['Sem dentes cariados ou quebrados', 0],
        ['1 a 3 dentes com cárie/quebrados ou muito desgastados', 1],
        ['4 ou mais dentes cariados/raízes residuais ou dor declarada', 2],
      ]),
      sc('Próteses Dentárias', [
        ['Limpa, bem adaptada e estável (ou não usa)', 0],
        ['Adaptação frouxa ou não usa parte do tempo', 1],
        ['Quebrada, machuca a gengiva ou necessita substituição urgente', 2],
      ]),
      sc('Higiene Bucal', [
        ['Boca limpa e sem restos de comida', 0],
        ['Restos de alimento ou placa visível em poucas áreas', 1],
        ['Placa abundante, tártaro ou hálito fétido evidente', 2],
      ]),
      sc('Dor Dental ou Desconforto', [
        ['Nenhum sinal verbal ou comportamental de dor', 0],
        ['Desconforto ao mastigar ou tocar', 1],
        ['Dor evidente, choro, recusa alimentar ou edema facial', 2],
      ]),
    ],
    classif: (t) =>
      t <= 1
        ? { txt: 'Saúde bucal saudável', nivel: 'ok' }
        : t <= 3
          ? { txt: 'Alteração leve — Acompanhamento e higiene', nivel: 'warn' }
          : { txt: 'Necessidade de intervenção odontológica prioritária', nivel: 'danger' },
  },
}

export function obterDefinicaoEscala(
  k: string,
  customScales: EscalaCustomizada[] = [],
): DefinicaoEscala | undefined {
  if (SCALES[k]) {
    return SCALES[k]
  }
  const custom = customScales.find((c) => c.id === k)
  if (custom) {
    return {
      id: custom.id,
      nome: custom.nome,
      desc: custom.desc,
      categoria: custom.categoria,
      area: custom.area,
      itens: custom.itens,
      classif: (total: number) => {
        const match = custom.faixas.find((f) => total >= f.min && total <= f.max)
        if (match) {
          return {
            txt: match.txt,
            nivel: match.nivel,
            grau: match.grau,
          }
        }
        return {
          txt: `Pontuação: ${total}`,
          nivel: 'ok',
        }
      },
    }
  }
  return undefined
}

export function totalEsc(
  k: string,
  resp: number[],
  customScales: EscalaCustomizada[] = [],
): number {
  const def = obterDefinicaoEscala(k, customScales)
  if (!def || !Array.isArray(resp)) return 0
  return resp.reduce((s, ix, i) => {
    const item = def.itens[i]
    if (!item) return s
    const options = item[1]
    if (!options) return s
    if (options[ix] !== undefined) {
      return s + options[ix][1]
    }
    // Fallback retrocompatível: caso o valor salvo tenha sido a pontuação bruta em vez do índice
    const match = options.find(([, pt]) => pt === ix)
    if (match) {
      return s + match[1]
    }
    return s
  }, 0)
}

export function classifEscala(
  k: string,
  total: number,
  customScales: EscalaCustomizada[] = [],
): ClassifEscala {
  const def = obterDefinicaoEscala(k, customScales)
  if (!def) return { txt: `Pontuação: ${total}`, nivel: 'ok' }
  return def.classif(total)
}

export function ultAval(r: Residente, k: EscalaKey): AvaliacaoEscala | undefined {
  const lista = r.aval.filter((a) => a.esc === k)
  return [...lista].sort((a, b) => b.d.localeCompare(a.d))[0]
}

export function grau(
  r: Residente,
  escalaDependenciaPref?: string,
  customScales: EscalaCustomizada[] = [],
): number | null {
  // Se a ILPI prefere Katz ou se a escala padrão for Katz
  if (escalaDependenciaPref === 'katz') {
    const k = ultAval(r, 'katz')
    if (k) {
      return classifEscala('katz', totalEsc('katz', k.resp, customScales), customScales).grau ?? null
    }
  }

  // Tenta Fugulin
  const f = ultAval(r, 'fugulin')
  if (f) {
    return classifEscala('fugulin', totalEsc('fugulin', f.resp, customScales), customScales).grau ?? null
  }

  // Fallback para Katz se não houver Fugulin
  const k = ultAval(r, 'katz')
  if (k) {
    return classifEscala('katz', totalEsc('katz', k.resp, customScales), customScales).grau ?? null
  }

  return null
}
