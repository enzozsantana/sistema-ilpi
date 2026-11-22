import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Check,
  X,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  QrCode,
  CreditCard,
  Crown,
  CheckCircle2,
  Sliders,
  Filter,
  Zap,
  Copy,
  ClipboardList,
  GraduationCap,
  Building2,
  Users,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'
import { gerarQrCodeDataUrl } from '../lib/qrcodeUtils'
import {
  gerarPixCopiaECola,
  obterChavePixConfigurada,
  formatarChavePixParaExibicao,
} from '../lib/mercadopagoService'
import {
  PLANOS,
  obterPlanoAtivo,
  definirPlanoAtivo,
  isPlanoVitalicio,
} from '../lib/plans'
import type { PlanoId, PlanoConfig } from '../lib/plans'

interface ModuloConfigurador {
  id: string
  titulo: string
  descricao: string
  planoMinimo: PlanoId
  icone: React.ComponentType<{ className?: string }>
  corIcone: string
  tag: string
}

const MODULOS_CONFIGURADOR: ModuloConfigurador[] = [
  {
    id: 'prontuario',
    titulo: 'Prontuário & Medicação',
    descricao: 'Evolução multiprofissional, sinais vitais e aprazamento digital.',
    planoMinimo: 'compacto',
    icone: ClipboardList,
    corIcone: 'text-cyan-500 dark:text-cyan-400',
    tag: 'Essencial',
  },
  {
    id: 'estoque_rdc',
    titulo: 'Estoque & Auditoria RDC 502',
    descricao: 'Almoxarifado individual, POPs COREN, mapa de LPP e cadeia de frio.',
    planoMinimo: 'clinico',
    icone: ShieldCheck,
    corIcone: 'text-emerald-500 dark:text-emerald-400',
    tag: 'Mais Usado',
  },
  {
    id: 'lms_telemed',
    titulo: 'LMS Art. 38 & Telemedicina',
    descricao: 'Treinamentos obrigatórios, escalas 12×36 e consultório virtual.',
    planoMinimo: 'avancado',
    icone: GraduationCap,
    corIcone: 'text-amber-500 dark:text-amber-400',
    tag: 'Alta Performance',
  },
  {
    id: 'multi_unidades',
    titulo: 'Multi-unidades Corporativo',
    descricao: 'Gestão centralizada de múltiplas casas e residentes ilimitados.',
    planoMinimo: 'enterprise',
    icone: Building2,
    corIcone: 'text-teal-500 dark:text-teal-400',
    tag: 'Rede / Grupo',
  },
]

const ORDEM_PLANOS: PlanoId[] = ['compacto', 'clinico', 'avancado', 'enterprise']

interface LinhaComparativo {
  recurso: string
  categoria: 'core' | 'rdc' | 'avancado'
  valores: Record<PlanoId, boolean | string>
}

const LINHAS_COMPARATIVO: LinhaComparativo[] = [
  {
    recurso: 'Limite Máximo de Residentes',
    categoria: 'core',
    valores: {
      compacto: 'Até 15 res.',
      clinico: 'Até 35 res.',
      avancado: 'Até 60 res.',
      enterprise: 'Ilimitado',
    },
  },
  {
    recurso: 'Usuários Profissionais e Cuidadores',
    categoria: 'core',
    valores: {
      compacto: 'Ilimitados (R$ 0,00)',
      clinico: 'Ilimitados (R$ 0,00)',
      avancado: 'Ilimitados (R$ 0,00)',
      enterprise: 'Ilimitados (R$ 0,00)',
    },
  },
  {
    recurso: 'Prontuário Multiprofissional & Sinais Vitais',
    categoria: 'core',
    valores: { compacto: true, clinico: true, avancado: true, enterprise: true },
  },
  {
    recurso: 'Checagem e Aprazamento de Medicações',
    categoria: 'core',
    valores: { compacto: true, clinico: true, avancado: true, enterprise: true },
  },
  {
    recurso: 'Estoque Individual & Almoxarifado',
    categoria: 'rdc',
    valores: { compacto: false, clinico: true, avancado: true, enterprise: true },
  },
  {
    recurso: 'POPs e Auditoria Sanitária COREN / RDC 502',
    categoria: 'rdc',
    valores: { compacto: false, clinico: true, avancado: true, enterprise: true },
  },
  {
    recurso: 'Mapa Anatômico de Lesões por Pressão (LPP)',
    categoria: 'rdc',
    valores: { compacto: false, clinico: true, avancado: true, enterprise: true },
  },
  {
    recurso: 'Termômetro & Cadeia de Frio Termolábeis',
    categoria: 'rdc',
    valores: { compacto: false, clinico: true, avancado: true, enterprise: true },
  },
  {
    recurso: 'LMS de Treinamentos (Art. 38 RDC 502)',
    categoria: 'avancado',
    valores: { compacto: false, clinico: false, avancado: true, enterprise: true },
  },
  {
    recurso: 'Consultório Virtual de Telemedicina',
    categoria: 'avancado',
    valores: { compacto: false, clinico: false, avancado: true, enterprise: true },
  },
  {
    recurso: 'Múltiplos Turnos e Escalas 12×36',
    categoria: 'avancado',
    valores: { compacto: false, clinico: false, avancado: true, enterprise: true },
  },
  {
    recurso: 'Multi-unidades / Visão Corporativa',
    categoria: 'avancado',
    valores: { compacto: false, clinico: false, avancado: false, enterprise: true },
  },
]

export const Planos: React.FC = () => {
  const [searchParams] = useSearchParams()
  const highlightParam = searchParams.get('highlight') as PlanoId | null

  const [anual, setAnual] = useState(false)
  const [planoAtual, setPlanoAtual] = useState<PlanoId>(() => obterPlanoAtivo())
  const [planoSelecionadoModal, setPlanoSelecionadoModal] = useState<PlanoConfig | null>(null)
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix')
  const [processando, setProcessando] = useState(false)
  const [sucessoModal, setSucessoModal] = useState(false)

  // Campos de Pagamento (Cartão)
  const [numeroCartao, setNumeroCartao] = useState('')
  const [nomeCartao, setNomeCartao] = useState('')
  const [validadeCartao, setValidadeCartao] = useState('')
  const [cvvCartao, setCvvCartao] = useState('')

  // PIX Configuração & QR Code Escaneável
  const chavePix = useMemo(() => obterChavePixConfigurada(), [])
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  // Estados do Simulador / Configurador Interativo
  const [qtdResidentes, setQtdResidentes] = useState<number>(28)
  const [modulosSelecionados, setModulosSelecionados] = useState<string[]>([
    'prontuario',
    'estoque_rdc',
  ])
  const [colunaFocada, setColunaFocada] = useState<PlanoId>('clinico')
  const [filtroTabela, setFiltroTabela] = useState<'todos' | 'rdc' | 'avancado'>('todos')

  useEffect(() => {
    const planoParam = (searchParams.get('plano') || searchParams.get('highlight')) as PlanoId | null
    const checkoutParam = searchParams.get('checkout') === 'true'
    const cicloParam = searchParams.get('ciclo')

    if (cicloParam === 'mensal') {
      setAnual(false)
    } else if (cicloParam === 'anual') {
      setAnual(true)
    }

    if (planoParam && PLANOS[planoParam]) {
      setColunaFocada(planoParam)
      if (checkoutParam || searchParams.get('plano')) {
        setPlanoSelecionadoModal(PLANOS[planoParam])
        setSucessoModal(false)
        setProcessando(false)
      }
    }
  }, [searchParams])

  useEffect(() => {
    const handlePlanoChange = () => {
      setPlanoAtual(obterPlanoAtivo())
    }
    window.addEventListener('senecurare_plano_alterado', handlePlanoChange)
    window.addEventListener('storage', handlePlanoChange)
    return () => {
      window.removeEventListener('senecurare_plano_alterado', handlePlanoChange)
      window.removeEventListener('storage', handlePlanoChange)
    }
  }, [])

  const planoRecomendadoId: PlanoId = useMemo(() => {
    let indiceMinimo = 0

    if (qtdResidentes > 60) indiceMinimo = Math.max(indiceMinimo, 3)
    else if (qtdResidentes > 35) indiceMinimo = Math.max(indiceMinimo, 2)
    else if (qtdResidentes > 15) indiceMinimo = Math.max(indiceMinimo, 1)

    modulosSelecionados.forEach((modId) => {
      const mod = MODULOS_CONFIGURADOR.find((m) => m.id === modId)
      if (mod) {
        const idx = ORDEM_PLANOS.indexOf(mod.planoMinimo)
        indiceMinimo = Math.max(indiceMinimo, idx)
      }
    })

    return ORDEM_PLANOS[indiceMinimo]
  }, [qtdResidentes, modulosSelecionados])

  const planoRecomendado = PLANOS[planoRecomendadoId]
  const precoRecomendado = anual
    ? planoRecomendado.precoAnualMensal
    : planoRecomendado.precoMensal
  const custoPorResidenteDia =
    qtdResidentes > 0 ? precoRecomendado / qtdResidentes / 30 : 0

  const toggleModulo = (id: string) => {
    if (id === 'prontuario') return
    setModulosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleAbrirCheckout = (plano: PlanoConfig) => {
    setPlanoSelecionadoModal(plano)
    setSucessoModal(false)
    setProcessando(false)
  }

  const valorTotalCheckout = useMemo(() => {
    if (!planoSelecionadoModal) return 0
    return anual
      ? planoSelecionadoModal.precoAnualMensal
      : planoSelecionadoModal.precoMensal
  }, [planoSelecionadoModal, anual])

  const pixCopiaECola = useMemo(() => {
    if (!planoSelecionadoModal) return ''
    return gerarPixCopiaECola(
      `plano-${planoSelecionadoModal.id}`,
      valorTotalCheckout,
      'CODAGEM',
      chavePix
    )
  }, [planoSelecionadoModal, valorTotalCheckout, chavePix])

  useEffect(() => {
    if (!pixCopiaECola) {
      setQrCodeDataUrl('')
      return
    }
    let ativo = true
    gerarQrCodeDataUrl(pixCopiaECola, 280).then((url) => {
      if (ativo) setQrCodeDataUrl(url)
    })
    return () => {
      ativo = false
    }
  }, [pixCopiaECola])

  const handleCopiarPix = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pixCopiaECola)
      toast.success('Código PIX Copia e Cola copiado com sucesso!')
    }
  }

  const handleConfirmarAssinatura = () => {
    if (!planoSelecionadoModal) return
    setProcessando(true)
    setTimeout(() => {
      definirPlanoAtivo(planoSelecionadoModal.id)
      setPlanoAtual(planoSelecionadoModal.id)
      setProcessando(false)
      setSucessoModal(true)
    }, 900)
  }

  const planosLista: PlanoConfig[] = [
    PLANOS.compacto,
    PLANOS.clinico,
    PLANOS.avancado,
    PLANOS.enterprise,
  ]

  const linhasFiltradas = useMemo(() => {
    if (filtroTabela === 'todos') return LINHAS_COMPARATIVO
    return LINHAS_COMPARATIVO.filter((l) => l.categoria === filtroTabela)
  }, [filtroTabela])

  return (
    <div className="space-y-14 pb-20">
      {/* Header com Proposta de Valor */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Conformidade Sanitária RDC 502 & Governança COREN</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
          Monte e Compare o Plano Ideal para sua ILPI
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
          Simule o porte da sua instituição, selecione os módulos assistenciais e veja o plano exato em tempo real.
          <br className="hidden sm:inline" />
          <strong className="text-emerald-700 dark:text-emerald-400">
            {' '}
            Usuários profissionais 100% ilimitados e sem cobrança por login em todos os planos.
          </strong>
        </p>

        {/* Status do Plano Atual do Estabelecimento */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2.5 p-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Plano ativo:</span>
          <span className="font-bold uppercase text-emerald-700 dark:text-emerald-400">
            {isPlanoVitalicio()
              ? 'Plano Enterprise Vitalício'
              : PLANOS[planoAtual]?.nome || planoAtual}
          </span>
          <span className="text-slate-400">
            ({isPlanoVitalicio() ? 'Acesso Total Vitalício' : PLANOS[planoAtual]?.porte})
          </span>
        </div>

        {/* Banner de Licença Vitalícia Homologada */}
        {isPlanoVitalicio() && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base">
                    Licença Vitalícia Homologada Ativa (Plano Enterprise)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Acesso Perpétuo
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Esta conta possui liberação permanente e vitalícia de 100% das funcionalidades (Prontuário, Estoque, POPs Sanitários, Treinamentos Art. 38 e Telemedicina) com residentes ilimitados.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 whitespace-nowrap">
              ✓ Vitalício Ativo
            </span>
          </div>
        )}
      </div>

      {/* SIMULADOR INTERATIVO PASSO A PASSO */}
      <section className="max-w-7xl mx-auto rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Barra Superior de Etapas */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Configurador Interativo SeneCurare
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ajuste o número de residentes e clique nos módulos desejados
              </p>
            </div>
          </div>

          {/* Stepper Visual */}
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">
                1
              </span>
              Porte ({qtdResidentes} res.)
            </span>
            <span className="text-slate-300 dark:text-slate-700">→</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">
                2
              </span>
              Módulos ({modulosSelecionados.length})
            </span>
            <span className="text-slate-300 dark:text-slate-700">→</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center">
                3
              </span>
              {planoRecomendado.nome}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Coluna Esquerda: Etapas 1 e 2 */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-8 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            {/* Etapa 1: Capacidade de Residentes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-900 dark:bg-slate-800 text-white text-[11px] flex items-center justify-center">
                    1
                  </span>
                  Capacidade Atual de Residentes
                </label>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-black text-sm border border-emerald-500/30">
                  {qtdResidentes >= 75 ? '75+ residentes' : `${qtdResidentes} residentes`}
                </span>
              </div>

              <input
                type="range"
                min={5}
                max={75}
                step={1}
                value={qtdResidentes}
                onChange={(e) => setQtdResidentes(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              {/* Atalhos Rápidos de Porte */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Até 15 res.', valor: 12 },
                  { label: '16 a 35 res.', valor: 28 },
                  { label: '36 a 60 res.', valor: 48 },
                  { label: '60+ / Rede', valor: 75 },
                ].map((preset) => {
                  const ativo =
                    (preset.valor === 12 && qtdResidentes <= 15) ||
                    (preset.valor === 28 && qtdResidentes > 15 && qtdResidentes <= 35) ||
                    (preset.valor === 48 && qtdResidentes > 35 && qtdResidentes <= 60) ||
                    (preset.valor === 75 && qtdResidentes > 60)

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setQtdResidentes(preset.valor)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        ativo
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Etapa 2: Seleção Tátil de Módulos com Ícones 3D */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-900 dark:bg-slate-800 text-white text-[11px] flex items-center justify-center">
                    2
                  </span>
                  Selecione os Módulos da Operação
                </span>
                <span className="text-[11px] text-slate-400">Clique para ativar/desativar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MODULOS_CONFIGURADOR.map((mod) => {
                  const selecionado = modulosSelecionados.includes(mod.id)
                  const travado = mod.id === 'prontuario'

                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModulo(mod.id)}
                      className={`group text-left p-4 rounded-2xl border transition-all duration-200 relative ${
                        selecionado
                          ? 'bg-emerald-500/10 border-emerald-500 shadow-sm'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <mod.icone
                          className={`size-11 ${mod.corIcone} stroke-[1.8] group-hover:scale-105 transition-transform shrink-0`}
                        />
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            selecionado
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {travado ? 'Incluso Base' : selecionado ? '✓ Ativo' : mod.tag}
                        </span>
                      </div>

                      <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {mod.titulo}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {mod.descricao}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Etapa 3 — Resumo Ao Vivo ("Comanda da ILPI") */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Zap className="w-3.5 h-3.5" />
                  Recomendação em Tempo Real
                </span>

                <button
                  type="button"
                  onClick={() => setAnual(!anual)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-white/15 border border-white/10 text-amber-300 transition-colors"
                >
                  {anual ? 'Compromisso Anual (-15%)' : 'Cobrança Mensal'}
                </button>
              </div>

              <div>
                <p className="text-xs text-slate-400">Plano ideal para sua configuração:</p>
                <div className="flex items-baseline justify-between gap-2 mt-1">
                  <h3 className="text-2xl sm:text-3xl font-black font-heading text-white">
                    {planoRecomendado.nome}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 text-emerald-300">
                    {planoRecomendado.porte}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5">{planoRecomendado.subtitulo}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400">R$ </span>
                    <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
                      {precoRecomendado.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-xs text-slate-400">/mês</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-300 block font-mono">
                      R$ {custoPorResidenteDia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400">por residente / dia</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-white/10">
                  ✓ Cuidadores, enfermeiros e equipe multidisciplinar ilimitados (R$ 0,00/login)
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Principais entregas deste plano:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {planoRecomendado.recursos.slice(0, 4).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleAbrirCheckout(planoRecomendado)}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <span>
                  {planoAtual === planoRecomendado.id
                    ? 'Plano Já Ativo na Clínica'
                    : `Contratar ${planoRecomendado.nome} Agora`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-center text-slate-400">
                Ativação imediata via PIX ou Cartão · Sem taxa de implantação
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Toggle Mensal / Anual Global */}
      <div className="flex flex-col items-center justify-center gap-3 pt-2">
        <div className="flex items-center justify-center gap-3 p-2 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span
            className={`text-sm font-medium ${
              !anual ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500'
            }`}
          >
            Faturamento Mensal
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={anual}
            onClick={() => setAnual(!anual)}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
              anual ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                anual ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>

          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                anual ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500'
              }`}
            >
              Faturamento Anual
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              -15% OFF
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Cards de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {planosLista.map((plano) => {
          const isAtual = planoAtual === plano.id
          const isHighlight = highlightParam === plano.id
          const isRecomendadoSimulador = planoRecomendadoId === plano.id
          const preco = anual ? plano.precoAnualMensal : plano.precoMensal

          return (
            <div
              key={plano.id}
              onMouseEnter={() => setColunaFocada(plano.id)}
              className={`relative flex flex-col rounded-3xl p-6 transition-all duration-200 ${
                plano.destaque || isRecomendadoSimulador
                  ? 'bg-gradient-to-b from-emerald-950/15 to-slate-900/20 dark:from-emerald-950/40 dark:to-slate-950/90 border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 -translate-y-1'
                  : 'bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 shadow-sm'
              } ${isHighlight ? 'ring-4 ring-amber-500/50' : ''}`}
            >
              {(plano.destaque || isRecomendadoSimulador) && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md border ${
                      isRecomendadoSimulador
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-emerald-500 text-white border-emerald-400/30'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isRecomendadoSimulador
                      ? 'Ideal para sua Simulação'
                      : 'Mais Escolhido pelas ILPIs'}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                    {plano.nome}
                  </h3>
                  {isAtual && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Plano Atual
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                  {plano.subtitulo}
                </p>
                <div className="mt-2 inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {plano.porte}
                </div>
              </div>

              <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-slate-500">R$</span>
                  <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                    {preco.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-xs text-slate-500">/mês</span>
                </div>
                {anual ? (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    Cobrança mensal no compromisso anual (15% OFF)
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cobrança mensal recorrente · Cancele quando quiser
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-3 mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  O que está incluso:
                </span>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  {plano.recursos.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>

                {plano.naoInclui && plano.naoInclui.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Não inclui:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-400 dark:text-slate-500">
                      {plano.naoInclui.map((nao, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <X className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-through decoration-slate-400/50">{nao}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleAbrirCheckout(plano)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isAtual
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default border border-slate-200 dark:border-slate-700'
                    : plano.destaque || isRecomendadoSimulador
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/25 hover:scale-[1.02]'
                    : 'bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900'
                }`}
              >
                <span>{isAtual ? 'Plano Ativo na Clínica' : plano.botaoTexto}</span>
                {!isAtual && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          )
        })}
      </div>

      {/* Tabela Comparativa Interativa */}
      <div className="max-w-6xl mx-auto space-y-6 pt-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
              Comparativo Técnico & Sanitário Completo
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Filtre por área regulatória ou clique em um plano para destacar sua cobertura.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filtrar:
            </span>
            {[
              { id: 'todos', label: 'Todos (12)' },
              { id: 'rdc', label: 'Auditoria RDC 502 & LPP' },
              { id: 'avancado', label: 'LMS, Telemedicina & Escalas' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroTabela(tab.id as 'todos' | 'rdc' | 'avancado')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  filtroTabela === tab.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">Recurso / Módulo</th>
                {ORDEM_PLANOS.map((pid) => {
                  const p = PLANOS[pid]
                  const focado = colunaFocada === pid
                  return (
                    <th
                      key={pid}
                      onClick={() => setColunaFocada(pid)}
                      className={`py-4 px-4 text-center cursor-pointer transition-colors ${
                        focado
                          ? 'bg-emerald-500/15 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-extrabold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p.nome}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {linhasFiltradas.map((linha, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                  <td className="py-3.5 px-6 font-medium">{linha.recurso}</td>
                  {ORDEM_PLANOS.map((pid) => {
                    const val = linha.valores[pid]
                    const focado = colunaFocada === pid

                    return (
                      <td
                        key={pid}
                        onClick={() => setColunaFocada(pid)}
                        className={`py-3.5 px-4 text-center cursor-pointer transition-colors ${
                          focado ? 'bg-emerald-500/5 dark:bg-emerald-950/25 font-semibold' : ''
                        }`}
                      >
                        {typeof val === 'boolean' ? (
                          val ? (
                            <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                          )
                        ) : (
                          <span
                            className={`font-mono ${
                              pid === 'clinico'
                                ? 'font-bold text-emerald-600 dark:text-emerald-400'
                                : pid === 'enterprise'
                                ? 'font-bold text-cyan-600 dark:text-cyan-400'
                                : 'font-bold text-emerald-600'
                            }`}
                          >
                            {val}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diferenciais Competitivos */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 hover:border-emerald-500/40 transition-colors">
          <Users className="size-12 text-emerald-500 dark:text-emerald-400 stroke-[1.8] group-hover:scale-105 transition-transform shrink-0" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Usuários 100% Ilimitados
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Nunca cobre cuidadores ou estagiários à parte. Quanto mais a sua equipe registra em tempo real, menor o risco de processos trabalhistas e eventos adversos.
          </p>
        </div>

        <div className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 hover:border-amber-500/40 transition-colors">
          <ShieldCheck className="size-12 text-amber-500 dark:text-amber-400 stroke-[1.8] group-hover:scale-105 transition-transform shrink-0" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Blindagem Sanitária RDC 502
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Dossiê de auditoria em 1 clique para fiscais da Vigilância e fiscais do COREN. Evite multas que podem passar de R$ 50.000,00 por não conformidades.
          </p>
        </div>

        <div className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 hover:border-cyan-500/40 transition-colors">
          <Video className="size-12 text-cyan-500 dark:text-cyan-400 stroke-[1.8] group-hover:scale-105 transition-transform shrink-0" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Telemedicina Sem Custo Fixo
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Especialistas geriátricos credenciados com valores tabelados e padronizados. Pague apenas pelas consultas solicitadas pelo Responsável Financeiro da casa.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto space-y-6 pt-4">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center font-heading">
          Perguntas Frequentes sobre os Planos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              Posso mudar de plano quando o número de residentes aumentar?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sim! O upgrade é imediato e automático. Todos os prontuários, registros e dados históricos permanecem 100% preservados.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              Existe cobrança extra por cuidador ou técnico cadastrado?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Não. O cadastro de profissionais de enfermagem, cuidadores e equipe multidisciplinar é livre e gratuito em todos os planos SeneCurare.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              Quem pode solicitar teleconsultas na clínica?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Apenas a Gestão ou Responsável Técnico/Financeiro credenciado. Cuidadores e técnicos não geram custos para a instituição.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              Há fidelidade ou multa de cancelamento?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Todos os planos são cobrados mensalmente. No plano mensal padrão você tem total flexibilidade e pode cancelar quando quiser, sem multas ou taxas de adesão.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Checkout / Assinatura com Stepper */}
      {planoSelecionadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <button
              type="button"
              onClick={() => setPlanoSelecionadoModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                1. Plano
              </span>
              <span className="text-slate-300 dark:text-slate-700">→</span>
              <span
                className={`px-2.5 py-1 rounded-full ${
                  !sucessoModal
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                2. Pagamento
              </span>
              <span className="text-slate-300 dark:text-slate-700">→</span>
              <span
                className={`px-2.5 py-1 rounded-full ${
                  sucessoModal
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                3. Liberação
              </span>
            </div>

            {!sucessoModal ? (
              <>
                <div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    Contratação Direta
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                    {planoSelecionadoModal.nome}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {planoSelecionadoModal.subtitulo} · {planoSelecionadoModal.porte}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Plano selecionado</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {planoSelecionadoModal.nome}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Ciclo de faturamento</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Cobrança Mensal Recorrente
                    </span>
                  </div>
                  {anual && (
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span>Condição especial</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        15% de desconto no compromisso anual
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Valor da Mensalidade
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        R${' '}
                        {valorTotalCheckout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        por mês · renovação automática a cada 30 dias
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Forma de Pagamento (Mercado Pago Gateway)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMetodoPagamento('pix')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                        metodoPagamento === 'pix'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-emerald-500" />
                      <span>PIX Instantâneo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPagamento('cartao')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                        metodoPagamento === 'cartao'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      <span>Cartão de Crédito</span>
                    </button>
                  </div>

                  {metodoPagamento === 'pix' && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0 flex items-center justify-center">
                          {qrCodeDataUrl ? (
                            <img
                              src={qrCodeDataUrl}
                              alt="QR Code PIX Oficial Escaneável"
                              className="size-28 sm:size-32 object-contain rounded-md"
                            />
                          ) : (
                            <div className="size-28 sm:size-32 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md">
                              <span className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="text-left space-y-1.5 min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Sparkles className="size-3" />
                            PIX Padrão Bacen (Escaneável)
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Aponte a câmera do aplicativo do seu banco para o QR Code acima ou use o <strong>Pix Copia e Cola</strong>.
                          </p>

                          <div className="pt-1 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={handleCopiarPix}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition-colors"
                            >
                              <Copy className="size-3.5" />
                              <span>Copiar Código PIX</span>
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 space-y-0.5">
                            <p>
                              Beneficiário: <strong className="text-slate-700 dark:text-slate-200">CODAGEM</strong>
                            </p>
                            <p>
                              Chave Pix (CNPJ):{' '}
                              <code className="text-slate-700 dark:text-slate-300 font-mono font-bold">
                                {formatarChavePixParaExibicao(chavePix)}
                              </code>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {metodoPagamento === 'cartao' && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3 text-left">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Número do Cartão
                        </label>
                        <input
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          value={numeroCartao}
                          onChange={(e) => setNumeroCartao(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Nome Impresso no Cartão
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: RAQUEL M SILVEIRA"
                          value={nomeCartao}
                          onChange={(e) => setNomeCartao(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            Validade
                          </label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            maxLength={5}
                            value={validadeCartao}
                            onChange={(e) => setValidadeCartao(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            CVV
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            maxLength={4}
                            value={cvvCartao}
                            onChange={(e) => setCvvCartao(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Faturamento da Assinatura
                        </label>
                        <div className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                          <span>Cobrança Mensal Recorrente</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                            R$ {valorTotalCheckout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Débito automático mensal na fatura do seu cartão. Sem fidelidade e sem burocracia para cancelar.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    disabled={processando}
                    onClick={handleConfirmarAssinatura}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {processando ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processando Assinatura...</span>
                      </span>
                    ) : (
                      <>
                        <span>Confirmar & Ativar {planoSelecionadoModal.nome}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-slate-400">
                    🔒 Transação protegida por criptografia bancária SSL de 256 bits.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Plano Ativado com Sucesso!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                  Sua ILPI agora está operando no{' '}
                  <strong>{planoSelecionadoModal.nome}</strong>. Todos os recursos correspondentes já foram desbloqueados neste sistema.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setPlanoSelecionadoModal(null)}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Continuar no Sistema
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Planos
