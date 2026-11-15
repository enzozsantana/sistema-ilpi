import { cn } from '@/lib/utils'

interface SenecurareLogoProps {
  variant?: 'full' | 'horizontal' | 'icon' | 'mark'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTagline?: boolean
  className?: string
  iconClassName?: string
}

const SIZES = {
  sm: {
    icon: 'size-7',
    sene: 'text-base',
    curare: 'text-base',
    tagline: 'text-[9.5px]',
    gap: 'gap-2',
  },
  md: {
    icon: 'size-9',
    sene: 'text-xl',
    curare: 'text-xl',
    tagline: 'text-xs',
    gap: 'gap-2.5',
  },
  lg: {
    icon: 'size-12',
    sene: 'text-2xl',
    curare: 'text-2xl',
    tagline: 'text-sm',
    gap: 'gap-3',
  },
  xl: {
    icon: 'size-20',
    sene: 'text-4xl',
    curare: 'text-4xl',
    tagline: 'text-base',
    gap: 'gap-4',
  },
}

export function SenecurareLogo({
  variant = 'horizontal',
  size = 'md',
  showTagline = false,
  className,
  iconClassName,
}: SenecurareLogoProps) {
  const conf = SIZES[size]

  if (variant === 'icon') {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-white/95 dark:bg-card shadow-xs ring-1 ring-border/50',
          conf.icon,
          className
        )}
      >
        <img
          src="/logo-icon.png"
          alt="Senecurare — Árvore do Vínculo"
          className={cn('size-full object-contain p-0.5 select-none', iconClassName)}
          loading="eager"
        />
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div className={cn('flex flex-col items-center text-center select-none', conf.gap, className)}>
        <div
          className={cn(
            'relative flex items-center justify-center rounded-2xl bg-white/90 dark:bg-card p-2 shadow-sm ring-1 ring-border/40',
            conf.icon
          )}
        >
          <img
            src="/logo-icon.png"
            alt="Senecurare — Árvore do Vínculo"
            className="size-full object-contain"
            loading="eager"
          />
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-baseline tracking-tight font-serif leading-none">
            <span
              className={cn(
                'font-bold text-[#123F4A] dark:text-[#6ec5d4] transition-colors',
                conf.sene
              )}
            >
              Sene
            </span>
            <span
              className={cn(
                'italic font-medium text-[#D9694F] dark:text-[#f48a73] transition-colors',
                conf.curare
              )}
            >
              curare
            </span>
          </div>

          {(showTagline || size === 'lg' || size === 'xl') && (
            <p
              className={cn(
                'mt-1 font-serif italic text-muted-foreground/90 tracking-wide',
                conf.tagline
              )}
            >
              Raízes de cuidado, laços de vida.
            </p>
          )}
        </div>
      </div>
    )
  }

  // variant === 'horizontal' or default
  return (
    <div className={cn('flex items-center select-none', conf.gap, className)}>
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0 rounded-xl bg-white/95 dark:bg-card ring-1 ring-border/60 shadow-xs p-1',
          conf.icon
        )}
      >
        <img
          src="/logo-icon.png"
          alt="Senecurare"
          className={cn('size-full object-contain', iconClassName)}
          loading="eager"
        />
      </div>

      <div className="flex flex-col min-w-0 justify-center">
        <div className="flex items-baseline tracking-tight font-serif leading-none">
          <span
            className={cn(
              'font-bold text-[#123F4A] dark:text-[#6ec5d4] transition-colors',
              conf.sene
            )}
          >
            Sene
          </span>
          <span
            className={cn(
              'italic font-medium text-[#D9694F] dark:text-[#f48a73] transition-colors',
              conf.curare
            )}
          >
            curare
          </span>
        </div>

        {showTagline && (
          <span
            className={cn(
              'font-serif italic text-muted-foreground/80 truncate mt-0.5',
              conf.tagline
            )}
          >
            Raízes de cuidado, laços de vida.
          </span>
        )}
      </div>
    </div>
  )
}
export default SenecurareLogo
