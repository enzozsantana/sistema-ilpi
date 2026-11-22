import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Lock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import type { FeatureKey, PlanoId } from '../lib/plans'
import {
  isFeatureDisponivel,
  obterPlanoMinimoFeature,
  obterPlanoAtivo,
  definirPlanoAtivo,
  isAssinaturaValida,
  processarCobrancaRecorrente,
  RECURSO_NOMES,
  PLANOS,
} from '../lib/plans'

interface PlanGateProps {
  feature: FeatureKey
  children: React.ReactNode
  fallback?: React.ReactNode
  titulo?: string
  descricao?: string
  compacto?: boolean
}

export const PlanGate: React.FC<PlanGateProps> = ({
  feature,
  children,
  fallback,
  titulo,
  descricao,
  compacto = false,
}) => {
  const [planoAtual, setPlanoAtual] = useState<PlanoId>(() => obterPlanoAtivo())
  const [assinaturaValida, setAssinaturaValida] = useState<boolean>(() => isAssinaturaValida())

  useEffect(() => {
    // Processa débitos recorrentes pendentes caso a data tenha chegado
    processarCobrancaRecorrente()

    const handlePlanoChange = () => {
      setPlanoAtual(obterPlanoAtivo())
      setAssinaturaValida(isAssinaturaValida())
    }
    window.addEventListener('senecurare_plano_alterado', handlePlanoChange)
    window.addEventListener('senecurare_assinatura_alterada', handlePlanoChange)
    window.addEventListener('storage', handlePlanoChange)
    return () => {
      window.removeEventListener('senecurare_plano_alterado', handlePlanoChange)
      window.removeEventListener('senecurare_assinatura_alterada', handlePlanoChange)
      window.removeEventListener('storage', handlePlanoChange)
    }
  }, [])

  const liberado = assinaturaValida && isFeatureDisponivel(feature, planoAtual)

  if (liberado) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const planoMinimo = obterPlanoMinimoFeature(feature)
  const planoAtualConfig = PLANOS[planoAtual]
  const nomeRecurso = titulo || RECURSO_NOMES[feature] || 'Recurso Avançado'

  const handleSimularUpgrade = () => {
    definirPlanoAtivo(planoMinimo.id)
    setPlanoAtual(planoMinimo.id)
  }

  // Versão compacta (para abas ou cartões menores)
  if (compacto) {
    return (
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 text-slate-800 dark:text-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{nomeRecurso}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                A partir do {planoMinimo.nome}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Seu plano atual é o <strong>{planoAtualConfig.nome}</strong>. Faça upgrade para desbloquear.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleSimularUpgrade}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Alterna temporariamente seu plano neste navegador para testes"
          >
            Testar Agora
          </button>
          <Link
            to={`/planos?highlight=${planoMinimo.id}&feature=${feature}`}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
          >
            <span>Ver Planos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  // Versão completa (bloqueio de página inteira ou seção principal)
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/20 p-8 sm:p-12 shadow-xl my-6">
      {/* Glow de fundo */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl mx-auto text-center">
        <div className="inline-flex p-4 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mb-6 ring-8 ring-amber-500/10 animate-pulse">
          <Lock className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Disponível a partir do {planoMinimo.nome}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {nomeRecurso}
        </h2>

        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {descricao ||
            `Este módulo foi projetado para elevar o nível de conformidade sanitária e eficiência da sua ILPI. Para liberar acesso aos recursos completos, solicite o upgrade do seu plano corporativo.`}
        </p>

        {/* Comparativo do Plano Atual vs Plano Necessário */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Seu Plano Atual
            </span>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center justify-between">
              <span>{planoAtualConfig.nome}</span>
              <span className="text-xs text-slate-500 font-normal">
                {planoAtualConfig.porte}
              </span>
            </div>
            <p className="text-xs text-rose-500 dark:text-rose-400 mt-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Sem acesso a {nomeRecurso}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 ring-1 ring-emerald-500/20">
            <span className="text-xs uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              Plano Recomendado
            </span>
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-1 flex items-center justify-between">
              <span>{planoMinimo.nome}</span>
              <span className="text-xs text-emerald-600/80 font-normal">
                {planoMinimo.porte}
              </span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Acesso liberado imediatamente</span>
            </p>
          </div>
        </div>

        {/* Recursos incluídos no upgrade */}
        <div className="mt-6 p-4 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Vantagens do {planoMinimo.nome}:
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
            {planoMinimo.recursos.slice(0, 4).map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ações */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={`/planos?highlight=${planoMinimo.id}&feature=${feature}`}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <span>Fazer Upgrade para {planoMinimo.nome}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={handleSimularUpgrade}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
            title="Permite aos gestores e avaliadores testar o módulo imediatamente no ambiente local"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Simular Liberação Instantânea (Modo Teste)</span>
          </button>
        </div>

        <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
          Sem multas contratuais · Usuários profissionais ilimitados · Ativação em tempo real
        </p>
      </div>
    </div>
  )
}
