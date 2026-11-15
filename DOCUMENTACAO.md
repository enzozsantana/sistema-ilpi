# Sistema ILPI: documentação do protótipo

Versão 3 do protótipo, novembro de 2026.

Este documento descreve o que o protótipo faz, como as partes se conectam e o que falta para virar um sistema de verdade. Ele foi escrito para duas pessoas: a equipe de enfermagem que pensou o sistema e o desenvolvedor que vai construí-lo.

---

## 1. O que é

Um sistema de gestão para Instituição de Longa Permanência para Idosos (ILPI) que substitui os formulários em papel da casa: anotação de enfermagem, prescrição médica com checagem, plano individual de cuidados, PIA, escalas, controle de geladeira, escala de trabalho e documentos da instituição.

O diferencial é que **as partes conversam entre si**:

- A **prescrição médica** gera a ronda de medicação do dia.
- Cada dose checada **baixa sozinha do estoque** daquele residente.
- O estoque calcula **até que dia cada remédio dura** e monta o pedido para a família no WhatsApp.
- As **escalas** (Fugulin, Morse, Braden, Glasgow, MNA) sugerem o que entra no **PIA**.
- O **Fugulin** de todos os residentes calcula o **dimensionamento de cuidadores** e compara com a escala do dia.
- As **ocorrências** registradas nas anotações geram os **indicadores da Vigilância**.
- A tela de abertura mostra **só os alertas que cabem à função** de quem entrou.

---

## 2. Arquivos deste pacote

| Arquivo | O que é |
|---|---|
| `sistema-ilpi.html` | O protótipo completo. Abre direto no navegador, no computador ou no celular. |
| `DOCUMENTACAO.md` | Este documento. |
| `DOCUMENTACAO.html` | Este mesmo documento, formatado para ler no navegador. |
| `dados-exemplo.json` | Os dados fictícios do protótipo, no formato usado pelo sistema. Serve de referência para o banco de dados. |
| `LEIA-ME.txt` | Instruções rápidas. |

---

## 3. Como usar o protótipo

1. Abra `sistema-ilpi.html` em um navegador (Chrome, Edge, Safari ou Firefox).
2. No topo, em **Entrou como**, escolha o profissional. A tela muda conforme a função.
3. Os dados ficam salvos **somente naquele navegador e naquele aparelho**.
4. Para voltar aos dados de exemplo: entre como Enfermeira RT, vá em **Gestão** e use **Restaurar dados de exemplo**.

**Importante:** todos os nomes, números de conselho e dados clínicos do protótipo são fictícios. Não cadastre dados reais de residentes no protótipo, porque ele não tem login, criptografia nem cópia de segurança.

---

## 4. Perfis e o que cada um vê

O acesso é definido pela **categoria** do profissional, escolhida no cadastro da equipe.

### 4.1 Menu principal

| Tela | RT / Enfermeiro | Técnico / Auxiliar | Estagiário | Cuidador | Médico | Multi (fisio, nutri, psico) | Apoio |
|---|---|---|---|---|---|---|---|
| Plantão | Sim | Sim | Sim | Sim | Sim | Sim | Sim |
| Residentes (pastas) | Sim | Sim | Sim | Sim | Sim | Sim | Não |
| Estoque | Sim | Sim | Não | Não | Não | Não | Não |
| Rotinas | Sim | Sim | Sim | Só tarefas | Não | Não | Só tarefas |
| Equipe | Sim (edita) | Sim (vê) | Sim (vê) | Sim (vê) | Não | Não | Não |
| Gestão | Sim | Não | Não | Não | Não | Não | Não |

### 4.2 Abas da pasta do residente

| Aba | RT / Enf. | Téc. / Aux. | Estagiário | Cuidador | Médico | Multi |
|---|---|---|---|---|---|---|
| Pasta (resumo) | Sim | Sim | Sim | Sim | Sim | Sim |
| Ficha | Edita | Vê | Vê | Vê | Vê | Vê |
| Avaliações | Todas, edita | Todas, vê | Todas, vê | Não | Todas, vê | Só a escala da área |
| PIA enfermagem | Edita | Vê | Vê | Não | Vê | Não |
| Plano de cuidados | Edita | Checa | Checa | Checa | Não | Não |
| Prescrição médica | Transcreve | Checa doses | Checa doses | Não | Prescreve | Não |
| Anotações | Sim | Sim | Sim | Não | Vê | Não |
| Evolução | Todas | Não | Não | Não | Todas | Só a da própria área |
| Exames e documentos | Sim | Sim | Não | Não | Sim | Sim |
| Estoque | Sim | Sim | Não | Não | Não | Não |
| Prontuário completo | Sim | Não | Não | Não | Sim | Não |

### 4.3 Escalas por área

| Escala | Quem aplica |
|---|---|
| Fugulin (grau de dependência) | Enfermeiro |
| Morse (risco de queda) | Enfermeiro e fisioterapeuta |
| Braden (risco de lesão por pressão) | Enfermeiro |
| Glasgow (nível de consciência) | Enfermeiro |
| MNA triagem (estado nutricional) | Enfermeiro e nutricionista |

Psicólogo não tem escala cadastrada. A aba Avaliações some para ele.

### 4.4 Regras de bloqueio

- O cuidador **não checa medicação**, só cuidados.
- A equipe multi **não vê** temperatura da geladeira, estoque, escala de enfermagem nem alertas de outras áreas.
- Quem checou um cuidado é o único que pode desfazer, além do RT e do enfermeiro.

---

## 5. Módulos

### 5.1 Plantão

Tela inicial de cada profissional. Mostra:

- Data, saudação e o código do plantão na escala (D, N, M, T etc.).
- **Alertas** filtrados pela função, com o mais grave primeiro. Cada alerta leva direto à tela que resolve o problema.
- **Medicação do dia** (enfermagem): doses agrupadas por horário. Ao tocar, a janela mostra a **foto do residente**, a alergia e o estoque, com três opções: administrado, recusou ou não administrado. Recusa e não administração exigem motivo.
- Medicamentos **se necessário** (SN), com registro do motivo.
- **Plano de cuidados** (enfermagem e cuidadores): checagem com "AT" assinado.
- **Sinais vitais e anotação** de cada residente.
- **Minhas tarefas** da escala de organização.
- Para médico e multi: atividades planejadas para hoje e atalho para as pastas.

### 5.2 Residentes (pastas)

Lista em forma de pastas, com foto, quarto, idade, alergia e selos de grau de dependência, documentos pendentes e remédios acabando.

Dentro da pasta:

- **Pasta:** resumo do prontuário com os quadros que a função pode ver.
- **Ficha de acolhimento:** identificação, escolaridade, profissão, estado civil, filhos, convênio, médico, origem da solicitação de entrada, alergias, cirurgias, doenças de base, responsável, contrato, documentos entregues e participação do residente (do que gosta, o que não gosta, música, comida, religião, horário preferido).
- **Avaliações:** escalas com soma e classificação automáticas e histórico.
- **PIA de enfermagem:** baseado em 15 necessidades padronizadas (meta, intervenções e como avaliar). O sistema sugere quais marcar a partir das escalas, polifarmácia (5 ou mais medicamentos), doenças de base e variação de peso.
- **Plano de cuidados:** prescrição de enfermagem em grade semanal com AT por dia e assinatura.
- **Prescrição médica:** itens com dose, via e frequência (diário, dias da semana, a cada N dias ou SN), ligados ao estoque. A grade semanal de checagem replica a folha de papel.
- **Anotações de enfermagem:** PA, pulso, respiração, temperatura, saturação, evacuação e diurese, com frases prontas, gráficos de tendência e alerta de valores alterados. Também registra ocorrências (queda, desidratação, escabiose etc.).
- **Evolução:** por área profissional, com atividades planejadas (ex.: psicologia) e gráfico de peso (nutrição).
- **Exames e documentos:** anexos de foto ou PDF (exame, laudo, receita, documento pessoal, termo).
- **Estoque:** medicamentos do residente.
- **Prontuário completo:** junta todas as abas para imprimir ou salvar em PDF.

### 5.3 Estoque

- **Medicamentos dos residentes:** cada residente tem o próprio estoque. O consumo vem da prescrição.
- **Materiais da casa:** fraldas, luvas, fitas de glicemia etc., com consumo diário informado manualmente.
- Botões **Pedir à família** (por residente) e **Lista do mês para WhatsApp** (materiais da casa).

### 5.4 Rotinas

- **Temperatura da geladeira:** máxima, mínima, momento e ambiente, manhã e noite, com gráfico da faixa segura de 2 a 8 °C e tabela do mês (só enfermagem).
- **Escala de organização:** tarefas por dia da semana e responsável, com checklist.

### 5.5 Equipe

- Quem está de plantão hoje.
- **Escala mensal de enfermagem** com os códigos D (dia 12h), N (noite 12h), M (manhã), T (tarde), F (folga), FE (férias), L (licença), H (hospitalização) e EX (extra). Preenchida tocando nos dias.
- Equipe multiprofissional com carga horária e horário.
- Cadastro de profissionais (categoria, função, conselho, setor e área).
- **Treinamentos mensais** com lista de presença.

### 5.6 Gestão (RT e enfermeiro)

- **Grau de dependência e dimensionamento** a partir do Fugulin.
- **Alvarás e licenças** com validade e alerta (Prefeitura, Vigilância Sanitária, CMDPI, Certidão de RT no COREN e outros).
- **Manuais, protocolos, POPs e fluxogramas**, com alerta de revisão anual.
- **Indicadores da Vigilância**, com botão para copiar para a planilha.
- Nome da instituição.

---

## 6. Regras de negócio

### 6.1 Medicação e estoque

- **Horários do dia:** item diário usa todos os horários; item semanal só nos dias marcados; item "a cada N dias" conta a partir da data de início; SN não entra na ronda.
- **Consumo por dia** de um item de estoque = soma, nas prescrições ativas ligadas a ele, de `gasto por administração × nº de horários`, ajustado por `dias/7` (semanal) ou `1/N` (a cada N dias). SN não entra no cálculo.
- **Dias restantes** = quantidade ÷ consumo por dia.
- **Nível do estoque:**
  - Crítico: 3 dias ou menos, ou quantidade zero.
  - Acabando: 7 dias ou menos, ou abaixo do mínimo.
  - Em dia: acima disso.
- **Quantidade a pedir** (30 dias) = `consumo × 30 + mínimo − quantidade atual`, arredondado para cima.
- Checar "administrado" **baixa** o estoque; desfazer a checagem **devolve**. Se não houver estoque suficiente, a checagem é bloqueada.
- Dose sem checagem **30 minutos** após o horário vira "atrasada".
- Ao incluir um medicamento que contém o texto de uma alergia registrada, o sistema **bloqueia** até que alguém confirme que falou com o prescritor.

### 6.2 Sinais vitais (alerta automático)

| Sinal | Alerta quando |
|---|---|
| PA | Sistólica ≥ 140 ou diastólica ≥ 90 (elevada); sistólica < 90 ou diastólica < 60 (baixa) |
| Pulso | < 60 (bradicardia) ou > 100 (taquicardia) |
| Respiração | < 12 ou > 24 |
| Temperatura | < 35 °C (hipotermia) ou ≥ 37,8 °C (febre) |
| Saturação | < 92% |

Esses limites são de referência geral e devem ser revistos pela RT. Na versão final, o ideal é permitir limites individuais por residente.

### 6.3 Escalas

| Escala | Classificação usada |
|---|---|
| Fugulin (9 itens, 1 a 4 pontos) | Até 14: grau 1. De 15 a 20: grau 2. Acima de 20: grau 3. |
| Morse | 0 a 24: sem risco. 25 a 50: baixo risco. Acima de 50: alto risco. |
| Braden | ≤ 9: muito alto. 10 a 12: alto. 13 a 14: moderado. 15 a 18: baixo. ≥ 19: sem risco. |
| Glasgow | 15: sem alteração. 13 a 14: leve. 9 a 12: moderada. ≤ 8: grave. |
| MNA triagem | 12 a 14: normal. 8 a 11: risco de desnutrição. 0 a 7: desnutrição. |

**Atenção:** a conversão da soma do Fugulin em grau 1, 2 ou 3 da RDC 502/2021 foi uma simplificação do protótipo. A equipe precisa validar esses cortes antes da versão final.

### 6.4 Dimensionamento de cuidadores

Pela proporção da RDC 502/2021 da Anvisa:

- Grau 1: 1 cuidador para cada 20 residentes, com carga de 8 horas por dia.
- Grau 2: 1 cuidador para cada 10 residentes, por turno.
- Grau 3: 1 cuidador para cada 6 residentes, por turno.

O sistema compara o necessário com técnicos, auxiliares e cuidadores escalados hoje no dia (D, M, T) e na noite (N). A norma vigente deve ser conferida sempre.

### 6.5 Indicadores da Vigilância

`Taxa = casos no mês ÷ residentes no mês × 100`

- Residentes no mês: acolhidos até o fim do mês e sem óbito antes do início do mês.
- Mortalidade, DDA, escabiose e desidratação contam **eventos**.
- Lesão por pressão e desnutrição contam **residentes** com o evento (prevalência).

É preciso conferir o modelo exato da planilha exigida pela Vigilância Sanitária do município.

### 6.6 Alertas por função

| Alerta | Quem vê |
|---|---|
| Doses sem checagem | Enfermagem |
| Sinal vital alterado na última anotação | Enfermagem e médico |
| Geladeira fora da faixa ou sem registro da manhã | Enfermagem |
| Estoque acabando (residente e casa) | RT e enfermeiro |
| Alvará ou licença vencendo em até 60 dias | RT e enfermeiro |
| SSVV sem anotação depois das 10h | RT e enfermeiro |
| Variação de peso de 5% ou mais | RT e enfermeiro |
| Fugulin com mais de 90 dias ou sem PIA | RT e enfermeiro |
| PIA com reavaliação vencida | RT e enfermeiro |
| Treinamento do mês não registrado | RT e enfermeiro |
| POP ou protocolo sem revisão há mais de 1 ano | RT e enfermeiro |
| Documentos pendentes na ficha | RT e enfermeiro |

### 6.7 Assinatura

Todo registro guarda **quem** (id do profissional), **data** e **hora**. Na tela aparece como carimbo: nome, conselho e número, data e hora.

---

## 7. Modelo de dados

O protótipo guarda tudo em um único objeto JSON. O arquivo `dados-exemplo.json` mostra a estrutura completa. Na versão final, cada bloco abaixo deve virar uma tabela.

### 7.1 Entidades principais

```
instituicao       nome
profissional      id, nome, categoria, funcao, conselho, setor, area, carga, horario
residente         id, nome, sexo, nasc, quarto, admissao, escolaridade, estadoCivil,
                  filhos, profissao, convenio, alergias, doencas[], outras, cirurgias,
                  medico (id), status (ativo | obito), obitoData, entrada,
                  responsavel {nome, parentesco, tel}, contrato,
                  docs {vacina, rg, cpf, sus, convenio, contrato, funerario, obito},
                  pref {gosta, naoGosta, hobbies, musica, religiao, horario, comida, comidaNao},
                  foto
avaliacao         id, residente, escala, data, respostas[], assinatura
pia               id, residente, periodo, inicio, reavaliacao, necessidades[], obs,
                  resultado, encaminhamentos, assinatura
cuidado           id, residente, texto, quem (todos | enfermagem | cuidador)
checagem_cuidado  data, residente, cuidado, assinatura
item_estoque      id, residente (ou casa), nome, unidade, quantidade, minimo,
                  consumoDia (só casa), entradas[]
prescricao        id, residente, medicamento, dose, via, tipo (fixo | semanal | intervalo | sn),
                  horarios[], dias[], intervalo, consumo, item_estoque, inicio, fim,
                  obs, prescritor, suspensa, assinatura
administracao     data, residente, prescricao, horario, status (dado | recusado | nao),
                  motivo, assinatura
administracao_sn  id, residente, prescricao, motivo, assinatura
anotacao          id, residente, pa, pulso, resp, temp, sat, evac, diurese, texto, assinatura
evolucao          id, residente, area, texto, peso, assinatura
agenda            id, residente, area, data, atividade, assinatura (quando realizada)
arquivo           id, residente, nome, categoria, data, tipo, arquivo, area, assinatura
ocorrencia        id, residente, tipo, data
temperatura       id, data, turno, hora, max, min, momento, ambiente, assinatura
escala_mes        mes, profissional, codigos[dia]
tarefa            id, tarefa, responsavel, dias[]
tarefa_feita      data, tarefa
documento_inst    id, nome, orgao, validade
pop               id, titulo, tipo (POP | Protocolo | Manual | Fluxograma), revisao
treinamento       id, data, tema, presentes[]
```

### 7.2 Formato da assinatura

```json
{ "id": "s3", "d": "2026-11-13", "h": "08:20" }
```

### 7.3 Chave de uma dose

`residente | prescricao | horario` (ex.: `r1|p7|07:00`), agrupada pela data.

---

## 8. Limitações do protótipo

- **Sem servidor:** os dados ficam no navegador de um aparelho. Não sincronizam entre celulares.
- **Sem login:** a troca de usuário é livre, só para demonstração.
- **Assinatura não tem validade legal:** é só o registro de quem fez.
- **Arquivos com limite:** fotos são reduzidas e PDFs ficam limitados a 1,5 MB, porque o armazenamento do navegador é pequeno.
- **Sem histórico de alterações:** editar a ficha substitui o valor anterior.
- **Sem cópia de segurança.**

---

## 9. O que é preciso para a versão final

### 9.1 Segurança e LGPD

Dados de saúde são **dados pessoais sensíveis** pela LGPD (Lei 13.709/2018). A versão final precisa de:

- Login individual com senha forte e, de preferência, verificação em duas etapas.
- Permissões aplicadas **no servidor**, não só na tela.
- Criptografia na transmissão (HTTPS) e no armazenamento.
- Registro de auditoria: quem viu, criou, alterou ou excluiu cada informação.
- Cópia de segurança automática.
- Termo de consentimento e política de privacidade.
- Prazo de guarda do prontuário conforme as normas do conselho profissional.

### 9.2 Assinatura eletrônica

Para que o prontuário eletrônico substitua o papel, a assinatura deve seguir as regras do conselho profissional e da legislação de prontuário eletrônico, em geral com certificado digital ICP-Brasil. Esse ponto precisa ser confirmado com o COREN-SP e com o desenvolvedor.

### 9.3 Registros que não podem ser apagados

Anotação, checagem, evolução e prescrição não devem ser apagadas nem editadas depois de assinadas. A correção deve ser feita por um novo registro de retificação, que mantém o original visível.

### 9.4 Sugestão de tecnologia

Qualquer tecnologia web moderna atende. Uma combinação comum:

- **Aplicativo:** web responsivo (PWA), para funcionar no celular do plantão sem precisar de loja de aplicativos.
- **Servidor e banco:** banco relacional (PostgreSQL, por exemplo) com API autenticada.
- **Arquivos:** armazenamento de objetos com acesso privado.
- **Notificações:** alertas de estoque e de validade por e-mail ou WhatsApp.

### 9.5 Melhorias sugeridas

- Limites de sinais vitais individuais por residente.
- Leitura da receita por foto para preencher a prescrição.
- Aviso automático ao responsável quando o remédio estiver acabando.
- Portal da família, com acesso restrito.
- Relatório mensal de indicadores em PDF.
- Funcionamento sem internet, com sincronização posterior.
- Etiqueta com QR Code no quarto ou na pulseira para abrir a pasta do residente.

---

## 10. Pontos que a equipe precisa validar

1. Cortes do Fugulin para os graus 1, 2 e 3.
2. Limites de alerta dos sinais vitais.
3. Modelo da planilha de indicadores da Vigilância do município.
4. Lista das 15 necessidades do PIA e seus textos.
5. Quem pode ver e editar cada aba (seção 4).
6. Códigos da escala de trabalho.
7. Exigências de assinatura do COREN-SP para prontuário eletrônico.
