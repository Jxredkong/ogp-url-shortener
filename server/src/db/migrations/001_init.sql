CREATE TABLE IF NOT EXISTS links (
  short_code   TEXT        PRIMARY KEY,
  original_url TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  click_count  BIGINT      NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS links_created_at_idx ON links (created_at DESC);
