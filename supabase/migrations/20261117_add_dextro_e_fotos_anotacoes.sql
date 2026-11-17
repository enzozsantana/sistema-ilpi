-- ==============================================================================
-- Migration: Dextro (Glicemia Capilar) e Comprovantes Fotográficos em Anotações
-- Execute este script no SQL Editor do painel do Supabase se desejar persistência em colunas nativas.
-- O sistema possui fallback inteligente e funciona 100% de imediato.
-- ==============================================================================

ALTER TABLE public.anotacoes
ADD COLUMN IF NOT EXISTS dextro TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.anotacoes.dextro IS 'Glicemia capilar / Dextro em mg/dL (opcional)';
COMMENT ON COLUMN public.anotacoes.fotos IS 'Lista de URLs ou Data URLs de fotos de comprovação anexadas (mudança de decúbito, curativos, etc.) para prova aos familiares e prontuário';
