-- ============================================================
-- ATLAS IMPERIUM — schema base (ponto de partida)
-- Dialeto: PostgreSQL / compatível com Supabase
-- Use quando formos ligar o painel a um banco de verdade.
-- ============================================================

-- ---------- CLIENTES ----------
CREATE TABLE IF NOT EXISTS clientes (
  id          BIGSERIAL PRIMARY KEY,
  nome        TEXT        NOT NULL,
  telefone    TEXT,
  email       TEXT,
  documento   TEXT,                       -- CPF/CNPJ
  observacao  TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- PRODUTOS / ESTOQUE ----------
CREATE TABLE IF NOT EXISTS produtos (
  id            BIGSERIAL PRIMARY KEY,
  categoria     TEXT        NOT NULL CHECK (categoria IN ('notebook','celular','pc','peca','servico')),
  marca         TEXT,
  modelo        TEXT        NOT NULL,
  especificacao TEXT,                     -- ex.: i5 8GB SSD 256
  condicao      TEXT        DEFAULT 'novo' CHECK (condicao IN ('novo','seminovo','usado','defeito')),
  custo         NUMERIC(10,2) DEFAULT 0,
  preco_venda   NUMERIC(10,2) DEFAULT 0,
  preco_revenda NUMERIC(10,2) DEFAULT 0,
  estoque       INTEGER      DEFAULT 0,
  ativo         BOOLEAN      DEFAULT TRUE,
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------- ORDEM DE SERVIÇO ----------
CREATE TABLE IF NOT EXISTS ordens_servico (
  id             BIGSERIAL PRIMARY KEY,
  numero         TEXT UNIQUE NOT NULL,     -- ex.: OS-2026-0001
  cliente_id     BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
  equipamento    TEXT        NOT NULL,
  numero_serie   TEXT,
  defeito        TEXT        NOT NULL,
  diagnostico    TEXT,
  solucao        TEXT,
  status         TEXT        NOT NULL DEFAULT 'aberta'
                 CHECK (status IN ('aberta','orcamento','aprovada','em_reparo','pronta','entregue','cancelada')),
  valor_total    NUMERIC(10,2) DEFAULT 0,
  entrada_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  previsao       DATE,
  entregue_em    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS os_itens (
  id          BIGSERIAL PRIMARY KEY,
  os_id       BIGINT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  descricao   TEXT   NOT NULL,
  quantidade  INTEGER       DEFAULT 1,
  valor_unit  NUMERIC(10,2) DEFAULT 0
);

-- ---------- ORÇAMENTOS ----------
CREATE TABLE IF NOT EXISTS orcamentos (
  id          BIGSERIAL PRIMARY KEY,
  numero      TEXT UNIQUE NOT NULL,        -- ex.: ORC-2026-0001
  cliente_id  BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome TEXT,                       -- cópia, para orçamento avulso
  validade    DATE,
  observacao  TEXT,
  total       NUMERIC(10,2) DEFAULT 0,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orcamento_itens (
  id            BIGSERIAL PRIMARY KEY,
  orcamento_id  BIGINT NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  descricao     TEXT   NOT NULL,
  quantidade    INTEGER       DEFAULT 1,
  valor_unit    NUMERIC(10,2) DEFAULT 0
);

-- ---------- SOFTWARES (aba de downloads) ----------
CREATE TABLE IF NOT EXISTS softwares (
  id         BIGSERIAL PRIMARY KEY,
  nome       TEXT NOT NULL,
  categoria  TEXT,                          -- drivers, diagnóstico, sistema, utilitário
  descricao  TEXT,
  url        TEXT NOT NULL,
  plataforma TEXT DEFAULT 'windows',
  ordem      INTEGER DEFAULT 0
);

-- ---------- OPTIPLEX (configurador) ----------
CREATE TABLE IF NOT EXISTS optiplex_opcoes (
  id        BIGSERIAL PRIMARY KEY,
  grupo     TEXT NOT NULL,                  -- processador, memoria, armazenamento, fonte...
  rotulo    TEXT NOT NULL,                  -- ex.: "16GB DDR4"
  preco     NUMERIC(10,2) DEFAULT 0,
  padrao    BOOLEAN DEFAULT FALSE,
  ordem     INTEGER DEFAULT 0
);

-- ---------- ÍNDICES ----------
CREATE INDEX IF NOT EXISTS idx_os_status     ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_os_cliente    ON ordens_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_prod_cat      ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_soft_cat      ON softwares(categoria);
CREATE INDEX IF NOT EXISTS idx_optiplex_grp  ON optiplex_opcoes(grupo);
