import { useState } from 'react'
import {
  classificarTipoItem,
  getBadgeTipoItem,
  salvarTipoItem,
  type TipoItemEstoque,
} from '../lib/business/categoriaEstoque'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface BadgeTipoEstoqueProps {
  itemId: string
  nomeItem: string
  className?: string
  editable?: boolean
  onChange?: (novoTipo: TipoItemEstoque) => void
}

export function BadgeTipoEstoque({
  itemId,
  nomeItem,
  className,
  editable = true,
  onChange,
}: BadgeTipoEstoqueProps) {
  const [tipo, setTipo] = useState<TipoItemEstoque>(() =>
    classificarTipoItem(itemId, nomeItem)
  )

  const meta = getBadgeTipoItem(tipo)

  function alternarTipo(e: React.MouseEvent) {
    if (!editable) return
    e.stopPropagation()
    const proximo: TipoItemEstoque = tipo === 'medicamento' ? 'higiene' : 'medicamento'
    setTipo(proximo)
    salvarTipoItem(itemId, proximo)
    onChange?.(proximo)
    toast.success(`Categoria de "${nomeItem}" alterada para ${proximo === 'higiene' ? 'Higiene & Cuidados' : 'Medicamento'}`)
  }

  return (
    <button
      type="button"
      onClick={alternarTipo}
      disabled={!editable}
      title={
        editable
          ? `Categoria: ${meta.label} (Clique para alternar entre Medicamento e Higiene)`
          : `Categoria: ${meta.label}`
      }
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer select-none',
        meta.bg,
        meta.border,
        editable && 'hover:opacity-80 active:scale-95',
        className
      )}
    >
      <span>{meta.icone}</span>
      <span>{meta.label}</span>
    </button>
  )
}
