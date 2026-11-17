-- ==============================================================================
-- Migration: Passagem de Plantão dos Cuidadores e Sistema de Avisos/Alertas da RT
-- Execute este script no SQL Editor do painel do Supabase.
-- O sistema possui fallback inteligente e funciona 100% de imediato.
-- ==============================================================================

-- 1. Tabela de Passagens de Plantão
CREATE TABLE IF NOT EXISTS public.passagens_plantao (
  id TEXT PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TEXT NOT NULL,
  turno TEXT NOT NULL, -- 'manha', 'tarde', 'noite', 'diurno', 'noturno'
  passado_por JSONB NOT NULL, -- { id, nome, cat }
  recebido_por JSONB DEFAULT NULL, -- { id, nome, cat }
  relato TEXT NOT NULL,
  pendencias TEXT DEFAULT NULL,
  resumo JSONB DEFAULT '{}'::jsonb, -- estatísticas automáticas do turno
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passagens_data ON public.passagens_plantao(data DESC);

COMMENT ON TABLE public.passagens_plantao IS 'Registro formal de passagens de plantão entre turnos de cuidadores e enfermagem';

-- 2. Tabela de Avisos e Comunicados da RT para a Equipe
CREATE TABLE IF NOT EXISTS public.avisos_rt (
  id TEXT PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'geral', -- 'geral', 'importante', 'urgente'
  autor JSONB NOT NULL, -- { id, nome, cat }
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ciencias JSONB DEFAULT '[]'::jsonb, -- array de IDs dos profissionais que deram ciência
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avisos_ativo ON public.avisos_rt(ativo, created_at DESC);

COMMENT ON TABLE public.avisos_rt IS 'Avisos e comunicados da RT (Responsável Técnica) transmitidos com alerta para toda a equipe';
