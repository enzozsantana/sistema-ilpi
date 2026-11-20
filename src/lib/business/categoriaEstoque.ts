export type TipoItemEstoque = 'medicamento' | 'higiene'

const HIGIENE_KEYWORDS = [
  'shampoo',
  'sabonete',
  'fralda',
  'condicionador',
  'hidratante',
  'creme',
  'lenço',
  'lenco',
  'pomada',
  'age',
  'óleo',
  'oleo',
  'desodorante',
  'escova',
  'pasta de dente',
  'creme dental',
  'dentifrício',
  'algodão',
  'algodao',
  'gaze',
  'atadura',
  'luva',
  'toalha',
  'talco',
  'lençol',
  'absorvente',
  'cotonete',
  'fio dental',
  'anticaspa',
  'sabonete líquido',
  'sabonete liquido',
]

const STORAGE_KEY_TIPOS = 'ilpi-estoque-tipos'

function carregarMapaTipos(): Record<string, TipoItemEstoque> {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TIPOS)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function classificarTipoItem(itemId: string, nomeItem: string): TipoItemEstoque {
  const mapa = carregarMapaTipos()
  if (mapa[itemId]) return mapa[itemId]

  const norm = (nomeItem || '').toLowerCase()
  for (const kw of HIGIENE_KEYWORDS) {
    if (norm.includes(kw)) {
      return 'higiene'
    }
  }
  return 'medicamento'
}

export function salvarTipoItem(itemId: string, tipo: TipoItemEstoque): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    const mapa = carregarMapaTipos()
    mapa[itemId] = tipo
    localStorage.setItem(STORAGE_KEY_TIPOS, JSON.stringify(mapa))
  } catch (err) {
    console.error('Erro ao salvar tipo do item:', err)
  }
}

export function getBadgeTipoItem(tipo: TipoItemEstoque): {
  label: string
  icone: string
  bg: string
  border: string
  rowBorder: string
} {
  if (tipo === 'higiene') {
    return {
      label: 'Higiene & Cuidados',
      icone: '🧴',
      bg: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300',
      border: 'border-teal-500/30',
      rowBorder: 'border-l-4 border-l-teal-500',
    }
  }
  return {
    label: 'Medicamento',
    icone: '💊',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500/30',
    rowBorder: 'border-l-4 border-l-indigo-500',
  }
}
