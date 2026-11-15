import type { ReactNode } from 'react'
import type { Residente } from '../types/ilpi'
import { idade, primeiro } from '../lib/business/dates'
import { Avatar as BaseAvatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Skeleton } from './ui/skeleton'
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Avatar({
  r,
  size = '',
  className,
}: {
  r: Pick<{ nome: string; foto?: string }, 'nome' | 'foto'> | Pick<Residente, 'nome' | 'foto'>
  size?: 'sm' | 'lg' | 'xl' | ''
  className?: string
}) {
  const sizeClasses = {
    sm: 'size-7 text-xs font-semibold',
    '': 'size-9 text-sm font-semibold',
    lg: 'size-14 text-base font-bold',
    xl: 'size-20 text-lg font-bold',
  }[size]

  const ini = primeiro(r.nome).slice(0, 2).toUpperCase()

  return (
    <BaseAvatar className={cn(sizeClasses, 'ring-1 ring-border/60 shadow-xs shrink-0', className)}>
      {r.foto && <AvatarImage src={r.foto} alt={r.nome} className="object-cover" />}
      <AvatarFallback className="bg-primary/10 text-primary uppercase select-none">
        {ini}
      </AvatarFallback>
    </BaseAvatar>
  )
}

export function Allergy({ alergias, className }: { alergias?: string; className?: string }) {
  if (alergias) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 shadow-2xs',
          className
        )}
      >
        <ShieldAlert className="size-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
        <span>Alergia: {alergias}</span>
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
        className
      )}
    >
      <CheckCircle2 className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span>Sem alergia registrada</span>
    </span>
  )
}

export function ResidentMeta({ r }: { r: Residente }) {
  return (
    <span className="text-xs text-muted-foreground font-medium">
      {idade(r.nasc)} anos{r.status === 'obito' ? ' · óbito' : ''}
    </span>
  )
}

export function PageHeader({
  title,
  lede,
  actions,
  badge,
  className,
}: {
  title: string
  lede?: string
  actions?: ReactNode
  badge?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-border/60', className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-heading">
            {title}
          </h1>
          {badge}
        </div>
        {lede ? <p className="text-sm text-muted-foreground max-w-2xl">{lede}</p> : null}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </header>
  )
}

export function Section({
  title,
  meta,
  children,
  className = '',
  variant = 'card',
}: {
  title?: string
  meta?: ReactNode
  children: ReactNode
  className?: string
  variant?: 'plain' | 'card' | 'emphasis'
}) {
  if (variant === 'plain') {
    return (
      <section className={cn('space-y-3 mb-6', className)}>
        {(title || meta) && (
          <div className="flex items-center justify-between gap-3">
            {title ? <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2> : <span />}
            {meta}
          </div>
        )}
        {children}
      </section>
    )
  }

  return (
    <Card
      className={cn(
        'shadow-xs border border-border/80 mb-6 overflow-hidden transition-all duration-200',
        variant === 'emphasis' && 'ring-2 ring-primary/20 border-primary/40',
        className
      )}
    >
      {(title || meta) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/40 bg-muted/20 px-5 pt-4">
          {title ? (
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              {title}
            </CardTitle>
          ) : (
            <span />
          )}
          {meta}
        </CardHeader>
      )}
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  )
}

export function StatusBadge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'accent'
  children: ReactNode
  className?: string
}) {
  const toneClasses = {
    neutral: 'bg-muted text-muted-foreground border-border/60 hover:bg-muted',
    ok: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15',
    warn: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/15',
    danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/15',
    accent: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/25 hover:bg-teal-500/15',
  }[tone]

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors', toneClasses, className)}
    >
      {tone === 'ok' && <span className="size-1.5 rounded-full bg-emerald-500 inline-block mr-1" />}
      {tone === 'warn' && <span className="size-1.5 rounded-full bg-amber-500 inline-block mr-1" />}
      {tone === 'danger' && <span className="size-1.5 rounded-full bg-rose-500 inline-block mr-1" />}
      {children}
    </Badge>
  )
}

export function EmptyState({
  children,
  warn,
  compact,
  className,
  title = 'Nenhum registro',
}: {
  children: ReactNode
  warn?: boolean
  compact?: boolean
  className?: string
  title?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 transition-colors',
        compact ? 'py-5 px-4 text-xs' : 'py-10 px-6',
        warn && 'border-amber-500/40 bg-amber-500/5',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full p-2.5 mb-2.5 bg-background shadow-2xs border border-border/50 text-muted-foreground',
          warn && 'text-amber-600 dark:text-amber-400'
        )}
      >
        {warn ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
      </div>
      {!compact && <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>}
      <div className="text-xs text-muted-foreground max-w-sm">{children}</div>
    </div>
  )
}

export function SkeletonBlock() {
  return (
    <div className="space-y-3 p-4 rounded-xl border border-border/60 bg-card" aria-busy="true" aria-live="polite">
      <Skeleton className="h-6 w-3/4 rounded-md" />
      <Skeleton className="h-4 w-1/2 rounded-md" />
      <Skeleton className="h-4 w-1/3 rounded-md" />
    </div>
  )
}

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  title = 'Detalhes',
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  labelledBy?: string
  title?: string
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-6" aria-labelledby={labelledBy}>
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export function Toast({ message }: { message: string }) {
  if (!message) return null
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-foreground text-background text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-200"
      role="status"
    >
      {message}
    </div>
  )
}
