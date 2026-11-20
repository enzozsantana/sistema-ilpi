-- ==============================================================================
-- Migração: Mercado Pago Marketplace & Split de Pagamentos para Teleconsultas
-- ==============================================================================

-- 1. Tabela de contas Mercado Pago conectadas por profissional (OAuth)
CREATE TABLE IF NOT EXISTS public.profissionais_mercadopago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id TEXT NOT NULL UNIQUE,
  mp_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  public_key TEXT,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  taxa_comissao_percentual NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  live_mode BOOLEAN NOT NULL DEFAULT false,
  conectado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para busca rápida por profissional_id e mp_user_id
CREATE INDEX IF NOT EXISTS idx_profissionais_mp_prof_id ON public.profissionais_mercadopago(profissional_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_mp_user_id ON public.profissionais_mercadopago(mp_user_id);

-- 2. Tabela de histórico de transações com split de pagamento (application_fee)
CREATE TABLE IF NOT EXISTS public.transacoes_split_mercadopago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id TEXT NOT NULL,
  mp_payment_id TEXT NOT NULL,
  profissional_id TEXT NOT NULL,
  residente_id TEXT NOT NULL,
  residente_nome TEXT,
  valor_total NUMERIC(10, 2) NOT NULL,
  valor_comissao_saas NUMERIC(10, 2) NOT NULL,
  valor_liquido_profissional NUMERIC(10, 2) NOT NULL,
  taxa_comissao_percentual NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  metodo_pagamento TEXT NOT NULL, -- 'pix' ou 'cartao'
  status TEXT NOT NULL DEFAULT 'pending', -- 'approved', 'pending', 'rejected'
  pix_copia_cola TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transacoes_split_consulta_id ON public.transacoes_split_mercadopago(consulta_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_split_prof_id ON public.transacoes_split_mercadopago(profissional_id);
