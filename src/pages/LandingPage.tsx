import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  ArrowRight,
  Video,
  Lock,
  Clock,
  Award,
  AlertTriangle,
  Star,
  FileCheck2,
  Scale,
  QrCode,
  ScanLine,
  Gavel,
  X,
  ChevronDown,
  TrendingDown,
} from 'lucide-react'
import { SenecurareLogo } from '../components/SenecurareLogo'
import { ThemeToggle } from '../components/ThemeToggle'
import { toast } from 'sonner'

export default function LandingPage() {
  const [faturamentoAnual, setFaturamentoAnual] = useState(false)
  const [faqAberto, setFaqAberto] = useState<number | null>(null)
  const [isSimulated, setIsSimulated] = useState(false)
  const [mockupHover, setMockupHover] = useState(false)

  const toggleFaq = (idx: number) => {
    setFaqAberto(faqAberto === idx ? null : idx)
  }

  const handleSimularRonda = () => {
    setIsSimulated((prev) => {
      const next = !prev
      if (next) {
        toast.success('Ronda beira-leito checada via QR Code! Taxa de adesão elevada para 100%.')
      } else {
        toast.info('Simulação reiniciada para estado inicial da ronda.')
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-[#091519] text-[#d8e5ea] font-sans antialiased overflow-x-hidden selection:bg-[#75daa8]/20 selection:text-[#75daa8]">
      {/* 1. STICKY HEADER */}
      <header className="fixed top-0 w-full z-50 bg-[#091519]/80 backdrop-blur-xl border-b border-[#2b373b]/40 shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
        <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-95 transition-opacity">
            <SenecurareLogo variant="horizontal" size="sm" showTagline />
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            <a href="#recursos" className="text-sm font-medium text-[#c0c8cb] hover:text-[#d8e5ea] transition-colors px-2 py-1">
              Recursos
            </a>
            <a href="#conformidade" className="text-sm font-medium text-[#c0c8cb] hover:text-[#d8e5ea] transition-colors px-2 py-1">
              Conformidade
            </a>
            <a href="#depoimentos" className="text-sm font-medium text-[#c0c8cb] hover:text-[#d8e5ea] transition-colors px-2 py-1">
              Depoimentos
            </a>
            <a href="#planos" className="text-sm font-medium text-[#c0c8cb] hover:text-[#d8e5ea] transition-colors px-2 py-1">
              Planos
            </a>
            <a href="#faq" className="text-sm font-medium text-[#c0c8cb] hover:text-[#d8e5ea] transition-colors px-2 py-1">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-[#c0c8cb] hover:bg-[#202c30] hover:text-[#d8e5ea] transition-all"
            >
              Acessar Sistema
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#75daa8] text-[#003823] font-semibold text-sm shadow-[0_0_20px_rgba(117,218,168,0.25)] hover:bg-[#92f7c3] transition-all active:scale-95"
            >
              Acessar Demonstração Pronta
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full pt-16 bg-[#091519]">
        {/* 2. HERO SECTION COM MOCKUP 3D INTERATIVO */}
        <section className="relative w-full py-16 lg:py-24 px-6 lg:px-12 overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute -top-24 left-1/4 w-[520px] h-[520px] rounded-full bg-[#0f4c5c]/30 blur-3xl pointer-events-none" />
          <div className="absolute top-32 right-1/4 w-[420px] h-[420px] rounded-full bg-[#75daa8]/10 blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
            {/* Pill de Autoridade Sanitária */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#202c30]/90 backdrop-blur-xl border border-[#40484b]/60 shadow-md mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#75daa8] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#75daa8]" />
              </span>
              <span className="text-xs font-semibold text-[#75daa8]">
                Versão 4.0 • Software Especialista para ILPIs & Residências Geriátricas • Conformidade RDC 502/611 ANVISA
              </span>
            </div>

            {/* H1 Principal */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#d8e5ea] max-w-4xl tracking-tight mb-4 leading-[1.15]">
              Elimine erros de medicação e blinde sua ILPI contra{' '}
              <span className="bg-gradient-to-r from-[#9acee1] via-[#75daa8] to-[#b6ebfe] bg-clip-text text-transparent">
                fiscalizações sanitárias.
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-base sm:text-lg text-[#c0c8cb] max-w-2xl mb-8 leading-relaxed">
              Prontuário multidisciplinar unificado, rondas de enfermagem beira-leito com dupla checagem e POPs automatizados da ANVISA em uma plataforma de governança clínica de alta precisão.
            </p>

            {/* Ações Hero */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
              <a
                href="#planos"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-gradient-to-r from-[#75daa8] to-[#9acee1] text-[#003823] font-bold text-sm shadow-[0_0_28px_rgba(117,218,168,0.3)] hover:scale-[1.02] transition-all duration-200"
              >
                <span>Ver Planos & Preços</span>
                <ArrowRight className="size-4" />
              </a>

              <button
                type="button"
                onClick={handleSimularRonda}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#202c30]/90 backdrop-blur-xl border border-[#40484b]/60 text-[#d8e5ea] font-semibold text-sm shadow-md hover:bg-[#2f3b40] hover:border-[#75daa8]/40 transition-all duration-200 active:scale-95"
              >
                <ScanLine className="size-4 text-[#75daa8]" />
                <span>{isSimulated ? 'Reiniciar Simulação' : 'Simular Ronda Digital'}</span>
              </button>
            </div>

            {/* 3D Mockup Container */}
            <div className="relative w-full max-w-5xl mx-auto" style={{ perspective: '1200px' }}>
              <div
                onMouseEnter={() => setMockupHover(true)}
                onMouseLeave={() => setMockupHover(false)}
                className="relative w-full rounded-2xl bg-[#152126]/95 backdrop-blur-2xl p-6 lg:p-8 shadow-2xl border border-[#2b373b]/80 transition-transform duration-500 ease-out"
                style={{
                  transform: mockupHover ? 'rotateX(0deg)' : 'rotateX(6deg)',
                }}
              >
                {/* Header da Janela macOS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#2b373b]/60 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ffb4a8]" />
                    <div className="w-3 h-3 rounded-full bg-[#9acee1]" />
                    <div className="w-3 h-3 rounded-full bg-[#75daa8]" />
                    <span className="ml-2 text-xs font-mono text-[#c0c8cb]">senecare.app/ronda-matutina</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#75daa8]/15 text-[#75daa8] text-xs font-semibold">
                    <ShieldCheck className="size-3.5" />
                    <span>Ronda de Medicação Ativa — Turno Matutino (08:00)</span>
                  </div>
                </div>

                {/* Grid Interno do Mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-left">
                  {/* Pacientes */}
                  <div className="lg:col-span-8 flex flex-col gap-3">
                    {/* Paciente 1: Administrado */}
                    <div className="rounded-xl bg-[#111d21] p-4 sm:p-5 border border-[#2b373b]/50 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-[#75daa8]/20 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="size-5 text-[#75daa8]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#d8e5ea] truncate">Dona Irene Guimarães • Leito 104-A</p>
                          <p className="text-xs text-[#c0c8cb] truncate">Losartana 50mg + Metformina 850mg • Dupla checagem QR</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#75daa8]/15 text-[#75daa8] text-xs font-semibold shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                        Administrado 08:02
                      </span>
                    </div>

                    {/* Paciente 2: Interativo */}
                    <div
                      className={`rounded-xl p-4 sm:p-5 border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300 ${
                        isSimulated
                          ? 'bg-[#111d21] border-[#75daa8]/40'
                          : 'bg-[#202c30] border-[#ffb4a8]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isSimulated ? 'bg-[#75daa8]/20' : 'bg-[#ffb4a8]/20'
                          }`}
                        >
                          {isSimulated ? (
                            <CheckCircle2 className="size-5 text-[#75daa8] animate-bounce" />
                          ) : (
                            <Clock className="size-5 text-[#ffb4a8]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#d8e5ea] truncate">Sr. Antônio Prado • Leito 202-B</p>
                          <p className="text-xs text-[#c0c8cb] truncate">
                            {isSimulated
                              ? 'Insulina NPH 14 UI + AAS 100mg • Checagem biométrica validada'
                              : 'Insulina NPH 14 UI + AAS 100mg • Aguardando leitura'}
                          </p>
                        </div>
                      </div>

                      {isSimulated ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#75daa8]/15 text-[#75daa8] text-xs font-semibold shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                          Administrado Agora
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffb4a8]/15 text-[#ffb4a8] text-xs font-semibold shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4a8] animate-pulse" />
                          Aguardando Checagem
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Lateral de Métricas */}
                  <div className="lg:col-span-4 rounded-xl bg-[#111d21] p-5 border border-[#2b373b]/50 shadow-md flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#c0c8cb]">Adesão do Turno</span>
                      <p className="text-3xl font-extrabold text-[#d8e5ea] mt-1 transition-all duration-300">
                        {isSimulated ? '100%' : '94.2%'}
                      </p>
                    </div>

                    <div className="my-3">
                      <svg className="w-full h-14 text-[#75daa8]" fill="none" viewBox="0 0 200 60">
                        <path
                          d="M0 48 Q 30 42, 60 35 T 120 22 T 180 10 L 200 6"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="3"
                        />
                        <path
                          d="M0 48 Q 30 42, 60 35 T 120 22 T 180 10 L 200 6 L 200 60 L 0 60 Z"
                          fill="currentColor"
                          fillOpacity="0.15"
                        />
                      </svg>
                    </div>

                    <span className="text-xs font-medium text-[#75daa8] flex items-center gap-1">
                      <ShieldCheck className="size-3.5" />
                      0 atrasos críticos nas últimas 24h
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges Flutuantes em 3D */}
              <div className="hidden md:flex absolute -top-5 -left-6 rounded-xl bg-[#2b373b]/95 backdrop-blur-xl px-4 py-3 shadow-xl border border-[#40484b]/70 items-center gap-2.5 animate-float-gentle">
                <ShieldCheck className="size-5 text-[#75daa8]" />
                <div className="text-left">
                  <p className="text-[11px] font-medium text-[#c0c8cb]">Risco Sanitário</p>
                  <p className="text-sm font-bold text-[#75daa8]">0%</p>
                </div>
              </div>

              <div className="hidden md:flex absolute -bottom-6 left-12 rounded-xl bg-[#2b373b]/95 backdrop-blur-xl px-4 py-3 shadow-xl border border-[#40484b]/70 items-center gap-2.5 animate-float-delayed">
                <TrendingDown className="size-5 text-[#9acee1]" />
                <div className="text-left">
                  <p className="text-[11px] font-medium text-[#c0c8cb]">Redução de Glosas</p>
                  <p className="text-sm font-bold text-[#d8e5ea]">98.4%</p>
                </div>
              </div>

              <div className="hidden md:flex absolute -bottom-5 -right-5 rounded-xl bg-[#2b373b]/95 backdrop-blur-xl px-4 py-3 shadow-xl border border-[#40484b]/70 items-center gap-2.5 animate-float-gentle">
                <Users className="size-5 text-[#75daa8]" />
                <div className="text-left">
                  <p className="text-[11px] font-medium text-[#c0c8cb]">Residentes Monitorados</p>
                  <p className="text-sm font-bold text-[#d8e5ea]">34 Ativos</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BARRA DE CONFORMIDADE REGULATÓRIA NATIVA */}
        <section id="conformidade" className="w-full py-10 bg-[#051014]/90 border-y border-[#2b373b]/40 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#c0c8cb]">
              Conformidade Regulatória Nativa
            </span>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto px-6 lg:px-12 justify-start lg:justify-center no-scrollbar">
            <div className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#152126] border border-[#2b373b]/80 shadow-sm">
              <ShieldCheck className="size-4 text-[#75daa8]" />
              <span className="text-sm font-semibold text-[#d8e5ea]">ANVISA RDC 502/2021</span>
            </div>
            <div className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#152126] border border-[#2b373b]/80 shadow-sm">
              <Award className="size-4 text-[#9acee1]" />
              <span className="text-sm font-semibold text-[#d8e5ea]">ANVISA RDC 611/2022</span>
            </div>
            <div className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#152126] border border-[#2b373b]/80 shadow-sm">
              <FileCheck2 className="size-4 text-[#75daa8]" />
              <span className="text-sm font-semibold text-[#d8e5ea]">Resoluções COFEN/COREN</span>
            </div>
            <div className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#152126] border border-[#2b373b]/80 shadow-sm">
              <Video className="size-4 text-[#9acee1]" />
              <span className="text-sm font-semibold text-[#d8e5ea]">CFM Telemedicina 2.314</span>
            </div>
            <div className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#152126] border border-[#2b373b]/80 shadow-sm">
              <Lock className="size-4 text-[#75daa8]" />
              <span className="text-sm font-semibold text-[#d8e5ea]">Lei 13.709/18 LGPD</span>
            </div>
            <div className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#152126] border border-[#2b373b]/80 shadow-sm">
              <Scale className="size-4 text-[#9acee1]" />
              <span className="text-sm font-semibold text-[#d8e5ea]">ICP-Brasil</span>
            </div>
          </div>
        </section>

        {/* 4. RECURSOS - BENTO GRID ARQUITETURA CLÍNICA */}
        <section className="w-full py-20 lg:py-28 px-6 lg:px-12" id="recursos">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase text-[#75daa8] tracking-widest">Arquitetura Clínica</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#d8e5ea] mt-2">
                Tudo o que sua ILPI precisa em uma única plataforma
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Card 1: Ronda Inteligente (col 7) */}
              <div className="md:col-span-7 rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg hover:border-[#75daa8]/40 transition-colors flex flex-col justify-between">
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#75daa8]/15 text-[#75daa8] text-xs font-semibold mb-4">
                    Segurança Máxima
                  </span>
                  <h3 className="text-xl font-bold text-[#d8e5ea] mb-2">
                    Ronda de Medicação Inteligente com Beira-Leito
                  </h3>
                  <p className="text-sm text-[#c0c8cb] leading-relaxed">
                    Aprazamento automático, leitura de pulseira via QR Code e dupla checagem em tempo real para zerar erros de dosagem e horário.
                  </p>
                </div>
                <div className="mt-6 rounded-xl bg-[#111d21] p-4 flex items-center justify-between border border-[#2b373b]/40">
                  <span className="text-xs font-medium text-[#d8e5ea]">99,8% de precisão na administração</span>
                  <QrCode className="size-5 text-[#75daa8]" />
                </div>
              </div>

              {/* Card 2: Blindagem Sanitária (col 5) */}
              <div className="md:col-span-5 rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg hover:border-[#9acee1]/40 transition-colors flex flex-col justify-between">
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#9acee1]/15 text-[#9acee1] text-xs font-semibold mb-4">
                    Conformidade Legal
                  </span>
                  <h3 className="text-xl font-bold text-[#d8e5ea] mb-2">
                    Blindagem Sanitária RDC 502 & COREN
                  </h3>
                  <p className="text-sm text-[#c0c8cb] leading-relaxed">
                    POPs digitais auditáveis, controle de temperatura de geladeira e registros de enfermagem prontos para fiscalização em 1 clique.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-[#9acee1] text-xs font-medium">
                  <Gavel className="size-4" />
                  <span>Relatórios prontos para Vigilância Sanitária</span>
                </div>
              </div>

              {/* Card 3: Telemedicina & ICP-Brasil (col 4) */}
              <div className="md:col-span-4 rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg hover:border-[#9acee1]/40 transition-colors">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#9acee1]/15 text-[#9acee1] text-xs font-semibold mb-4">
                  Retaguarda Médica
                </span>
                <h3 className="text-xl font-bold text-[#d8e5ea] mb-2">
                  Telemedicina & Prescrição ICP-Brasil
                </h3>
                <p className="text-sm text-[#c0c8cb] leading-relaxed">
                  Teleconsultas integradas ao prontuário com assinatura digital ICP-Brasil e envio direto para a farmácia.
                </p>
              </div>

              {/* Card 4: Escalas Geriátricas Automáticas (col 8) */}
              <div className="md:col-span-8 rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg hover:border-[#75daa8]/40 transition-colors">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#75daa8]/15 text-[#75daa8] text-xs font-semibold mb-4">
                  Geriatria Avançada
                </span>
                <h3 className="text-xl font-bold text-[#d8e5ea] mb-2">
                  Escalas Geriátricas Automáticas
                </h3>
                <p className="text-sm text-[#c0c8cb] leading-relaxed mb-4">
                  Cálculo automático e histórico evolutivo das principais escalas clínicas para avaliação funcional e risco de quedas.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#202c30] text-xs font-semibold text-[#d8e5ea] border border-[#40484b]/40">Katz</span>
                  <span className="px-3 py-1 rounded-full bg-[#202c30] text-xs font-semibold text-[#d8e5ea] border border-[#40484b]/40">Lawton</span>
                  <span className="px-3 py-1 rounded-full bg-[#202c30] text-xs font-semibold text-[#d8e5ea] border border-[#40484b]/40">Braden</span>
                  <span className="px-3 py-1 rounded-full bg-[#202c30] text-xs font-semibold text-[#d8e5ea] border border-[#40484b]/40">Morse</span>
                  <span className="px-3 py-1 rounded-full bg-[#202c30] text-xs font-semibold text-[#d8e5ea] border border-[#40484b]/40">MEEM</span>
                </div>
              </div>

              {/* Card 5: Usuários Ilimitados (col 6) */}
              <div className="md:col-span-6 rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg hover:border-[#75daa8]/40 transition-colors">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#75daa8]/15 text-[#75daa8] text-xs font-semibold mb-4">
                  Sem Custo Oculto
                </span>
                <h3 className="text-xl font-bold text-[#d8e5ea] mb-2">
                  Usuários e Cuidadores Ilimitados
                </h3>
                <p className="text-sm text-[#c0c8cb] leading-relaxed">
                  Cadastre toda a equipe de enfermagem, cuidadores, médicos, nutricionistas e fisioterapeutas sem pagar por licença adicional.
                </p>
              </div>

              {/* Card 6: Prontuário Multidisciplinar (col 6) */}
              <div className="md:col-span-6 rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg hover:border-[#9acee1]/40 transition-colors">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#9acee1]/15 text-[#9acee1] text-xs font-semibold mb-4">
                  Em 1 Clique
                </span>
                <h3 className="text-xl font-bold text-[#d8e5ea] mb-2">
                  Prontuário Multidisciplinar Integrado
                </h3>
                <p className="text-sm text-[#c0c8cb] leading-relaxed">
                  Evoluções de enfermagem, nutrição, fisioterapia e psicologia centralizadas em linha do tempo única com busca instantânea.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. COMPARATIVO: SEM O SENECARE VS. COM O SENECARE */}
        <section className="w-full py-16 lg:py-24 px-6 lg:px-12 bg-[#111d21]/60 border-y border-[#2b373b]/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase text-[#9acee1] tracking-widest">Impacto Operacional</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#d8e5ea] mt-2">
                Sem o Senecare vs. Com o Senecare
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sem o Senecare */}
              <div className="rounded-2xl bg-[#81251a]/20 border border-[#ffb4a8]/30 p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle className="size-6 text-[#ffb4a8]" />
                  <h3 className="text-lg font-bold text-[#ffb4a8]">Sem o Senecare: Papel & Planilhas</h3>
                </div>
                <ul className="space-y-4 text-sm text-[#c0c8cb]">
                  <li className="flex items-start gap-3">
                    <X className="size-5 text-[#ffb4a8] shrink-0 mt-0.5" />
                    <span>Risco constante de multas e interdições por falhas em POPs da RDC 502.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="size-5 text-[#ffb4a8] shrink-0 mt-0.5" />
                    <span>Letras ilegíveis em prescrições e extravio de fichas de evolução.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="size-5 text-[#ffb4a8] shrink-0 mt-0.5" />
                    <span>Falta de rastreabilidade de quem administrou cada medicamento.</span>
                  </li>
                </ul>
              </div>

              {/* Com o Senecare */}
              <div className="rounded-2xl bg-[#008056]/20 border border-[#75daa8]/30 p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle2 className="size-6 text-[#75daa8]" />
                  <h3 className="text-lg font-bold text-[#75daa8]">Com o Senecare: 100% Digital & Auditado</h3>
                </div>
                <ul className="space-y-4 text-sm text-[#d8e5ea]">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-[#75daa8] shrink-0 mt-0.5" />
                    <span>Prontuário unificado com assinatura digital e trilha de auditoria completa.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-[#75daa8] shrink-0 mt-0.5" />
                    <span>POPs do Art. 38 automatizados e prontos para apresentação imediata.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-[#75daa8] shrink-0 mt-0.5" />
                    <span>Checagem beira-leito via QR Code com alertas de interação e atraso.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 6. DEPOIMENTOS: QUEM USA APROVA */}
        <section className="w-full py-20 lg:py-24 px-6 lg:px-12" id="depoimentos">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase text-[#75daa8] tracking-widest">Quem Usa Aprova</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#d8e5ea] mt-2">
                Confiança de quem lidera o cuidado geriátrico
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Depoimento 1 */}
              <div className="rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[#75daa8] mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-4 fill-[#75daa8]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#d8e5ea] leading-relaxed mb-6 italic">
                    “Passamos por duas vistorias da Vigilância Sanitária sem nenhuma ressalva. O prontuário e os POPs digitais do Senecare nos deram total segurança.”
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#d8e5ea]">Helena Prado</p>
                  <p className="text-xs text-[#c0c8cb]">Responsável Técnica • Residencial Vila Serena</p>
                </div>
              </div>

              {/* Depoimento 2 */}
              <div className="rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[#75daa8] mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-4 fill-[#75daa8]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#d8e5ea] leading-relaxed mb-6 italic">
                    “A prescrição com ICP-Brasil e as escalas geriátricas automáticas reduziram em 70% o tempo burocrático da minha equipe médica.”
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#d8e5ea]">Dr. Roberto Faria</p>
                  <p className="text-xs text-[#c0c8cb]">Diretor Clínico • Instituto Longevidade</p>
                </div>
              </div>

              {/* Depoimento 3 */}
              <div className="rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[#75daa8] mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-4 fill-[#75daa8]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#d8e5ea] leading-relaxed mb-6 italic">
                    “A ronda de medicação com QR Code eliminou esquecimentos na troca de plantão. Hoje temos visibilidade total de cada residente.”
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#d8e5ea]">Renata Silveira</p>
                  <p className="text-xs text-[#c0c8cb]">Coord. de Enfermagem • Casa de Repouso Aurora</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. PLANOS & PREÇOS (INVESTIMENTO TRANSPARENTE) */}
        <section className="w-full py-20 lg:py-28 px-6 lg:px-12 bg-[#111d21]/70 border-t border-[#2b373b]/40" id="planos">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase text-[#75daa8] tracking-widest">Investimento Transparente</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#d8e5ea] mt-2 mb-6">
                Planos sob medida para sua ILPI
              </h2>

              {/* Switch Mensal / Anual */}
              <div className="inline-flex items-center p-1 rounded-full bg-[#202c30] border border-[#40484b]/60 shadow-md">
                <button
                  type="button"
                  role="switch"
                  aria-checked={faturamentoAnual}
                  onClick={() => setFaturamentoAnual(!faturamentoAnual)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                    !faturamentoAnual
                      ? 'bg-[#75daa8] text-[#003823]'
                      : 'text-[#c0c8cb] hover:text-[#d8e5ea]'
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setFaturamentoAnual(true)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                    faturamentoAnual
                      ? 'bg-[#75daa8] text-[#003823]'
                      : 'text-[#c0c8cb] hover:text-[#d8e5ea]'
                  }`}
                >
                  Anual (Economize 15%)
                </button>
              </div>
            </div>

            {/* 4 Cards de Planos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              {/* Plano Compacto */}
              <div className="rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-6 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#d8e5ea]">Plano Compacto</h3>
                  <p className="text-xs text-[#c0c8cb] mt-1">Até 20 residentes</p>

                  <div className="my-6 flex items-baseline">
                    <span className="text-sm font-semibold text-[#c0c8cb] mr-1">R$</span>
                    <span className="text-3xl font-extrabold text-[#d8e5ea]">
                      {faturamentoAnual ? '382,50' : '450,00'}
                    </span>
                    <span className="text-xs text-[#c0c8cb] ml-1">/mês</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[#c0c8cb] mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                      Prontuário eletrônico completo
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                      Ronda de medicação digital
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                      Usuários e cuidadores ilimitados
                    </li>
                  </ul>
                </div>

                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center py-2.5 rounded-lg bg-[#202c30] text-[#d8e5ea] font-semibold text-xs hover:bg-[#2f3b40] transition-colors border border-[#40484b]/50"
                >
                  Começar Agora
                </Link>
              </div>

              {/* Clínico & Compliance (Destaque) */}
              <div className="rounded-2xl bg-[#0f4c5c]/40 border-2 border-[#75daa8] p-6 shadow-2xl flex flex-col justify-between relative">
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#75daa8] text-[#003823] text-[10px] font-extrabold uppercase tracking-wider mb-2">
                    Mais Escolhido
                  </span>
                  <h3 className="text-lg font-bold text-[#d8e5ea]">Clínico & Compliance</h3>
                  <p className="text-xs text-[#9acee1] mt-1">Até 50 residentes</p>

                  <div className="my-6 flex items-baseline">
                    <span className="text-sm font-semibold text-[#9acee1] mr-1">R$</span>
                    <span className="text-3xl font-extrabold text-[#d8e5ea]">
                      {faturamentoAnual ? '756,50' : '890,00'}
                    </span>
                    <span className="text-xs text-[#9acee1] ml-1">/mês</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[#d8e5ea] mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                      Tudo do Plano Compacto
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                      POPs ANVISA RDC 502/2021
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                      Escalas geriátricas automáticas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                      Checagem beira-leito QR Code
                    </li>
                  </ul>
                </div>

                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center py-2.5 rounded-lg bg-[#75daa8] text-[#003823] font-bold text-xs shadow-[0_0_20px_rgba(117,218,168,0.3)] hover:bg-[#92f7c3] transition-all"
                >
                  Escolher Plano
                </Link>
              </div>

              {/* Plano Avançado */}
              <div className="rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-6 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#d8e5ea]">Plano Avançado</h3>
                  <p className="text-xs text-[#c0c8cb] mt-1">Até 100 residentes</p>

                  <div className="my-6 flex items-baseline">
                    <span className="text-sm font-semibold text-[#c0c8cb] mr-1">R$</span>
                    <span className="text-3xl font-extrabold text-[#d8e5ea]">
                      {faturamentoAnual ? '1.181,50' : '1.390,00'}
                    </span>
                    <span className="text-xs text-[#c0c8cb] ml-1">/mês</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[#c0c8cb] mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                      Tudo do Clínico & Compliance
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                      Telemedicina + ICP-Brasil
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                      Gestão de estoque farmacêutico
                    </li>
                  </ul>
                </div>

                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center py-2.5 rounded-lg bg-[#202c30] text-[#d8e5ea] font-semibold text-xs hover:bg-[#2f3b40] transition-colors border border-[#40484b]/50"
                >
                  Começar Agora
                </Link>
              </div>

              {/* Redes & Enterprise */}
              <div className="rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-6 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#d8e5ea]">Redes & Enterprise</h3>
                  <p className="text-xs text-[#c0c8cb] mt-1">Múltiplas unidades</p>

                  <div className="my-6 flex items-baseline">
                    <span className="text-sm font-semibold text-[#c0c8cb] mr-1">R$</span>
                    <span className="text-3xl font-extrabold text-[#d8e5ea]">
                      {faturamentoAnual ? '1.691,50' : '1.990,00'}
                    </span>
                    <span className="text-xs text-[#c0c8cb] ml-1">/mês</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[#c0c8cb] mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                      Painel consolidado multi-ILPI
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                      API dedicada & BI executivo
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                      Gerente de conta clínico 24/7
                    </li>
                  </ul>
                </div>

                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center py-2.5 rounded-lg bg-[#202c30] text-[#d8e5ea] font-semibold text-xs hover:bg-[#2f3b40] transition-colors border border-[#40484b]/50"
                >
                  Falar com Consultor
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FAQ INTERATIVO */}
        <section className="w-full py-20 lg:py-24 px-6 lg:px-12" id="faq">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase text-[#9acee1] tracking-widest">Dúvidas Frequentes</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#d8e5ea] mt-2">
                Perguntas sobre implantação e conformidade
              </h2>
            </div>

            <div className="space-y-3">
              {/* FAQ 1 */}
              <div className="rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-6 shadow-md">
                <button
                  type="button"
                  onClick={() => toggleFaq(0)}
                  className="w-full flex items-center justify-between text-left gap-4"
                >
                  <span className="text-base font-semibold text-[#d8e5ea]">
                    O sistema atende integralmente à RDC 502/2021 da ANVISA?
                  </span>
                  <ChevronDown
                    className={`size-5 text-[#75daa8] shrink-0 transition-transform duration-200 ${
                      faqAberto === 0 ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {faqAberto === 0 && (
                  <div className="pt-4 text-sm text-[#c0c8cb] leading-relaxed border-t border-[#2b373b]/50 mt-4">
                    Sim! O Senecurare foi construído especificamente para ILPIs com base nas exigências da ANVISA (RDC 502/2021 e RDC 611) e resoluções do COREN. Todos os módulos de prontuário, aprazamento, plano de atenção integral à saúde e POPs seguem rigorosamente as fiscalizações sanitárias.
                  </div>
                )}
              </div>

              {/* FAQ 2 */}
              <div className="rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-6 shadow-md">
                <button
                  type="button"
                  onClick={() => toggleFaq(1)}
                  className="w-full flex items-center justify-between text-left gap-4"
                >
                  <span className="text-base font-semibold text-[#d8e5ea]">
                    Quanto tempo leva para implantar o sistema na minha ILPI?
                  </span>
                  <ChevronDown
                    className={`size-5 text-[#75daa8] shrink-0 transition-transform duration-200 ${
                      faqAberto === 1 ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {faqAberto === 1 && (
                  <div className="pt-4 text-sm text-[#c0c8cb] leading-relaxed border-t border-[#2b373b]/50 mt-4">
                    A implantação guiada leva em média 48 horas, incluindo importação de residentes, configuração de prescrições e treinamento online da equipe de enfermagem.
                  </div>
                )}
              </div>

              {/* FAQ 3 */}
              <div className="rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-6 shadow-md">
                <button
                  type="button"
                  onClick={() => toggleFaq(2)}
                  className="w-full flex items-center justify-between text-left gap-4"
                >
                  <span className="text-base font-semibold text-[#d8e5ea]">
                    Há cobrança por número de cuidadores ou enfermeiros cadastrados?
                  </span>
                  <ChevronDown
                    className={`size-5 text-[#75daa8] shrink-0 transition-transform duration-200 ${
                      faqAberto === 2 ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {faqAberto === 2 && (
                  <div className="pt-4 text-sm text-[#c0c8cb] leading-relaxed border-t border-[#2b373b]/50 mt-4">
                    Não. Todos os planos incluem usuários e cuidadores ilimitados sem qualquer custo oculto por licença.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 9. BANNER FINAL DE CONVERSÃO */}
        <section className="w-full py-16 lg:py-24 px-6 lg:px-12">
          <div className="relative max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-[#0f4c5c] via-[#202c30] to-[#008056]/40 p-10 lg:p-16 text-center shadow-2xl border border-[#75daa8]/30 overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#d8e5ea] mb-4">
                Pronto para profissionalizar sua ILPI e eliminar riscos sanitários?
              </h2>
              <p className="text-base sm:text-lg text-[#c0c8cb] mb-8 leading-relaxed">
                Junte-se às residências geriátricas que elevaram o padrão assistencial com governança clínica em tempo real.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a
                  href="#planos"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#75daa8] text-[#003823] font-bold text-sm shadow-[0_0_24px_rgba(117,218,168,0.35)] hover:bg-[#92f7c3] transition-all"
                >
                  <span>Escolher um Plano</span>
                </a>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#152126]/90 border border-[#40484b]/60 text-[#d8e5ea] font-semibold text-sm hover:bg-[#202c30] transition-all"
                >
                  <span>Agendar Demonstração Gratuita</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 10. FOOTER COMPLETO */}
      <footer className="w-full bg-[#051014] border-t border-[#2b373b]/40 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#2b373b]/40">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <SenecurareLogo variant="horizontal" size="sm" showTagline />
              </div>
              <p className="text-xs text-[#c0c8cb] leading-relaxed">
                Plataforma de governança clínica e gestão operacional para ILPIs e residências geriátricas com foco em segurança assistencial e conformidade regulatória.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d8e5ea] mb-3">Soluções & Recursos</h3>
              <ul className="space-y-2 text-xs text-[#c0c8cb]">
                <li><a href="#recursos" className="hover:text-[#d8e5ea] transition-colors">Prontuário Geriátrico</a></li>
                <li><a href="#recursos" className="hover:text-[#d8e5ea] transition-colors">Aprazamento e Medicação</a></li>
                <li><a href="#planos" className="hover:text-[#d8e5ea] transition-colors">Planos Institucionais</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d8e5ea] mb-3">Conformidade & Normas</h3>
              <ul className="space-y-2 text-xs text-[#c0c8cb]">
                <li><a href="#conformidade" className="hover:text-[#d8e5ea] transition-colors">RDC 502/2021 ANVISA</a></li>
                <li><a href="#conformidade" className="hover:text-[#d8e5ea] transition-colors">LGPD na Saúde</a></li>
                <li><a href="#faq" className="hover:text-[#d8e5ea] transition-colors">Auditoria e Rastreabilidade</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d8e5ea] mb-3">Contato & Plantão</h3>
              <ul className="space-y-2 text-xs text-[#c0c8cb]">
                <li><Link to="/login" className="hover:text-[#d8e5ea] transition-colors">Agendar Demonstração</Link></li>
                <li><Link to="/login" className="hover:text-[#d8e5ea] transition-colors">Portal do Cliente</Link></li>
                <li><span className="text-[#75daa8]">Suporte Clínico 24/7</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#c0c8cb]">
            <span>© 2026 Senecurare Tecnologia em Saúde LTDA. Todos os direitos reservados.</span>
            <span>Sistema ILPI & Residências Geriátricas</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
