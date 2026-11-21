import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { canNav } from '../lib/permissions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Avatar } from './Ui'
import {
  Activity,
  BarChart3,
  CalendarCheck2,
  GraduationCap,
  Home,
  PackageCheck,
  Pill,
  Search,
  User,
  UserCheck,
  Users,
  Video,
} from 'lucide-react'
import type { NavView } from '../types/ilpi'

interface CommandPaletteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PAGINAS: { view: NavView | 'perfil'; label: string; path: string; icon: any; desc: string }[] = [
  { view: 'plantao', label: 'Painel de Plantão', path: '/plantao', icon: Activity, desc: 'Ronda de medicação e cuidados' },
  { view: 'residentes', label: 'Residentes & Prontuários', path: '/residentes', icon: Users, desc: 'Fichas clínicas e acolhidos' },
  { view: 'estoque', label: 'Controle de Estoque', path: '/estoque', icon: PackageCheck, desc: 'Medicamentos, farmácia e materiais' },
  { view: 'rotinas', label: 'Rotinas & POPs', path: '/rotinas', icon: CalendarCheck2, desc: 'Temperaturas e procedimentos operacionais' },
  { view: 'teleconsulta', label: 'Teleconsulta Virtual', path: '/teleconsulta', icon: Video, desc: 'Consultório online e especialistas' },
  { view: 'treinamentos', label: 'Educação Permanente', path: '/treinamentos', icon: GraduationCap, desc: 'Capacitações RDC 502' },
  { view: 'equipe', label: 'Quadro de Equipe', path: '/equipe', icon: UserCheck, desc: 'Escalas e profissionais' },
  { view: 'gestao', label: 'Gestão & Conformidade', path: '/gestao', icon: BarChart3, desc: 'Indicadores e alvarás' },
  { view: 'perfil', label: 'Meu Perfil', path: '/perfil', icon: User, desc: 'Dados do profissional e senha' },
]

export function CommandPaletteModal({ open, onOpenChange }: CommandPaletteModalProps) {
  const { profissional } = useAuth()
  const { residentes } = useIlpiData()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  // Páginas que o usuário logado tem permissão de acessar
  const paginasPermitidas = useMemo(() => {
    if (!profissional) return []
    return PAGINAS.filter((p) => {
      if (p.view === 'perfil') return true
      return canNav(profissional.cat, p.view)
    })
  }, [profissional])

  // Filtragem de páginas
  const paginasFiltradas = useMemo(() => {
    if (!query.trim()) return paginasPermitidas
    const q = query.toLowerCase()
    return paginasPermitidas.filter(
      (p) => p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    )
  }, [paginasPermitidas, query])

  // Filtragem de residentes por nome ou quarto
  const residentesFiltrados = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return residentes
      .filter((r) => r.status !== 'obito')
      .filter(
        (r) =>
          r.nome.toLowerCase().includes(q) ||
          String(r.quarto).toLowerCase().includes(q)
      )
      .slice(0, 5)
  }, [residentes, query])

  // Filtragem de medicamentos prescritos
  const medicamentosFiltrados = useMemo(() => {
    if (!query.trim() || query.length < 2) return []
    const q = query.toLowerCase()
    const encontrados: { resId: string; resNome: string; quarto: string; med: string; dose: string }[] = []

    for (const r of residentes) {
      if (r.status === 'obito') continue
      for (const p of r.presc) {
        if (p.med.toLowerCase().includes(q)) {
          encontrados.push({
            resId: r.id,
            resNome: r.nome,
            quarto: String(r.quarto),
            med: p.med,
            dose: p.dose,
          })
          if (encontrados.length >= 5) break
        }
      }
      if (encontrados.length >= 5) break
    }
    return encontrados
  }, [residentes, query])

  function handleSelect(url: string) {
    onOpenChange(false)
    navigate(url)
  }

  const temResultados =
    paginasFiltradas.length > 0 ||
    residentesFiltrados.length > 0 ||
    medicamentosFiltrados.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="sr-only">
          <DialogTitle>Busca Rápida Global</DialogTitle>
        </DialogHeader>

        {/* Input de Busca com Foco Imediato */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/60 bg-background/50">
          <Search className="size-4.5 text-muted-foreground mr-3 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por morador, quarto, remédio ou módulo (ex: Quarto 102, Dipirona, Plantão)..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted border border-border/60 rounded">
            ESC
          </kbd>
        </div>

        {/* Lista de Resultados */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {/* Seção 1: Moradores Encontrados */}
          {residentesFiltrados.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Residentes & Acolhidos
              </div>
              {residentesFiltrados.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelect(`/residentes/${r.id}`)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar r={r} size="sm" />
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block truncate">
                        {r.nome}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Home className="size-3" /> Quarto {r.quarto}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Abrir Prontuário →
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Seção 2: Medicamentos e Prescrições */}
          {medicamentosFiltrados.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Prescrições & Medicamentos
              </div>
              {medicamentosFiltrados.map((m, idx) => (
                <button
                  key={`${m.resId}-${m.med}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(`/residentes/${m.resId}/presc`)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Pill className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block truncate">
                        {m.med} ({m.dose})
                      </span>
                      <span className="text-xs text-muted-foreground truncate block">
                        Prescrito para <strong>{m.resNome}</strong> (Quarto {m.quarto})
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver Prescrição →
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Seção 3: Páginas e Módulos */}
          {paginasFiltradas.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Módulos do Sistema
              </div>
              {paginasFiltradas.map((p) => {
                const Icon = p.icon
                return (
                  <button
                    key={p.path}
                    type="button"
                    onClick={() => handleSelect(p.path)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-muted text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center shrink-0 transition-colors">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
                          {p.label}
                        </span>
                        <span className="text-xs text-muted-foreground truncate block">
                          {p.desc}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                      Navegar ↵
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Estado Vazio de Busca */}
          {!temResultados && (
            <div className="py-12 text-center text-muted-foreground space-y-1">
              <p className="text-sm font-semibold text-foreground">Nenhum resultado encontrado</p>
              <p className="text-xs">Não encontramos nenhum morador, remédio ou módulo para "{query}".</p>
            </div>
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="px-4 py-2 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Use as setas ou clique para navegar</span>
          <span className="hidden sm:inline">Pressione <kbd className="font-mono bg-muted px-1 rounded">ESC</kbd> para fechar</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
