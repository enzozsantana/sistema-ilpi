import * as React from 'react'
import { Input } from './input'
import { formatarMoeda, mascaraMoeda, parseMoeda } from '../../lib/currency'
import { cn } from '../../lib/utils'

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'defaultValue' | 'onChange'> {
  value?: number | string
  defaultValue?: number | string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onChangeValue?: (numericValue: number) => void
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onChangeValue,
      className,
      placeholder = 'R$ 0,00',
      ...props
    },
    ref
  ) => {
    const initialText = React.useMemo(() => {
      const v = value !== undefined ? value : defaultValue
      if (v === undefined || v === '') return ''
      return typeof v === 'number' ? formatarMoeda(v) : mascaraMoeda(v)
    }, [value, defaultValue])

    const [displayValue, setDisplayValue] = React.useState<string>(initialText)

    React.useEffect(() => {
      if (value !== undefined) {
        if (value === '' || value === 0) {
          setDisplayValue(value === 0 ? formatarMoeda(0) : '')
        } else {
          setDisplayValue(typeof value === 'number' ? formatarMoeda(value) : mascaraMoeda(value))
        }
      }
    }, [value])

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value
      const masked = mascaraMoeda(raw)
      const numeric = parseMoeda(masked)

      setDisplayValue(masked)

      // Atualiza o event target para o valor com a máscara de Real
      e.target.value = masked
      onChange?.(e)
      onChangeValue?.(numeric)
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className={cn('font-medium', className)}
        {...props}
      />
    )
  }
)
CurrencyInput.displayName = 'CurrencyInput'
