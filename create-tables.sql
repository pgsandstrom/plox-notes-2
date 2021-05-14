CREATE TABLE public.note
(
  id text,
  data jsonb,
    CONSTRAINT note_id_key UNIQUE (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.note
  OWNER TO postgres;


CREATE TABLE public.note_meta
(
  id text,
  data jsonb,
    CONSTRAINT note_meta_id_key UNIQUE (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.note_meta
  OWNER TO postgres;

