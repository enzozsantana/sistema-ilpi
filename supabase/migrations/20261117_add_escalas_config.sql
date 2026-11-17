-- Migration: Suporte à configuração de escalas da ILPI e novas escalas clínicas (Katz, Lawton, GDS-15, MEEM, CDR, OHAT)
-- Tabela 'instituicao' recebe a coluna escalas_config para sincronização em nuvem
ALTER TABLE public.instituicao 
ADD COLUMN IF NOT EXISTS escalas_config JSONB DEFAULT NULL;

COMMENT ON COLUMN public.instituicao.escalas_config IS 'Configuração de escalas ativas, escala de dependência padrão (Fugulin vs Katz) e escalas customizadas';
