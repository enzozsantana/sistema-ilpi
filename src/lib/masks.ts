/**
 * Máscaras para campos do sistema (Conselhos Profissionais, Telefone, Cartão, PA, etc.)
 */

/**
 * Máscara inteligente para Conselhos Profissionais de Saúde (CRM, COREN, CRN, CRP, CREFITO, etc.)
 * Converte automaticamente para caixa alta e padroniza o formato: CONSELHO-UF NÚMERO[-SUFIXO]
 * Exemplos:
 *   "crmsp189432" -> "CRM-SP 189432"
 *   "corensp123456te" -> "COREN-SP 123456-TE"
 *   "crm 123456" -> "CRM 123456"
 *   "crn-3 12345" -> "CRN-3 12345"
 */
export function mascaraConselho(valor: string): string {
  if (!valor) return ''
  const texto = valor.toUpperCase().trimStart()

  // Lista de conselhos de saúde comuns
  const conselhos = [
    'COREN',
    'CREFITO',
    'CRESS',
    'CREF',
    'CRBM',
    'CRFA',
    'CRM',
    'CRN',
    'CRP',
    'CRO',
    'CRF',
    'RMS',
  ]

  const UFS = 'AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO'

  for (const c of conselhos) {
    if (!texto.startsWith(c)) continue

    const resto = texto.slice(c.length).trimStart()
    if (!resto) return c

    // Caso 1: tem UF oficial de 2 letras (ex: SP, RJ, MG...)
    const matchUf = resto.match(
      new RegExp(`^[\\s/\\-]?(${UFS})[\\s/\\-]?([0-9.]*)(?:[\\s/\\-]?([A-Z]+))?$`, 'i')
    )
    if (matchUf) {
      const [, uf, num, suf] = matchUf
      let res = `${c}-${uf}`
      if (num) res += ` ${num}`
      if (suf) res += `-${suf}`
      return res
    }

    // Caso 2: tem região numérica com hífen/barra/espaço explícito (ex: CREFITO-3, CRP-06)
    const matchRegiao = resto.match(
      /^[\\s/\\-]?([0-9]{1,2})[\s/\-]+([0-9.]*)(?:[\s/\-]?([A-Z]+))?$/i
    )
    if (matchRegiao) {
      const [, reg, num, suf] = matchRegiao
      let res = `${c}-${reg}`
      if (num) res += ` ${num}`
      if (suf) res += `-${suf}`
      return res
    }

    // Caso 3: direto para número (sem UF nem região)
    const matchNum = resto.match(/^[\\s/\\-]?([0-9.]*)(?:[\s/\-]?([A-Z]+))?$/i)
    if (matchNum) {
      const [, num, suf] = matchNum
      let res = c
      if (num) res += ` ${num}`
      if (suf) res += `-${suf}`
      return res
    }
  }

  return texto
}

/**
 * Máscara para telefone fixo ou celular brasileiro:
 * 10 dígitos: (XX) XXXX-XXXX
 * 11 dígitos: (XX) XXXXX-XXXX
 */
export function mascaraTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  if (!digitos) return ''
  if (digitos.length <= 2) return `(${digitos}`
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7, 11)}`
}

/**
 * Máscara para número de cartão de crédito:
 * Formata em grupos de 4 dígitos: 0000 0000 0000 0000
 */
export function mascaraCartao(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 16)
  return digitos.replace(/(\d{4})(?=\d)/g, '$1 ')
}

/**
 * Máscara para validade de cartão de crédito:
 * Formato MM/AA
 */
export function mascaraValidadeCartao(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 4)
  if (digitos.length <= 2) return digitos
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}`
}

/**
 * Máscara para código de segurança CVV:
 * Até 4 dígitos numéricos
 */
export function mascaraCvv(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 4)
}

/**
 * Máscara para aferição de Pressão Arterial (PA):
 * Ex: "12080" -> "120x80", "128" -> "12x8", "13085" -> "130x85"
 */
export function mascaraPA(valor: string): string {
  if (!valor) return ''
  // Se o usuário já digitou 'x', 'X' ou '/'
  if (/[xX/]/.test(valor)) {
    const partes = valor.split(/[xX/]/)
    const p1 = partes[0].replace(/\D/g, '').slice(0, 3)
    const p2 = partes.slice(1).join('').replace(/\D/g, '').slice(0, 3)
    if (partes.length > 1 && !p2) {
      return `${p1}x`
    }
    return p2 ? `${p1}x${p2}` : p1
  }

  const digitos = valor.replace(/\D/g, '').slice(0, 6)
  if (digitos.length <= 2) return digitos
  if (digitos.length === 3) return `${digitos.slice(0, 2)}x${digitos.slice(2)}`
  if (digitos.length === 4) return `${digitos.slice(0, 2)}x${digitos.slice(2)}`
  if (digitos.length === 5) return `${digitos.slice(0, 3)}x${digitos.slice(3)}`
  return `${digitos.slice(0, 3)}x${digitos.slice(3, 6)}`
}
