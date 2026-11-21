-- Migration: Módulo de Treinamentos & Educação Permanente (RDC 502/2021 ANVISA)

CREATE TABLE IF NOT EXISTS public.treinamentos_cursos (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'rdc502',
  duracao_estimada TEXT DEFAULT '45 min',
  video_url TEXT,
  obrigatorio BOOLEAN DEFAULT true,
  nota_corte INTEGER DEFAULT 70,
  perguntas_quiz JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.treinamentos_atribuicoes (
  id TEXT PRIMARY KEY,
  curso_id TEXT NOT NULL REFERENCES public.treinamentos_cursos(id) ON DELETE CASCADE,
  curso_titulo TEXT NOT NULL,
  curso_categoria TEXT NOT NULL,
  duracao_estimada TEXT,
  video_url TEXT,
  perguntas_quiz JSONB DEFAULT '[]'::jsonb,
  nota_corte INTEGER DEFAULT 70,
  profissional_id TEXT NOT NULL,
  profissional_nome TEXT NOT NULL,
  profissional_cpf TEXT,
  profissional_cat TEXT NOT NULL,
  prazo DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente | atrasado | concluido
  concluido_em TIMESTAMPTZ,
  nota_obtida INTEGER,
  respostas_quiz JSONB,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atribuicoes_profissional ON public.treinamentos_atribuicoes(profissional_id);
CREATE INDEX IF NOT EXISTS idx_atribuicoes_status ON public.treinamentos_atribuicoes(status);
CREATE INDEX IF NOT EXISTS idx_atribuicoes_prazo ON public.treinamentos_atribuicoes(prazo);

-- Habilitar RLS
ALTER TABLE public.treinamentos_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamentos_atribuicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "treinamentos_cursos_select_all" ON public.treinamentos_cursos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "treinamentos_cursos_modify_gestao" ON public.treinamentos_cursos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "treinamentos_atribuicoes_all" ON public.treinamentos_atribuicoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
