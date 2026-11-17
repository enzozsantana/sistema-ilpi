-- ==============================================================================
-- Migration: Cuidados, Prescrição de Enfermagem (Curativos) e Alerta LPP
-- Execute este script no SQL Editor do painel do Supabase se desejar persistência em colunas nativas.
-- O sistema possui fallback inteligente e funciona 100% de imediato.
-- ==============================================================================

ALTER TABLE public.cuidados 
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'geral',
ADD COLUMN IF NOT EXISTS is_lpp BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cobertura TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS localizacao TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS grau_lesao TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS frequencia TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS instrucoes TEXT DEFAULT NULL;

COMMENT ON COLUMN public.cuidados.categoria IS 'Categoria do cuidado: geral, curativo, decubito_lpp, higiene, hidratacao';
COMMENT ON COLUMN public.cuidados.is_lpp IS 'Sinalizador prioritário de Lesão por Pressão ativa (destacado em tom âmbar clínico)';
COMMENT ON COLUMN public.cuidados.cobertura IS 'Tipo de curativo ou cobertura prescrita pela enfermagem (ex: Placa de Hidrocolóide, AGE, Sulfadiazina)';
COMMENT ON COLUMN public.cuidados.localizacao IS 'Localização anatômica da lesão (ex: Região Sacra, Calcâneo)';
COMMENT ON COLUMN public.cuidados.grau_lesao IS 'Estágio da lesão por pressão (Grau 1, 2, 3, 4, Skin Tear)';
COMMENT ON COLUMN public.cuidados.frequencia IS 'Periodicidade de troca da cobertura';
COMMENT ON COLUMN public.cuidados.instrucoes IS 'Passo a passo prescrito para os cuidadores e auxiliares executarem no plantão';
