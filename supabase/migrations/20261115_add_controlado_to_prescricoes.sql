-- Adiciona a coluna 'controlado' na tabela 'prescricoes' (caso ainda não exista)
ALTER TABLE public.prescricoes 
ADD COLUMN IF NOT EXISTS controlado BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.prescricoes.controlado IS 'Identifica se o medicamento é controlado (Portaria SVS/MS 344/98 e atualizações ANVISA)';
