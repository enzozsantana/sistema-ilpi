/**
 * Utilitários de Formatação e Máscara Monetária no padrão Real Brasileiro (BRL - R$)
 */

/**
 * Converte qualquer representação (número, string com R$, string pura) para número float puro.
 * Ex:
 *   200 -> 200
 *   "200" -> 200
 *   "200.5" -> 200.5
 *   "R$ 200,00" -> 200
 *   "R$ 1.500,50" -> 1500.5
 *   "1.500,50" -> 1500.5
 */
export function parseMoeda(valor: string | number | undefined | null): number {
  if (valor === undefined || valor === null || valor === '') return 0
  if (typeof valor === 'number') return isNaN(valor) ? 0 : valor

  const str = String(valor).trim()
  if (!str) return 0

  // Se já for uma string numérica pura como "200" ou "200.5"
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    const n = Number(str)
    return isNaN(n) ? 0 : n
  }

  // Se tem padrão brasileiro com vírgula para decimais: "1.500,50" ou "200,00"
  if (str.includes(',')) {
    const semPontos = str.replace(/\./g, '').replace(/[^\d,-]/g, '').replace(',', '.')
    const n = parseFloat(semPontos)
    return isNaN(n) ? 0 : n
  }

  // Remove qualquer caractere não numérico exceto hífen
  const limpo = str.replace(/[^\d-]/g, '')
  if (!limpo) return 0
  const n = parseFloat(limpo)
  return isNaN(n) ? 0 : n
}

/**
 * Formata um valor numérico para o padrão de moeda brasileiro (Real - BRL).
 * Garante espaço normal simples e formato R$ X.XXX,XX
 */
export function formatarMoeda(valor: number | string | undefined | null): string {
  if (valor === undefined || valor === null || valor === '') return 'R$ 0,00'
  const num = typeof valor === 'number' ? valor : parseMoeda(valor)
  if (isNaN(num)) return 'R$ 0,00'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(num)
    .replace(/\s/g, ' ')
}

/**
 * Aplica máscara de moeda brasileira em tempo de digitação:
 * "1" -> "R$ 0,01"
 * "10" -> "R$ 0,10"
 * "100" -> "R$ 1,00"
 * "20000" -> "R$ 200,00"
 * "150050" -> "R$ 1.500,50"
 */
export function mascaraMoeda(valorDigitosOuTexto: string | number): string {
  if (typeof valorDigitosOuTexto === 'number') {
    return formatarMoeda(valorDigitosOuTexto)
  }
  const str = String(valorDigitosOuTexto)
  const digitos = str.replace(/\D/g, '')
  if (!digitos) return ''
  const centavos = parseInt(digitos, 10)
  return formatarMoeda(centavos / 100)
}
