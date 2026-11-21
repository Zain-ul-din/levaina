-- Long-term memory the coach keeps about each user.
--   kind:   fact = true now (superseded when it changes) | episode = happened on occurred_on
--   status: active | superseded (superseded_by points at the replacement) | forgotten (soft delete)
-- No Postgres enums: kind/category/status are text + CHECK constraints, so adding a value is
-- a drop-and-re-add of the constraint in a migration. Keep lists in sync with lib/memory/types.ts.
-- ids are bigint, not uuid: the model reads and returns them in tool calls, so short is safer.

SET local check_function_bodies = off;

CREATE EXTENSION "moddatetime" SCHEMA "extensions";

CREATE TABLE "public"."memories" (
  "id"            bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id"       uuid                     NOT NULL,
  "kind"          text                     NOT NULL,
  "category"      text                     NOT NULL,
  "content"       text                     NOT NULL,
  "occurred_on"   date,
  "status"        text                     NOT NULL DEFAULT 'active'::text,
  "superseded_by" bigint,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "memories_category_check"
    CHECK
    ((category = ANY (ARRAY['condition'::text, 'doctor_instruction'::text, 'medication'::text, 'goal'::text, 'body_metric'::text, 'symptom'::text, 'food_reaction'::text,
    'preference'::text, 'constraint'::text, 'other'::text]))),
  CONSTRAINT "memories_content_length_check" CHECK (((char_length(content) >= 1) AND (char_length(content) <= 500))),
  CONSTRAINT "memories_kind_check" CHECK ((kind = ANY (ARRAY['fact'::text, 'episode'::text]))),
  CONSTRAINT "memories_occurred_on_check" CHECK (((kind = 'episode'::text) = (occurred_on IS NOT NULL))),
  CONSTRAINT "memories_pkey" PRIMARY KEY (id),
  CONSTRAINT "memories_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'superseded'::text, 'forgotten'::text]))),
  CONSTRAINT "memories_superseded_check" CHECK (((status = 'superseded'::text) = (superseded_by IS NOT NULL)))
);

ALTER TABLE "public"."memories"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."memories"
  ADD CONSTRAINT "memories_superseded_by_fkey" FOREIGN KEY (superseded_by) REFERENCES public.memories(id) ON DELETE SET NULL;

ALTER TABLE "public"."memories"
  ADD CONSTRAINT "memories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX memories_superseded_by_idx ON public.memories USING btree (superseded_by);

CREATE INDEX memories_user_active_idx ON public.memories USING btree (user_id, created_at DESC)
  WHERE (status = 'active'::text);

CREATE TRIGGER memories_set_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE POLICY "Users add their own memories" ON "public"."memories"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users read their own memories" ON "public"."memories"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users update their own memories" ON "public"."memories"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

COMMENT ON EXTENSION "moddatetime" IS 'functions for tracking last modification time';

COMMENT ON TABLE "public"."memories" IS 'Long-term memory the coach keeps about each user.';

REVOKE ALL ON SEQUENCE "public"."memories_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."memories_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."memories_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."memories_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."memories_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."memories_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."memories_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."memories_id_seq" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."memories" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."memories" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."memories" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."memories" TO "service_role";

