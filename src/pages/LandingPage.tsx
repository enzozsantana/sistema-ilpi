import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  AlertTriangle,
  QrCode,
  ScanLine,
  X,
  ChevronDown,
  Sun,
  Sunset,
  Moon,
  Thermometer,
  Sparkles,
  RotateCcw,
  ClipboardCheck,
  FileBadge,
  HeartPulse,
  FileSignature,
  ShieldPlus,
  HeartHandshake,
  FolderHeart,
  Pill,
  Video,
  Lock,
  Scale,
} from 'lucide-react'
import { SenecurareLogo } from '../components/SenecurareLogo'
import { ThemeToggle } from '../components/ThemeToggle'
import { ScrollReveal } from '../components/ScrollReveal'
import { toast } from 'sonner'

type AbaMockup = 'ronda' | 'escalas' | 'rdc'
type TurnoId = 'manha' | 'tarde' | 'noite'
type EscalaId = 'Katz' | 'Lawton' | 'Braden' | 'Morse' | 'MEEM'
type VarianteIcone3D = 'menta' | 'gelo' | 'ouro' | 'coral'

interface IconeTatil3DProps {
  icon: React.ComponentType<{ className?: string }>
  variante?: VarianteIcone3D
  tamanho?: 'sm' | 'md'
}

function IconeTatil3D({
  icon: IconPrincipal,
  variante = 'menta',
  tamanho = 'sm',
}: IconeTatil3DProps) {
  const estilos: Record<VarianteIcone3D, string> = {
    menta: 'text-[#75daa8]',
    gelo: 'text-[#9acee1]',
    ouro: 'text-amber-300',
    coral: 'text-[#ffb4a8]',
  }

  const dims = tamanho === 'sm' ? 'size-9' : 'size-11'
  const cor = estilos[variante]

  return (
    <IconPrincipal
      className={`${dims} ${cor} stroke-[2] shrink-0 transition-transform duration-300 group-hover:scale-105`}
    />
  )
}

interface ItemRonda {
  id: string
  residente: string
  leito: string
  prescricao: string
  sinaisVitais: string
  horario: string
  checadoInicial: boolean
}

interface DadosTurno {
  label: string
  horarioRonda: string
  rota: string
  tempGeladeira: string
  adesaoBase: number
  itens: ItemRonda[]
}

const DADOS_TURNOS: Record<TurnoId, DadosTurno> = {
  manha: {
    label: 'Manhã (08:00)',
    horarioRonda: 'Turno Matutino (08:00)',
    rota: 'senecurare.app/ronda-matutina',
    tempGeladeira: '4.2°C (Conforme)',
    adesaoBase: 94.2,
    itens: [
      {
        id: 'm1',
        residente: 'Dona Irene Guimarães',
        leito: 'Leito 104-A',
        prescricao: 'Losartana 50mg + Metformina 850mg • Dupla checagem QR',
        sinaisVitais: 'PA 120/80 • HGT 108 mg/dL',
        horario: '08:02',
        checadoInicial: true,
      },
      {
        id: 'm2',
        residente: 'Sr. Antônio Prado',
        leito: 'Leito 202-B',
        prescricao: 'Insulina NPH 14 UI + AAS 100mg • Checagem beira-leito',
        sinaisVitais: 'PA 130/80 • HGT 142 mg/dL',
        horario: '08:15',
        checadoInicial: false,
      },
    ],
  },
  tarde: {
    label: 'Tarde (14:00)',
    horarioRonda: 'Turno Vespertino (14:00)',
    rota: 'senecurare.app/ronda-vespertina',
    tempGeladeira: '4.5°C (Conforme)',
    adesaoBase: 91.5,
    itens: [
      {
        id: 't1',
        residente: 'Dona Clarice Mendes',
        leito: 'Leito 108-A',
        prescricao: 'Donepezila 10mg + Mudança de decúbito (Protocolo Braden)',
        sinaisVitais: 'SatO₂ 97% • FC 74 bpm',
        horario: '14:04',
        checadoInicial: true,
      },
      {
        id: 't2',
        residente: 'Sr. Oswaldo Nogueira',
        leito: 'Leito 205-A',
        prescricao: 'Hidratação assistida + Antibiótico horário + Aferição térmica',
        sinaisVitais: 'Tax 36.6°C • PA 125/75',
        horario: '14:20',
        checadoInicial: false,
      },
    ],
  },
  noite: {
    label: 'Noite (21:00)',
    horarioRonda: 'Plantão Noturno (21:00)',
    rota: 'senecurare.app/ronda-noturna',
    tempGeladeira: '3.9°C (Conforme)',
    adesaoBase: 96.0,
    itens: [
      {
        id: 'n1',
        residente: 'Dona Beatriz Vasconcelos',
        leito: 'Leito 101-B',
        prescricao: 'Quetiapina 25mg + Protocolo prevenção de quedas (Morse)',
        sinaisVitais: 'PA 118/76 • Grade elevada',
        horario: '21:01',
        checadoInicial: true,
      },
      {
        id: 'n2',
        residente: 'Sr. Joaquim Tavares',
        leito: 'Leito 210-A',
        prescricao: 'Sinvastatina 20mg + Glicemia capilar noturna + Passagem de plantão',
        sinaisVitais: 'HGT 116 mg/dL • SatO₂ 96%',
        horario: '21:15',
        checadoInicial: false,
      },
    ],
  },
}

const ESCALAS_INFO: Record<
  EscalaId,
  { titulo: string; foco: string; alerta: string; scoreExemplo: string }
> = {
  Katz: {
    titulo: 'Índice de Katz',
    foco: 'Independência para atividades básicas de vida diária (banho, vestir, higiene, transferência, continência e alimentação).',
    alerta: 'Classificação automática de dependência funcional para dimensionamento da equipe.',
    scoreExemplo: 'Score 2/6 • Alta dependência',
  },
  Lawton: {
    titulo: 'Escala de Lawton',
    foco: 'Atividades instrumentais e autonomia cognitivo-funcional.',
    alerta: 'Acompanha perda progressiva de autonomia no plano terapêutico.',
    scoreExemplo: '14/27 pts • Monitorado',
  },
  Braden: {
    titulo: 'Escala de Braden',
    foco: 'Avaliação de risco para lesão por pressão (percepção sensorial, umidade, atividade, mobilidade, nutrição e fricção).',
    alerta: 'Dispara alertas preventivos de mudança de decúbito e cuidados de pele.',
    scoreExemplo: 'Score 12 • Risco moderado/alto',
  },
  Morse: {
    titulo: 'Escala de Morse',
    foco: 'Risco de quedas em pacientes geriátricos com histórico, comorbidades, marcha e uso de auxílios.',
    alerta: 'Sinaliza leito e ronda com protocolo preventivo ativo.',
    scoreExemplo: '55 pts • Alto risco de queda',
  },
  MEEM: {
    titulo: 'Mini Exame do Estado Mental',
    foco: 'Rastreio cognitivo estruturado (orientação, memória, atenção, linguagem e execução).',
    alerta: 'Registra evolução longitudinal e apoia conduta multiprofissional.',
    scoreExemplo: '21/30 • Seguimento ativo',
  },
}

const ITENS_CONFORMIDADE: Array<{
  icon: React.ComponentType<{ className?: string }>
  text: string
  corIcone: string
}> = [
  {
    icon: ShieldCheck,
    text: 'ANVISA RDC 502/2021',
    corIcone: 'text-[#75daa8]',
  },
  {
    icon: FileBadge,
    text: 'Estatuto do Idoso (Lei 10.741)',
    corIcone: 'text-[#9acee1]',
  },
  {
    icon: HeartPulse,
    text: 'Resoluções COFEN/COREN',
    corIcone: 'text-[#75daa8]',
  },
  {
    icon: Video,
    text: 'CFM Telemedicina 2.314/22',
    corIcone: 'text-[#9acee1]',
  },
  {
    icon: Lock,
    text: 'Lei 13.709/18 LGPD',
    corIcone: 'text-[#75daa8]',
  },
  {
    icon: Scale,
    text: 'Padrão ICP-Brasil (MP 2.200-2)',
    corIcone: 'text-[#9acee1]',
  },
]

export default function LandingPage() {
  const [faturamentoAnual, setFaturamentoAnual] = useState(false)
  const [faqAberto, setFaqAberto] = useState<number | null>(null)
  const [mockupHover, setMockupHover] = useState(false)

  const [abaMockup, setAbaMockup] = useState<AbaMockup>('ronda')
  const [turnoAtivo, setTurnoAtivo] = useState<TurnoId>('manha')
  const [itensChecados, setItensChecados] = useState<Record<string, boolean>>({
    m1: true,
    m2: false,
    t1: true,
    t2: false,
    n1: true,
    n2: false,
  })
  const [escalaAtiva, setEscalaAtiva] = useState<EscalaId>('Braden')
  const [checklistRdc, setChecklistRdc] = useState<Record<string, boolean>>({
    pops: true,
    temp: true,
    art38: false,
  })
  const [planoFoco, setPlanoFoco] = useState<'compacto' | 'clinico' | 'avancado' | 'enterprise'>(
    'clinico'
  )

  const dadosTurnoAtual = DADOS_TURNOS[turnoAtivo]

  const todosChecadosNoTurno = useMemo(
    () => dadosTurnoAtual.itens.every((item) => itensChecados[item.id]),
    [dadosTurnoAtual, itensChecados]
  )

  const adesaoAtual = useMemo(() => {
    const total = dadosTurnoAtual.itens.length
    const feitos = dadosTurnoAtual.itens.filter((i) => itensChecados[i.id]).length
    if (feitos === total) return '100%'
    return `${dadosTurnoAtual.adesaoBase.toFixed(1)}%`
  }, [dadosTurnoAtual, itensChecados])

  const handleToggleItemRonda = (item: ItemRonda) => {
    setItensChecados((prev) => {
      const novoEstado = !prev[item.id]
      if (novoEstado) {
        toast.success(
          `Checagem QR validada: ${item.residente} (${item.leito}) • Assinatura registrada!`
        )
      } else {
        toast.info(`Registro de ${item.residente} reaberto para simulação.`)
      }
      return { ...prev, [item.id]: novoEstado }
    })
  }

  const handleSimularTurnoCompleto = () => {
    setAbaMockup('ronda')
    if (todosChecadosNoTurno) {
      setItensChecados((prev) => {
        const atualizado = { ...prev }
        dadosTurnoAtual.itens.forEach((item) => {
          atualizado[item.id] = item.checadoInicial
        })
        return atualizado
      })
      toast.info(`Simulação do ${dadosTurnoAtual.label} reiniciada.`)
    } else {
      setItensChecados((prev) => {
        const atualizado = { ...prev }
        dadosTurnoAtual.itens.forEach((item) => {
          atualizado[item.id] = true
        })
        return atualizado
      })
      toast.success(
        `Ronda do turno ${dadosTurnoAtual.label} 100% concluída via QR Code beira-leito!`
      )
    }
  }

  const toggleFaq = (idx: number) => {
    setFaqAberto(faqAberto === idx ? null : idx)
  }

  const toggleRdcItem = (key: string) => {
    setChecklistRdc((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const totalRdcConcluido = Object.values(checklistRdc).filter(Boolean).length

  return (
    <div className="min-h-screen bg-[#091519] text-[#d8e5ea] font-sans antialiased overflow-x-hidden selection:bg-[#75daa8]/20 selection:text-[#75daa8]">
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
              to="/cadastro-especialista"
              className="hidden md:inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#75daa8] border border-[#75daa8]/30 hover:bg-[#75daa8]/10 transition-all"
            >
              Sou Especialista
            </Link>
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
        <section className="relative w-full py-16 lg:py-24 px-6 lg:px-12 overflow-hidden">
          <div className="absolute -top-24 left-1/4 w-[520px] h-[520px] rounded-full bg-[#0f4c5c]/30 blur-3xl pointer-events-none" />
          <div className="absolute top-32 right-1/4 w-[420px] h-[420px] rounded-full bg-[#75daa8]/10 blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#202c30]/90 backdrop-blur-xl border border-[#40484b]/60 shadow-md mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#75daa8] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#75daa8]" />
              </span>
              <span className="text-xs font-semibold text-[#75daa8]">
                Software Especialista para ILPIs & Residências Geriátricas • Conformidade ANVISA RDC 502 & COFEN
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#d8e5ea] max-w-4xl tracking-tight mb-4 leading-[1.15]">
              Elimine erros de medicação e blinde sua ILPI contra{' '}
              <span className="bg-gradient-to-r from-[#9acee1] via-[#75daa8] to-[#b6ebfe] bg-clip-text text-transparent">
                fiscalizações sanitárias.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#c0c8cb] max-w-2xl mb-8 leading-relaxed">
              Prontuário multidisciplinar unificado, rondas de enfermagem beira-leito com dupla checagem e POPs automatizados da ANVISA em uma plataforma de governança clínica de alta precisão.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              <a
                href="#planos"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-gradient-to-r from-[#75daa8] to-[#9acee1] text-[#003823] font-bold text-sm shadow-[0_0_28px_rgba(117,218,168,0.3)] hover:scale-[1.02] transition-all duration-200"
              >
                <span>Ver Planos & Preços</span>
                <ArrowRight className="size-4" />
              </a>

              <button
                type="button"
                onClick={handleSimularTurnoCompleto}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#202c30]/90 backdrop-blur-xl border border-[#40484b]/60 text-[#d8e5ea] font-semibold text-sm shadow-md hover:bg-[#2f3b40] hover:border-[#75daa8]/40 transition-all duration-200 active:scale-95"
              >
                {todosChecadosNoTurno ? (
                  <>
                    <RotateCcw className="size-4 text-[#9acee1]" />
                    <span>Reiniciar Turno</span>
                  </>
                ) : (
                  <>
                    <ScanLine className="size-4 text-[#75daa8]" />
                    <span>Checar Turno {dadosTurnoAtual.label}</span>
                  </>
                )}
              </button>
            </div>

            <div className="inline-flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-[#152126]/95 border border-[#2b373b]/80 shadow-lg mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#c0c8cb] px-2.5">
                Simular Plantão:
              </span>
              {(
                [
                  { id: 'manha', label: '08:00 Manhã', icon: <Sun className="size-3.5" /> },
                  { id: 'tarde', label: '14:00 Tarde', icon: <Sunset className="size-3.5" /> },
                  { id: 'noite', label: '21:00 Noite', icon: <Moon className="size-3.5" /> },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTurnoAtivo(t.id)
                    setAbaMockup('ronda')
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    turnoAtivo === t.id
                      ? 'bg-[#75daa8] text-[#003823] shadow-sm'
                      : 'text-[#c0c8cb] hover:text-white hover:bg-[#202c30]'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <div className="relative w-full max-w-5xl mx-auto" style={{ perspective: '1200px' }}>
              <div
                onMouseEnter={() => setMockupHover(true)}
                onMouseLeave={() => setMockupHover(false)}
                className="relative w-full rounded-2xl bg-[#152126]/95 backdrop-blur-2xl p-6 lg:p-8 shadow-2xl border border-[#2b373b]/80 transition-transform duration-500 ease-out"
                style={{
                  transform: mockupHover ? 'rotateX(0deg)' : 'rotateX(5deg)',
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-[#2b373b]/60 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ffb4a8]" />
                    <div className="w-3 h-3 rounded-full bg-[#9acee1]" />
                    <div className="w-3 h-3 rounded-full bg-[#75daa8]" />
                    <span className="ml-2 text-xs font-mono text-[#c0c8cb]">
                      {abaMockup === 'ronda'
                        ? dadosTurnoAtual.rota
                        : abaMockup === 'escalas'
                        ? 'senecurare.app/escalas-geriatricas'
                        : 'senecurare.app/auditoria-rdc502'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 bg-[#111d21] p-1 rounded-xl border border-[#2b373b]/70">
                    <button
                      type="button"
                      onClick={() => setAbaMockup('ronda')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        abaMockup === 'ronda'
                          ? 'bg-[#75daa8] text-[#003823]'
                          : 'text-[#c0c8cb] hover:text-white'
                      }`}
                    >
                      1. Ronda QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbaMockup('escalas')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        abaMockup === 'escalas'
                          ? 'bg-[#75daa8] text-[#003823]'
                          : 'text-[#c0c8cb] hover:text-white'
                      }`}
                    >
                      2. Escalas Geriátricas
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbaMockup('rdc')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        abaMockup === 'rdc'
                          ? 'bg-[#75daa8] text-[#003823]'
                          : 'text-[#c0c8cb] hover:text-white'
                      }`}
                    >
                      3. Blindagem RDC 502
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-left">
                  <div className="lg:col-span-8 flex flex-col gap-3">
                    {abaMockup === 'ronda' &&
                      dadosTurnoAtual.itens.map((item) => {
                        const checado = !!itensChecados[item.id]
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleItemRonda(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleToggleItemRonda(item)}
                            className={`cursor-pointer rounded-xl p-4 sm:p-5 border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300 ${
                              checado
                                ? 'bg-[#111d21] border-[#75daa8]/40 hover:border-[#75daa8]'
                                : 'bg-[#202c30] border-[#ffb4a8]/40 hover:border-[#75daa8]/60'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <IconeTatil3D
                                icon={checado ? CheckCircle2 : Clock}
                                variante={checado ? 'menta' : 'coral'}
                                tamanho="sm"
                              />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-[#d8e5ea] truncate">
                                    {item.residente} • {item.leito}
                                  </p>
                                  <span className="text-[11px] font-mono text-[#9acee1]">
                                    {item.sinaisVitais}
                                  </span>
                                </div>
                                <p className="text-xs text-[#c0c8cb] truncate mt-0.5">
                                  {item.prescricao}
                                </p>
                              </div>
                            </div>

                            {checado ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#75daa8]/15 text-[#75daa8] text-xs font-semibold shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                                Administrado {item.horario}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffb4a8]/15 text-[#ffb4a8] text-xs font-semibold shrink-0">
                                <QrCode className="size-3.5" />
                                Checar Beira-Leito
                              </span>
                            )}
                          </div>
                        )
                      })}

                    {abaMockup === 'escalas' && (
                      <div className="rounded-xl bg-[#111d21] p-5 border border-[#2b373b]/60 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#9acee1]">
                            Simulador de Escalas Geriátricas
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#75daa8]/15 text-[#75daa8]">
                            {ESCALAS_INFO[escalaAtiva].scoreExemplo}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(ESCALAS_INFO) as EscalaId[]).map((esc) => (
                            <button
                              key={esc}
                              type="button"
                              onClick={() => setEscalaAtiva(esc)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                escalaAtiva === esc
                                  ? 'bg-[#75daa8] text-[#003823] border-[#75daa8]'
                                  : 'bg-[#202c30] text-[#c0c8cb] border-[#40484b]/50 hover:text-white'
                              }`}
                            >
                              {esc}
                            </button>
                          ))}
                        </div>
                        <div className="p-4 rounded-xl bg-[#152126] border border-[#2b373b]/60 space-y-1.5">
                          <h4 className="text-sm font-bold text-[#d8e5ea]">
                            {ESCALAS_INFO[escalaAtiva].titulo}
                          </h4>
                          <p className="text-xs text-[#c0c8cb] leading-relaxed">
                            {ESCALAS_INFO[escalaAtiva].foco}
                          </p>
                          <p className="text-xs text-[#75daa8] font-medium pt-1">
                            ✓ {ESCALAS_INFO[escalaAtiva].alerta}
                          </p>
                        </div>
                      </div>
                    )}

                    {abaMockup === 'rdc' && (
                      <div className="rounded-xl bg-[#111d21] p-5 border border-[#2b373b]/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#75daa8]">
                            Checklist Interativo RDC 502/2021
                          </span>
                          <span className="text-xs font-mono text-[#9acee1]">
                            {totalRdcConcluido}/3 auditados
                          </span>
                        </div>
                        {[
                          {
                            id: 'pops',
                            label: 'POPs digitais de enfermagem e higiene assinados',
                          },
                          {
                            id: 'temp',
                            label: 'Registro diário de temperatura de refrigeração e insumos',
                          },
                          {
                            id: 'art38',
                            label: 'Capacitação periódica da equipe (Art. 38) documentada',
                          },
                        ].map((item) => {
                          const ativo = checklistRdc[item.id]
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleRdcItem(item.id)}
                              className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                                ativo
                                  ? 'bg-[#75daa8]/10 border-[#75daa8]/40 text-[#d8e5ea]'
                                  : 'bg-[#152126] border-[#2b373b]/60 text-[#c0c8cb]'
                              }`}
                            >
                              <span>{item.label}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                  ativo
                                    ? 'bg-[#75daa8] text-[#003823]'
                                    : 'bg-[#202c30] text-[#c0c8cb]'
                                }`}
                              >
                                {ativo ? 'Conforme' : 'Marcar'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-4 rounded-xl bg-[#111d21] p-5 border border-[#2b373b]/50 shadow-md flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#c0c8cb]">
                          Adesão • {dadosTurnoAtual.label}
                        </span>
                      </div>
                      <p className="text-3xl font-extrabold text-[#d8e5ea] mt-1 transition-all duration-300">
                        {adesaoAtual}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#152126] border border-[#2b373b]/60 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#c0c8cb]">
                        <Thermometer className="size-3.5 text-[#9acee1]" />
                        Cadeia de Frio
                      </span>
                      <span className="font-mono font-bold text-[#75daa8]">
                        {dadosTurnoAtual.tempGeladeira}
                      </span>
                    </div>

                    <span className="text-xs font-medium text-[#75daa8] flex items-center gap-1">
                      <ShieldCheck className="size-3.5" />
                      0 atrasos críticos nas últimas 24h
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex absolute -top-5 -left-6 rounded-2xl bg-[#2b373b]/95 backdrop-blur-xl px-4 py-3 shadow-xl border border-[#40484b]/70 items-center gap-3 animate-float-gentle">
                <ShieldPlus className="size-8 text-[#75daa8] stroke-[2] shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] font-medium text-[#c0c8cb]">Auditoria Sanitária</p>
                  <p className="text-sm font-bold text-[#75daa8]">RDC 502 Ativa</p>
                </div>
              </div>

              <div className="hidden md:flex absolute -bottom-6 left-12 rounded-2xl bg-[#2b373b]/95 backdrop-blur-xl px-4 py-3 shadow-xl border border-[#40484b]/70 items-center gap-3 animate-float-delayed">
                <ScanLine className="size-8 text-[#9acee1] stroke-[2] shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] font-medium text-[#c0c8cb]">Dupla Checagem</p>
                  <p className="text-sm font-bold text-[#d8e5ea]">Beira-Leito QR</p>
                </div>
              </div>

              <div className="hidden md:flex absolute -bottom-5 -right-5 rounded-2xl bg-[#2b373b]/95 backdrop-blur-xl px-4 py-3 shadow-xl border border-[#40484b]/70 items-center gap-3 animate-float-gentle">
                <HeartPulse className="size-8 text-amber-300 stroke-[2] shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] font-medium text-[#c0c8cb]">Simulador Clínico</p>
                  <p className="text-sm font-bold text-[#d8e5ea]">Demonstração Ativa</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="conformidade" className="relative w-full py-9 bg-gradient-to-b from-[#091519] via-[#051014] to-[#091519] border-y border-[#2b373b]/40 overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#051014] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#051014] to-transparent z-10" />

          <ScrollReveal direction="up" threshold={0.1}>
            <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-4 text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#c0c8cb]">
                Conformidade Regulatória Nativa
              </span>
            </div>

            <div className="flex w-full overflow-hidden select-none">
              <div className="animate-marquee-infinite flex shrink-0 items-center gap-4 pr-4">
                {[
                  ...ITENS_CONFORMIDADE,
                  ...ITENS_CONFORMIDADE,
                  ...ITENS_CONFORMIDADE,
                  ...ITENS_CONFORMIDADE,
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="shrink-0 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#152126] border border-[#2b373b]/80 shadow-md hover:border-[#75daa8]/50 hover:bg-[#1a2930] transition-all cursor-default group"
                  >
                    <item.icon className={`size-4 ${item.corIcone} stroke-[2.2] shrink-0`} />
                    <span className="text-sm font-semibold text-[#d8e5ea] whitespace-nowrap">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>

        <section className="relative w-full py-20 lg:py-28 px-6 lg:px-12 bg-gradient-to-b from-[#091519] via-[#0c181d] to-[#091519]" id="recursos">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal direction="up" threshold={0.15}>
              <div className="max-w-3xl mb-12">
                <span className="text-xs font-bold uppercase text-[#75daa8] tracking-widest">Arquitetura Clínica</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#d8e5ea] mt-2">
                  Tudo o que sua ILPI precisa em uma única plataforma
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100} threshold={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="group md:col-span-7 rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg hover:border-[#75daa8]/40 transition-colors flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                    <div className="space-y-2.5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#75daa8]/15 text-[#75daa8] text-xs font-semibold">
                        Segurança Máxima
                      </span>
                      <h3 className="text-xl font-bold text-[#d8e5ea]">
                        Ronda de Medicação Inteligente com Beira-Leito
                      </h3>
                      <p className="text-sm text-[#c0c8cb] leading-relaxed">
                        Aprazamento automático, leitura de pulseira via QR Code e dupla checagem em tempo real para zerar erros de dosagem e horário.
                      </p>
                    </div>
                    <ScanLine className="size-16 sm:size-20 text-[#75daa8] stroke-[1.5] group-hover:scale-105 transition-transform shrink-0" />
                  </div>
                  <div className="mt-6 rounded-xl bg-[#111d21] p-4 flex items-center justify-between border border-[#2b373b]/40">
                    <span className="text-xs font-medium text-[#d8e5ea]">
                      Dupla checagem digital por QR Code com registro horário
                    </span>
                    <div className="flex items-center gap-2">
                      <Pill className="size-4 text-[#9acee1]" />
                      <QrCode className="size-5 text-[#75daa8]" />
                    </div>
                  </div>
                </div>

                <div className="group md:col-span-5 rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg hover:border-[#9acee1]/40 transition-colors flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2.5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#9acee1]/15 text-[#9acee1] text-xs font-semibold">
                        Conformidade Legal
                      </span>
                      <h3 className="text-xl font-bold text-[#d8e5ea]">
                        Blindagem Sanitária RDC 502 & COREN
                      </h3>
                      <p className="text-sm text-[#c0c8cb] leading-relaxed">
                        POPs digitais auditáveis, controle de temperatura de geladeira e registros de enfermagem prontos para fiscalização em 1 clique.
                      </p>
                    </div>
                    <ShieldCheck className="size-16 sm:size-20 text-[#9acee1] stroke-[1.5] group-hover:scale-105 transition-transform shrink-0" />
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-[#9acee1] text-xs font-medium">
                    <FileBadge className="size-4 text-[#75daa8]" />
                    <span>Dossiê auditável pronto para Vigilância Sanitária</span>
                  </div>
                </div>

                <div className="group md:col-span-4 rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg hover:border-[#9acee1]/40 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#9acee1]/15 text-[#9acee1] text-xs font-semibold">
                        Retaguarda Médica
                      </span>
                      <Video className="size-12 sm:size-14 text-[#9acee1] stroke-[1.5] group-hover:scale-105 transition-transform shrink-0" />
                    </div>
                    <h3 className="text-xl font-bold text-[#d8e5ea] mb-2">
                      Telemedicina & Prescrição Digital
                    </h3>
                    <p className="text-sm text-[#c0c8cb] leading-relaxed mb-4">
                      Teleconsultas integradas ao prontuário com suporte à assinatura digital do médico (via certificado digital próprio A1/A3 ou nuvem) e envio à farmácia.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#75daa8]">
                    <FileSignature className="size-4 shrink-0" />
                    <span>Suporte ao Certificado Digital do Médico (A1/A3 / Nuvem)</span>
                  </div>
                </div>

                <div className="group md:col-span-8 rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg hover:border-[#75daa8]/40 transition-colors flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-4">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#75daa8]/15 text-[#75daa8] text-xs font-semibold">
                          Geriatria Avançada
                        </span>
                        <span className="text-xs font-mono text-[#9acee1]">
                          {ESCALAS_INFO[escalaAtiva].scoreExemplo}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[#d8e5ea]">
                        Escalas Geriátricas Automáticas
                      </h3>
                      <p className="text-sm text-[#c0c8cb] leading-relaxed">
                        {ESCALAS_INFO[escalaAtiva].foco}
                      </p>
                    </div>
                    <ClipboardCheck className="size-16 sm:size-20 text-amber-300 stroke-[1.5] group-hover:scale-105 transition-transform shrink-0" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(ESCALAS_INFO) as EscalaId[]).map((esc) => (
                      <button
                        key={esc}
                        type="button"
                        onClick={() => setEscalaAtiva(esc)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          escalaAtiva === esc
                            ? 'bg-[#75daa8] text-[#003823] border-[#75daa8]'
                            : 'bg-[#202c30] text-[#d8e5ea] border-[#40484b]/40 hover:border-[#75daa8]/50'
                        }`}
                      >
                        {esc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="group md:col-span-6 rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg hover:border-[#75daa8]/40 transition-colors flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#75daa8]/15 text-[#75daa8] text-xs font-semibold">
                          Sem Custo Oculto
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[#d8e5ea] mb-2">
                        Usuários e Cuidadores Ilimitados
                      </h3>
                      <p className="text-sm text-[#c0c8cb] leading-relaxed">
                        Cadastre toda a equipe de enfermagem, cuidadores, médicos, nutricionistas e fisioterapeutas sem pagar por licença adicional.
                      </p>
                    </div>
                    <HeartHandshake className="size-14 sm:size-16 text-[#75daa8] stroke-[1.5] group-hover:scale-105 transition-transform shrink-0" />
                  </div>
                </div>

                <div className="group md:col-span-6 rounded-2xl bg-[#152126] border border-[#2b373b]/60 p-7 shadow-lg hover:border-[#9acee1]/40 transition-colors flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#9acee1]/15 text-[#9acee1] text-xs font-semibold">
                          Em 1 Clique
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[#d8e5ea] mb-2">
                        Prontuário Multidisciplinar Integrado
                      </h3>
                      <p className="text-sm text-[#c0c8cb] leading-relaxed">
                        Evoluções de enfermagem, nutrição, fisioterapia e psicologia centralizadas em linha do tempo única com busca instantânea.
                      </p>
                    </div>
                    <FolderHeart className="size-14 sm:size-16 text-[#9acee1] stroke-[1.5] group-hover:scale-105 transition-transform shrink-0" />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="relative w-full py-16 lg:py-24 px-6 lg:px-12 bg-gradient-to-b from-[#091519] via-[#111d21]/80 to-[#091519] border-y border-[#2b373b]/40">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal direction="up" threshold={0.15}>
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-bold uppercase text-[#9acee1] tracking-widest">Impacto Operacional</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#d8e5ea] mt-2">
                  Sem o Senecurare vs. Com o Senecurare
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100} threshold={0.15}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="group rounded-2xl bg-[#81251a]/20 border border-[#ffb4a8]/30 p-8 shadow-lg">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <h3 className="text-lg font-bold text-[#ffb4a8]">Sem o Senecurare: Papel & Planilhas</h3>
                    <AlertTriangle className="size-10 sm:size-12 text-[#ffb4a8] stroke-[1.8] group-hover:scale-105 transition-transform shrink-0" />
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

                <div className="group rounded-2xl bg-[#008056]/20 border border-[#75daa8]/30 p-8 shadow-xl">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <h3 className="text-lg font-bold text-[#75daa8]">Com o Senecurare: 100% Digital & Auditado</h3>
                    <ShieldCheck className="size-10 sm:size-12 text-[#75daa8] stroke-[1.8] group-hover:scale-105 transition-transform shrink-0" />
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
            </ScrollReveal>
          </div>
        </section>

        <section className="relative w-full py-20 lg:py-28 px-6 lg:px-12 bg-gradient-to-b from-[#091519] via-[#111d21]/70 to-[#091519] border-t border-[#2b373b]/40" id="planos">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal direction="up" threshold={0.15}>
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold uppercase text-[#75daa8] tracking-widest">Investimento Transparente</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#d8e5ea] mt-2 mb-6">
                  Planos sob medida para sua ILPI
                </h2>

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
            </ScrollReveal>

            <ScrollReveal direction="up" delay={50} threshold={0.1}>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                {[
                  { id: 'compacto' as const, label: 'Até 20 residentes (Base)' },
                  { id: 'clinico' as const, label: 'RDC 502 & Escalas (Até 50 res.)' },
                  { id: 'avancado' as const, label: 'Telemedicina & Estoque (Até 100 res.)' },
                  { id: 'enterprise' as const, label: 'Rede / Multi-ILPI' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPlanoFoco(item.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      planoFoco === item.id
                        ? 'bg-[#75daa8]/20 text-[#75daa8] border-[#75daa8]'
                        : 'bg-[#152126] text-[#c0c8cb] border-[#2b373b]/70 hover:border-[#75daa8]/40'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                <div
                  onClick={() => setPlanoFoco('compacto')}
                  className={`cursor-pointer rounded-2xl bg-[#152126] p-6 shadow-lg flex flex-col justify-between transition-all ${
                    planoFoco === 'compacto'
                      ? 'border-2 border-[#75daa8] ring-2 ring-[#75daa8]/20'
                      : 'border border-[#2b373b]/60 hover:border-[#75daa8]/40'
                  }`}
                >
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
                    to={`/planos?plano=compacto&checkout=true&ciclo=${faturamentoAnual ? 'anual' : 'mensal'}`}
                    className="w-full inline-flex items-center justify-center py-2.5 rounded-lg bg-[#202c30] text-[#d8e5ea] font-semibold text-xs hover:bg-[#2f3b40] transition-colors border border-[#40484b]/50 gap-1.5"
                  >
                    <span>Contratar Plano Compacto</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                <div
                  onClick={() => setPlanoFoco('clinico')}
                  className={`cursor-pointer rounded-2xl bg-[#0f4c5c]/40 p-6 shadow-2xl flex flex-col justify-between relative transition-all ${
                    planoFoco === 'clinico'
                      ? 'border-2 border-[#75daa8] ring-2 ring-[#75daa8]/25'
                      : 'border border-[#75daa8]/60'
                  }`}
                >
                  <div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#75daa8] text-[#003823] text-[10px] font-extrabold uppercase tracking-wider mb-2">
                      <Sparkles className="size-3" />
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
                    to={`/planos?plano=clinico&checkout=true&ciclo=${faturamentoAnual ? 'anual' : 'mensal'}`}
                    className="w-full inline-flex items-center justify-center py-2.5 rounded-lg bg-[#75daa8] text-[#003823] font-bold text-xs shadow-[0_0_20px_rgba(117,218,168,0.3)] hover:bg-[#92f7c3] transition-all gap-1.5"
                  >
                    <span>Ir para Pagamento (PIX / Cartão)</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                <div
                  onClick={() => setPlanoFoco('avancado')}
                  className={`cursor-pointer rounded-2xl bg-[#152126] p-6 shadow-lg flex flex-col justify-between transition-all ${
                    planoFoco === 'avancado'
                      ? 'border-2 border-[#75daa8] ring-2 ring-[#75daa8]/20'
                      : 'border border-[#2b373b]/60 hover:border-[#75daa8]/40'
                  }`}
                >
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
                        Telemedicina & Prescrição Digital
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#75daa8]" />
                        Gestão de estoque farmacêutico
                      </li>
                    </ul>
                  </div>

                  <Link
                    to={`/planos?plano=avancado&checkout=true&ciclo=${faturamentoAnual ? 'anual' : 'mensal'}`}
                    className="w-full inline-flex items-center justify-center py-2.5 rounded-lg bg-[#202c30] text-[#d8e5ea] font-semibold text-xs hover:bg-[#2f3b40] transition-colors border border-[#40484b]/50 gap-1.5"
                  >
                    <span>Contratar Plano Avançado</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                <div
                  onClick={() => setPlanoFoco('enterprise')}
                  className={`cursor-pointer rounded-2xl bg-[#152126] p-6 shadow-lg flex flex-col justify-between transition-all ${
                    planoFoco === 'enterprise'
                      ? 'border-2 border-[#75daa8] ring-2 ring-[#75daa8]/20'
                      : 'border border-[#2b373b]/60 hover:border-[#75daa8]/40'
                  }`}
                >
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
                    to={`/planos?plano=enterprise&checkout=true&ciclo=${faturamentoAnual ? 'anual' : 'mensal'}`}
                    className="w-full inline-flex items-center justify-center py-2.5 rounded-lg bg-[#202c30] text-[#d8e5ea] font-semibold text-xs hover:bg-[#2f3b40] transition-colors border border-[#40484b]/50 gap-1.5"
                  >
                    <span>Contratar Enterprise</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="relative w-full py-20 lg:py-24 px-6 lg:px-12 bg-gradient-to-b from-[#091519] via-[#0c181d] to-[#091519]" id="faq">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal direction="up" threshold={0.15}>
              <div className="text-center mb-12">
                <span className="text-xs font-bold uppercase text-[#9acee1] tracking-widest">Dúvidas Frequentes</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#d8e5ea] mt-2">
                  Perguntas sobre implantação e conformidade
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100} threshold={0.15}>
              <div className="space-y-3">
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
                      Sim! O Senecurare foi construído especificamente para ILPIs com base nas exigências da ANVISA (RDC 502/2021), resoluções do COFEN/COREN e no Estatuto da Pessoa Idosa. Todos os módulos de prontuário, aprazamento, plano de atenção integral à saúde e POPs foram desenhados para atender fiscalizações sanitárias.
                    </div>
                  )}
                </div>

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
                      O acesso é 100% em nuvem e liberado imediatamente após o cadastro. Você pode começar a cadastrar residentes, equipe multidisciplinar e prescrições no mesmo dia, sem necessidade de servidores locais ou instalações complexas.
                    </div>
                  )}
                </div>

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
            </ScrollReveal>
          </div>
        </section>

        <section className="relative w-full py-16 lg:py-24 px-6 lg:px-12 bg-gradient-to-b from-[#091519] to-[#051014]">
          <ScrollReveal direction="up" threshold={0.15}>
            <div className="relative max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-[#0f4c5c] via-[#202c30] to-[#008056]/40 p-10 lg:p-16 text-center shadow-2xl border border-[#75daa8]/30 overflow-hidden">
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#d8e5ea] mb-4">
                  Pronto para modernizar a gestão clínica da sua ILPI?
                </h2>
                <p className="text-base sm:text-lg text-[#c0c8cb] mb-8 leading-relaxed">
                  Eleve o padrão assistencial da sua instituição com prontuário digital unificado e governança em tempo real.
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
          </ScrollReveal>
        </section>
      </main>

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
                <li><span className="text-[#75daa8]">Suporte Técnico Especializado</span></li>
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
