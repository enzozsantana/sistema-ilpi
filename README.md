# Senecurare — Sistema de Gestão para ILPI

> **"Raízes de cuidado, laços de vida."**  
> Plataforma completa de gestão clínica, operacional e regulatória para Instituições de Longa Permanência para Idosos (ILPI), em total conformidade com a **RDC 502/2021 da ANVISA**.

---

## 🚀 Acesso em Produção (Live App)

O sistema está publicado e operando online gratuitamente:

- **Link de Acesso:** [https://sistema-ilpi.vercel.app](https://sistema-ilpi.vercel.app)
- **Repositório GitHub:** [https://github.com/enzozsantana/sistema-ilpi](https://github.com/enzozsantana/sistema-ilpi)
- **Banco de Dados & Autenticação:** Supabase Cloud (PostgreSQL 15 + RLS)

### 🔑 Contas de Demonstração Rápidas (1-Clique na tela de Login):
- **Administrador:** `admin@senecurare.com` | `admin123`
- **Enfermeira RT:** `clarice@senecurare.com` | `rt123456`
- **Médico:** `marcos@senecurare.com` | `med123456`
- **Cuidadora:** `maria@senecurare.com` | `cuid123456`

---

## 🌟 Principais Recursos

- **Prontuário Multidisciplinar Digital:**
  - Identificação completa, checklist de documentos e plano de cuidados diários.
  - Escalas clínicas com pontuação em tempo real: **Fugulin** (grau de dependência), **Morse** (risco de queda), **Braden** (risco de LPP), **Glasgow** e **MNA** (triagem nutricional).
  - Elaboração e vigência do **PIA** (Plano Individual de Atendimento).
  - Anotações circunstanciadas de enfermagem com monitoramento de SSVV (PA, FC, FR, Temp, SatO2, dextro).
  - Evoluções técnicas por especialidade (Medicina, Fisioterapia, Nutrição, Psicologia, etc.).
  - Gestão de prescrições médicas ativas, intervalos e suspensões.
  - Anexos digitais de exames laboratoriais, laudos e termos.

- **Painel de Plantão & Checagem:**
  - Checagem horária de medicamentos com dupla validação e justificativa obrigatória de recusa/omissão.
  - Baixa e estorno atômico em estoque vinculado à prescrição.
  - Administração de medicamentos Se Necessário (+ Medicação SN).
  - Checklist operacional de cuidados à beira do leito.
  - Registro de intercorrências e eventos sentinela da ANVISA (quedas, LPP, DDA, desidratação, óbito).

- **Controle de Farmácia & Estoque:**
  - Gestão individual por residente e coletiva da casa.
  - Entradas de lotes com histórico e ajuste direto de inventário.
  - Cálculo de autonomia (dias restantes) e alertas de estoque mínimo.
  - Gerador de mensagem WhatsApp para reposição familiar e lista mensal de compras.

- **Cadeia de Frio & Rotinas:**
  - Registro de temperatura da geladeira de medicamentos (manhã e noite) com validação estrita da faixa ANVISA (2 °C a 8 °C) e assinatura digital.
  - Checklist diário de tarefas operacionais com distribuição por dias da semana e responsável.

- **Quadro de Equipe & Escalas:**
  - Diretório completo de profissionais e colaboradores ativos/inativos.
  - Grade mensal interativa de plantões com códigos RDC (D, N, M, T, F, FE, EX).
  - Preenchimento rápido padrão 12x36 (Diurno e Noturno).
  - Registro de treinamentos e educação continuada obrigatória.

- **Supervisão Regulatória & Gestão:**
  - Dimensionamento automático de cuidadores por grau Fugulin (RDC 502).
  - Monitoramento de alvarás, vistorias do Corpo de Bombeiros (AVCB) e licenças sanitárias.
  - Procedimentos Operacionais Padrão (POPs) com controle de vigência anual.
  - Painel de indicadores de qualidade da Vigilância Sanitária com histórico mensal e exportação.

---

## 🚀 Tecnologias

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Radix UI / Shadcn UI, Sonner.
- **Backend / BaaS:** Supabase (PostgreSQL, Row Level Security, Storage, Auth).
- **Testes Automatizados:** Vitest, Testing Library (React & Jest-DOM), jsdom (119+ testes).

---

## 🛠️ Instalação e Desenvolvimento Local

1. Clone o repositório:
```bash
git clone https://github.com/enzozsantana/sistema-ilpi.git
cd sistema-ilpi
```

2. Instale as dependências:
```bash
npm install
```

3. Crie o arquivo `.env.local` a partir do exemplo:
```bash
cp .env.example .env.local
```
Preencha com as credenciais do seu projeto Supabase:
```env
VITE_SUPABASE_URL=https://sua-url.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Execute a suíte de testes:
```bash
npm test
```

6. Gere o build de produção:
```bash
npm run build
```

---

## 🔐 Contas de Demonstração (Seed)

| Profissional | Cargo | E-mail | Senha |
|---|---|---|---|
| Helena Prado | Enfermeira RT | `s1@ilpi.demo` | `ILPI-Demo-2026!` |
| Rafael Duarte | Enfermeiro | `s2@ilpi.demo` | `ILPI-Demo-2026!` |
| Juliana Mendes | Técnica de Enfermagem | `s4@ilpi.demo` | `ILPI-Demo-2026!` |
| Carlos Alberto | Cuidador | `s5@ilpi.demo` | `ILPI-Demo-2026!` |

---

## 📄 Licença

Este projeto é desenvolvido para gestão assistencial e administrativa de ILPIs.
