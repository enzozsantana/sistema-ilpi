/** Traduz erros do Supabase Auth para mensagens claras em português. */
export function mensagemAuth(erro: { message?: string; status?: number; code?: string } | null | undefined): string {
  const raw = (erro?.message ?? '').toLowerCase()
  const code = (erro?.code ?? '').toLowerCase()

  if (
    raw.includes('invalid login credentials') ||
    raw.includes('invalid_credentials') ||
    code === 'invalid_credentials'
  ) {
    return 'E-mail ou senha incorretos. Confira e tente de novo.'
  }

  if (raw.includes('email not confirmed') || code === 'email_not_confirmed') {
    return 'Este e-mail ainda não foi confirmado. Peça à RT para liberar o acesso.'
  }

  if (raw.includes('user not found') || code === 'user_not_found') {
    return 'Não encontramos uma conta com este e-mail.'
  }

  if (raw.includes('too many requests') || raw.includes('rate limit') || code === 'over_request_rate_limit') {
    return 'Muitas tentativas seguidas. Aguarde um momento e tente novamente.'
  }

  if (raw.includes('network') || raw.includes('fetch') || raw.includes('failed to fetch')) {
    return 'Não foi possível conectar. Verifique a internet e tente de novo.'
  }

  if (raw.includes('user banned') || code === 'user_banned') {
    return 'Esta conta está bloqueada. Fale com a responsável técnica.'
  }

  if (raw.includes('password should be') || raw.includes('password is too weak') || code === 'weak_password') {
    return 'A nova senha precisa ser mais forte (mínimo 6 caracteres).'
  }

  if (raw.includes('same password') || raw.includes('should be different')) {
    return 'A nova senha precisa ser diferente da atual.'
  }

  if (!raw.trim()) {
    return 'Não foi possível concluir. Tente novamente em instantes.'
  }

  return 'Não foi possível entrar. Confira e-mail e senha, ou fale com a RT.'
}

export function mensagemSenha(erro: { message?: string; code?: string } | null | undefined): string {
  const raw = (erro?.message ?? '').toLowerCase()
  if (raw.includes('invalid login credentials') || raw.includes('invalid_credentials')) {
    return 'Senha atual incorreta.'
  }
  const msg = mensagemAuth(erro)
  if (msg.startsWith('Não foi possível entrar')) {
    return 'Não foi possível alterar a senha. Tente de novo.'
  }
  return msg
}
