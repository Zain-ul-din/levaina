-- The user's daily log: things that happened at a time (a meal, a symptom, a stool, a weigh-in, a note).
-- Durable facts ("dairy upsets me") live in memories; this table is the timeline the coach reads for patterns.
--   kind:    meal | symptom | stool | weight | note (text + CHECK, no enums; keep in sync with lib/log/types.ts)
--   details: the kind's own fields, validated by the Zod schema for that kind before insert
--   source:  chat (the coach logged it from a message) | tap (the quick-log sheet)
-- ids are bigint, not uuid: the coach sees them in its prompt and passes them back to remove an entry.

CREATE TABLE "public"."log_entries" (
  "id"          bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id"     uuid                     NOT NULL,
  "kind"        text                     NOT NULL,
  "logged_at"   timestamp with time zone NOT NULL,
  "details"     jsonb                    NOT NULL,
  "source"      text                     NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "log_entries_pkey" PRIMARY KEY (id),
  CONSTRAINT "log_entries_kind_check"
    CHECK ((kind = ANY (ARRAY['meal'::text, 'symptom'::text, 'stool'::text, 'weight'::text, 'note'::text]))),
  CONSTRAINT "log_entries_source_check" CHECK ((source = ANY (ARRAY['chat'::text, 'tap'::text]))),
  CONSTRAINT "log_entries_details_check"
    CHECK (((jsonb_typeof(details) = 'object'::text) AND (octet_length(details::text) <= 4000))),
  CONSTRAINT "log_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Every read is "this user's entries in a time range, newest first"; the index also covers the FK.
CREATE INDEX log_entries_user_time_idx ON public.log_entries USING btree (user_id, logged_at DESC);

ALTER TABLE "public"."log_entries" ENABLE ROW LEVEL SECURITY;

-- Entries are added and deleted, never edited (a wrong entry is removed and logged again),
-- so there is no UPDATE policy or grant.
CREATE POLICY "Users read their own log" ON "public"."log_entries"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users add to their own log" ON "public"."log_entries"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users delete from their own log" ON "public"."log_entries"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

REVOKE ALL ON TABLE public.log_entries FROM anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.log_entries TO authenticated;

COMMENT ON TABLE "public"."log_entries" IS 'Timeline of meals, symptoms, stools, weigh-ins and notes; details depend on kind.';
