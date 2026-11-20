import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { formatarMoeda, parseMoeda, mascaraMoeda } from './currency'
export {
  mascaraConselho,
  mascaraTelefone,
  mascaraCartao,
  mascaraValidadeCartao,
  mascaraCvv,
  mascaraPA,
} from './masks'
