import { useState } from 'react'
import {
  CANAIS_ORIGEM,
  getCorOrigem,
  getOrigemItem,
  salvarOrigemItem,
} from '../lib/business/origemEstoque'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface OrigemItemSelectProps {
  itemId: string
  nomeItem: string
  className?: string
  onChangeOrigem?: (novaOrigem: string) => void
  disabled?: boolean
}

export function OrigemItemSelect({
  itemId,
  nomeItem,
  className,
  onChangeOrigem,
  disabled = false,
}: OrigemItemSelectProps) {
  const [origem, setOrigem] = useState(() => getOrigemItem(itemId, nomeItem))
  const [editandoCustom, setEditandoCustom] = useState(false)
  const [customTexto, setCustomTexto] = useState('')

  const cores = getCorOrigem(origem)

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    if (val === '__custom__') {
      setCustomTexto('')
      setEditandoCustom(true)
      return
    }
    setOrigem(val)
    salvarOrigemItem(itemId, val)
    onChangeOrigem?.(val)
    toast.success(`Origem de "${nomeItem}" alterada para "${val}"`)
  }

  function handleSalvarCustom() {
    if (!customTexto.trim()) {
      setEditandoCustom(false)
      return
    }
    const val = customTexto.trim()
    setOrigem(val)
    salvarOrigemItem(itemId, val)
    onChangeOrigem?.(val)
    setEditandoCustom(false)
    toast.success(`Origem de "${nomeItem}" alterada para "${val}"`)
  }

  if (editandoCustom) {
    return (
      <div className={cn('inline-flex items-center gap-1', className)}>
        <input
          type="text"
          value={customTexto}
          onChange={(e) => setCustomTexto(e.target.value)}
          placeholder="Ex: Farmácia X, Posto..."
          className="h-5 text-[10px] px-1.5 rounded border border-input bg-background font-medium w-28"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSalvarCustom()
            if (e.key === 'Escape') setEditandoCustom(false)
          }}
        />
        <button
          type="button"
          onClick={handleSalvarCustom}
          className="text-[10px] px-1 py-0.5 rounded bg-primary text-primary-foreground font-semibold"
        >
          Salvar
        </button>
      </div>
    )
  }

  return (
    <div className={cn('inline-flex items-center', className)}>
      <select
        value={CANAIS_ORIGEM.includes(origem as any) ? origem : '__custom_saved__'}
        disabled={disabled}
        onChange={handleChange}
        title={`Origem de aquisição: ${origem} (Clique para alterar)`}
        className={cn(
          'text-[10px] font-semibold rounded-md border px-1.5 py-0.5 cursor-pointer appearance-none transition-all outline-none focus:ring-1 focus:ring-primary',
          cores.bg,
          cores.border
        )}
      >
        {CANAIS_ORIGEM.map((op) => (
          <option key={op} value={op} className="bg-popover text-popover-foreground text-xs py-1">
            {op}
          </option>
        ))}
        {!CANAIS_ORIGEM.includes(origem as any) && (
          <option value="__custom_saved__" className="bg-popover text-popover-foreground text-xs py-1">
            {origem}
          </option>
        )}
        <option value="__custom__" className="bg-popover text-popover-foreground text-xs py-1 italic">
          ✏️ Outro (digitar)...
        </option>
      </select>
    </div>
  )
}
