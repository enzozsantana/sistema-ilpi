# Senecurare — Sistema de Gestão para ILPI

> **"Raízes de cuidado, laços de vida."**  
> Plataforma integrada de prontuário eletrônico multidisciplinar, gestão assistencial, controle farmacêutico, supervisão regulatória e telemedicina para **Instituições de Longa Permanência para Idosos (ILPI)**, em total conformidade com a **RDC 502/2021 da ANVISA** e o **Estatuto da Pessoa Idosa (Lei nº 10.741/2003)**.

---

## 🚀 Acesso em Produção (Live App)

O sistema está publicado e operando online:

- **Link de Produção:** [https://sistema-ilpi.vercel.app](https://sistema-ilpi.vercel.app)
- **Repositório GitHub:** [https://github.com/enzozsantana/sistema-ilpi](https://github.com/enzozsantana/sistema-ilpi)
- **Documentação Técnica Completa:** Veja o arquivo detalhado de documentação de engenharia e regras de negócio.

### 🔑 Contas de Demonstração Ativas (Senha universal: `ILPI-Demo-2026!`):
- **Enfermeira RT (Responsável Técnica):** `s1@ilpi.demo` (Helena Prado — acesso completo)
- **Médica Assistente:** `s9@ilpi.demo` (Dra. Beatriz Moraes — prescrições e evoluções)
- **Cuidadora de Idosos:** `s5@ilpi.demo` (Débora Lins — checagem beira-leito e plantão)
- **Fisioterapeuta:** `s10@ilpi.demo` (Tiago Rocha — evolução multidisciplinar)
- **Enfermeiro:** `s2@ilpi.demo` (Rafael Duarte)
- **Nutricionista:** `s11@ilpi.demo` (Paula Reis)
- **Psicólogo:** `s12@ilpi.demo` (Marcos Vidal)

---

## 🌟 Principais Recursos & Módulos

### 1. Painel de Plantão & Checagem Beira-Leito
- **Passagem de Plantão Digital:** Registro de intercorrências com status de resolução por turno.
- **Checagem Horária de Medicamentos:** Grade visual com alerta de atraso, justificativa obrigatória para recusas/omissões e baixa automática no estoque individual do residente.
- **Medicação Se Necessário (SN):** Lançamento avulso atrelado à prescrição médica.
- **Rondas de Cuidado:** Registro de banho, trocas de fralda com escala de Bristol e hidratação.
- **Sinais Vitais:** PA, FC, FR, Temperatura, SatO2 e Glicemia Capilar (Dextro).

### 2. Residentes & Prontuário Multidisciplinar
- **Dossiê Completo:** Dados cadastrais, quarto, leito e contato familiar com botão de WhatsApp direto.
- **Escalas Clínicas:**
  - **Fugulin:** Grau de dependência (Graus I, II e III) com dimensionamento de cuidadores.
  - **Morse:** Risco de quedas.
  - **Braden:** Risco de Lesão por Pressão (LPP).
  - **MNA:** Mini Avaliação Nutricional.
- **PIA (Plano Individual de Atendimento):** Metas periódicas por especialidade com reavaliação quadrimestral obrigatória.
- **Controle Fotográfico de Curativos & LPP:** Mapa corporal, estadiamento I-IV, medição em centímetros, aspectos do leito/exsudato e histórico fotográfico da cicatrização.
- **Gestão de Prescrições:** Edição de posologia, suspensão com justificativa e suporte a **Farmácia Popular**.
- **Anexos & Exames:** Arquivamento de laudos, exames laboratoriais e termos assinados.

### 3. Farmácia & Controle de Estoque
- Estoque individual por residente e estoque coletivo da casa.
- Rastreamento de lotes e datas de validade.
- Cálculo de autonomia (dias de tratamento restantes) com alerta de reposição crítica (< 7 dias).
- Gerador de mensagem WhatsApp para pedido aos familiares e lista mensal de compras com triagem de urgência.

### 4. Rotinas, POPs & Cadeia de Frio (RDC 502)
- **Cadeia de Frio:** Monitoramento bidiário de temperatura da geladeira de medicamentos (faixa obrigatória ANVISA: **2 °C a 8 °C**) com alerta visual de desvio.
- **POPs (Procedimentos Operacionais Padrão):** Protocolos institucionais com vigência anual, anexos físicos assinados em PDF e controle de revisão.
- Checklist semanal de tarefas operacionais da instituição.

### 5. Quadro de Equipe & Escalas
- Diretório de profissionais com número de conselho (COREN, CRM, CREFITO, etc.).
- Dimensionamento automático de cuidadores e técnicos por grau de dependência Fugulin.
- Grade interativa de plantões mensais com preenchimento rápido no padrão 12×36.

### 6. Gestão & Indicadores Regulatórios
- Painel de indicadores de qualidade para a Vigilância Sanitária (taxa de ocupação, quedas, LPP, hospitalizações e eventos sentinela).
- Controle de alvarás, AVCB dos Bombeiros e licenças com alertas de vencimento prévio.

### 7. Teleconsulta & Consultório Virtual
- Agendamento de consultas remotas com especialistas geriátricos.
- Videochamada integrada com compartilhamento de prontuário em tempo real.
- **Split de Pagamentos Mercado Pago:** Integração OAuth com repasse automatizado e retenção de taxa de comissão para a ILPI.

### 8. Treinamentos & Educação Permanente (Art. 38 RDC 502)
- Catálogo de cursos obrigatórios da ANVISA e cursos personalizados da própria ILPI.
- Atribuição individual ou em lote por cargo com controle de prazo de conclusão.
- Quizzes avaliativos com nota de corte.
- Emissão instantânea de certificados oficiais em PDF com identificador único de autenticidade.

### 9. Busca Global Rápida (Command Palette `Ctrl + K`)
- Localização instantânea de qualquer residente, quarto, remédio ou módulo sem necessidade do mouse.

### 10. Progressive Web App (PWA) & Modo Offline
- Instalável no Google Chrome (Desktop e Mobile) em janela standalone com atalho próprio.
- Service Worker com cache seguro e detecção de conectividade em tempo real (*Sincronizado* / *Modo Local*).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React, Radix UI, Sonner, jsPDF.
- **Backend / BaaS:** Supabase (PostgreSQL 15, Row Level Security, Auth, Storage).
- **Fintech / Split:** Mercado Pago Marketplace OAuth API.
- **Qualidade & Testes:** Vitest, Testing Library (React & Jest-DOM), jsdom (**264 testes automatizados em 40 arquivos — 100% aprovados**), Oxlint.
- **Hospedagem & Deploy:** Vercel.

---

## 💻 Instalação e Execução Local

```bash
# 1. Clone o repositório
git clone https://github.com/enzozsantana/sistema-ilpi.git
cd sistema-ilpi

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente (.env.local)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-publica

# 4. Inicie o servidor de desenvolvimento
npm run dev

# 5. Execute a suíte de testes automatizados
npm test

# 6. Gere o build de produção
npm run build
```

---

## 📄 Licença

Desenvolvido para gestão assistencial e governança clínica de Instituições de Longa Permanência para Idosos.
