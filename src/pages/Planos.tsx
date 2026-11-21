import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Users,
  ArrowRight,
  HelpCircle,
  QrCode,
  CreditCard,
  Crown,
  FileText,
  Video,
  CheckCircle2,
} from 'lucide-react'
import {
  PLANOS,
  obterPlanoAtivo,
  definirPlanoAtivo,
  isPlanoVitalicio,
} from '../lib/plans'
import type { PlanoId, PlanoConfig } from '../lib/plans'

export const Planos: React.FC = () => {
  const [searchParams] = useSearchParams()
  const highlightParam = searchParams.get('highlight') as PlanoId | null

  const [anual, setAnual] = useState(false)
  const [planoAtual, setPlanoAtual] = useState<PlanoId>(() => obterPlanoAtivo())
  const [planoSelecionadoModal, setPlanoSelecionadoModal] = useState<PlanoConfig | null>(null)
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix')
  const [processando, setProcessando] = useState(false)
  const [sucessoModal, setSucessoModal] = useState(false)

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

  const handleAbrirCheckout = (plano: PlanoConfig) => {
    setPlanoSelecionadoModal(plano)
    setSucessoModal(false)
    setProcessando(false)
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

  return (
    <div className="space-y-12 pb-16">
      {/* Header com Proposta de Valor */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Conformidade Sanitária RDC 502 & Governança COREN</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
          Planos Transparentes para Cada Fase da sua ILPI
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
          Checagem digital, auditoria sanitária e telemedicina especializada.
          <br className="hidden sm:inline" />
          <strong className="text-emerald-700 dark:text-emerald-400"> Usuários profissionais 100% ilimitados e sem cobrança por login em todos os planos.</strong>
        </p>

        {/* Status do Plano Atual do Estabelecimento */}
        <div className="inline-flex items-center gap-3 p-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Plano atual da sua instituição:</span>
          <span className="font-bold uppercase text-emerald-700 dark:text-emerald-400">
            {isPlanoVitalicio() ? 'Plano Enterprise Vitalício' : PLANOS[planoAtual]?.nome || planoAtual}
          </span>
          <span className="text-slate-400">({isPlanoVitalicio() ? 'Acesso Total Vitalício' : PLANOS[planoAtual]?.porte})</span>
        </div>

        {/* Banner de Licença Vitalícia Homologada */}
        {isPlanoVitalicio() && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base">
                    Licença Vitalícia Homologada Ativa (Plano Enterprise)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Acesso Perpétuo
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Esta conta de demonstração possui liberação permanente e vitalícia de 100% das funcionalidades (Prontuário, Estoque, POPs Sanitários, Treinamentos Art. 38 e Telemedicina) com residentes ilimitados.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 whitespace-nowrap">
              ✓ Vitalício Ativo
            </span>
          </div>
        )}

        {/* Toggle Mensal / Anual */}
        <div className="flex items-center justify-center gap-3 pt-3">
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
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-bounce">
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
          const preco = anual ? plano.precoAnualMensal : plano.precoMensal

          return (
            <div
              key={plano.id}
              className={`relative flex flex-col rounded-3xl p-6 transition-all duration-200 ${
                plano.destaque
                  ? 'bg-gradient-to-b from-emerald-950/20 to-slate-900/40 dark:from-emerald-950/40 dark:to-slate-950/80 border-2 border-emerald-500 shadow-xl shadow-emerald-500/10'
                  : 'bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
              } ${isHighlight ? 'ring-4 ring-amber-500/50' : ''}`}
            >
              {/* Badge Mais Vendido */}
              {plano.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md">
                    <Sparkles className="w-3.5 h-3.5" />
                    Mais Escolhido pelas ILPIs
                  </span>
                </div>
              )}

              {/* Header do Card */}
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

              {/* Preço */}
              <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-slate-500">R$</span>
                  <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                    {preco.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-slate-500">/mês</span>
                </div>
                {anual && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    Faturado anualmente (R$ {(preco * 12).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/ano)
                  </p>
                )}
                {!anual && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cobrança mensal · Cancele quando quiser
                  </p>
                )}
              </div>

              {/* Lista de Recursos Inclusos */}
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

                {/* Não inclusos (para transparência de upgrade) */}
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

              {/* Botão de Ação */}
              <button
                type="button"
                onClick={() => handleAbrirCheckout(plano)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isAtual
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default border border-slate-200 dark:border-slate-700'
                    : plano.destaque
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

      {/* Tabela Comparativa de Recursos Regulatórios */}
      <div className="max-w-6xl mx-auto space-y-6 pt-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-heading">
            Comparativo Técnico & Sanitário Completo
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compare minuciosamente os recursos de prontuário, governança e conformidade entre os planos.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">Recurso / Módulo</th>
                <th className="py-4 px-4 text-center">Compacto</th>
                <th className="py-4 px-4 text-center bg-emerald-500/5 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold">
                  Clínico & Compliance
                </th>
                <th className="py-4 px-4 text-center">Avançado</th>
                <th className="py-4 px-4 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-3.5 px-6 font-medium">Limite Máximo de Residentes</td>
                <td className="py-3.5 px-4 text-center font-mono">Até 15 res.</td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-950/20">
                  Até 35 res.
                </td>
                <td className="py-3.5 px-4 text-center font-mono">Até 60 res.</td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  Ilimitado
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Usuários Profissionais e Cuidadores</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">Ilimitados (R$ 0)</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-500/5 dark:bg-emerald-950/20">
                  Ilimitados (R$ 0)
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">Ilimitados (R$ 0)</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">Ilimitados (R$ 0)</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Prontuário Multiprofissional & Sinais Vitais</td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Checagem e Aprazamento de Medicações</td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Estoque Individual & Almoxarifado</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">POPs e Auditoria Sanitária COREN / RDC 502</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Mapa Anatômico de Lesões por Pressão (LPP)</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Termômetro & Cadeia de Frio Termolábeis</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">LMS de Treinamentos (Art. 38 RDC 502)</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600 bg-emerald-500/5 dark:bg-emerald-950/20"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Consultório Virtual de Telemedicina</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600 bg-emerald-500/5 dark:bg-emerald-950/20"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Múltiplos Turnos e Escalas 12×36</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600 bg-emerald-500/5 dark:bg-emerald-950/20"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Multi-unidades / Visão Corporativa</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600 bg-emerald-500/5 dark:bg-emerald-950/20"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Diferenciais Competitivos */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Usuários 100% Ilimitados
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Nunca cobre cuidadores ou estagiários à parte. Quanto mais a sua equipe registra em tempo real, menor o risco de processos trabalhistas e eventos adversos.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Blindagem Sanitária RDC 502
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Dossiê de auditoria em 1 clique para fiscais da Vigilância e fiscais do COREN. Evite multas que podem passar de R$ 50.000,00 por não conformidades.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 w-fit">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Telemedicina Sem Custo Fixo
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Especialistas geriátricos credenciados com valores tabelados e padronizados. Pague apenas pelas consultas solicitadas pelo Responsável Financeiro da casa.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto space-y-6 pt-6">
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
              No plano mensal não existe qualquer fidelidade. No plano anual você garante 15% de desconto fixo com pagamento em 12x.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Checkout / Assinatura */}
      {planoSelecionadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Fechar */}
            <button
              type="button"
              onClick={() => setPlanoSelecionadoModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

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

                {/* Resumo do Pedido */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Plano selecionado</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {planoSelecionadoModal.nome}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Ciclo de faturamento</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {anual ? 'Anual (-15% de desconto)' : 'Mensal recorrente'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Valor a Pagar
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        R${' '}
                        {(anual
                          ? planoSelecionadoModal.precoAnualMensal * 12
                          : planoSelecionadoModal.precoMensal
                        ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {anual ? 'anuidade em até 12x' : 'mensalidade com renovação automática'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Método de Pagamento */}
                <div className="space-y-2">
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
                </div>

                {/* Ações */}
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
                  Sua ILPI agora está operando no <strong>{planoSelecionadoModal.nome}</strong>. Todos os recursos correspondentes já foram desbloqueados neste sistema.
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
