import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Input } from './input'

export interface PasswordInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  showPasswordLabel?: string
  hidePasswordLabel?: string
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      showPasswordLabel = 'Exibir senha',
      hidePasswordLabel = 'Ocultar senha',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none focus:outline-none"
          aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'
