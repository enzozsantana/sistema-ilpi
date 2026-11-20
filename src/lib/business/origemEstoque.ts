export const CANAIS_ORIGEM = [
  'Familiar',
  'Farmácia Comercial',
  'Farmácia Popular',
  'Instituição',
] as const

export type CanalOrigem = (typeof CANAIS_ORIGEM)[number]

const STORAGE_KEY_ORIGENS = 'ilpi-estoque-origens'

// Sugestões inteligentes padrão baseadas nas diretrizes clínicas da ILPI
const DEFAULTS_POR_NOME: Record<string, CanalOrigem> = {
  pantoprazol: 'Farmácia Comercial',
  losartana: 'Farmácia Comercial',
  dapagliflozina: 'Farmácia Comercial',
  colírio: 'Farmácia Comercial',
  colirio: 'Farmácia Comercial',
  'ácido acetilsalicílico': 'Farmácia Popular',
  'acido acetilsalicilico': 'Farmácia Popular',
  aas: 'Farmácia Popular',
  bromoprida: 'Farmácia Popular',
  metformina: 'Farmácia Popular',
  sinvastatina: 'Farmácia Popular',
  atenolol: 'Farmácia Popular',
  hidroclorotiazida: 'Farmácia Popular',
  captopril: 'Farmácia Popular',
  glibenclamida: 'Farmácia Popular',
  insulina: 'Farmácia Popular',
  shampoo: 'Familiar',
  sabonete: 'Familiar',
  fralda: 'Familiar',
  hidratante: 'Familiar',
  macrogol: 'Familiar',
  paracetamol: 'Familiar',
  dipirona: 'Familiar',
}

function carregarMapaOrigens(): Record<string, string> {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORIGENS)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getOrigemItem(itemId: string, nomeItem?: string): string {
  const mapa = carregarMapaOrigens()
  if (mapa[itemId]) return mapa[itemId]

  if (nomeItem) {
    const nomeNorm = nomeItem.toLowerCase()
    for (const [termo, origem] of Object.entries(DEFAULTS_POR_NOME)) {
      if (nomeNorm.includes(termo)) {
        return origem
      }
    }
  }

  return 'Familiar'
}

export function salvarOrigemItem(itemId: string, origem: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    const mapa = carregarMapaOrigens()
    mapa[itemId] = origem.trim()
    localStorage.setItem(STORAGE_KEY_ORIGENS, JSON.stringify(mapa))
  } catch (err) {
    console.error('Erro ao salvar origem do item:', err)
  }
}

export function getCorOrigem(origem: string): {
  bg: string
  text: string
  border: string
  dot: string
} {
  const norm = origem.toLowerCase()
  if (norm.includes('popular')) {
    return {
      bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      border: 'border-blue-500/30',
      text: 'text-blue-700 dark:text-blue-300',
      dot: 'bg-blue-500',
    }
  }
  if (norm.includes('comercial') || norm.includes('farmácia') || norm.includes('farmacia')) {
    return {
      bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/30',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
    }
  }
  if (norm.includes('familiar') || norm.includes('família')) {
    return {
      bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    }
  }
  return {
    bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/30',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
  }
}
