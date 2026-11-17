-- ==============================================================================
-- Migration: Sincronização Obrigatória Supabase (Escalas & Processo de Enfermagem)
-- Execute este script no SQL Editor do painel do Supabase.
-- ==============================================================================

-- 1. Configuração de Escalas Clínicas da ILPI na tabela 'instituicao'
ALTER TABLE public.instituicao 
ADD COLUMN IF NOT EXISTS escalas_config JSONB DEFAULT NULL;

COMMENT ON COLUMN public.instituicao.escalas_config IS 'Configuração de escalas ativas, padrão de dependência (Fugulin vs Katz) e escalas customizadas da ILPI';

-- 2. Processo de Enfermagem (Diagnóstico NANDA, Meta Individual NOC, Intervenções NIC) na tabela 'pias'
ALTER TABLE public.pias
ADD COLUMN IF NOT EXISTS itens_nanda JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS metas JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS intervencoes JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.pias.itens_nanda IS 'Itens detalhados do Processo de Enfermagem (NANDA, NOC, NIC e Resultado)';
COMMENT ON COLUMN public.pias.metas IS 'Mapeamento de metas individuais (NOC) por diagnóstico';
COMMENT ON COLUMN public.pias.intervencoes IS 'Mapeamento de intervenções de enfermagem (NIC) por diagnóstico';
