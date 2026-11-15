import { useState } from 'react'
import { resolveTheme, toggleTheme, type ThemeMode } from '../lib/theme'
import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

export function ThemeToggle({
  className = '',
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const [mode, setMode] = useState<ThemeMode>(() => resolveTheme())

  const nextLabel = mode === 'dark' ? 'claro' : 'escuro'

  return (
    <Button
      variant="ghost"
      size={compact ? 'icon' : 'sm'}
      className={cn('rounded-full text-muted-foreground hover:text-foreground', className)}
      aria-label={`Ativar tema ${nextLabel}`}
      title={`Tema ${nextLabel}`}
      onClick={() => setMode(toggleTheme())}
    >
      {mode === 'dark' ? (
        <Sun className="size-4.5 text-amber-400 transition-all rotate-0 scale-100" />
      ) : (
        <Moon className="size-4.5 text-slate-700 dark:text-slate-200 transition-all rotate-0 scale-100" />
      )}
      {!compact && (
        <span className="text-xs font-medium ml-1.5">{mode === 'dark' ? 'Claro' : 'Escuro'}</span>
      )}
    </Button>
  )
}
