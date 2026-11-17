import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useIlpiData } from '../contexts/IlpiDataContext'
import { can } from '../lib/permissions'
import { extrairAlertasCriticosRT } from '../lib/business/passagemAvisos'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Megaphone,
  Pill,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function NotificacoesMenu() {
  const { profissional } = useAuth()
  const data = useIlpiData()
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false)

  const hoje = useMemo(() => new Date().toISOString().split('T')[0], [])
  const isRTouEnf = profissional ? can(profissional.cat, 'gerir') : false

  // 1. Alertas críticos / graves no plantão de hoje (especialmente para a RT e supervisão)
  const alertasCriticos = useMemo(() => {
    return extrairAlertasCriticosRT({
      residentes: data.residentes,
      adm: data.adm,
      checagensCuidado: data.checagensCuidado,
      eventos: data.eventos,
      temperaturas: data.temperaturas,
      hoje,
    })
  }, [data.residentes, data.adm, data.checagensCuidado, data.eventos, data.temperaturas, hoje])

  // 2. Avisos ativos da RT (Egle) para a equipe
  const avisosAtivos = useMemo(() => {
    return data.avisosRT.filter((a) => a.ativo)
  }, [data.avisosRT])

  // 3. Avisos não lidos / sem ciência pelo profissional atual
  const avisosPendentesCiencia = useMemo(() => {
    if (!profissional) return []
    return avisosAtivos.filter((a) => !a.ciencias?.includes(profissional.id))
  }, [avisosAtivos, profissional])

  // Total de itens que acionam a badge de atenção
  const totalNotificacoes = isRTouEnf
    ? alertasCriticos.length + avisosPendentesCiencia.length
    : avisosPendentesCiencia.length + (alertasCriticos.filter(a => a.tipo === 'dose_atrasada' || a.tipo === 'cuidado_pendente').length)

  // Última passagem de plantão registrada
  const ultimaPassagem = data.passagens[0]

  async function handleConfirmarCiencia(avisoId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!profissional) return
    await data.darCiencia(avisoId, profissional.id)
  }

  return (
    <DropdownMenu open={aberto} onOpenChange={setAberto}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-muted/80 text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Notificações & Alertas"
        >
          <Bell className="size-5 text-muted-foreground hover:text-foreground transition-colors" />
          {totalNotificacoes > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75">
              {totalNotificacoes > 9 ? '9+' : totalNotificacoes}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 shadow-lg rounded-2xl border border-border/80 overflow-hidden bg-popover"
      >
        {/* Cabeçalho */}
        <div className="p-3.5 bg-muted/40 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Central de Alertas & Notificações</span>
          </div>
          {isRTouEnf && (
            <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-semibold">
              Supervisão RT
            </Badge>
          )}
        </div>

        <div className="max-h-[70vh] overflow-y-auto divide-y divide-border/40 text-xs">
          {/* Seção 1: Avisos da RT (Egle) para a equipe */}
          {avisosAtivos.length > 0 && (
            <div className="p-3 space-y-2 bg-primary/5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <Megaphone className="size-3.5 text-primary" />
                  Comunicados da RT ({avisosAtivos.length})
                </span>
                <span className="text-[10px] text-muted-foreground">Para toda a equipe</span>
              </div>

              <div className="space-y-2">
                {avisosAtivos.slice(0, 3).map((av) => {
                  const jaLeu = profissional ? av.ciencias?.includes(profissional.id) : false
                  const isUrgente = av.prioridade === 'urgente'

                  return (
                    <div
                      key={av.id}
                      className={cn(
                        'p-2.5 rounded-xl border transition-all text-xs space-y-1',
                        isUrgente
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : 'bg-card border-border/70 shadow-2xs'
                      )}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-bold text-foreground leading-tight">{av.titulo}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] px-1.5 py-0 h-4 uppercase shrink-0 font-bold',
                            isUrgente
                              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                              : 'bg-primary/10 text-primary border-primary/25'
                          )}
                        >
                          {av.prioridade}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {av.mensagem}
                      </p>

                      <div className="flex items-center justify-between pt-1.5 text-[10px] text-muted-foreground border-t border-border/30">
                        <span>Por <strong>{av.autor.nome}</strong> · {av.hora}</span>

                        {jaLeu ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="size-3" /> Ciente
                          </span>
                        ) : (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={(e) => void handleConfirmarCiencia(av.id, e)}
                            className="h-5 px-2 text-[10px] rounded-md font-semibold text-primary hover:bg-primary hover:text-white"
                          >
                            Estou ciente
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Seção 2: Alertas Críticos de Não Feito / Intercorrências graves para a RT */}
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="size-3.5 text-rose-600" />
                Alertas Críticos do Plantão ({alertasCriticos.length})
              </span>
              <span className="text-[10px] text-muted-foreground">Tempo real</span>
            </div>

            {alertasCriticos.length === 0 ? (
              <div className="py-3 text-center text-muted-foreground flex flex-col items-center gap-1">
                <CheckCircle2 className="size-5 text-emerald-500" />
                <span className="text-xs font-medium">Nenhum evento crítico pendente no momento!</span>
                <span className="text-[10px]">Medicações, cuidados e rotinas estão em conformidade.</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {alertasCriticos.slice(0, 5).map((crit) => (
                  <button
                    key={crit.id}
                    type="button"
                    onClick={() => {
                      setAberto(false)
                      if (crit.link) navigate(crit.link)
                    }}
                    className={cn(
                      'w-full text-left p-2.5 rounded-xl border transition-colors flex items-start gap-2.5 cursor-pointer',
                      crit.gravidade === 'critica'
                        ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15'
                        : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
                    )}
                  >
                    <div
                      className={cn(
                        'size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5',
                        crit.gravidade === 'critica'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-500/20 text-amber-700'
                      )}
                    >
                      {crit.tipo === 'dose_atrasada' ? (
                        <Pill className="size-3.5" />
                      ) : (
                        <AlertTriangle className="size-3.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-foreground text-xs truncate">
                          {crit.titulo}
                        </span>
                        {crit.horario && (
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            {crit.horario}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2 mt-0.5">
                        {crit.descricao}
                      </p>
                    </div>

                    <ArrowRight className="size-3 text-muted-foreground shrink-0 self-center" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Seção 3: Última Passagem de Plantão */}
          {ultimaPassagem && (
            <div className="p-3 bg-muted/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  Última Passagem de Plantão
                </span>
                <span className="text-[10px] uppercase font-semibold text-primary">
                  Turno {ultimaPassagem.turno}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-border/60 text-xs space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium block">
                  Entregue por <strong>{ultimaPassagem.passadoPor.nome}</strong> às {ultimaPassagem.hora}
                </span>
                <p className="text-[11px] text-foreground leading-relaxed line-clamp-2">
                  "{ultimaPassagem.relato}"
                </p>
                {ultimaPassagem.pendencias && (
                  <div className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-1.5 rounded-md border border-amber-500/25">
                    <strong>Atenção:</strong> {ultimaPassagem.pendencias}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com link rápido */}
        <div className="p-2.5 bg-muted/40 border-t border-border/60 flex items-center justify-between">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setAberto(false)
              navigate('/plantao')
            }}
            className="text-xs text-primary font-semibold gap-1 w-full justify-center"
          >
            <span>Ir para o Painel de Plantão</span>
            <ExternalLink className="size-3" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
