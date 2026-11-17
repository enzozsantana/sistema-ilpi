-- ==============================================================================
-- Migration: Pedidos Médicos, Solicitação de Exames e Receituário A4
-- Permite emissão, histórico e impressão padronizada no prontuário do residente.
-- ==============================================================================

-- Categoria 'Pedido Médico' adicionada formalmente ao histórico de arquivos do residente
COMMENT ON TABLE public.arquivos IS 'Documentos, laudos, exames anexados e pedidos médicos emitidos no prontuário';

-- Opcional: Tabela dedicada para armazenamento rico de pedidos e laudos se desejado
CREATE TABLE IF NOT EXISTS public.pedidos_medicos (
  id TEXT PRIMARY KEY,
  residente_id TEXT NOT NULL REFERENCES public.residentes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'exames', 'receituario', 'encaminhamento'
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TEXT NOT NULL,
  prescritor JSONB NOT NULL, -- { id, nome, conselho, funcao, cat }
  dados JSONB NOT NULL DEFAULT '{}'::jsonb, -- lista de exames, medicamentos, CID, justificativa
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_medicos_res ON public.pedidos_medicos(residente_id, data DESC);
