import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOrigemItem,
  salvarOrigemItem,
  getCorOrigem,
} from '../../lib/business/origemEstoque'

describe('origemEstoque Business Rules', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('identifica corretamente a origem padrão baseada no nome do medicamento', () => {
    expect(getOrigemItem('it1', 'Pantoprazol 40 mg')).toBe('Farmácia Comercial')
    expect(getOrigemItem('it2', 'Losartana potássica 50 mg')).toBe('Farmácia Comercial')
    expect(getOrigemItem('it3', 'Ácido acetilsalicílico 100 mg')).toBe('Farmácia Popular')
    expect(getOrigemItem('it4', 'Bromoprida 4 mg/mL')).toBe('Farmácia Popular')
    expect(getOrigemItem('it5', 'Shampoo Anticaspa')).toBe('Familiar')
  })

  it('permite alterar e persistir uma origem customizada', () => {
    salvarOrigemItem('it1', 'Farmácia Popular')
    expect(getOrigemItem('it1', 'Pantoprazol 40 mg')).toBe('Farmácia Popular')

    salvarOrigemItem('it1', 'Familiar')
    expect(getOrigemItem('it1')).toBe('Familiar')
  })

  it('retorna paleta de cores correspondente para cada tipo de origem', () => {
    const corPopular = getCorOrigem('Farmácia Popular')
    expect(corPopular.bg).toContain('blue')

    const corComercial = getCorOrigem('Farmácia Comercial')
    expect(corComercial.bg).toContain('amber')

    const corFamiliar = getCorOrigem('Familiar')
    expect(corFamiliar.bg).toContain('emerald')
  })
})
