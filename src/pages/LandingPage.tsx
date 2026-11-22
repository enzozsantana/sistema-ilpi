import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Pill,
  Stethoscope,
  Activity,
  CheckCircle2,
  Users,
  ChevronRight,
  ArrowRight,
  HelpCircle,
  FileText,
  Video,
  Lock,
  Sparkles,
  Clock,
  Award,
  AlertTriangle,
  Check,
  Star,
  Quote,
  HeartHandshake,
  HeartPulse,
  CheckCheck,
  FileCheck2,
  Zap,
  Scale,
  BadgeCheck,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react'
import { SenecurareLogo } from '../components/SenecurareLogo'
import { ThemeToggle } from '../components/ThemeToggle'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { PLANOS } from '../lib/plans'

export default function LandingPage() {
  const navigate = useNavigate()
  const [faturamentoAnual, setFaturamentoAnual] = useState(false)
  const [faqAberto, setFaqAberto] = useState<number | null>(null)
  const [mockupAbaAtiva, setMockupAbaAtiva] = useState<'ronda' | 'prontuario' | 'dossie'>('ronda')
  const [medicamento2Checado, setMedicamento2Checado] = useState(false)

  const toggleFaq = (idx: number) => {
    setFaqAberto(faqAberto === idx ? null : idx)
  }

  const planosLista = [
    PLANOS.compacto,
    PLANOS.clinico,
    PLANOS.avancado,
    PLANOS.enterprise,
  ]

  const orgaosReguladores = [
    { sigla: 'ANVISA', norma: 'RDC 502/2021', desc: 'Regulamento Técnico de ILPIs', icone: ShieldCheck },
    { sigla: 'ANVISA', norma: 'RDC 611/2022', desc: 'Boas Práticas de Saúde', icone: Award },
    { sigla: 'COREN', norma: 'Resoluções Cofen', desc: 'SAE & Auditoria de Enfermagem', icone: FileCheck2 },
    { sigla: 'CFM', norma: 'Prescrição Oficial', desc: 'Portal CFM & Memed Web', icone: Stethoscope },
    { sigla: 'LGPD', norma: 'Lei 13.709/18', desc: 'Prontuário com Criptografia', icone: Lock },
    { sigla: 'ICP-BRASIL', norma: 'Certificação Digital', desc: 'Assinaturas Válidas em Direito', icone: Scale },
  ]

  const depoimentos = [
    {
      nome: 'Helena Prado',
      cargo: 'Enfermeira RT (Responsável Técnica)',
      instituicao: 'Residencial Geriátrico Solar da Colina (42 residentes)',
      texto:
        'Nossa última inspeção da Vigilância Sanitária em 2026 levou menos de 20 minutos. Quando abrimos o painel de POPs e o prontuário no Senecurare, a fiscal elogiou a organização e fomos homologados sem nenhuma notificação.',
      estrelas: 5,
    },
    {
      nome: 'Dr. Roberto Faria',
      cargo: 'Médico Geriatra & Diretor Clínico',
      instituicao: 'Complexo de Cuidados Vida Plena (60 leitos)',
      texto:
        'A ronda de beira-leito com dupla checagem eliminou completamente as falhas de troca de medicação. Além disso, as teleconsultas com a prescrição digital oficial nos dão segurança jurídica total no atendimento dos idosos.',
      estrelas: 5,
    },
    {
      nome: 'Renata Silveira',
      cargo: 'Sócia e Gestora Administrativa',
      instituicao: 'Lar & Conforto Senior (28 residentes)',
      texto:
        'O fato de não cobrar por cuidador foi o divisor de águas. Conseguimos colocar tablets em cada ala e toda a equipe registra na hora do banho, alimentação e troca de curativos sem custos extras no orçamento.',
      estrelas: 5,
    },
  ]

  const faqs = [
    {
      pergunta: 'O sistema atende integralmente à RDC 502/2021 da ANVISA?',
      resposta:
        'Sim! O Senecurare foi construído especificamente para ILPIs com base nas exigências da ANVISA (RDC 502/2021 e RDC 611) e resoluções do COREN. O sistema gera automaticamente os POPs sanitários, fichas de acolhimento, prontuário individualizado e controle de estoque de medicamentos exigidos pela vigilância sanitária.',
    },
    {
      pergunta: 'Preciso pagar mais conforme cadastro novos cuidadores ou enfermeiros?',
      resposta:
        'Não! Em todos os planos Senecurare o número de usuários profissionais é 100% ILIMITADO. Você pode cadastrar todos os cuidadores de plantão, enfermeiros, médicos e profissionais multidisciplinares sem pagar nenhum centavo a mais por login.',
    },
    {
      pergunta: 'Como funciona a prescrição digital nas teleconsultas?',
      resposta:
        'O médico especialista atende o idoso por vídeo e conecta-se diretamente ao portal de prescrição oficial que já utiliza (Portal CFM com CRM, Memed Web, Receita Digital ou Nexodata) para assinar com certificado ICP-Brasil (A3, em nuvem ou Bird ID). A receita gerada é aceita em 100% das farmácias do Brasil e fica salva no prontuário do residente.',
    },
    {
      pergunta: 'Posso testar o sistema antes de contratar?',
      resposta:
        'Com certeza! Nossa plataforma disponibiliza um ambiente completo de demonstração imediata com dados geriátricos reais já pré-configurados. Você pode testar agora mesmo sem precisar cadastrar cartão de crédito.',
    },
    {
      pergunta: 'Como é feita a implantação e treinamento da equipe?',
      resposta:
        'A plataforma é intuitiva e projetada para ser simples até para cuidadores que não têm facilidade com tecnologia. Oferecemos um módulo completo de Treinamentos e Educação Permanente no sistema, além de suporte dedicado para migração das fichas dos idosos.',
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500/20 antialiased overflow-x-hidden">
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="relative bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 text-white text-xs py-2.5 px-4 text-center font-medium border-b border-emerald-500/20 shadow-xs z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider border border-emerald-400/30">
            <Sparkles className="size-3 text-amber-300 animate-pulse" />
            Conformidade RDC 502/611 ANVISA
          </span>
          <span className="text-slate-200">
            Proteja sua ILPI contra autuações e glosas sanitárias com prontuário 100% auditável.
          </span>
          <a
            href="#planos"
            className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-white underline underline-offset-2 transition-colors ml-1"
          >
            <span>Ver Planos & Preços</span>
            <ArrowRight className="size-3" />
          </a>
        </div>
      </div>

      {/* 2. STICKY NAVBAR */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/85 border-b border-border/50 transition-all duration-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center hover:opacity-95 transition-opacity">
              <SenecurareLogo variant="horizontal" size="sm" showTagline />
            </Link>

            <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-muted-foreground">
              <a href="#recursos" className="hover:text-foreground transition-colors">
                Recursos
              </a>
              <a href="#conformidade" className="hover:text-foreground transition-colors">
                Conformidade Sanitária
              </a>
              <a href="#depoimentos" className="hover:text-foreground transition-colors">
                Depoimentos
              </a>
              <a href="#planos" className="hover:text-foreground transition-colors">
                Planos & Preços
              </a>
              <a href="#faq" className="hover:text-foreground transition-colors">
                Dúvidas
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-xl font-semibold text-xs h-9 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            >
              <Link to="/login">Entrar</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="relative overflow-hidden rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 shadow-sm shadow-emerald-600/20 gap-1.5 transition-all hover:shadow-md hover:shadow-emerald-600/30 active:scale-95"
            >
              <a href="#planos">
                <span>Começar Agora</span>
                <ArrowRight className="size-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION COM DASHBOARD MOCKUP REALISTA */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-emerald-500/[0.04] via-background to-background">
        {/* Ambient Glows */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 size-[650px] rounded-full bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 -right-40 size-[450px] rounded-full bg-teal-500/10 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          {/* Badge de Autoridade com Pulsar Suave */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 shadow-2xs backdrop-blur-sm animate-pulse-subtle">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Software Especialista para ILPIs & Residências Geriátricas</span>
          </div>

          {/* Headline Principal de Alta Conversão */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-extrabold tracking-tight text-foreground leading-[1.12]">
              Elimine erros de medicação e blinde sua ILPI contra{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent italic">
                fiscalizações sanitárias.
              </span>
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Prontuário multidisciplinar unificado, ronda de enfermagem à beira-leito com dupla checagem,
              POPs automatizados da RDC 502 da ANVISA e telemedicina de retaguarda.
            </p>
          </div>

          {/* CTAs de Destaque com Efeito Shimmer */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Button
              size="lg"
              asChild
              className="relative overflow-hidden w-full sm:w-auto h-12 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 text-sm gap-2 transition-all hover:-translate-y-0.5 hover:shadow-emerald-600/35"
            >
              <a href="#planos">
                <span>Ver Planos & Preços</span>
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold border-border/80 hover:bg-muted text-sm gap-2 shadow-2xs transition-all hover:-translate-y-0.5"
            >
              <Link to="/login">
                <Sparkles className="size-4 text-amber-500" />
                <span>Acessar Demonstração Pronta</span>
              </Link>
            </Button>
          </div>

          {/* Micro-prova social */}
          <div className="pt-2 flex items-center justify-center gap-6 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Sem cartão de crédito para testar
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Usuários profissionais ilimitados
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Implantação em até 48 horas
            </span>
          </div>

          {/* 4. DASHBOARD INTERATIVO / VITRINE DO PRODUTO (MOCKUP REALISTA) */}
          <div className="pt-8 max-w-5xl mx-auto relative">
            {/* Chips Flutuantes Animados */}
            <div className="hidden sm:flex absolute -top-5 -left-6 z-30 p-2.5 px-3.5 rounded-2xl bg-card/95 border border-emerald-500/35 backdrop-blur-md shadow-lg shadow-emerald-500/10 items-center gap-2.5 animate-float-gentle ring-1 ring-emerald-500/20">
              <div className="size-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-4.5" />
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold text-foreground block">RDC 502 ANVISA</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCheck className="size-3" />
                  100% Homologado
                </span>
              </div>
            </div>

            <div className="hidden sm:flex absolute -bottom-5 -right-6 z-30 p-2.5 px-3.5 rounded-2xl bg-card/95 border border-teal-500/35 backdrop-blur-md shadow-lg shadow-teal-500/10 items-center gap-2.5 animate-float-delayed ring-1 ring-teal-500/20">
              <div className="size-8 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Pill className="size-4.5" />
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold text-foreground block">Dupla Checagem</span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
                  <Zap className="size-3 text-amber-500" />
                  0 Erros de Dosagem
                </span>
              </div>
            </div>

            <div className="hidden lg:flex absolute top-10 -right-8 z-30 p-2.5 px-3.5 rounded-2xl bg-card/95 border border-purple-500/35 backdrop-blur-md shadow-lg shadow-purple-500/10 items-center gap-2.5 animate-float-gentle ring-1 ring-purple-500/20">
              <div className="size-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Users className="size-4.5" />
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold text-foreground block">Equipe & Cuidadores</span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">100% Ilimitados</span>
              </div>
            </div>

            {/* Janela de Aplicação Estilo macOS */}
            <div className="rounded-3xl border border-border/80 bg-card/90 shadow-2xl backdrop-blur-md overflow-hidden text-left ring-1 ring-border/50">
              {/* Barra de Título da Janela */}
              <div className="px-5 py-3.5 bg-muted/40 border-b border-border/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-rose-500/80" />
                  <div className="size-3 rounded-full bg-amber-500/80" />
                  <div className="size-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-semibold text-muted-foreground ml-3 hidden sm:inline">
                    Senecurare · Painel de Plantão & Governança ILPI
                  </span>
                </div>

                {/* Abas Interativas de Demonstração */}
                <div className="flex items-center gap-1.5 p-1 bg-muted/70 rounded-xl border border-border/50 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setMockupAbaAtiva('ronda')}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      mockupAbaAtiva === 'ronda'
                        ? 'bg-card text-foreground shadow-2xs font-bold ring-1 ring-emerald-500/30'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Pill className="size-3 text-emerald-600" />
                    <span>Ronda (Beira-Leito)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockupAbaAtiva('prontuario')}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      mockupAbaAtiva === 'prontuario'
                        ? 'bg-card text-foreground shadow-2xs font-bold ring-1 ring-emerald-500/30'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <HeartPulse className="size-3 text-rose-500" />
                    <span>Prontuário & Sinais</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockupAbaAtiva('dossie')}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      mockupAbaAtiva === 'dossie'
                        ? 'bg-card text-foreground shadow-2xs font-bold ring-1 ring-emerald-500/30'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileCheck2 className="size-3 text-teal-600" />
                    <span>Auditoria RDC 502</span>
                  </button>
                </div>
              </div>

              {/* Conteúdo da Janela Simulada */}
              <div className="p-5 sm:p-7 space-y-4 bg-gradient-to-b from-card to-muted/20 min-h-[300px]">
                {mockupAbaAtiva === 'ronda' && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="font-bold text-foreground">Ronda de Medicação Ativa · Turno Matutino (08:00)</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 font-bold">
                        <CheckCheck className="size-3 text-emerald-600" />
                        100% à Beira-Leito
                      </Badge>
                    </div>

                    {/* Residente 1 */}
                    <div className="p-3.5 rounded-2xl bg-background border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-emerald-500/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                          IG
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground">Dona Irene Guimarães</span>
                            <span className="text-[10px] text-muted-foreground">82 anos · Leito 102</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground block">
                            💊 Losartana Potássica 50mg + Metformina 850mg (Oral)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-bold shadow-2xs gap-1">
                          <Check className="size-3" />
                          Administrado (08:02)
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">Dupla checagem: Enf. RT Helena</span>
                      </div>
                    </div>

                    {/* Residente 2 (Simulação Interativa) */}
                    <div className="p-3.5 rounded-2xl bg-background border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-teal-500/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-700 dark:text-teal-400 font-bold flex items-center justify-center shrink-0 text-xs">
                          AP
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground">Sr. Antônio Prado</span>
                            <span className="text-[10px] text-muted-foreground">78 anos · Leito 104</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground block">
                            💉 Insulina NPH 14 UI (Subcutânea) · Glicemia Pré: 142 mg/dL
                          </span>
                        </div>
                      </div>

                      {/* Botão de Checagem Interativo */}
                      <div>
                        {medicamento2Checado ? (
                          <div className="flex items-center gap-2 animate-fadeIn">
                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold shadow-xs gap-1">
                              <CheckCheck className="size-3 text-emerald-200" />
                              ✓ Aplicado no Leito
                            </Badge>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <Sparkles className="size-3" />
                              Estoque baixado aut.
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMedicamento2Checado(true)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                          >
                            <Check className="size-3.5" />
                            <span>Simular Checagem no Leito</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {mockupAbaAtiva === 'prontuario' && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40 text-xs">
                      <div className="flex items-center gap-2">
                        <HeartPulse className="size-4 text-rose-500" />
                        <span className="font-bold text-foreground">Curva de Sinais Vitais & Escalas Geriátricas</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">Última aferição há 12 min</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-background border border-border/60 space-y-1 hover:border-emerald-500/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground block">Pressão Arterial</span>
                          <Activity className="size-3 text-emerald-600" />
                        </div>
                        <span className="text-base font-extrabold text-foreground font-mono">120/80</span>
                        <span className="text-[9px] text-emerald-600 font-semibold block">Normotenso</span>
                      </div>
                      <div className="p-3 rounded-xl bg-background border border-border/60 space-y-1 hover:border-emerald-500/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground block">Glicemia Capilar</span>
                          <Zap className="size-3 text-amber-500" />
                        </div>
                        <span className="text-base font-extrabold text-foreground font-mono">118 mg/dL</span>
                        <span className="text-[9px] text-emerald-600 font-semibold block">Pós-prandial ok</span>
                      </div>
                      <div className="p-3 rounded-xl bg-background border border-border/60 space-y-1 hover:border-emerald-500/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground block">Escala Braden (LPP)</span>
                          <ShieldCheck className="size-3 text-emerald-600" />
                        </div>
                        <span className="text-base font-extrabold text-emerald-600 font-mono">19 pts</span>
                        <span className="text-[9px] text-emerald-600 font-semibold block">Sem risco de lesão</span>
                      </div>
                      <div className="p-3 rounded-xl bg-background border border-border/60 space-y-1 hover:border-amber-500/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground block">Escala Morse (Queda)</span>
                          <AlertTriangle className="size-3 text-amber-600" />
                        </div>
                        <span className="text-base font-extrabold text-amber-600 font-mono">25 pts</span>
                        <span className="text-[9px] text-amber-600 font-semibold block">Risco baixo (monitorar)</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>Evoluções da Enfermagem, Fisioterapia e Nutrição consolidadas em linha do tempo cronológica.</span>
                    </div>
                  </div>
                )}

                {mockupAbaAtiva === 'dossie' && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40 text-xs">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="size-4 text-teal-600" />
                        <span className="font-bold text-foreground">Dossiê Sanitário da ILPI para Fiscalização</span>
                      </div>
                      <Badge className="bg-teal-600 hover:bg-teal-600 text-white text-[10px] font-bold gap-1">
                        <CheckCheck className="size-3" />
                        Pronto para Download
                      </Badge>
                    </div>

                    <div className="p-4 rounded-xl bg-background border border-border/70 space-y-2 text-xs hover:border-emerald-500/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <FileText className="size-3.5 text-emerald-600" />
                          Caderno de POPs RDC 502 Art. 38 (12 procedimentos)
                        </span>
                        <Badge variant="outline" className="text-emerald-600 font-bold text-[10px] bg-emerald-500/10 border-emerald-500/20">
                          Vigente
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Controle de infecção, banho no leito, dispensação de medicamentos, contenção protetora e parada cardiorrespiratória.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-background border border-border/70 space-y-2 text-xs hover:border-emerald-500/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <ShieldCheck className="size-3.5 text-teal-600" />
                          Livro de Ocorrências & Passagem de Plantão Auditada
                        </span>
                        <Badge variant="outline" className="text-emerald-600 font-bold text-[10px] bg-emerald-500/10 border-emerald-500/20">
                          100% Assinado
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Histórico imutável de intercorrências com assinatura eletrônica e carimbo de tempo da equipe técnica.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRUST BAR / BARRA DE CONFORMIDADE REGULATÓRIA COM ÍCONES ESPECÍFICOS */}
      <section className="py-10 bg-muted/40 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center justify-center gap-2">
            <Sparkles className="size-3.5 text-emerald-600" />
            <span>Projetado de acordo com as exigências dos órgãos de saúde e fiscalização</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center">
            {orgaosReguladores.map((org, idx) => {
              const Icon = org.icone
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-card border border-border/60 text-center space-y-1.5 shadow-2xs hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block">
                      {org.sigla}
                    </span>
                    <span className="text-xs font-bold text-foreground block">{org.norma}</span>
                    <span className="text-[10px] text-muted-foreground block truncate">{org.desc}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 6. BENTO GRID DE RECURSOS DA PLATAFORMA */}
      <section id="recursos" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <Zap className="size-3.5 text-amber-500" />
              <span>Funcionalidades Desenhadas para a Rotina Geriátrica</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
              Tudo o que sua ILPI precisa em uma única plataforma
            </h2>
            <p className="text-base text-muted-foreground">
              Abandone pranchetas de papel, planilhas desorganizadas e o medo de fiscalizações da vigilância sanitária.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 (Destaque Principal - Span 2) */}
            <Card className="md:col-span-2 border border-border/70 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden bg-gradient-to-br from-card via-card to-emerald-500/[0.04] group hover:-translate-y-1">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 ring-4 ring-emerald-500/10 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300">
                    <Pill className="size-7" />
                  </div>
                  <Badge variant="outline" className="text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1">
                    <CheckCheck className="size-3 text-emerald-600" />
                    Segurança Máxima
                  </Badge>
                </div>
                <div className="space-y-2 max-w-xl">
                  <h3 className="text-2xl font-bold font-heading text-foreground">
                    Ronda de Medicação Inteligente com Beira-Leito
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Dupla checagem eletrônica, alertas sonoros e visuais de atraso, baixa imediata no estoque da farmácia e controle de justificativa clínica em caso de recusa.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 group-hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-1.5 font-bold text-foreground mb-0.5">
                      <Zap className="size-3.5 text-amber-500" />
                      0 Trocas
                    </div>
                    <span className="text-muted-foreground text-[11px]">Identificação individual no leito</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 group-hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-1.5 font-bold text-foreground mb-0.5">
                      <Clock className="size-3.5 text-emerald-600" />
                      Baixa em Tempo Real
                    </div>
                    <span className="text-muted-foreground text-[11px]">Almoxarifado e farmácia</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 group-hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-1.5 font-bold text-foreground mb-0.5">
                      <ShieldCheck className="size-3.5 text-teal-600" />
                      Alertas de Interação
                    </div>
                    <span className="text-muted-foreground text-[11px]">Avisos de risco polifarmácia</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Blindagem Sanitária */}
            <Card className="border border-border/70 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden bg-card group hover:-translate-y-1">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 ring-4 ring-teal-500/10 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300">
                    <ShieldCheck className="size-7" />
                  </div>
                  <Badge variant="outline" className="text-xs font-bold gap-1">
                    <Award className="size-3 text-teal-600" />
                    Conformidade Legal
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-heading text-foreground">
                    Blindagem Sanitária RDC 502 & COREN
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Procedimentos Operacionais Padrão (POPs) nativos, dossiê fiscalizatório em 1 clique e histórico auditável com assinatura eletrônica.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-950 dark:text-teal-200 flex items-center gap-2">
                  <FileCheck2 className="size-4 text-teal-600 shrink-0" />
                  <span>Caderno de POPs pronto para inspeção do COREN e Vigilância Sanitária Municipal.</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Telemedicina & Especialistas */}
            <Card className="border border-border/70 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden bg-card group hover:-translate-y-1">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-teal-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 ring-4 ring-blue-500/10 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300">
                    <Stethoscope className="size-7" />
                  </div>
                  <Badge variant="outline" className="text-xs font-bold gap-1">
                    <Video className="size-3 text-blue-600" />
                    Retaguarda Médica
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-heading text-foreground">
                    Telemedicina & Prescrição ICP-Brasil
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Consultas virtuais com especialistas e emissão de receitas aceitas em 100% das farmácias pelo CFM, Memed, Receita Digital e Nexodata.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-950 dark:text-blue-200 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-blue-600 shrink-0" />
                  <span>Geriatras, estomaterapeutas e nutricionistas conectados na rotina do residente.</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Escalas Geriátricas Automáticas */}
            <Card className="border border-border/70 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden bg-card group hover:-translate-y-1">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 ring-4 ring-amber-500/10 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300">
                    <HeartPulse className="size-7" />
                  </div>
                  <Badge variant="outline" className="text-xs font-bold gap-1">
                    <Activity className="size-3 text-amber-600" />
                    Geriatria Avançada
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-heading text-foreground">
                    Escalas Geriátricas Automáticas
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Cálculo e pontuação imediata de Katz (AVDs), Lawton, Braden (risco de LPP), Morse (risco de quedas) e MEEM integrados ao plano de cuidado.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-950 dark:text-amber-200 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-amber-600 shrink-0" />
                  <span>Sem necessidade de cálculos manuais ou perda de tempo com planilhas.</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Usuários Ilimitados */}
            <Card className="border border-border/70 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden bg-card group hover:-translate-y-1">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 ring-4 ring-purple-500/10 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300">
                    <HeartHandshake className="size-7" />
                  </div>
                  <Badge variant="outline" className="text-xs font-bold gap-1">
                    <Users className="size-3 text-purple-600" />
                    Sem Custo Oculto
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-heading text-foreground">
                    Usuários e Cuidadores Ilimitados
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sem taxas escondidas por login de cuidador, enfermeiro ou médico. Toda a sua equipe conectada sem estourar o orçamento.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-950 dark:text-purple-200 flex items-center gap-2">
                  <UserCheck className="size-4 text-purple-600 shrink-0" />
                  <span>Cadastre todos os plantonistas sem cobranças extras por usuário.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 7. SEÇÃO DE CONFORMIDADE E COMPARATIVO ANVISA / COREN */}
      <section id="conformidade" className="py-24 bg-muted/30 border-y border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                <span>Auditoria Sanitária Sem Estresse</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight">
                Receba os fiscais do COREN e da Vigilância Sanitária com total tranquilidade.
              </h2>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                As ILPIs sofrem com exigências sanitárias rigorosas e multas pesadas. O Senecurare foi construído de acordo com os termos exatos dos manuais de fiscalização:
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-foreground block text-sm">POPs e Protocolos Art. 38 RDC 502:</strong>
                    <span className="text-muted-foreground leading-relaxed">
                      Procedimentos Operacionais Padrão estruturados e atualizados para banho, curativos, contenção mecânica e higienização.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-foreground block text-sm">Rastreabilidade Total de Medicamentos:</strong>
                    <span className="text-muted-foreground leading-relaxed">
                      Controle de lote, validade, horários de administração e justificativa imediata em caso de recusa pelo residente.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-foreground block text-sm">Dossiê Fiscalizatório em PDF com 1 Clique:</strong>
                    <span className="text-muted-foreground leading-relaxed">
                      Gere a pasta sanitária completa solicitada pelo fiscal com histórico dos residentes e escala técnica do responsável.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button asChild className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-11 px-6 gap-2 shadow-md hover:shadow-emerald-600/30 transition-all hover:-translate-y-0.5">
                  <a href="#planos">
                    <span>Proteger Minha ILPI Agora</span>
                    <ArrowRight className="size-3.5" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Comparativo Papel vs Senecurare com Ícones Estilizados */}
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-rose-500/[0.06] border border-rose-500/20 space-y-3.5 shadow-2xs">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
                  <div className="p-1.5 rounded-lg bg-rose-500/10">
                    <AlertTriangle className="size-4 shrink-0 text-rose-600" />
                  </div>
                  <span>Sem o Senecurare (Papel e Planilhas)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2.5">
                    <span className="size-4 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center text-[10px] font-black shrink-0">✕</span>
                    Letras ilegíveis em prontuários de papel
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="size-4 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center text-[10px] font-black shrink-0">✕</span>
                    Risco de multas de até R$ 50.000,00 da Vigilância
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="size-4 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center text-[10px] font-black shrink-0">✕</span>
                    Falta de controle de validade e descarte de fármacos
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="size-4 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center text-[10px] font-black shrink-0">✕</span>
                    Horas perdidas na passagem de plantão
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-3xl bg-emerald-500/[0.08] border border-emerald-500/30 space-y-3.5 shadow-lg shadow-emerald-500/5">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600">
                    <ShieldCheck className="size-4 shrink-0" />
                  </div>
                  <span>Com o Senecurare (100% Digital & Auditado)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-foreground font-medium">
                  <li className="flex items-center gap-2.5">
                    <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                    <span>Prontuário eletrônico unificado e legível</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                    <span>POPs Art. 38 homologados e atualizados</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                    <span>Checagem à beira-leito com rastreabilidade total</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                    <span>Passagem de plantão digital com 1 clique</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. DEPOIMENTOS E PROVA SOCIAL */}
      <section id="depoimentos" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span>Aprovado por Quem Cuida na Prática</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
              O que dizem os Responsáveis Técnicos e Gestores
            </h2>
            <p className="text-base text-muted-foreground">
              Instituições que transformaram sua rotina e conquistaram tranquilidade na fiscalização.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {depoimentos.map((dep, idx) => (
              <Card
                key={idx}
                className="border border-border/70 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl bg-card p-7 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(dep.estrelas)].map((_, i) => (
                        <Star key={i} className="size-4 fill-amber-400" />
                      ))}
                    </div>
                    <Quote className="size-6 text-muted-foreground/30 group-hover:text-emerald-600/40 transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    "{dep.texto}"
                  </p>
                </div>
                <div className="pt-6 border-t border-border/40 mt-6 space-y-1">
                  <strong className="text-sm font-bold text-foreground block">{dep.nome}</strong>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block flex items-center gap-1">
                    <BadgeCheck className="size-3.5" />
                    {dep.cargo}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">{dep.instituicao}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 9. SEÇÃO DE PLANOS E PREÇOS */}
      <section id="planos" className="py-24 bg-muted/20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <Sparkles className="size-3.5" />
              <span>Transparência Total</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              Planos Transparentes para Cada Fase da sua ILPI
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground">
              Sem cobrança por usuário ou cuidador. Você só investe com base na capacidade de residentes acolhidos.
            </p>

            {/* Alternador Mensal / Anual */}
            <div className="pt-3 flex items-center justify-center gap-3 text-xs font-semibold">
              <span className={!faturamentoAnual ? 'text-foreground font-bold' : 'text-muted-foreground'}>
                Faturamento Mensal
              </span>
              <button
                type="button"
                onClick={() => setFaturamentoAnual(!faturamentoAnual)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  faturamentoAnual ? 'bg-emerald-600' : 'bg-muted-foreground/30'
                }`}
                role="switch"
                aria-checked={faturamentoAnual}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    faturamentoAnual ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={faturamentoAnual ? 'text-foreground font-bold' : 'text-muted-foreground'}>
                  Faturamento Anual
                </span>
                <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
                  15% OFF
                </Badge>
              </div>
            </div>
          </div>

          {/* Grid dos 4 Planos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch pt-4">
            {planosLista.map((plano) => {
              const preco = faturamentoAnual ? plano.precoAnualMensal : plano.precoMensal
              const isDestaque = plano.id === 'clinico'

              return (
                <div
                  key={plano.id}
                  className={`relative rounded-3xl flex flex-col justify-between border pt-8 pb-6 px-6 transition-all duration-300 ${
                    isDestaque
                      ? 'border-emerald-600 bg-card shadow-xl shadow-emerald-600/10 ring-2 ring-emerald-600 hover:-translate-y-1.5'
                      : 'border-border/70 bg-card/70 hover:bg-card shadow-xs hover:shadow-lg hover:-translate-y-1'
                  }`}
                >
                  {isDestaque && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                      <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-md border border-emerald-400/40 inline-flex items-center gap-1">
                        <Sparkles className="size-3" />
                        Mais Escolhido pelas ILPIs
                      </span>
                    </div>
                  )}

                  <div className="space-y-4 flex-1 flex flex-col">
                    <div>
                      <h3 className="text-base font-bold text-foreground font-heading">{plano.nome}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 min-h-[34px] leading-snug">{plano.subtitulo}</p>
                    </div>

                    <div className="pt-2 pb-1 border-b border-border/50">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-muted-foreground font-medium">R$</span>
                        <span className="text-3xl sm:text-4xl font-extrabold text-foreground font-heading">
                          {preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-muted-foreground">/mês</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block mt-1">
                        {faturamentoAnual
                          ? `Faturado anualmente (R$ ${(preco * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ano)`
                          : 'Cobrança mensal sem carência'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 py-1">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <Users className="size-3.5 text-emerald-600" />
                        <span>
                          {plano.limiteResidentes >= 999
                            ? 'Residentes Ilimitados'
                            : `Até ${plano.limiteResidentes} residentes`}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="size-3" />
                        <span>Usuários e cuidadores ilimitados</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/40 text-xs flex-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Recursos inclusos:
                      </span>
                      <ul className="space-y-1.5">
                        {plano.recursos.slice(0, 5).map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-muted-foreground text-[11px]">
                            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6 mt-auto">
                    <Button
                      onClick={() => navigate(`/planos?highlight=${plano.id}`)}
                      className={`w-full h-11 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                        isDestaque
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-600/30'
                          : 'bg-muted hover:bg-muted/80 text-foreground border border-border/70'
                      }`}
                    >
                      {isDestaque ? 'Assinar Plano Clínico' : `Escolher ${plano.nome}`}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center text-xs text-muted-foreground pt-4">
            Dúvidas sobre qual plano escolher ou precisa de suporte para migração de dados?{' '}
            <Link to="/planos" className="font-semibold text-emerald-600 hover:underline inline-flex items-center gap-1">
              <span>Consulte nossa tabela comparativa detalhada</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FAQ ACCORDION */}
      <section id="faq" className="py-24 bg-background border-t border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <HelpCircle className="size-3.5" />
              <span>Tire Suas Dúvidas</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight font-heading">
              Perguntas Frequentes de Gestores de ILPI
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/70 bg-card overflow-hidden transition-colors shadow-2xs hover:border-emerald-500/30"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <span>{faq.pergunta}</span>
                  <ChevronRight
                    className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      faqAberto === idx ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {faqAberto === idx && (
                  <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3 bg-muted/10 animate-fadeIn">
                    {faq.resposta}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. BOTTOM CTA HERO */}
      <section className="py-20 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-xs px-3.5 py-1 gap-1.5 font-bold">
            <Zap className="size-3.5 text-amber-300" />
            Comece em Menos de 5 Minutos
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight">
            Pronto para profissionalizar sua ILPI e eliminar riscos sanitários?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Junte-se às instituições que operam com segurança jurídica, prontuário multidisciplinar unificado e zero glosas na vigilância.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold bg-white text-emerald-950 hover:bg-slate-100 shadow-xl text-sm transition-all hover:scale-105 active:scale-95"
            >
              <a href="#planos">Escolher um Plano</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold border-white/30 text-white hover:bg-white/10 text-sm transition-all hover:scale-105 active:scale-95"
            >
              <Link to="/login">Testar com Dados de Demonstração</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="border-t border-border/60 bg-card text-xs text-muted-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <SenecurareLogo variant="horizontal" size="sm" showTagline />
            <div className="flex flex-wrap items-center justify-center gap-6">
              <a href="#recursos" className="hover:text-foreground transition-colors">
                Recursos
              </a>
              <a href="#conformidade" className="hover:text-foreground transition-colors">
                Conformidade RDC 502
              </a>
              <a href="#depoimentos" className="hover:text-foreground transition-colors">
                Depoimentos
              </a>
              <a href="#planos" className="hover:text-foreground transition-colors">
                Planos & Preços
              </a>
              <Link to="/login" className="font-semibold text-emerald-600 hover:underline">
                Acessar Sistema
              </Link>
            </div>
          </div>

          <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <span>© 2026 Senecurare Healthcare. Todos os direitos reservados.</span>
            <span>Prontuário Multidisciplinar · Conformidade ANVISA RDC 502/2021 & COREN</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
