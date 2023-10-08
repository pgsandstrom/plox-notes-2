CREATE TABLE note
(
  id text,
  data jsonb,
    CONSTRAINT note_id_key UNIQUE (id)
)

CREATE TABLE note_meta
(
  id text,
  data jsonb,
    CONSTRAINT note_meta_id_key UNIQUE (id)
)